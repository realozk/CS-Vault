import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../contributions/google-apps-script/Code.gs', import.meta.url), 'utf8');
function environment() {
  class Sheet {
    rows = []; fail = false;
    getDataRange() { return { getValues: () => this.rows.map(row => [...row]) }; }
    getLastRow() { return this.rows.length; }
    getMaxRows() { return 1000; }
    getRange(row, _column, height, _width) {
      const self = this;
      return { setNumberFormat() { return this; }, setValues(values) {
        if (self.fail) { self.fail = false; throw new Error('Temporary write failure'); }
        values.forEach((value, i) => { self.rows[row - 1 + i] = [...value]; }); return this;
      }, clearContent() { self.rows.splice(row - 1, height); } };
    }
  }
  const sheets = Object.fromEntries(['Queue','Courses','Routing','Errors'].map(name => [name, new Sheet()]));
  const fields = { course: 1, title: 2, submissionType: 3, correctionUrl: 4, rawLink: 5, contact: 6, uploads: [7] };
  const props = new Map([['ITEM_IDS', JSON.stringify(fields)], ['CATALOG_URL','https://example.com/catalog.json']]);
  const courses = [{ course_key: 'os/2026', name: 'Operating Systems', name_ar: 'نظم التشغيل', subject_code: 'CS3608', year_level: 3, semester: 1 }];
  let responseCode = 200, responseBody = JSON.stringify(courses), held = false, responses = [], choices = [];
  const context = vm.createContext({
    console, Date, Set, Map,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props.get(key), setProperty: (key, value) => props.set(key,value) }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] }), flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(held,false); held = true; }, releaseLock() { held = false; } }) },
    Utilities: { formatDate: date => String(date.getUTCFullYear()) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => responseCode, getContentText: () => responseBody }) },
    FormApp: { openById: () => ({ getResponses: () => responses, getItemById: () => ({asListItem: () => ({setChoiceValues: values => choices = [...values]})}) }) }, Logger: { log() {} },
  });
  vm.runInContext(source, context);
  sheets.Queue.rows = [vm.runInContext('Array.from(QUEUE_HEADERS)', context)];
  sheets.Courses.rows = [vm.runInContext('Array.from(COURSE_HEADERS)', context), Object.values(courses[0])];
  sheets.Routing.rows = [['scope','team'],['year:3','Year 3'],['os/2026','OS specialist team']];
  sheets.Errors.rows = [['recorded_at','form_response_id','error']];
  const response = (id, patch = {}) => ({ getId: () => id, getTimestamp: () => new Date('2026-10-16T12:00:00Z'), getItemResponses: () => Object.entries({ 1:'CS3608 — Operating Systems — Year 3', 2:'Material', 3:'Send original material', 5:'https://example.com/source', ...patch }).map(([itemId, value]) => ({ getItem: () => ({ getId: () => Number(itemId) }), getResponse: () => value })) });
  const row = index => Object.fromEntries(sheets.Queue.rows[0].map((header, i) => [header, sheets.Queue.rows[index][i]]));
  return { context, sheets, props, response, row, courses, setCatalog: (code, body) => { responseCode=code; responseBody=body; }, getChoices: () => choices, setResponses: values => responses=values };
}

test('intake routes by course before year, deduplicates response IDs and preserves reviewer edits', () => {
  const env = environment();
  assert.equal(env.context.importResponse_(env.response('response-a')), true);
  assert.equal(env.row(1).assigned_team, 'OS specialist team');
  assert.equal(env.row(1).submission_id, 'SUB-2026-0001');
  const headers = env.sheets.Queue.rows[0];
  env.sheets.Queue.rows[1][headers.indexOf('assigned_reviewer')] = 'Reviewer A';
  env.sheets.Queue.rows[1][headers.indexOf('status')] = 'Reviewing';
  assert.equal(env.context.importResponse_(env.response('response-a')), false);
  assert.equal(env.sheets.Queue.rows.length, 2);
  assert.equal(env.row(1).assigned_reviewer, 'Reviewer A');
  assert.equal(env.row(1).status, 'Reviewing');
  env.sheets.Routing.rows.pop();
  env.context.importResponse_(env.response('response-b'));
  assert.equal(env.row(2).assigned_team, 'Year 3');
});

test('unknown/ambiguous courses remain in triage and untrusted text cannot become formulas', () => {
  const env = environment();
  env.context.importResponse_(env.response('unknown', {1:'Unknown',2:' =IMPORTXML("https://example.com")',6:'+123',7:['file-id']}));
  const row = env.row(1);
  assert.equal(row.assigned_team, 'General triage');
  assert.equal(row.status, 'Received');
  assert.equal(row.material_title[0], "'"); assert.equal(row.optional_contact[0], "'");
  assert.equal(row.source_links.split('\n')[0], 'https://drive.google.com/open?id=file-id');
  assert.match(row.notes, /Unknown/);
  for (const text of ['=1+1','\t=1+1','+1','-1','@SUM(A1)']) assert.equal(env.context.literalCell_(text)[0], "'");
});

test('failed import records an error and reconciliation recovers without duplicating rows or IDs', () => {
  const env = environment();
  env.sheets.Queue.fail = true;
  const response = env.response('retry');
  assert.throws(() => env.context.importResponse_(response), /Temporary/);
  assert.equal(env.sheets.Errors.rows.length, 2);
  env.setResponses([response, env.response('second')]);
  env.context.reconcileMissingSubmissions();
  env.context.reconcileMissingSubmissions();
  assert.equal(env.sheets.Queue.rows.length, 3);
  assert.notEqual(env.row(1).submission_id, env.row(2).submission_id);
  env.props.delete('SUB_COUNTER_2026');
  env.sheets.Queue.rows.splice(1, 2, ...env.sheets.Queue.rows.slice(1).reverse());
  env.context.importResponse_(env.response('third'));
  assert.equal(env.row(3).submission_id, 'SUB-2026-0004');
});

test('catalog refresh replaces only valid snapshots and retains data on HTTP or schema failure', () => {
  const env = environment(); const original = JSON.stringify(env.sheets.Courses.rows);
  for (const [code, body] of [[500,'error'],[200,'[]'],[200,'{bad'],[200,JSON.stringify([{course_key:'bad'}])]]) {
    env.setCatalog(code,body); assert.throws(() => env.context.refreshCourses());
    assert.equal(JSON.stringify(env.sheets.Courses.rows), original);
  }
  env.setCatalog(200,JSON.stringify(env.courses)); env.context.refreshCourses();
  assert.equal(env.sheets.Courses.rows.length, 2);
});

test('course dropdown uses catalog choices, preserves missing-course triage and updates on command', () => {
  const env = environment();
  env.context.syncCourseDropdown();
  assert.deepEqual(env.getChoices(),['CS3608 — Operating Systems — Year 3','Course missing / Not sure']);
  assert.equal(env.context.resolveCourse_('CS3608 — Operating Systems — Year 3',env.courses).course_key,'os/2026');
  env.context.importResponse_(env.response('not-sure',{1:'Course missing / Not sure'}));
  assert.equal(env.row(1).assigned_team,'General triage');
  const editions = [...env.courses,{...env.courses[0],course_key:'os/2027'}];
  assert.equal(new Set(env.context.courseChoices_(editions)).size,3);
});

test('each correction gets its own record and retains its existing quiz URL', () => {
  const env = environment();
  const patch = {3:'Correct/update existing material',4:'https://realozk.github.io/CS-Vault/os/2026/quiz/chapter-01/'};
  env.context.importResponse_(env.response('correction-one',patch));
  env.context.importResponse_(env.response('correction-two',patch));
  assert.notEqual(env.row(1).submission_id,env.row(2).submission_id);
  assert.equal(env.row(1).existing_quiz_url,patch[4]);
  assert.equal(env.row(2).existing_quiz_url,patch[4]);
});

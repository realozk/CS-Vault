/** CS Vault private intake. Paste into a standalone Apps Script project.
 * Run setupContributionSystem once, then complete the manual checklist in README.
 * No source files, contacts, queue URLs or credentials are exported to the site.
 */
const QUEUE_HEADERS = ['submission_id', 'form_response_id', 'received_at', 'course_key', 'course_entered', 'material_title', 'submission_type', 'original_academic_year', 'source_term', 'source_links', 'existing_quiz_url', 'assigned_team', 'assigned_reviewer', 'status', 'prepared_json_link', 'checked_by', 'notes', 'pull_request_url', 'published_url', 'published_at', 'optional_contact'];
const COURSE_HEADERS = ['course_key', 'name', 'name_ar', 'subject_code', 'year_level', 'semester'];
const STATUSES = ['Received', 'Preparing', 'Reviewing', 'Ready', 'Publishing', 'Published', 'Needs information', 'Duplicate', 'Declined'];
const TYPES = ['Send original material', 'Send prepared JSON', 'Correct/update existing material'];
const UNKNOWN_COURSE = 'Course missing / Not sure';

function setupContributionSystem() {
  if (typeof INITIAL_COURSES === 'undefined') throw new Error('Paste the generated Catalog.gs into this project before setup.');
  validateCourses_(INITIAL_COURSES);
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('FORM_ID') || properties.getProperty('WORKBOOK_ID')) throw new Error('Setup already started. Reuse the existing resources; do not create duplicates.');
  const form = FormApp.create('CS Vault — Contributions / المساهمات', false);
  properties.setProperty('FORM_ID', form.getId());
  // The owner can finish uploads/access configuration before opening intake.
  form.setAcceptingResponses(false).setLimitOneResponsePerUser(false).setAllowResponseEdits(false).setPublishingSummary(false)
    .setConfirmationMessage('Thank you. Your submission will be checked by the course’s review team. It will appear on CS Vault after review and publication.');
  const workbook = SpreadsheetApp.create('CS Vault — Private review queue');
  properties.setProperty('WORKBOOK_ID', workbook.getId());
  const prepared = DriveApp.createFolder('CS Vault — Private prepared JSON and reviewer notes');
  properties.setProperty('PREPARED_FOLDER_ID', prepared.getId());
  [DriveApp.getFileById(form.getId()), DriveApp.getFileById(workbook.getId()), prepared].forEach(resource => resource.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE));
  form.setDestination(FormApp.DestinationType.SPREADSHEET, workbook.getId());
  const text = (title, required) => form.addTextItem().setTitle(title).setRequired(Boolean(required));
  const paragraph = (title, required) => form.addParagraphTextItem().setTitle(title).setRequired(Boolean(required));
  const fields = {};
  fields.course = form.addListItem().setTitle('Course / المادة').setRequired(true).setChoiceValues(courseChoices_(INITIAL_COURSES)).getId();
  fields.title = text('Material title / عنوان المادة', true).getId();
  fields.academicYear = text('Original academic year (or Unknown) / سنة المصدر', false).getId();
  fields.term = text('Original term / فصل المصدر', false).getId();
  fields.contact = text('Optional contact — visible to reviewers / تواصل اختياري يراه المراجعون', false).getId();
  const path = form.addMultipleChoiceItem().setTitle('Submission path / نوع المساهمة').setRequired(true);
  fields.submissionType = path.getId();
  const raw = form.addPageBreakItem().setTitle(TYPES[0]);
  form.addSectionHeaderItem().setTitle('Add original PDF/image upload question here before launch').setHelpText('Owner: add up to 5 files, 10 MB each. Uploads require Google sign-in. A source link may be used for larger files.');
  fields.rawLink = text('Original material source link', false).getId();
  fields.rawDescription = paragraph('Source description', true).getId();
  fields.rawNotes = paragraph('Original material notes', false).getId();
  const preparedSection = form.addPageBreakItem().setTitle(TYPES[1]);
  // A break controls navigation AFTER the preceding section.
  preparedSection.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  form.addSectionHeaderItem().setTitle('Add required prepared JSON upload and optional original source upload here before launch').setHelpText('Owner: JSON must allow any file type. The upload question cannot enforce JSON; reviewers must validate the actual file.');
  fields.preparedLink = text('Prepared quiz original source link', false).getId();
  fields.preparedNotes = paragraph('Uncertain answers and prepared quiz notes', false).getId();
  const correction = form.addPageBreakItem().setTitle(TYPES[2]).setGoToPage(FormApp.PageNavigationType.SUBMIT);
  fields.correctionUrl = text('Existing quiz URL / رابط المحتوى المراد تصحيحه', true)
    .setValidation(FormApp.createTextValidation().requireTextIsUrl().build()).getId();
  fields.correctionQuestion = paragraph('Question number or text', true).getId();
  fields.correctionExplanation = paragraph('Correction explanation and evidence', true).getId();
  fields.correctionLink = text('Correction evidence/source link', false).getId();
  fields.correctionNotes = paragraph('Additional correction notes', false).getId();
  form.addSectionHeaderItem().setTitle('Add optional replacement JSON and source uploads here before launch');
  path.setChoices([path.createChoice(TYPES[0], raw), path.createChoice(TYPES[1], preparedSection), path.createChoice(TYPES[2], correction)]);
  fields.uploads = []; // Populate using listFormItems() AFTER adding the manual upload questions.
  properties.setProperty('ITEM_IDS', JSON.stringify(fields));
  properties.setProperty('CATALOG_URL', 'https://realozk.github.io/CS-Vault/contribution-catalog.json');
  initializeQueue_(workbook);
  storeCourses_(INITIAL_COURSES);
  Logger.log('Resources created. Finish the README checklist, configure ITEM_IDS.uploads and run printPublicConfig. Intake trigger is intentionally not installed yet.');
}

function initializeQueue_(workbook) {
  const make = (name, headers) => {
    const sheet = workbook.getSheetByName(name) || workbook.insertSheet(name);
    writeLiteralRow_(sheet, 1, headers); sheet.setFrozenRows(1); return sheet;
  };
  const queue = make('Queue', QUEUE_HEADERS);
  const statusColumn = QUEUE_HEADERS.indexOf('status') + 1;
  queue.getRange(2, statusColumn, queue.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  queue.getRange(1, 1, queue.getMaxRows(), QUEUE_HEADERS.length).createFilter();
  make('Courses', COURSE_HEADERS);
  const routing = make('Routing', ['scope', 'team', 'coordinator', 'reviewers']);
  [1,2,3,4].forEach((year, i) => writeLiteralRow_(routing, i + 2, [`year:${year}`, `Year ${year} team`, '', '']));
  make('Errors', ['recorded_at', 'form_response_id', 'error']);
  const guide = make('Guide', ['Reviewer guide']);
  const lines = [
    'Contributor sends material; year reviewer prepares/checks; coordinator assigns unclaimed work; publisher publishes approved JSON.',
    'Claim work by entering assigned_reviewer. Course team wins over year team; unknown courses remain in General triage.',
    'Received → Preparing → Reviewing → Ready → Publishing → Published. Prepared JSON can skip Preparing, never Reviewing.',
    'Ready requires a known course, original evidence, validated JSON, checked answers, honest uncertainty, named checker and new/update decision.',
    'Corrections keep filename, publication date and existing question IDs. New questions receive new IDs. Correcting a quiz gets a NEW submission ID.',
    'Duplicate: link original submission in notes. Substantial revision: reviewer decides replacement or separate edition.',
    'Publishing means PR/deployment in progress. Mark Published only after deployment succeeds and the final URL opens. Failed deployment stays Publishing with notes.',
    'Keep original response sheet unchanged. Queue uses physical rows; sort whole rows and never attach editable columns to FILTER/QUERY results.',
    'Create filter views for Years 1–4, unassigned and Ready; views do not restrict row access.',
    'No automatic emails. Contacts, source links and reviewer notes remain private. Verify uploads using a reviewer account and deny unrelated accounts.',
    'Keep manual import available: use a coordinator-generated UUID submission ID, preserve the original response ID if available, and route unknown courses to General triage.',
    'During owner handover, successor recreates and authorizes triggers. Back up queue/source archive each semester.',
  ];
  lines.forEach((line, i) => writeLiteralRow_(guide, i + 2, [line]));
  const unused = workbook.getSheetByName('Sheet1');
  if (unused && unused.getLastRow() === 0) workbook.deleteSheet(unused);
}

function listFormItems() {
  const form = configuredForm_();
  Logger.log(JSON.stringify(form.getItems().map(item => ({ id: item.getId(), type: String(item.getType()), title: item.getTitle() })), null, 2));
}

function printPublicConfig() {
  Logger.log(JSON.stringify({ responderUrl: configuredForm_().getPublishedUrl() }, null, 2));
}

function installIntakeTrigger() {
  const form = configuredForm_(); const ids = itemIds_();
  if (!ids.uploads || !ids.uploads.length) throw new Error('Add upload questions and configure ITEM_IDS.uploads before installing intake.');
  ids.uploads.forEach(id => { const item = form.getItemById(Number(id)); if (!item || String(item.getType()) !== 'FILE_UPLOAD') throw new Error('Invalid upload item ID.'); });
  if (!loadCourses_().length) throw new Error('Import a valid course catalog before installing intake.');
  if (!ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'onContributionSubmit')) {
    ScriptApp.newTrigger('onContributionSubmit').forForm(form).onFormSubmit().create();
  }
}

function onOpen() { FormApp.getUi().createMenu('CS Vault').addItem('Reconcile missing submissions', 'reconcileMissingSubmissions').addItem('Refresh catalog', 'refreshCourses').addItem('Update course dropdown', 'syncCourseDropdown').addToUi(); }
// Standalone project: run commands in the editor. A Form-bound project also has this menu.
function onContributionSubmit(event) { importResponse_(event.response); }
function reconcileMissingSubmissions() {
  const start = Date.now(); let imported = 0, failed = 0;
  for (const response of configuredForm_().getResponses()) {
    if (Date.now() - start > 240000) { Logger.log('Time budget reached; rerun reconciliation to continue safely.'); break; }
    try { if (importResponse_(response)) imported++; } catch (error) { failed++; }
  }
  Logger.log(`Reconciliation: ${imported} imported, ${failed} failed. Review Errors and rerun after repairs.`);
}

function importResponse_(response) {
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    lock.waitLock(30000); acquired = true;
    const queue = workbook_().getSheetByName('Queue');
    const id = response.getId();
    if (!id) throw new Error('Submitted response has no stable ID.');
    const rows = queue.getDataRange().getValues();
    // Validate headers so manual column moves cannot silently corrupt an import.
    if (JSON.stringify(rows[0]) !== JSON.stringify(QUEUE_HEADERS)) throw new Error('Queue headers changed; restore the documented column order.');
    if (rows.slice(1).some(row => String(row[1]) === id)) return false;
    const answers = {};
    response.getItemResponses().forEach(answer => answers[String(answer.getItem().getId())] = answer.getResponse());
    const fields = itemIds_();
    const value = name => String(answers[String(fields[name])] || '').trim();
    const course = resolveCourse_(value('course'), loadCourses_());
    const routing = workbook_().getSheetByName('Routing').getDataRange().getValues().slice(1);
    const route = course && (routing.find(row => row[0] === course.course_key && row[1]) || routing.find(row => row[0] === `year:${course.year_level}` && row[1]));
    const type = value('submissionType');
    const uploadLinks = (fields.uploads || []).flatMap(itemId => {
      const files = answers[String(itemId)];
      return (Array.isArray(files) ? files : files ? [files] : []).map(fileId => `https://drive.google.com/open?id=${encodeURIComponent(fileId)}`);
    });
    const sourceLinks = [...uploadLinks, value('rawLink'), value('preparedLink'), value('correctionLink')].filter(Boolean).join('\n');
    const target = value('correctionUrl');
    const notes = [value('rawDescription'), value('rawNotes'), value('preparedNotes'), value('correctionQuestion'), value('correctionExplanation'), value('correctionNotes')].filter(Boolean);
    if (!course) notes.push('Unknown/ambiguous course: resolve against Courses; retain in General triage.');
    if (!TYPES.includes(type)) notes.push('Unknown submission type; coordinator must resolve.');
    if (type !== TYPES[2] && !sourceLinks) notes.push('No uploads/source links supplied; request evidence.');
    if (type === TYPES[2] && !target) notes.push('Correction target missing; request existing quiz URL.');
    const properties = PropertiesService.getScriptProperties();
    const year = Utilities.formatDate(response.getTimestamp(), 'Asia/Riyadh', 'yyyy');
    const counterKey = `SUB_COUNTER_${year}`;
    const maxStored = rows.slice(1).reduce((max, row) => {
      const match = String(row[0]).match(new RegExp(`^SUB-${year}-(\\d+)$`)); return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const next = Math.max(Number(properties.getProperty(counterKey) || 0), maxStored) + 1;
    properties.setProperty(counterKey, String(next)); // Gaps on failure are safe; IDs are never reused.
    const record = {
      submission_id: `SUB-${year}-${String(next).padStart(4, '0')}`, form_response_id: id,
      received_at: response.getTimestamp().toISOString(), course_key: course ? course.course_key : '', course_entered: value('course'),
      material_title: value('title'), submission_type: type, original_academic_year: value('academicYear'), source_term: value('term'),
      source_links: sourceLinks, existing_quiz_url: target, assigned_team: route ? route[1] : 'General triage', assigned_reviewer: '',
      status: 'Received', notes: notes.join('\n'), optional_contact: value('contact'),
    };
    writeLiteralRow_(queue, queue.getLastRow() + 1, QUEUE_HEADERS.map(header => record[header] || ''));
    SpreadsheetApp.flush();
    return true;
  } catch (error) {
    recordError_(response && response.getId ? response.getId() : '', error);
    throw error;
  } finally { if (acquired) lock.releaseLock(); }
}

function resolveCourse_(input, courses) {
  const normalized = input.trim().toLowerCase();
  const matches = courses.filter(c => [c.course_key, c.subject_code, c.name, c.name_ar,
    courseChoiceLabel_(c, courses), `${c.subject_code} — ${c.name} — ${c.course_key.split('/')[1]} collection [${c.course_key}]`]
    .filter(Boolean).some(alias => String(alias).toLowerCase() === normalized));
  return matches.length === 1 ? matches[0] : null;
}
function refreshCourses() {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const url = PropertiesService.getScriptProperties().getProperty('CATALOG_URL');
    if (!/^https:\/\//.test(url || '')) throw new Error('Configure the public HTTPS catalog URL.');
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) throw new Error('Catalog refresh HTTP failure. Previous snapshot retained.');
    const courses = JSON.parse(response.getContentText());
    validateCourses_(courses); // Never clear the snapshot before validating a replacement.
    storeCourses_(courses);
    // Dropdown changes are a separate manual step: syncCourseDropdown().
  } catch (error) { recordError_('', error); throw error; } finally { lock.releaseLock(); }
}
function courseChoiceLabel_(course, courses) {
  const label = `${course.subject_code} — ${course.name} — Year ${course.year_level}`;
  const editions = courses.filter(c => c.subject_code === course.subject_code && Number(c.year_level) === Number(course.year_level));
  return editions.length > 1 ? `${label} — ${course.course_key.split('/')[1]} collection` : label;
}
function courseChoices_(courses) { return [...courses.map(course => courseChoiceLabel_(course, courses)), UNKNOWN_COURSE]; }
// Run after reviewing the catalog snapshot, normally once per semester.
function syncCourseDropdown() {
  const courses = loadCourses_(); validateCourses_(courses);
  configuredForm_().getItemById(Number(itemIds_().course)).asListItem().setChoiceValues(courseChoices_(courses));
}
function storeCourses_(courses) {
  const sheet = workbook_().getSheetByName('Courses');
  const values = [COURSE_HEADERS, ...courses.map(c => COURSE_HEADERS.map(h => c[h] || ''))];
  const oldRows = sheet.getLastRow();
  sheet.getRange(1, 1, values.length, COURSE_HEADERS.length).setNumberFormat('@').setValues(values.map(row => row.map(literalCell_)));
  if (oldRows > values.length) sheet.getRange(values.length + 1, 1, oldRows - values.length, COURSE_HEADERS.length).clearContent();
}
function validateCourses_(courses) {
  const keys = new Set();
  if (!Array.isArray(courses) || !courses.length) throw new Error('Empty/invalid catalog; previous snapshot retained.');
  courses.forEach(c => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\/\d{4}$/.test(c.course_key || '') || !c.name || !c.subject_code ||
      ![1,2,3,4].includes(Number(c.year_level)) || ![1,2].includes(Number(c.semester)) || keys.has(c.course_key)) throw new Error('Invalid/duplicate catalog course.');
    keys.add(c.course_key);
  });
}
function loadCourses_() {
  const rows = workbook_().getSheetByName('Courses').getDataRange().getValues();
  if (rows.length < 2) return [];
  return rows.slice(1).filter(row => row[0]).map(row => Object.fromEntries(COURSE_HEADERS.map((h, i) => [h, row[i]])));
}
// Prefix potential formulas, including after whitespace/control characters.
function literalCell_(value) { const text = String(value == null ? '' : value); return /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text; }
function writeLiteralRow_(sheet, row, values) {
  if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
  sheet.getRange(row, 1, 1, values.length).setNumberFormat('@').setValues([values.map(literalCell_)]);
}
function recordError_(id, error) {
  // Do not log response contents or optional contact details.
  const sheet = workbook_().getSheetByName('Errors');
  writeLiteralRow_(sheet, sheet.getLastRow() + 1, [new Date().toISOString(), id || '', String(error.message || error)]);
}
function itemIds_() { return JSON.parse(PropertiesService.getScriptProperties().getProperty('ITEM_IDS') || '{}'); }
function workbook_() { return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('WORKBOOK_ID')); }
function configuredForm_() { return FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID')); }

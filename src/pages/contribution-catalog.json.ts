import { courses, courseKey } from '../lib/course-catalog';
export function GET() {
  return new Response(JSON.stringify(courses.map(c => ({
    course_key: courseKey(c), name: c.name, name_ar: c.name_ar,
    subject_code: c.subject_code, year_level: c.year_level, semester: c.semester,
  }))), { headers: { 'Content-Type': 'application/json' } });
}

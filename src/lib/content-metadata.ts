interface CourseMetadata {
  slug: string;
  name: string;
  name_ar?: string;
  subject_code: string;
  year: number;
  year_level: number;
  semester: number;
}

// Accept established names as well as course codes; reject a different course/year.
export function validateContentMetadata(id: string, data: {
  year_level: number; semester: number; subject?: string; subject_code?: string; year?: number;
}, course: CourseMetadata) {
  const [subject, year, ...path] = id.split('/');
  const aliases = [course.slug, course.name, course.name_ar, course.subject_code];
  if (subject !== course.slug || year !== String(course.year) || !path.length ||
      data.year_level !== course.year_level || data.semester !== course.semester ||
      !aliases.includes(data.subject ?? data.subject_code) ||
      (data.year !== undefined && data.year !== course.year)) {
    throw new Error(`Course metadata mismatch: ${id}. Check its subject, year, year_level and semester against src/data/subjects.json.`);
  }
}

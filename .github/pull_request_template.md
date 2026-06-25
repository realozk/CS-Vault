## Description

Please include a summary of the academic content you are adding or updating (e.g. subject, year, chapters covered).

- [ ] New Summary Markdown
- [ ] New Practice Quiz JSON
- [ ] Content Correction

## Checklist

- [ ] I have placed the files in the correct directory format:
  - Markdown files in `src/content/summaries/[subject]/[year]/`
  - JSON files in `src/content/quizzes/[subject]/[year]/`
- [ ] I have verified that all quiz `correctAnswer` strings exactly match one of their respective `options` strings.
- [ ] I have run `npm run build` locally and confirmed that the build completes successfully without Zod schema validation errors.

# Contributing to CS Vaulte

Thank you for contributing to CS Vaulte! This repository is designed to help Computer Science students collaborate and share study summaries and interactive practice quizzes.

To keep the platform reliable, fast, and free, we use a static, type-safe data-loading structure.

---

##  Getting Started

1. **Fork the Repository** on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/CS-Vault.git
   cd CS-Vault
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321` in your browser.

---

##  1. Adding Course Summaries

First register the course in `src/data/subjects.json` with `slug`, `name`,
`year`, `year_level`, and `semester`. The slug/year must match its content
folder. Academic year level and semester must match all content entries.
Catalog entries may exist without material; the dashboard shows an empty state.

Course summaries are written in **Markdown** and located under `src/content/summaries/[subject_code]/[year]/[filename].md`.

- Example Path: `src/content/summaries/cs101/2026/db-basics.md`
- **Frontmatter Requirements:** Every markdown file must begin with frontmatter (metadata) enclosed in `---` lines:

```markdown
---
title: "Introduction to Relational Databases"
description: "A comprehensive summary covering database concepts and Entity-Relationship models."
author: "Your Name"
date: 2026-06-21
subject_code: "CS101"
year_level: 3
semester: 1
lang: "en"
---

# Introduction to Relational Databases
Your content goes here...
```

---

##  2. Adding Practice Quizzes

Quizzes are **JSON** documents located under `src/content/quizzes/[subject_code]/[year]/[filename].json`.

- Example Path: `src/content/quizzes/cs101/2026/db-quiz.json`
- **Zod Schema Requirements:**
  - `title` (String): The title of the quiz.
  - `subject` (String): The human-readable subject name.
  - `year` (Number): The academic year (e.g. `2026`).
  - `questions` (Array):
    - `id` (Number): A unique ID starting at 1.
    - `question` (String): The question text.
    - `code` (String, Optional): A raw code block to display alongside the question.
    - `options` (Array of Strings): At least 2 options.
    - `correctAnswer` (String): **Must exactly match** one of the options.
    - `explanation` (String, Optional): An explanation displayed once the user answers.

### Example Quiz JSON:
```json
{
  "title": "Database Fundamentals",
  "subject": "Introduction to Databases",
  "year": 2026,
  "year_level": 3,
  "semester": 1,
  "lang": "en",
  "questions": [
    {
      "id": 1,
      "question": "Which of the following uniquely identifies a row in a table?",
      "options": [
        "Foreign Key",
        "Primary Key",
        "Index Key",
        "Super Key"
      ],
      "correctAnswer": "Primary Key",
      "explanation": "A Primary Key is a minimal set of attributes that uniquely specifies a tuple in a relation."
    }
  ]
}
```

---

##  3. Verifying Your Changes

Before you commit and open a Pull Request, you **must run a build test**. This ensures TypeScript compiles correctly and Zod validates all your JSON and markdown frontmatter correctly:

```bash
npm run build
```

If the build succeeds without error, your formatting is perfect and ready to be merged!

---

##  4. Proposing Your Changes (Pull Requests)

1. Commit your changes to a new branch:
   ```bash
   git checkout -b feature/add-cs302-notes
   git add .
   git commit -m "Add CS302 Chapter 1 summary and quiz"
   ```
2. Push the branch to your fork:
   ```bash
   git push origin feature/add-cs302-notes
   ```
3. Open a **Pull Request** on GitHub against the main repository.
4. Once you open the PR, our automated GitHub Action will run the build tests. If they pass, the maintainer will review and merge it.

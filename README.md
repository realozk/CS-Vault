# CS Vaulte

CS Vaulte is a static, serverless educational repository for Computer Science university courses. It hosts student-focused subject summaries and interactive self-assessment practice quizzes.

## Key Features

- **Static Site Generation:** Pre-rendered HTML paths built at compilation time using Astro.
- **Client-Side Island Architecture:** Framework-free client components yielding zero client-side JavaScript framework overhead.
- **Content Collections Data Layer:** Type-safe structured content validated via Zod schemas at build time.
- **Minimalist Theme Support:** Responsive, clean dark and light UI theme system.

---

## Project Structure

Inside the repository, files are organized as follows:

```text
/
├── public/                 # Static assets (favicons, manifests)
├── src/
│   ├── content/            # Git-based content collections (JSON/Markdown)
│   │   ├── summaries/      # Subject markdown summary documents (e.g., cs101/2026/db-basics.md)
│   │   └── quizzes/        # Subject quiz data files (e.g., cs101/2026/db-quiz.json)
│   ├── components/         # Reusable UI widgets (e.g., QuizWidget.astro)
│   ├── layouts/            # Global page shell wrappers (e.g., Layout.astro)
│   ├── pages/              # Routing modules (Home, course dashboards, quiz routes)
│   └── styles/             # Global Tailwind stylesheets
├── package.json            # Project dependencies and script declarations
├── tsconfig.json           # TypeScript configuration settings
└── astro.config.mjs        # Astro engine configurations
```

---

## Adding Course Content

Data is entirely file-based and loaded dynamically through Astro Content Collections:

### 1. Subject Summaries
Summaries are written in Markdown and located under `src/content/summaries/[subject]/[year]/[filename].md`. Each file must declare frontmatter metadata:

```markdown
---
title: "Introduction to Relational Databases"
description: "A comprehensive summary covering database concepts and Entity-Relationship models."
author: "Author Name"
date: 2026-06-21
subject_code: "CS101"
---

# Introduction to Relational Databases
Content markdown goes here...
```

### 2. Practice Quizzes
Quizzes are structured JSON documents located under `src/content/quizzes/[subject]/[year]/[filename].json`. The schema enforces strict validation:

```json
{
  "title": "Relational Databases Fundamentals",
  "subject": "Introduction to Databases",
  "year": 2026,
  "questions": [
    {
      "id": 1,
      "question": "Which of the following uniquely identifies a row in a relational database table?",
      "code": "Optional raw code snippet block if required",
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

## Development Commands

All commands should be executed from the root directory:

| Command | Action |
| :--- | :--- |
| `npm install` | Install project dependencies |
| `npm run dev` | Start the local development server at `localhost:4321` |
| `npm run build` | Build the optimized production bundle to the `./dist/` directory |
| `npm run preview` | Run a local preview server on the production build output |

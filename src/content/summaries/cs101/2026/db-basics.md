---
title: "Introduction to Relational Databases"
description: "A comprehensive summary covering core database concepts, entity-relationship models, and basic SQL query structure for Computer Science students."
author: "Dr. Sarah Jenkins"
date: 2026-06-21
subject_code: "CS101"
year_level: 1
semester: 2
---

# Introduction to Relational Databases

A **Database Management System (DBMS)** is software designed to store, retrieve, and manage data. The most common type is the **Relational Database Management System (RDBMS)**, which organizes data into tables (relations) consisting of rows (tuples) and columns (attributes).

---

## 1. Key Database Concepts

*   **Table (Relation):** A structured set of data consisting of rows and columns.
*   **Row (Tuple):** A single record in a table.
*   **Column (Attribute):** A field representing a specific property of the data.
*   **Primary Key (PK):** A column (or set of columns) that uniquely identifies each row in a table. Primary keys must be unique and cannot contain NULL values.
*   **Foreign Key (FK):** A column that establishes a link between data in two tables, representing a relationship.

---

## 2. Entity-Relationship Model (ERM)

The ER Model is a conceptual blueprint used to design databases. It consists of:

1.  **Entities:** Real-world objects (e.g., *Student*, *Course*).
2.  **Attributes:** Properties of entities (e.g., *StudentID*, *StudentName*).
3.  **Relationships:** Associations between entities (e.g., *Student* enrolls in *Course*).

### Cardinatlity Types
*   **One-to-One (1:1):** Each record in Table A relates to one record in Table B.
*   **One-to-Many (1:M):** A single record in Table A relates to multiple records in Table B.
*   **Many-to-Many (M:N):** Multiple records in Table A relate to multiple records in Table B (requires a junction/bridge table).

---

## 3. Basic SQL Queries

Structured Query Language (SQL) is the standard language for relational databases.

### Selecting Data
```sql
SELECT student_name, email 
FROM students 
WHERE major = 'Computer Science' 
ORDER BY enrollment_date DESC;
```

### Joining Tables
```sql
SELECT students.student_name, courses.course_name
FROM students
INNER JOIN enrollments ON students.student_id = enrollments.student_id
INNER JOIN courses ON enrollments.course_id = courses.course_id;
```

> [!NOTE]
> SQL keywords (like `SELECT`, `FROM`, `WHERE`) are case-insensitive, but writing them in uppercase is a widely accepted best practice for readability.

---
title: "Lecture 1 — Midterm Revision Guide"
description: "Lecture 1 scope, key distinctions, and how to use the three practice exams."
author: "CS-Vault Study Notes"
date: 2026-10-07
subject_code: "Programming Languages"
year_level: 3
semester: 1
lang: "en"
---

## Your midterm scope

**Third year, first semester. Lecture 1 only:** *Preliminaries to the Concepts of Programming Languages*. These notes and the three practice exams are original study aids based on `Lecture01-Single-Slide-Handout.pdf`, not official exam questions or an instructor-approved answer key. Check the referenced slides when reviewing an answer.

## A practical study routine

1. Read the handout, then take **Exam A: Foundations** without notes.
2. Review each explanation and its slide reference, especially incorrect answers.
3. Take **Exam B: Applications** to practice recognizing concepts in scenarios.
4. Finish with **Exam C: Mixed Review**, then explain your mistakes in your own words.

Each exam has **20 distinct multiple-choice questions**. Questions and options shuffle on each attempt. Choose **Practice** for immediate feedback without a time limit, or **Exam mode** to reveal answers after submission. The optional exam timer defaults to 20 minutes; this is a practice setting, not an official midterm duration. You can change it or turn it off.

After each attempt, review missed answers and source slides, then check the topic results. A **short revision session** uses up to five saved mistakes from the current exam. Suggestions are scheduled for tomorrow and then after successful reviews three and seven days later. Practicing early does not advance the schedule. Three correct reviews at their scheduled times clear a question from the saved list.

Saved mistakes stay in this browser on this device and are shared between the English and Arabic interface for the same exam. Other devices do not receive them. The clear-review control removes this exam's saved list.

## Reasons and application domains — slides 3–5

Studying language concepts helps you express ideas, choose suitable languages, learn unfamiliar languages, understand implementation, and use known languages better.

| Domain | Typical concern | Lecture examples |
| --- | --- | --- |
| Scientific | Numerical work, floating-point values, arrays | Fortran |
| Business | Reports, decimal values, character data | COBOL |
| AI | Symbolic processing, linked lists | LISP, Scheme, Prolog, Python |
| Systems | Efficiency in continuously used software | C, C++ |
| Web | A mixture of markup, scripting, and general-purpose tools | HTML, PHP, Java |

## Evaluation criteria — slides 6–12

- **Readability:** understanding programs. Simplicity, consistent combinations of features (orthogonality), suitable data types, and meaningful syntax help. Feature multiplicity and extensive operator overloading can complicate reading.
- **Writability:** expressing programs. Abstraction hides implementation details; expressivity gives convenient ways to specify operations.
- **Reliability:** meeting specifications. Type checking and exception handling help. Aliasing means multiple references to one memory location and can make effects harder to track.
- **Cost:** consider training, writing, executing, failures, and maintenance together. Readability matters when modifying existing code.
- **Portability:** moving between implementations; standardization helps.
- **Generality:** suitability across application areas.
- **Well-definedness:** a complete, precise official language definition.

## Architecture, methodologies, and categories — slides 13–18

In the lecture's von Neumann model, memory holds both instructions and data separately from the CPU. Variables correspond to memory cells; assignments model moving values; iteration fits this architecture. The fetch-execute cycle is **fetch → increment the program counter → decode → execute**, after initialization.

Methodologies shifted from machine efficiency toward people efficiency and structured programming, then data abstraction, then object orientation with inheritance and polymorphism.

| Category | Main idea | Examples |
| --- | --- | --- |
| Imperative | Variables, assignment, iteration | C, Java, JavaScript |
| Functional | Applying functions to arguments | LISP, Scheme, ML, F# |
| Logic | Rules | Prolog |
| Markup/programming hybrid | Programming extensions to markup | JSTL, XSLT |

Object orientation can coexist with imperative programming. A language category and an implementation method are different concepts.

## Trade-offs — slide 19

Java bounds checks illustrate reliability versus execution cost. APL's compact operators illustrate writability versus readability. C++ pointers illustrate flexibility versus reliability. No single criterion automatically wins every design decision.

## Implementation and tools — slides 20–32

**Compilation** translates source into machine code. The main phase order is lexical analysis (tokens), syntax analysis (parse trees), semantic analysis and intermediate-code work, then code generation. Linking combines needed program units; an executable image includes user and system code.

**Pure interpretation** executes through an interpreter without a separate compiled machine-code program. **Hybrid implementation** translates to an intermediate form and interprets it. Early Java used bytecode with a JVM. **JIT** compiles intermediate subprograms when called and retains the resulting machine code for reuse.

The **von Neumann bottleneck** concerns transfers between memory and processor. A **preprocessor** expands directives such as C includes and macros before compilation. A **programming environment** is a development tool collection, such as UNIX tools, Visual Studio .NET, or NetBeans.

The handout contains historical language examples and performance comparisons. Learn its conceptual distinctions without treating historical rankings or speed ratios as universal facts about current implementations.

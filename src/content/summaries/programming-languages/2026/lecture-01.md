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

A separate **Languages PDF Exam** contains 20 Lecture 1 questions adapted from the uploaded quiz/midterm collection in `languages.pdf`. It is labelled as collected material, not a confirmed exam prediction. Questions about grammar and variable binding in that PDF are outside the confirmed Lecture 1 scope and are omitted.

## A practical study routine

1. Read the handout, then take **Exam A: Foundations** without notes.
2. Review each explanation and its slide reference, especially incorrect answers.
3. Take **Exam B: Applications** to practice recognizing concepts in scenarios.
4. Finish with **Exam C: Mixed Review**, then explain your mistakes in your own words.

Each exam has **20 distinct multiple-choice questions**. Questions and options shuffle on each attempt. Choose **Practice** for immediate feedback without a time limit, or **Exam mode** to reveal answers after submission. The optional exam timer defaults to 20 minutes; this is a practice setting, not an official midterm duration. You can change it or turn it off.

After each attempt, review missed answers and source slides, then check the topic results. You can retry up to five missed questions from your current attempt.

## Reasons and application domains — slides 3–5

Studying language concepts helps you express ideas, choose suitable languages, learn unfamiliar languages, understand implementation, and use known languages better.

<table style="width: 100%; border-collapse: collapse; margin: 1.25rem 0; line-height: 1.6;">
  <thead>
    <tr>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Domain</th>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Typical concern</th>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Lecture examples</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Scientific</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Numerical work, floating-point values, and arrays</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Fortran</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Business</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Reports, decimal values, and character data</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">COBOL</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">AI</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Symbolic processing and linked lists</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">LISP, Scheme, Prolog, and Python</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Systems</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Efficiency in continuously used software</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">C and C++</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Web</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">A mixture of markup, scripting, and general-purpose tools</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">HTML, PHP, and Java</td>
    </tr>
  </tbody>
</table>

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

<table style="width: 100%; border-collapse: collapse; margin: 1.25rem 0; line-height: 1.6;">
  <thead>
    <tr>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Category</th>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Main idea</th>
      <th style="padding: 0.75rem; border: 1px solid #52525b; text-align: left;">Examples</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Imperative</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Variables, assignment, and iteration</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">C, Java, and JavaScript</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Functional</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Applying functions to arguments</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">LISP, Scheme, ML, and F#</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Logic</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Rules</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Prolog</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Markup/programming hybrid</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">Programming extensions to markup</td>
      <td style="padding: 0.75rem; border: 1px solid #52525b;">JSTL and XSLT</td>
    </tr>
  </tbody>
</table>

Object orientation can coexist with imperative programming. A language category and an implementation method are different concepts.

## Trade-offs — slide 19

Java bounds checks illustrate reliability versus execution cost. APL's compact operators illustrate writability versus readability. C++ pointers illustrate flexibility versus reliability. No single criterion automatically wins every design decision.

## Implementation and tools — slides 20–32

**Compilation** translates source into machine code. The main phase order is lexical analysis (tokens), syntax analysis (parse trees), semantic analysis and intermediate-code work, then code generation. Linking combines needed program units; an executable image includes user and system code.

**Pure interpretation** executes through an interpreter without a separate compiled machine-code program. **Hybrid implementation** translates to an intermediate form and interprets it. Early Java used bytecode with a JVM. **JIT** compiles intermediate subprograms when called and retains the resulting machine code for reuse.

The **von Neumann bottleneck** concerns transfers between memory and processor. A **preprocessor** expands directives such as C includes and macros before compilation. A **programming environment** is a development tool collection, such as UNIX tools, Visual Studio .NET, or NetBeans.

The handout contains historical language examples and performance comparisons. Learn its conceptual distinctions without treating historical rankings or speed ratios as universal facts about current implementations.

The separate **Lecture 1 — Instructor Tutorial** contains all 29 questions and
marked answers from the Blackboard tutorial. Its red label identifies instructor
material. Question 22 preserves the supplied key and includes a clarification note.

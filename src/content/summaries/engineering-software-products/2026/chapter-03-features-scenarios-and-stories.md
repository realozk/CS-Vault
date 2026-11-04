---
title: "Chapter 3 — Features, Scenarios, and Stories"
description: "Software features, user personas, scenarios, user stories, epics, feature identification, design trade-offs, and feature creep."
author: "CS-Vault Study Notes"
date: 2026-11-04
subject_code: "CS3809"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 3: Features, Scenarios, and Stories - Detailed Summary

## Software Features (Slides 2-8)
*   **Design Drivers:** Unmet consumer needs, dissatisfaction with existing products, and technological changes.
*   **Features:** A fragment of functionality (e.g., "print feature"). Feature design uses a standard template: Input, Activation, Action, and Output.

## Personas (Slides 9-20)
*   **Personas:** Imagined character portraits of typical product users, used to help the development team empathize and avoid designing over-complicated features based on their own biases.
*   **Elements:** 
    *   *Personalization:* Name, photo, background.
    *   *Job-related:* Job details (especially for business products).
    *   *Education:* Educational background and technical skill level.
    *   *Relevance:* Why they are interested in the product.
*   *Proto-personas* are created rapidly from limited team knowledge when extensive user research isn't possible.

## Scenarios (Slides 21-36)
*   **Scenarios:** A narrative describing a situation where a user (persona) uses the product to achieve an objective. They read naturally and are excellent for communicating with real users.
*   **Elements:** Scenario name, overall objective, personas involved, what's involved in reaching the objective, problems with the existing system, and proposed solutions.
*   *Perspective:* Scenarios should always be written from the user's perspective, not the system's.

## User Stories (Slides 37-45)
*   **User Stories:** Finer-grain, structured narratives focusing on a single need.
*   **Format:** "As a `<role>`, I `<want | need>` to `<do something>` [so that `<reason>`]."
*   **Epics:** Complex features that will take multiple sprints to implement and must be broken down into smaller stories.
*   *Comparison:* Scenarios are natural and provide rich context; Stories are structured, specific, and excellent for sprint planning/backlogs.

## Feature Identification and Design (Slides 46-56)
*   **Guidelines:** Features should be *Independent* (don't rely on activation order), *Coherent* (do exactly one thing without side effects), and *Relevant* (support normal user tasks).
*   **Design Knowledge Base:** User knowledge, product knowledge, domain knowledge, and technology knowledge.
*   **Feature Trade-offs:** Simplicity vs. Functionality, Familiarity vs. Novelty, Automation vs. Control.
*   **Feature Creep:** Adding too many features based on user requests, which bloats the software. Avoided by asking if a feature adds real value, is generally useful, or can be implemented by extending an existing feature.

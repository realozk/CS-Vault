---
title: "Chapter 2 — Agile Software Engineering"
description: "Agile vs. plan-driven development, the Agile Manifesto, incremental development, Extreme Programming (XP), Scrum roles, backlogs, estimation, and sprints."
author: "CS-Vault Study Notes"
date: 2026-11-04
subject_code: "CS3809"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 2: Agile Software Engineering - Detailed Summary

## Agile vs. Plan-Driven Development (Slides 2-6)
*   **Plan-driven:** Designed for large, long-lifetime systems (e.g., aircraft control). Highly rigorous, document-heavy, and bureaucratic. 
*   **Agile:** Evolved in the 1990s to support rapid development. Focuses on working software, iterative increments, reducing overhead, and responding to change.
*   **Agile Manifesto:** Values individuals and interactions over processes/tools; working software over comprehensive documentation; customer collaboration over contracts; responding to change over following a plan.

## Incremental Development & XP (Slides 7-17)
*   **Incremental Development:** Define a feature, implement it, deliver it, get user feedback, and then move to the next.
*   **Extreme Programming (XP):** Coined by Kent Beck in 1998. Pushed recognized good practices to "extreme" levels.
*   **Key XP Practices:** Incremental planning (user stories), small releases, test-driven development (writing automated tests *before* code), continuous integration (merging and testing code immediately), and refactoring (improving code structure continuously).

## The Scrum Framework (Slides 18-29)
*   **Scrum:** An agile framework focusing on project organization and planning (does *not* mandate specific technical practices like XP does).
*   **Terminology:** 
    *   *Product Owner:* Identifies features, reviews work. (Usually the Product Manager in product development).
    *   *ScrumMaster:* A coach who guides the team in Scrum usage.
    *   *Development Team:* Self-organizing group of 5-8 people.
    *   *Sprint:* Fixed-length period (2-4 weeks) yielding a "potentially shippable product increment".
    *   *Scrum:* A daily review meeting.
    *   *Velocity:* Estimate of how much work a team can do in one sprint.
*   **Product Backlog:** Prioritized list of items (PBIs) like features, bugs, engineering improvements. States include: Ready for consideration, Ready for refinement, and Ready for implementation.

## Planning, Estimating, and Sprint Activities (Slides 30-57)
*   **Estimation:** PBIs are estimated using *Effort required* (person-hours/days) or *Story points* (relative estimates based on a baseline task's size and complexity).
*   **Timeboxed Sprints:** Sprints stop on the end date regardless of completion. Unfinished items return to the backlog.
*   **Sprint Activities:** 
    *   *Sprint Planning:* Establishing a goal and selecting PBIs to create a sprint backlog.
    *   *Execution:* Implementing PBIs with continuous integration and test automation.
    *   *Sprint Review:* Reviewing met goals and reflecting on team process (Retrospective).
*   **External Interactions:** To prevent distractions, the ScrumMaster handles team-focused external interactions, while the Product Owner handles product-focused external interactions.

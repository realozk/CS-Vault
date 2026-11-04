---
title: "Chapter 4 — Software Architecture"
description: "Architectural organization, non-functional properties, design trade-offs, layered, client-server, MVC, and SOA patterns, and technology choices."
author: "CS-Vault Study Notes"
date: 2026-11-04
subject_code: "CS3809"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 4: Software Architecture - Detailed Summary

## Importance of Software Architecture (Slides 2-13)
*   **Definition:** Architecture is the fundamental organization of a system's components, their relationships, and guiding design principles.
*   **Significance:** It heavily influences non-functional properties like *responsiveness, reliability, availability, security, usability, maintainability*, and *resilience*.
*   **Security Architecture:** 
    *   *Centralized:* Easier to build, faster access, but a single breach compromises everything.
    *   *Distributed:* Harder to build and access, but limits data loss during a breach.
*   **Performance vs. Maintainability:** A shared DB architecture is faster but harder to maintain. A multiple DB architecture (where components have local copies) is highly maintainable but requires reconciliation mechanisms, slowing performance.

## Design Guidelines & Trade-offs (Slides 16-26)
*   **Key Trade-offs:**
    *   *Security vs. Usability:* Adding layered security (authentication, encryption) makes systems secure but frustrates users (slow interactions, multiple passwords).
    *   *Availability vs. Time-to-market:* High availability (24/7 uptime) requires redundant components, sensors, and switches, which increases complexity, development time, and cost.
*   **Complexity Guidelines:** Localize relationships, reduce shared dependencies, and separate concerns.

## Architectural Patterns (Slides 28-54)
*   **Layered Architecture:** Organizes concerns into isolated layers (e.g., UI > UI Management > Basic Services > Database). Prevents functional duplication.
*   **Cross-cutting Concerns:** Systemic issues (like security, performance, and reliability) that affect *all* layers. 
*   **Client-Server:** The UI runs on the client device, while logic and data run on server computers. Usually communicates via HTTP using XML or JSON.
*   **Model-View-Controller (MVC):** The Controller handles input, the View displays UI, and the Model manages data logic.
*   **Service-Oriented Architecture (SOA):** Built of *stateless* services that can migrate between servers. Highly resilient and easily scalable.

## Technology Choices (Slides 55-68)
*   **Database:** *Relational SQL* (best for structured tables, transaction management) vs. *NoSQL* (best for flexible, hierarchical big data analysis).
*   **Delivery Platform:** Mobile apps face constraints like intermittent connectivity, low processing power, battery drain, and poor keyboards.
*   **Servers:** Cloud vs. In-house servers.
*   **Open Source:** Saves time/money but introduces dependencies and license constraints.

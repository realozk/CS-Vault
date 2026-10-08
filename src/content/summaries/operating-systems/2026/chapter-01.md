---
title: "Lecture 1 — Introduction"
description: "OS roles, interrupts, storage, scheduling, and dual-mode execution."
author: "CS-Vault Study Notes"
date: 2026-10-08
subject_code: "Operating Systems"
year_level: 3
semester: 1
lang: "en"
---

## Chapter 1 scope

Based on PDF pages **2–17** of `Chapter1_And_2 (1).pdf`. Use the Chapter 1 practice quiz first, then the mixed review after Chapter 2. These notes and questions are AI-assisted study aids, not an official quiz or answer key.

- The OS coordinates hardware use among applications and users. The kernel is the core; system programs are separate.
- A **controller** is hardware; a **driver** is OS software providing a uniform device interface.
- Interrupts transfer execution to a handler. Saving registers and the program counter allows interrupted work to resume.
- Caching copies data to faster storage. DMA transfers blocks without CPU involvement for every byte.
- Multiprogramming keeps jobs available when another waits; time sharing adds frequent switching for interaction.
- In the slides' model, **user mode = 1**, **kernel mode = 0**. Privileged instructions require kernel mode.
- A timer interrupt lets the OS regain control of the CPU.

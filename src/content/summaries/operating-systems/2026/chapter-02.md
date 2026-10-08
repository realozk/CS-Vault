---
title: "Lecture 2 — Services and Structures"
description: "OS services, system calls, APIs, and kernel structures."
author: "CS-Vault Study Notes"
date: 2026-10-08
subject_code: "Operating Systems"
year_level: 3
semester: 1
lang: "en"
---

## Chapter 2 scope

Based on PDF pages **18–39** of `Chapter1_And_2 (1).pdf`. Take the Chapter 2 practice quiz, then the mixed review covering both chapters.

- Services include program execution, I/O, files, communication, error detection, allocation, logging, and protection.
- **System calls** request OS services; **APIs** simplify interfaces and support portability.
- Parameters may use registers, a memory block with its address in a register, or a stack.
- In the FreeBSD example, **fork()** creates a process; **exec()** loads a program into a process.
- Monolithic kernels group functionality in one address space. Layers use lower-level services.
- Microkernels move nonessential services into user space and use message passing, with communication overhead.
- Loadable modules add kernel components as needed. Hybrid systems combine approaches.

These notes and questions are AI-assisted practice, not an official quiz or answer key. Check the source pages when reviewing mistakes.

---
title: "Chapter 4 — Threads & Concurrency"
description: "Threads concept, multicore programming, concurrency vs. parallelism, user and kernel threads, multithreading models, thread libraries, and Java threads."
author: "CS-Vault Study Notes"
date: 2026-10-30
subject_code: "Operating Systems"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 4: Threads & Concurrency (Detailed Summary)

## 1. Threads Concept and Motivation (Slide 4 - 7)
In traditional operating systems, a process has a single thread of control. However, most modern applications are multithreaded, meaning a single process can contain multiple threads of control.
*   **What is a Thread?** A thread is a basic unit of CPU utilization. It contains its own:
    *   Thread ID
    *   Program Counter (PC)
    *   Register set
    *   Stack
*   **What is Shared?** Threads belonging to the same process share the process's:
    *   Code section
    *   Data section
    *   OS resources (like open files)
*   **Motivation:** Creating a new process is "heavyweight" (resource-intensive), while creating a thread is "lightweight." Multithreading simplifies code, increases efficiency, and allows applications to remain responsive (e.g., a web server can spawn a new thread for every client request instead of a full process).

## 2. Multicore Programming (Slide 9 - 11)
The shift from single-CPU to multi-CPU and multicore systems has put pressure on programmers to utilize parallel processing. 
*   **Challenges of Multicore Programming:**
    1.  **Dividing activities:** Finding tasks that can run concurrently.
    2.  **Balance:** Ensuring parallel tasks do equal amounts of work.
    3.  **Data splitting:** Dividing data appropriately across separate cores.
    4.  **Data dependency:** Synchronizing execution when tasks depend on shared data.
    5.  **Testing and debugging:** Much more difficult due to multiple execution paths.
*   **Concurrency vs. Parallelism:**
    *   *Concurrency:* The system supports more than one task *making progress*. This can happen on a single processor via scheduling (time-slicing).
    *   *Parallelism:* The system performs more than one task *simultaneously* (requires multiple cores).
*   **Types of Parallelism:**
    *   *Data Parallelism:* Distributing subsets of the same data across multiple cores, performing the *same operation* on each subset.
    *   *Task Parallelism:* Distributing different *threads (tasks)* across cores, where each thread performs a *unique operation*.

## 3. User Threads vs. Kernel Threads (Slide 12 - 13)
*   **User Threads:** Thread management is done by a user-level threads library. The kernel is unaware of these threads and manages them as a single process. They are fast to create and manage. (Examples: POSIX Pthreads, Windows threads, Java threads).
*   **Kernel Threads:** Also called Lightweight Processes (LWP). These are supported and managed directly by the OS kernel. They are more expensive to create than user threads but allow the OS to schedule individual threads onto multiple processors. (Examples: Windows, Linux, macOS).

## 4. Multithreading Models (Slide 14 - 19)
A relationship must exist between user threads and kernel threads. There are three common models:
1.  **Many-to-One Model:** 
    *   Many user-level threads map to a single kernel thread.
    *   *Drawback:* If one thread makes a blocking system call, the entire process blocks. Also, multiple threads cannot run in parallel on a multicore system because only one kernel thread exists for the process. (Rarely used today).
2.  **One-to-One Model:**
    *   Each user-level thread maps directly to its own kernel thread.
    *   *Advantage:* Provides high concurrency; another thread can run if one blocks. Allows true parallelism on multiprocessors.
    *   *Drawback:* Creating a user thread requires creating a kernel thread, creating overhead. The number of threads per process may be restricted. (Used by Windows and Linux).
3.  **Many-to-Many Model:**
    *   Many user-level threads are multiplexed to a smaller or equal number of kernel threads.
    *   *Advantage:* Developers can create as many user threads as they want, and the kernel threads can run in parallel. It overcomes the blocking issue of Many-to-One and the thread-count limits of One-to-One.

## 5. Thread Libraries and Java Threads (Slide 20 - 24)
A Thread Library provides the programmer with an API for creating and managing threads. It can be implemented entirely in user space (local function calls) or as a kernel-level library (system calls).
*   **Java Threads:** Java threads are managed by the Java Virtual Machine (JVM). Because the JVM runs on top of a host OS, Java threads are typically implemented using the underlying OS's thread model (e.g., Windows API on Windows, Pthreads on Linux).
*   **Creating Java Threads:**
    *   Can be done by extending the `Thread` class.
    *   Standard practice is implementing the `Runnable` interface (which requires overriding the `run()` method).
*   **Execution and Waiting:**
    *   `worker.start()`: Begins execution of the thread.
    *   `worker.join()`: Forces the main thread to wait until the worker thread has completed its execution. This is critical for data dependency—if `join()` is omitted, the main program might attempt to print a result before the worker thread has finished calculating it.

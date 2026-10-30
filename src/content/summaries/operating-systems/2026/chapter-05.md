---
title: "Chapter 5 — CPU Scheduling"
description: "CPU-I/O burst cycle, CPU scheduler, preemptive vs. nonpreemptive scheduling, dispatcher, scheduling criteria, FCFS, SJF, SRTF, Round Robin, Priority, and multilevel queues."
author: "CS-Vault Study Notes"
date: 2026-10-30
subject_code: "Operating Systems"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 5: CPU Scheduling (Detailed Summary)

## 1. Basic Concepts (Slide 4 - 5)
*   **CPU-I/O Burst Cycle:** Process execution consists of an alternating cycle of CPU execution (CPU burst) and I/O wait (I/O burst). Processes alternate between doing computational work and waiting for I/O operations to complete.
*   **Histogram of Burst Times:** The distribution of CPU burst durations is of major concern for scheduling. Extensive studies show that there is a very large number of short CPU bursts and a very small number of long CPU bursts. 

## 2. The CPU Scheduler and Dispatcher (Slide 6 - 10)
*   **CPU Scheduler:** Selects a process from the ready queue and allocates a CPU core to it. Scheduling decisions take place when a process:
    1. Switches from running to waiting (e.g., I/O request).
    2. Switches from running to ready (e.g., interrupted).
    3. Switches from waiting to ready (e.g., I/O completion).
    4. Terminates.
*   **Preemptive vs. Non-preemptive Scheduling:**
    *   *Non-preemptive:* The process holds the CPU until it voluntarily releases it (terminates or waits). Solves race conditions but can cause long wait times.
    *   *Preemptive:* The OS can interrupt a running process and take the CPU away. Used by almost all modern OSs. *Risk:* Can cause race conditions when processes share data.
*   **Dispatcher:** The module that actually gives control of the CPU to the process selected by the scheduler. It involves:
    *   Switching context (saving state to PCB, restoring new state).
    *   Switching to user mode.
    *   Jumping to the proper location in the program to restart it.
    *   *Dispatch Latency:* The time it takes the dispatcher to stop one process and start another.

## 3. Scheduling Criteria (Slide 11 - 12)
Algorithms are evaluated based on several metrics:
*   **CPU utilization:** Keep the CPU as busy as possible (Maximize).
*   **Throughput:** Number of processes completed per time unit (Maximize).
*   **Turnaround time:** Total time from submission to completion of a process (Minimize).
*   **Waiting time:** Total time a process spends waiting in the ready queue (Minimize).
*   **Response time:** Time from submission of a request until the first response is produced (Minimize).

## 4. Scheduling Algorithms (Slide 13 - 27)
*   **First-Come, First-Served (FCFS):** Processes are scheduled in the order they arrive.
    *   *Pros:* Simple to implement.
    *   *Cons:* Can lead to the **Convoy Effect**, where short I/O-bound processes get stuck waiting behind a long CPU-bound process, resulting in high average waiting times.
*   **Shortest-Job-First (SJF):** Schedules the process with the shortest next CPU burst.
    *   *Pros:* It is provably optimal; it gives the minimum average waiting time.
    *   *Cons:* It is impossible to know the exact length of the next CPU burst. OSs must *estimate* it using exponential averaging based on past bursts.
*   **Shortest-Remaining-Time-First (SRTF):** The preemptive version of SJF. If a new process arrives with a burst shorter than what is remaining of the current process, the current process is preempted.
*   **Round Robin (RR):** Designed for time-sharing systems. Each process gets a small unit of CPU time called a **time quantum** (usually 10-100 ms).
    *   After the quantum elapses, the process is preempted and put at the back of the ready queue.
    *   No process waits more than `(n-1)*q` time units.
    *   *Quantum Size:* If `q` is too large, it degrades into FCFS. If `q` is too small, context switch overhead dominates and throughput plummets. Rule of thumb: 80% of CPU bursts should be shorter than `q`.
*   **Priority Scheduling:** A priority number (integer) is assigned to each process, and the CPU goes to the highest priority process (usually the smallest integer).
    *   *Problem:* **Starvation**. Low-priority processes might wait forever if higher-priority processes keep arriving.
    *   *Solution:* **Aging**. Gradually increasing the priority of a process the longer it waits in the system.

## 5. Advanced Scheduling Architectures (Slide 28 - 34)
*   **Multilevel Queue:** The ready queue is divided into separate queues (e.g., foreground/interactive processes vs. background/batch processes). Each queue has its own scheduling algorithm.
*   **Multilevel Feedback Queue:** Allows processes to migrate between different queues based on their behavior. For example, if a process uses too much CPU time, it is moved to a lower-priority queue. This naturally implements aging and prioritizes I/O bound tasks.
*   **Thread Scheduling:** 
    *   *Process-contention scope (PCS):* Thread library schedules user-level threads to run on available Light Weight Processes (LWPs). Competition is within the process.
    *   *System-contention scope (SCS):* The kernel schedules kernel threads onto the CPU. Competition is among all threads in the system.
*   **Multiple-Processor Scheduling:** Becomes much more complex when multiple CPUs are available. Involves dealing with Multicore CPUs, multithreaded cores, and NUMA (Non-Uniform Memory Access) systems to maintain load balancing and efficiency.

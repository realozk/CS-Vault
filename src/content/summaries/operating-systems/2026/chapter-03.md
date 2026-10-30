---
title: "Chapter 3 — Processes"
description: "Process concept, memory layout, process states, PCB, scheduling queues, context switching, process operations, multiprocess architecture, and IPC."
author: "CS-Vault Study Notes"
date: 2026-10-30
subject_code: "Operating Systems"
year_level: 3
semester: 1
lang: "en"
---

# Chapter 3: Processes (Detailed Summary)

## 1. Introduction and Process Concept
Early computer systems allowed only one program to run at a time, giving it complete control over system resources. Today, multiple programs are loaded into memory and executed concurrently, requiring firmer control and compartmentalization. This led to the concept of a **process**, which is defined as a **program in execution**. 
*   A program is a passive entity (an executable file stored on disk), while a process is an active entity.
*   A program becomes a process when it is loaded into memory.
*   Even if a user runs multiple copies of the same program (like multiple web browser windows), each is considered a separate execution sequence and thus a separate process.

## 2. Process Memory Layout (Slide 6 - 8)
A process in memory is divided into multiple sections:
*   **Text Section:** Contains the compiled program code (executable instructions). Its size is fixed.
*   **Data Section:** Contains global and static variables. Its size is fixed.
*   **Heap:** Used for memory that is dynamically allocated during runtime. It grows upwards as memory is allocated and shrinks when freed.
*   **Stack:** Used for temporary data such as function parameters, return addresses, and local variables. Each time a function is called, an activation record is pushed onto the stack. It grows downwards.
*   *Note:* The operating system must ensure that the dynamically growing Heap and Stack do not overlap.

## 3. Process State and PCB (Slide 9 - 12)
As a process executes, it changes state. The standard states are:
1.  **New:** The process is being created.
2.  **Running:** Instructions are actively being executed on the CPU.
3.  **Waiting:** The process is waiting for some event to occur (like an I/O completion or a signal).
4.  **Ready:** The process has all it needs to run and is waiting to be assigned to a processor.
5.  **Terminated:** The process has finished execution.

**Process Control Block (PCB):** Also called a task control block, this is the data structure the OS uses to represent a process. It contains:
*   Process state and process number (PID).
*   Program counter (location of the next instruction).
*   CPU registers (saved during a context switch).
*   CPU scheduling information (priorities, queue pointers).
*   Memory-management information (memory limits).
*   Accounting and I/O status information (list of open files, devices allocated).

## 4. Process Scheduling and Context Switching (Slide 14 - 18)
The **Process Scheduler** selects among available processes for next execution on the CPU, aiming to maximize CPU use.
*   **Scheduling Queues:** 
    *   *Ready Queue:* Processes in main memory waiting to execute.
    *   *Wait Queues:* Processes waiting for an event (e.g., I/O).
*   **Context Switch:** When the CPU switches to another process, the OS must save the state of the old process (into its PCB) and load the saved state of the new process. 
    *   This time is *pure overhead*—no useful work is done during the switch.
    *   The speed of a context switch is heavily dependent on hardware support (e.g., some hardware has multiple sets of registers).

## 5. Operations on Processes (Slide 20 - 28)
*   **Process Creation:** Parent processes create children, forming a tree (e.g., `systemd` at the root in Linux).
    *   *Resource Sharing:* A parent and child might share all resources, a subset of resources, or no resources at all.
    *   *Execution:* They can execute concurrently, or the parent can wait for the child to terminate.
    *   *UNIX Implementation:* `fork()` creates a new process (duplicating the parent's address space). `exec()` is often used by the child after a fork to replace its memory space with a new program.
*   **Process Termination:** A process asks the OS to delete it using `exit()`. A parent can terminate a child using `abort()`.
    *   *Cascading Termination:* Some OSs terminate all children if a parent terminates.
    *   *Zombie:* A child process that has terminated, but its parent has not yet called `wait()` to collect its exit status.
    *   *Orphan:* A child process whose parent has terminated without calling `wait()`.

## 6. Multiprocess Architecture (Slide 30)
Modern browsers like Google Chrome use a multiprocess architecture to improve stability:
*   **Browser process:** Manages the UI, disk, and network I/O.
*   **Renderer process:** Renders web pages (HTML, JS). A new one is created for each website and runs in a *sandbox* to restrict its privileges and contain security exploits.
*   **Plug-in process:** Handles specific plug-ins.

## 7. Interprocess Communication (IPC) (Slide 31 - 52)
Cooperating processes need IPC to share information, speed up computation, and maintain modularity. There are two primary models:
1.  **Shared Memory:** A region of memory is shared between processes. Communication is controlled by the user processes, not the OS.
    *   *Producer-Consumer Problem:* A producer creates data, and a consumer uses it. A shared circular array (buffer) can be used. It can be *unbounded* (producer never waits) or *bounded* (producer waits if full).
    *   *Race Conditions:* Concurrent modification of shared variables (like a buffer counter) can lead to data inconsistencies, requiring synchronization.
2.  **Message Passing:** Communication happens via `send(message)` and `receive(message)` operations managed by the OS.
    *   *Direct Communication:* Processes explicitly name each other.
    *   *Indirect Communication:* Messages are sent to and received from mailboxes/ports.
    *   *Synchronization:* Sending and receiving can be **Blocking** (synchronous - sender waits until message is received, receiver waits until message is available) or **Non-blocking** (asynchronous). If both are blocking, it's called a *rendezvous*.
    *   *Buffering:* The link queue can have Zero capacity (sender must wait), Bounded capacity (sender waits if full), or Unbounded capacity (sender never waits).

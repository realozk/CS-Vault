---
title: "Lecture 5 - Randomized Algorithms"
description: "Las Vegas versus Monte Carlo, randomized quicksort, comparison proofs, and quickselect."
author: "CS-Vault Study Notes"
date: 2026-10-15
subject_code: "CS2107"
year_level: 3
semester: 1
lang: "en"
---

## Midterm focus

Source: `Lecture05-Randomized-Algorithms.pdf`, PDF pages 4-14. These AI-generated notes and MCQs follow the supplied lecture. They include proof ideas as answer choices and avoid code tracing. Standard randomized quicksort/quickselect bounds below assume uniformly random pivots and distinct keys, or a duplicate-aware partition strategy.

## Why introduce randomness? (pages 4-5)

Random choices can break symmetry, avoid fixed input-order biases, and simplify algorithms. With a deterministic first/last pivot, sorted or reverse-sorted data can repeatedly cause bad quicksort partitions. A uniformly random pivot makes that fixed order unable to dictate the same bad pivot sequence every run.

This is an **expected-performance** advantage, not a promise that every random run is fast. Randomization also does not guarantee perfect balance at each partition.

## Las Vegas versus Monte Carlo (page 6)

| Type | Correctness | Cost / metric |
|---|---|---|
| Las Vegas | Correct output; random choices affect work | Expected running time |
| Monte Carlo | May produce an incorrect answer with controlled probability | Error probability and bounded work |

Randomized quicksort and quickselect here are **Las Vegas**: pivot choices affect time, not whether a correctly implemented algorithm sorts/selects correctly. Repetition can reduce a Monte Carlo algorithm's error when trials and the result-combination rule justify it; merely repeating the same random choices does not create independent evidence.

## Randomized quicksort (pages 7-9)

Choose a pivot uniformly at random, partition in Θ(n) work, then recursively sort **both** sides.

- Balanced partition sequence: Θ(n log n).
- Worst partition sequence: Θ(n²), with a subproblem of size n-1 at each step.
- Expected time under the assumptions above: **Θ(n log n)** for any fixed input order, averaging over random pivots.

First- and last-element strategies can be defeated by sorted order. Median-of-three is a useful heuristic, but still has quadratic worst cases. Random pivoting does not eliminate the theoretical quadratic worst case.

## Proof idea: comparison indicators (page 8)

Order the distinct keys by rank, z₁ < z₂ < ... < zₙ. For i<j, let Xᵢⱼ be 1 when zᵢ and zⱼ are directly compared, and 0 otherwise.

They are compared exactly when the **first pivot chosen from ranks i through j is an endpoint**, zᵢ or zⱼ. An interior pivot separates them permanently. There are j-i+1 equally likely ranks and two endpoints:

**P(zᵢ and zⱼ are compared)=2/(j-i+1).**

Examples: adjacent ranks have probability 1; the minimum and maximum have probability 2/n. For ranks 2 and 6, the probability is 2/5.

Each unordered pair is counted once, so **C=Σ(i<j)Xᵢⱼ**. By linearity of expectation:

**E[C]=Σ(i<j)P(Xᵢⱼ=1)=Σ(i<j)2/(j-i+1)=Θ(n log n).**

Linearity does not require independence between the indicators. **Slide clarification:** page 8 places an extra 2 before a sum of the probabilities. When the probability is already 2/(j-i+1), do not multiply by 2 again. This correction affects the coefficient, not the asymptotic class. See [MIT's comparison proof](https://ocw.mit.edu/courses/18-310-principles-of-discrete-applied-mathematics-fall-2013/7db820f51ad2de2340639a7ea14b7795_MIT18_310F13_Ch12.pdf), PDF pages 4-5.

## Randomized selection / quickselect (pages 10-12)

The goal is the **k-th smallest element**, not a complete sort. After partitioning, return the pivot if its rank is the target; otherwise recurse into **only the side containing the target**.

| Situation | Cost argument | Result |
|---|---|---|
| Repeated balanced retained side | `T(n)=T(n/2)+Θ(n)`; sum n+n/2+n/4+... | Θ(n) |
| Repeated worst retained side | `T(n)=T(n-1)+Θ(n)` | Θ(n²) |
| Uniformly random pivots | Expected shrinkage across calls | Θ(n) expected |

The worst-side expression `n+max(T(left),T(right))` is an upper-bound analysis; quickselect actually chooses the side determined by the desired rank. An exact balanced split is not required on every call for expected linear time.

## Rank, duplicates, and memory (pages 10-12)

- In a **0-based global index** convention, the fourth smallest element is k=3. In a 1-based rank convention it is k=4. State which one a question uses.
- An unchanged global target index is compared directly with the pivot's final global index. A local-rank convention needs an adjustment when moving right.
- With many duplicate keys, simple two-way partitioning can degrade badly; three-way partitioning groups values less than, equal to, and greater than the pivot.
- Working with index boundaries avoids copying sliced arrays. A recursive implementation still consumes stack memory.

## Exam traps

**Expected ≠ worst-case guarantee. Las Vegas ≠ sometimes wrong. Quickselect ≠ quicksort on both sides. Random pivot ≠ exact median.** For proof MCQs, identify what event is being counted, the denominator's inclusive range, and whether a recurrence models one recursive branch or two.

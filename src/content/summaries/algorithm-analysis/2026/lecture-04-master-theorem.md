---
title: "Lecture 4 - Master Theorem & Divide-and-Conquer"
description: "Master cases and proof conditions, binary search, sorting, and matrix multiplication."
author: "CS-Vault Study Notes"
date: 2026-10-15
subject_code: "CS2107"
year_level: 3
semester: 1
lang: "en"
---

## Midterm focus

Source: `Master-Theorem-and-Divide-and-Conquer-Algorithms.pdf`, PDF pages 4-26. AI-generated revision based on the supplied lecture. All practice is MCQ: formulas, theorem selection, proof conditions, and algorithm concepts. No pseudocode analysis is required. Use constant positive base costs and sufficiently large n; denominator-log recurrences stop at a fixed base size greater than 1.

## Recognize the Master form (pages 4-5)

**T(n)=aT(n/b)+f(n)**, with constants a ≥ 1 and b > 1.

- **a:** number of recursive subproblems.
- **n/b:** size of each subproblem.
- **f(n):** non-recursive dividing/combining work.
- Set **d=log_b a**. The tree has approximately log_b n depth and n^d leaves.

The usual equal-subproblem form does not directly cover `T(n-1)+n`, varying a/b, or unequal sizes. Do not force every recurrence into the theorem.

## Compare f(n) with n^d

For the lecture's family `f(n)=Θ(n^k (log n)^p)`, with fixed k and p:

| Comparison | Result / intuition |
|---|---|
| d > k | Θ(n^d): leaf work dominates. |
| d = k and p > -1 | Θ(n^d (log n)^(p+1)). |
| d = k and p = -1 | Θ(n^d log log n). |
| d = k and p < -1 | Θ(n^d). |
| d < k | Θ(f(n)) for this polynomial-log family: root work dominates. |

For **general** f, Case 1 requires a polynomial gap: `f(n)=O(n^(d-ε))` for some ε>0. Case 3 requires a polynomial gap in the other direction **and regularity**: `a f(n/b) ≤ q f(n)` eventually for some constant q<1. The letter q here is not the logarithm exponent p.

**Slide clarification (page 5):** its Case 3 line for p<0 drops the denominator log and labels the result Θ(n^k). The tighter result retains that factor: for example, `2T(n/2)+n²/log₂ n` is **Θ(n²/log n)**, not Θ(n²). This follows from the polynomial gap and regularity; see [Cornell's Master-method statement](https://www.cs.cornell.edu/courses/cs3110/2009sp/lectures/lec20.html). The quiz's direct slide examples below avoid this disputed line.

## Worked lecture examples (pages 6-9)

| Recurrence | Parameters / case | Tight result |
|---|---|---|
| `2T(n/2)+n` | d=1=k, p=0 | Θ(n log n) |
| `5T(n/2)+n²` | d=log₂5≈2.322 > 2 | Θ(n^(log₂5)) |
| `12T(n/3)+n³` | d=log₃12≈2.262 < 3 | Θ(n³) |
| `4T(n/2)+n²/(log₂ n)²` | d=k=2, p=-2 | Θ(n²) |

**Proof check:** in `12T(n/3)+n³`, the combined children's non-recursive cost is `12(n/3)³=(4/9)n³`; the factor 4/9 is below 1, verifying regularity.

## Divide, conquer, combine (pages 11-16)

Divide the problem, solve its smaller subproblems, then combine their results. Binary search needs **sorted input**, keeps just one half, and has constant extra work per call: `T(n)=T(n/2)+Θ(1)`, with worst-case Θ(log n). Its best case is Θ(1) when the middle element is the target.

Quicksort partitions by **value relative to a pivot**; merge sort initially splits by **position**. Standard quicksort has no separate merge step: after partitioning, it sorts the two sides independently. Balanced splits give Θ(n log n); repeated extreme pivots give `T(n)=T(n-1)+Θ(n)=Θ(n²)`.

## Matrix multiplication (pages 18-23)

Multiplying m by n and n by l matrices yields an m by l matrix. There are ml outputs, each a sum of n products: **Θ(mnl)** arithmetic work and Θ(ml) output storage.

| Square n by n method | Recurrence / cost | Tight time | Standard extra/output storage order |
|---|---|---|---|
| Classical multiplication | n³ scalar-product work | Θ(n³) | Θ(n²) |
| Naive recursive division | `8T(n/2)+Θ(n²)` | Θ(n³) | Θ(n²) |
| Strassen | `7T(n/2)+Θ(n²)` | Θ(n^(log₂7))≈Θ(n^2.807) | Θ(n²) |

Four output quadrants do **not** mean four recursive multiplications: the naive method needs two products per quadrant, hence eight. Strassen saves one multiplication per level using extra additions/subtractions. Recursion alone does not improve cubic time. These space orders assume a sequential implementation that releases/reuses intermediate storage rather than retaining the entire recursion tree.

## Sorting comparisons (pages 24-25)

- **Insertion sort:** Θ(n) best, Θ(n²) average/worst; constant auxiliary storage; stable in the usual implementation.
- **Bubble sort:** Θ(n) best only with the early-exit optimization; Θ(n²) average/worst; constant auxiliary storage; stable with appropriate swaps.
- **Merge sort:** Θ(n log n) time in all cases here; Θ(n) extra array storage; stable when ties are merged in original order.
- **Quicksort:** Θ(n log n) average, Θ(n²) worst; usually unstable. In-place partitioning does not remove recursion-stack space: Θ(log n) with balanced splits and Θ(n) in the straightforward worst case.
- **Heapsort:** Θ(n log n) worst time; Θ(1) auxiliary storage in the usual iterative implementation; unstable. The lecture classifies merge/quick as divide-and-conquer, not heapsort.

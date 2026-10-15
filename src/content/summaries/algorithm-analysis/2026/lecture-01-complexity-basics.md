---
title: "Lecture 1 - Algorithm Behaviour & Complexity"
description: "Definitions, time and space, case behaviour, growth rates, and asymptotic notation."
author: "CS-Vault Study Notes"
date: 2026-10-15
subject_code: "CS2107"
year_level: 3
semester: 1
lang: "en"
---

## Midterm focus

Source: `Lecture-1-Algorithm-Behaviour-and-Complexity-Analysis.pdf`, PDF pages 3-26. These notes and the accompanying MCQs are AI-generated study aids based on the supplied lecture, not an official exam or answer key. This revision set excludes code tracing and code-analysis questions.

## Algorithm and efficiency (pages 3-7)

An **algorithm** is a finite, unambiguous sequence of steps that transforms defined inputs into the required output. Correctness and efficiency are different: a fast procedure that returns the wrong answer is not a correct solution.

Analysis compares how resources grow with **input size**, rather than timing one machine. Typical size measures are array length and graph vertices/edges. Count basic operations under a stated model; exact constants depend on what is counted, but asymptotic growth is more portable than seconds measured on one computer.

- **Time complexity:** growth in the number of basic operations.
- **Space complexity:** growth in memory needed, including any recursion stack.
- A correctness proof may use induction: establish a base case, assume smaller cases work, and justify the next case.

## Space: total versus auxiliary (pages 10-15)

Space can contain a fixed part and a part depending on the input: `S(n) = fixed + variable`.

| Resource | Growth |
|---|---|
| Fixed number of scalar variables | Θ(1) |
| Array containing n elements | Θ(n) |
| n by n matrix | Θ(n²) |
| Recursion depth d, constant local storage per active call | Θ(d) |

**Total space** can include the input; **auxiliary space** means additional working memory. An input array can occupy Θ(n) total storage while a procedure uses only Θ(1) auxiliary storage. Reusing a variable for many operations does not allocate a new variable each time. Do not infer space from runtime alone.

## Best, worst, and average cases (page 16)

For a fixed input size, best case is the minimum cost; worst case is the maximum; average case is an expectation under an explicitly stated input distribution. Worst-case analysis gives an upper guarantee for every input of that size. For a linear scan, finding the target first is Θ(1); finding it last or not finding it is Θ(n).

## Growth rates (pages 17-21)

For sufficiently large n, the usual order is:

**1 < log n < n < n log n < n² < n³ < 2ⁿ < n!**

For nonnegative polynomial sums, retain the highest-degree term and ignore its positive constant coefficient to find a tight growth class. Examples: `7n³ + 25n + 60` is Θ(n³); `50n log n + 20n` is Θ(n log n); `5 log n + 100` is Θ(log n); a positive constant is Θ(1). Different fixed logarithm bases differ only by a constant factor.

## Bounds and proof language (pages 19-25)

For eventually nonnegative f and g, choose constants that do **not** depend on n:

| Notation | What must eventually hold, for all n ≥ n₀ |
|---|---|
| f ∈ O(g) | `0 ≤ f(n) ≤ c g(n)`, with c > 0 |
| f ∈ Ω(g) | `0 ≤ c g(n) ≤ f(n)`, with c > 0 |
| f ∈ Θ(g) | `0 ≤ c₁g(n) ≤ f(n) ≤ c₂g(n)`, with c₁,c₂ > 0 |

**Important clarification:** some slide captions associate O with worst case, Ω with best case, and Θ with average case. These are different ideas: O/Ω/Θ describe bounds on whichever cost function is being studied. Θ means a tight bound, not automatically an average-case analysis.

A tight bound is more informative than a loose one. A Θ(n²) function is also O(n³), but is not Θ(n³). Thus both upper-bound statements on page 20 are true.

## Proof MCQ checklist

1. Match the inequality direction to O or Ω.
2. Check that c is positive and independent of n.
3. Check the claim for **every** n beyond n₀, not one sample value.
4. For Θ, verify both inequalities using one common threshold.
5. Reject an answer that confuses a valid loose upper bound with a tight bound.

---
title: "Lecture 2 - Asymptotic Proofs & Practice"
description: "Worked bounds, valid constants, growth comparisons, and proof-step MCQs."
author: "CS-Vault Study Notes"
date: 2026-10-15
subject_code: "CS2107"
year_level: 3
semester: 1
lang: "en"
---

## Midterm focus

Source: `Lecture-2-Practice-Algorithm-Behaviour-and-Complexity-Analysis.pdf`, PDF pages 2-15. These AI-generated notes convert the lecture's proof practice into reasoning you can recognize in an MCQ. No code-analysis exercises are included. Unless stated otherwise, log means log₂ and n is a positive integer.

## The main worked proof (pages 3-5)

Let `f(n) = 3n² + 17n log₂ n + 1000`.

For n ≥ 2, `log₂ n ≤ n` and `1 ≤ n²`, so:

**f(n) ≤ 3n² + 17n² + 1000n² = 1020n².**

This proves O(n²) with **c = 1020, n₀ = 2**. The constants need not be minimal; safe constants are enough.

All terms are nonnegative for n ≥ 1, so **f(n) ≥ 3n²**. This proves Ω(n²), for example with c = 3 and n₀ = 1. Combine both at the larger threshold:

**3n² ≤ f(n) ≤ 1020n² for all n ≥ 2**, hence f ∈ Θ(n²).

The first displayed instruction on the Ω example uses the wrong inequality direction; use the actual lower-bound condition **f(n) ≥ c g(n)**.

## Four practice proofs (page 6)

| Function | Safe lower and upper bounds | Valid Θ witnesses |
|---|---|---|
| `7n³ + 25n + 60` | `7n³ ≤ f(n) ≤ 92n³`, n ≥ 1 | c₁=7, c₂=92, n₀=1 |
| `50n log₂ n + 20n` | `50n log₂ n ≤ f(n) ≤ 70n log₂ n`, n ≥ 2 | c₁=50, c₂=70, n₀=2 |
| `5 log₂ n + 100` | `5 log₂ n ≤ f(n) ≤ 105 log₂ n`, n ≥ 2 | c₁=5, c₂=105, n₀=2 |
| `n³ + 20n² + 100` | `n³ ≤ f(n) ≤ 121n³`, n ≥ 1 | c₁=1, c₂=121, n₀=1 |

Why the thresholds? For n ≥ 1, lower powers and 1 are at most n³. For n ≥ 2, log₂ n ≥ 1, allowing a constant or a linear term to be absorbed into the logarithmic expression.

## Proving or disproving a claim (pages 11-13)

For `3n + 2`, we have **3n ≤ 3n + 2 ≤ 5n** for n ≥ 1, so the function is Θ(n).

It is **not Ω(n²)**: dividing the proposed lower-bound inequality by n² gives `3/n + 2/n² ≥ c`, but the left side tends to 0. No fixed positive c works for all sufficiently large n. A finite set of successful examples cannot prove an eventual bound; one counterexample also does not disprove an eventual bound if a larger n₀ could avoid it.

For `2n²`, a tight class is Θ(n²), but looser O(n³) and Ω(n) claims are also true. Always read whether the question requests **any valid bound** or **the tightest class**.

## Page 14 comparisons, with reasons

| Statement | Verdict and reason |
|---|---|
| `n² + n ∈ O(n²)` | True: at most 2n² for n ≥ 1. |
| `2ⁿ ∈ Ω(10n²)` | True: exponential growth eventually dominates the polynomial. |
| `2ⁿ ∈ O(3ⁿ)` | True: `(2/3)ⁿ ≤ 1` for n ≥ 0. |
| `10 ∈ Θ(log₂ 10)` | True: both are positive constants independent of n. |
| `n ∈ O(10)` | False: n is unbounded while 10c is fixed. |
| `n ∈ Ω(log₂(n²))` | True: `log₂(n²)=2log₂ n`, which grows slower than n. |
| `(log₂ n)² ∈ Θ(log₂ n + 5)` | False: the ratio grows without bound. |

## Case behaviour reminder (pages 7-9)

Insertion sort is Θ(n) on already sorted input and Θ(n²) on reverse-sorted input. This is a conceptual case comparison; the quiz does not require inspecting its pseudocode. Bounds and input cases remain separate concepts: Θ does not mean "average case."

## Choosing a proof answer

A good answer supplies an inequality valid beyond a stated threshold, not just "drop constants." For an upper bound, replace smaller positive terms with larger ones. For a lower bound, discard positive terms. For a tight bound, do both.

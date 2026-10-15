---
title: "Lecture 3 - Summations & Recurrence Relations"
description: "Summation formulas, recurrence expansion, recursion trees, and merge-sort reasoning without code."
author: "CS-Vault Study Notes"
date: 2026-10-15
subject_code: "CS2107"
year_level: 3
semester: 1
lang: "en"
---

## Midterm focus

Source: `Lecture03-Iterative-Analysis-and-Recurrance-Relations-01.pdf`, PDF pages 4-36. AI-generated revision notes and questions based on the supplied slides. Practice uses mathematical cost expressions and explanations, not code tracing. Assume positive constant base costs; for exact halving-tree formulas, take n to be a power of 2.

## Iteration versus recursion (pages 4-10)

Iterative algorithms repeat work; recursive algorithms solve smaller instances through recursive calls. Their running times are represented by **sums** and **recurrences**, respectively. Both can solve the same problem, but their time and space costs can differ.

A recurrence needs a recursive rule and a **base case**. `T(n)=T(n-1)+c` says there is one smaller instance and constant non-recursive work. It describes cost, not the numerical output computed by the algorithm: calculating n! recursively does not imply factorial running time.

## Summations to recognize (pages 5-7)

| Expression | Exact value | Tight growth |
|---|---|---|
| `Σ(i=1..n) 1` | n | Θ(n) |
| `Σ(i=1..n) i` | n(n+1)/2 | Θ(n²) |
| `Σ(i=1..n) i²` | n(n+1)(2n+1)/6 | Θ(n³) |
| `Σ(i=1..n) i³` | [n(n+1)/2]² | Θ(n⁴) |
| `Σ(i=m..n) c` | c(n-m+1) | Count inclusive terms carefully. |
| `Σ(i=0..h) a^i`, a ≠ 1 | (a^(h+1)-1)/(a-1) | For fixed a > 1, Θ(a^h). |

Two independent dimensions of work of lengths w and h give Θ(wh) constant-cost operations. A triangular total `1+2+...+n` remains quadratic, even though it is about half a square total. Do not multiply fixed bounds when the inner amount depends on the outer index; sum the varying amount instead.

## Expansion / back-substitution (pages 11-13)

For `T(1)=1` and `T(n)=T(n-1)+c`, expansion gives:

**T(n)=kc+T(n-k).** Reach the base at `n-k=1`, so `k=n-1`. Then **T(n)=c(n-1)+1=Θ(n)**.

For `T(1)=1` and `T(n)=T(n-1)+n`, the accumulated costs are `n+(n-1)+...+2+1`, giving **n(n+1)/2 = Θ(n²)**.

The important proof step is the correct stopping equation. Do not keep expanding past the base or lose one term by mixing an index that starts at 0 with a count that starts at 1.

## Recursion-tree proof (pages 14-29)

Take `T(n)=2T(n/2)+cn`, with c > 0 and T(1)=Θ(1).

| At level i, with root at level 0 | Value |
|---|---|
| Number of nodes | 2^i |
| Size at each node | n/2^i |
| Non-recursive cost per node | cn/2^i |
| Total non-recursive cost at that level | cn |

Leaves occur when `n/2^h=1`, so **h=log₂ n**. There are **n leaves**, each with constant cost. There are log₂ n non-leaf levels; including the leaf level gives log₂ n + 1 levels.

Therefore **T(n)=cn log₂ n + Θ(n)=Θ(n log n)**. This counts both internal work and leaves. A tree with n leaves does not automatically have total cost Θ(n); internal work can add a logarithmic factor.

## Recurrences worth memorizing (page 9)

With suitable constant base cases and positive non-recursive costs:

| Recurrence | Tight result |
|---|---|
| `T(n)=T(n-1)+c` | Θ(n) |
| `T(n)=T(n-1)+n` | Θ(n²) |
| `T(n)=T(n/2)+c` | Θ(log n) |
| `T(n)=T(n/2)+n` | Θ(n) |
| `T(n)=2T(n/2)+1` | Θ(n) |
| `T(n)=2T(n/2)+n` | Θ(n log n) |

## Merge sort, without pseudocode (pages 30-36)

Merge sort divides into halves, recursively sorts **both**, and merges the sorted halves in linear work. Its recurrence is `2T(n/2)+Θ(n)`, giving **Θ(n log n)** time. Standard array merge sort uses **Θ(n)** auxiliary storage; its Θ(log n) recursion stack is smaller than the temporary arrays' peak storage. Count peak simultaneously live memory, not the sum of every allocation across the whole run.

**Internal sorting** keeps all data in main memory. **External sorting** handles data that also resides on slower external storage. **In-place**, in the lecture's strict definition, means constant extra space; the standard array merge sort here is not in-place.

## Proof MCQ checkpoints

Recognize the correct expansion, the base-case stopping condition, the level cost, and the number of leaves. The substitution method means guessing a bound and then proving it by induction; a few numerical examples are not that proof.

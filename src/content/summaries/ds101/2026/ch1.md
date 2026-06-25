---
title: "Course Overview & Introduction to Arrays"
description: "Arrays as the foundational data structure"
author: "DS Faculty"
date: 2026-06-21
subject_code: "DS101"
year_level: 2
semester: 1
---

# Ch 1: Course Overview & Introduction to Arrays

Arrays as the foundational data structure

---

* An array is a fixed-size, contiguous block of memory holding elements of the same type, accessed by an index starting at 0.
* Direct/random access: any element is reached in O(1) time via base_address + index * element_size.
* Arrays are static in size in Java — once declared with `new int[n]`, the size cannot grow or shrink.
* 2D arrays (`int[][] grid`) are arrays of arrays — useful for grids, matrices, and tables.
* Inserting/deleting in the middle of an array requires shifting elements, costing O(n) time.
* Integer division (`7/2 = 3`) truncates; floating-point division (`7.0/2 = 3.5`) keeps the fraction.
* Integer overflow happens silently in Java when a computed value exceeds the type's range (e.g. `int` max ~2.1 billion).
* The modulo operator `%` returns a remainder that can be negative for negative operands in Java; `Math.floorMod` always returns a non-negative result for a positive divisor.

### Declaring, looping, and filling an array
```java
int[] values = new int[5];
for (int i = 0; i < values.length; i++) {
    values[i] = i * i;          // fill with squares
}
for (int i = 0; i < values.length; i++) {
    System.out.println(values[i]);
}
```


### Filling a 2D array
```java
int[][] grid = new int[3][3];
for (int r = 0; r < grid.length; r++) {
    for (int c = 0; c < grid[r].length; c++) {
        grid[r][c] = r * grid[r].length + c;
    }
}
```


### Integer division, overflow, and modulo
```java
System.out.println(7 / 2);        // 3  (integer division truncates)
System.out.println(7.0 / 2);      // 3.5 (floating point keeps fraction)
int big = Integer.MAX_VALUE;
System.out.println(big + 1);      // overflows to a large negative number
System.out.println(-7 % 3);       // -1 in Java
System.out.println(Math.floorMod(-7, 3)); // 2 (always non-negative here)
```

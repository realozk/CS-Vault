---
title: "Lecture 3 Part 1 — Configuring Color and Text with CSS"
description: "CSS benefits and types, selectors, color formats, text properties, the cascade, inline elements, and CSS validation."
author: "CS-Vault Study Notes"
date: 2026-10-14
subject_code: "Web Development"
year_level: 3
semester: 1
lang: "en"
---

# Summary of Lecture 3, Part 1: Configuring Color and Text with CSS

This document summarizes the key concepts from the "Lecture 3 - CSS - part 1 .pdf" presentation, focusing on Cascading Style Sheets (CSS) basics.

## 1. Overview and Advantages of CSS
* **Cascading Style Sheets (CSS):** A collection of style rules used to control the appearance of HTML elements (typography, color, layout). "Cascading" refers to how multiple rules can apply to the same element based on a specific order of precedence.
* **Advantages:**
  * Provides greater control over typography and page layout.
  * Separates style (design) from structure (HTML content).
  * Enables a single file to control multiple web pages.
  * Results in potentially smaller HTML documents and easier site maintenance.

## 2. Types of CSS
* **Inline Styles:** Coded directly within the HTML `<body>` using the `style` attribute (applies only to that specific element).
* **Embedded (Internal) Styles:** Defined within a `<style>` element in the `<head>` section (applies to the entire page).
* **External Styles:** Coded in a separate `.css` text file and associated with HTML pages using the `<link>` element in the `<head>` section.
* **Imported Styles:** Uses the `@import` directive to bring an external style sheet into another style sheet.

## 3. CSS Syntax and Selectors
A CSS rule consists of a **Selector** (what to style) and a **Declaration** (how to style it, made of a property and a value).
* **Element Selector:** Targets standard HTML tags (e.g., `body`, `h1`, `p`).
* **Class Selector (`.classname`):** Applies styles to specific elements grouped by a class attribute. Can be reused multiple times on a page.
* **Id Selector (`#idname`):** Applies a unique style to a single, specific area/element on a web page.
* **Descendant (Contextual) Selector:** Targets an element only when it is inside a specific parent container (e.g., `div p { color: blue; }`).

## 4. Configuring Color
* **Properties:** `background-color` sets the background; `color` sets the text (foreground) color.
* **Syntax Options:** Colors can be defined using:
  * Color names (e.g., `red`)
  * Hexadecimal values (e.g., `#FF0000`)
  * Shorthand hex values (e.g., `#F00`)
  * Decimal/RGB triplets (e.g., `rgb(255,0,0)`)
  * HSL (Hue, Saturation, Lightness) values.
* **Accessibility:** Always ensure sufficient contrast between text and background colors for readability.

## 5. Configuring Text
* **Font Properties:**
  * `font-family`: Sets the typeface (always include a generic family like `sans-serif` as a fallback).
  * `font-size`: Sets the size (using `em` or percentages is recommended for accessibility/scaling).
  * `font-weight`: Sets boldness.
  * `font-style`: Sets italics.
* **Text Properties:**
  * `text-align`: Alignment (center, left, right, justify).
  * `text-decoration`: Underline, overline, none.
  * `text-transform`: Capitalization.
  * `line-height`: Spacing between lines (e.g., `200%` for double spacing).
  * `text-shadow`: Adds a drop shadow with horizontal offset, vertical offset, blur radius, and color.

## 6. The `<span>` Element
* A container used to define a section of inline text (not physically separated with line breaks like a `<div>` or `<p>`). It is perfect for formatting a specific word or phrase inside a paragraph.

## 7. The "Cascade" (Rules of Precedence)
When style rules conflict, browsers apply them in this order of overriding power (from weakest to strongest):
1. Browser Defaults
2. External Styles
3. Embedded Styles
4. Inline Styles (highest priority)

## 8. Validation
* CSS should be checked for syntax errors using the W3C CSS Validation Service (`http://jigsaw.w3.org/css-validator/`) to ensure proper rendering across different browsers.

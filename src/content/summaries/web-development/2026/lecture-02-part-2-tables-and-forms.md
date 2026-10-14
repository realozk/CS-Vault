---
title: "Lecture 2 Part 2 — HTML Tables and Forms"
description: "HTML tables, accessible table headers, form configuration and controls, form accessibility, and server-side processing."
author: "CS-Vault Study Notes"
date: 2026-10-14
subject_code: "Web Development"
year_level: 3
semester: 1
lang: "en"
---

# Summary of Lecture 2 (Part 2): HTML Basics - Tables and Forms

This document summarizes the key concepts from the "Lecture 2- HTML basics- part 2- Tables and Forms.pdf" presentation.

## 1. HTML Tables
Tables organize tabular information into rows and columns.
* **Core Elements:**
  * `<table>`: Contains the entire table.
  * `<tr>`: Defines a table row.
  * `<td>`: Defines a standard table data cell.
  * `<th>`: Defines a table header cell (text is usually bold and centered).
  * `<caption>`: Provides a description or title for the table.
* **Key Attributes:**
  * `colspan`: Allows a cell to span across multiple columns.
  * `rowspan`: Allows a cell to span across multiple rows.
* **Accessibility:** Use `<th>` for headers. For complex tables, use the `id` attribute on `<th>` tags and the `headers` attribute on `<td>` tags to link them explicitly for screen readers.
* **Row Groups:** Tables can be structurally divided using `<thead>` (header rows), `<tbody>` (body rows), and `<tfoot>` (footer rows).

## 2. HTML Forms
Forms accept information from website visitors and provide interactivity (e.g., search forms, order forms). They require two components: the HTML user interface and server-side processing.

### Form Configuration
* `<form>`: The container for all form controls.
  * `action` attribute: Specifies where the form data is sent upon submission.
  * `method` attribute: Specifies how data is sent (commonly `get` or `post`).

### Form Controls
* **`<input>` Element:** A stand-alone tag used for many form elements, dictated by its `type` attribute:
  * `type="text"`: Standard text box.
  * `type="submit"`: Submits the form data to the server.
  * `type="reset"`: Clears the form fields.
  * `type="password"`: Hides the characters being typed.
  * `type="checkbox"`: Select one or more items from a group.
  * `type="radio"`: Select exactly one item from a group (must share the same `name` attribute).
  * `type="image"`: Uses an image as a submit button.
  * **HTML5 Input Types:** `email`, `tel` (telephone), `range` (slider), `number` (spinner), `date` (calendar), and `color` (color picker).
* **`<textarea>`:** A container tag that creates a multi-line, scrolling text box (uses `rows` and `cols` attributes).
* **`<select>` and `<option>`:** Creates a drop-down list. `<select>` contains the list, and `<option>` defines each selectable item.
* **`<datalist>`:** Used with an `<input>` element to provide a predefined list of autocomplete suggestions while still allowing the user to type their own value.

### Form Accessibility and Grouping
* **`<label>`:** Associates a text label explicitly with a form control using the `for` attribute (which matches the control's `id`).
* **`<fieldset>` and `<legend>`:** `<fieldset>` creates a visual grouping of related form elements, and `<legend>` provides a text label/title for that group.

## 3. Server-Side Processing
* **Workflow:** The web browser requests a page, the server returns it, and the user fills out the form. Upon submission, the form triggers a server-side script (e.g., PHP, ASP.Net, Ruby on Rails).
* **Purpose:** The script processes the data (searches a database, sends an email, processes an order) and returns a confirmation page back to the client browser.

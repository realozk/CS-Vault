---
title: "Lecture 2 — HTML Basics"
description: "HTML5 document structure, text and phrase elements, lists, links, semantic elements, special characters, comments, and validation."
author: "CS-Vault Study Notes"
date: 2026-10-13
subject_code: "Web Development"
year_level: 3
semester: 1
lang: "en"
---

## HTML and HTML5

**HTML (Hypertext Markup Language)** uses tags to identify document structure, including paragraphs, headings, lists, and media. The W3C sets HTML standards.

**HTML5** is the modern version of HTML/XHTML. It is backward compatible and adds functional elements, including native support for audio and video.

## Document structure

The HTML5 doctype, `<!DOCTYPE html>`, appears at the beginning of a document to identify its HTML version.

- The `<html>` element is the document root and should use a `lang` attribute to identify the document language, such as `<html lang="en">`.
- The `<head>` contains descriptive information that is not displayed as page content. The `<title>` appears in the browser tab, while `<meta>` elements provide information such as character encoding (`<meta charset="utf-8">`).
- The `<body>` contains the content displayed in the browser.

## Basic text elements

- **Headings (`<h1>`–`<h6>`):** provide a hierarchical document outline. They are important for accessibility and screen-reader navigation.
- **Paragraphs (`<p>`):** group text into blocks, with spacing around them.
- **Line break (`<br>`):** a void element that starts following content on a new line.
- **Blockquote (`<blockquote>`):** marks a block of quoted text.

## Phrase elements

Phrase elements appear inline and add meaning or emphasis to text. They need opening and closing tags. When elements are nested, close them in the reverse order they were opened; for example, `<p><i><strong>Text</strong></i></p>`.

Examples include `<b>` and `<i>` for conventional bold and italic styling, `<em>` for emphasis, `<strong>` for strong importance, and `<mark>` for highlighted text.

## HTML lists

- **Ordered lists (`<ol>` and `<li>`):** display numbered or lettered items. Attributes can set the numbering `type`, starting value (`start`), or descending order (`reversed`).
- **Unordered lists (`<ul>` and `<li>`):** display bulleted items.
- **Description lists (`<dl>`, `<dt>`, and `<dd>`):** pair terms with descriptions; `<dt>` contains a term and `<dd>` its description.

## Structure and links

The `<div>` element groups content into a generic block. HTML5 semantic elements describe common page regions: `<header>`, `<nav>`, `<main>`, and `<footer>`.

The anchor element `<a>` creates a hyperlink with `href`:

- **Absolute links** point to another website, such as `href="https://example.com"`.
- **Relative links** point to a location within the same site, such as `href="index.html"`.
- **Email links** use the `mailto:` protocol, such as `href="mailto:me@example.com"`.

A **site map** represents a website's structure and page organization.

## Special characters, comments, and validation

HTML entity codes display reserved or special characters. Examples include `&nbsp;` for a non-breaking space, `&quot;` for a quotation mark, `&amp;` for an ampersand, and `&copy;` for the copyright symbol.

HTML comments use the form `<!-- Comment here -->` and are not displayed by the browser.

Validate HTML to catch syntax errors and improve consistent browser rendering. The W3C HTML Validation Tool is one resource for checking markup.

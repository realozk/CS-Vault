---
title: "Chapter 2 — Application Layer"
description: "Client-server and P2P architectures, sockets, HTTP, cookies, web caching, HTTP/2, email, DNS, and P2P."
author: "CS-Vault Study Notes"
date: 2026-10-23
subject_code: "CEN3011"
year_level: 3
semester: 1
lang: "en"
---

# Summary of Chapter 2: Application Layer

This document provides a summary of the lecture material based on the file "Chapter_2_v8.2.pdf".

## 1. Principles of Network Applications \[Slides 2-14\]

* **Application Architectures:** Network applications (like Web, e-mail, streaming, and games) run on end systems, not within the network core. There are two primary architectural paradigms:
  * *Client-Server:* A constantly running server with a permanent IP address services requests from intermittently connected clients with dynamic IPs.
  * *Peer-to-Peer (P2P):* No always-on server. Arbitrary end systems (peers) communicate directly. It is highly scalable because peers bring both service demands and service capacity.
* **Processes and Sockets:** Programs running on hosts are called processes. They communicate across the network by sending and receiving messages through **sockets** (the interface between the application and the transport layer, controlled by the OS). Processes are identified by an IP address and a port number (e.g., HTTP uses port 80).
* **Transport Services:** Applications require different transport services, primarily categorized by data integrity (reliability), timing, throughput, and security.
* **Internet Transport Protocols:**
  * *TCP:* Provides reliable data transfer, flow control, congestion control, and requires connection setup.
  * *UDP:* Provides unreliable data transfer without flow/congestion control or connection setup (good for low-latency apps).
  * *TLS (Transport Layer Security):* Added at the application layer to secure TCP connections (encryption, integrity, authentication).

## 2. Web and HTTP \[Slides 16-37\]

* **HTTP (Hypertext Transfer Protocol):** The Web's application-layer protocol, based on a client/server model using TCP. It is inherently "stateless," meaning the server keeps no history of past client requests.
* **Connections:**
  * *Non-persistent:* One object is sent per TCP connection. Response time is 2 RTT (Round Trip Time) + file transmission time.
  * *Persistent (HTTP/1.1):* Multiple objects can be sent over a single open TCP connection, drastically reducing delay.
* **Messages:** HTTP has specific request messages (GET, POST, HEAD, PUT) and response messages containing status codes (e.g., `200 OK`, `301 Moved Permanently`, `404 Not Found`).
* **Cookies:** Because HTTP is stateless, cookies are used to maintain user/server state over multiple transactions. They utilize headers in HTTP messages, a local file on the user's machine, and a backend database on the server. They are heavily used for authorization, shopping carts, and tracking (both first-party and third-party tracking across sites).

## 3. Web Caches and HTTP/2 \[Slides 38-49\]

* **Web Caches (Proxy Servers):** Caches satisfy client requests without involving the origin server. They reduce response time for the client and reduce traffic on an institution's access link. A Conditional GET (`If-modified-since`) ensures the cache doesn't serve stale data, returning a `304 Not Modified` if the cached copy is current.
* **HTTP/2 and HTTP/3:** 
  * *HTTP/2:* Decreases delay for multi-object requests over a single TCP connection by dividing objects into frames and interleaving them. This mitigates Head-of-Line (HOL) blocking where a large object stalls smaller ones.
  * *HTTP/3:* Shifts to UDP to add security and per-object error/congestion control, preventing a single lost TCP packet from stalling the entire multi-object transmission.

## 4. E-mail, SMTP, and IMAP \[Slides 51-56\]

* **Components:** Electronic mail consists of User Agents (mail readers), Mail Servers (containing user mailboxes and outgoing message queues), and SMTP.
* **SMTP (Simple Mail Transfer Protocol):** Uses TCP (port 25) to reliably push email messages from the sending mail server to the receiving mail server. It involves three phases: handshaking, transfer, and closure.
* **Mail Access Protocols:** While SMTP is used to *send* or push mail, protocols like **IMAP** (Internet Mail Access Protocol) or **HTTP** (webmail interfaces) are used by the receiver to *pull* or retrieve emails from their mail server.

## 5. The Domain Name System (DNS) \[Slides 57-70\]

* **Purpose:** DNS is a distributed, hierarchical database that translates human-readable hostnames (e.g., www.amazon.com) into 32-bit IP addresses used by routers. It also handles host/mail aliasing and load distribution.
* **Hierarchy:** The system avoids centralization to prevent a single point of failure and bottlenecking. It spans from Root DNS servers -> Top-Level Domain (TLD) servers (.com, .org, .edu) -> Authoritative servers.
* **Resolution:** 
  * *Iterated Query:* The contacted server replies with the name of the next server to ask.
  * *Recursive Query:* The contacted server takes the burden of resolving the name entirely before replying.
* **Caching:** Local DNS servers cache learned mappings to improve response times, expiring them after a Time-to-Live (TTL).
* **Records (RRs):** Include Type A (hostname to IPv4), Type CNAME (alias to canonical name), Type NS (authoritative name server for a domain), and Type MX (mail server).

## 6. P2P Applications \[Slides 72-80\]

* **Client-Server vs. P2P File Distribution:** In a client-server model, the server must upload a file to every client, causing distribution time to increase linearly with the number of peers. In a P2P architecture, as peers join, they bring both demand and upload capacity, allowing distribution time to scale far more efficiently.
* **BitTorrent:** A popular P2P file-sharing protocol. Files are divided into chunks. A "tracker" tracks peers in the "torrent." 
  * *Requesting:* Peers request the rarest chunks first.
  * *Sending (Tit-for-Tat):* A peer prioritizes sending chunks to the top 4 peers that are currently sending data to them at the highest rate. They also randomly "optimistically unchoke" one new peer every 30 seconds to discover potentially faster partners.

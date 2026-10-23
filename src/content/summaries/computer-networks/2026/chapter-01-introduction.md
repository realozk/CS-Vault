---
title: "Chapter 1 — Introduction"
description: "Internet basics, network edge and core, delay, loss, throughput, protocol layers, and security."
author: "CS-Vault Study Notes"
date: 2026-10-23
subject_code: "CEN3011"
year_level: 3
semester: 1
lang: "en"
---

# Summary of Chapter 1: Introduction

This document provides a summary of the lecture material based on the file "Chapter_1_v8.2.pdf".

## 1. What is the Internet? [Slides 2-6]

* **"Nuts and Bolts" View:** The Internet is a vast network of billions of connected computing devices (hosts/end systems) running network apps at the "edge." These are connected by communication links (fiber, copper, radio) and packet switches (routers and switches) that forward chunks of data (packets).

* **"Services" View:** It is an infrastructure that provides services to distributed applications (Web, email, games, etc.) and offers a programming interface for these apps to send and receive data.

* **Protocols:** Protocols control the sending and receiving of all messages on the Internet. They define the format, order of messages sent/received, and actions taken upon message transmission or receipt (e.g., TCP, IP, HTTP).

## 2. The Network Edge [Slides 8-22]

* **End Systems (Hosts):** Includes clients and servers (often housed in large data centers).

* **Access Networks:** The networks that connect end systems to the first edge router.

  * *Cable:* Uses Frequency Division Multiplexing (FDM) over a hybrid fiber-coax (HFC) network; bandwidth is shared among homes.

  * *DSL (Digital Subscriber Line):* Uses existing dedicated telephone lines to a central office.

  * *Home & Enterprise Networks:* Mix of wired (Ethernet) and wireless (WiFi) connections connecting devices to an institutional router or ISP.

  * *Wireless Access:* Wide-area cellular (4G/5G) and local Wireless LANs (WiFi).

* **Physical Media:** Includes guided media (twisted pair copper, coaxial cable, fiber optic) and unguided media (wireless radio, terrestrial microwave, satellite).

## 3. The Network Core [Slides 24-34]

The network core is a mesh of interconnected routers.

* **Packet Switching:** Hosts break application messages into discrete "packets" and transmit them over links.

  * *Store-and-forward:* An entire packet must arrive at a router before it can be transmitted to the next link.

  * *Queueing and Loss:* If the arrival rate of packets exceeds the link's transmission rate, packets will queue. If the buffer memory fills up, packets are dropped (lost).

* **Circuit Switching:** An alternative to packet switching where end-to-end resources (bandwidth) are exclusively reserved for a "call" (e.g., traditional telephone networks). It uses FDM (Frequency Division Multiplexing) or TDM (Time Division Multiplexing). Packet switching is generally better for "bursty" data but can lead to congestion.

* **Key Functions:**

  * *Routing:* Global action determining the source-to-destination path.

  * *Forwarding:* Local action moving packets from a router's input to the correct output link.

## 4. Internet Structure: "Network of Networks" [Slides 36-43]

Connecting billions of devices requires a hierarchical structure rather than direct connections, which wouldn't scale.

* Access ISPs connect to Regional ISPs, which in turn connect to Global Tier-1 ISPs.

* **Internet Exchange Points (IXPs):** Used to directly connect different ISPs together.

* **Content Provider Networks:** Massive companies (like Google or Microsoft) run their own global networks, bypassing standard ISPs to bring content closer to end-users.

## 5. Performance: Delay, Loss, and Throughput [Slides 45-56]

* **Packet Delay (**$d_{nodal}$**):** Occurs at each router and consists of four components:

  1. *Processing delay (*$d_{proc}$*):* Checking for errors and determining the output link.

  2. *Queueing delay (*$d_{queue}$*):* Time waiting in the buffer. Spikes exponentially as traffic intensity approaches link capacity.

  3. *Transmission delay (*$d_{trans}$*):* Time to push the packet onto the link ($L/R$, where L is packet length and R is link bandwidth).

  4. *Propagation delay (*$d_{prop}$*):* Time for a bit to travel physically across the medium ($d/s$, where d is distance and s is the speed of light in the medium).

* **Throughput:** The rate (bits/sec) at which data is successfully transferred from sender to receiver. The end-to-end throughput is constrained by the **bottleneck link** (the link with the lowest capacity on the path).

## 6. Network Security [Slides 58-62]

The Internet was not initially designed with robust security.

* **Threats:**

  * *Packet Sniffing:* Intercepting unencrypted data over shared media.

  * *IP Spoofing:* Injecting packets with a fake source address.

  * *Denial of Service (DoS):* Overwhelming a target resource with bogus traffic, often via a botnet.

* **Defenses:** Authentication, encryption, integrity checks, VPNs, and firewalls.

## 7. Protocol Layers and Encapsulation [Slides 64-73]

To manage complexity, network architectures use layering (modularization).

* **Internet Protocol Stack:**

  1. *Application Layer:* Supporting network applications (HTTP, SMTP, DNS). Unit: **Message**.

  2. *Transport Layer:* Process-to-process data transfer (TCP, UDP). Unit: **Segment**.

  3. *Network Layer:* Routing of datagrams from source to destination (IP). Unit: **Datagram**.

  4. *Link Layer:* Data transfer between neighboring elements (Ethernet, WiFi). Unit: **Frame**.

  5. *Physical Layer:* Bits "on the wire."

* **Encapsulation:** As a message moves down the stack, each layer adds its own specific header information (like nesting Matryoshka dolls) before passing it to the layer below.

* **OSI Model:** A 7-layer reference model that includes *Presentation* and *Session* layers, which are left to the application developer in the standard Internet stack.

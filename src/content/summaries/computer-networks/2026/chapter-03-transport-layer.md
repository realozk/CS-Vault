---
title: "Chapter 3 — Transport Layer"
description: "Multiplexing, UDP, reliable data transfer, Go-Back-N, Selective Repeat, TCP, flow control, and congestion control."
author: "CS-Vault Study Notes"
date: 2026-10-23
subject_code: "CEN3011"
year_level: 3
semester: 1
lang: "en"
---

# Summary of Chapter 3: Transport Layer

This document provides a summary of the lecture material based on the file "Chapter_3_v8.2-2.pdf".

## 1. Transport-Layer Services and Multiplexing [Slides 2-17]

* **Transport vs. Network Layer:** The network layer provides logical communication between *hosts*, while the transport layer provides logical communication between application *processes* running on those hosts.
* **Multiplexing (Sender):** Gathering data from multiple application sockets, adding transport headers, and passing the segments to the network layer.
* **Demultiplexing (Receiver):** Using header information to deliver received segments to the correct application socket.
  * *Connectionless (UDP):* Demultiplexes using only the destination port number.
  * *Connection-Oriented (TCP):* Demultiplexes using a 4-tuple (source IP, source port, destination IP, destination port). A server can maintain many simultaneous TCP sockets.

## 2. Connectionless Transport: UDP [Slides 18-30]

* **Overview:** The User Datagram Protocol (UDP) is a "no-frills," bare-bones transport protocol. It provides best-effort, unreliable, and unordered delivery.
* **Why use UDP?** It requires no connection establishment (saving RTT delay), maintains no connection state, has a small header, and features no congestion control (allowing the app to blast data as fast as possible). It's commonly used for streaming multimedia, DNS, and SNMP.
* **UDP Checksum:** Used to detect bit errors in the transmitted segment. The sender treats segment contents as 16-bit integers and takes the 1's complement sum. The receiver computes the checksum to check for mismatches.

## 3. Principles of Reliable Data Transfer (RDT) [Slides 31-69]

The lecture traces the incremental development of a reliable data transfer (rdt) protocol using Finite State Machines (FSMs):
* **rdt 2.0 / 2.1 / 2.2 (Handling Bit Errors):** Uses Acknowledgements (ACKs) and Negative Acknowledgements (NAKs) so the receiver can tell the sender if a packet was corrupted. It introduces **sequence numbers** so the receiver can detect duplicate packets if an ACK is lost or corrupted.
* **rdt 3.0 (Handling Errors and Loss):** Introduces a **countdown timer**. If the sender doesn't receive an ACK within a "reasonable" amount of time, it assumes the packet (or ACK) was lost and retransmits. This is a "stop-and-wait" protocol, which severely limits network utilization.
* **Pipelining:** To improve utilization, senders can have multiple "in-flight" packets. This requires buffering and larger sequence numbers.
  * **Go-Back-N (GBN):** Uses cumulative ACKs. If a timeout occurs, the sender retransmits *all* unacknowledged packets in its window.
  * **Selective Repeat (SR):** The receiver individually ACKs each packet and buffers out-of-order packets. The sender maintains a timer for each packet and only retransmits the specific packet that timed out.

## 4. Connection-Oriented Transport: TCP [Slides 70-95]

* **TCP Characteristics:** Point-to-point, reliable, in-order byte stream, pipelined, and full-duplex. 
* **Sequence Numbers & ACKs:** Sequence numbers count the *byte-stream number* of the first data byte in the segment. ACKs are cumulative, indicating the *next expected byte*.
* **Timeout and RTT:** TCP uses an Exponential Weighted Moving Average (EWMA) to estimate the Round Trip Time (RTT) and set a dynamic timeout interval (`EstimatedRTT + 4*DevRTT`).
* **Fast Retransmit:** If a sender receives 3 duplicate ACKs for the same data, it assumes the packet was lost and retransmits it immediately, without waiting for the timeout.
* **Flow Control:** The receiver advertises its available buffer space in the `rwnd` (receive window) header field. The sender limits its in-flight data to this value to guarantee the receiver's buffer will not overflow.
* **Connection Management:** Uses a **3-way handshake** (SYN, SYN-ACK, ACK) to establish a connection and agree on parameters (like starting sequence numbers). To close a connection, both sides exchange segments with the FIN bit set.

## 5. Principles of Congestion Control [Slides 96-109]

* **Congestion:** Occurs when too many sources send data too fast for the network routers to handle, leading to long queueing delays and dropped packets (buffer overflow).
* **Costs of Congestion:** Wasted network capacity due to retransmissions (both necessary and premature) and dropped packets that waste upstream transmission bandwidth.
* **Approaches:** 
  * *End-to-End:* Congestion is inferred by the end systems based on observed packet loss and delay (used by TCP).
  * *Network-Assisted:* Routers provide direct feedback (e.g., setting a bit in the header) to senders/receivers to indicate congestion levels.

## 6. TCP Congestion Control [Slides 110-125]

* **AIMD (Additive Increase, Multiplicative Decrease):** The sender increases its window size (cwnd) by 1 MSS every RTT to probe for bandwidth, and cuts it in half when loss is detected, creating a "sawtooth" rate pattern.
* **Phases:**
  * *Slow Start:* Starts at `cwnd = 1` and doubles the rate every RTT (exponential growth) until the first loss or until `ssthresh` (slow start threshold) is reached.
  * *Congestion Avoidance:* Once `ssthresh` is reached, TCP grows `cwnd` linearly (additive increase).
* **TCP CUBIC:** An optimized version of TCP (default in Linux) that quickly ramps back up to the previous maximum window size (`Wmax`) after a loss, then slows down its increase as it gets closer to `Wmax` to prevent sudden congestion.
* **Delay-based TCP (e.g., BBR):** Attempts to keep the bottleneck link "just full enough" by tracking the minimum RTT and adjusting the rate before packets are actually dropped.
* **ECN (Explicit Congestion Notification):** A network-assisted method where routers mark the IP header if they are congested. The receiver echoes this back to the sender via the TCP ACK header (ECE bit).
* **Fairness:** Ideally, $K$ TCP sessions sharing a bottleneck link of bandwidth $R$ will naturally converge to a fair share of $R/K$. However, UDP traffic and applications opening multiple parallel TCP connections (like web browsers) can circumvent this fairness.

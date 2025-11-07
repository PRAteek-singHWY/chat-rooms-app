# 💬 Chat Rooms App

A **real-time, room-based chat application** built to be horizontally scalable.  
This project demonstrates a **production-ready WebSocket architecture** where multiple Node.js server instances run in parallel — all stateless and synchronized through a central **Redis Pub/Sub message broker**.

---

## 🖥️ Live Scaling Demo With Clients(Sockets) on Two Different Servers using PUB-SUB

<img width="1691" height="1106" alt="image" src="https://github.com/user-attachments/assets/d0156a80-be8f-4f72-bed0-7802f1991765" />


In the final architecture (Step 3), multiple servers can handle users in the same room seamlessly.

- 🧩 On the **left**, a user is connected to a server on **port 8080**  
- 🧩 On the **right**, another user is connected to a different server on **port 8081**  
- 🔄 Both stay perfectly in sync via **Redis Pub/Sub**, allowing smooth, real-time communication between all clients

---

## 🚀 Core Features

- ⚡ **Real-time Messaging:** Blazing-fast, low-latency communication using WebSockets  
- 🧱 **Isolated Chat Rooms:** Users can join or create custom rooms — messages stay sandboxed  
- 🔔 **System Notifications:** “User joined” and “User left” events broadcast live  
- 🎨 **Colored Usernames:** Each user gets a random color for easy identification  
- 🌐 **Horizontally Scalable:** Runs across any number of servers using Redis Pub/Sub

---

## 🏗️ Technical Architecture — The 3-Step Journey

This project evolved through three stages to reach a scalable, production-ready architecture.

### 🥇 Step 1 — Simple Broadcast
- A minimal WebSocket server that broadcasted every message to all clients.
- Purpose: verify the real-time connection.

---

### 🥈 Step 2 — In-Memory Rooms
- Added support for **isolated chat rooms** using:
  ```ts
  const rooms = new Map<string, Set<WebSocket>>();

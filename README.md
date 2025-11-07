# 💬 Chat Rooms App

A **real-time, room-based chat application** built to be horizontally scalable. This project demonstrates a **production-ready architecture** where multiple server instances can run in parallel, all stateless and coordinated by a central **Redis Pub/Sub message broker**.

---

## 🖥️ Live Scaling Demo With Clients(Sockets) on Different Servers using PUB-SUB


The image below shows the application running in its final **"Step 3"** architecture.


<img width="1691" height="1106" alt="image" src="https://github.com/user-attachments/assets/7c297162-92f2-4243-aab1-a757c69c3bb3" />


* On the **left**, a user is connected to a server on **port 8080**.
* On the **right**, another user is in the same room but connected to a completely separate server on **port 8081**.

Thanks to the **Redis Pub/Sub** model, both servers are in sync, and users can chat seamlessly.





---

## 🚀 Core Features

* ⚡ **Real-time Messaging:** Blazing fast, low-latency chat via WebSockets.
* 🧱 **Isolated Chat Rooms:** Join or create custom rooms. Communication is sandboxed to only room members.
* 🔔 **System Messages:** Real-time "User joined" and "User left" notifications.
* 🎨 **Colored Usernames:** Each user is assigned a random color for better readability.
* 🌐 **Horizontally Scalable:** Runs across any number of servers without code changes.

---

## 🏗️ Technical Architecture & The 3-Step Journey

This project was built in three distinct stages, evolving from a simple demo to a scalable system.

### **Step 1: Simple Broadcast**

A basic WebSocket server that broadcasted any received message to all other connected clients. Proved the connection.

### **Step 2: In-Memory Rooms**

The server was upgraded to handle isolated rooms. It used in-memory Map objects to track which clients were in which rooms.

```js
const rooms = new Map();
```

**Limitation:** This state existed only in one server's RAM. This architecture cannot scale, as a server in Tokyo would have no idea what was in a server's RAM in New York.

### **Step 3: Scalable Pub/Sub with Redis (Final)**

This is the final, production-ready architecture. The server's in-memory state was removed and **decoupled** by introducing Redis.

* **WebSocket Server (Node.js):** Still manages the client WebSocket connections. It is now stateless.
* **Redis (Pub/Sub):** Acts as the central post office or message broker.

#### The Flow

1. When a server receives a chat message, it does not send it to other clients. It **PUBLISHes** the message to a specific Redis channel (e.g., `room-123`).
2. All server instances (including the one that sent it) are **SUBSCRIBED** to that channel.
3. Redis instantly broadcasts the message to all subscribed servers.
4. The servers then forward that message to their local WebSocket clients in that room.

✅ This model allows for near-infinite scaling. You can add more Node.js servers as you get more users, and they all stay in sync through Redis.

---

## 🧠 A Note on Threading (Single-Threaded vs. Multi-Process)

A common question: *How does Node.js handle thousands of users if it's single-threaded?*

* **No Multithreading:** Node.js runs on a single thread using a non-blocking event loop. It's efficient at handling I/O operations (like WebSocket messages) without waiting for them, letting a single thread juggle thousands of connections.
* **Multi-Process (Scaling Method):** The app scales by running multiple Node.js processes (on different ports or machines). Each process is its own single-threaded event loop. This is **horizontal scaling**, not multithreading.

---

## 🧰 Technology Stack

| Layer                | Technology                |
| -------------------- | ------------------------- |
| **Frontend**         | React, Vite, Tailwind CSS |
| **Backend**          | Node.js, TypeScript       |
| **Real-time**        | WebSocket (`ws`)          |
| **Message Broker**   | Redis (Pub/Sub)           |
| **Containerization** | Docker (for Redis server) |

---

## ⚙️ How to Run This Project Locally

### 🧩 Prerequisites

* Node.js (v18+)
* Docker Desktop (running)

### **1. Start the Redis Server**

```bash
docker run -d -p 6379:6379 --name my-chat-redis redis
```

Check if it’s running:

```bash
docker ps
```

### **2. Set Up & Run the Backend**

```bash
cd backend
npm install
npm run dev
```

Server starts at: **[http://localhost:8080](http://localhost:8080)**

### **3. Set Up & Run the Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: **[http://localhost:5173](http://localhost:5173)** (or similar)

### **4. Test the Scaling (The Fun Part!)**

1. Stop your backend server (Ctrl + C)
2. Open two new backend terminals:

**Terminal A:**

```bash
PORT=8080 npm run dev
```

**Terminal B:**

```bash
PORT=8081 npm run dev
```

Now open two browsers:

* Browser A → [http://localhost:5173/?port=8080](http://localhost:5173/?port=8080)
* Browser B → [http://localhost:5173/?port=8081](http://localhost:5173/?port=8081)

Join the same room — chat between users on **different servers**! 🎉

---

## 🧩 Architecture Overview

```
Browser A ---> WS Server (8080) ---> Redis Pub/Sub <--- WS Server (8081) <--- Browser B
                           ↑                                     ↑
                           |_____________________________________|
                               Messages stay in sync instantly ⚡
```

---

## 🪶 License

This project is licensed under the **MIT License**.

---

### 💡 Summary

* Built with modern technologies: React, Node.js, Redis
* Real-time chat via WebSockets
* Horizontally scalable and stateless
* A great foundation for real-world systems like Discord, Slack, or WhatsApp 🚀

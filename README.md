<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:4F46E5,30:3B82F6,60:06B6D4,100:22C55E&text=Real-Time%20Collaborative%20Drawing%20Canvas&fontAlignY=40&fontSize=42&fontColor=ffffff&animation=fadeIn"/>

<p align="center">

<img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=600&size=24&duration=3500&pause=800&color=38BDF8&center=true&vCenter=true&width=900&lines=Frontend+R%26D+Assignment;Vanilla+TypeScript+%7C+HTML5+Canvas;Real-Time+WebSocket+Collaboration;Global+Undo+Redo;Performance+Optimized+Architecture"/>

</p>

<br>

<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express"/>
<img src="https://img.shields.io/badge/HTML5_Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
<img src="https://img.shields.io/badge/No_Framework-111827?style=for-the-badge"/>

</div>

---

# 🚀 Overview

A high-performance **real-time collaborative drawing platform** built from scratch using **TypeScript**, **HTML5 Canvas**, **Node.js**, and **Socket.IO**.

The project demonstrates low-latency synchronization, shared state management, canvas rendering optimization, and scalable real-time communication without relying on frontend frameworks or drawing libraries.

---

# ✨ Live Features

<table>
<tr>
<td width="50%">

## 🎨 Drawing

- Brush Tool
- Eraser Tool
- Unlimited Colors
- Adjustable Stroke Width
- Mouse Support
- Touch Support
- Pen Support
- Smooth Drawing Engine

</td>

<td width="50%">

## 🌍 Collaboration

- Multi-user Rooms
- Live Synchronization
- Cursor Presence
- Online User List
- Automatic Reconnection
- Shared Canvas State

</td>
</tr>
</table>

---

# ⚡ Advanced Features

| Feature | Status |
|---------|:------:|
| Global Undo | ✅ |
| Global Redo | ✅ |
| Shared Clear Canvas | ✅ |
| Canvas Recovery | ✅ |
| FPS Monitor | ✅ |
| Latency Monitor | ✅ |
| Keyboard Shortcuts | ✅ |
| Toast Notifications | ✅ |
| Performance Optimizations | ✅ |

---

# 🏗 System Architecture

```text
                        Browser
                            │
                     Pointer Events
                            │
                            ▼
                 Drawing Engine (Canvas)
                            │
                            ▼
                  Stroke Serialization
                            │
                            ▼
                   Socket.IO Client
                            │
═══════════════════════════════════════════════
                    WebSocket Layer
═══════════════════════════════════════════════
                            │
                            ▼
                Express + Socket.IO Server
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
 Room Manager        History Manager      Broadcast Engine
        │                   │                    │
        └───────────────────┼────────────────────┘
                            ▼
                   All Connected Clients
```

---

# 📁 Project Structure

```text
collaborative-canvas/

├── client/
│   ├── canvas.ts
│   ├── websocket.ts
│   ├── users.ts
│   ├── ui.ts
│   ├── toast.ts
│   ├── metrics.ts
│   ├── main.ts
│   ├── style.css
│   └── index.html
│
├── server/
│   ├── server.ts
│   ├── rooms.ts
│   └── drawing-state.ts
│
├── shared/
│   └── protocol.ts
│
├── public/
│
├── README.md
└── ARCHITECTURE.md
```

---

# ⚙ Tech Stack

| Layer | Technology |
|---------|------------|
| Language | TypeScript |
| Graphics | HTML5 Canvas API |
| Backend | Node.js |
| Server | Express |
| Real-Time | Socket.IO |
| Communication | WebSocket |

---

# ⚡ Performance Optimizations

```text
✓ requestAnimationFrame Rendering

✓ Pointer Event Coalescing

✓ Point Batching

✓ Device Pixel Ratio Scaling

✓ Incremental Canvas Rendering

✓ Cursor Rate Limiting

✓ Shared Stroke History

✓ Efficient Redraw Strategy
```

---

# 🔄 Synchronization Flow

```text
User Draws

      │

      ▼

Canvas Engine

      │

      ▼

Serialize Stroke

      │

      ▼

Socket.IO

      │

      ▼

Server Validation

      │

      ▼

Broadcast

      │

      ▼

Every Connected Client
```

---

# 🧠 Core Engineering Concepts

- HTML5 Canvas Rendering
- Event Streaming
- Shared State Synchronization
- Global Undo/Redo
- Conflict Resolution
- Real-Time Cursor Tracking
- Room Isolation
- Low-Latency Networking
- Incremental Rendering
- Performance Monitoring

---

# 📸 Screenshots

| Home | Drawing | Collaboration |
|------|----------|---------------|
| *Add Screenshot* | *Add Screenshot* | *Add Screenshot* |

---

# 🎥 Demo

```text
Live Demo:
https://YOUR_DEPLOYMENT_LINK

GitHub:
https://github.com/YOUR_USERNAME/collaborative-canvas
```

---

# ⌨ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **B** | Brush |
| **E** | Eraser |
| **Ctrl + Z** | Undo |
| **Ctrl + Shift + Z** | Redo |
| **Ctrl + Y** | Redo |

---

# 🚀 Future Enhancements

- Shape Drawing
- Text Tool
- Image Support
- Export PNG
- Database Persistence
- Authentication
- Redis Scaling
- CRDT Collaboration
- Infinite Canvas
- Layer System

---

# 📄 Assignment Summary

| Requirement | Status |
|-------------|:------:|
| Vanilla JavaScript / TypeScript | ✅ |
| HTML5 Canvas | ✅ |
| Socket.IO | ✅ |
| Multi-user Drawing | ✅ |
| Cursor Presence | ✅ |
| Global Undo / Redo | ✅ |
| Conflict Handling | ✅ |
| Documentation | ✅ |
| Performance Optimized | ✅ |

---

<div align="center">

## ⭐ Thank you for reviewing this project!

<img src="https://capsule-render.vercel.app/api?type=waving&height=120&section=footer&color=0:22C55E,40:06B6D4,70:3B82F6,100:4F46E5"/>

</div>

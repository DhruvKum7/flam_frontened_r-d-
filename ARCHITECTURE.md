# System Architecture

## Overview

The application follows a client-server architecture.

Clients render drawings locally while the server acts as the authoritative source of truth for rooms, users, and drawing history.

```
                 Browser A
                     │
                     │
         Pointer Events / Canvas
                     │
                     ▼
          Local Drawing Engine
                     │
                     ▼
            WebSocket Client
                     │
══════════════════════════════════════
            Socket.IO Server
══════════════════════════════════════
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
Room Manager   Drawing History   Broadcast Engine
     │               │               │
     └───────────────┼───────────────┘
                     ▼
           Connected Browser Clients
```

---

# Data Flow

## Local Drawing

```
Pointer Down
      │
      ▼
Create Stroke
      │
      ▼
Render Immediately
      │
      ▼
Queue Network Event
      │
      ▼
Socket.IO Server
```

---

## Remote Drawing

```
Receive Stroke Event
        │
        ▼
Deserialize
        │
        ▼
Update Stroke Cache
        │
        ▼
Render on Canvas
```

---

# WebSocket Protocol

## Join Room

Client

```json
{
  "roomId":"design-team",
  "name":"Dhruv"
}
```

Server

```json
{
  "users":[]
}
```

---

## Cursor

```json
{
  "x":0.54,
  "y":0.38
}
```

---

## Stroke Start

```json
{
  "strokeId":"abc123",
  "tool":"brush",
  "color":"#2563EB",
  "width":5,
  "point":{}
}
```

---

## Stroke Points

```json
{
  "strokeId":"abc123",
  "points":[]
}
```

---

## Stroke End

```json
{
  "strokeId":"abc123"
}
```

---

## Undo

```json
{
    "roomId":"design-team"
}
```

---

## Redo

```json
{
    "roomId":"design-team"
}
```

---

# Drawing Pipeline

```
Pointer Event
      │
      ▼
Coordinate Normalization
      │
      ▼
Stroke Builder
      │
      ▼
Canvas Renderer
      │
      ▼
Network Serialization
      │
      ▼
Socket.IO
```

---

# Room Architecture

Every room maintains:

```
Room
 ├── Connected Users
 ├── Cursor Positions
 ├── Active Strokes
 ├── Stroke History
 ├── Undo Stack
 └── Redo Stack
```

---

# Undo / Redo Strategy

Instead of deleting drawings directly, every stroke is stored in history.

Example

```
Stroke 1
Stroke 2
Stroke 3
Stroke 4
```

Undo

```
Stroke 1
Stroke 2
Stroke 3
```

Redo

```
Stroke 1
Stroke 2
Stroke 3
Stroke 4
```

Advantages

- deterministic
- synchronized
- simple broadcasting
- works for every client

---

# Conflict Resolution

Multiple users may draw simultaneously.

The server assigns every completed stroke an ordering.

```
User A
      \
       \
        > Server
       /
User B
```

Clients replay strokes in exactly the same order.

No canvas corruption occurs.

---

# Rendering Strategy

Local strokes

```
Pointer
 ↓
Canvas Immediately
```

Remote strokes

```
Socket Event
      ↓
Canvas
```

History changes

```
Undo
Redo
Reconnect

↓

Complete Canvas Redraw
```

---

# Performance Optimizations

## requestAnimationFrame

Drawing operations are synchronized with the browser rendering cycle.

---

## Point Batching

Instead of sending

```
200 socket events
```

the application sends

```
15–30 batched events
```

reducing network overhead.

---

## Cursor Throttling

Cursor updates

```
≈25 updates / second
```

instead of every pointer movement.

---

## Device Pixel Ratio

Canvas automatically scales for

- Retina displays
- High DPI monitors

---

## Incremental Rendering

Only changed strokes are rendered.

Full redraw happens only when

- Undo
- Redo
- Refresh
- Reconnect

---

# Scalability

Current architecture

```
Single Node Server

↓

~100 concurrent users
```

Future production architecture

```
Load Balancer

       │

 ┌─────┴─────┐

Node 1    Node 2

       │

Redis Adapter

       │

Shared State
```

---

# Failure Handling

The client automatically handles

- reconnect
- invalid payloads
- missing users
- network interruptions
- malformed coordinates

---

# Security Considerations

Current

- Room isolation
- Payload validation

Future

- Authentication
- JWT
- Rate limiting
- HTTPS
- Persistent storage

---

# Design Decisions

| Decision | Reason |
|----------|--------|
| HTML5 Canvas | High-performance rendering |
| TypeScript | Better type safety |
| Socket.IO | Reliable real-time messaging |
| Vanilla JS | Demonstrates core frontend skills |
| Global history | Deterministic undo/redo |
| requestAnimationFrame | Smooth rendering |
| Point batching | Lower bandwidth |
| Room architecture | Easy scalability |

---

# Future Improvements

- Infinite canvas
- Layers
- Shapes
- Text tool
- Image upload
- Export PNG
- Redis Pub/Sub
- CRDT synchronization
- Persistent storage
- User authentication
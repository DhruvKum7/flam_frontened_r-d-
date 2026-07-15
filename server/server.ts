import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";

import type {
  JoinRoomPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload
} from "../shared/protocol";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const port = Number(process.env.PORT) || 3000;

const clientDirectory = path.join(process.cwd(), "client");
const publicDirectory = path.join(process.cwd(), "public");

app.use(express.static(clientDirectory));
app.use(express.static(publicDirectory));

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "collaborative-canvas"
  });
});

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.emit("connection-ready", {
    userId: socket.id
  });

  socket.on("join-room", (payload: JoinRoomPayload) => {
    const roomId = payload.roomId.trim();

    if (!roomId) {
      return;
    }

    socket.join(roomId);

    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on(
    "stroke-start",
    (payload: StrokeStartPayload) => {
      if (!payload.roomId || !payload.strokeId) {
        return;
      }

      socket
        .to(payload.roomId)
        .emit("stroke-start", payload);
    }
  );

  socket.on(
    "stroke-points",
    (payload: StrokePointsPayload) => {
      if (
        !payload.roomId ||
        !payload.strokeId ||
        !Array.isArray(payload.points)
      ) {
        return;
      }

      socket
        .to(payload.roomId)
        .emit("stroke-points", payload);
    }
  );

  socket.on(
    "stroke-end",
    (payload: StrokeEndPayload) => {
      if (!payload.roomId || !payload.strokeId) {
        return;
      }

      socket
        .to(payload.roomId)
        .emit("stroke-end", payload);
    }
  );

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
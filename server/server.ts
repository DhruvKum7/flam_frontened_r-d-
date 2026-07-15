import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";

import type {
  CursorMovePayload,
  JoinRoomPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload
} from "../shared/protocol";

import { RoomManager } from "./rooms";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const roomManager = new RoomManager();

const port = Number(process.env.PORT) || 3000;

const clientDirectory = path.join(
  process.cwd(),
  "client"
);

const publicDirectory = path.join(
  process.cwd(),
  "public"
);

app.use(express.static(clientDirectory));
app.use(express.static(publicDirectory));

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "collaborative-canvas"
  });
});

io.on("connection", (socket) => {
  let currentRoomId: string | null = null;

  console.log(`Connected: ${socket.id}`);

  socket.emit("connection-ready", {
    userId: socket.id
  });

  socket.on(
    "join-room",
    (payload: JoinRoomPayload) => {
      const roomId = payload.roomId.trim();

      if (!roomId) {
        return;
      }

      if (currentRoomId) {
        const previousRoomId = currentRoomId;

        socket.leave(previousRoomId);

        roomManager.removeUser(
          previousRoomId,
          socket.id
        );

        socket.to(previousRoomId).emit(
          "user-left",
          {
            userId: socket.id
          }
        );

        io.to(previousRoomId).emit(
          "room-users",
          {
            users:
              roomManager.getUsers(previousRoomId)
          }
        );
      }

      currentRoomId = roomId;

      socket.join(roomId);

      roomManager.addUser(
        roomId,
        socket.id,
        payload.name
      );

      io.to(roomId).emit("room-users", {
        users: roomManager.getUsers(roomId)
      });

      console.log(
        `${socket.id} joined room ${roomId}`
      );
    }
  );

  socket.on(
    "cursor-move",
    (payload: CursorMovePayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId
      ) {
        return;
      }

      if (
        !Number.isFinite(payload.x) ||
        !Number.isFinite(payload.y)
      ) {
        return;
      }

      const user = roomManager.getUser(
        currentRoomId,
        socket.id
      );

      if (!user) {
        return;
      }

      socket.to(currentRoomId).emit(
        "cursor-move",
        {
          userId: user.id,
          name: user.name,
          color: user.color,
          x: Math.min(1, Math.max(0, payload.x)),
          y: Math.min(1, Math.max(0, payload.y))
        }
      );
    }
  );

  socket.on(
    "stroke-start",
    (payload: StrokeStartPayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId ||
        !payload.strokeId
      ) {
        return;
      }

      socket.to(currentRoomId).emit(
        "stroke-start",
        payload
      );
    }
  );

  socket.on(
    "stroke-points",
    (payload: StrokePointsPayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId ||
        !payload.strokeId ||
        !Array.isArray(payload.points)
      ) {
        return;
      }

      socket.to(currentRoomId).emit(
        "stroke-points",
        payload
      );
    }
  );

  socket.on(
    "stroke-end",
    (payload: StrokeEndPayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId ||
        !payload.strokeId
      ) {
        return;
      }

      socket.to(currentRoomId).emit(
        "stroke-end",
        payload
      );
    }
  );

  socket.on("disconnect", () => {
    if (currentRoomId) {
      roomManager.removeUser(
        currentRoomId,
        socket.id
      );

      socket.to(currentRoomId).emit(
        "user-left",
        {
          userId: socket.id
        }
      );

      io.to(currentRoomId).emit(
        "room-users",
        {
          users:
            roomManager.getUsers(currentRoomId)
        }
      );
    }

    console.log(`Disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(
    `Server running at http://localhost:${port}`
  );
});
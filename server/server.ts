import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";

import type {

    ClearCanvasRequestPayload,
  CursorMovePayload,
  JoinRoomPayload,
  RedoRequestPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload,
  UndoRequestPayload
} from "../shared/protocol";

import { DrawingStateManager } from "./drawing-state";
import { RoomManager } from "./rooms";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const roomManager = new RoomManager();
const drawingStateManager = new DrawingStateManager();

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
      const roomId =
        typeof payload.roomId === "string"
          ? payload.roomId.trim().slice(0, 40)
          : "";

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
        typeof payload.name === "string"
          ? payload.name
          : "Anonymous"
      );

      io.to(roomId).emit("room-users", {
        users: roomManager.getUsers(roomId)
      });

      const historyState =
        drawingStateManager.getHistoryState(roomId);

      socket.emit("canvas-state", {
        strokes:
          drawingStateManager.getHistory(roomId),
        canUndo: historyState.canUndo,
        canRedo: historyState.canRedo
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
          x: Math.min(
            1,
            Math.max(0, payload.x)
          ),
          y: Math.min(
            1,
            Math.max(0, payload.y)
          )
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

      drawingStateManager.startStroke(
        currentRoomId,
        socket.id,
        {
          id: payload.strokeId,
          tool: payload.tool,
          color: payload.color,
          width: payload.width,
          point: payload.point
        }
      );

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

      drawingStateManager.addPoints(
        currentRoomId,
        payload.strokeId,
        payload.points
      );

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

      drawingStateManager.endStroke(
        currentRoomId,
        payload.strokeId
      );

      socket.to(currentRoomId).emit(
        "stroke-end",
        payload
      );

      io.to(currentRoomId).emit(
        "history-state",
        drawingStateManager.getHistoryState(
          currentRoomId
        )
      );
    }
  );

  socket.on(
    "undo-request",
    (payload: UndoRequestPayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId
      ) {
        return;
      }

      const undoneStroke =
        drawingStateManager.undo(
          currentRoomId
        );

      if (!undoneStroke) {
        return;
      }

      io.to(currentRoomId).emit(
        "canvas-state",
        {
          strokes:
            drawingStateManager.getHistory(
              currentRoomId
            ),
          ...drawingStateManager.getHistoryState(
            currentRoomId
          )
        }
      );
    }
  );

  socket.on(
    "redo-request",
    (payload: RedoRequestPayload) => {
      if (
        !currentRoomId ||
        payload.roomId !== currentRoomId
      ) {
        return;
      }

      const redoneStroke =
        drawingStateManager.redo(
          currentRoomId
        );

      if (!redoneStroke) {
        return;
      }

      io.to(currentRoomId).emit(
        "canvas-state",
        {
          strokes:
            drawingStateManager.getHistory(
              currentRoomId
            ),
          ...drawingStateManager.getHistoryState(
            currentRoomId
          )
        }
      );
    }
  );
  socket.on(
  "clear-canvas-request",
  (payload: ClearCanvasRequestPayload) => {
    if (
      !currentRoomId ||
      payload.roomId !== currentRoomId
    ) {
      return;
    }

    drawingStateManager.clearRoom(
      currentRoomId
    );

    io.to(currentRoomId).emit(
      "canvas-cleared",
      {
        canUndo: false,
        canRedo: false
      }
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
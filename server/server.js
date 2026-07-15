"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var http_1 = require("http");
var path_1 = require("path");
var socket_io_1 = require("socket.io");
var drawing_state_1 = require("./drawing-state");
var rooms_1 = require("./rooms");
var app = (0, express_1.default)();
var httpServer = http_1.default.createServer(app);
var io = new socket_io_1.Server(httpServer);
var roomManager = new rooms_1.RoomManager();
var drawingStateManager = new drawing_state_1.DrawingStateManager();
var port = Number(process.env.PORT) || 3000;
var clientDirectory = path_1.default.join(process.cwd(), "client");
var publicDirectory = path_1.default.join(process.cwd(), "public");
app.use(express_1.default.static(clientDirectory));
app.use(express_1.default.static(publicDirectory));
app.get("/health", function (_request, response) {
    response.status(200).json({
        status: "ok",
        service: "collaborative-canvas"
    });
});
io.on("connection", function (socket) {
    var currentRoomId = null;
    console.log("Connected: ".concat(socket.id));
    socket.emit("connection-ready", {
        userId: socket.id
    });
    socket.on("latency-ping", function (payload) {
        if (!Number.isFinite(payload.sentAt)) {
            return;
        }
        socket.emit("latency-pong", {
            sentAt: payload.sentAt
        });
    });
    socket.on("join-room", function (payload) {
        var roomId = typeof payload.roomId === "string"
            ? payload.roomId.trim().slice(0, 40)
            : "";
        if (!roomId) {
            return;
        }
        if (currentRoomId) {
            var previousRoomId = currentRoomId;
            socket.leave(previousRoomId);
            roomManager.removeUser(previousRoomId, socket.id);
            socket.to(previousRoomId).emit("user-left", {
                userId: socket.id
            });
            io.to(previousRoomId).emit("room-users", {
                users: roomManager.getUsers(previousRoomId)
            });
        }
        currentRoomId = roomId;
        socket.join(roomId);
        roomManager.addUser(roomId, socket.id, typeof payload.name === "string"
            ? payload.name
            : "Anonymous");
        io.to(roomId).emit("room-users", {
            users: roomManager.getUsers(roomId)
        });
        var historyState = drawingStateManager.getHistoryState(roomId);
        socket.emit("canvas-state", {
            strokes: drawingStateManager.getHistory(roomId),
            canUndo: historyState.canUndo,
            canRedo: historyState.canRedo
        });
        console.log("".concat(socket.id, " joined room ").concat(roomId));
    });
    socket.on("cursor-move", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId) {
            return;
        }
        if (!Number.isFinite(payload.x) ||
            !Number.isFinite(payload.y)) {
            return;
        }
        var user = roomManager.getUser(currentRoomId, socket.id);
        if (!user) {
            return;
        }
        socket.to(currentRoomId).emit("cursor-move", {
            userId: user.id,
            name: user.name,
            color: user.color,
            x: Math.min(1, Math.max(0, payload.x)),
            y: Math.min(1, Math.max(0, payload.y))
        });
    });
    socket.on("stroke-start", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId ||
            !payload.strokeId) {
            return;
        }
        drawingStateManager.startStroke(currentRoomId, socket.id, {
            id: payload.strokeId,
            tool: payload.tool,
            color: payload.color,
            width: payload.width,
            point: payload.point
        });
        socket.to(currentRoomId).emit("stroke-start", payload);
    });
    socket.on("stroke-points", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId ||
            !payload.strokeId ||
            !Array.isArray(payload.points)) {
            return;
        }
        drawingStateManager.addPoints(currentRoomId, payload.strokeId, payload.points);
        socket.to(currentRoomId).emit("stroke-points", payload);
    });
    socket.on("stroke-end", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId ||
            !payload.strokeId) {
            return;
        }
        drawingStateManager.endStroke(currentRoomId, payload.strokeId);
        socket.to(currentRoomId).emit("stroke-end", payload);
        io.to(currentRoomId).emit("history-state", drawingStateManager.getHistoryState(currentRoomId));
    });
    socket.on("undo-request", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId) {
            return;
        }
        var undoneStroke = drawingStateManager.undo(currentRoomId);
        if (!undoneStroke) {
            return;
        }
        io.to(currentRoomId).emit("canvas-state", __assign({ strokes: drawingStateManager.getHistory(currentRoomId) }, drawingStateManager.getHistoryState(currentRoomId)));
    });
    socket.on("redo-request", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId) {
            return;
        }
        var redoneStroke = drawingStateManager.redo(currentRoomId);
        if (!redoneStroke) {
            return;
        }
        io.to(currentRoomId).emit("canvas-state", __assign({ strokes: drawingStateManager.getHistory(currentRoomId) }, drawingStateManager.getHistoryState(currentRoomId)));
    });
    socket.on("clear-canvas-request", function (payload) {
        if (!currentRoomId ||
            payload.roomId !== currentRoomId) {
            return;
        }
        drawingStateManager.clearRoom(currentRoomId);
        io.to(currentRoomId).emit("canvas-cleared", {
            canUndo: false,
            canRedo: false
        });
    });
    socket.on("disconnect", function () {
        if (currentRoomId) {
            roomManager.removeUser(currentRoomId, socket.id);
            socket.to(currentRoomId).emit("user-left", {
                userId: socket.id
            });
            io.to(currentRoomId).emit("room-users", {
                users: roomManager.getUsers(currentRoomId)
            });
        }
        console.log("Disconnected: ".concat(socket.id));
    });
});
httpServer.listen(port, function () {
    console.log("Server running at http://localhost:".concat(port));
});

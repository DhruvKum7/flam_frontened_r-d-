"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var canvas_1 = require("./canvas");
var metrics_1 = require("./metrics");
var ui_1 = require("./ui");
var users_1 = require("./users");
var websocket_1 = require("./websocket");
var canvasElement = document.querySelector("#drawingCanvas");
var fpsElement = document.querySelector("#fpsValue");
var latencyElement = document.querySelector("#latencyValue");
var connectionStatus = document.querySelector("#connectionStatus");
var usersList = document.querySelector("#usersList");
var cursorsContainer = document.querySelector("#remoteCursors");
var roomNameElement = document.querySelector("#roomName");
if (!canvasElement ||
    !fpsElement ||
    !latencyElement ||
    !connectionStatus ||
    !usersList ||
    !cursorsContainer ||
    !roomNameElement) {
    throw new Error("Required page elements are missing.");
}
var metrics = new metrics_1.PerformanceMetrics(fpsElement, latencyElement);
var queryParameters = new URLSearchParams(window.location.search);
var roomId = ((_a = queryParameters
    .get("room")) === null || _a === void 0 ? void 0 : _a.trim().slice(0, 40)) ||
    "main-room";
var userName = ((_b = queryParameters
    .get("name")) === null || _b === void 0 ? void 0 : _b.trim().slice(0, 24)) ||
    "";
if (!userName) {
    userName =
        ((_c = window
            .prompt("Enter your display name")) === null || _c === void 0 ? void 0 : _c.trim().slice(0, 24)) ||
            "Guest-".concat(Math.floor(Math.random() * 1000));
}
roomNameElement.textContent = roomId;
var userPresence = new users_1.UserPresence(usersList, cursorsContainer);
var toolbar = new ui_1.Toolbar();
var socketClient = null;
var drawingCanvas = new canvas_1.DrawingCanvas(canvasElement, {
    onStrokeStart: function (payload) {
        socketClient === null || socketClient === void 0 ? void 0 : socketClient.sendStrokeStart(payload);
    },
    onStrokePoints: function (payload) {
        socketClient === null || socketClient === void 0 ? void 0 : socketClient.sendStrokePoints(payload);
    },
    onStrokeEnd: function (payload) {
        socketClient === null || socketClient === void 0 ? void 0 : socketClient.sendStrokeEnd(payload);
    }
});
socketClient = new websocket_1.WebSocketClient(connectionStatus, roomId, userName, {
    onConnected: function (userId) {
        userPresence.setCurrentUser(userId);
    },
    onLatencyUpdate: function (latency) {
        metrics.updateLatency(latency);
    },
    onRoomUsers: function (_a) {
        var users = _a.users;
        userPresence.renderUsers(users);
    },
    onCursorMove: function (payload) {
        userPresence.updateRemoteCursor(payload);
    },
    onUserLeft: function (_a) {
        var userId = _a.userId;
        userPresence.removeUser(userId);
    },
    onStrokeStart: function (payload) {
        drawingCanvas.beginRemoteStroke(payload);
    },
    onStrokePoints: function (payload) {
        drawingCanvas.drawRemotePoints(payload);
    },
    onStrokeEnd: function (payload) {
        drawingCanvas.endRemoteStroke(payload);
    },
    onCanvasState: function (payload) {
        drawingCanvas.renderCanvasState(payload.strokes);
        toolbar.setHistoryState(payload.canUndo, payload.canRedo);
    },
    onHistoryState: function (payload) {
        toolbar.setHistoryState(payload.canUndo, payload.canRedo);
    },
    onCanvasCleared: function (payload) {
        drawingCanvas.clearCanvas();
        toolbar.setHistoryState(payload.canUndo, payload.canRedo);
    }
});
toolbar.onToolChange(function (tool) {
    drawingCanvas.setTool(tool);
});
toolbar.onColorChange(function (color) {
    drawingCanvas.setColor(color);
});
toolbar.onWidthChange(function (width) {
    drawingCanvas.setWidth(width);
});
toolbar.onUndo(function () {
    socketClient === null || socketClient === void 0 ? void 0 : socketClient.requestUndo();
});
toolbar.onRedo(function () {
    socketClient === null || socketClient === void 0 ? void 0 : socketClient.requestRedo();
});
toolbar.onClear(function () {
    var confirmed = window.confirm("Clear the canvas for everyone in this room?");
    if (!confirmed) {
        return;
    }
    socketClient === null || socketClient === void 0 ? void 0 : socketClient.requestClearCanvas();
});
var lastCursorSentAt = 0;
canvasElement.addEventListener("pointermove", function (event) {
    var currentTime = performance.now();
    if (currentTime -
        lastCursorSentAt <
        40) {
        return;
    }
    lastCursorSentAt = currentTime;
    var bounds = canvasElement
        .getBoundingClientRect();
    if (bounds.width === 0 ||
        bounds.height === 0) {
        return;
    }
    var normalizedX = (event.clientX - bounds.left) /
        bounds.width;
    var normalizedY = (event.clientY - bounds.top) /
        bounds.height;
    socketClient === null || socketClient === void 0 ? void 0 : socketClient.sendCursorPosition(Math.min(1, Math.max(0, normalizedX)), Math.min(1, Math.max(0, normalizedY)));
});
document.addEventListener("keydown", function (event) {
    var modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed) {
        return;
    }
    if (event.key.toLowerCase() !== "z") {
        return;
    }
    event.preventDefault();
    if (event.shiftKey) {
        socketClient === null || socketClient === void 0 ? void 0 : socketClient.requestRedo();
    }
    else {
        socketClient === null || socketClient === void 0 ? void 0 : socketClient.requestUndo();
    }
});
var resizeTimer = null;
window.addEventListener("resize", function () {
    if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
    }
    resizeTimer =
        window.setTimeout(function () {
            drawingCanvas.resize();
            resizeTimer = null;
        }, 150);
});

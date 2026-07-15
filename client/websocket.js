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
exports.WebSocketClient = void 0;
var WebSocketClient = /** @class */ (function () {
    function WebSocketClient(statusElement, roomId, userName, handlers) {
        this.latencyTimer = null;
        this.socket = io();
        this.roomId = roomId;
        this.userName = userName;
        this.attachConnectionEvents(statusElement, handlers);
        this.attachRoomEvents(handlers);
        this.attachDrawingEvents(handlers);
        this.attachHistoryEvents(handlers);
        this.startLatencyMeasurement(handlers);
    }
    WebSocketClient.prototype.sendCursorPosition = function (x, y) {
        var payload = {
            roomId: this.roomId,
            x: x,
            y: y
        };
        this.socket.emit("cursor-move", payload);
    };
    WebSocketClient.prototype.sendStrokeStart = function (payload) {
        this.socket.emit("stroke-start", __assign(__assign({}, payload), { roomId: this.roomId }));
    };
    WebSocketClient.prototype.sendStrokePoints = function (payload) {
        this.socket.emit("stroke-points", __assign(__assign({}, payload), { roomId: this.roomId }));
    };
    WebSocketClient.prototype.sendStrokeEnd = function (payload) {
        this.socket.emit("stroke-end", __assign(__assign({}, payload), { roomId: this.roomId }));
    };
    WebSocketClient.prototype.requestUndo = function () {
        var payload = {
            roomId: this.roomId
        };
        this.socket.emit("undo-request", payload);
    };
    WebSocketClient.prototype.requestRedo = function () {
        var payload = {
            roomId: this.roomId
        };
        this.socket.emit("redo-request", payload);
    };
    WebSocketClient.prototype.requestClearCanvas = function () {
        var payload = {
            roomId: this.roomId
        };
        this.socket.emit("clear-canvas-request", payload);
    };
    WebSocketClient.prototype.attachConnectionEvents = function (statusElement, handlers) {
        var _this = this;
        this.socket.on("connect", function () {
            statusElement.textContent =
                "Connected";
            statusElement.classList.remove("disconnected");
            statusElement.classList.add("connected");
            var payload = {
                roomId: _this.roomId,
                name: _this.userName
            };
            _this.socket.emit("join-room", payload);
        });
        this.socket.on("disconnect", function () {
            statusElement.textContent =
                "Disconnected";
            statusElement.classList.remove("connected");
            statusElement.classList.add("disconnected");
        });
        this.socket.on("connection-ready", function (payload) {
            handlers.onConnected(payload.userId);
        });
    };
    WebSocketClient.prototype.attachRoomEvents = function (handlers) {
        this.socket.on("room-users", handlers.onRoomUsers);
        this.socket.on("cursor-move", handlers.onCursorMove);
        this.socket.on("user-left", handlers.onUserLeft);
    };
    WebSocketClient.prototype.attachDrawingEvents = function (handlers) {
        this.socket.on("stroke-start", handlers.onStrokeStart);
        this.socket.on("stroke-points", handlers.onStrokePoints);
        this.socket.on("stroke-end", handlers.onStrokeEnd);
    };
    WebSocketClient.prototype.attachHistoryEvents = function (handlers) {
        this.socket.on("canvas-state", handlers.onCanvasState);
        this.socket.on("history-state", handlers.onHistoryState);
        this.socket.on("canvas-cleared", handlers.onCanvasCleared);
    };
    WebSocketClient.prototype.startLatencyMeasurement = function (handlers) {
        var _this = this;
        this.socket.on("latency-pong", function (payload) {
            if (!Number.isFinite(payload.sentAt)) {
                return;
            }
            var latency = performance.now() -
                payload.sentAt;
            handlers.onLatencyUpdate(latency);
        });
        var sendPing = function () {
            var payload = {
                sentAt: performance.now()
            };
            _this.socket.emit("latency-ping", payload);
        };
        sendPing();
        this.latencyTimer =
            window.setInterval(sendPing, 3000);
    };
    return WebSocketClient;
}());
exports.WebSocketClient = WebSocketClient;

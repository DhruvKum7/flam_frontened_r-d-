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
exports.DrawingStateManager = void 0;
var DrawingStateManager = /** @class */ (function () {
    function DrawingStateManager() {
        this.rooms = new Map();
    }
    DrawingStateManager.prototype.startStroke = function (roomId, userId, stroke) {
        var room = this.getOrCreateRoom(roomId);
        room.activeStrokes.set(stroke.id, {
            id: stroke.id,
            userId: userId,
            tool: stroke.tool,
            color: stroke.color,
            width: stroke.width,
            points: [stroke.point]
        });
    };
    DrawingStateManager.prototype.clearRoom = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        room.sequence = 0;
        room.history = [];
        room.activeStrokes.clear();
        room.redoStack = [];
    };
    DrawingStateManager.prototype.addPoints = function (roomId, strokeId, points) {
        var _a;
        var room = this.rooms.get(roomId);
        var stroke = room === null || room === void 0 ? void 0 : room.activeStrokes.get(strokeId);
        if (!stroke || points.length === 0) {
            return;
        }
        (_a = stroke.points).push.apply(_a, points);
    };
    DrawingStateManager.prototype.endStroke = function (roomId, strokeId) {
        var room = this.rooms.get(roomId);
        var activeStroke = room === null || room === void 0 ? void 0 : room.activeStrokes.get(strokeId);
        if (!room || !activeStroke) {
            return null;
        }
        room.activeStrokes.delete(strokeId);
        var storedStroke = __assign(__assign({}, activeStroke), { sequence: ++room.sequence, active: true });
        room.history.push(storedStroke);
        room.redoStack = [];
        return storedStroke;
    };
    DrawingStateManager.prototype.undo = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }
        for (var index = room.history.length - 1; index >= 0; index--) {
            var stroke = room.history[index];
            if (!stroke.active) {
                continue;
            }
            stroke.active = false;
            room.redoStack.push(stroke.id);
            return stroke;
        }
        return null;
    };
    DrawingStateManager.prototype.redo = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }
        var strokeId = room.redoStack.pop();
        if (!strokeId) {
            return null;
        }
        var stroke = room.history.find(function (item) { return item.id === strokeId; });
        if (!stroke) {
            return null;
        }
        stroke.active = true;
        return stroke;
    };
    DrawingStateManager.prototype.getHistory = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return [];
        }
        return room.history.map(function (stroke) { return (__assign(__assign({}, stroke), { points: stroke.points.map(function (point) { return (__assign({}, point)); }) })); });
    };
    DrawingStateManager.prototype.getHistoryState = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return {
                canUndo: false,
                canRedo: false
            };
        }
        return {
            canUndo: room.history.some(function (stroke) { return stroke.active; }),
            canRedo: room.redoStack.length > 0
        };
    };
    DrawingStateManager.prototype.getOrCreateRoom = function (roomId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            room = {
                sequence: 0,
                history: [],
                activeStrokes: new Map(),
                redoStack: []
            };
            this.rooms.set(roomId, room);
        }
        return room;
    };
    return DrawingStateManager;
}());
exports.DrawingStateManager = DrawingStateManager;

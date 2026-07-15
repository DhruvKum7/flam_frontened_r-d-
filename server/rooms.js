"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
var userColors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#db2777",
    "#4f46e5"
];
var RoomManager = /** @class */ (function () {
    function RoomManager() {
        this.rooms = new Map();
    }
    RoomManager.prototype.addUser = function (roomId, socketId, name) {
        var room = this.rooms.get(roomId);
        if (!room) {
            room = new Map();
            this.rooms.set(roomId, room);
        }
        var user = {
            id: socketId,
            socketId: socketId,
            name: this.cleanName(name),
            color: userColors[room.size % userColors.length]
        };
        room.set(socketId, user);
        return this.toPublicUser(user);
    };
    RoomManager.prototype.removeUser = function (roomId, socketId) {
        var room = this.rooms.get(roomId);
        if (!room) {
            return null;
        }
        var user = room.get(socketId);
        if (!user) {
            return null;
        }
        room.delete(socketId);
        if (room.size === 0) {
            this.rooms.delete(roomId);
        }
        return this.toPublicUser(user);
    };
    RoomManager.prototype.getUser = function (roomId, socketId) {
        var _a;
        var user = (_a = this.rooms
            .get(roomId)) === null || _a === void 0 ? void 0 : _a.get(socketId);
        if (!user) {
            return null;
        }
        return this.toPublicUser(user);
    };
    RoomManager.prototype.getUsers = function (roomId) {
        var _this = this;
        var room = this.rooms.get(roomId);
        if (!room) {
            return [];
        }
        return Array.from(room.values()).map(function (user) {
            return _this.toPublicUser(user);
        });
    };
    RoomManager.prototype.cleanName = function (name) {
        var cleanedName = (name !== null && name !== void 0 ? name : "")
            .trim()
            .slice(0, 24);
        return cleanedName || "Anonymous";
    };
    RoomManager.prototype.toPublicUser = function (user) {
        return {
            id: user.id,
            name: user.name,
            color: user.color
        };
    };
    return RoomManager;
}());
exports.RoomManager = RoomManager;

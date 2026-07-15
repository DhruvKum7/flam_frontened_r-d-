"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPresence = void 0;
var UserPresence = /** @class */ (function () {
    function UserPresence(usersList, cursorsContainer) {
        this.currentUserId = null;
        this.cursorElements = new Map();
        this.usersList = usersList;
        this.cursorsContainer = cursorsContainer;
    }
    UserPresence.prototype.setCurrentUser = function (userId) {
        this.currentUserId = userId;
    };
    UserPresence.prototype.renderUsers = function (users) {
        this.usersList.replaceChildren();
        if (users.length === 0) {
            var emptyItem = document.createElement("li");
            emptyItem.textContent =
                "No users online";
            this.usersList.append(emptyItem);
            return;
        }
        for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
            var user = users_1[_i];
            var item = document.createElement("li");
            item.className = "user-item";
            var colorMarker = document.createElement("span");
            colorMarker.className = "user-color";
            colorMarker.style.backgroundColor =
                user.color;
            var nameElement = document.createElement("span");
            nameElement.className = "user-name";
            nameElement.textContent = user.name;
            item.append(colorMarker, nameElement);
            if (user.id === this.currentUserId) {
                var currentUserLabel = document.createElement("span");
                currentUserLabel.className =
                    "current-user-label";
                currentUserLabel.textContent = "You";
                item.append(currentUserLabel);
            }
            this.usersList.append(item);
        }
    };
    UserPresence.prototype.updateRemoteCursor = function (payload) {
        var cursor = this.cursorElements.get(payload.userId);
        if (!cursor) {
            cursor = this.createCursor(payload);
            this.cursorElements.set(payload.userId, cursor);
            this.cursorsContainer.append(cursor);
        }
        var bounds = this.cursorsContainer
            .getBoundingClientRect();
        var x = payload.x * bounds.width;
        var y = payload.y * bounds.height;
        cursor.style.transform =
            "translate(".concat(x, "px, ").concat(y, "px)");
    };
    UserPresence.prototype.removeUser = function (userId) {
        var cursor = this.cursorElements.get(userId);
        if (!cursor) {
            return;
        }
        cursor.remove();
        this.cursorElements.delete(userId);
    };
    UserPresence.prototype.createCursor = function (payload) {
        var cursor = document.createElement("div");
        cursor.className = "remote-cursor";
        cursor.style.color = payload.color;
        var pointer = document.createElement("div");
        pointer.className =
            "remote-cursor-pointer";
        var label = document.createElement("div");
        label.className =
            "remote-cursor-name";
        label.textContent = payload.name;
        cursor.append(pointer, label);
        return cursor;
    };
    return UserPresence;
}());
exports.UserPresence = UserPresence;

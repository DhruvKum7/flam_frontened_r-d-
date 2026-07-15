"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawingCanvas = void 0;
var DrawingCanvas = /** @class */ (function () {
    function DrawingCanvas(canvas, handlers) {
        var _this = this;
        this.settings = {
            tool: "brush",
            color: "#1f2937",
            width: 5
        };
        this.isDrawing = false;
        this.activePointerId = null;
        this.activeStrokeId = null;
        this.lastRenderedPoint = null;
        this.pendingPoints = [];
        this.networkPoints = [];
        this.animationFrameId = null;
        this.remoteStrokes = new Map();
        this.handlePointerDown = function (event) {
            if (event.pointerType === "mouse" &&
                event.button !== 0) {
                return;
            }
            event.preventDefault();
            _this.isDrawing = true;
            _this.activePointerId =
                event.pointerId;
            _this.activeStrokeId =
                _this.createStrokeId();
            _this.canvas.setPointerCapture(event.pointerId);
            var point = _this.getCanvasPoint(event);
            _this.lastRenderedPoint = point;
            _this.drawDot(point, _this.settings.tool, _this.settings.color, _this.settings.width);
            _this.handlers.onStrokeStart({
                strokeId: _this.activeStrokeId,
                tool: _this.settings.tool,
                color: _this.settings.color,
                width: _this.settings.width,
                point: _this.toNormalizedPoint(point)
            });
        };
        this.handlePointerMove = function (event) {
            if (!_this.isDrawing ||
                _this.activePointerId !==
                    event.pointerId) {
                return;
            }
            event.preventDefault();
            var pointerEvents = typeof event.getCoalescedEvents ===
                "function"
                ? event.getCoalescedEvents()
                : [event];
            for (var _i = 0, pointerEvents_1 = pointerEvents; _i < pointerEvents_1.length; _i++) {
                var pointerEvent = pointerEvents_1[_i];
                var point = _this.getCanvasPoint(pointerEvent);
                var referencePoint = _this.pendingPoints.length > 0
                    ? _this.pendingPoints[_this.pendingPoints.length - 1]
                    : _this.lastRenderedPoint;
                if (!referencePoint) {
                    continue;
                }
                var distance = Math.hypot(point.x - referencePoint.x, point.y - referencePoint.y);
                if (distance < 0.75) {
                    continue;
                }
                _this.pendingPoints.push(point);
                _this.networkPoints.push(_this.toNormalizedPoint(point));
            }
            _this.scheduleRender();
        };
        this.handlePointerUp = function (event) {
            if (_this.activePointerId !==
                event.pointerId ||
                !_this.activeStrokeId) {
                return;
            }
            event.preventDefault();
            var endPoint = _this.getCanvasPoint(event);
            var referencePoint = _this.pendingPoints.length > 0
                ? _this.pendingPoints[_this.pendingPoints.length - 1]
                : _this.lastRenderedPoint;
            if (referencePoint &&
                Math.hypot(endPoint.x - referencePoint.x, endPoint.y - referencePoint.y) >= 0.75) {
                _this.pendingPoints.push(endPoint);
                _this.networkPoints.push(_this.toNormalizedPoint(endPoint));
            }
            _this.renderFrame();
            _this.handlers.onStrokeEnd({
                strokeId: _this.activeStrokeId
            });
            if (_this.canvas.hasPointerCapture(event.pointerId)) {
                _this.canvas.releasePointerCapture(event.pointerId);
            }
            _this.resetLocalStroke();
        };
        var context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Canvas 2D context is unavailable.");
        }
        this.canvas = canvas;
        this.context = context;
        this.handlers = handlers;
        this.configureContext();
        this.attachPointerEvents();
        this.resize();
    }
    DrawingCanvas.prototype.setTool = function (tool) {
        this.settings.tool = tool;
    };
    DrawingCanvas.prototype.setColor = function (color) {
        this.settings.color = color;
    };
    DrawingCanvas.prototype.setWidth = function (width) {
        this.settings.width = Math.min(40, Math.max(1, width));
    };
    DrawingCanvas.prototype.beginRemoteStroke = function (payload) {
        var point = this.toCanvasPoint(payload.point);
        this.remoteStrokes.set(payload.strokeId, {
            tool: payload.tool,
            color: payload.color,
            width: payload.width,
            previousPoint: point
        });
        this.drawDot(point, payload.tool, payload.color, payload.width);
    };
    DrawingCanvas.prototype.drawRemotePoints = function (payload) {
        var remoteStroke = this.remoteStrokes.get(payload.strokeId);
        if (!remoteStroke) {
            return;
        }
        for (var _i = 0, _a = payload.points; _i < _a.length; _i++) {
            var normalizedPoint = _a[_i];
            var point = this.toCanvasPoint(normalizedPoint);
            this.drawSegment(remoteStroke.previousPoint, point, remoteStroke.tool, remoteStroke.color, remoteStroke.width);
            remoteStroke.previousPoint =
                point;
        }
    };
    DrawingCanvas.prototype.endRemoteStroke = function (payload) {
        this.remoteStrokes.delete(payload.strokeId);
    };
    DrawingCanvas.prototype.renderCanvasState = function (strokes) {
        var _this = this;
        this.clearCanvas();
        var orderedStrokes = __spreadArray([], strokes, true).filter(function (stroke) { return stroke.active; })
            .sort(function (first, second) {
            return first.sequence - second.sequence;
        });
        for (var _i = 0, orderedStrokes_1 = orderedStrokes; _i < orderedStrokes_1.length; _i++) {
            var stroke = orderedStrokes_1[_i];
            if (stroke.points.length === 0) {
                continue;
            }
            var canvasPoints = stroke.points.map(function (point) {
                return _this.toCanvasPoint(point);
            });
            this.drawDot(canvasPoints[0], stroke.tool, stroke.color, stroke.width);
            for (var index = 1; index < canvasPoints.length; index++) {
                this.drawSegment(canvasPoints[index - 1], canvasPoints[index], stroke.tool, stroke.color, stroke.width);
            }
        }
    };
    DrawingCanvas.prototype.clearCanvas = function () {
        var bounds = this.canvas.getBoundingClientRect();
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
        var pixelRatio = window.devicePixelRatio || 1;
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        this.configureContext();
        if (bounds.width === 0 ||
            bounds.height === 0) {
            return;
        }
    };
    DrawingCanvas.prototype.resize = function () {
        var bounds = this.canvas.getBoundingClientRect();
        if (bounds.width === 0 ||
            bounds.height === 0) {
            return;
        }
        var pixelRatio = window.devicePixelRatio || 1;
        var snapshot = document.createElement("canvas");
        snapshot.width = this.canvas.width;
        snapshot.height = this.canvas.height;
        var snapshotContext = snapshot.getContext("2d");
        if (snapshotContext &&
            this.canvas.width > 0 &&
            this.canvas.height > 0) {
            snapshotContext.drawImage(this.canvas, 0, 0);
        }
        this.canvas.width = Math.round(bounds.width * pixelRatio);
        this.canvas.height = Math.round(bounds.height * pixelRatio);
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        this.configureContext();
        if (snapshot.width > 0 &&
            snapshot.height > 0) {
            this.context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, bounds.width, bounds.height);
        }
    };
    DrawingCanvas.prototype.configureContext = function () {
        this.context.lineCap = "round";
        this.context.lineJoin = "round";
    };
    DrawingCanvas.prototype.attachPointerEvents = function () {
        this.canvas.addEventListener("pointerdown", this.handlePointerDown);
        this.canvas.addEventListener("pointermove", this.handlePointerMove);
        this.canvas.addEventListener("pointerup", this.handlePointerUp);
        this.canvas.addEventListener("pointercancel", this.handlePointerUp);
    };
    DrawingCanvas.prototype.scheduleRender = function () {
        var _this = this;
        if (this.animationFrameId !== null) {
            return;
        }
        this.animationFrameId =
            window.requestAnimationFrame(function () {
                _this.renderFrame();
                _this.animationFrameId = null;
            });
    };
    DrawingCanvas.prototype.renderFrame = function () {
        this.renderPendingPoints();
        this.sendPendingNetworkPoints();
    };
    DrawingCanvas.prototype.renderPendingPoints = function () {
        if (this.pendingPoints.length === 0 ||
            !this.lastRenderedPoint) {
            return;
        }
        var previousPoint = this.lastRenderedPoint;
        for (var _i = 0, _a = this.pendingPoints; _i < _a.length; _i++) {
            var currentPoint = _a[_i];
            this.drawSegment(previousPoint, currentPoint, this.settings.tool, this.settings.color, this.settings.width);
            previousPoint = currentPoint;
        }
        this.lastRenderedPoint =
            previousPoint;
        this.pendingPoints = [];
    };
    DrawingCanvas.prototype.sendPendingNetworkPoints = function () {
        if (!this.activeStrokeId ||
            this.networkPoints.length === 0) {
            return;
        }
        this.handlers.onStrokePoints({
            strokeId: this.activeStrokeId,
            points: __spreadArray([], this.networkPoints, true)
        });
        this.networkPoints = [];
    };
    DrawingCanvas.prototype.drawSegment = function (from, to, tool, color, width) {
        this.applyStyle(tool, color, width);
        this.context.beginPath();
        this.context.moveTo(from.x, from.y);
        this.context.lineTo(to.x, to.y);
        this.context.stroke();
    };
    DrawingCanvas.prototype.drawDot = function (point, tool, color, width) {
        this.applyStyle(tool, color, width);
        this.context.beginPath();
        this.context.arc(point.x, point.y, width / 2, 0, Math.PI * 2);
        this.context.fill();
    };
    DrawingCanvas.prototype.applyStyle = function (tool, color, width) {
        this.context.lineWidth = width;
        if (tool === "eraser") {
            this.context.globalCompositeOperation =
                "destination-out";
            this.context.strokeStyle =
                "#000000";
            this.context.fillStyle =
                "#000000";
        }
        else {
            this.context.globalCompositeOperation =
                "source-over";
            this.context.strokeStyle =
                color;
            this.context.fillStyle =
                color;
        }
    };
    DrawingCanvas.prototype.getCanvasPoint = function (event) {
        var bounds = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            pressure: event.pressure > 0
                ? event.pressure
                : 0.5
        };
    };
    DrawingCanvas.prototype.toNormalizedPoint = function (point) {
        var bounds = this.canvas.getBoundingClientRect();
        return {
            x: point.x / bounds.width,
            y: point.y / bounds.height,
            pressure: point.pressure
        };
    };
    DrawingCanvas.prototype.toCanvasPoint = function (point) {
        var bounds = this.canvas.getBoundingClientRect();
        return {
            x: point.x * bounds.width,
            y: point.y * bounds.height,
            pressure: point.pressure
        };
    };
    DrawingCanvas.prototype.createStrokeId = function () {
        if (typeof crypto.randomUUID ===
            "function") {
            return crypto.randomUUID();
        }
        return [
            Date.now().toString(36),
            Math.random()
                .toString(36)
                .slice(2)
        ].join("-");
    };
    DrawingCanvas.prototype.resetLocalStroke = function () {
        this.isDrawing = false;
        this.activePointerId = null;
        this.activeStrokeId = null;
        this.lastRenderedPoint = null;
        this.pendingPoints = [];
        this.networkPoints = [];
    };
    return DrawingCanvas;
}());
exports.DrawingCanvas = DrawingCanvas;

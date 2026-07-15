"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = void 0;
var PerformanceMetrics = /** @class */ (function () {
    function PerformanceMetrics(fpsElement, latencyElement) {
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.animationFrameId = null;
        this.fpsElement = fpsElement;
        this.latencyElement = latencyElement;
        this.startFpsCounter();
    }
    PerformanceMetrics.prototype.updateLatency = function (latency) {
        this.latencyElement.textContent =
            Math.max(0, Math.round(latency)).toString();
    };
    PerformanceMetrics.prototype.startFpsCounter = function () {
        var _this = this;
        var measureFrame = function (currentTime) {
            _this.frameCount++;
            var elapsed = currentTime - _this.lastFpsUpdate;
            if (elapsed >= 1000) {
                var fps = Math.round((_this.frameCount * 1000) / elapsed);
                _this.fpsElement.textContent =
                    fps.toString();
                _this.frameCount = 0;
                _this.lastFpsUpdate = currentTime;
            }
            _this.animationFrameId =
                window.requestAnimationFrame(measureFrame);
        };
        this.animationFrameId =
            window.requestAnimationFrame(measureFrame);
    };
    return PerformanceMetrics;
}());
exports.PerformanceMetrics = PerformanceMetrics;

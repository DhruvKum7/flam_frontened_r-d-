"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
var Toolbar = /** @class */ (function () {
    function Toolbar() {
        var brushButton = document.querySelector("#brushButton");
        var clearButton = document.querySelector("#clearButton");
        var eraserButton = document.querySelector("#eraserButton");
        var colorInput = document.querySelector("#colorInput");
        var widthInput = document.querySelector("#widthInput");
        var widthValue = document.querySelector("#widthValue");
        var undoButton = document.querySelector("#undoButton");
        var redoButton = document.querySelector("#redoButton");
        if (!brushButton ||
            !eraserButton ||
            !colorInput ||
            !widthInput ||
            !widthValue ||
            !undoButton ||
            !redoButton || !clearButton) {
            throw new Error("Toolbar elements are missing.");
        }
        this.elements = {
            brushButton: brushButton,
            eraserButton: eraserButton,
            colorInput: colorInput,
            widthInput: widthInput,
            widthValue: widthValue,
            undoButton: undoButton,
            redoButton: redoButton,
            clearButton: clearButton
        };
    }
    Toolbar.prototype.onClear = function (listener) {
        this.elements.clearButton.addEventListener("click", listener);
    };
    Toolbar.prototype.onToolChange = function (listener) {
        var _this = this;
        this.elements.brushButton.addEventListener("click", function () {
            _this.setActiveTool("brush");
            listener("brush");
        });
        this.elements.eraserButton.addEventListener("click", function () {
            _this.setActiveTool("eraser");
            listener("eraser");
        });
    };
    Toolbar.prototype.onColorChange = function (listener) {
        var _this = this;
        this.elements.colorInput.addEventListener("input", function () {
            listener(_this.elements.colorInput.value);
        });
    };
    Toolbar.prototype.onWidthChange = function (listener) {
        var _this = this;
        this.elements.widthInput.addEventListener("input", function () {
            var width = Number(_this.elements.widthInput.value);
            _this.elements.widthValue.textContent =
                width.toString();
            listener(width);
        });
    };
    Toolbar.prototype.onUndo = function (listener) {
        this.elements.undoButton.addEventListener("click", listener);
    };
    Toolbar.prototype.onRedo = function (listener) {
        this.elements.redoButton.addEventListener("click", listener);
    };
    Toolbar.prototype.setHistoryState = function (canUndo, canRedo) {
        this.elements.undoButton.disabled = !canUndo;
        this.elements.redoButton.disabled = !canRedo;
    };
    Toolbar.prototype.setActiveTool = function (tool) {
        var brushSelected = tool === "brush";
        this.elements.brushButton.classList.toggle("active", brushSelected);
        this.elements.eraserButton.classList.toggle("active", !brushSelected);
    };
    return Toolbar;
}());
exports.Toolbar = Toolbar;

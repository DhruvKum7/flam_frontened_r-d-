import { DrawingCanvas } from "./canvas";
import { Toolbar } from "./ui";
import { WebSocketClient } from "./websocket";

const canvasElement =
  document.querySelector<HTMLCanvasElement>(
    "#drawingCanvas"
  );

const connectionStatus =
  document.querySelector<HTMLDivElement>(
    "#connectionStatus"
  );

if (!canvasElement || !connectionStatus) {
  throw new Error("Required page elements are missing.");
}

const roomId =
  new URLSearchParams(window.location.search).get(
    "room"
  ) || "main-room";

let socketClient: WebSocketClient;

const drawingCanvas = new DrawingCanvas(
  canvasElement,
  {
    onStrokeStart: (payload) => {
      socketClient.sendStrokeStart(payload);
    },

    onStrokePoints: (payload) => {
      socketClient.sendStrokePoints(payload);
    },

    onStrokeEnd: (payload) => {
      socketClient.sendStrokeEnd(payload);
    }
  }
);

socketClient = new WebSocketClient(
  connectionStatus,
  roomId,
  {
    onStrokeStart: (payload) => {
      drawingCanvas.beginRemoteStroke(payload);
    },

    onStrokePoints: (payload) => {
      drawingCanvas.drawRemotePoints(payload);
    },

    onStrokeEnd: (payload) => {
      drawingCanvas.endRemoteStroke(payload);
    }
  }
);

const toolbar = new Toolbar();

toolbar.onToolChange((tool) => {
  drawingCanvas.setTool(tool);
});

toolbar.onColorChange((color) => {
  drawingCanvas.setColor(color);
});

toolbar.onWidthChange((width) => {
  drawingCanvas.setWidth(width);
});

let resizeTimer: number | null = null;

window.addEventListener("resize", () => {
  if (resizeTimer !== null) {
    window.clearTimeout(resizeTimer);
  }

  resizeTimer = window.setTimeout(() => {
    drawingCanvas.resize();
    resizeTimer = null;
  }, 150);
});
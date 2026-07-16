import { DrawingCanvas } from "./canvas";
import { PerformanceMetrics } from "./metrics";
import { ToastManager } from "./toast";
import { Toolbar } from "./ui";
import { UserPresence } from "./users";
import { WebSocketClient } from "./websocket";

const canvasElement =
  document.querySelector<HTMLCanvasElement>(
    "#drawingCanvas"
  );

const fpsElement =
  document.querySelector<HTMLElement>(
    "#fpsValue"
  );

const latencyElement =
  document.querySelector<HTMLElement>(
    "#latencyValue"
  );

const connectionStatus =
  document.querySelector<HTMLDivElement>(
    "#connectionStatus"
  );

const usersList =
  document.querySelector<HTMLUListElement>(
    "#usersList"
  );

const cursorsContainer =
  document.querySelector<HTMLDivElement>(
    "#remoteCursors"
  );

const toastContainer =
  document.querySelector<HTMLDivElement>(
    "#toastContainer"
  );

const roomNameElement =
  document.querySelector<HTMLElement>(
    "#roomName"
  );

if (
  !canvasElement ||
  !fpsElement ||
  !latencyElement ||
  !connectionStatus ||
  !usersList ||
  !cursorsContainer ||
  !toastContainer ||
  !roomNameElement
) {
  throw new Error(
    "Required page elements are missing."
  );
}

const metrics = new PerformanceMetrics(
  fpsElement,
  latencyElement
);

const toastManager =
  new ToastManager(toastContainer);

const queryParameters =
  new URLSearchParams(
    window.location.search
  );

const roomId =
  queryParameters
    .get("room")
    ?.trim()
    .slice(0, 40) ||
  "main-room";

let userName =
  queryParameters
    .get("name")
    ?.trim()
    .slice(0, 24) ||
  "";

if (!userName) {
  userName =
    window
      .prompt("Enter your display name")
      ?.trim()
      .slice(0, 24) ||
    `Guest-${Math.floor(
      Math.random() * 1000
    )}`;
}

roomNameElement.textContent = roomId;

const userPresence =
  new UserPresence(
    usersList,
    cursorsContainer
  );

const toolbar = new Toolbar();

let socketClient:
  WebSocketClient | null = null;

let hasShownConnectedToast = false;

const drawingCanvas =
  new DrawingCanvas(
    canvasElement,
    {
      onStrokeStart: (payload) => {
        socketClient?.sendStrokeStart(
          payload
        );
      },

      onStrokePoints: (payload) => {
        socketClient?.sendStrokePoints(
          payload
        );
      },

      onStrokeEnd: (payload) => {
        socketClient?.sendStrokeEnd(
          payload
        );
      }
    }
  );

socketClient = new WebSocketClient(
  connectionStatus,
  roomId,
  userName,
  {
    onConnected: (userId) => {
      userPresence.setCurrentUser(
        userId
      );

      if (!hasShownConnectedToast) {
        toastManager.show({
          title: "Connected",
          message: `Joined room "${roomId}".`,
          type: "success"
        });

        hasShownConnectedToast = true;
      }
    },

    onLatencyUpdate: (latency) => {
      metrics.updateLatency(latency);
    },

    onRoomUsers: ({ users }) => {
      userPresence.renderUsers(users);
    },

    onCursorMove: (payload) => {
      userPresence.updateRemoteCursor(
        payload
      );
    },

    onUserLeft: ({ userId }) => {
      userPresence.removeUser(userId);

      toastManager.show({
        title: "User left",
        message:
          "A collaborator disconnected from the room.",
        type: "info"
      });
    },

    onStrokeStart: (payload) => {
      drawingCanvas.beginRemoteStroke(
        payload
      );
    },

    onStrokePoints: (payload) => {
      drawingCanvas.drawRemotePoints(
        payload
      );
    },

    onStrokeEnd: (payload) => {
      drawingCanvas.endRemoteStroke(
        payload
      );
    },

    onCanvasState: (payload) => {
      drawingCanvas.renderCanvasState(
        payload.strokes
      );

      toolbar.setHistoryState(
        payload.canUndo,
        payload.canRedo
      );
    },

    onHistoryState: (payload) => {
      toolbar.setHistoryState(
        payload.canUndo,
        payload.canRedo
      );
    },

    onCanvasCleared: (payload) => {
      drawingCanvas.clearCanvas();

      toolbar.setHistoryState(
        payload.canUndo,
        payload.canRedo
      );

      toastManager.show({
        title: "Canvas cleared",
        message:
          "The shared canvas was cleared for everyone.",
        type: "warning"
      });
    }
  }
);

toolbar.onToolChange((tool) => {
  drawingCanvas.setTool(tool);
});

toolbar.onColorChange((color) => {
  drawingCanvas.setColor(color);
});

toolbar.onWidthChange((width) => {
  drawingCanvas.setWidth(width);
});

toolbar.onUndo(() => {
  socketClient?.requestUndo();

  toastManager.show({
    title: "Undo requested",
    message:
      "The latest shared stroke will be removed.",
    type: "info",
    duration: 1600
  });
});

toolbar.onRedo(() => {
  socketClient?.requestRedo();

  toastManager.show({
    title: "Redo requested",
    message:
      "The latest undone stroke will be restored.",
    type: "info",
    duration: 1600
  });
});

toolbar.onClear(() => {
  const confirmed = window.confirm(
    "Clear the canvas for everyone in this room?"
  );

  if (!confirmed) {
    return;
  }

  socketClient?.requestClearCanvas();
});

let lastCursorSentAt = 0;

canvasElement.addEventListener(
  "pointermove",
  (event) => {
    const currentTime =
      performance.now();

    if (
      currentTime -
        lastCursorSentAt <
      40
    ) {
      return;
    }

    lastCursorSentAt = currentTime;

    const bounds =
      canvasElement
        .getBoundingClientRect();

    if (
      bounds.width === 0 ||
      bounds.height === 0
    ) {
      return;
    }

    const normalizedX =
      (event.clientX - bounds.left) /
      bounds.width;

    const normalizedY =
      (event.clientY - bounds.top) /
      bounds.height;

    socketClient?.sendCursorPosition(
      Math.min(
        1,
        Math.max(0, normalizedX)
      ),
      Math.min(
        1,
        Math.max(0, normalizedY)
      )
    );
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    const target =
      event.target as HTMLElement | null;

    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable === true;

    if (isTyping) {
      return;
    }

    const key = event.key.toLowerCase();

    const modifierPressed =
      event.ctrlKey || event.metaKey;

    if (modifierPressed && key === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        socketClient?.requestRedo();

        toastManager.show({
          title: "Redo requested",
          type: "info",
          duration: 1400
        });
      } else {
        socketClient?.requestUndo();

        toastManager.show({
          title: "Undo requested",
          type: "info",
          duration: 1400
        });
      }

      return;
    }

    if (modifierPressed && key === "y") {
      event.preventDefault();

      socketClient?.requestRedo();

      toastManager.show({
        title: "Redo requested",
        type: "info",
        duration: 1400
      });

      return;
    }

    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    if (key === "b") {
      event.preventDefault();

      toolbar.selectBrush();
      drawingCanvas.setTool("brush");

      toastManager.show({
        title: "Brush selected",
        type: "success",
        duration: 1200
      });

      return;
    }

    if (key === "e") {
      event.preventDefault();

      toolbar.selectEraser();
      drawingCanvas.setTool("eraser");

      toastManager.show({
        title: "Eraser selected",
        type: "success",
        duration: 1200
      });
    }
  }
);

let resizeTimer:
  number | null = null;

window.addEventListener(
  "resize",
  () => {
    if (resizeTimer !== null) {
      window.clearTimeout(
        resizeTimer
      );
    }

    resizeTimer =
      window.setTimeout(() => {
        drawingCanvas.resize();
        resizeTimer = null;
      }, 150);
  }
);
import { DrawingCanvas } from "./canvas";
import { Toolbar } from "./ui";
import { UserPresence } from "./users";
import { WebSocketClient } from "./websocket";

const canvasElement =
  document.querySelector<HTMLCanvasElement>(
    "#drawingCanvas"
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

const roomNameElement =
  document.querySelector<HTMLElement>(
    "#roomName"
  );

if (
  !canvasElement ||
  !connectionStatus ||
  !usersList ||
  !cursorsContainer ||
  !roomNameElement
) {
  throw new Error(
    "Required page elements are missing."
  );
}

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
});

toolbar.onRedo(() => {
  socketClient?.requestRedo();
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
    const modifierPressed =
      event.ctrlKey || event.metaKey;

    if (!modifierPressed) {
      return;
    }

    if (
      event.key.toLowerCase() !== "z"
    ) {
      return;
    }

    event.preventDefault();

    if (event.shiftKey) {
      socketClient?.requestRedo();
    } else {
      socketClient?.requestUndo();
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
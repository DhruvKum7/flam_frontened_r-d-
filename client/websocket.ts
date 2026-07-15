import type {
  CanvasStatePayload,
  ConnectionReadyPayload,
  CursorMovePayload,
  HistoryStatePayload,
  JoinRoomPayload,
  RedoRequestPayload,
  RemoteCursorPayload,
  RoomUsersPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload,
  UndoRequestPayload,
  UserLeftPayload,
  CanvasClearedPayload,
ClearCanvasRequestPayload
} from "../shared/protocol";

interface SocketClient {
  on(
    eventName: string,
    listener: (payload: any) => void
  ): void;

  emit(
    eventName: string,
    payload: unknown
  ): void;
}

declare const io: () => SocketClient;

interface WebSocketHandlers {
    onCanvasCleared: (
  payload: CanvasClearedPayload
) => void;
  onConnected: (
    userId: string
  ) => void;

  onRoomUsers: (
    payload: RoomUsersPayload
  ) => void;

  onCursorMove: (
    payload: RemoteCursorPayload
  ) => void;

  onUserLeft: (
    payload: UserLeftPayload
  ) => void;

  onStrokeStart: (
    payload: StrokeStartPayload
  ) => void;

  onStrokePoints: (
    payload: StrokePointsPayload
  ) => void;

  onStrokeEnd: (
    payload: StrokeEndPayload
  ) => void;

  onCanvasState: (
    payload: CanvasStatePayload
  ) => void;

  onHistoryState: (
    payload: HistoryStatePayload
  ) => void;
}

export class WebSocketClient {
  private readonly socket: SocketClient;
  private readonly roomId: string;
  private readonly userName: string;
    public requestClearCanvas(): void {
  const payload: ClearCanvasRequestPayload = {
    roomId: this.roomId
  };

  this.socket.emit(
    "clear-canvas-request",
    payload
  );
}
  public constructor(
    statusElement: HTMLDivElement,
    roomId: string,
    userName: string,
    handlers: WebSocketHandlers
  ) {
    this.socket = io();
    this.roomId = roomId;
    this.userName = userName;

    this.attachConnectionEvents(
      statusElement,
      handlers
    );

    this.attachRoomEvents(handlers);
    this.attachDrawingEvents(handlers);
    this.attachHistoryEvents(handlers);
  }

  public sendCursorPosition(
    x: number,
    y: number
  ): void {
    const payload: CursorMovePayload = {
      roomId: this.roomId,
      x,
      y
    };

    this.socket.emit(
      "cursor-move",
      payload
    );
  }

  public sendStrokeStart(
    payload: Omit<
      StrokeStartPayload,
      "roomId"
    >
  ): void {
    this.socket.emit("stroke-start", {
      ...payload,
      roomId: this.roomId
    });
  }

  public sendStrokePoints(
    payload: Omit<
      StrokePointsPayload,
      "roomId"
    >
  ): void {
    this.socket.emit("stroke-points", {
      ...payload,
      roomId: this.roomId
    });
  }

  public sendStrokeEnd(
    payload: Omit<
      StrokeEndPayload,
      "roomId"
    >
  ): void {
    this.socket.emit("stroke-end", {
      ...payload,
      roomId: this.roomId
    });
  }

  public requestUndo(): void {
    const payload: UndoRequestPayload = {
      roomId: this.roomId
    };

    this.socket.emit(
      "undo-request",
      payload
    );
  }

  public requestRedo(): void {
    const payload: RedoRequestPayload = {
      roomId: this.roomId
    };

    this.socket.emit(
      "redo-request",
      payload
    );
  }

  private attachConnectionEvents(
    statusElement: HTMLDivElement,
    handlers: WebSocketHandlers
  ): void {
    this.socket.on("connect", () => {
      statusElement.textContent =
        "Connected";

      statusElement.classList.remove(
        "disconnected"
      );

      statusElement.classList.add(
        "connected"
      );

      const payload: JoinRoomPayload = {
        roomId: this.roomId,
        name: this.userName
      };

      this.socket.emit(
        "join-room",
        payload
      );
    });

    this.socket.on("disconnect", () => {
      statusElement.textContent =
        "Disconnected";

      statusElement.classList.remove(
        "connected"
      );

      statusElement.classList.add(
        "disconnected"
      );
    });

    this.socket.on(
      "connection-ready",
      (payload: ConnectionReadyPayload) => {
        handlers.onConnected(
          payload.userId
        );
      }
    );
  }

  private attachRoomEvents(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "room-users",
      handlers.onRoomUsers
    );

    this.socket.on(
      "cursor-move",
      handlers.onCursorMove
    );

    this.socket.on(
      "user-left",
      handlers.onUserLeft
    );
  }

  private attachDrawingEvents(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "stroke-start",
      handlers.onStrokeStart
    );

    this.socket.on(
      "stroke-points",
      handlers.onStrokePoints
    );

    this.socket.on(
      "stroke-end",
      handlers.onStrokeEnd
    );
  }

  private attachHistoryEvents(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "canvas-state",
      handlers.onCanvasState
    );
    this.socket.on(
  "canvas-cleared",
  handlers.onCanvasCleared
);
    this.socket.on(
      "history-state",
      handlers.onHistoryState
    );
  }
}
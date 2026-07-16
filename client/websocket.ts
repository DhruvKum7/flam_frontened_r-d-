import type {
  CanvasClearedPayload,
  CanvasStatePayload,
  ClearCanvasRequestPayload,
  ConnectionReadyPayload,
  CursorMovePayload,
  HistoryStatePayload,
  JoinRoomPayload,
  PingPayload,
  PongPayload,
  RedoRequestPayload,
  RemoteCursorPayload,
  RoomUsersPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload,
  UndoRequestPayload,
  UserLeftPayload
} from "../shared/protocol";

interface SocketClient {
  on(
    eventName: string,
    listener: (payload?: unknown) => void
  ): void;

  emit(
    eventName: string,
    payload?: unknown
  ): void;

  connected?: boolean;
}

declare const io: () => SocketClient;

interface WebSocketHandlers {
  onConnected: (userId: string) => void;
  onLatencyUpdate: (latency: number) => void;
  onRoomUsers: (payload: RoomUsersPayload) => void;
  onCursorMove: (payload: RemoteCursorPayload) => void;
  onUserLeft: (payload: UserLeftPayload) => void;
  onStrokeStart: (payload: StrokeStartPayload) => void;
  onStrokePoints: (payload: StrokePointsPayload) => void;
  onStrokeEnd: (payload: StrokeEndPayload) => void;
  onCanvasState: (payload: CanvasStatePayload) => void;
  onHistoryState: (payload: HistoryStatePayload) => void;
  onCanvasCleared: (payload: CanvasClearedPayload) => void;
}

export class WebSocketClient {
  private readonly socket: SocketClient;
  private readonly roomId: string;
  private readonly userName: string;

  private latencyTimer: number | null = null;

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
    this.startLatencyMeasurement(handlers);
  }

  public sendCursorPosition(
    x: number,
    y: number
  ): void {
    if (!this.isValidCoordinate(x, y)) {
      return;
    }

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
    this.socket.emit(
      "stroke-start",
      {
        ...payload,
        roomId: this.roomId
      }
    );
  }

  public sendStrokePoints(
    payload: Omit<
      StrokePointsPayload,
      "roomId"
    >
  ): void {
    if (payload.points.length === 0) {
      return;
    }

    this.socket.emit(
      "stroke-points",
      {
        ...payload,
        roomId: this.roomId
      }
    );
  }

  public sendStrokeEnd(
    payload: Omit<
      StrokeEndPayload,
      "roomId"
    >
  ): void {
    this.socket.emit(
      "stroke-end",
      {
        ...payload,
        roomId: this.roomId
      }
    );
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

  public requestClearCanvas(): void {
    const payload: ClearCanvasRequestPayload = {
      roomId: this.roomId
    };

    this.socket.emit(
      "clear-canvas-request",
      payload
    );
  }

  private attachConnectionEvents(
    statusElement: HTMLDivElement,
    handlers: WebSocketHandlers
  ): void {
    this.updateConnectionStatus(
      statusElement,
      "Connecting",
      false
    );

    this.socket.on("connect", () => {
      this.updateConnectionStatus(
        statusElement,
        "Connected",
        true
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
      this.updateConnectionStatus(
        statusElement,
        "Reconnecting",
        false
      );
    });

    this.socket.on(
      "connect_error",
      (payload?: unknown) => {
        console.error(
          "Socket connection failed:",
          payload
        );

        this.updateConnectionStatus(
          statusElement,
          "Connection failed",
          false
        );
      }
    );

    this.socket.on(
      "connection-ready",
      (payload?: unknown) => {
        if (!this.isConnectionReadyPayload(payload)) {
          return;
        }

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
      (payload?: unknown) => {
        if (!this.isRoomUsersPayload(payload)) {
          return;
        }

        handlers.onRoomUsers(payload);
      }
    );

    this.socket.on(
      "cursor-move",
      (payload?: unknown) => {
        if (!this.isRemoteCursorPayload(payload)) {
          return;
        }

        handlers.onCursorMove(payload);
      }
    );

    this.socket.on(
      "user-left",
      (payload?: unknown) => {
        if (!this.isUserLeftPayload(payload)) {
          return;
        }

        handlers.onUserLeft(payload);
      }
    );
  }

  private attachDrawingEvents(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "stroke-start",
      (payload?: unknown) => {
        if (!this.isStrokeStartPayload(payload)) {
          return;
        }

        handlers.onStrokeStart(payload);
      }
    );

    this.socket.on(
      "stroke-points",
      (payload?: unknown) => {
        if (!this.isStrokePointsPayload(payload)) {
          return;
        }

        handlers.onStrokePoints(payload);
      }
    );

    this.socket.on(
      "stroke-end",
      (payload?: unknown) => {
        if (!this.isStrokeEndPayload(payload)) {
          return;
        }

        handlers.onStrokeEnd(payload);
      }
    );
  }

  private attachHistoryEvents(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "canvas-state",
      (payload?: unknown) => {
        if (!this.isCanvasStatePayload(payload)) {
          return;
        }

        handlers.onCanvasState(payload);
      }
    );

    this.socket.on(
      "history-state",
      (payload?: unknown) => {
        if (!this.isHistoryStatePayload(payload)) {
          return;
        }

        handlers.onHistoryState(payload);
      }
    );

    this.socket.on(
      "canvas-cleared",
      (payload?: unknown) => {
        if (!this.isCanvasClearedPayload(payload)) {
          return;
        }

        handlers.onCanvasCleared(payload);
      }
    );
  }

  private startLatencyMeasurement(
    handlers: WebSocketHandlers
  ): void {
    this.socket.on(
      "latency-pong",
      (payload?: unknown) => {
        if (!this.isPongPayload(payload)) {
          return;
        }

        const roundTripTime =
          performance.now() -
          payload.sentAt;

        handlers.onLatencyUpdate(
          Math.max(0, roundTripTime)
        );
      }
    );

    const sendPing = (): void => {
      const payload: PingPayload = {
        sentAt: performance.now()
      };

      this.socket.emit(
        "latency-ping",
        payload
      );
    };

    sendPing();

    this.latencyTimer =
      window.setInterval(
        sendPing,
        3000
      );
  }

  private updateConnectionStatus(
    statusElement: HTMLDivElement,
    message: string,
    connected: boolean
  ): void {
    const textElement =
      statusElement.querySelector<HTMLElement>(
        ".status-text"
      );

    if (textElement) {
      textElement.textContent = message;
    } else {
      statusElement.textContent = message;
    }

    statusElement.classList.toggle(
      "connected",
      connected
    );

    statusElement.classList.toggle(
      "disconnected",
      !connected
    );
  }

  private isValidCoordinate(
    x: number,
    y: number
  ): boolean {
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 &&
      x <= 1 &&
      y >= 0 &&
      y <= 1
    );
  }

  private isObject(
    value: unknown
  ): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null
    );
  }

  private isConnectionReadyPayload(
    value: unknown
  ): value is ConnectionReadyPayload {
    return (
      this.isObject(value) &&
      typeof value.userId === "string"
    );
  }

  private isRoomUsersPayload(
    value: unknown
  ): value is RoomUsersPayload {
    return (
      this.isObject(value) &&
      Array.isArray(value.users)
    );
  }

  private isRemoteCursorPayload(
    value: unknown
  ): value is RemoteCursorPayload {
    return (
      this.isObject(value) &&
      typeof value.userId === "string" &&
      typeof value.name === "string" &&
      typeof value.color === "string" &&
      typeof value.x === "number" &&
      typeof value.y === "number"
    );
  }

  private isUserLeftPayload(
    value: unknown
  ): value is UserLeftPayload {
    return (
      this.isObject(value) &&
      typeof value.userId === "string"
    );
  }

  private isStrokeStartPayload(
    value: unknown
  ): value is StrokeStartPayload {
    return (
      this.isObject(value) &&
      typeof value.roomId === "string" &&
      typeof value.strokeId === "string" &&
      typeof value.tool === "string" &&
      typeof value.color === "string" &&
      typeof value.width === "number" &&
      this.isObject(value.point)
    );
  }

  private isStrokePointsPayload(
    value: unknown
  ): value is StrokePointsPayload {
    return (
      this.isObject(value) &&
      typeof value.roomId === "string" &&
      typeof value.strokeId === "string" &&
      Array.isArray(value.points)
    );
  }

  private isStrokeEndPayload(
    value: unknown
  ): value is StrokeEndPayload {
    return (
      this.isObject(value) &&
      typeof value.roomId === "string" &&
      typeof value.strokeId === "string"
    );
  }

  private isCanvasStatePayload(
    value: unknown
  ): value is CanvasStatePayload {
    return (
      this.isObject(value) &&
      Array.isArray(value.strokes) &&
      typeof value.canUndo === "boolean" &&
      typeof value.canRedo === "boolean"
    );
  }

  private isHistoryStatePayload(
    value: unknown
  ): value is HistoryStatePayload {
    return (
      this.isObject(value) &&
      typeof value.canUndo === "boolean" &&
      typeof value.canRedo === "boolean"
    );
  }

  private isCanvasClearedPayload(
    value: unknown
  ): value is CanvasClearedPayload {
    return (
      this.isObject(value) &&
      typeof value.canUndo === "boolean" &&
      typeof value.canRedo === "boolean"
    );
  }

  private isPongPayload(
    value: unknown
  ): value is PongPayload {
    return (
      this.isObject(value) &&
      typeof value.sentAt === "number" &&
      Number.isFinite(value.sentAt)
    );
  }
}
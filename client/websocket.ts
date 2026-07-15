import type {
  ConnectionReadyPayload,
  CursorMovePayload,
  JoinRoomPayload,
  RemoteCursorPayload,
  RoomUsersPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload,
  UserLeftPayload
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
}

export class WebSocketClient {
  private readonly socket: SocketClient;
  private readonly roomId: string;
  private readonly userName: string;

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
        handlers.onConnected(payload.userId);
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
}
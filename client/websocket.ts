import type {
  JoinRoomPayload,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload
} from "../shared/protocol";

interface SocketClient {
  on(
    eventName: string,
    listener: (payload: any) => void
  ): void;

  emit(eventName: string, payload: unknown): void;
}

declare const io: () => SocketClient;

interface WebSocketHandlers {
  onStrokeStart: (payload: StrokeStartPayload) => void;
  onStrokePoints: (payload: StrokePointsPayload) => void;
  onStrokeEnd: (payload: StrokeEndPayload) => void;
}

export class WebSocketClient {
  private readonly socket: SocketClient;
  private readonly roomId: string;

  public constructor(
    statusElement: HTMLDivElement,
    roomId: string,
    handlers: WebSocketHandlers
  ) {
    this.socket = io();
    this.roomId = roomId;

    this.attachConnectionEvents(statusElement);
    this.attachDrawingEvents(handlers);
  }

  public sendStrokeStart(
    payload: Omit<StrokeStartPayload, "roomId">
  ): void {
    this.socket.emit("stroke-start", {
      ...payload,
      roomId: this.roomId
    });
  }

  public sendStrokePoints(
    payload: Omit<StrokePointsPayload, "roomId">
  ): void {
    this.socket.emit("stroke-points", {
      ...payload,
      roomId: this.roomId
    });
  }

  public sendStrokeEnd(
    payload: Omit<StrokeEndPayload, "roomId">
  ): void {
    this.socket.emit("stroke-end", {
      ...payload,
      roomId: this.roomId
    });
  }

  private attachConnectionEvents(
    statusElement: HTMLDivElement
  ): void {
    this.socket.on("connect", () => {
      statusElement.textContent = "Connected";
      statusElement.classList.remove("disconnected");
      statusElement.classList.add("connected");

      const payload: JoinRoomPayload = {
        roomId: this.roomId
      };

      this.socket.emit("join-room", payload);
    });

    this.socket.on("disconnect", () => {
      statusElement.textContent = "Disconnected";
      statusElement.classList.remove("connected");
      statusElement.classList.add("disconnected");
    });

    this.socket.on("connection-ready", (payload) => {
      console.log(`Current user: ${payload.userId}`);
    });
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
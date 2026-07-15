import type {
  DrawingTool,
  Point,
  StrokeEndPayload,
  StrokePointsPayload,
  StrokeStartPayload
} from "../shared/protocol";

interface CanvasSettings {
  tool: DrawingTool;
  color: string;
  width: number;
}

interface LocalStrokeHandlers {
  onStrokeStart: (
    payload: Omit<
      StrokeStartPayload,
      "roomId"
    >
  ) => void;

  onStrokePoints: (
    payload: Omit<
      StrokePointsPayload,
      "roomId"
    >
  ) => void;

  onStrokeEnd: (
    payload: Omit<
      StrokeEndPayload,
      "roomId"
    >
  ) => void;
}

interface ActiveRemoteStroke {
  tool: DrawingTool;
  color: string;
  width: number;
  previousPoint: Point;
}

export class DrawingCanvas {
  private readonly canvas:
    HTMLCanvasElement;

  private readonly context:
    CanvasRenderingContext2D;

  private readonly handlers:
    LocalStrokeHandlers;

  private settings: CanvasSettings = {
    tool: "brush",
    color: "#1f2937",
    width: 5
  };

  private isDrawing = false;

  private activePointerId:
    number | null = null;

  private activeStrokeId:
    string | null = null;

  private lastRenderedPoint:
    Point | null = null;

  private pendingPoints: Point[] = [];
  private networkPoints: Point[] = [];

  private animationFrameId:
    number | null = null;

  private readonly remoteStrokes =
    new Map<
      string,
      ActiveRemoteStroke
    >();

  public constructor(
    canvas: HTMLCanvasElement,
    handlers: LocalStrokeHandlers
  ) {
    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Canvas 2D context is unavailable."
      );
    }

    this.canvas = canvas;
    this.context = context;
    this.handlers = handlers;

    this.configureContext();
    this.attachPointerEvents();
    this.resize();
  }

  public setTool(
    tool: DrawingTool
  ): void {
    this.settings.tool = tool;
  }

  public setColor(
    color: string
  ): void {
    this.settings.color = color;
  }

  public setWidth(
    width: number
  ): void {
    this.settings.width = Math.min(
      40,
      Math.max(1, width)
    );
  }

  public beginRemoteStroke(
    payload: StrokeStartPayload
  ): void {
    const point =
      this.toCanvasPoint(payload.point);

    this.remoteStrokes.set(
      payload.strokeId,
      {
        tool: payload.tool,
        color: payload.color,
        width: payload.width,
        previousPoint: point
      }
    );

    this.drawDot(
      point,
      payload.tool,
      payload.color,
      payload.width
    );
  }

  public drawRemotePoints(
    payload: StrokePointsPayload
  ): void {
    const remoteStroke =
      this.remoteStrokes.get(
        payload.strokeId
      );

    if (!remoteStroke) {
      return;
    }

    for (
      const normalizedPoint
      of payload.points
    ) {
      const point =
        this.toCanvasPoint(
          normalizedPoint
        );

      this.drawSegment(
        remoteStroke.previousPoint,
        point,
        remoteStroke.tool,
        remoteStroke.color,
        remoteStroke.width
      );

      remoteStroke.previousPoint =
        point;
    }
  }

  public endRemoteStroke(
    payload: StrokeEndPayload
  ): void {
    this.remoteStrokes.delete(
      payload.strokeId
    );
  }
public renderCanvasState(
  strokes: Array<{
    tool: DrawingTool;
    color: string;
    width: number;
    points: Point[];
    active: boolean;
    sequence: number;
  }>
): void {
  this.clearCanvas();

  const orderedStrokes = [...strokes]
    .filter((stroke) => stroke.active)
    .sort(
      (first, second) =>
        first.sequence - second.sequence
    );

  for (const stroke of orderedStrokes) {
    if (stroke.points.length === 0) {
      continue;
    }

    const canvasPoints =
      stroke.points.map((point) =>
        this.toCanvasPoint(point)
      );

    this.drawDot(
      canvasPoints[0],
      stroke.tool,
      stroke.color,
      stroke.width
    );

    for (
      let index = 1;
      index < canvasPoints.length;
      index++
    ) {
      this.drawSegment(
        canvasPoints[index - 1],
        canvasPoints[index],
        stroke.tool,
        stroke.color,
        stroke.width
      );
    }
  }
}

public clearCanvas(): void {
  const bounds =
    this.canvas.getBoundingClientRect();

  this.context.save();

  this.context.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  this.context.clearRect(
    0,
    0,
    this.canvas.width,
    this.canvas.height
  );

  this.context.restore();

  const pixelRatio =
    window.devicePixelRatio || 1;

  this.context.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );

  this.configureContext();

  if (
    bounds.width === 0 ||
    bounds.height === 0
  ) {
    return;
  }
}
  public resize(): void {
    const bounds =
      this.canvas.getBoundingClientRect();

    if (
      bounds.width === 0 ||
      bounds.height === 0
    ) {
      return;
    }

    const pixelRatio =
      window.devicePixelRatio || 1;

    const snapshot =
      document.createElement("canvas");

    snapshot.width = this.canvas.width;
    snapshot.height = this.canvas.height;

    const snapshotContext =
      snapshot.getContext("2d");

    if (
      snapshotContext &&
      this.canvas.width > 0 &&
      this.canvas.height > 0
    ) {
      snapshotContext.drawImage(
        this.canvas,
        0,
        0
      );
    }

    this.canvas.width = Math.round(
      bounds.width * pixelRatio
    );

    this.canvas.height = Math.round(
      bounds.height * pixelRatio
    );

    this.context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0
    );

    this.configureContext();

    if (
      snapshot.width > 0 &&
      snapshot.height > 0
    ) {
      this.context.drawImage(
        snapshot,
        0,
        0,
        snapshot.width,
        snapshot.height,
        0,
        0,
        bounds.width,
        bounds.height
      );
    }
  }

  private configureContext(): void {
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
  }

  private attachPointerEvents(): void {
    this.canvas.addEventListener(
      "pointerdown",
      this.handlePointerDown
    );

    this.canvas.addEventListener(
      "pointermove",
      this.handlePointerMove
    );

    this.canvas.addEventListener(
      "pointerup",
      this.handlePointerUp
    );

    this.canvas.addEventListener(
      "pointercancel",
      this.handlePointerUp
    );
  }

  private readonly handlePointerDown = (
    event: PointerEvent
  ): void => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    this.isDrawing = true;
    this.activePointerId =
      event.pointerId;

    this.activeStrokeId =
      this.createStrokeId();

    this.canvas.setPointerCapture(
      event.pointerId
    );

    const point =
      this.getCanvasPoint(event);

    this.lastRenderedPoint = point;

    this.drawDot(
      point,
      this.settings.tool,
      this.settings.color,
      this.settings.width
    );

    this.handlers.onStrokeStart({
      strokeId: this.activeStrokeId,
      tool: this.settings.tool,
      color: this.settings.color,
      width: this.settings.width,
      point:
        this.toNormalizedPoint(point)
    });
  };

  private readonly handlePointerMove = (
    event: PointerEvent
  ): void => {
    if (
      !this.isDrawing ||
      this.activePointerId !==
        event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const pointerEvents =
      typeof event.getCoalescedEvents ===
      "function"
        ? event.getCoalescedEvents()
        : [event];

    for (
      const pointerEvent
      of pointerEvents
    ) {
      const point =
        this.getCanvasPoint(
          pointerEvent
        );

      const referencePoint =
        this.pendingPoints.length > 0
          ? this.pendingPoints[
              this.pendingPoints.length - 1
            ]
          : this.lastRenderedPoint;

      if (!referencePoint) {
        continue;
      }

      const distance = Math.hypot(
        point.x - referencePoint.x,
        point.y - referencePoint.y
      );

      if (distance < 0.75) {
        continue;
      }

      this.pendingPoints.push(point);

      this.networkPoints.push(
        this.toNormalizedPoint(point)
      );
    }

    this.scheduleRender();
  };

  private readonly handlePointerUp = (
    event: PointerEvent
  ): void => {
    if (
      this.activePointerId !==
        event.pointerId ||
      !this.activeStrokeId
    ) {
      return;
    }

    event.preventDefault();

    const endPoint =
      this.getCanvasPoint(event);

    const referencePoint =
      this.pendingPoints.length > 0
        ? this.pendingPoints[
            this.pendingPoints.length - 1
          ]
        : this.lastRenderedPoint;

    if (
      referencePoint &&
      Math.hypot(
        endPoint.x - referencePoint.x,
        endPoint.y - referencePoint.y
      ) >= 0.75
    ) {
      this.pendingPoints.push(endPoint);

      this.networkPoints.push(
        this.toNormalizedPoint(endPoint)
      );
    }

    this.renderFrame();

    this.handlers.onStrokeEnd({
      strokeId: this.activeStrokeId
    });

    if (
      this.canvas.hasPointerCapture(
        event.pointerId
      )
    ) {
      this.canvas.releasePointerCapture(
        event.pointerId
      );
    }

    this.resetLocalStroke();
  };

  private scheduleRender(): void {
    if (
      this.animationFrameId !== null
    ) {
      return;
    }

    this.animationFrameId =
      window.requestAnimationFrame(() => {
        this.renderFrame();
        this.animationFrameId = null;
      });
  }

  private renderFrame(): void {
    this.renderPendingPoints();
    this.sendPendingNetworkPoints();
  }

  private renderPendingPoints(): void {
    if (
      this.pendingPoints.length === 0 ||
      !this.lastRenderedPoint
    ) {
      return;
    }

    let previousPoint =
      this.lastRenderedPoint;

    for (
      const currentPoint
      of this.pendingPoints
    ) {
      this.drawSegment(
        previousPoint,
        currentPoint,
        this.settings.tool,
        this.settings.color,
        this.settings.width
      );

      previousPoint = currentPoint;
    }

    this.lastRenderedPoint =
      previousPoint;

    this.pendingPoints = [];
  }

  private sendPendingNetworkPoints(): void {
    if (
      !this.activeStrokeId ||
      this.networkPoints.length === 0
    ) {
      return;
    }

    this.handlers.onStrokePoints({
      strokeId: this.activeStrokeId,
      points: [...this.networkPoints]
    });

    this.networkPoints = [];
  }

  private drawSegment(
    from: Point,
    to: Point,
    tool: DrawingTool,
    color: string,
    width: number
  ): void {
    this.applyStyle(
      tool,
      color,
      width
    );

    this.context.beginPath();
    this.context.moveTo(
      from.x,
      from.y
    );

    this.context.lineTo(
      to.x,
      to.y
    );

    this.context.stroke();
  }

  private drawDot(
    point: Point,
    tool: DrawingTool,
    color: string,
    width: number
  ): void {
    this.applyStyle(
      tool,
      color,
      width
    );

    this.context.beginPath();

    this.context.arc(
      point.x,
      point.y,
      width / 2,
      0,
      Math.PI * 2
    );

    this.context.fill();
  }

  private applyStyle(
    tool: DrawingTool,
    color: string,
    width: number
  ): void {
    this.context.lineWidth = width;

    if (tool === "eraser") {
      this.context.globalCompositeOperation =
        "destination-out";

      this.context.strokeStyle =
        "#000000";

      this.context.fillStyle =
        "#000000";
    } else {
      this.context.globalCompositeOperation =
        "source-over";

      this.context.strokeStyle =
        color;

      this.context.fillStyle =
        color;
    }
  }

  private getCanvasPoint(
    event: PointerEvent
  ): Point {
    const bounds =
      this.canvas.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      pressure:
        event.pressure > 0
          ? event.pressure
          : 0.5
    };
  }

  private toNormalizedPoint(
    point: Point
  ): Point {
    const bounds =
      this.canvas.getBoundingClientRect();

    return {
      x: point.x / bounds.width,
      y: point.y / bounds.height,
      pressure: point.pressure
    };
  }

  private toCanvasPoint(
    point: Point
  ): Point {
    const bounds =
      this.canvas.getBoundingClientRect();

    return {
      x: point.x * bounds.width,
      y: point.y * bounds.height,
      pressure: point.pressure
    };
  }

  private createStrokeId(): string {
    if (
      typeof crypto.randomUUID ===
      "function"
    ) {
      return crypto.randomUUID();
    }

    return [
      Date.now().toString(36),
      Math.random()
        .toString(36)
        .slice(2)
    ].join("-");
  }

  private resetLocalStroke(): void {
    this.isDrawing = false;
    this.activePointerId = null;
    this.activeStrokeId = null;
    this.lastRenderedPoint = null;
    this.pendingPoints = [];
    this.networkPoints = [];
  }
}
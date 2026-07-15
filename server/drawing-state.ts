import type {
  DrawingTool,
  Point
} from "../shared/protocol";

export interface StoredStroke {
  id: string;
  userId: string;
  tool: DrawingTool;
  color: string;
  width: number;
  points: Point[];
  sequence: number;
  active: boolean;
}

interface ActiveStroke {
  id: string;
  userId: string;
  tool: DrawingTool;
  color: string;
  width: number;
  points: Point[];
}

interface RoomDrawingState {
  sequence: number;
  history: StoredStroke[];
  activeStrokes: Map<string, ActiveStroke>;
  redoStack: string[];
}

export class DrawingStateManager {
  private readonly rooms =
    new Map<string, RoomDrawingState>();

  public startStroke(
    roomId: string,
    userId: string,
    stroke: Omit<ActiveStroke, "userId" | "points"> & {
      point: Point;
    }
  ): void {
    const room = this.getOrCreateRoom(roomId);

    room.activeStrokes.set(stroke.id, {
      id: stroke.id,
      userId,
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      points: [stroke.point]
    });
  }
  public clearRoom(roomId: string): void {
  const room = this.rooms.get(roomId);

  if (!room) {
    return;
  }

  room.sequence = 0;
  room.history = [];
  room.activeStrokes.clear();
  room.redoStack = [];
}
  public addPoints(
    roomId: string,
    strokeId: string,
    points: Point[]
  ): void {
    const room = this.rooms.get(roomId);
    const stroke = room?.activeStrokes.get(strokeId);

    if (!stroke || points.length === 0) {
      return;
    }

    stroke.points.push(...points);
  }

  public endStroke(
    roomId: string,
    strokeId: string
  ): StoredStroke | null {
    const room = this.rooms.get(roomId);
    const activeStroke =
      room?.activeStrokes.get(strokeId);

    if (!room || !activeStroke) {
      return null;
    }

    room.activeStrokes.delete(strokeId);

    const storedStroke: StoredStroke = {
      ...activeStroke,
      sequence: ++room.sequence,
      active: true
    };

    room.history.push(storedStroke);
    room.redoStack = [];

    return storedStroke;
  }

  public undo(roomId: string): StoredStroke | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    for (
      let index = room.history.length - 1;
      index >= 0;
      index--
    ) {
      const stroke = room.history[index];

      if (!stroke.active) {
        continue;
      }

      stroke.active = false;
      room.redoStack.push(stroke.id);

      return stroke;
    }

    return null;
  }

  public redo(roomId: string): StoredStroke | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const strokeId = room.redoStack.pop();

    if (!strokeId) {
      return null;
    }

    const stroke = room.history.find(
      (item) => item.id === strokeId
    );

    if (!stroke) {
      return null;
    }

    stroke.active = true;

    return stroke;
  }

  public getHistory(roomId: string): StoredStroke[] {
    const room = this.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return room.history.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({
        ...point
      }))
    }));
  }

  public getHistoryState(roomId: string): {
    canUndo: boolean;
    canRedo: boolean;
  } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return {
        canUndo: false,
        canRedo: false
      };
    }

    return {
      canUndo: room.history.some(
        (stroke) => stroke.active
      ),
      canRedo: room.redoStack.length > 0
    };
  }

  private getOrCreateRoom(
    roomId: string
  ): RoomDrawingState {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        sequence: 0,
        history: [],
        activeStrokes: new Map(),
        redoStack: []
      };

      this.rooms.set(roomId, room);
    }

    return room;
  }
}
export type DrawingTool = "brush" | "eraser";

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

export interface StrokeStartPayload {
  roomId: string;
  strokeId: string;
  tool: DrawingTool;
  color: string;
  width: number;
  point: Point;
}

export interface StrokePointsPayload {
  roomId: string;
  strokeId: string;
  points: Point[];
}

export interface StrokeEndPayload {
  roomId: string;
  strokeId: string;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface ConnectionReadyPayload {
  userId: string;
}
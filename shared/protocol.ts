export type DrawingTool = "brush" | "eraser";

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

export interface UserInfo {
  id: string;
  name: string;
  color: string;
}

export interface JoinRoomPayload {
  roomId: string;
  name: string;
}

export interface ConnectionReadyPayload {
  userId: string;
}

export interface RoomUsersPayload {
  users: UserInfo[];
}

export interface CursorMovePayload {
  roomId: string;
  x: number;
  y: number;
}

export interface RemoteCursorPayload {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface UserLeftPayload {
  userId: string;
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
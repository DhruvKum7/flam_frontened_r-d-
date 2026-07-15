import type { UserInfo } from "../shared/protocol";

const userColors = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#4f46e5"
];

interface RoomUser extends UserInfo {
  socketId: string;
}

export class RoomManager {
  private readonly rooms =
    new Map<string, Map<string, RoomUser>>();

  public addUser(
    roomId: string,
    socketId: string,
    name?: string
  ): UserInfo {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = new Map<string, RoomUser>();
      this.rooms.set(roomId, room);
    }

    const user: RoomUser = {
      id: socketId,
      socketId,
      name: this.cleanName(name),
      color: userColors[room.size % userColors.length]
    };

    room.set(socketId, user);

    return this.toPublicUser(user);
  }

  public removeUser(
    roomId: string,
    socketId: string
  ): UserInfo | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const user = room.get(socketId);

    if (!user) {
      return null;
    }

    room.delete(socketId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    return this.toPublicUser(user);
  }

  public getUser(
    roomId: string,
    socketId: string
  ): UserInfo | null {
    const user = this.rooms
      .get(roomId)
      ?.get(socketId);

    if (!user) {
      return null;
    }

    return this.toPublicUser(user);
  }

  public getUsers(roomId: string): UserInfo[] {
    const room = this.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(room.values()).map((user) =>
      this.toPublicUser(user)
    );
  }

  private cleanName(name?: string): string {
    const cleanedName = (name ?? "")
      .trim()
      .slice(0, 24);

    return cleanedName || "Anonymous";
  }

  private toPublicUser(user: RoomUser): UserInfo {
    return {
      id: user.id,
      name: user.name,
      color: user.color
    };
  }
}
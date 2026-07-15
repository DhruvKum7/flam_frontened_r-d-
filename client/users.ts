import type {
  RemoteCursorPayload,
  UserInfo
} from "../shared/protocol";

export class UserPresence {
  private readonly usersList:
    HTMLUListElement;

  private readonly cursorsContainer:
    HTMLDivElement;

  private currentUserId: string | null = null;

  private readonly cursorElements =
    new Map<string, HTMLDivElement>();

  public constructor(
    usersList: HTMLUListElement,
    cursorsContainer: HTMLDivElement
  ) {
    this.usersList = usersList;
    this.cursorsContainer = cursorsContainer;
  }

  public setCurrentUser(
    userId: string
  ): void {
    this.currentUserId = userId;
  }

  public renderUsers(
    users: UserInfo[]
  ): void {
    this.usersList.replaceChildren();

    if (users.length === 0) {
      const emptyItem =
        document.createElement("li");

      emptyItem.textContent =
        "No users online";

      this.usersList.append(emptyItem);
      return;
    }

    for (const user of users) {
      const item =
        document.createElement("li");

      item.className = "user-item";

      const colorMarker =
        document.createElement("span");

      colorMarker.className = "user-color";
      colorMarker.style.backgroundColor =
        user.color;

      const nameElement =
        document.createElement("span");

      nameElement.className = "user-name";
      nameElement.textContent = user.name;

      item.append(
        colorMarker,
        nameElement
      );

      if (user.id === this.currentUserId) {
        const currentUserLabel =
          document.createElement("span");

        currentUserLabel.className =
          "current-user-label";

        currentUserLabel.textContent = "You";

        item.append(currentUserLabel);
      }

      this.usersList.append(item);
    }
  }

  public updateRemoteCursor(
    payload: RemoteCursorPayload
  ): void {
    let cursor =
      this.cursorElements.get(payload.userId);

    if (!cursor) {
      cursor = this.createCursor(payload);

      this.cursorElements.set(
        payload.userId,
        cursor
      );

      this.cursorsContainer.append(cursor);
    }

    const bounds =
      this.cursorsContainer
        .getBoundingClientRect();

    const x = payload.x * bounds.width;
    const y = payload.y * bounds.height;

    cursor.style.transform =
      `translate(${x}px, ${y}px)`;
  }

  public removeUser(
    userId: string
  ): void {
    const cursor =
      this.cursorElements.get(userId);

    if (!cursor) {
      return;
    }

    cursor.remove();

    this.cursorElements.delete(userId);
  }

  private createCursor(
    payload: RemoteCursorPayload
  ): HTMLDivElement {
    const cursor =
      document.createElement("div");

    cursor.className = "remote-cursor";
    cursor.style.color = payload.color;

    const pointer =
      document.createElement("div");

    pointer.className =
      "remote-cursor-pointer";

    const label =
      document.createElement("div");

    label.className =
      "remote-cursor-name";

    label.textContent = payload.name;

    cursor.append(pointer, label);

    return cursor;
  }
}
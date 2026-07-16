export type ToastType =
  | "success"
  | "info"
  | "warning"
  | "error";

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

export class ToastManager {
  private readonly container: HTMLDivElement;

  public constructor(
    container: HTMLDivElement
  ) {
    this.container = container;
  }

  public show({
    title,
    message = "",
    type = "info",
    duration = 2800
  }: ToastOptions): void {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const indicator =
      document.createElement("span");

    indicator.className =
      "toast-indicator";

    const content =
      document.createElement("div");

    content.className =
      "toast-content";

    const titleElement =
      document.createElement("strong");

    titleElement.className =
      "toast-title";

    titleElement.textContent = title;

    content.append(titleElement);

    if (message) {
      const messageElement =
        document.createElement("span");

      messageElement.className =
        "toast-message";

      messageElement.textContent =
        message;

      content.append(messageElement);
    }

    toast.append(
      indicator,
      content
    );

    this.container.append(toast);

    window.setTimeout(() => {
      toast.classList.add("removing");

      window.setTimeout(() => {
        toast.remove();
      }, 170);
    }, duration);
  }
}
import type {
  DrawingTool
} from "../shared/protocol";

interface ToolbarElements {
    clearButton: HTMLButtonElement;
  brushButton: HTMLButtonElement;
  eraserButton: HTMLButtonElement;
  colorInput: HTMLInputElement;
  widthInput: HTMLInputElement;
  widthValue: HTMLSpanElement;
  undoButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
}

export class Toolbar {
  private readonly elements: ToolbarElements;

  public constructor() {
    const brushButton =
      document.querySelector<HTMLButtonElement>(
        "#brushButton"
      );
      const clearButton =
  document.querySelector<HTMLButtonElement>(
    "#clearButton"
  );

    const eraserButton =
      document.querySelector<HTMLButtonElement>(
        "#eraserButton"
      );

    const colorInput =
      document.querySelector<HTMLInputElement>(
        "#colorInput"
      );

    const widthInput =
      document.querySelector<HTMLInputElement>(
        "#widthInput"
      );

    const widthValue =
      document.querySelector<HTMLSpanElement>(
        "#widthValue"
      );

    const undoButton =
      document.querySelector<HTMLButtonElement>(
        "#undoButton"
      );

    const redoButton =
      document.querySelector<HTMLButtonElement>(
        "#redoButton"
      );

    if (
      !brushButton ||
      !eraserButton ||
      !colorInput ||
      !widthInput ||
      !widthValue ||
      !undoButton ||
      !redoButton || !clearButton
    ) {
      throw new Error(
        "Toolbar elements are missing."
      );
    }

    this.elements = {
  brushButton,
  eraserButton,
  colorInput,
  widthInput,
  widthValue,
  undoButton,
  redoButton,
  clearButton
};
  }
public onClear(
  listener: () => void
): void {
  this.elements.clearButton.addEventListener(
    "click",
    listener
  );
}
  public onToolChange(
    listener: (tool: DrawingTool) => void
  ): void {
    this.elements.brushButton.addEventListener(
      "click",
      () => {
        this.setActiveTool("brush");
        listener("brush");
      }
    );

    this.elements.eraserButton.addEventListener(
      "click",
      () => {
        this.setActiveTool("eraser");
        listener("eraser");
      }
    );
  }

  public onColorChange(
    listener: (color: string) => void
  ): void {
    this.elements.colorInput.addEventListener(
      "input",
      () => {
        listener(
          this.elements.colorInput.value
        );
      }
    );
  }

  public onWidthChange(
    listener: (width: number) => void
  ): void {
    this.elements.widthInput.addEventListener(
      "input",
      () => {
        const width = Number(
          this.elements.widthInput.value
        );

        this.elements.widthValue.textContent =
          width.toString();

        listener(width);
      }
    );
  }

  public onUndo(
    listener: () => void
  ): void {
    this.elements.undoButton.addEventListener(
      "click",
      listener
    );
  }

  public onRedo(
    listener: () => void
  ): void {
    this.elements.redoButton.addEventListener(
      "click",
      listener
    );
  }

  public setHistoryState(
    canUndo: boolean,
    canRedo: boolean
  ): void {
    this.elements.undoButton.disabled = !canUndo;
    this.elements.redoButton.disabled = !canRedo;
  }

  private setActiveTool(
    tool: DrawingTool
  ): void {
    const brushSelected = tool === "brush";

    this.elements.brushButton.classList.toggle(
      "active",
      brushSelected
    );

    this.elements.eraserButton.classList.toggle(
      "active",
      !brushSelected
    );
  }
}
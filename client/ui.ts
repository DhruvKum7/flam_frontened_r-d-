import type { DrawingTool } from "../shared/protocol";

interface ToolbarElements {
  brushButton: HTMLButtonElement;
  eraserButton: HTMLButtonElement;
  colorInput: HTMLInputElement;
  widthInput: HTMLInputElement;
  widthValue: HTMLSpanElement;
}

export class Toolbar {
  private readonly elements: ToolbarElements;

  public constructor() {
    const brushButton =
      document.querySelector<HTMLButtonElement>("#brushButton");

    const eraserButton =
      document.querySelector<HTMLButtonElement>("#eraserButton");

    const colorInput =
      document.querySelector<HTMLInputElement>("#colorInput");

    const widthInput =
      document.querySelector<HTMLInputElement>("#widthInput");

    const widthValue =
      document.querySelector<HTMLSpanElement>("#widthValue");

    if (
      !brushButton ||
      !eraserButton ||
      !colorInput ||
      !widthInput ||
      !widthValue
    ) {
      throw new Error("Toolbar elements are missing.");
    }

    this.elements = {
      brushButton,
      eraserButton,
      colorInput,
      widthInput,
      widthValue
    };
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
        listener(this.elements.colorInput.value);
      }
    );
  }

  public onWidthChange(
    listener: (width: number) => void
  ): void {
    this.elements.widthInput.addEventListener(
      "input",
      () => {
        const width = Number(this.elements.widthInput.value);

        this.elements.widthValue.textContent =
          width.toString();

        listener(width);
      }
    );
  }

  private setActiveTool(tool: DrawingTool): void {
    const isBrush = tool === "brush";

    this.elements.brushButton.classList.toggle(
      "active",
      isBrush
    );

    this.elements.eraserButton.classList.toggle(
      "active",
      !isBrush
    );
  }
}
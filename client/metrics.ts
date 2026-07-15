export class PerformanceMetrics {
  private readonly fpsElement: HTMLElement;
  private readonly latencyElement: HTMLElement;

  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private animationFrameId: number | null = null;

  public constructor(
    fpsElement: HTMLElement,
    latencyElement: HTMLElement
  ) {
    this.fpsElement = fpsElement;
    this.latencyElement = latencyElement;

    this.startFpsCounter();
  }

  public updateLatency(latency: number): void {
    this.latencyElement.textContent =
      Math.max(0, Math.round(latency)).toString();
  }

  private startFpsCounter(): void {
    const measureFrame = (currentTime: number): void => {
      this.frameCount++;

      const elapsed =
        currentTime - this.lastFpsUpdate;

      if (elapsed >= 1000) {
        const fps =
          Math.round(
            (this.frameCount * 1000) / elapsed
          );

        this.fpsElement.textContent =
          fps.toString();

        this.frameCount = 0;
        this.lastFpsUpdate = currentTime;
      }

      this.animationFrameId =
        window.requestAnimationFrame(
          measureFrame
        );
    };

    this.animationFrameId =
      window.requestAnimationFrame(
        measureFrame
      );
  }
}
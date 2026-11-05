/**
 * Generates an interactive animated cinema stream on an offscreen canvas.
 * This guarantees offline playback, zero CORS restrictions, and instant testing.
 */
export class ProceduralCinemaEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animId: number | null = null;
  private lastTime: number = performance.now();
  private currentTime: number = 0;
  private duration: number = 60;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private onTimeUpdateCallback?: (time: number) => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d');
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getStream(fps: number = 30): MediaStream | null {
    if ('captureStream' in this.canvas) {
      return (this.canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(fps);
    }
    return null;
  }

  public setTime(sec: number) {
    this.currentTime = Math.max(0, Math.min(this.duration, sec));
    this.renderFrame(this.currentTime);
    if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(this.currentTime);
  }

  public getTime(): number {
    return this.currentTime;
  }

  public setRate(rate: number) {
    this.playbackRate = rate;
  }

  public play() {
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.loop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private loop = () => {
    if (!this.isPlaying) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.currentTime += dt * this.playbackRate;
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }

    this.renderFrame(this.currentTime);
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime);
    }

    this.animId = requestAnimationFrame(this.loop);
  };

  public renderFrame(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Deep cinematic background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const hue = (t * 12) % 360;
    grad.addColorStop(0, `hsl(${hue}, 40%, 6%)`);
    grad.addColorStop(0.5, '#05070e');
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 8%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing horizon grid
    ctx.save();
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.25)`;
    ctx.lineWidth = 1.5;
    const horizonY = h * 0.65;
    for (let y = horizonY; y <= h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const perspectiveCenter = w / 2;
    for (let x = -w * 0.5; x <= w * 1.5; x += 60) {
      ctx.beginPath();
      ctx.moveTo(perspectiveCenter, horizonY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.restore();

    // Pulsing audio visualizer bars in center
    const barCount = 36;
    const barWidth = 10;
    const barSpacing = 8;
    const totalW = barCount * (barWidth + barSpacing);
    const startX = (w - totalW) / 2;

    for (let i = 0; i < barCount; i++) {
      const phase = (i / barCount) * Math.PI * 2 + t * 4;
      const barHeight = 20 + Math.abs(Math.sin(phase) * Math.cos(t * 2 + i * 0.2)) * 140;
      const x = startX + i * (barWidth + barSpacing);
      const y = horizonY - barHeight;

      const barGrad = ctx.createLinearGradient(x, y, x, horizonY);
      barGrad.addColorStop(0, `hsl(${(hue + i * 5) % 360}, 90%, 70%)`);
      barGrad.addColorStop(1, `hsla(${(hue + i * 5) % 360}, 80%, 40%, 0.4)`);

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
    }

    // Clean visual stream without distracting text overlays
    ctx.restore();
  }
}

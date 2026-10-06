import { parseColor, ramp } from "./color.mjs";
import { encodePng } from "./png.mjs";

export class Pixels {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x, y) {
    if (!this.inside(x, y)) return [0, 0, 0, 0];
    const i = (y * this.width + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  set(x, y, color, blend = false) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) return this;
    const [r, g, b, a] = parseColor(color);
    const i = (y * this.width + x) * 4;
    if (blend && a < 255) {
      const below = this.get(x, y);
      const alpha = a / 255;
      const outAlpha = alpha + (below[3] / 255) * (1 - alpha);
      if (outAlpha <= 0) return this;
      const mixChannel = (top, bottom) => (top * alpha + bottom * (below[3] / 255) * (1 - alpha)) / outAlpha;
      this.data[i] = mixChannel(r, below[0]);
      this.data[i + 1] = mixChannel(g, below[1]);
      this.data[i + 2] = mixChannel(b, below[2]);
      this.data[i + 3] = outAlpha * 255;
      return this;
    }
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
    return this;
  }

  px(x, y, color) {
    return this.set(x, y, color);
  }

  rect(x, y, w, h, color, blend = false) {
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) this.set(x + xx, y + yy, color, blend);
    }
    return this;
  }

  hline(x, y, w, color) {
    return this.rect(x, y, w, 1, color);
  }

  vline(x, y, h, color) {
    return this.rect(x, y, 1, h, color);
  }

  frame(x, y, w, h, color) {
    this.hline(x, y, w, color);
    this.hline(x, y + h - 1, w, color);
    this.vline(x, y, h, color);
    this.vline(x + w - 1, y, h, color);
    return this;
  }

  box(x, y, w, h, base) {
    const tones = ramp(base);
    this.rect(x, y, w, h, tones.base);
    this.hline(x, y, w, tones.hi);
    this.vline(x, y, h, tones.hi);
    this.hline(x, y + h - 1, w, tones.lo);
    this.vline(x + w - 1, y, h, tones.lo);
    return this;
  }

  ellipse(cx, cy, rx, ry, color, blend = false) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, color, blend);
      }
    }
    return this;
  }

  orb(cx, cy, rx, ry, base) {
    const tones = ramp(base);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const light = -dx * 0.55 - dy * 0.75;
        this.set(x, y, light > 0.42 ? tones.hi : light < -0.35 ? tones.lo : tones.base);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, color) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let step = 0; step <= steps; step += 1) {
      this.set(x0 + ((x1 - x0) * step) / steps, y0 + ((y1 - y0) * step) / steps, color);
    }
    return this;
  }

  poly(points, color) {
    const ys = points.map((point) => point[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y += 1) {
      const crossings = [];
      for (let index = 0; index < points.length; index += 1) {
        const [ax, ay] = points[index];
        const [bx, by] = points[(index + 1) % points.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) {
          crossings.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
      }
      crossings.sort((a, b) => a - b);
      for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
        for (let x = Math.round(crossings[pair]); x < Math.round(crossings[pair + 1]); x += 1) this.set(x, y, color);
      }
    }
    return this;
  }

  dither(x, y, w, h, a, b, phase = 0) {
    for (let yy = 0; yy < h; yy += 1) {
      for (let xx = 0; xx < w; xx += 1) this.set(x + xx, y + yy, (xx + yy + phase) % 2 === 0 ? a : b);
    }
    return this;
  }

  roof(x, y, w, h, base, topInset = 0.22) {
    const tones = ramp(base);
    for (let row = 0; row < h; row += 1) {
      const t = h === 1 ? 1 : row / (h - 1);
      const inset = Math.round((1 - t) * (w / 2) * (1 - topInset));
      const left = x + inset;
      const width = w - inset * 2;
      const stripe = row % 3 === 2;
      this.hline(left, y + row, width, stripe ? tones.lo : tones.base);
      if (!stripe) {
        for (let tile = (row % 2) * 2; tile < width; tile += 4) this.px(left + tile, y + row, tones.hi);
      }
    }
    this.hline(x, y + h - 1, w, tones.deep);
    return this;
  }

  bricks(x, y, w, h, base, mortar) {
    const tones = ramp(base);
    this.rect(x, y, w, h, tones.base);
    for (let row = 0; row < h; row += 3) {
      this.hline(x, y + row + 2, w, mortar);
      for (let col = (Math.floor(row / 3) % 2) * 3; col < w; col += 6) {
        if (y + row + 1 < y + h) this.vline(x + col, y + row, 2, mortar);
      }
    }
    this.hline(x, y, w, tones.hi);
    this.vline(x + w - 1, y, h, tones.lo);
    return this;
  }

  planks(x, y, w, h, base, vertical = true) {
    const tones = ramp(base);
    this.rect(x, y, w, h, tones.base);
    if (vertical) {
      for (let col = 3; col < w; col += 4) this.vline(x + col, y, h, tones.lo);
      for (let col = 1; col < w; col += 4) this.vline(x + col, y, Math.max(0, h - 1), tones.hi);
    } else {
      for (let row = 3; row < h; row += 4) this.hline(x, y + row, w, tones.lo);
      for (let row = 1; row < h; row += 4) this.hline(x, y + row, w, tones.hi);
    }
    return this;
  }

  windowPane(x, y, w, h, glass = "#8fc9ef", frame = "#f4ead0") {
    const tones = ramp(glass);
    this.rect(x, y, w, h, frame);
    this.rect(x + 1, y + 1, w - 2, h - 2, tones.base);
    this.rect(x + 1, y + 1, Math.max(1, Math.floor((w - 2) / 2)), 1, tones.hi);
    this.vline(x + 1, y + 1, Math.max(1, Math.floor((h - 2) / 2)), tones.hi);
    this.hline(x + 1, y + h - 2, w - 2, tones.lo);
    return this;
  }

  softShadow(cx, cy, rx, ry, alpha = 70) {
    return this.ellipse(cx, cy, rx, ry, `#1b1b2a${alpha.toString(16).padStart(2, "0")}`, true);
  }

  blit(source, dx = 0, dy = 0, { flipX = false } = {}) {
    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const pixel = source.get(flipX ? source.width - 1 - x : x, y);
        if (pixel[3] === 0) continue;
        this.set(dx + x, dy + y, pixel, true);
      }
    }
    return this;
  }

  outline(color, includeDiagonals = false) {
    const marks = [];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.get(x, y)[3] > 0) continue;
        const neighbours = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        if (includeDiagonals) {
          neighbours.push([x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]);
        }
        if (neighbours.some(([nx, ny]) => this.get(nx, ny)[3] > 200)) marks.push([x, y]);
      }
    }
    marks.forEach(([x, y]) => this.set(x, y, color));
    return this;
  }

  mapPixels(transform) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const next = transform(this.get(x, y), x, y);
        if (next) this.set(x, y, next);
      }
    }
    return this;
  }

  scaled(factor) {
    const out = new Pixels(this.width * factor, this.height * factor);
    for (let y = 0; y < out.height; y += 1) {
      for (let x = 0; x < out.width; x += 1) {
        const source = this.get(Math.floor(x / factor), Math.floor(y / factor));
        const i = (y * out.width + x) * 4;
        out.data[i] = source[0];
        out.data[i + 1] = source[1];
        out.data[i + 2] = source[2];
        out.data[i + 3] = source[3];
      }
    }
    return out;
  }

  toPng(factor = 1) {
    const source = factor === 1 ? this : this.scaled(factor);
    return encodePng(source.width, source.height, source.data);
  }
}

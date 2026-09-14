import { generateHeliosSystem } from "./system.js";

self.onmessage = (event) => {
  const { id, seed } = event.data || {};
  try {
    const scene = generateHeliosSystem(seed);
    const transfer = [];
    for (const sprite of scene.sprites) {
      if (sprite.pixels?.buffer) transfer.push(sprite.pixels.buffer);
    }
    self.postMessage({ id, ok: true, scene }, transfer);
  } catch (err) {
    self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};

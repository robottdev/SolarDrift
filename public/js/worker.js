import { generateGalaxy } from "./system.js";

self.onmessage = (event) => {
  const { id, settings, seed } = event.data || {};
  try {
    const galaxy = generateGalaxy(settings || { seed });
    const transfer = [];
    for (const sprite of galaxy.sprites) {
      if (sprite.pixels?.buffer) transfer.push(sprite.pixels.buffer);
    }
    self.postMessage({ id, ok: true, galaxy }, transfer);
  } catch (err) {
    self.postMessage({ id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};

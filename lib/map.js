/** Galaxy chart layout. Pure helpers shared by the HUD overlay and tests. */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniquePush(list, value) {
  if (!list.includes(value)) list.push(value);
}

/** Place systems on a seeded arc and wire wormhole lanes. Same seed remakes the same chart. */
export function galaxyOverview(systems = [], numericSeed = 0, current = 0) {
  const list = Array.isArray(systems) ? systems : [];
  const n = list.length;
  const rand = mulberry32((numericSeed >>> 0) ^ 0x6d6170);
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const sys = list[i] || {};
    const t = n <= 1 ? 0 : i / (n - 1);
    const ang = -0.62 + t * 2.42 + (rand() - 0.5) * 0.38;
    const rad = n <= 1 ? 0 : 86 + t * (128 + n * 16) + (rand() - 0.5) * 32;
    nodes.push({
      index: i,
      id: sys.id || `sys-${i}`,
      name: sys.starName || `System ${i + 1}`,
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad,
      current: i === current,
      linked: [],
    });
  }

  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        const d = Math.hypot(dx, dy) || 0.001;
        const minD = 78;
        if (d >= minD) continue;
        const push = (minD - d) * 0.42;
        dx /= d;
        dy /= d;
        nodes[i].x -= dx * push * 0.5;
        nodes[i].y -= dy * push * 0.5;
        nodes[j].x += dx * push * 0.5;
        nodes[j].y += dy * push * 0.5;
      }
    }
  }

  const edges = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    for (const hole of list[i]?.wormholes || []) {
      const target = hole.target;
      if (!Number.isInteger(target) || target < 0 || target >= n || target === i) continue;
      uniquePush(nodes[i].linked, target);
      const a = Math.min(i, target);
      const b = Math.max(i, target);
      const key = `${a}:${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b });
    }
  }

  return {
    nodes,
    edges,
    numericSeed: numericSeed >>> 0,
    current: current | 0,
  };
}

/** Fit overview nodes into a canvas. Returns screen-space nodes and edge segments. */
export function projectOverview(overview, width, height, pad = 64) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const padding = Math.max(24, Number(pad) || 64);
  const nodes = overview?.nodes || [];
  if (!nodes.length) return { nodes: [], edges: [], width: w, height: h, scale: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  const spanX = Math.max(140, maxX - minX);
  const spanY = Math.max(140, maxY - minY);
  const innerW = Math.max(1, w - padding * 2);
  const innerH = Math.max(1, h - padding * 2);
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const ox = padding + (innerW - spanX * scale) / 2;
  const oy = padding + (innerH - spanY * scale) / 2;
  const projected = nodes.map((node) => ({
    ...node,
    sx: ox + (node.x - minX) * scale,
    sy: oy + (node.y - minY) * scale,
  }));
  const edges = (overview.edges || []).map((edge) => ({
    a: edge.a,
    b: edge.b,
    ax: projected[edge.a].sx,
    ay: projected[edge.a].sy,
    bx: projected[edge.b].sx,
    by: projected[edge.b].sy,
  }));
  return { nodes: projected, edges, width: w, height: h, scale };
}

/** Nearest projected node within hit radius, or null. */
export function hitOverviewNode(projected, x, y, radius = 28) {
  const nodes = projected?.nodes || [];
  const hitR = Math.max(8, Number(radius) || 28);
  let best = null;
  for (const node of nodes) {
    const d = Math.hypot(x - node.sx, y - node.sy);
    if (d <= hitR && (!best || d < best.d)) best = { index: node.index, d, node };
  }
  return best;
}

export function gateToward(wormholes, target) {
  return (wormholes || []).find((hole) => hole.target === target) || null;
}

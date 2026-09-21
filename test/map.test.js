import test from "node:test";
import assert from "node:assert/strict";
import { galaxyOverview, gateToward, hitOverviewNode, projectOverview } from "../lib/map.js";

function chain(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i === 0 ? "helios" : `sys-${i}`,
    starName: i === 0 ? "Helios" : `Star ${i}`,
    wormholes: [
      ...(i > 0 ? [{ target: i - 1 }] : []),
      ...(i < n - 1 ? [{ target: i + 1 }] : []),
    ],
  }));
}

test("galaxy overview is deterministic for a seed and chains wormhole lanes", () => {
  const systems = chain(3);
  const a = galaxyOverview(systems, 1993, 0);
  const b = galaxyOverview(systems, 1993, 0);
  assert.equal(a.nodes.length, 3);
  assert.equal(a.nodes[0].name, "Helios");
  assert.equal(a.nodes[0].current, true);
  assert.deepEqual(
    a.nodes.map((n) => [n.x, n.y]),
    b.nodes.map((n) => [n.x, n.y])
  );
  assert.deepEqual(a.edges, [
    { a: 0, b: 1 },
    { a: 1, b: 2 },
  ]);
  assert.deepEqual(a.nodes[0].linked, [1]);
  assert.deepEqual(a.nodes[1].linked.sort(), [0, 2]);
  assert.equal(a.nodes[0].linked.includes(2), false);

  const other = galaxyOverview(systems, 77, 1);
  assert.equal(other.nodes[1].current, true);
  const same = a.nodes.every((n, i) => n.x === other.nodes[i].x && n.y === other.nodes[i].y);
  assert.equal(same, false);
});

test("projected nodes stay on the chart and hits resolve to the nearest star", () => {
  const overview = galaxyOverview(chain(4), 1993, 2);
  const projected = projectOverview(overview, 800, 500, 60);
  assert.equal(projected.nodes.length, 4);
  assert.equal(projected.edges.length, 3);
  for (const node of projected.nodes) {
    assert.ok(node.sx >= 40 && node.sx <= 760, `sx ${node.sx}`);
    assert.ok(node.sy >= 40 && node.sy <= 460, `sy ${node.sy}`);
  }
  const here = projected.nodes[2];
  const hit = hitOverviewNode(projected, here.sx, here.sy, 28);
  assert.equal(hit.index, 2);
  assert.equal(hitOverviewNode(projected, 8, 8, 20), null);
  assert.equal(gateToward([{ target: 1, name: "Gate to Star 1" }, { target: 0 }], 1).target, 1);
  assert.equal(gateToward([{ target: 0 }], 2), null);
});

test("a one-star claim still charts Helios with no lanes", () => {
  const overview = galaxyOverview(chain(1), 1, 0);
  assert.equal(overview.nodes.length, 1);
  assert.equal(overview.edges.length, 0);
  assert.equal(overview.nodes[0].name, "Helios");
  const projected = projectOverview(overview, 400, 300);
  assert.ok(projected.nodes[0].sx > 0);
  assert.ok(projected.nodes[0].sy > 0);
});

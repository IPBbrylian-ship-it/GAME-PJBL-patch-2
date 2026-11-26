import { AABB } from './levels';

export interface Point2D {
  x: number;
  z: number;
}

export interface NavBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface NavGrid {
  minX: number;
  minZ: number;
  cellSize: number;
  cols: number;
  rows: number;
  agentRadius: number;
  staticBlocked: Uint8Array;
}

function testAABBListOverlap(
  x: number,
  z: number,
  radius: number,
  list: AABB[]
): boolean {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (
      x + radius > c.minX &&
      x - radius < c.maxX &&
      z + radius > c.minZ &&
      z - radius < c.maxZ
    ) {
      return true;
    }
  }
  return false;
}

export function collidesWithWorld(
  x: number,
  z: number,
  radius: number,
  colliders: AABB[],
  bounds: NavBounds,
  extraColliders?: AABB[]
): boolean {
  if (
    x < bounds.minX + radius ||
    x > bounds.maxX - radius ||
    z < bounds.minZ + radius ||
    z > bounds.maxZ - radius
  ) {
    return true;
  }
  if (testAABBListOverlap(x, z, radius, colliders)) return true;
  if (extraColliders && extraColliders.length > 0) {
    if (testAABBListOverlap(x, z, radius, extraColliders)) return true;
  }
  return false;
}

export function resolveCircleAABB(
  x: number,
  z: number,
  radius: number,
  colliders: AABB[],
  bounds: NavBounds,
  extraColliders?: AABB[]
): Point2D {
  let px = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x));
  let pz = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, z));

  const resolveList = (list: AABB[]) => {
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const closestX = Math.max(c.minX, Math.min(px, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(pz, c.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq === 0) {
        // Center is inside the AABB: push out along nearest face
        const penLeft = px - c.minX;
        const penRight = c.maxX - px;
        const penTop = pz - c.minZ;
        const penBottom = c.maxZ - pz;
        const minPen = Math.min(penLeft, penRight, penTop, penBottom);
        if (minPen === penLeft) px = c.minX - radius - 0.002;
        else if (minPen === penRight) px = c.maxX + radius + 0.002;
        else if (minPen === penTop) pz = c.minZ - radius - 0.002;
        else pz = c.maxZ + radius + 0.002;
      } else if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        const push = radius - dist + 0.001;
        px += (dx / dist) * push;
        pz += (dz / dist) * push;
      }
    }
  };

  for (let iter = 0; iter < 3; iter++) {
    resolveList(colliders);
    if (extraColliders && extraColliders.length > 0) {
      resolveList(extraColliders);
    }
    px = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, px));
    pz = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, pz));
  }

  return { x: px, z: pz };
}

function segmentHitsAABB(
  ax: number,
  az: number,
  dx: number,
  dz: number,
  c: AABB,
  pad: number
): boolean {
  const minX = c.minX - pad;
  const maxX = c.maxX + pad;
  const minZ = c.minZ - pad;
  const maxZ = c.maxZ + pad;

  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) < 1e-8) {
    if (ax < minX || ax > maxX) return false;
  } else {
    const invDx = 1 / dx;
    let t1 = (minX - ax) * invDx;
    let t2 = (maxX - ax) * invDx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  if (Math.abs(dz) < 1e-8) {
    if (az < minZ || az > maxZ) return false;
  } else {
    const invDz = 1 / dz;
    let t1 = (minZ - az) * invDz;
    let t2 = (maxZ - az) * invDz;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  return tMax >= 0 && tMin <= 1;
}

export function hasLineOfSight(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  colliders: AABB[],
  extraColliders?: AABB[],
  pad = 0.02
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  for (let i = 0; i < colliders.length; i++) {
    if (segmentHitsAABB(ax, az, dx, dz, colliders[i], pad)) return false;
  }
  if (extraColliders) {
    for (let i = 0; i < extraColliders.length; i++) {
      if (segmentHitsAABB(ax, az, dx, dz, extraColliders[i], pad)) return false;
    }
  }
  return true;
}

export function isInPlayerViewCone(
  playerX: number,
  playerZ: number,
  playerYaw: number,
  targetX: number,
  targetZ: number,
  minCosAngle = 0.45
): boolean {
  const dx = targetX - playerX;
  const dz = targetZ - playerZ;
  const len = Math.hypot(dx, dz);
  if (len < 0.001) return true;
  const fx = -Math.sin(playerYaw);
  const fz = -Math.cos(playerYaw);
  const dot = (fx * dx + fz * dz) / len;
  return dot >= minCosAngle;
}

export function buildNavGrid(
  bounds: NavBounds,
  colliders: AABB[],
  agentRadius = 0.36,
  cellSize = 0.55
): NavGrid {
  const cols = Math.max(4, Math.ceil((bounds.maxX - bounds.minX) / cellSize));
  const rows = Math.max(4, Math.ceil((bounds.maxZ - bounds.minZ) / cellSize));
  const staticBlocked = new Uint8Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    const wz = bounds.minZ + (r + 0.5) * cellSize;
    for (let c = 0; c < cols; c++) {
      const wx = bounds.minX + (c + 0.5) * cellSize;
      if (collidesWithWorld(wx, wz, agentRadius, colliders, bounds)) {
        staticBlocked[r * cols + c] = 1;
      }
    }
  }

  return {
    minX: bounds.minX,
    minZ: bounds.minZ,
    cellSize,
    cols,
    rows,
    agentRadius,
    staticBlocked,
  };
}

function isCellWalkable(
  grid: NavGrid,
  c: number,
  r: number,
  extraColliders?: AABB[]
): boolean {
  if (c < 0 || c >= grid.cols || r < 0 || r >= grid.rows) return false;
  if (grid.staticBlocked[r * grid.cols + c] === 1) return false;
  if (extraColliders && extraColliders.length > 0) {
    const wx = grid.minX + (c + 0.5) * grid.cellSize;
    const wz = grid.minZ + (r + 0.5) * grid.cellSize;
    if (testAABBListOverlap(wx, wz, grid.agentRadius, extraColliders)) {
      return false;
    }
  }
  return true;
}

function snapToWalkableCell(
  grid: NavGrid,
  c0: number,
  r0: number,
  extraColliders?: AABB[]
): [number, number] | null {
  const cc = Math.max(0, Math.min(grid.cols - 1, c0));
  const rr = Math.max(0, Math.min(grid.rows - 1, r0));
  if (isCellWalkable(grid, cc, rr, extraColliders)) return [cc, rr];

  for (let rad = 1; rad <= 5; rad++) {
    let best: [number, number] | null = null;
    let bestDist = Infinity;
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const nc = cc + dc;
        const nr = rr + dr;
        if (isCellWalkable(grid, nc, nr, extraColliders)) {
          const d = dc * dc + dr * dr;
          if (d < bestDist) {
            bestDist = d;
            best = [nc, nr];
          }
        }
      }
    }
    if (best) return best;
  }
  return null;
}

const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, 1.4142],
  [1, -1, 1.4142],
  [-1, 1, 1.4142],
  [-1, -1, 1.4142],
];

export function findPath(
  grid: NavGrid,
  startX: number,
  startZ: number,
  goalX: number,
  goalZ: number,
  colliders: AABB[],
  extraColliders?: AABB[]
): Point2D[] {
  const scRaw = Math.floor((startX - grid.minX) / grid.cellSize);
  const srRaw = Math.floor((startZ - grid.minZ) / grid.cellSize);
  const gcRaw = Math.floor((goalX - grid.minX) / grid.cellSize);
  const grRaw = Math.floor((goalZ - grid.minZ) / grid.cellSize);

  const startCell = snapToWalkableCell(grid, scRaw, srRaw, extraColliders);
  const goalCell = snapToWalkableCell(grid, gcRaw, grRaw, extraColliders);
  if (!startCell || !goalCell) return [];

  const [sc, sr] = startCell;
  const [gc, gr] = goalCell;
  if (sc === gc && sr === gr) {
    return [{ x: goalX, z: goalZ }];
  }

  const total = grid.cols * grid.rows;
  const gScore = new Float32Array(total);
  gScore.fill(1e9);
  const fScore = new Float32Array(total);
  fScore.fill(1e9);
  const parent = new Int32Array(total);
  parent.fill(-1);
  const closed = new Uint8Array(total);
  const inOpen = new Uint8Array(total);

  const startIdx = sr * grid.cols + sc;
  const goalIdx = gr * grid.cols + gc;

  const octile = (c: number, r: number) => {
    const dx = Math.abs(c - gc);
    const dz = Math.abs(r - gr);
    return dx + dz + (1.4142 - 2) * Math.min(dx, dz);
  };

  gScore[startIdx] = 0;
  fScore[startIdx] = octile(sc, sr);

  // Simple array-based min-heap for fast A*
  const heap: number[] = [startIdx];
  inOpen[startIdx] = 1;

  const heapPush = (idx: number) => {
    heap.push(idx);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (fScore[heap[p]] <= fScore[heap[i]]) break;
      const tmp = heap[p];
      heap[p] = heap[i];
      heap[i] = tmp;
      i = p;
    }
  };

  const heapPop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      const n = heap.length;
      while (true) {
        let best = i;
        const l = i * 2 + 1;
        const r = l + 1;
        if (l < n && fScore[heap[l]] < fScore[heap[best]]) best = l;
        if (r < n && fScore[heap[r]] < fScore[heap[best]]) best = r;
        if (best === i) break;
        const tmp = heap[i];
        heap[i] = heap[best];
        heap[best] = tmp;
        i = best;
      }
    }
    return top;
  };

  let found = false;
  let expansions = 0;
  const maxExpansions = total * 2;

  while (heap.length > 0 && expansions < maxExpansions) {
    expansions++;
    const curr = heapPop();
    inOpen[curr] = 0;
    if (curr === goalIdx) {
      found = true;
      break;
    }
    if (closed[curr]) continue;
    closed[curr] = 1;

    const cc = curr % grid.cols;
    const cr = Math.floor(curr / grid.cols);
    const cg = gScore[curr];

    for (let i = 0; i < DIRS.length; i++) {
      const [dc, dr, cost] = DIRS[i];
      const nc = cc + dc;
      const nr = cr + dr;
      if (!isCellWalkable(grid, nc, nr, extraColliders)) continue;

      // Disallow diagonal corner-cutting across blocked orthogonal cells
      if (dc !== 0 && dr !== 0) {
        if (
          !isCellWalkable(grid, cc + dc, cr, extraColliders) ||
          !isCellWalkable(grid, cc, cr + dr, extraColliders)
        ) {
          continue;
        }
      }

      const nIdx = nr * grid.cols + nc;
      if (closed[nIdx]) continue;

      const tentativeG = cg + cost;
      if (tentativeG < gScore[nIdx]) {
        parent[nIdx] = curr;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + octile(nc, nr);
        if (!inOpen[nIdx]) {
          inOpen[nIdx] = 1;
          heapPush(nIdx);
        }
      }
    }
  }

  if (!found) return [];

  const rawPoints: Point2D[] = [];
  let trace = goalIdx;
  while (trace !== -1 && trace !== startIdx) {
    const tc = trace % grid.cols;
    const tr = Math.floor(trace / grid.cols);
    rawPoints.push({
      x: grid.minX + (tc + 0.5) * grid.cellSize,
      z: grid.minZ + (tr + 0.5) * grid.cellSize,
    });
    trace = parent[trace];
  }
  rawPoints.reverse();

  // Replace final point with exact goal if walkable
  if (
    rawPoints.length > 0 &&
    !testAABBListOverlap(goalX, goalZ, grid.agentRadius * 0.8, colliders) &&
    (!extraColliders || !testAABBListOverlap(goalX, goalZ, grid.agentRadius * 0.8, extraColliders))
  ) {
    rawPoints[rawPoints.length - 1] = { x: goalX, z: goalZ };
  }

  // String-pull smoothing with LOS padded by agentRadius
  if (rawPoints.length <= 2) return rawPoints;
  const smoothed: Point2D[] = [];
  let anchorX = startX;
  let anchorZ = startZ;
  let idx = 0;
  while (idx < rawPoints.length) {
    let farthest = idx;
    for (let j = rawPoints.length - 1; j > idx; j--) {
      if (
        hasLineOfSight(
          anchorX,
          anchorZ,
          rawPoints[j].x,
          rawPoints[j].z,
          colliders,
          extraColliders,
          grid.agentRadius * 0.92
        )
      ) {
        farthest = j;
        break;
      }
    }
    smoothed.push(rawPoints[farthest]);
    anchorX = rawPoints[farthest].x;
    anchorZ = rawPoints[farthest].z;
    idx = farthest + 1;
  }

  return smoothed;
}

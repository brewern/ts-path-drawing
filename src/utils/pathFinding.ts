export function drawPathBetweenElements(elem1: HTMLElement, elem2: HTMLElement, allElements: HTMLElement[], canvas: any): void {
  const start = { x: elem1.offsetLeft, y: elem1.offsetTop };
  const goal = { x: elem2.offsetLeft, y: elem2.offsetTop };

  const obstacles: Point[] = [];

  for (const element of allElements) {
    if (element !== elem1 && element !== elem2) {
      const rect = element.getBoundingClientRect();
      obstacles.push({ x: rect.left, y: rect.top });
    }
  }

  const path = pathfind(start, goal, obstacles);

  if (path) {
    const context = canvas.getContext("2d")!;

    context.beginPath();
    context.moveTo(elem1.offsetLeft, elem1.offsetTop);

    for (const point of path) {
      context.lineTo(point.x, point.y);
    }

    context.lineTo(elem2.offsetLeft, elem2.offsetTop);
    context.stroke();
  } else {
    throw new Error("No path found");
  }
}

interface Point {
  x: number;
  y: number;
}

interface PathNode {
  point: Point;
  parent?: PathNode;
  fScore: number;
  gScore: number;
}

export function pathfind(start: Point, goal: Point, obstacles: Point[]): Point[] | null {
  const openSet: PathNode[] = [{ point: start, fScore: 0, gScore: 0 }];
  const closedSet: Point[] = [];

  const stepSize = 10;

  function getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];

    for (let dx = -stepSize; dx <= stepSize; dx += stepSize) {
      for (let dy = -stepSize; dy <= stepSize; dy += stepSize) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const neighbor: Point = { x: point.x + dx, y: point.y + dy };

        if (obstacles.some((o) => o.x === neighbor.x && o.y === neighbor.y)) {
          continue;
        }

        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  function getDistance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  function reconstructPath(node: PathNode): Point[] {
    const path: Point[] = [node.point];

    while (node.parent) {
      path.unshift(node.parent.point);
      node = node.parent;
    }

    return path;
  }

  let stopInfinitity = 0

  while (openSet.length > 0 && stopInfinitity < 100) {
    stopInfinitity++
    console.log({ openSet })
    const currentNode = openSet.sort((a, b) => a.fScore - b.fScore)[0];
    openSet.splice(openSet.indexOf(currentNode), 1);

    if (currentNode.point.x === goal.x && currentNode.point.y === goal.y) {
      return reconstructPath(currentNode);
    }

    closedSet.push(currentNode.point);

    const neighbors = getNeighbors(currentNode.point);

    for (const neighbor of neighbors) {
      if (closedSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
        continue;
      }

      const gScore = currentNode.gScore + getDistance(currentNode.point, neighbor);
      const fScore = gScore + getDistance(neighbor, goal);

      const existingNode = openSet.find((n) => n.point.x === neighbor.x && n.point.y === neighbor.y);

      if (!existingNode) {
        openSet.push({
          point: neighbor,
          parent: currentNode,
          fScore,
          gScore,
        });
      } else if (gScore < existingNode.gScore) {
        existingNode.gScore = gScore;
        existingNode.fScore = fScore;
        existingNode.parent = currentNode;
      }
    }
  }

  return null;
}

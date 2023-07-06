type IObstacles = HTMLElement[]

interface ICoord {
  x: number
  y: number
}

interface IDrawGridPathArgs {
  canvas: HTMLCanvasElement
  startEl: Element
  endEl: Element
  obstacles: IObstacles
  gridSize: number
}

export function drawGridPath({ canvas, startEl, endEl, obstacles, gridSize }: IDrawGridPathArgs) {
  const startRect = startEl.getBoundingClientRect();
  const endRect = endEl.getBoundingClientRect();

  const start = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2,
  };

  const end = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2,
  };

  const path = getPath({ start, end, obstacles, gridSize });

  const ctx = canvas.getContext('2d');
  ctx?.beginPath();
  ctx?.moveTo(start.x, start.y);

  path.forEach(point => {
    ctx?.lineTo(point.x, point.y);
  });

  ctx?.stroke();
}

interface IPathArgs {
  start: ICoord
  end: ICoord
  obstacles: IObstacles
  gridSize: number
}

function getPath({ start, end, obstacles, gridSize }: IPathArgs) {
  const path = [];
  let curr = start;

  for (let i = 0; i < obstacles.length; i++) {
    const closestObstacle = getClosestObstacle({ point: curr, obstacles });

    if (!closestObstacle) {
      path.push(end);
      break;
    }

    const obstaclePath = getObstacleGridPath({
      startPoint: curr,
      closestObstacle,
      gridSize,
      obstacles,
    })
    path.push(...obstaclePath);

    if (obstaclePath.length > 0) {
      curr = obstaclePath[obstaclePath.length - 1];
    }
  }

  return path;
}

interface IClosestObstacleArgs {
  point: ICoord
  obstacles: IObstacles
}

function getClosestObstacle({ point, obstacles }: IClosestObstacleArgs): HTMLElement | null {
  let closestObstacle = null;
  let closestDist = Infinity;

  obstacles.forEach(obstacle => {
    const obstacleBounds = obstacle.getBoundingClientRect();
    const point2 = {
      x: obstacleBounds.x,
      y: obstacleBounds.y,
    }
    const dist = getDistance(point, point2);

    if (dist < closestDist) {
      closestObstacle = obstacle;
      closestDist = dist;
    }
  });

  return closestObstacle;
}

function getDistance(point1: ICoord, point2: ICoord) {
  const xDistance = point2.x - point1.x;
  const yDistance = point2.y - point1.y;
  
  // use the Pythagorean theorem to calculate the distance between the points
  const distance = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
  
  return distance;
}

interface IObstacleGridPath {
  startPoint: ICoord
  closestObstacle: HTMLElement
  gridSize: number
  obstacles: IObstacles
}

function getObstacleGridPath({ startPoint, closestObstacle, gridSize, obstacles }: IObstacleGridPath): ICoord[] {
  const obstacleRect = closestObstacle.getBoundingClientRect();
  const obstacleCorners = [
    { x: obstacleRect.left, y: obstacleRect.top },
    { x: obstacleRect.left, y: obstacleRect.bottom },
    { x: obstacleRect.right, y: obstacleRect.top },
    { x: obstacleRect.right, y: obstacleRect.bottom },
  ];

  const distanceToCorners = obstacleCorners.map(corner =>
    getDistance(startPoint, corner)
  );

  const closestCornerIndex = distanceToCorners.indexOf(
    Math.min(...distanceToCorners)
  );
  const closestCorner = obstacleCorners[closestCornerIndex];

  const xSteps = Math.abs(closestCorner.x - startPoint.x) / gridSize;
  const ySteps = Math.abs(closestCorner.y - startPoint.y) / gridSize;

  const gridPath = [];
  let curr = startPoint;

  for (let i = 0; i < xSteps; i++) {
    const newX =
      startPoint.x +
      (closestCorner.x - startPoint.x) / xSteps +
      (i * (closestCorner.x - startPoint.x)) / xSteps;
    const newPoint = { x: newX, y: curr.y };
    if (!isCollidingWithObstacle(newPoint, obstacles)) {
      gridPath.push(newPoint);
      curr = newPoint;
    } else {
      break;
    }
  }

  for (let i = 0; i < ySteps; i++) {
    const newY =
      startPoint.y +
      (closestCorner.y - startPoint.y) / ySteps +
      (i * (closestCorner.y - startPoint.y)) / ySteps;
    const newPoint = { x: curr.x, y: newY };
    if (!isCollidingWithObstacle(newPoint, obstacles)) {
      gridPath.push(newPoint);
      curr = newPoint;
    } else {
      break;
    }
  }

  // Round off the coordinates to the nearest 10 pixels
  const roundedGridPath = gridPath.map(point => ({
    x: Math.round(point.x / 10) * 10,
    y: Math.round(point.y / 10) * 10
  }));

  console.log({ roundedGridPath })


  return roundedGridPath;
}

function isCollidingWithObstacle(point: ICoord, obstacles: IObstacles): boolean {
  let colliding = false;

  obstacles.forEach(obstacle => {
    if (point.x >= obstacle.offsetLeft && point.x <= obstacle.offsetLeft + obstacle.offsetWidth &&
      point.y >= obstacle.offsetTop && point.y <= obstacle.offsetTop + obstacle.offsetHeight) {
      colliding = true;
    }
  });

  return colliding;
}

import {
  IAnimatePulse,
  IConnectNode,
  IClosestObstacle,
  IDraw,
  ILineTicker,
  IObstacleCoord,
  IPathBuilder,
  IPathInCache,
  IWithinAnyObstacle,
  IWithinObstacle,
  IWithinRange,
} from './types'

const NODE_SIZE = 10
const NODE_SIZE_HALF = NODE_SIZE / 2

export class PathBuilder implements IPathBuilder {
  private readonly LINE_COLORS: string[] = ["#016373", "#08A2A5", "#E8891E", "#B25A20", "#D33C52", "#6C5A9A"]
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D
  private cache = new Set<string>()
  private obstacleCoords: IObstacleCoord[] = []
  static DEBUG_OBSTACLE_COORDS = false
  static OBSTACLE_CONFIG = {
    radius: 1,
    maxRadius: 10,
    duration: 20000,
  }

  constructor(
    public readonly connections: IConnectNode[],
    public readonly obstacleElems: NodeListOf<Element>,
  ) {

    this.canvas = this.createCanvas()
    this.ctx = this.createContext()

    this.scaleCanvas(this.canvas, this.canvas.width, this.canvas.height)

    this.obstacleCoords = this.getObstacleCoords()

    for (const connection of connections) {
      this.draw({ connection })
    }

    console.log({ cache: this.cache })
  }

  createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.top = '0px';
    canvas.style.zIndex = "1"
    document.body.appendChild(canvas)

    return canvas
  }

  createContext(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Canvas failed to getContext which is required!")
    }

    return ctx
  }

  getObstacleCoords() {
    const coords = []
    for (const elem of this.obstacleElems) {
      const rect = elem.getBoundingClientRect()
      const p1 = { x: rect.left, y: rect.top };
      const p2 = { x: rect.right, y: rect.top };
      const p3 = { x: rect.right, y: rect.bottom };
      const p4 = { x: rect.left, y: rect.bottom };
      const box = { p1, p2, p3, p4, elem }

      if (PathBuilder.DEBUG_OBSTACLE_COORDS) {
        const config = {
          radius: 1,
          maxRadius: 10,
          duration: 20000,
        }
  
        this.animatePulse({ ...p1, ...config })
        this.animatePulse({ ...p2, ...config })
        this.animatePulse({ ...p3, ...config })
        this.animatePulse({ ...p4, ...config })
      }

      coords.push(box)
    }
    return coords
  }

  findClosestObstacle({ x, y, direction }: IClosestObstacle): IObstacleCoord | null {
    let closestObstacle = null;
    let closestDistance = Infinity;
  
    for (const obstacle of this.obstacleCoords) {
      const { p1, p2, p3, p4 } = obstacle

      const minX = Math.min(p1.x, p2.x, p3.x, p4.x)
      const maxX = Math.max(p1.x, p2.x, p3.x, p4.x)

      if (!direction) {
        for (const corner in obstacle) {
          const { x: cornerX, y: cornerY } = obstacle[corner as keyof IObstacleCoord] as IClosestObstacle;
          const distance = Math.sqrt((cornerX - x) ** 2 + (cornerY - y) ** 2);
    
          if (distance < closestDistance) {
            closestObstacle = obstacle;
            closestDistance = distance;
          }
        }
        return closestObstacle
      }

      if (
        (direction === 'left' && x > maxX) || // Check if direction is left and x is less than max X
        (direction === 'right' && x < minX)   // Check if direction is right and x is greater than min X
      ) {
        for (const corner in obstacle) {
          const { x: cornerX, y: cornerY } = obstacle[corner as keyof IObstacleCoord] as IClosestObstacle;
          const distance = Math.sqrt((cornerX - x) ** 2 + (cornerY - y) ** 2);
    
          if (distance < closestDistance) {
            closestObstacle = obstacle;
            closestDistance = distance;
          }
        }
      }
    }
  
    return closestObstacle;
  }

  pickRandomAndRemove(array: string[]) {
    const randomIndex = Math.floor(Math.random() * array.length);
    const randomValue = array.splice(randomIndex, 1)[0];
    return randomValue;
  }

  isWithinAnyObstacle({ x, y, padding = 0 }: IWithinAnyObstacle): boolean {
    for (const obstacle of this.obstacleCoords) {
      const { p1, p2, p3, p4 } = obstacle;
  
      const minX = Math.min(p1.x, p2.x, p3.x, p4.x) - padding;
      const maxX = Math.max(p1.x, p2.x, p3.x, p4.x) + padding;
      const minY = Math.min(p1.y, p2.y, p3.y, p4.y) - padding;
      const maxY = Math.max(p1.y, p2.y, p3.y, p4.y) + padding;
  
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return true;
      }
    }
  
    return false;
  }

  isWithinObstacle({ obstacle, x, y, padding = 0 }: IWithinObstacle): boolean {
    const { p1, p2, p3, p4 } = obstacle;

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x) - padding;
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x) + padding;
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y) - padding;
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y) + padding;

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return true;
    }
  
    return false;
  }

  draw({ connection }: IDraw) {
    const ctx = this.ctx

    const { start, end, direction = 'left' } = connection

    ctx.beginPath()
    ctx.strokeStyle = this.pickRandomAndRemove(this.LINE_COLORS)
    ctx.lineWidth = 3
    // Step 1
    ctx.moveTo(start.x, start.y)
    this.lineTicker({ start, end, direction })
    ctx.stroke()
  }

  lineTicker({ start, end, direction }: ILineTicker) {
    const ctx = this.ctx
    const PADDING = 20
    // Closest obstacle is source, when excluding the direction away from source.
    const sourceObstacle = this.findClosestObstacle({ x: start.x, y: start.y, direction: null })

    if (!sourceObstacle) {
      throw Error('No source for the line was found!')
    }

    // Manage state of the line leaving the source.
    const sourceState = {
      launched: false, // Start moving away.
      cleared: false, // Moved away and begin moving downward.
    }

    let currX = start.x
    let currY = start.y
    let newDirection = direction
    let prevDirection = direction
    let prevX = start.x
    let prevY = start.y

    let tempCounter = 0

    const stepX = (x: number) => ctx.lineTo(x, currY)
    const stepY = (y: number) => ctx.lineTo(currX, y)

    // open cache path
    // TODO: Implement cache
    
    while (tempCounter < 2000) {
      tempCounter++
      const currXWithDirection = newDirection === 'left' ? currX - 1 : currX + 1
      let x = currX === end.x || newDirection === 'down' ? currX : currXWithDirection
      let y = currY === end.y || newDirection !== 'down' ? currY : currY + 1
      const reachedCompleteX = currX >= end.x
      const reachedCompleteY = currY >= end.y

      /**
       * - When X is completed, the only direction remaining is down
       * - When Y is completed, the loop is complete, end it.
       */
      if (reachedCompleteX) {
        newDirection = 'down'
      }

      if (reachedCompleteY) {
        break
      }

      /**
       * Avoid taking the path that other lines have already drawn to
       * prevent overlap.
       */
      if (this.isPathInCache({ dir: 'down', x, y })) {
        x = x + PADDING
      }

      if (this.isPathInCache({ dir: 'right', x, y })) {
        y = y + PADDING
      }

      /**
       * - Track the initial launch away from our source obstacle,
       * - Our first step is X
       * - Move away from our source obstacle to a PADDING point and then begin our down descent.
       * - 
       */
      if (!sourceState.launched) {
        stepX(x)

        if (
          newDirection === 'left' && x < start.x - PADDING ||
          newDirection === 'right' && x > start.x + PADDING
        ) {
          sourceState.launched = true
          newDirection = 'down'
          stepY(y)
        }
      }

      if (newDirection === 'down') {
        const reachedSeparationFromSource = !sourceState.cleared && y > sourceObstacle.p3.y + PADDING
        if (reachedSeparationFromSource) {
          newDirection = currX < end.x ? 'right' : 'left'
          sourceState.cleared = true
        }

        stepY(y)
      } else {
        stepX(x)
      }

      /**
       * Add path to the cache when direction changes;
       * direction change indicates a line has completed.
       */
      if (newDirection !== prevDirection) {
        let cachePath = `${prevDirection}-`
        switch (prevDirection) {
          case 'left':
            cachePath += `${prevX}/${currX}-${y}`
            break;
          case 'right':
            cachePath += `${prevX}/${currX}-${y}`
            break;
          case 'down':
            cachePath += `${prevY}/${currY}-${x}`
            break;
        }

        this.cache.add(cachePath)
      }

      currX = x
      currY = y
      prevDirection = newDirection
    }
  }

  isPathInCache({ dir, x, y }: IPathInCache): boolean {
    const isNumberInRange = (number: number, rangeStart: number, rangeEnd: number) => {
      return number >= rangeStart && number <= rangeEnd;
    }

    // If line is not precisely on top of, check if it's at least around.
    const BUFFER = 5
    const aroundStaticPosition = (n: number, pos: number) => n <= +pos + BUFFER && n >= +pos - BUFFER

    const cacheItems = Array.from(this.cache)
    for (const item of cacheItems) {
      const [direction, range, staticPosition] = item.split('-')
      const [start, end] = range.split('/')
      const isDirectionDown = direction === 'down' && direction === dir
      const isDirectionLeftRight = ['left', 'right'].includes(direction) && direction === dir

      if (isDirectionDown && isNumberInRange(y, +start, +end) && aroundStaticPosition(x, +staticPosition)) {
        return true
      }

      if (isDirectionLeftRight && isNumberInRange(x, +start, +end) && aroundStaticPosition(y, +staticPosition)) {
        return true
      }
    }

    return false
  }

  getPathDirection({ start, end, coord }: IWithinRange) {
    const { x: startX, y: startY } = start
    const { x: endX, y: endY } = end
    const { x: coordinateX, y: coordinateY } = coord

    const isWithinXRange = (coordinateX >= startX && coordinateX <= endX);
    const isWithinYRange = (coordinateY >= startY && coordinateY <= endY);

    if (isWithinXRange && isWithinYRange) {
      if (startX === endX) {
        return "vertical";
      } else if (startY === endY) {
        return "horizontal";
      }
    }

    return false;
  }

  animatePulse({ x, y, radius, maxRadius, duration }: IAnimatePulse) {
    const start = performance.now();
    const ctx = this.ctx
  
    function update() {
      const elapsed = performance.now() - start;
      const currentRadius = radius + (maxRadius - radius) * Math.random();
  
      ctx.clearRect(x - maxRadius, y - maxRadius, maxRadius * 2, maxRadius * 2);
  
      ctx.beginPath();
      ctx.arc(x, y, currentRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
  
      if (elapsed < duration) {
        requestAnimationFrame(update);
      } else {
        ctx.clearRect(x - maxRadius, y - maxRadius, maxRadius * 2, maxRadius * 2);
      }
    }
  
    update();
  }

  scaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    const ctx = this.ctx
    // assume the device pixel ratio is 1 if the browser doesn't specify it
    const devicePixelRatio = window.devicePixelRatio || 1;
  
    // determine the 'backing store ratio' of the canvas context
    const backingStoreRatio = (
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1
    );
  
    // determine the actual ratio we want to draw at
    const ratio = devicePixelRatio / backingStoreRatio;
  
    if (devicePixelRatio !== backingStoreRatio) {
      // set the 'real' canvas size to the higher width/height
      canvas.width = width * ratio;
      canvas.height = height * ratio;
  
      // ...then scale it back down with CSS
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    else {
      // this is a normal 1:1 device; just scale it simply
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = '';
      canvas.style.height = '';
    }
  
    // scale the drawing context so everything will work at the higher ratio
    ctx.scale(ratio, ratio);
  }
}

export function getNodePosition(node: Element) {
  const box = node.getBoundingClientRect()
  return { x: box.left + NODE_SIZE_HALF, y: box.top + NODE_SIZE_HALF  }
}

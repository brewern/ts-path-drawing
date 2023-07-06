export interface ICoords {
  x: number
  y: number
}

export interface IConnectNode {
  start: ICoords
  end: ICoords
  direction: string
}

export interface IDraw {
  connection: IConnectNode
}

export interface IWithinRange {
  start: ICoords
  end: ICoords
  coord: ICoords
}

export interface ILineTicker {
  start: ICoords
  end: ICoords
  direction: string
}

export interface IAnimatePulse {
  x: number
  y: number
  radius: number
  maxRadius: number
  duration: number
}

export interface IObstacleCoord {
  p1: ICoords
  p2: ICoords
  p3: ICoords
  p4: ICoords
  elem: Element
}

export interface IWithinAnyObstacle {
  x: number
  y: number
  padding: number
}

export interface IWithinObstacle {
  obstacle: IObstacleCoord
  x: number
  y: number
  padding: number
}

export interface IClosestObstacle extends ICoords {
  direction: string | null
}

export interface IPathInCache extends ICoords {
  dir: string
}

export interface IPathBuilder {
  connections: IConnectNode[]
  draw({ connection }: IDraw): void
  getPathDirection({ start, end, coord }: IWithinRange): string | boolean
  lineTicker({ start, end }: ILineTicker): void
  animatePulse({ x, y, radius, maxRadius, duration }: IAnimatePulse): void
  findClosestObstacle({ x, y }: ICoords): IObstacleCoord | null
  isPathInCache({ x, y, dir }: IPathInCache): boolean
  isWithinObstacle({ x, y, padding }: IWithinObstacle): boolean
  isWithinObstacle({ x, y, padding }: IWithinObstacle): boolean
}

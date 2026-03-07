import type { NeighborDirection, Vec2 } from './types'

export function defaultVecKey([x, y]: Vec2): string {
  return `${x},${y}`
}

export function computeMask(
  position: Vec2,
  occupiedSet: ReadonlySet<string>,
  directions: readonly NeighborDirection[],
  keyFn: (position: Vec2) => string = defaultVecKey,
): number {
  return directions.reduce((mask, { dx, dy, bit }) => {
    const neighborKey = keyFn([position[0] + dx, position[1] + dy])
    return occupiedSet.has(neighborKey) ? mask | bit : mask
  }, 0)
}

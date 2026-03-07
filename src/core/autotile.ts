import { computeMask, defaultVecKey } from './bitmask'
import type {
  AutotileOptions,
  AutotileResult,
  MaskLookupOptions,
  TileLike,
} from './types'

function defaultGroupBy<Tile extends TileLike>(tile: Tile): string {
  return tile.pathType
}

export function buildMaskLookup<Tile extends TileLike>(
  tiles: readonly Tile[],
  options: MaskLookupOptions<Tile>,
): Record<string, number> {
  const keyFn = options.keyFn ?? defaultVecKey
  const groupBy = options.groupBy ?? defaultGroupBy
  const lookup: Record<string, number> = {}

  const positionsByGroup = tiles.reduce(
    (acc, tile) => {
      const group = groupBy(tile)
      acc[group] ??= new Set<string>()
      acc[group].add(keyFn(tile.position))
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  for (const tile of tiles) {
    const group = groupBy(tile)
    const occupiedSet = positionsByGroup[group]
    if (!occupiedSet) continue

    lookup[keyFn(tile.position)] = computeMask(
      tile.position,
      occupiedSet,
      options.directions,
      keyFn,
    )
  }

  return lookup
}

export function autotile<
  Tile extends TileLike<Piece>,
  Piece extends string = string,
>(
  tiles: readonly Tile[],
  options: AutotileOptions<Tile, Piece>,
): AutotileResult<Tile, Piece>[] {
  const keyFn = options.keyFn ?? defaultVecKey
  const groupBy = options.groupBy ?? defaultGroupBy
  const unresolvedBehavior = options.onUnresolvedPiece ?? 'preserve'

  const positionsByGroup = tiles.reduce(
    (acc, tile) => {
      const group = groupBy(tile)
      acc[group] ??= new Set<string>()
      acc[group].add(keyFn(tile.position))
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  const output: AutotileResult<Tile, Piece>[] = []

  for (const tile of tiles) {
    const tileCopy = { ...tile } as Tile
    const group = groupBy(tile)
    const occupiedSet = positionsByGroup[group]
    if (!occupiedSet) {
      output.push({
        tile: tileCopy,
        mask: 0,
        piece: tile.currentPiece,
        isFlipped: Boolean(tile.isFlipped),
        changed: false,
      })
      continue
    }

    const mask = computeMask(
      tile.position,
      occupiedSet,
      options.directions,
      keyFn,
    )
    const matchedRule = options.ruleSet[mask]

    if (!matchedRule) {
      if (unresolvedBehavior === 'drop') {
        continue
      }
      if (unresolvedBehavior === 'error') {
        throw new Error(
          `No autotile rule found for mask ${mask} in group "${group}"`,
        )
      }

      output.push({
        tile: tileCopy,
        mask,
        piece: tile.currentPiece,
        isFlipped: Boolean(tile.isFlipped),
        changed: false,
      })
      continue
    }

    const changed =
      tile.currentPiece !== matchedRule.piece ||
      Boolean(tile.isFlipped) !== matchedRule.flip
    const nextTile = {
      ...tileCopy,
      currentPiece: matchedRule.piece,
      isFlipped: matchedRule.flip,
    } as Tile

    output.push({
      tile: nextTile,
      mask,
      piece: matchedRule.piece,
      isFlipped: matchedRule.flip,
      changed,
    })
  }

  return output
}

import { buildMaskLookup } from '../core/autotile'
import type {
  AutotileRuleSet,
  MaskLookupOptions,
  NeighborDirection,
  TileLike,
} from '../core/types'

export { buildMaskLookup }

export type ExplainMaskResult<Piece extends string = string> = {
  mask: number
  activeDirections: string[]
  resolvedPiece?: Piece
  isFlipped?: boolean
}

export function explainMask<Piece extends string = string>(
  mask: number,
  directions: readonly NeighborDirection[],
  ruleSet?: AutotileRuleSet<Piece>,
): ExplainMaskResult<Piece> {
  const activeDirections = directions
    .filter((direction) => (mask & direction.bit) === direction.bit)
    .map((direction) => direction.name)
  const matchedRule = ruleSet?.[mask]

  const result: ExplainMaskResult<Piece> = {
    mask,
    activeDirections,
  }

  if (matchedRule) {
    result.resolvedPiece = matchedRule.piece
    result.isFlipped = matchedRule.flip
  }

  return result
}

export function buildMaskLookupWithExplanation<
  Tile extends TileLike,
  Piece extends string = string,
>(
  tiles: readonly Tile[],
  options: MaskLookupOptions<Tile> & { ruleSet?: AutotileRuleSet<Piece> },
): Record<string, ExplainMaskResult<Piece>> {
  const maskLookup = buildMaskLookup(tiles, options)

  return Object.fromEntries(
    Object.entries(maskLookup).map(([key, mask]) => [
      key,
      explainMask(mask, options.directions, options.ruleSet),
    ]),
  )
}

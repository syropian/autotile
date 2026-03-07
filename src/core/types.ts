export type Vec2 = [number, number]

export const REQUIRED_PATH_PIECES = [
  'straight',
  'intersection-1',
  'intersection-2',
  'intersection-3',
  'turn-1',
  'turn-2',
  'turn-3',
  'cap-1',
  'cap-2',
] as const

export type PathPiece = (typeof REQUIRED_PATH_PIECES)[number]

export type TileLike<Piece extends string = string, Meta = unknown> = {
  id: string
  position: Vec2
  pathType: string
  currentPiece?: Piece
  isFlipped?: boolean
  meta?: Meta
}

export type NeighborDirection = {
  name: string
  dx: number
  dy: number
  bit: number
}

export type AutotileRuleResult<Piece extends string = PathPiece> = {
  piece: Piece
  flip: boolean
}

export type AutotileRuleSet<Piece extends string = PathPiece> = Partial<
  Record<number, AutotileRuleResult<Piece>>
>

export type UnresolvedPieceBehavior = 'preserve' | 'drop' | 'error'

export type AutotileOptions<
  Tile extends TileLike<Piece>,
  Piece extends string = PathPiece,
> = {
  directions: readonly NeighborDirection[]
  ruleSet: AutotileRuleSet<Piece>
  keyFn?: (position: Vec2) => string
  groupBy?: (tile: Tile) => string
  onUnresolvedPiece?: UnresolvedPieceBehavior
}

export type AutotileResult<
  Tile extends TileLike<Piece>,
  Piece extends string = PathPiece,
> = {
  tile: Tile
  mask: number
  piece: Piece | undefined
  isFlipped: boolean
  changed: boolean
}

export type MaskLookupOptions<Tile extends TileLike = TileLike> = {
  directions: readonly NeighborDirection[]
  keyFn?: (position: Vec2) => string
  groupBy?: (tile: Tile) => string
}

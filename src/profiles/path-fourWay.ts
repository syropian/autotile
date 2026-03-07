import { autotile, buildMaskLookup } from '../core/autotile'
import { defaultVecKey } from '../core/bitmask'
import type {
  AutotileRuleSet,
  NeighborDirection,
  PathPiece,
  Vec2,
} from '../core/types'
import { getPrimaryPieceByType, type PathEntityLike } from '../validation/theme'

export const PATH_FOUR_WAY_MASK = {
  north: 1,
  east: 2,
  south: 4,
  west: 8,
} as const

export const pathFourWayDirections = [
  { name: 'north', dx: 0, dy: -1, bit: PATH_FOUR_WAY_MASK.north },
  { name: 'east', dx: 1, dy: 0, bit: PATH_FOUR_WAY_MASK.east },
  { name: 'south', dx: 0, dy: 1, bit: PATH_FOUR_WAY_MASK.south },
  { name: 'west', dx: -1, dy: 0, bit: PATH_FOUR_WAY_MASK.west },
] as const satisfies readonly NeighborDirection[]

export const pathFourWayRuleSet = {
  0: { piece: 'cap-1', flip: true },
  1: { piece: 'cap-1', flip: true },
  2: { piece: 'cap-2', flip: true },
  3: { piece: 'turn-2', flip: true },
  4: { piece: 'cap-2', flip: false },
  5: { piece: 'straight', flip: false },
  6: { piece: 'turn-3', flip: false },
  7: { piece: 'intersection-2', flip: true },
  8: { piece: 'cap-1', flip: false },
  9: { piece: 'turn-1', flip: false },
  10: { piece: 'straight', flip: true },
  11: { piece: 'intersection-1', flip: true },
  12: { piece: 'turn-2', flip: false },
  13: { piece: 'intersection-1', flip: false },
  14: { piece: 'intersection-2', flip: false },
  15: { piece: 'intersection-3', flip: false },
} as const satisfies AutotileRuleSet<PathPiece>

export const pathFourWayProfile = {
  name: 'path-fourWay',
  directions: pathFourWayDirections,
  ruleSet: pathFourWayRuleSet,
} as const

export type PathFourWayEntityLike = PathEntityLike & {
  pathType?: string
  pathPiece?: PathPiece
}

export type PathFourWayMapEntityLike<
  Entity extends PathFourWayEntityLike = PathFourWayEntityLike,
> = {
  id: string
  entity: Entity
  vector: Vec2
  isFlipped: boolean
  updatedAt: string
}

function isPathEntity(entity: PathFourWayEntityLike): boolean {
  return Boolean(entity.pathType) && Boolean(entity.pathPiece)
}

function isPathMapEntity<MapEntity extends PathFourWayMapEntityLike>(
  mapEntity: MapEntity,
): boolean {
  return isPathEntity(mapEntity.entity)
}

function buildEntityLookupByTypeAndPiece<Entity extends PathFourWayEntityLike>(
  entities: readonly Entity[],
): Record<string, Partial<Record<PathPiece, Entity>>> {
  return entities.filter(isPathEntity).reduce(
    (acc, entity) => {
      const pathType = entity.pathType as string
      const pathPiece = entity.pathPiece as PathPiece
      acc[pathType] ??= {}
      acc[pathType][pathPiece] = entity
      return acc
    },
    {} as Record<string, Partial<Record<PathPiece, Entity>>>,
  )
}

export function getPrimaryPathEntityIdsByType(
  entities: readonly PathFourWayEntityLike[],
): Record<string, string> {
  return getPrimaryPieceByType(entities, 'straight')
}

export function getPathMaskLookup<MapEntity extends PathFourWayMapEntityLike>(
  mapEntities: readonly MapEntity[],
): Record<string, number> {
  const pathTiles = mapEntities.filter(isPathMapEntity).map((mapEntity) => ({
    id: mapEntity.id,
    position: mapEntity.vector,
    pathType: mapEntity.entity.pathType as string,
    isFlipped: mapEntity.isFlipped,
  }))

  return buildMaskLookup(pathTiles, {
    directions: pathFourWayDirections,
    keyFn: defaultVecKey,
    groupBy: (tile) => tile.pathType,
  })
}

export type PathAutotileOptions = {
  onUnresolvedPiece?: 'preserve' | 'drop' | 'error'
  now?: () => string
}

export function autotilePathEntities<
  Entity extends PathFourWayEntityLike,
  MapEntity extends PathFourWayMapEntityLike<Entity>,
>(
  mapEntities: readonly MapEntity[],
  themeEntities: readonly Entity[],
  options: PathAutotileOptions = {},
): MapEntity[] {
  const cloneMapEntity = (mapEntity: MapEntity): MapEntity => ({
    ...mapEntity,
    entity: { ...mapEntity.entity },
  })

  const pathMapEntities = mapEntities.filter(isPathMapEntity)
  if (!pathMapEntities.length) {
    return mapEntities.map(cloneMapEntity)
  }

  const entityLookup = buildEntityLookupByTypeAndPiece(themeEntities)

  const tiles = pathMapEntities.map((mapEntity) => ({
    id: mapEntity.id,
    position: mapEntity.vector,
    pathType: mapEntity.entity.pathType as string,
    isFlipped: mapEntity.isFlipped,
    mapEntity,
    ...(mapEntity.entity.pathPiece
      ? { currentPiece: mapEntity.entity.pathPiece }
      : {}),
  })) as Array<{
    id: string
    position: Vec2
    pathType: string
    currentPiece?: PathPiece
    isFlipped: boolean
    mapEntity: MapEntity
  }>

  const resolvedTiles = autotile<(typeof tiles)[number], PathPiece>(tiles, {
    directions: pathFourWayDirections,
    ruleSet: pathFourWayRuleSet,
    groupBy: (tile) => tile.pathType,
    keyFn: defaultVecKey,
    onUnresolvedPiece: options.onUnresolvedPiece ?? 'preserve',
  })

  const resolvedById = new Map(
    resolvedTiles.map((result) => {
      const nextEntity = result.piece
        ? entityLookup[result.tile.pathType]?.[result.piece]
        : undefined

      if (!nextEntity) {
        if ((options.onUnresolvedPiece ?? 'preserve') === 'error') {
          throw new Error(
            `Unable to resolve path piece "${String(result.piece)}" for type "${result.tile.pathType}"`,
          )
        }

        if ((options.onUnresolvedPiece ?? 'preserve') === 'drop') {
          return [result.tile.id, undefined] as const
        }

        return [result.tile.id, cloneMapEntity(result.tile.mapEntity)] as const
      }

      const changed =
        result.tile.mapEntity.entity.id !== nextEntity.id ||
        result.tile.mapEntity.isFlipped !== result.isFlipped
      if (!changed) {
        return [result.tile.id, cloneMapEntity(result.tile.mapEntity)] as const
      }

      const nextMapEntity = {
        ...result.tile.mapEntity,
        entity: nextEntity,
        isFlipped: result.isFlipped,
        updatedAt: (options.now ?? (() => Date.now().toString()))(),
      }

      return [result.tile.id, nextMapEntity] as const
    }),
  )

  return mapEntities.flatMap((mapEntity) => {
    if (!isPathMapEntity(mapEntity)) {
      return [cloneMapEntity(mapEntity)]
    }

    const resolved = resolvedById.get(mapEntity.id)
    if (!resolved) {
      return []
    }

    return [resolved]
  })
}

export const applyPathAutotiling = autotilePathEntities

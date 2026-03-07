import { describe, expect, it } from 'vitest'

import { autotile, buildMaskLookup } from '../src/core/autotile'
import { computeMask, defaultVecKey } from '../src/core/bitmask'
import {
  buildMaskLookupWithExplanation,
  explainMask,
} from '../src/debug/mask-lookup'
import {
  PATH_FOUR_WAY_MASK,
  applyPathAutotiling,
  autotilePathEntities,
  getPathMaskLookup,
  getPrimaryPathEntityIdsByType,
  type PathFourWayEntityLike,
  type PathFourWayMapEntityLike,
  pathFourWayDirections,
  pathFourWayProfile,
  pathFourWayRuleSet,
} from '../src/profiles/path-fourWay'
import { getPrimaryPieceByType, validatePathSet } from '../src/validation/theme'
import type { TileLike, Vec2 } from '../src/core/types'

const PATH_PIECES = [
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

type ThemePathPiece = (typeof PATH_PIECES)[number]

type ThemeEntity = {
  id: string
  pathType: string
  pathPiece: ThemePathPiece
}

type DecorEntity = PathFourWayEntityLike & {
  category: 'decor'
}

type MixedEntity = ThemeEntity | DecorEntity

type TestMapEntity<Entity extends PathFourWayEntityLike> =
  PathFourWayMapEntityLike<Entity> & {
    createdAt: string
    lastCollectedAt: null
  }

function makeTheme(pathType: string, suffix = '') {
  return PATH_PIECES.map((piece) => ({
    id: `${pathType}-${piece}${suffix}`,
    pathType,
    pathPiece: piece,
  })) satisfies ThemeEntity[]
}

function makeMapEntity<Entity extends PathFourWayEntityLike>(
  id: string,
  vector: Vec2,
  entity: Entity,
): TestMapEntity<Entity> {
  return {
    id,
    vector,
    entity,
    isFlipped: false,
    updatedAt: '0',
    createdAt: '0',
    lastCollectedAt: null,
  }
}

function makeDecorEntity(id: string, vector: Vec2): TestMapEntity<DecorEntity> {
  return {
    id,
    vector,
    entity: {
      id: `${id}-entity`,
      category: 'decor',
    },
    isFlipped: false,
    updatedAt: '0',
    createdAt: '0',
    lastCollectedAt: null,
  }
}

describe('path profile', () => {
  it('defines all 16 masks with piece and flip metadata', () => {
    for (let mask = 0; mask <= 15; mask += 1) {
      const value = pathFourWayRuleSet[mask as keyof typeof pathFourWayRuleSet]
      expect(value).toBeDefined()
      expect(typeof value?.piece).toBe('string')
      expect(typeof value?.flip).toBe('boolean')
    }
  })

  it('keeps public profile exports aligned', () => {
    expect(PATH_FOUR_WAY_MASK).toEqual({ north: 1, east: 2, south: 4, west: 8 })
    expect(pathFourWayProfile.name).toBe('path-fourWay')
    expect(pathFourWayProfile.directions).toBe(pathFourWayDirections)
    expect(pathFourWayProfile.ruleSet).toBe(pathFourWayRuleSet)
    expect(applyPathAutotiling).toBe(autotilePathEntities)
  })
})

describe('bitmask helpers', () => {
  it('computeMask and explainMask agree', () => {
    const occupied = new Set(['0,0', '1,0', '0,1'])
    const mask = computeMask(
      [0, 0],
      occupied,
      pathFourWayDirections,
      defaultVecKey,
    )

    expect(mask).toBe(6)
    expect(
      explainMask(mask, pathFourWayDirections, pathFourWayRuleSet),
    ).toEqual({
      mask: 6,
      activeDirections: ['east', 'south'],
      resolvedPiece: 'turn-3',
      isFlipped: false,
    })
  })

  it('omits resolution when no rule matches', () => {
    expect(explainMask(6, pathFourWayDirections)).toEqual({
      mask: 6,
      activeDirections: ['east', 'south'],
    })
  })

  it('builds grouped mask lookups and explained lookups', () => {
    const tiles = [
      { id: 'road-a', position: [0, 0] as [number, number], pathType: 'road' },
      { id: 'road-b', position: [1, 0] as [number, number], pathType: 'road' },
      {
        id: 'river-a',
        position: [0, 0] as [number, number],
        pathType: 'river',
      },
      {
        id: 'river-b',
        position: [0, 1] as [number, number],
        pathType: 'river',
      },
    ]

    expect(
      buildMaskLookup(tiles, {
        directions: pathFourWayDirections,
        groupBy: (tile) => tile.pathType,
      }),
    ).toEqual({
      '0,0': 4,
      '1,0': 8,
      '0,1': 1,
    })

    expect(
      buildMaskLookupWithExplanation(tiles, {
        directions: pathFourWayDirections,
        groupBy: (tile) => tile.pathType,
        ruleSet: pathFourWayRuleSet,
      })['0,0'],
    ).toEqual({
      mask: 4,
      activeDirections: ['south'],
      resolvedPiece: 'cap-2',
      isFlipped: false,
    })
  })
})

describe('core autotile', () => {
  it('supports custom directions and key functions', () => {
    const tiles: TileLike<string>[] = [
      {
        id: 'a',
        position: [0, 0] as [number, number],
        pathType: 'x',
        currentPiece: 'start',
        isFlipped: false,
      },
      {
        id: 'b',
        position: [0, 1] as [number, number],
        pathType: 'x',
        currentPiece: 'start',
        isFlipped: false,
      },
    ]

    const result = autotile<(typeof tiles)[number], string>(tiles, {
      directions: [
        { name: 'south', dx: 0, dy: 1, bit: 1 },
        { name: 'north', dx: 0, dy: -1, bit: 2 },
      ],
      ruleSet: {
        1: { piece: 'one', flip: false },
        2: { piece: 'two', flip: true },
      },
      keyFn: ([x, y]) => `${x}|${y}`,
    })

    expect(result[0]).toMatchObject({
      piece: 'one',
      isFlipped: false,
      changed: true,
    })
    expect(result[1]).toMatchObject({
      piece: 'two',
      isFlipped: true,
      changed: true,
    })
  })

  it('preserves, drops, and errors on unresolved pieces', () => {
    const tiles = [
      {
        id: 'a',
        position: [0, 0] as [number, number],
        pathType: 'x',
        currentPiece: 'start',
        isFlipped: false,
      },
      {
        id: 'b',
        position: [1, 0] as [number, number],
        pathType: 'x',
        currentPiece: 'start',
        isFlipped: false,
      },
    ]

    const preserved = autotile(tiles, {
      directions: pathFourWayDirections,
      ruleSet: {},
    })

    expect(preserved).toHaveLength(2)
    expect(preserved[0]).toMatchObject({
      piece: 'start',
      changed: false,
      isFlipped: false,
    })
    expect(preserved[0]?.tile).not.toBe(tiles[0])

    expect(
      autotile(tiles, {
        directions: pathFourWayDirections,
        ruleSet: {},
        onUnresolvedPiece: 'drop',
      }),
    ).toEqual([])

    expect(() =>
      autotile(tiles, {
        directions: pathFourWayDirections,
        ruleSet: {},
        onUnresolvedPiece: 'error',
      }),
    ).toThrow('No autotile rule found for mask 2 in group "x"')
  })

  it('returns updated tiles without mutating the input', () => {
    const tile: TileLike<string> = {
      id: 'a',
      position: [0, 0] as [number, number],
      pathType: 'x',
      currentPiece: 'start',
      isFlipped: false,
    }

    const result = autotile<typeof tile, string>([tile], {
      directions: pathFourWayDirections,
      ruleSet: {
        0: { piece: 'cap', flip: true },
      },
    })

    expect(result[0]?.tile).not.toBe(tile)
    expect(tile).toMatchObject({ currentPiece: 'start', isFlipped: false })
    expect(result[0]?.tile).toMatchObject({
      currentPiece: 'cap',
      isFlipped: true,
    })
    expect(result[0]).toMatchObject({ piece: 'cap', changed: true })
  })

  it('returns copies even when nothing changes', () => {
    const tile = {
      id: 'a',
      position: [0, 0] as [number, number],
      pathType: 'x',
      currentPiece: 'start',
      isFlipped: false,
    }

    const result = autotile([tile], {
      directions: pathFourWayDirections,
      ruleSet: {},
    })

    expect(result[0]?.tile).not.toBe(tile)
    expect(result[0]?.tile).toMatchObject(tile)
  })
})

describe('path autotiling', () => {
  it('resolves a small topology into expected pieces', () => {
    const theme = makeTheme('road')
    const straight = theme.find((item) => item.pathPiece === 'straight')

    expect(straight).toBeDefined()

    const result = autotilePathEntities(
      [
        makeMapEntity('a', [0, 0], straight!),
        makeMapEntity('b', [1, 0], straight!),
        makeMapEntity('c', [2, 0], straight!),
        makeMapEntity('d', [1, 1], straight!),
      ],
      theme,
      { now: () => '1' },
    )

    const byId = Object.fromEntries(
      result.map((item) => [item.id, item.entity]),
    )

    expect(byId.a.pathPiece).toBe('cap-2')
    expect(byId.b.pathPiece).toBe('intersection-2')
    expect(byId.c.pathPiece).toBe('cap-1')
    expect(byId.d.pathPiece).toBe('cap-1')
  })

  it('groups connectivity by pathType only', () => {
    const theme = [...makeTheme('road'), ...makeTheme('river', '-r')]
    const roadStraight = theme.find(
      (item) => item.pathType === 'road' && item.pathPiece === 'straight',
    )
    const riverStraight = theme.find(
      (item) => item.pathType === 'river' && item.pathPiece === 'straight',
    )

    const result = autotilePathEntities(
      [
        makeMapEntity('road-a', [0, 0], roadStraight!),
        makeMapEntity('road-b', [1, 0], roadStraight!),
        makeMapEntity('river-a', [0, 1], riverStraight!),
        makeMapEntity('river-b', [1, 1], riverStraight!),
      ],
      theme,
    )

    expect(
      Object.fromEntries(
        result.map((item) => [item.id, item.entity.pathPiece]),
      ),
    ).toEqual({
      'road-a': 'cap-2',
      'road-b': 'cap-1',
      'river-a': 'cap-2',
      'river-b': 'cap-1',
    })
  })

  it('supports preserve, drop, and error policies when theme pieces are missing', () => {
    const theme = makeTheme('road').filter(
      (item) => item.pathPiece !== 'turn-2',
    )
    const straight = theme.find((item) => item.pathPiece === 'straight')
    const map = [
      makeMapEntity('a', [0, 0], straight!),
      makeMapEntity('b', [0, -1], straight!),
      makeMapEntity('c', [1, 0], straight!),
    ]

    const preserved = autotilePathEntities(map, theme, {
      onUnresolvedPiece: 'preserve',
    })
    expect(preserved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'a',
          entity: expect.objectContaining({ pathPiece: 'straight' }),
        }),
      ]),
    )

    expect(
      autotilePathEntities(map, theme, { onUnresolvedPiece: 'drop' }).some(
        (item) => item.id === 'a',
      ),
    ).toBe(false)
    expect(() =>
      autotilePathEntities(map, theme, { onUnresolvedPiece: 'error' }),
    ).toThrow('Unable to resolve path piece "turn-2" for type "road"')
  })

  it('is idempotent and local to edited areas', () => {
    const theme = makeTheme('road')
    const straight = theme.find((item) => item.pathPiece === 'straight')
    const base = [
      makeMapEntity('a', [0, 0], straight!),
      makeMapEntity('b', [1, 0], straight!),
      makeMapEntity('c', [2, 0], straight!),
      makeMapEntity('z', [20, 20], straight!),
    ]

    const pass1 = autotilePathEntities(base, theme, { now: () => '1' })
    const pass2 = autotilePathEntities(pass1, theme, { now: () => '2' })
    expect(pass2).toEqual(pass1)

    const edited = base.map((item) =>
      item.id === 'z'
        ? { ...item, vector: [21, 20] as [number, number] }
        : item,
    )
    const editedResult = autotilePathEntities(edited, theme, { now: () => '3' })

    for (const id of ['a', 'b', 'c']) {
      const before = pass1.find((item) => item.id === id)
      const after = editedResult.find((item) => item.id === id)
      expect(after).toMatchObject({
        entity: {
          id: before?.entity.id,
          pathPiece: before?.entity.pathPiece,
        },
        isFlipped: before?.isFlipped,
      })
    }
  })

  it('keeps non-path entities and returns a new array when no paths exist', () => {
    const theme = makeTheme('road')
    const straight = theme.find((item) => item.pathPiece === 'straight')
    const decor = makeDecorEntity('decor', [5, 5])
    const path = makeMapEntity('path', [0, 0], straight!)
    const mixedInput: TestMapEntity<MixedEntity>[] = [decor, path]

    const mixed = autotilePathEntities<MixedEntity, TestMapEntity<MixedEntity>>(
      mixedInput,
      theme,
      { now: () => '1' },
    )
    expect(mixed[0]).not.toBe(decor)
    expect(mixed[0]).toMatchObject(decor)
    expect(mixed[1]?.entity).toMatchObject({ pathPiece: 'cap-1' })

    const decorOnlyInput: TestMapEntity<MixedEntity>[] = [decor]
    const decorOnlyResult = autotilePathEntities<
      MixedEntity,
      TestMapEntity<MixedEntity>
    >(decorOnlyInput, theme)
    expect(decorOnlyResult).toEqual([decor])
    expect(decorOnlyResult).not.toBe(decorOnlyInput)
    expect(decorOnlyResult[0]).not.toBe(decor)
  })

  it('returns cloned map entities for unchanged results', () => {
    const theme = makeTheme('road')
    const straight = theme.find((item) => item.pathPiece === 'straight')
    const decor = makeDecorEntity('decor', [9, 9])
    const road = makeMapEntity('road', [0, 0], straight!)
    const input: TestMapEntity<MixedEntity>[] = [road, decor]

    const result = autotilePathEntities<
      MixedEntity,
      TestMapEntity<MixedEntity>
    >(input, theme, {
      onUnresolvedPiece: 'preserve',
    })

    expect(result[0]).not.toBe(road)
    expect(result[0]?.entity).not.toBe(road.entity)
    expect(result[1]).not.toBe(decor)
    expect(result[1]?.entity).not.toBe(decor.entity)
  })
})

describe('theme helpers', () => {
  it('returns compatibility ids and path mask lookups', () => {
    const theme = makeTheme('road')
    const straight = theme.find((item) => item.pathPiece === 'straight')

    expect(getPrimaryPathEntityIdsByType(theme)).toEqual({
      road: 'road-straight',
    })
    expect(getPrimaryPieceByType(theme)).toEqual({ road: 'road-straight' })
    expect(
      getPrimaryPieceByType(
        [...theme, makeDecorEntity('decor', [9, 9]).entity],
        'cap-2',
      ),
    ).toEqual({ road: 'road-cap-2' })

    expect(
      getPathMaskLookup([
        makeMapEntity('a', [0, 0], straight!),
        makeMapEntity('b', [1, 0], straight!),
        makeDecorEntity('decor', [2, 0]) as never,
      ]),
    ).toEqual({
      '0,0': 2,
      '1,0': 8,
    })
  })

  it('validates missing, duplicate, and unknown pieces', () => {
    expect(validatePathSet(makeTheme('road'))).toMatchObject({
      valid: true,
      errors: [],
      warnings: [],
    })

    const invalid = validatePathSet([
      ...makeTheme('road').filter((item) => item.pathPiece !== 'cap-1'),
      { id: 'dup', pathType: 'road', pathPiece: 'straight' },
      { id: 'unk', pathType: 'road', pathPiece: 's-bend' },
      makeDecorEntity('decor', [3, 3]).entity,
    ])

    expect(invalid.valid).toBe(false)
    expect(
      invalid.errors.some((item) => item.includes('missing required pieces')),
    ).toBe(true)
    expect(
      invalid.errors.some((item) => item.includes('duplicate pieces')),
    ).toBe(true)
    expect(
      invalid.warnings.some((item) => item.includes('unknown pieces')),
    ).toBe(true)
  })
})

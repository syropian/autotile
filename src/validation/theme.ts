import { REQUIRED_PATH_PIECES, type PathPiece } from '../core/types'

export type PathEntityLike = {
  id: string
  pathType?: string
  pathPiece?: string
}

export type ValidationIssueByType = {
  missing: PathPiece[]
  duplicates: PathPiece[]
  unknownPieces: string[]
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  byType: Record<string, ValidationIssueByType>
}

function isPathEntity(entity: PathEntityLike): boolean {
  return Boolean(entity.pathType) && Boolean(entity.pathPiece)
}

export function validatePathSet(
  entities: readonly PathEntityLike[],
): ValidationResult {
  const byType: Record<string, ValidationIssueByType> = {}
  const errors: string[] = []
  const warnings: string[] = []

  const entitiesByTypeAndPiece = entities.filter(isPathEntity).reduce(
    (acc, entity) => {
      const pathType = entity.pathType as string
      const pathPiece = entity.pathPiece as string

      acc[pathType] ??= {}
      acc[pathType][pathPiece] ??= []
      acc[pathType][pathPiece].push(entity.id)
      return acc
    },
    {} as Record<string, Record<string, string[]>>,
  )

  for (const [pathType, entitiesByPiece] of Object.entries(
    entitiesByTypeAndPiece,
  )) {
    const missing = REQUIRED_PATH_PIECES.filter(
      (piece) => !(piece in entitiesByPiece),
    )
    const duplicates = REQUIRED_PATH_PIECES.filter(
      (piece) => (entitiesByPiece[piece]?.length ?? 0) > 1,
    )
    const unknownPieces = Object.keys(entitiesByPiece).filter(
      (piece) => !REQUIRED_PATH_PIECES.includes(piece as PathPiece),
    )

    byType[pathType] = {
      missing,
      duplicates,
      unknownPieces,
    }

    if (missing.length) {
      errors.push(
        `[${pathType}] missing required pieces: ${missing.join(', ')}`,
      )
    }

    if (duplicates.length) {
      errors.push(`[${pathType}] duplicate pieces: ${duplicates.join(', ')}`)
    }

    if (unknownPieces.length) {
      warnings.push(`[${pathType}] unknown pieces: ${unknownPieces.join(', ')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    byType,
  }
}

export function getPrimaryPieceByType(
  entities: readonly PathEntityLike[],
  piece: PathPiece = 'straight',
): Record<string, string> {
  return entities.filter(isPathEntity).reduce(
    (acc, entity) => {
      if (entity.pathPiece === piece && entity.pathType) {
        acc[entity.pathType] = entity.id
      }
      return acc
    },
    {} as Record<string, string>,
  )
}

# Migration from in-app helpers

## Current helper -> package helper mapping

- `applyPathAutotiling(mapEntities, themeEntities)`
  -> `autotilePathEntities(mapEntities, themeEntities)`
- `getPathMaskLookup(mapEntities)`
  -> `getPathMaskLookup(mapEntities)` from `@syropian/autotile/profiles/path-fourWay`
- `getPrimaryPathEntityIdsByType(themeEntities)`
  -> `getPrimaryPathEntityIdsByType(themeEntities)` from `@syropian/autotile/profiles/path-fourWay`

## Equivalent package call

```ts
import { autotilePathEntities } from '@syropian/autotile/profiles/path-fourWay'

const next = autotilePathEntities(mapEntities, themeEntities)
```

## Minimal integration diff

1. Replace imports from local path helpers to package profile exports.
2. Keep existing entity schema; the compatibility adapter expects the same `category`, `pathType`, `pathPiece` fields.
3. Optionally add `onUnresolvedPiece: 'error'` during theme authoring to fail fast on missing pieces.

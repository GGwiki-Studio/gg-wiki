import type { BuilderProject } from '@/components/builder/builder.types'
import type { MigrationRegistry } from './schema-migration.types'

export const CURRENT_SCHEMA_VERSION = 1

// Each key migrates FROM that version TO version + 1
// Never delete old steps. They cascade: 1→2→3→4 etc
const migrations: MigrationRegistry = {
  // 1: (data) => { ... return transformed },
}

export function migrateProjectData(data: unknown, fromVersion: number): BuilderProject {
  let current = data
  let version = fromVersion

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version]
    if (!migrate) {
      throw new Error(`No migration found for version ${version}`)
    }
    current = migrate(current)
    version++
  }

  return current as BuilderProject
}
export type MigrationFunction = (data: unknown) => unknown

export type MigrationRegistry = Record<number, MigrationFunction>
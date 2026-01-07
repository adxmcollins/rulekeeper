export type RuleStatus = 'synced' | 'outdated' | 'diverged' | 'detached'

export interface RuleEntry {
  file: string
  sourceHash: string
  localHash: string
  status: RuleStatus
  installedAt: string
  updatedAt: string
  detachedAt?: string
}

export interface ProjectManifest {
  version: number
  rules: Record<string, RuleEntry>
}

export const DEFAULT_MANIFEST: ProjectManifest = {
  version: 1,
  rules: {}
}

export interface StatusCheckResult {
  status: RuleStatus
  localChanged: boolean
  sourceChanged: boolean
  localExists: boolean
  sourceExists: boolean
  currentLocalHash?: string
  currentSourceHash?: string
}

import { parse, stringify } from 'yaml'
import { getManifestPath, getRulekeeperDir } from './paths.js'
import { fileExists, readTextFile, writeTextFile, ensureDir } from './files.js'
import { DEFAULT_MANIFEST } from '../types/index.js'
import type { ProjectManifest, RuleEntry, RuleStatus } from '../types/index.js'

export async function loadManifest(projectPath: string = process.cwd()): Promise<ProjectManifest | null> {
  const manifestPath = getManifestPath(projectPath)

  if (!fileExists(manifestPath)) {
    return null
  }

  const content = await readTextFile(manifestPath)
  const manifest = parse(content) as ProjectManifest

  return manifest
}

export async function saveManifest(manifest: ProjectManifest, projectPath: string = process.cwd()): Promise<void> {
  const manifestPath = getManifestPath(projectPath)
  ensureDir(getRulekeeperDir(projectPath))

  const content = stringify(manifest, { indent: 2 })
  await writeTextFile(manifestPath, content)
}

export async function manifestExists(projectPath: string = process.cwd()): Promise<boolean> {
  return fileExists(getManifestPath(projectPath))
}

export async function getOrCreateManifest(projectPath: string = process.cwd()): Promise<ProjectManifest> {
  const manifest = await loadManifest(projectPath)
  return manifest ?? { ...DEFAULT_MANIFEST }
}

export function createRuleEntry(options: {
  file: string
  sourceHash: string
  localHash: string
  status?: RuleStatus
}): RuleEntry {
  const now = new Date().toISOString()
  return {
    file: options.file,
    sourceHash: options.sourceHash,
    localHash: options.localHash,
    status: options.status ?? 'synced',
    installedAt: now,
    updatedAt: now
  }
}

export function updateRuleEntry(entry: RuleEntry, updates: Partial<RuleEntry>): RuleEntry {
  return {
    ...entry,
    ...updates,
    updatedAt: new Date().toISOString()
  }
}

export async function addRuleToManifest(
  ruleName: string,
  entry: RuleEntry,
  projectPath: string = process.cwd()
): Promise<void> {
  const manifest = await getOrCreateManifest(projectPath)
  manifest.rules[ruleName] = entry
  await saveManifest(manifest, projectPath)
}

export async function removeRuleFromManifest(
  ruleName: string,
  projectPath: string = process.cwd()
): Promise<void> {
  const manifest = await loadManifest(projectPath)
  if (manifest && manifest.rules[ruleName]) {
    delete manifest.rules[ruleName]
    await saveManifest(manifest, projectPath)
  }
}

export async function updateRuleInManifest(
  ruleName: string,
  updates: Partial<RuleEntry>,
  projectPath: string = process.cwd()
): Promise<void> {
  const manifest = await loadManifest(projectPath)
  if (manifest && manifest.rules[ruleName]) {
    manifest.rules[ruleName] = updateRuleEntry(manifest.rules[ruleName], updates)
    await saveManifest(manifest, projectPath)
  }
}

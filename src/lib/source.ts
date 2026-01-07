import { join } from 'node:path'
import { fileExists, listFiles, getRuleFilename, getRuleName } from './files.js'
import { hashFile } from './hash.js'
import type { GlobalConfig } from '../types/index.js'

export interface AvailableRule {
  name: string
  file: string
  path: string
}

// Files to ignore when listing available rules (case-insensitive)
const IGNORED_FILES = ['readme.md']

export async function getAvailableRules(config: GlobalConfig): Promise<AvailableRule[]> {
  const sourcePath = config.source.path

  if (!fileExists(sourcePath)) {
    return []
  }

  const files = await listFiles(sourcePath, '.md')
  const filteredFiles = files.filter(file => !IGNORED_FILES.includes(file.toLowerCase()))

  return filteredFiles.map(file => ({
    name: getRuleName(file),
    file,
    path: join(sourcePath, file)
  }))
}

export async function getRuleSourcePath(ruleName: string, config: GlobalConfig): Promise<string | null> {
  const filename = getRuleFilename(ruleName)
  const rulePath = join(config.source.path, filename)

  if (!fileExists(rulePath)) {
    return null
  }

  return rulePath
}

export async function getRuleSourceHash(ruleName: string, config: GlobalConfig): Promise<string | null> {
  const rulePath = await getRuleSourcePath(ruleName, config)

  if (!rulePath) {
    return null
  }

  return await hashFile(rulePath)
}

export function validateSourcePath(path: string): { valid: boolean; error?: string } {
  if (!path) {
    return { valid: false, error: 'Source path is required' }
  }

  if (!fileExists(path)) {
    return { valid: false, error: `Source path does not exist: ${path}` }
  }

  return { valid: true }
}

export function isGitUrl(url: string): boolean {
  return (
    url.startsWith('git@') ||
    url.startsWith('https://github.com') ||
    url.startsWith('https://gitlab.com') ||
    url.startsWith('https://bitbucket.org') ||
    url.endsWith('.git')
  )
}

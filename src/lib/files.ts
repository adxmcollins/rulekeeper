import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile, copyFile as fsCopyFile, readdir, unlink, rm } from 'node:fs/promises'
import { dirname, join, basename } from 'node:path'

// Files to ignore when listing/processing rules (case-insensitive)
export const IGNORED_FILES = ['readme.md']

export function isIgnoredRule(ruleName: string): boolean {
  const filename = getRuleFilename(ruleName)
  return IGNORED_FILES.includes(filename.toLowerCase())
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath)
}

export async function readTextFile(filePath: string): Promise<string> {
  return await readFile(filePath, 'utf-8')
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  ensureDir(dirname(filePath))
  await writeFile(filePath, content, 'utf-8')
}

export async function copyFile(source: string, dest: string): Promise<void> {
  ensureDir(dirname(dest))
  await fsCopyFile(source, dest)
}

export async function deleteFile(filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}

export async function deleteDir(dirPath: string): Promise<void> {
  if (existsSync(dirPath)) {
    await rm(dirPath, { recursive: true, force: true })
  }
}

export async function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = await readdir(dirPath, { withFileTypes: true })
  let files = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)

  if (extension) {
    files = files.filter(file => file.endsWith(extension))
  }

  return files
}

export function getRuleName(filename: string): string {
  // Remove .md extension to get rule name
  return basename(filename, '.md')
}

export function getRuleFilename(ruleName: string): string {
  // Remove .md extension if already present, then add it back
  // This handles both "laravel" and "laravel.md" inputs
  const baseName = ruleName.toLowerCase().endsWith('.md')
    ? ruleName.slice(0, -3)
    : ruleName
  return `${baseName}.md`
}

export function normalizeRuleName(ruleName: string): string {
  // Normalize rule name: remove .md extension and lowercase
  const name = ruleName.toLowerCase().endsWith('.md')
    ? ruleName.slice(0, -3)
    : ruleName
  return name.toLowerCase()
}

export function findRuleMatch(
  input: string,
  availableRules: string[]
): string | null {
  // Find a rule case-insensitively
  const normalizedInput = normalizeRuleName(input)

  // First try exact match (case-insensitive)
  const match = availableRules.find(
    rule => normalizeRuleName(rule) === normalizedInput
  )

  return match ?? null
}

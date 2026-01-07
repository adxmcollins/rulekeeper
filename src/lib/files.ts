import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile, copyFile as fsCopyFile, readdir, unlink, rm } from 'node:fs/promises'
import { dirname, join, basename } from 'node:path'

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
  // Add .md extension if not present
  return ruleName.endsWith('.md') ? ruleName : `${ruleName}.md`
}

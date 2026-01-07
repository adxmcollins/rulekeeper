import simpleGit, { SimpleGit } from 'simple-git'
import { fileExists } from './files.js'
import { join } from 'node:path'
import type { GlobalConfig } from '../types/index.js'

export function isGitRepo(path: string): boolean {
  return fileExists(join(path, '.git'))
}

export async function cloneRepo(url: string, targetPath: string): Promise<void> {
  const git = simpleGit()
  await git.clone(url, targetPath)
}

export async function pullRepo(path: string): Promise<void> {
  const git = simpleGit(path)
  await git.pull()
}

export async function hasRemote(path: string): Promise<boolean> {
  if (!isGitRepo(path)) return false

  const git = simpleGit(path)
  try {
    const remotes = await git.getRemotes()
    return remotes.length > 0
  } catch {
    return false
  }
}

export async function getRemoteUrl(path: string): Promise<string | null> {
  if (!isGitRepo(path)) return null

  const git = simpleGit(path)
  try {
    const remotes = await git.getRemotes(true)
    const origin = remotes.find(r => r.name === 'origin')
    return origin?.refs?.fetch ?? null
  } catch {
    return null
  }
}

export function shouldPullFromRemote(config: GlobalConfig): boolean {
  if (!config.settings.autoPull) return false
  if (config.settings.pullFrequency === 'never') return false
  if (!config.settings.lastPull) return true

  const lastPull = new Date(config.settings.lastPull)
  const now = new Date()
  const hoursSinceLastPull = (now.getTime() - lastPull.getTime()) / (1000 * 60 * 60)

  switch (config.settings.pullFrequency) {
    case 'always':
      return true
    case 'daily':
      return hoursSinceLastPull >= 24
    case 'weekly':
      return hoursSinceLastPull >= 168
    default:
      return false
  }
}

export async function pullSourceIfNeeded(config: GlobalConfig): Promise<{ pulled: boolean; error?: string }> {
  const sourcePath = config.source.path

  if (!isGitRepo(sourcePath)) {
    return { pulled: false }
  }

  if (!shouldPullFromRemote(config)) {
    return { pulled: false }
  }

  if (!(await hasRemote(sourcePath))) {
    return { pulled: false }
  }

  try {
    await pullRepo(sourcePath)
    return { pulled: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { pulled: false, error: message }
  }
}

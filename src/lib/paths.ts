import { homedir } from 'node:os'
import { join } from 'node:path'
import envPaths from 'env-paths'

const paths = envPaths('rulekeeper', { suffix: '' })

export function getConfigDir(): string {
  return paths.config
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.yaml')
}

export function getClaudeDir(projectPath: string = process.cwd()): string {
  return join(projectPath, '.claude')
}

export function getRulekeeperDir(projectPath: string = process.cwd()): string {
  return join(projectPath, '.rulekeeper')
}

export function getManifestPath(projectPath: string = process.cwd()): string {
  return join(getRulekeeperDir(projectPath), 'manifest.yaml')
}

export function getHomeDir(): string {
  return homedir()
}

export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return join(getHomeDir(), path.slice(1))
  }
  return path
}

import { parse, stringify } from 'yaml'
import { getConfigPath, getConfigDir } from './paths.js'
import { fileExists, readTextFile, writeTextFile, ensureDir } from './files.js'
import { DEFAULT_CONFIG } from '../types/index.js'
import type { GlobalConfig, SourceType, PullFrequency, WindowsShell } from '../types/index.js'

export async function loadConfig(): Promise<GlobalConfig | null> {
  const configPath = getConfigPath()

  if (!fileExists(configPath)) {
    return null
  }

  const content = await readTextFile(configPath)
  const config = parse(content) as GlobalConfig

  return config
}

export async function saveConfig(config: GlobalConfig): Promise<void> {
  const configPath = getConfigPath()
  ensureDir(getConfigDir())

  const content = stringify(config, { indent: 2 })
  await writeTextFile(configPath, content)
}

export async function configExists(): Promise<boolean> {
  return fileExists(getConfigPath())
}

export function createConfig(options: {
  sourceType: SourceType
  sourcePath: string
  remote?: string
  autoPull?: boolean
  pullFrequency?: PullFrequency
  shell?: WindowsShell
}): GlobalConfig {
  const config: GlobalConfig = {
    ...DEFAULT_CONFIG,
    source: {
      type: options.sourceType,
      path: options.sourcePath,
      remote: options.remote
    },
    settings: {
      autoPull: options.autoPull ?? true,
      pullFrequency: options.pullFrequency ?? 'daily'
    }
  }

  if (options.shell) {
    config.platform = { shell: options.shell }
  }

  return config
}

export async function updateConfigLastPull(): Promise<void> {
  const config = await loadConfig()
  if (config) {
    config.settings.lastPull = new Date().toISOString()
    await saveConfig(config)
  }
}

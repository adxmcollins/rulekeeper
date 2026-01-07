export type SourceType = 'local' | 'git'
export type PullFrequency = 'always' | 'daily' | 'weekly' | 'never'
export type WindowsShell = 'standard' | 'gitbash' | 'wsl'

export interface SourceConfig {
  type: SourceType
  path: string
  remote?: string
}

export interface SettingsConfig {
  autoPull: boolean
  pullFrequency: PullFrequency
  lastPull?: string
}

export interface PlatformConfig {
  shell?: WindowsShell
}

export interface GlobalConfig {
  version: number
  source: SourceConfig
  settings: SettingsConfig
  platform?: PlatformConfig
}

export const DEFAULT_CONFIG: GlobalConfig = {
  version: 1,
  source: {
    type: 'local',
    path: ''
  },
  settings: {
    autoPull: true,
    pullFrequency: 'daily'
  }
}

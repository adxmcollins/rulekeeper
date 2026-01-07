import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  loadConfig,
  saveConfig,
  configExists,
  createConfig
} from '../../src/lib/config.js'
import type { GlobalConfig } from '../../src/types/index.js'

// Mock env-paths to use test directory
vi.mock('../../src/lib/paths.js', async () => {
  const testConfigDir = join(process.cwd(), '.test-config-dir')
  return {
    getConfigDir: () => testConfigDir,
    getConfigPath: () => join(testConfigDir, 'config.yaml'),
    getClaudeDir: (p: string = process.cwd()) => join(p, '.claude'),
    getRulekeeperDir: (p: string = process.cwd()) => join(p, '.rulekeeper'),
    getManifestPath: (p: string = process.cwd()) => join(p, '.rulekeeper', 'manifest.yaml'),
    getHomeDir: () => '/home/test',
    expandTilde: (path: string) => path.replace(/^~/, '/home/test')
  }
})

describe('config', () => {
  const testConfigDir = join(process.cwd(), '.test-config-dir')

  beforeEach(() => {
    mkdirSync(testConfigDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
  })

  describe('configExists', () => {
    it('should return false when no config', async () => {
      expect(await configExists()).toBe(false)
    })

    it('should return true when config exists', async () => {
      const configPath = join(testConfigDir, 'config.yaml')
      writeFileSync(configPath, 'version: 1')
      expect(await configExists()).toBe(true)
    })
  })

  describe('createConfig', () => {
    it('should create config with required fields', () => {
      const config = createConfig({
        sourceType: 'local',
        sourcePath: '/path/to/rules'
      })

      expect(config.version).toBe(1)
      expect(config.source.type).toBe('local')
      expect(config.source.path).toBe('/path/to/rules')
      expect(config.settings.autoPull).toBe(true)
      expect(config.settings.pullFrequency).toBe('daily')
    })

    it('should create git config with remote', () => {
      const config = createConfig({
        sourceType: 'git',
        sourcePath: '/path/to/rules',
        remote: 'git@github.com:user/rules.git'
      })

      expect(config.source.type).toBe('git')
      expect(config.source.remote).toBe('git@github.com:user/rules.git')
    })

    it('should include platform config for Windows', () => {
      const config = createConfig({
        sourceType: 'local',
        sourcePath: '/path/to/rules',
        shell: 'gitbash'
      })

      expect(config.platform?.shell).toBe('gitbash')
    })
  })

  describe('saveConfig and loadConfig', () => {
    it('should save and load config', async () => {
      const config = createConfig({
        sourceType: 'local',
        sourcePath: '/test/path'
      })

      await saveConfig(config)
      const loaded = await loadConfig()

      expect(loaded).toEqual(config)
    })

    it('should return null when no config', async () => {
      const loaded = await loadConfig()
      expect(loaded).toBe(null)
    })
  })
})

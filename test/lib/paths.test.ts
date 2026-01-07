import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { homedir } from 'node:os'
import {
  getConfigDir,
  getConfigPath,
  getClaudeDir,
  getRulekeeperDir,
  getManifestPath,
  getHomeDir,
  expandTilde
} from '../../src/lib/paths.js'

describe('paths', () => {
  describe('getConfigDir', () => {
    it('should return a path', () => {
      const dir = getConfigDir()
      expect(typeof dir).toBe('string')
      expect(dir.length).toBeGreaterThan(0)
    })
  })

  describe('getConfigPath', () => {
    it('should return path ending with config.yaml', () => {
      const path = getConfigPath()
      expect(path.endsWith('config.yaml')).toBe(true)
    })
  })

  describe('getClaudeDir', () => {
    it('should return path ending with .claude', () => {
      const dir = getClaudeDir()
      expect(dir.endsWith('.claude')).toBe(true)
    })

    it('should use custom project path', () => {
      const dir = getClaudeDir('/custom/path')
      expect(dir).toBe(join('/custom/path', '.claude'))
    })
  })

  describe('getRulekeeperDir', () => {
    it('should return path ending with .rulekeeper', () => {
      const dir = getRulekeeperDir()
      expect(dir.endsWith('.rulekeeper')).toBe(true)
    })
  })

  describe('getManifestPath', () => {
    it('should return path ending with manifest.yaml', () => {
      const path = getManifestPath()
      expect(path.endsWith('manifest.yaml')).toBe(true)
    })
  })

  describe('getHomeDir', () => {
    it('should return home directory', () => {
      expect(getHomeDir()).toBe(homedir())
    })
  })

  describe('expandTilde', () => {
    it('should expand tilde to home directory', () => {
      const expanded = expandTilde('~/test')
      expect(expanded).toBe(join(homedir(), 'test'))
    })

    it('should not modify paths without tilde', () => {
      expect(expandTilde('/absolute/path')).toBe('/absolute/path')
    })

    it('should not modify relative paths', () => {
      expect(expandTilde('relative/path')).toBe('relative/path')
    })
  })
})

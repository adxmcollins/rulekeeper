import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  isWindows,
  isMac,
  isLinux,
  detectWindowsShell,
  getPlatformName
} from '../../src/lib/platform.js'

describe('platform', () => {
  describe('isWindows', () => {
    it('should return boolean', () => {
      expect(typeof isWindows()).toBe('boolean')
    })
  })

  describe('isMac', () => {
    it('should return boolean', () => {
      expect(typeof isMac()).toBe('boolean')
    })
  })

  describe('isLinux', () => {
    it('should return boolean', () => {
      expect(typeof isLinux()).toBe('boolean')
    })
  })

  describe('getPlatformName', () => {
    it('should return a string', () => {
      const name = getPlatformName()
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })
  })

  describe('detectWindowsShell', () => {
    const originalPlatform = process.platform
    const originalEnv = { ...process.env }

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform })
      process.env = { ...originalEnv }
    })

    it('should return null on non-Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      expect(detectWindowsShell()).toBe(null)
    })
  })
})

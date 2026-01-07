import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  loadManifest,
  saveManifest,
  manifestExists,
  getOrCreateManifest,
  createRuleEntry,
  updateRuleEntry,
  addRuleToManifest,
  removeRuleFromManifest,
  updateRuleInManifest
} from '../../src/lib/manifest.js'
import { DEFAULT_MANIFEST } from '../../src/types/index.js'
import type { ProjectManifest } from '../../src/types/index.js'

describe('manifest', () => {
  const testDir = join(process.cwd(), '.test-manifest')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('loadManifest', () => {
    it('should return null if no manifest exists', async () => {
      const manifest = await loadManifest(testDir)
      expect(manifest).toBe(null)
    })

    it('should load existing manifest', async () => {
      const testManifest: ProjectManifest = {
        version: 1,
        rules: {
          test: {
            file: 'test.md',
            sourceHash: 'sha256:abc',
            localHash: 'sha256:abc',
            status: 'synced',
            installedAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        }
      }
      await saveManifest(testManifest, testDir)

      const loaded = await loadManifest(testDir)
      expect(loaded).toEqual(testManifest)
    })
  })

  describe('manifestExists', () => {
    it('should return false if no manifest', async () => {
      expect(await manifestExists(testDir)).toBe(false)
    })

    it('should return true if manifest exists', async () => {
      await saveManifest(DEFAULT_MANIFEST, testDir)
      expect(await manifestExists(testDir)).toBe(true)
    })
  })

  describe('getOrCreateManifest', () => {
    it('should return default manifest if none exists', async () => {
      const manifest = await getOrCreateManifest(testDir)
      expect(manifest).toEqual(DEFAULT_MANIFEST)
    })

    it('should return existing manifest', async () => {
      const testManifest: ProjectManifest = {
        version: 1,
        rules: { test: createRuleEntry({ file: 'test.md', sourceHash: 'a', localHash: 'a' }) }
      }
      await saveManifest(testManifest, testDir)

      const manifest = await getOrCreateManifest(testDir)
      expect(manifest.rules.test).toBeDefined()
    })
  })

  describe('createRuleEntry', () => {
    it('should create entry with defaults', () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:abc'
      })

      expect(entry.file).toBe('test.md')
      expect(entry.sourceHash).toBe('sha256:abc')
      expect(entry.localHash).toBe('sha256:abc')
      expect(entry.status).toBe('synced')
      expect(entry.installedAt).toBeDefined()
      expect(entry.updatedAt).toBeDefined()
    })

    it('should accept custom status', () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:def',
        status: 'diverged'
      })

      expect(entry.status).toBe('diverged')
    })
  })

  describe('updateRuleEntry', () => {
    it('should update specified fields', () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:abc'
      })

      const updated = updateRuleEntry(entry, { status: 'diverged' })

      expect(updated.status).toBe('diverged')
      expect(updated.file).toBe('test.md')
    })
  })

  describe('addRuleToManifest', () => {
    it('should add rule to manifest', async () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:abc'
      })

      await addRuleToManifest('test', entry, testDir)

      const manifest = await loadManifest(testDir)
      expect(manifest?.rules.test).toBeDefined()
    })
  })

  describe('removeRuleFromManifest', () => {
    it('should remove rule from manifest', async () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:abc'
      })
      await addRuleToManifest('test', entry, testDir)

      await removeRuleFromManifest('test', testDir)

      const manifest = await loadManifest(testDir)
      expect(manifest?.rules.test).toBeUndefined()
    })
  })

  describe('updateRuleInManifest', () => {
    it('should update rule in manifest', async () => {
      const entry = createRuleEntry({
        file: 'test.md',
        sourceHash: 'sha256:abc',
        localHash: 'sha256:abc'
      })
      await addRuleToManifest('test', entry, testDir)

      await updateRuleInManifest('test', { status: 'detached' }, testDir)

      const manifest = await loadManifest(testDir)
      expect(manifest?.rules.test.status).toBe('detached')
    })
  })
})

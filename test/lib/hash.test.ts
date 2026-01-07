import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { hashFile, hashContent, compareHashes } from '../../src/lib/hash.js'

describe('hash', () => {
  const testDir = join(process.cwd(), '.test-hash')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('hashFile', () => {
    it('should return consistent hash for same content', async () => {
      const filePath = join(testDir, 'test.md')
      writeFileSync(filePath, 'Hello, World!')

      const hash1 = await hashFile(filePath)
      const hash2 = await hashFile(filePath)

      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/)
    })

    it('should return different hash for different content', async () => {
      const file1 = join(testDir, 'test1.md')
      const file2 = join(testDir, 'test2.md')
      writeFileSync(file1, 'Hello')
      writeFileSync(file2, 'World')

      const hash1 = await hashFile(file1)
      const hash2 = await hashFile(file2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty files', async () => {
      const filePath = join(testDir, 'empty.md')
      writeFileSync(filePath, '')

      const hash = await hashFile(filePath)
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    })
  })

  describe('hashContent', () => {
    it('should hash string content', async () => {
      const hash = await hashContent('Hello, World!')
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    })

    it('should hash buffer content', async () => {
      const buffer = Buffer.from('Hello, World!')
      const hash = await hashContent(buffer)
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    })

    it('should match file hash for same content', async () => {
      const content = 'Test content'
      const filePath = join(testDir, 'test.md')
      writeFileSync(filePath, content)

      const contentHash = await hashContent(content)
      const fileHash = await hashFile(filePath)

      expect(contentHash).toBe(fileHash)
    })
  })

  describe('compareHashes', () => {
    it('should return true for matching hashes', () => {
      const hash = 'sha256:abc123'
      expect(compareHashes(hash, hash)).toBe(true)
    })

    it('should return false for different hashes', () => {
      expect(compareHashes('sha256:abc', 'sha256:def')).toBe(false)
    })
  })
})

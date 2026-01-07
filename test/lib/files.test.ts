import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ensureDir,
  fileExists,
  readTextFile,
  writeTextFile,
  copyFile,
  deleteFile,
  listFiles,
  getRuleName,
  getRuleFilename
} from '../../src/lib/files.js'

describe('files', () => {
  const testDir = join(process.cwd(), '.test-files')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('ensureDir', () => {
    it('should create directory if not exists', () => {
      const newDir = join(testDir, 'new', 'nested', 'dir')
      ensureDir(newDir)
      expect(existsSync(newDir)).toBe(true)
    })

    it('should not throw if directory exists', () => {
      ensureDir(testDir)
      expect(existsSync(testDir)).toBe(true)
    })
  })

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      const filePath = join(testDir, 'exists.txt')
      writeFileSync(filePath, 'content')
      expect(fileExists(filePath)).toBe(true)
    })

    it('should return false for non-existing file', () => {
      expect(fileExists(join(testDir, 'nope.txt'))).toBe(false)
    })
  })

  describe('readTextFile', () => {
    it('should read file content', async () => {
      const filePath = join(testDir, 'read.txt')
      writeFileSync(filePath, 'Hello, World!')
      const content = await readTextFile(filePath)
      expect(content).toBe('Hello, World!')
    })
  })

  describe('writeTextFile', () => {
    it('should write file content', async () => {
      const filePath = join(testDir, 'write.txt')
      await writeTextFile(filePath, 'Test content')
      expect(existsSync(filePath)).toBe(true)
      const content = await readTextFile(filePath)
      expect(content).toBe('Test content')
    })

    it('should create parent directories', async () => {
      const filePath = join(testDir, 'nested', 'dir', 'write.txt')
      await writeTextFile(filePath, 'Nested content')
      expect(existsSync(filePath)).toBe(true)
    })
  })

  describe('copyFile', () => {
    it('should copy file content', async () => {
      const srcPath = join(testDir, 'src.txt')
      const destPath = join(testDir, 'dest.txt')
      writeFileSync(srcPath, 'Copy me')
      await copyFile(srcPath, destPath)
      const content = await readTextFile(destPath)
      expect(content).toBe('Copy me')
    })

    it('should create parent directories', async () => {
      const srcPath = join(testDir, 'src.txt')
      const destPath = join(testDir, 'nested', 'dest.txt')
      writeFileSync(srcPath, 'Copy me')
      await copyFile(srcPath, destPath)
      expect(existsSync(destPath)).toBe(true)
    })
  })

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const filePath = join(testDir, 'delete.txt')
      writeFileSync(filePath, 'Delete me')
      await deleteFile(filePath)
      expect(existsSync(filePath)).toBe(false)
    })

    it('should not throw for non-existing file', async () => {
      await deleteFile(join(testDir, 'nope.txt'))
    })
  })

  describe('listFiles', () => {
    it('should list all files', async () => {
      writeFileSync(join(testDir, 'a.md'), 'a')
      writeFileSync(join(testDir, 'b.md'), 'b')
      writeFileSync(join(testDir, 'c.txt'), 'c')

      const files = await listFiles(testDir)
      expect(files.sort()).toEqual(['a.md', 'b.md', 'c.txt'])
    })

    it('should filter by extension', async () => {
      writeFileSync(join(testDir, 'a.md'), 'a')
      writeFileSync(join(testDir, 'b.md'), 'b')
      writeFileSync(join(testDir, 'c.txt'), 'c')

      const files = await listFiles(testDir, '.md')
      expect(files.sort()).toEqual(['a.md', 'b.md'])
    })

    it('should return empty array for non-existing dir', async () => {
      const files = await listFiles(join(testDir, 'nope'))
      expect(files).toEqual([])
    })
  })

  describe('getRuleName', () => {
    it('should remove .md extension', () => {
      expect(getRuleName('laravel.md')).toBe('laravel')
    })

    it('should handle paths', () => {
      expect(getRuleName('/path/to/laravel.md')).toBe('laravel')
    })
  })

  describe('getRuleFilename', () => {
    it('should add .md extension', () => {
      expect(getRuleFilename('laravel')).toBe('laravel.md')
    })

    it('should not add extension if already present', () => {
      expect(getRuleFilename('laravel.md')).toBe('laravel.md')
    })
  })
})

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath)
  const hash = createHash('sha256').update(content).digest('hex')
  return `sha256:${hash}`
}

export async function hashContent(content: string | Buffer): Promise<string> {
  const hash = createHash('sha256').update(content).digest('hex')
  return `sha256:${hash}`
}

export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1 === hash2
}

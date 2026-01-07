import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  saveManifest,
  getClaudeDir,
  deleteFile,
  getRuleFilename
} from '../lib/index.js'
import { log } from '../ui/index.js'
import { messages } from '../ui/messages.js'

interface RemoveOptions {
  keepFile?: boolean
}

export async function remove(rules: string[], options: RemoveOptions = {}): Promise<void> {
  // Load config
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  // Load manifest
  const manifest = await loadManifest()
  if (!manifest) {
    log.error(messages.noManifest)
    process.exit(1)
  }

  if (rules.length === 0) {
    log.error('No rules specified.')
    process.exit(1)
  }

  const claudeDir = getClaudeDir()
  let removedCount = 0

  for (const rule of rules) {
    if (!manifest.rules[rule]) {
      log.warn(messages.removeNotInstalled(rule))
      continue
    }

    const filename = getRuleFilename(rule)
    const targetPath = join(claudeDir, filename)

    // Delete file unless --keep-file is specified
    if (!options.keepFile) {
      try {
        await deleteFile(targetPath)
      } catch (error) {
        log.warn(`Could not delete ${filename}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Remove from manifest
    delete manifest.rules[rule]
    log.success(`Removed ${rule}`)
    removedCount++
  }

  await saveManifest(manifest)

  if (removedCount > 0) {
    log.info(messages.removeSuccess(removedCount))
  }
}

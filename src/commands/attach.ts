import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  updateRuleInManifest,
  getClaudeDir,
  fileExists,
  hashFile,
  copyFile,
  getRuleFilename
} from '../lib/index.js'
import { log, handleAttachDiffers, isCancel } from '../ui/index.js'
import { messages } from '../ui/messages.js'

export async function attach(ruleName: string): Promise<void> {
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

  const entry = manifest.rules[ruleName]
  if (!entry) {
    log.error(`Rule '${ruleName}' not found in manifest.`)
    process.exit(1)
  }

  if (entry.status !== 'detached') {
    log.warn(messages.attachAlready(ruleName))
    return
  }

  const claudeDir = getClaudeDir()
  const filename = getRuleFilename(ruleName)
  const localPath = join(claudeDir, filename)
  const sourcePath = join(config.source.path, filename)

  // Check if source exists
  if (!fileExists(sourcePath)) {
    log.error(messages.errorMissingSource(ruleName))
    process.exit(1)
  }

  // Check if local exists
  if (!fileExists(localPath)) {
    log.error(messages.errorMissingLocal(ruleName))
    process.exit(1)
  }

  // Compare hashes
  const localHash = await hashFile(localPath)
  const sourceHash = await hashFile(sourcePath)

  if (localHash === sourceHash) {
    // Files match - just attach
    await updateRuleInManifest(ruleName, {
      status: 'synced',
      sourceHash,
      localHash,
      detachedAt: undefined
    })
    log.success(messages.attachSuccess(ruleName))
    return
  }

  // Files differ - ask user what to do
  const action = await handleAttachDiffers(ruleName)

  if (isCancel(action)) {
    log.info('Cancelled.')
    return
  }

  switch (action) {
    case 'overwrite':
      await copyFile(sourcePath, localPath)
      const newHash = await hashFile(localPath)
      await updateRuleInManifest(ruleName, {
        status: 'synced',
        sourceHash,
        localHash: newHash,
        detachedAt: undefined
      })
      log.success(messages.attachSuccess(ruleName))
      break

    case 'keep':
      await updateRuleInManifest(ruleName, {
        status: 'diverged',
        sourceHash,
        localHash,
        detachedAt: undefined
      })
      log.success(`${ruleName} attached (will show as diverged)`)
      break

    case 'cancel':
      log.info('Cancelled.')
      break
  }
}

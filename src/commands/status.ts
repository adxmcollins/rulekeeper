import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  getClaudeDir,
  fileExists,
  hashFile,
  pullSourceIfNeeded,
  updateConfigLastPull,
  getRuleFilename,
  isIgnoredRule
} from '../lib/index.js'
import { log, spinner, formatRuleLine, formatHeader } from '../ui/index.js'
import { messages } from '../ui/messages.js'
import type { RuleStatus, StatusCheckResult } from '../types/index.js'

export async function status(): Promise<void> {
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

  // Pull from source if needed
  const s = spinner()
  s.start('Checking for updates...')
  const pullResult = await pullSourceIfNeeded(config)
  if (pullResult.pulled) {
    await updateConfigLastPull()
  }
  s.stop('')

  if (pullResult.error) {
    log.warn(messages.statusOffline)
  }

  const ruleNames = Object.keys(manifest.rules)
  if (ruleNames.length === 0) {
    log.info('No rules installed.')
    return
  }

  console.log('')
  console.log(formatHeader('RuleKeeper Status'))
  console.log('')

  const claudeDir = getClaudeDir()
  let needsAttention = 0

  for (const ruleName of ruleNames.sort()) {
    // Skip ignored files like README.md
    if (isIgnoredRule(ruleName)) {
      continue
    }

    const entry = manifest.rules[ruleName]
    const filename = getRuleFilename(ruleName)
    const localPath = join(claudeDir, filename)
    const sourcePath = join(config.source.path, filename)

    const result = await checkRuleStatus(entry, localPath, sourcePath)
    let details: string | undefined

    switch (result.status) {
      case 'outdated':
        details = 'source updated'
        needsAttention++
        break
      case 'diverged':
        details = 'local changes detected'
        needsAttention++
        break
      case 'detached':
        break
      case 'synced':
        break
    }

    if (!result.localExists) {
      details = 'local file missing'
      needsAttention++
    } else if (!result.sourceExists) {
      details = 'source file missing'
      needsAttention++
    }

    console.log(formatRuleLine(ruleName + '.md', result.status, details))
  }

  console.log('')

  if (needsAttention > 0) {
    log.info(messages.statusNeedsAttention(needsAttention))
  } else {
    log.success(messages.statusAllSynced)
  }
}

async function checkRuleStatus(
  entry: { status: RuleStatus; sourceHash: string; localHash: string },
  localPath: string,
  sourcePath: string
): Promise<StatusCheckResult> {
  const localExists = fileExists(localPath)
  const sourceExists = fileExists(sourcePath)

  // If detached, always return detached regardless of file state
  if (entry.status === 'detached') {
    return {
      status: 'detached',
      localChanged: false,
      sourceChanged: false,
      localExists,
      sourceExists
    }
  }

  // Handle missing files
  if (!localExists || !sourceExists) {
    return {
      status: 'diverged',
      localChanged: !localExists,
      sourceChanged: !sourceExists,
      localExists,
      sourceExists
    }
  }

  // Calculate current hashes
  const currentLocalHash = await hashFile(localPath)
  const currentSourceHash = await hashFile(sourcePath)

  const localChanged = currentLocalHash !== entry.localHash
  const sourceChanged = currentSourceHash !== entry.sourceHash

  let status: RuleStatus

  if (localChanged) {
    status = 'diverged'
  } else if (sourceChanged) {
    status = 'outdated'
  } else {
    status = 'synced'
  }

  return {
    status,
    localChanged,
    sourceChanged,
    localExists,
    sourceExists,
    currentLocalHash,
    currentSourceHash
  }
}

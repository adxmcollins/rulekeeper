import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  saveManifest,
  getClaudeDir,
  fileExists,
  copyFile,
  hashFile,
  pullSourceIfNeeded,
  updateConfigLastPull,
  getRuleFilename,
  deleteFile,
  findRuleMatch
} from '../lib/index.js'
import {
  log,
  spinner,
  handleDivergedRule,
  handleMissingSource,
  handleMissingLocal,
  isCancel
} from '../ui/index.js'
import { messages } from '../ui/messages.js'
import { showDiff } from './diff.js'
import type { RuleStatus, RuleEntry } from '../types/index.js'

interface PullOptions {
  force?: boolean
  includeDetached?: boolean
}

export async function pull(rules: string[], options: PullOptions = {}): Promise<void> {
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

  // Determine which rules to process (case-insensitive matching)
  const manifestRules = Object.keys(manifest.rules)
  let rulesToProcess: string[]

  if (rules.length > 0) {
    rulesToProcess = []
    for (const rule of rules) {
      const match = findRuleMatch(rule, manifestRules)
      if (match) {
        rulesToProcess.push(match)
      } else {
        log.warn(`Rule '${rule}' not found in manifest`)
      }
    }
  } else {
    rulesToProcess = manifestRules
  }

  const results = {
    updated: [] as string[],
    skipped: [] as string[],
    detached: [] as string[],
    failed: [] as string[]
  }

  const claudeDir = getClaudeDir()
  const isSingleRule = rules.length === 1

  for (const ruleName of rulesToProcess) {
    const entry = manifest.rules[ruleName]

    if (!entry) {
      log.warn(`Rule '${ruleName}' not found in manifest`)
      results.failed.push(ruleName)
      continue
    }

    // Skip detached unless explicitly included
    if (entry.status === 'detached' && !options.includeDetached) {
      log.info(`○ ${ruleName}.md (detached - skipped)`)
      results.skipped.push(ruleName)
      continue
    }

    const filename = getRuleFilename(ruleName)
    const sourcePath = join(config.source.path, filename)
    const localPath = join(claudeDir, filename)

    // Handle missing source
    if (!fileExists(sourcePath)) {
      const action = await handleMissingSource(ruleName)
      if (isCancel(action)) {
        results.skipped.push(ruleName)
        continue
      }

      if (action === 'keep') {
        manifest.rules[ruleName] = {
          ...entry,
          status: 'detached',
          detachedAt: new Date().toISOString()
        }
        results.detached.push(ruleName)
      } else if (action === 'remove') {
        await deleteFile(localPath)
        delete manifest.rules[ruleName]
        log.success(`Removed ${ruleName}`)
      }
      continue
    }

    // Handle missing local
    if (!fileExists(localPath)) {
      const action = await handleMissingLocal(ruleName)
      if (isCancel(action)) {
        results.skipped.push(ruleName)
        continue
      }

      if (action === 'restore') {
        await copyFile(sourcePath, localPath)
        const hash = await hashFile(localPath)
        manifest.rules[ruleName] = {
          ...entry,
          sourceHash: hash,
          localHash: hash,
          status: 'synced',
          updatedAt: new Date().toISOString()
        }
        log.success(`Restored ${ruleName}.md`)
        results.updated.push(ruleName)
      } else if (action === 'remove') {
        delete manifest.rules[ruleName]
        log.success(`Removed ${ruleName} from manifest`)
      }
      continue
    }

    // Process the rule
    const result = await pullRule(
      ruleName,
      entry,
      sourcePath,
      localPath,
      manifest,
      options,
      isSingleRule
    )

    switch (result) {
      case 'updated':
        log.success(`✓ ${ruleName}.md updated`)
        results.updated.push(ruleName)
        break
      case 'detached':
        log.info(`○ ${ruleName}.md detached`)
        results.detached.push(ruleName)
        break
      case 'skipped':
        results.skipped.push(ruleName)
        break
      case 'cancelled':
        await saveManifest(manifest)
        return
    }
  }

  await saveManifest(manifest)

  // Summary
  console.log('')
  if (results.updated.length > 0) {
    log.success(messages.pullSuccess(results.updated.length))
  }
  if (results.detached.length > 0) {
    log.info(messages.pullDetached(results.detached.length))
  }
  if (results.failed.length > 0) {
    log.error(`${results.failed.length} rule(s) failed`)
  }
  if (results.updated.length === 0 && results.detached.length === 0 && results.failed.length === 0) {
    log.success(messages.pullUpToDate)
  }
}

async function pullRule(
  ruleName: string,
  entry: RuleEntry,
  sourcePath: string,
  localPath: string,
  manifest: { rules: Record<string, RuleEntry> },
  options: PullOptions,
  isSingleRule: boolean
): Promise<'updated' | 'skipped' | 'detached' | 'cancelled'> {
  // Calculate current hashes
  const currentLocalHash = await hashFile(localPath)
  const currentSourceHash = await hashFile(sourcePath)

  // Determine state
  const localChanged = currentLocalHash !== entry.localHash
  const sourceChanged = currentSourceHash !== entry.sourceHash

  // No changes anywhere - nothing to do
  if (!localChanged && !sourceChanged) {
    return 'skipped'
  }

  // Only source changed - safe to update
  if (!localChanged && sourceChanged) {
    await copyFile(sourcePath, localPath)
    manifest.rules[ruleName] = {
      ...entry,
      sourceHash: currentSourceHash,
      localHash: currentSourceHash,
      status: 'synced',
      updatedAt: new Date().toISOString()
    }
    return 'updated'
  }

  // Local changed (diverged) - need to handle
  if (localChanged) {
    // Force flag overwrites without prompting
    if (options.force) {
      await copyFile(sourcePath, localPath)
      const newHash = await hashFile(localPath)
      manifest.rules[ruleName] = {
        ...entry,
        sourceHash: currentSourceHash,
        localHash: newHash,
        status: 'synced',
        updatedAt: new Date().toISOString()
      }
      return 'updated'
    }

    // Interactive handling
    let action = await handleDivergedRule(ruleName, sourceChanged, isSingleRule)

    // Handle view-diff loop
    while (action === 'view-diff') {
      await showDiff([ruleName])
      action = await handleDivergedRule(ruleName, sourceChanged, isSingleRule)
    }

    if (isCancel(action)) {
      return isSingleRule ? 'cancelled' : 'skipped'
    }

    switch (action) {
      case 'overwrite':
        await copyFile(sourcePath, localPath)
        const newHash = await hashFile(localPath)
        manifest.rules[ruleName] = {
          ...entry,
          sourceHash: currentSourceHash,
          localHash: newHash,
          status: 'synced',
          updatedAt: new Date().toISOString()
        }
        return 'updated'

      case 'detach':
        manifest.rules[ruleName] = {
          ...entry,
          status: 'detached',
          detachedAt: new Date().toISOString()
        }
        return 'detached'

      case 'skip':
      case 'cancel':
        return isSingleRule ? 'cancelled' : 'skipped'
    }
  }

  return 'skipped'
}

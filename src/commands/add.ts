import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  saveManifest,
  getOrCreateManifest,
  createRuleEntry,
  getAvailableRules,
  getRuleSourcePath,
  getClaudeDir,
  fileExists,
  copyFile,
  ensureDir,
  hashFile,
  pullSourceIfNeeded,
  updateConfigLastPull,
  getRuleFilename
} from '../lib/index.js'
import {
  log,
  spinner,
  isCancel,
  confirmOverwrite,
  selectRulesToAdd
} from '../ui/index.js'
import { messages } from '../ui/messages.js'

interface AddOptions {
  all?: boolean
}

export async function add(rules: string[], options: AddOptions = {}): Promise<void> {
  // Load config
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  // Pull from source if needed
  const s = spinner()
  s.start('Checking for updates...')
  const pullResult = await pullSourceIfNeeded(config)
  if (pullResult.pulled) {
    await updateConfigLastPull()
  }
  s.stop(pullResult.error ? messages.statusOffline : 'Source is up to date.')

  // Get available rules
  const availableRules = await getAvailableRules(config)
  if (availableRules.length === 0) {
    log.error('No rules found in source.')
    process.exit(1)
  }

  // Get installed rules
  const manifest = await loadManifest()
  const installedRules = manifest ? Object.keys(manifest.rules) : []

  // Determine which rules to add
  let rulesToAdd: string[]

  if (options.all) {
    rulesToAdd = availableRules.map(r => r.name)
  } else if (rules.length > 0) {
    rulesToAdd = rules
  } else {
    // Interactive selection
    const selected = await selectRulesToAdd(
      availableRules.map(r => r.name),
      installedRules
    )

    if (isCancel(selected)) {
      log.info('Cancelled.')
      return
    }

    rulesToAdd = selected as string[]
  }

  if (rulesToAdd.length === 0) {
    log.warn(messages.addNoRules)
    return
  }

  // Validate all rules exist in source
  const invalidRules: string[] = []
  for (const rule of rulesToAdd) {
    const sourcePath = await getRuleSourcePath(rule, config)
    if (!sourcePath) {
      invalidRules.push(rule)
    }
  }

  if (invalidRules.length > 0) {
    for (const rule of invalidRules) {
      log.error(messages.ruleNotFound(rule))
    }
    process.exit(1)
  }

  // Check for existing files that would be overwritten
  const claudeDir = getClaudeDir()
  const conflicts: string[] = []

  for (const rule of rulesToAdd) {
    const filename = getRuleFilename(rule)
    const targetPath = join(claudeDir, filename)
    if (fileExists(targetPath) && !installedRules.includes(rule)) {
      conflicts.push(filename)
    }
  }

  if (conflicts.length > 0) {
    log.warn(messages.addConflict(conflicts))
    const confirmed = await confirmOverwrite(conflicts)
    if (!confirmed) {
      log.info('Cancelled.')
      return
    }
  }

  // Ensure .claude directory exists
  ensureDir(claudeDir)

  // Copy rules and update manifest
  const updatedManifest = await getOrCreateManifest()
  let addedCount = 0

  for (const rule of rulesToAdd) {
    const sourcePath = await getRuleSourcePath(rule, config)
    if (!sourcePath) continue

    const filename = getRuleFilename(rule)
    const targetPath = join(claudeDir, filename)

    try {
      await copyFile(sourcePath, targetPath)
      const hash = await hashFile(targetPath)

      updatedManifest.rules[rule] = createRuleEntry({
        file: filename,
        sourceHash: hash,
        localHash: hash
      })

      log.success(`Added ${filename}`)
      addedCount++
    } catch (error) {
      log.error(`Failed to add ${filename}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  await saveManifest(updatedManifest)

  if (addedCount > 0) {
    log.info(messages.addSuccess(addedCount))
  }
}

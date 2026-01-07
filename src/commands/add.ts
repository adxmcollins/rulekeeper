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
  getRuleFilename,
  findRuleMatch
} from '../lib/index.js'
import {
  log,
  spinner,
  isCancel,
  confirmOverwrite,
  selectRulesToAdd,
  handleDivergedRule
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

  // Resolve rules case-insensitively and validate they exist
  const availableRuleNames = availableRules.map(r => r.name)
  const resolvedRules: string[] = []
  const invalidRules: string[] = []

  for (const rule of rulesToAdd) {
    const match = findRuleMatch(rule, availableRuleNames)
    if (match) {
      resolvedRules.push(match)
    } else {
      invalidRules.push(rule)
    }
  }

  if (invalidRules.length > 0) {
    for (const rule of invalidRules) {
      log.error(messages.ruleNotFound(rule))
    }
    process.exit(1)
  }

  const claudeDir = getClaudeDir()
  ensureDir(claudeDir)

  // Copy rules and update manifest, handling conflicts
  const updatedManifest = await getOrCreateManifest()
  let addedCount = 0
  let skippedCount = 0

  for (const rule of resolvedRules) {
    const sourcePath = await getRuleSourcePath(rule, config)
    if (!sourcePath) continue

    const filename = getRuleFilename(rule)
    const targetPath = join(claudeDir, filename)
    const sourceHash = await hashFile(sourcePath)

    // Check if file already exists with local changes
    if (fileExists(targetPath)) {
      const localHash = await hashFile(targetPath)
      const entry = updatedManifest.rules[rule]

      // If already tracked and unchanged, just update
      if (entry && localHash === entry.localHash) {
        await copyFile(sourcePath, targetPath)
        const newHash = await hashFile(targetPath)
        updatedManifest.rules[rule] = createRuleEntry({
          file: filename,
          sourceHash: newHash,
          localHash: newHash
        })
        log.success(`Updated ${filename}`)
        addedCount++
        continue
      }

      // If file has local changes (tracked or untracked), ask user
      if (!entry || localHash !== entry.localHash) {
        const action = await handleDivergedRule(rule, false, false)

        if (isCancel(action) || action === 'skip') {
          skippedCount++
          continue
        }

        if (action === 'detach') {
          // Keep local file, mark as detached
          updatedManifest.rules[rule] = createRuleEntry({
            file: filename,
            sourceHash: sourceHash,
            localHash: localHash,
            status: 'detached'
          })
          updatedManifest.rules[rule].detachedAt = new Date().toISOString()
          log.info(`${filename} kept as detached`)
          continue
        }

        // Overwrite
      }
    }

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
  if (skippedCount > 0) {
    log.info(`${skippedCount} rule(s) skipped.`)
  }
}

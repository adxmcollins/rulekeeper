import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  getClaudeDir,
  fileExists,
  readTextFile,
  hashFile,
  getRuleFilename
} from '../lib/index.js'
import {
  log,
  formatDiffAdd,
  formatDiffRemove,
  formatDiffContext,
  formatDiffHeader,
  formatPath,
  formatHeader
} from '../ui/index.js'
import { messages } from '../ui/messages.js'

interface DiffOptions {
  all?: boolean
}

export async function diff(rules: string[], options: DiffOptions = {}): Promise<void> {
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

  const claudeDir = getClaudeDir()

  // Determine which rules to show diff for
  let rulesToDiff: string[]

  if (options.all) {
    // Find all diverged rules
    rulesToDiff = []
    for (const [ruleName, entry] of Object.entries(manifest.rules)) {
      if (entry.status === 'detached') continue

      const filename = getRuleFilename(ruleName)
      const localPath = join(claudeDir, filename)

      if (!fileExists(localPath)) continue

      const currentLocalHash = await hashFile(localPath)
      if (currentLocalHash !== entry.localHash) {
        rulesToDiff.push(ruleName)
      }
    }

    if (rulesToDiff.length === 0) {
      log.info(messages.diffNoRules)
      return
    }
  } else if (rules.length > 0) {
    rulesToDiff = rules
  } else {
    log.error('Specify a rule name or use --all to see all diverged rules.')
    process.exit(1)
  }

  for (const ruleName of rulesToDiff) {
    const entry = manifest.rules[ruleName]
    if (!entry) {
      log.warn(`Rule '${ruleName}' not found in manifest`)
      continue
    }

    const filename = getRuleFilename(ruleName)
    const localPath = join(claudeDir, filename)
    const sourcePath = join(config.source.path, filename)

    await showRuleDiff(ruleName, sourcePath, localPath)
  }
}

export async function showDiff(rules: string[]): Promise<void> {
  return diff(rules, {})
}

async function showRuleDiff(
  ruleName: string,
  sourcePath: string,
  localPath: string
): Promise<void> {
  const sourceExists = fileExists(sourcePath)
  const localExists = fileExists(localPath)

  console.log('')
  console.log(formatHeader(`Comparing ${ruleName}.md`))
  console.log('')

  if (!sourceExists && !localExists) {
    log.warn('Both source and local files are missing')
    return
  }

  if (!sourceExists) {
    log.warn('Source file no longer exists')
    console.log(formatDiffHeader(`--- source (missing)`))
    console.log(formatDiffHeader(`+++ local (${formatPath(localPath)})`))
    return
  }

  if (!localExists) {
    log.warn('Local file is missing')
    console.log(formatDiffHeader(`--- source (${formatPath(sourcePath)})`))
    console.log(formatDiffHeader(`+++ local (missing)`))
    return
  }

  const sourceContent = await readTextFile(sourcePath)
  const localContent = await readTextFile(localPath)

  if (sourceContent === localContent) {
    log.info(messages.diffNoDifference(ruleName))
    return
  }

  console.log(formatDiffHeader(`--- source (${sourcePath})`))
  console.log(formatDiffHeader(`+++ local (${localPath})`))
  console.log('')

  // Simple line-by-line diff
  const sourceLines = sourceContent.split('\n')
  const localLines = localContent.split('\n')

  const diff = computeSimpleDiff(sourceLines, localLines)

  for (const line of diff) {
    if (line.type === 'add') {
      console.log(formatDiffAdd(line.content))
    } else if (line.type === 'remove') {
      console.log(formatDiffRemove(line.content))
    } else {
      console.log(formatDiffContext(line.content))
    }
  }

  console.log('')
}

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
}

function computeSimpleDiff(source: string[], local: string[]): DiffLine[] {
  // Simple diff algorithm - compare lines
  const result: DiffLine[] = []
  const maxLen = Math.max(source.length, local.length)

  // Build a map of source lines for quick lookup
  const sourceSet = new Set(source)
  const localSet = new Set(local)

  let si = 0
  let li = 0

  while (si < source.length || li < local.length) {
    if (si >= source.length) {
      // Remaining local lines are additions
      result.push({ type: 'add', content: local[li] })
      li++
    } else if (li >= local.length) {
      // Remaining source lines are removals
      result.push({ type: 'remove', content: source[si] })
      si++
    } else if (source[si] === local[li]) {
      // Lines match
      result.push({ type: 'context', content: source[si] })
      si++
      li++
    } else if (!localSet.has(source[si])) {
      // Source line not in local - it was removed
      result.push({ type: 'remove', content: source[si] })
      si++
    } else if (!sourceSet.has(local[li])) {
      // Local line not in source - it was added
      result.push({ type: 'add', content: local[li] })
      li++
    } else {
      // Both lines exist elsewhere - treat as removal then addition
      result.push({ type: 'remove', content: source[si] })
      result.push({ type: 'add', content: local[li] })
      si++
      li++
    }
  }

  return result
}

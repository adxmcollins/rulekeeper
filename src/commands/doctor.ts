import { join } from 'node:path'
import {
  loadConfig,
  loadManifest,
  getClaudeDir,
  getRulekeeperDir,
  getConfigPath,
  fileExists,
  isGitRepo,
  hasRemote,
  getAvailableRules
} from '../lib/index.js'
import { log, formatSuccess, formatError, formatWarning, formatHeader, formatPath } from '../ui/index.js'
import { messages } from '../ui/messages.js'
import pc from 'picocolors'

interface DiagnosticResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

export async function doctor(): Promise<void> {
  console.log('')
  console.log(formatHeader('RuleKeeper Diagnostics'))
  console.log('')

  const results: DiagnosticResult[] = []

  // Check 1: Global config exists
  const configPath = getConfigPath()
  if (fileExists(configPath)) {
    results.push({
      name: 'Global config',
      status: 'pass',
      message: `Found at ${formatPath(configPath)}`
    })
  } else {
    results.push({
      name: 'Global config',
      status: 'fail',
      message: `Not found. Run ${pc.cyan('rk init')} to configure.`
    })
  }

  // Load config for remaining checks
  const config = await loadConfig()

  if (config) {
    // Check 2: Source path exists
    if (fileExists(config.source.path)) {
      results.push({
        name: 'Source path',
        status: 'pass',
        message: formatPath(config.source.path)
      })
    } else {
      results.push({
        name: 'Source path',
        status: 'fail',
        message: `Path does not exist: ${formatPath(config.source.path)}`
      })
    }

    // Check 3: Source has rules
    if (fileExists(config.source.path)) {
      const availableRules = await getAvailableRules(config)
      if (availableRules.length > 0) {
        results.push({
          name: 'Source rules',
          status: 'pass',
          message: `${availableRules.length} rule(s) available`
        })
      } else {
        results.push({
          name: 'Source rules',
          status: 'warn',
          message: 'No .md files found in source'
        })
      }
    }

    // Check 4: Git remote (if git source)
    if (config.source.type === 'git' && fileExists(config.source.path)) {
      if (isGitRepo(config.source.path)) {
        if (await hasRemote(config.source.path)) {
          results.push({
            name: 'Git remote',
            status: 'pass',
            message: 'Remote configured'
          })
        } else {
          results.push({
            name: 'Git remote',
            status: 'warn',
            message: 'No remote configured - cannot auto-pull'
          })
        }
      } else {
        results.push({
          name: 'Git repository',
          status: 'fail',
          message: 'Source is configured as git but is not a git repository'
        })
      }
    }
  }

  // Check 5: Project setup (only if in a project)
  const claudeDir = getClaudeDir()
  const rulekeeperDir = getRulekeeperDir()

  if (fileExists(claudeDir)) {
    results.push({
      name: '.claude directory',
      status: 'pass',
      message: 'Found in current project'
    })
  } else {
    results.push({
      name: '.claude directory',
      status: 'warn',
      message: 'Not found - not in a Claude Code project?'
    })
  }

  // Check 6: Manifest
  const manifest = await loadManifest()
  if (manifest) {
    const ruleCount = Object.keys(manifest.rules).length
    results.push({
      name: 'RuleKeeper manifest',
      status: 'pass',
      message: `${ruleCount} rule(s) tracked`
    })

    // Check 7: Rule file integrity
    if (config && ruleCount > 0) {
      let missingCount = 0
      for (const [ruleName, entry] of Object.entries(manifest.rules)) {
        const localPath = join(claudeDir, entry.file)
        if (!fileExists(localPath)) {
          missingCount++
        }
      }

      if (missingCount > 0) {
        results.push({
          name: 'Rule files',
          status: 'warn',
          message: `${missingCount} tracked rule(s) missing local files`
        })
      } else {
        results.push({
          name: 'Rule files',
          status: 'pass',
          message: 'All tracked rules have local files'
        })
      }
    }
  } else if (fileExists(claudeDir)) {
    results.push({
      name: 'RuleKeeper manifest',
      status: 'warn',
      message: `No manifest. Run ${pc.cyan('rk add')} to start tracking rules.`
    })
  }

  // Display results
  let passCount = 0
  let warnCount = 0
  let failCount = 0

  for (const result of results) {
    let icon: string
    let color: (s: string) => string

    switch (result.status) {
      case 'pass':
        icon = '✓'
        color = pc.green
        passCount++
        break
      case 'warn':
        icon = '⚠'
        color = pc.yellow
        warnCount++
        break
      case 'fail':
        icon = '✗'
        color = pc.red
        failCount++
        break
    }

    console.log(`  ${color(icon)} ${result.name}: ${result.message}`)
  }

  console.log('')

  if (failCount > 0) {
    log.error(messages.doctorIssuesFound(failCount))
  } else if (warnCount > 0) {
    log.warn(`${warnCount} warning(s) found.`)
  } else {
    log.success(messages.doctorAllGood)
  }
}

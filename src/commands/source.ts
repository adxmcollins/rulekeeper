import {
  loadConfig,
  saveConfig,
  expandTilde,
  fileExists,
  ensureDir,
  cloneRepo,
  pullRepo,
  isGitRepo,
  hasRemote,
  getRemoteUrl,
  isGitUrl
} from '../lib/index.js'
import { log, spinner, formatPath, formatHeader } from '../ui/index.js'
import { messages } from '../ui/messages.js'
import { join } from 'node:path'

export async function sourceShow(): Promise<void> {
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  console.log('')
  console.log(formatHeader('Source Configuration'))
  console.log('')
  console.log(`  Type:   ${config.source.type}`)
  console.log(`  Path:   ${formatPath(config.source.path)}`)

  if (config.source.remote) {
    console.log(`  Remote: ${config.source.remote}`)
  } else if (isGitRepo(config.source.path)) {
    const remote = await getRemoteUrl(config.source.path)
    if (remote) {
      console.log(`  Remote: ${remote}`)
    }
  }

  console.log('')
  console.log(`  Auto-pull:  ${config.settings.autoPull ? 'enabled' : 'disabled'}`)
  console.log(`  Frequency:  ${config.settings.pullFrequency}`)
  if (config.settings.lastPull) {
    console.log(`  Last pull:  ${new Date(config.settings.lastPull).toLocaleString()}`)
  }
  console.log('')
}

export async function sourceSet(pathOrUrl: string): Promise<void> {
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  if (isGitUrl(pathOrUrl)) {
    // It's a git URL - clone it
    const s = spinner()
    s.start('Cloning repository...')

    // Determine clone path from URL
    const repoName = pathOrUrl.split('/').pop()?.replace('.git', '') || 'claude-rules'
    const clonePath = expandTilde(`~/Documents/${repoName}`)

    try {
      ensureDir(join(clonePath, '..'))
      await cloneRepo(pathOrUrl, clonePath)
      s.stop('Repository cloned successfully.')

      config.source = {
        type: 'git',
        path: clonePath,
        remote: pathOrUrl
      }
    } catch (error) {
      s.stop('Failed to clone repository.')
      log.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  } else {
    // It's a local path
    const expandedPath = expandTilde(pathOrUrl)

    if (!fileExists(expandedPath)) {
      log.error(messages.sourceNotFound(expandedPath))
      process.exit(1)
    }

    config.source = {
      type: 'local',
      path: expandedPath
    }

    // Check if it's a git repo with a remote
    if (isGitRepo(expandedPath)) {
      const remote = await getRemoteUrl(expandedPath)
      if (remote) {
        config.source.type = 'git'
        config.source.remote = remote
      }
    }
  }

  await saveConfig(config)
  log.success(messages.sourceUpdated(config.source.path))
}

export async function sourcePull(): Promise<void> {
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  if (!isGitRepo(config.source.path)) {
    log.error('Source is not a git repository.')
    process.exit(1)
  }

  if (!(await hasRemote(config.source.path))) {
    log.error('Source repository has no remote configured.')
    process.exit(1)
  }

  const s = spinner()
  s.start('Pulling from remote...')

  try {
    await pullRepo(config.source.path)
    s.stop('Source updated successfully.')

    // Update last pull time
    config.settings.lastPull = new Date().toISOString()
    await saveConfig(config)
  } catch (error) {
    s.stop('Failed to pull from remote.')
    log.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

import { join } from 'node:path'
import {
  loadConfig,
  saveConfig,
  createConfig,
  configExists,
  expandTilde,
  fileExists,
  ensureDir,
  cloneRepo,
  isGitRepo,
  getRemoteUrl
} from '../lib/index.js'
import {
  intro,
  outro,
  log,
  spinner,
  isCancel,
  selectSourceType,
  inputSourcePath,
  inputGitUrl,
  inputClonePath,
  selectPullFrequency,
  selectWindowsShell
} from '../ui/index.js'
import { messages } from '../ui/messages.js'
import { isWindows, detectWindowsShell } from '../lib/platform.js'
import type { SourceType, PullFrequency, WindowsShell } from '../types/index.js'

interface InitOptions {
  force?: boolean
}

export async function init(options: InitOptions = {}): Promise<void> {
  intro(messages.initWelcome)

  // Check if already configured
  if (!options.force && await configExists()) {
    log.warn(messages.initAlreadyExists)
    return
  }

  // Select source type
  const sourceType = await selectSourceType()
  if (isCancel(sourceType)) {
    log.info('Setup cancelled.')
    return
  }

  let sourcePath: string
  let remote: string | undefined
  let detectedSourceType: SourceType = sourceType as SourceType

  if (sourceType === 'git') {
    // Get git URL
    const gitUrl = await inputGitUrl()
    if (isCancel(gitUrl)) {
      log.info('Setup cancelled.')
      return
    }

    // Get clone path
    const clonePath = await inputClonePath()
    if (isCancel(clonePath)) {
      log.info('Setup cancelled.')
      return
    }

    const expandedClonePath = expandTilde(clonePath as string)

    // Clone the repository
    const s = spinner()
    s.start('Cloning repository...')

    try {
      ensureDir(join(expandedClonePath, '..'))
      await cloneRepo(gitUrl as string, expandedClonePath)
      s.stop('Repository cloned successfully.')
      sourcePath = expandedClonePath
      remote = gitUrl as string
    } catch (error) {
      s.stop('Failed to clone repository.')
      log.error(error instanceof Error ? error.message : String(error))
      return
    }
  } else {
    // Get local path
    const localPath = await inputSourcePath()
    if (isCancel(localPath)) {
      log.info('Setup cancelled.')
      return
    }

    const expandedPath = expandTilde(localPath as string)

    if (!fileExists(expandedPath)) {
      log.error(messages.sourceNotFound(expandedPath))
      return
    }

    sourcePath = expandedPath

    // Auto-detect if it's a git repo with a remote
    if (isGitRepo(expandedPath)) {
      const detectedRemote = await getRemoteUrl(expandedPath)
      if (detectedRemote) {
        detectedSourceType = 'git'
        remote = detectedRemote
        log.info(`Detected git repository with remote: ${detectedRemote}`)
      }
    }
  }

  // Select pull frequency
  const pullFrequency = await selectPullFrequency()
  if (isCancel(pullFrequency)) {
    log.info('Setup cancelled.')
    return
  }

  // Windows shell selection
  let shell: WindowsShell | undefined
  if (isWindows()) {
    const detectedShell = detectWindowsShell()
    if (detectedShell) {
      log.info(`Detected shell: ${detectedShell}`)
      shell = detectedShell
    } else {
      const selectedShell = await selectWindowsShell()
      if (isCancel(selectedShell)) {
        log.info('Setup cancelled.')
        return
      }
      shell = selectedShell as WindowsShell
    }
  }

  // Create and save config
  const config = createConfig({
    sourceType: detectedSourceType,
    sourcePath,
    remote,
    autoPull: true,
    pullFrequency: pullFrequency as PullFrequency,
    shell
  })

  await saveConfig(config)

  outro(messages.initSuccess)
}

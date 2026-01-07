import {
  loadConfig,
  loadManifest,
  getAvailableRules,
  pullSourceIfNeeded,
  updateConfigLastPull
} from '../lib/index.js'
import { log, spinner, formatHeader } from '../ui/index.js'
import { messages } from '../ui/messages.js'
import pc from 'picocolors'

interface ListOptions {
  installed?: boolean
}

export async function list(options: ListOptions = {}): Promise<void> {
  // Load config
  const config = await loadConfig()
  if (!config) {
    log.error(messages.notConfigured)
    process.exit(1)
  }

  // Pull from source if needed
  const s = spinner()
  s.start('Checking source...')
  const pullResult = await pullSourceIfNeeded(config)
  if (pullResult.pulled) {
    await updateConfigLastPull()
  }
  s.stop('')

  if (pullResult.error) {
    log.warn(messages.statusOffline)
  }

  // Get installed rules
  const manifest = await loadManifest()
  const installedRules = manifest ? Object.keys(manifest.rules) : []

  if (options.installed) {
    // Show only installed rules
    if (installedRules.length === 0) {
      log.info('No rules installed.')
      return
    }

    console.log('')
    console.log(formatHeader('Installed Rules'))
    console.log('')

    for (const rule of installedRules.sort()) {
      const entry = manifest!.rules[rule]
      const statusHint = entry.status !== 'synced'
        ? pc.dim(` (${entry.status})`)
        : ''
      console.log(`  ${rule}.md${statusHint}`)
    }
  } else {
    // Show all available rules
    const availableRules = await getAvailableRules(config)

    if (availableRules.length === 0) {
      log.info('No rules found in source.')
      return
    }

    console.log('')
    console.log(formatHeader('Available Rules'))
    console.log('')

    for (const rule of availableRules.sort((a, b) => a.name.localeCompare(b.name))) {
      const installed = installedRules.includes(rule.name)
      const icon = installed ? pc.green('✓') : pc.dim('○')
      const hint = installed ? pc.dim(' (installed)') : ''
      console.log(`  ${icon} ${rule.name}.md${hint}`)
    }

    console.log('')
    console.log(pc.dim(`Source: ${config.source.path}`))
  }

  console.log('')
}

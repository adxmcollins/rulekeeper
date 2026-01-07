import {
  loadConfig,
  loadManifest,
  updateRuleInManifest
} from '../lib/index.js'
import { log } from '../ui/index.js'
import { messages } from '../ui/messages.js'

export async function detach(ruleName: string): Promise<void> {
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

  if (entry.status === 'detached') {
    log.warn(messages.detachAlready(ruleName))
    return
  }

  await updateRuleInManifest(ruleName, {
    status: 'detached',
    detachedAt: new Date().toISOString()
  })

  log.success(messages.detachSuccess(ruleName))
}

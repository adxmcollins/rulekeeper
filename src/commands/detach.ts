import {
  loadConfig,
  loadManifest,
  updateRuleInManifest,
  findRuleMatch
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

  // Case-insensitive lookup
  const match = findRuleMatch(ruleName, Object.keys(manifest.rules))
  if (!match) {
    log.error(`Rule '${ruleName}' not found in manifest.`)
    process.exit(1)
  }

  const entry = manifest.rules[match]
  if (entry.status === 'detached') {
    log.warn(messages.detachAlready(match))
    return
  }

  await updateRuleInManifest(match, {
    status: 'detached',
    detachedAt: new Date().toISOString()
  })

  log.success(messages.detachSuccess(match))
}

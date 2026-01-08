import pc from 'picocolors'
import { formatCommand, formatPath } from './format.js'

export const messages = {
  // General
  notConfigured: `RuleKeeper is not configured. Run ${formatCommand('rk init')} first.`,
  noManifest: `No RuleKeeper manifest found. Run ${formatCommand('rk add')} first.`,
  noClaudeDir: `No .claude/rules/ directory found. Are you in a project root?`,

  // Init
  initWelcome: 'Welcome to RuleKeeper!',
  initSuccess: 'RuleKeeper is now configured.',
  initAlreadyExists: 'RuleKeeper is already configured. Use --force to reconfigure.',

  // Source
  sourceNotFound: (path: string) => `Source path does not exist: ${formatPath(path)}`,
  sourceInvalid: 'Invalid source path or URL.',
  sourceUpdated: (path: string) => `Source updated to: ${formatPath(path)}`,

  // Add
  addSuccess: (count: number) => `Added ${count} rule${count !== 1 ? 's' : ''}.`,
  addConflict: (files: string[]) =>
    `The following files already exist in .claude/rules/:\n${files.map(f => `  - ${f}`).join('\n')}`,
  addNoRules: 'No rules specified. Use --all to add all available rules.',
  ruleNotFound: (name: string) => `Rule '${name}' not found in source.`,

  // Remove
  removeSuccess: (count: number) => `Removed ${count} rule${count !== 1 ? 's' : ''}.`,
  removeNotInstalled: (name: string) => `Rule '${name}' is not installed.`,

  // Status
  statusAllSynced: 'All rules are synced.',
  statusNeedsAttention: (count: number) =>
    `${count} rule${count !== 1 ? 's' : ''} need${count === 1 ? 's' : ''} attention. Run ${formatCommand('rk pull')} to update.`,
  statusOffline: pc.dim('⚠ Could not check for updates (offline?)'),

  // Pull
  pullSuccess: (count: number) => `${count} rule${count !== 1 ? 's' : ''} updated.`,
  pullSkipped: (count: number) => `${count} rule${count !== 1 ? 's' : ''} skipped.`,
  pullDetached: (count: number) => `${count} rule${count !== 1 ? 's' : ''} detached.`,
  pullUpToDate: 'All rules are up to date.',
  pullDiverged: (name: string) => `${name}.md has local changes`,
  pullDivergedAndOutdated: (name: string) => `${name}.md has local changes AND source has been updated`,

  // Detach/Attach
  detachSuccess: (name: string) => `Rule '${name}' is now detached.`,
  detachAlready: (name: string) => `Rule '${name}' is already detached.`,
  attachSuccess: (name: string) => `Rule '${name}' is now attached.`,
  attachAlready: (name: string) => `Rule '${name}' is already attached.`,

  // Diff
  diffNoDifference: (name: string) => `No difference found for '${name}'.`,
  diffNoRules: 'No diverged rules to show.',

  // Doctor
  doctorAllGood: 'All checks passed.',
  doctorIssuesFound: (count: number) => `${count} issue${count !== 1 ? 's' : ''} found.`,

  // Errors
  errorGeneric: (err: string) => `Error: ${err}`,
  errorMissingSource: (name: string) => `Source file for '${name}' no longer exists.`,
  errorMissingLocal: (name: string) => `Local file for '${name}' is missing.`
}

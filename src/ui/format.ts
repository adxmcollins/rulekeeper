import pc from 'picocolors'
import type { RuleStatus } from '../types/index.js'

export function formatRuleStatus(status: RuleStatus): string {
  switch (status) {
    case 'synced':
      return pc.green('✓')
    case 'outdated':
      return pc.yellow('↓')
    case 'diverged':
      return pc.red('⚠')
    case 'detached':
      return pc.dim('○')
    default:
      return pc.dim('?')
  }
}

export function formatRuleStatusText(status: RuleStatus): string {
  switch (status) {
    case 'synced':
      return pc.green('synced')
    case 'outdated':
      return pc.yellow('outdated')
    case 'diverged':
      return pc.red('diverged')
    case 'detached':
      return pc.dim('detached')
    default:
      return pc.dim('unknown')
  }
}

export function formatRuleLine(name: string, status: RuleStatus, details?: string): string {
  const icon = formatRuleStatus(status)
  const statusText = formatRuleStatusText(status)
  const detailsPart = details ? pc.dim(` (${details})`) : ''

  return `  ${icon} ${name.padEnd(20)} ${statusText}${detailsPart}`
}

export function formatError(message: string): string {
  return pc.red(`✗ ${message}`)
}

export function formatSuccess(message: string): string {
  return pc.green(`✓ ${message}`)
}

export function formatWarning(message: string): string {
  return pc.yellow(`⚠ ${message}`)
}

export function formatInfo(message: string): string {
  return pc.blue(`ℹ ${message}`)
}

export function formatDim(message: string): string {
  return pc.dim(message)
}

export function formatPath(path: string): string {
  return pc.cyan(path)
}

export function formatCommand(command: string): string {
  return pc.cyan(`\`${command}\``)
}

export function formatHeader(text: string): string {
  return pc.bold(text)
}

export function formatDiffAdd(line: string): string {
  return pc.green(`+ ${line}`)
}

export function formatDiffRemove(line: string): string {
  return pc.red(`- ${line}`)
}

export function formatDiffContext(line: string): string {
  return pc.dim(`  ${line}`)
}

export function formatDiffHeader(line: string): string {
  return pc.cyan(line)
}

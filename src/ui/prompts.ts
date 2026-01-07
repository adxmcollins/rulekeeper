import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { SourceType, PullFrequency, WindowsShell } from '../types/index.js'

export type DivergenceAction = 'overwrite' | 'detach' | 'skip' | 'cancel' | 'view-diff'
export type MissingSourceAction = 'keep' | 'remove'
export type MissingLocalAction = 'restore' | 'remove'
export type AttachAction = 'overwrite' | 'keep' | 'cancel'

export function isCancel(value: unknown): boolean {
  return p.isCancel(value)
}

export async function confirmOverwrite(files: string[]): Promise<boolean> {
  const result = await p.confirm({
    message: `${files.length} file${files.length !== 1 ? 's' : ''} will be overwritten. Continue?`
  })

  return result === true
}

export async function selectSourceType(): Promise<SourceType | symbol> {
  return await p.select({
    message: 'Where are your Claude rules stored?',
    options: [
      { value: 'local', label: 'Local folder', hint: 'e.g., ~/Documents/claude-rules' },
      { value: 'git', label: 'Git repository', hint: 'Will be cloned locally' }
    ]
  }) as SourceType | symbol
}

export async function inputSourcePath(): Promise<string | symbol> {
  return await p.text({
    message: 'Enter the path to your rules folder:',
    placeholder: '~/Documents/claude-rules',
    validate: (value) => {
      if (!value) return 'Path is required'
      return undefined
    }
  })
}

export async function inputGitUrl(): Promise<string | symbol> {
  return await p.text({
    message: 'Enter the Git repository URL:',
    placeholder: 'git@github.com:username/claude-rules.git',
    validate: (value) => {
      if (!value) return 'URL is required'
      return undefined
    }
  })
}

export async function inputClonePath(): Promise<string | symbol> {
  return await p.text({
    message: 'Where should the repository be cloned?',
    placeholder: '~/Documents/claude-rules',
    validate: (value) => {
      if (!value) return 'Path is required'
      return undefined
    }
  })
}

export async function selectPullFrequency(): Promise<PullFrequency | symbol> {
  return await p.select({
    message: 'How often should RuleKeeper check for updates?',
    options: [
      { value: 'daily', label: 'Daily', hint: 'Recommended' },
      { value: 'always', label: 'Always', hint: 'Every command' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'never', label: 'Never', hint: 'Manual only' }
    ]
  }) as PullFrequency | symbol
}

export async function selectWindowsShell(): Promise<WindowsShell | symbol> {
  return await p.select({
    message: 'Which shell environment are you using?',
    options: [
      { value: 'standard', label: 'Standard (CMD/PowerShell)' },
      { value: 'gitbash', label: 'Git Bash' },
      { value: 'wsl', label: 'WSL (Windows Subsystem for Linux)' }
    ]
  }) as WindowsShell | symbol
}

export async function selectRulesToAdd(available: string[], installed: string[]): Promise<string[] | symbol> {
  const options = available.map(rule => ({
    value: rule,
    label: rule,
    hint: installed.includes(rule) ? 'already installed' : undefined
  }))

  return await p.multiselect({
    message: 'Select rules to add:',
    options,
    required: true
  }) as string[] | symbol
}

export async function handleDivergedRule(
  ruleName: string,
  sourceAlsoChanged: boolean,
  isSingleRule: boolean
): Promise<DivergenceAction | symbol> {
  const message = sourceAlsoChanged
    ? `${ruleName}.md has local changes AND source has been updated`
    : `${ruleName}.md has local changes`

  p.log.warn(message)

  const options: { value: DivergenceAction; label: string; hint: string }[] = [
    {
      value: 'overwrite',
      label: 'Overwrite',
      hint: 'Replace with source version (local changes will be lost)'
    },
    {
      value: 'detach',
      label: 'Detach',
      hint: 'Keep local version, stop tracking this rule'
    }
  ]

  if (sourceAlsoChanged) {
    options.push({
      value: 'view-diff',
      label: 'View diff',
      hint: 'See differences before deciding'
    })
  }

  options.push(
    isSingleRule
      ? { value: 'cancel', label: 'Cancel', hint: 'Abort this operation' }
      : { value: 'skip', label: 'Skip', hint: 'Do nothing for now' }
  )

  const action = await p.select({
    message: 'What would you like to do?',
    options
  })

  if (p.isCancel(action)) {
    return isSingleRule ? 'cancel' : 'skip'
  }

  return action as DivergenceAction
}

export async function handleMissingSource(ruleName: string): Promise<MissingSourceAction | symbol> {
  p.log.warn(`${ruleName}.md - source file no longer exists`)

  return await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'keep', label: 'Keep local', hint: 'Detach and keep the local file' },
      { value: 'remove', label: 'Remove', hint: 'Delete from project and manifest' }
    ]
  }) as MissingSourceAction | symbol
}

export async function handleMissingLocal(ruleName: string): Promise<MissingLocalAction | symbol> {
  p.log.warn(`${ruleName}.md - local file missing`)

  return await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'restore', label: 'Restore', hint: 'Copy from source' },
      { value: 'remove', label: 'Remove', hint: 'Remove from manifest' }
    ]
  }) as MissingLocalAction | symbol
}

export async function handleAttachDiffers(ruleName: string): Promise<AttachAction | symbol> {
  p.log.warn(`${ruleName}.md differs from source version`)

  return await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'overwrite', label: 'Overwrite local', hint: 'Replace with source version' },
      { value: 'keep', label: 'Keep local', hint: 'Attach but keep local version (will show as diverged)' },
      { value: 'cancel', label: 'Cancel', hint: 'Keep detached' }
    ]
  }) as AttachAction | symbol
}

export function spinner() {
  return p.spinner()
}

export function intro(message: string) {
  p.intro(pc.bgCyan(pc.black(` ${message} `)))
}

export function outro(message: string) {
  p.outro(message)
}

export const log = p.log

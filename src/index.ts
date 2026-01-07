import { Command } from 'commander'
import {
  init,
  add,
  remove,
  status,
  pull,
  diff,
  list,
  detach,
  attach,
  sourceShow,
  sourceSet,
  sourcePull,
  doctor
} from './commands/index.js'

const program = new Command()

program
  .name('rulekeeper')
  .description('Sync and manage Claude Code rules across projects')
  .version('0.1.0')

program
  .command('init')
  .description('Interactive global setup')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    await init({ force: options.force })
  })

program
  .command('add [rules...]')
  .description('Add rules to current project')
  .option('-a, --all', 'Add all available rules')
  .action(async (rules, options) => {
    await add(rules, { all: options.all })
  })

program
  .command('remove <rules...>')
  .description('Remove rules from project')
  .option('-k, --keep-file', 'Keep the local file, only remove from manifest')
  .action(async (rules, options) => {
    await remove(rules, { keepFile: options.keepFile })
  })

program
  .command('status')
  .description('Show rule states in current project')
  .action(async () => {
    await status()
  })

program
  .command('pull [rules...]')
  .description('Update rules from source')
  .option('-f, --force', 'Overwrite diverged rules without prompting')
  .option('--include-detached', 'Include detached rules')
  .action(async (rules, options) => {
    await pull(rules, {
      force: options.force,
      includeDetached: options.includeDetached
    })
  })

program
  .command('diff [rule]')
  .description('Show differences between local and source')
  .option('-a, --all', 'Show diff for all diverged rules')
  .action(async (rule, options) => {
    const rules = rule ? [rule] : []
    await diff(rules, { all: options.all })
  })

program
  .command('list')
  .description('List available rules')
  .option('-i, --installed', 'Show only installed rules')
  .action(async (options) => {
    await list({ installed: options.installed })
  })

program
  .command('detach <rule>')
  .description('Mark rule as intentionally diverged')
  .action(async (rule) => {
    await detach(rule)
  })

program
  .command('attach <rule>')
  .description('Resume tracking a detached rule')
  .action(async (rule) => {
    await attach(rule)
  })

// Source subcommands
const sourceCmd = program
  .command('source')
  .description('Manage source configuration')

sourceCmd
  .command('show')
  .description('Show current source configuration')
  .action(async () => {
    await sourceShow()
  })

sourceCmd
  .command('set <path-or-url>')
  .description('Change source location')
  .action(async (pathOrUrl) => {
    await sourceSet(pathOrUrl)
  })

sourceCmd
  .command('pull')
  .description('Manually pull from git remote')
  .action(async () => {
    await sourcePull()
  })

program
  .command('doctor')
  .description('Diagnose setup issues')
  .action(async () => {
    await doctor()
  })

program.parse()

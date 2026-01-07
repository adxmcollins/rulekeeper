# RuleKeeper

Sync and manage Claude Code rules across projects.

RuleKeeper is a cross-platform CLI tool that syncs and manages Claude Code rules (`.claude/` directory files) across multiple projects. It solves the problem of maintaining consistent AI coding rules across projects while supporting intentional per-project variations.

## Installation

```bash
npm install -g rulekeeper
```

## Quick Start

```bash
# Configure your rules source
rk init

# Add rules to a project
cd my-project
rk add laravel tailwind

# Check status
rk status

# Update rules
rk pull
```

## How It Works

RuleKeeper treats your Claude Code rules like dependencies:

1. **Source of Truth** - Store your rules in a local folder or git repository
2. **Distribute** - Add rules to any project with a single command
3. **Track Changes** - Know when local rules diverge from your source
4. **Update** - Pull updates from your source when ready

## Commands

| Command | Description |
|---------|-------------|
| `rk init` | Interactive global setup |
| `rk add [rules...] [--all]` | Add rules to current project |
| `rk remove <rules...> [--keep-file]` | Remove rules from project |
| `rk status` | Show rule states in current project |
| `rk pull [rules...] [--force]` | Update rules from source |
| `rk diff [rule] [--all]` | Show differences |
| `rk list [--installed]` | List available/installed rules |
| `rk detach <rule>` | Mark rule as intentionally diverged |
| `rk attach <rule>` | Resume tracking a rule |
| `rk source show` | Show current source config |
| `rk source set <path-or-url>` | Change source location |
| `rk source pull` | Manually pull from git remote |
| `rk doctor` | Diagnose setup issues |

## Rule States

- **Synced** - Local file matches source exactly
- **Outdated** - Source has been updated since last pull
- **Diverged** - Local file has been modified
- **Detached** - Intentionally diverged, no longer tracked

## When to Use RuleKeeper

RuleKeeper complements Claude Code's native memory features. Use it when:

- **Multiple projects, same rules** - Manage once, distribute everywhere
- **Multiple machines** - Source of truth in a git repo syncs across machines
- **Small teams** - Share standards without enterprise infrastructure
- **Claude Code web** - Rules must be real files (symlinks don't work)
- **Divergence tracking** - Know when local rules have drifted
- **Intentional variations** - Track that a project has deliberately different rules

## Configuration

### Global Config

Located at `~/.config/rulekeeper/config.yaml`:

```yaml
version: 1
source:
  type: local  # or 'git'
  path: /Users/you/Documents/claude-rules
  remote: git@github.com:you/claude-rules.git  # optional

settings:
  autoPull: true
  pullFrequency: daily  # always | daily | weekly | never
```

### Project Manifest

Located at `.rulekeeper/manifest.yaml` in each project:

```yaml
version: 1
rules:
  laravel:
    file: laravel.md
    status: synced
    sourceHash: sha256:abc123...
    localHash: sha256:abc123...
```

## Example Workflow

```bash
# Set up your rules source (first time only)
rk init

# In a new project
cd my-new-project
rk add laravel react  # Add specific rules
# or
rk add --all          # Add all available rules

# Check what needs updating
rk status

# Pull updates from source
rk pull

# See what changed locally
rk diff laravel

# Mark a rule as intentionally different
rk detach laravel

# Resume tracking
rk attach laravel
```

## License

MIT

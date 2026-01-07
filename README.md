# RuleKeeper

A cross-platform CLI tool for syncing and managing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) rules across multiple projects.

> **Note:** Claude Code has [built-in memory features](https://code.claude.com/docs/en/memory) that may meet your needs. RuleKeeper is a community tool for specific use cases like multi-project syncing and divergence tracking that aren't covered by the official solutions.

## Overview

RuleKeeper helps teams and multi-project users maintain consistent Claude Code configurations by:

- Syncing `.claude/` directory files from a central source (local folder or git repository)
- Tracking rule states: synced, outdated, diverged, or detached
- Supporting selective rule installation per project
- Handling conflicts when local changes exist

## Installation

```bash
npm install -g rulekeeper
```

This installs both `rulekeeper` and the shorter `rk` alias.

**Requirements:** Node.js 18.0.0 or higher

## Quick Start

```bash
# 1. Initialize RuleKeeper with your rules source
rk init

# 2. Navigate to a project and add rules
cd my-project
rk add              # Interactive selection
rk add -a           # Add all available rules
rk add coding-style # Add specific rule by name

# 3. Check status and keep rules updated
rk status
rk pull
```

## Configuration

### Global Configuration

RuleKeeper stores its global configuration in a platform-specific location:

| Platform | Location |
|----------|----------|
| macOS    | `~/Library/Preferences/rulekeeper/config.yaml` |
| Linux    | `~/.config/rulekeeper/config.yaml` |
| Windows  | `%APPDATA%\rulekeeper\Config\config.yaml` |

Example configuration:

```yaml
version: 1
source:
  type: git
  path: /Users/you/Documents/claude-rules
  remote: https://github.com/team/claude-rules.git
settings:
  autoPull: true
  pullFrequency: daily
  lastPull: '2024-01-15T10:30:00.000Z'
```

### Project Configuration

Each project using RuleKeeper has a `.rulekeeper/manifest.yaml` file that tracks:

- Which rules are installed
- Their sync status (source and local hashes)
- Detachment state for intentionally diverged rules

Example manifest:

```yaml
version: 1
rules:
  coding-style:
    file: coding-style.md
    status: synced
    sourceHash: sha256:abc123...
    localHash: sha256:abc123...
  testing:
    file: testing.md
    status: detached
    sourceHash: sha256:def456...
    localHash: sha256:xyz789...
    detachedAt: '2024-01-10T15:00:00.000Z'
```

## Commands

### `rk init`

Interactive setup wizard to configure your rules source.

```bash
rk init           # Start interactive setup
rk init --force   # Overwrite existing configuration
```

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite existing configuration |

**Source Types:**
- **Local folder** - Path to a folder containing `.md` rule files (auto-detects if it's a git repo with remote)
- **Git repository** - Clone a repository containing your rules

---

### `rk add [rules...]`

Add rules to the current project.

```bash
rk add                    # Interactive selection
rk add coding-style       # Add specific rule (case-insensitive)
rk add style testing api  # Add multiple rules
rk add -a                 # Add all available rules
```

**Options:**

| Option | Description |
|--------|-------------|
| `-a, --all` | Add all available rules from source |

**Behavior:**
- Creates `.claude/` directory if it doesn't exist
- Rule names are case-insensitive (`Coding-Style` matches `coding-style.md`)
- Prompts for confirmation if a file already exists with local changes
- Options when conflict detected: overwrite, skip, or detach

---

### `rk remove <rules...>`

Remove rules from the project.

```bash
rk remove coding-style          # Remove rule and delete file
rk remove style testing         # Remove multiple rules
rk remove coding-style -k       # Remove from manifest but keep file
```

**Options:**

| Option | Description |
|--------|-------------|
| `-k, --keep-file` | Keep the local file, only remove from manifest |

---

### `rk status`

Show the sync status of all tracked rules in the current project.

```bash
rk status
```

**Status indicators:**

| Status | Description |
|--------|-------------|
| `synced` | Local file matches source |
| `outdated` | Source has newer version |
| `diverged` | Local changes detected (different from source) |
| `detached` | Intentionally diverged, won't prompt for updates |

---

### `rk pull [rules...]`

Update rules from source.

```bash
rk pull                    # Update all outdated rules
rk pull coding-style       # Update specific rule
rk pull -f                 # Force overwrite diverged rules
rk pull --include-detached # Include detached rules in update
```

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite diverged rules without prompting |
| `--include-detached` | Include detached rules in the update |

---

### `rk diff [rule]`

Show differences between local and source versions.

```bash
rk diff                # Show diff for all diverged rules
rk diff coding-style   # Show diff for specific rule
rk diff -a             # Show diff for all rules (including synced)
```

**Options:**

| Option | Description |
|--------|-------------|
| `-a, --all` | Show diff for all rules, not just diverged ones |

---

### `rk list`

List available rules from your configured source.

```bash
rk list           # List all available rules
rk list -i        # List only installed rules in current project
```

**Options:**

| Option | Description |
|--------|-------------|
| `-i, --installed` | Show only rules installed in current project |

---

### `rk detach <rule>`

Mark a rule as intentionally diverged. Detached rules won't trigger update prompts.

```bash
rk detach coding-style
```

Use this when you've made intentional local customizations that should be preserved.

---

### `rk attach <rule>`

Resume tracking a previously detached rule.

```bash
rk attach coding-style
```

After attaching, the rule will be included in status checks and pull operations.

---

### `rk source`

Manage your rules source configuration.

#### `rk source show`

Display current source configuration.

```bash
rk source show
```

Shows: source type, path, remote URL (if git), auto-pull settings, and last pull time.

#### `rk source set <path-or-url>`

Change the source location.

```bash
rk source set /path/to/rules          # Local folder
rk source set ~/Documents/my-rules    # Supports tilde expansion
rk source set https://github.com/org/rules.git  # Git URL (will clone)
```

#### `rk source pull`

Manually pull latest changes from git remote.

```bash
rk source pull
```

Only works if source is a git repository with a configured remote.

#### `rk source config`

View or update pull settings.

```bash
rk source config                                # View current settings
rk source config --auto-pull on                 # Enable auto-pull
rk source config --auto-pull off                # Disable auto-pull
rk source config --frequency daily              # Set pull frequency
rk source config --auto-pull on --frequency weekly  # Update both
```

**Options:**

| Option | Values | Description |
|--------|--------|-------------|
| `--auto-pull` | `on`, `off`, `true`, `false` | Enable or disable automatic pulling |
| `--frequency` | `always`, `daily`, `weekly` | How often to check for updates |

---

### `rk doctor`

Diagnose setup issues and verify configuration.

```bash
rk doctor
```

**Checks performed:**
- Global configuration exists and is valid
- Source path exists and is accessible
- Git remote is reachable (if applicable)
- Current project has valid manifest (if in a project)

## Rule States

| State | Description | Behavior |
|-------|-------------|----------|
| `synced` | Local file matches source exactly | No action needed |
| `outdated` | Source has been updated, local is behind | `rk pull` will update |
| `diverged` | Local changes exist that differ from source | Prompted to overwrite or detach |
| `detached` | Intentionally diverged, excluded from updates | Ignored by `rk pull` unless `--include-detached` |

## Handling Existing `.claude` Directories

When adding rules to a project that already has a `.claude` directory with existing files:

1. **New rules** - Files that don't exist locally are copied from source
2. **Existing untracked files** - You're prompted to: overwrite, skip, or detach
3. **Existing tracked files** - Updated if unchanged locally, prompted if diverged

This allows you to:
- Adopt RuleKeeper in projects with existing Claude configurations
- Selectively sync some rules while keeping local customizations
- Gradually migrate to centralized rule management

## Cross-Platform Support

RuleKeeper works on:

| Platform | Shells |
|----------|--------|
| macOS | Terminal, iTerm, etc. |
| Linux | Bash, Zsh, etc. |
| Windows | CMD, PowerShell, Git Bash, WSL |

On Windows, RuleKeeper auto-detects your shell environment for optimal path handling.

> **PowerShell Users:** Windows security policy blocks npm global package scripts by default. Run this once to enable:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> This affects all npm global packages, not just RuleKeeper. CMD and Git Bash work without this step.

## Source Repository Structure

Your rules source should contain `.md` files at the root level:

```
rules-repo/
├── coding-style.md
├── testing.md
├── api-guidelines.md
└── security.md
```

Each `.md` file becomes an available rule that can be added to projects.

## Example Workflows

### Team Setup

```bash
# Team lead sets up shared rules repository
mkdir team-rules && cd team-rules
git init
echo "# Coding Standards" > coding-style.md
echo "# Testing Guidelines" > testing.md
git add . && git commit -m "Initial rules"
git remote add origin https://github.com/team/claude-rules.git
git push -u origin main
```

### Developer Setup

```bash
# Developer configures RuleKeeper
rk init
# Select "Git repository" and enter the team's URL

# In each project
cd my-project
rk add -a                    # Add all team rules
rk status                    # Check sync status

# When team rules are updated
rk pull                      # Get latest changes

# For project-specific customizations
rk detach coding-style       # Keep local changes for this rule
```

### Checking and Updating

```bash
# See what's changed
rk status
rk diff

# Update everything
rk pull

# Update specific rule
rk pull testing

# Force update (overwrite local changes)
rk pull -f
```

### Managing Settings

```bash
# View current source and settings
rk source show

# Change source location
rk source set ~/new-rules-location

# Adjust auto-pull behavior
rk source config --auto-pull off
rk source config --frequency weekly

# Manually update source repo
rk source pull
```

## When to Use RuleKeeper

First, check Claude Code's [official memory features](https://code.claude.com/docs/en/memory) - they may be all you need.

RuleKeeper fills gaps not covered by official solutions:

- **Multiple projects, same rules** - Manage once, distribute everywhere
- **Multiple machines** - Source of truth in a git repo syncs across machines
- **Small teams** - Share standards without enterprise infrastructure
- **Claude Code web** - Rules must be real files (symlinks don't work)
- **Divergence tracking** - Know when local rules have drifted
- **Intentional variations** - Track that a project has deliberately different rules

## License

MIT

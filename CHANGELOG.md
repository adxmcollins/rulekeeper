# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-01-08

### Added

- Update notifications via `update-notifier` - users are now notified when a new version is available on npm

## [0.1.2] - 2025-01-07

### Fixed

- Read CLI version from package.json instead of hardcoding it

## [0.1.1] - 2025-01-07

### Added

- Example repository (`adxmcollins/rulekeeper-rules`) for testing RuleKeeper
- Documentation tip in README for trying RuleKeeper with the example repo
- Updated git URL placeholder in init wizard to show the example repository

### Fixed

- Ignore `README.md` files (case-insensitive) when listing available rules from source repositories

## [0.1.0] - 2025-01-07

### Added

- Initial release
- `rk init` - Interactive global setup for configuring source location
- `rk add` - Add rules to current project from source
- `rk remove` - Remove rules from project
- `rk status` - Show rule states (synced, outdated, diverged, detached)
- `rk pull` - Update rules from source with divergence handling
- `rk diff` - Show differences between local and source files
- `rk list` - List available and installed rules
- `rk detach` - Mark rule as intentionally diverged
- `rk attach` - Resume tracking a detached rule
- `rk source show` - Display current source configuration
- `rk source set` - Change source location
- `rk source pull` - Manually pull from git remote
- `rk doctor` - Diagnose setup issues
- Support for local folder and git repository sources
- Automatic git pull based on configurable frequency
- SHA-256 hash-based change detection
- Cross-platform support (macOS, Windows, Linux)

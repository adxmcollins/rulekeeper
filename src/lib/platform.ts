import type { WindowsShell } from '../types/index.js'

export function isWindows(): boolean {
  return process.platform === 'win32'
}

export function isMac(): boolean {
  return process.platform === 'darwin'
}

export function isLinux(): boolean {
  return process.platform === 'linux'
}

export function detectWindowsShell(): WindowsShell | null {
  if (!isWindows()) return null

  // WSL sets specific env vars
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
    return 'wsl'
  }

  // Git Bash sets MSYSTEM
  if (process.env.MSYSTEM) {
    return 'gitbash'
  }

  return 'standard'
}

export function getPlatformName(): string {
  if (isWindows()) return 'Windows'
  if (isMac()) return 'macOS'
  if (isLinux()) return 'Linux'
  return process.platform
}

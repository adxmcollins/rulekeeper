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

export function isWSL(): boolean {
  // WSL runs as Linux, not Windows
  if (process.platform !== 'linux') return false

  // Check for WSL-specific indicators
  return !!(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP)
}

export function detectWindowsShell(): WindowsShell | null {
  // If we're in WSL, platform is linux but we're in a Windows context
  if (isWSL()) {
    return 'wsl'
  }

  if (!isWindows()) return null

  // Git Bash sets MSYSTEM (MINGW64, MINGW32, MSYS, etc.)
  // Check this FIRST as WSLENV can be set even outside WSL
  if (process.env.MSYSTEM) {
    return 'gitbash'
  }

  return 'standard'
}

export function getPlatformName(): string {
  if (isWSL()) return 'WSL'
  if (isWindows()) return 'Windows'
  if (isMac()) return 'macOS'
  if (isLinux()) return 'Linux'
  return process.platform
}

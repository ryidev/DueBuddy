// Icon components with emojis for better reliability

export const Icons = {
  // Classroom icons
  create: '📝',
  join: '🔗',
  members: '👥',

  // Task icons
  tasks: '📋',
  add: '➕',
  delete: '🗑️',
  trash: '🗑️',
  complete: '✅',
  incomplete: '⬜',
  check: '✅',
  xmark: '❌',

  // UI icons
  theme: '🎨',
  settings: '⚙️',
  signOut: '🚪',
  loading: '⏳',
  error: '❌',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',

  // Navigation icons
  back: '←',
  close: '✕',
  menu: '☰',
  bell: '🔔',

  // Time icons
  clock: '⏰',
  deadline: '⏳',
  urgent: '🚨',

  // Auth icons
  email: '✉️',
  key: '🔑',
  login: '🚀',
}

export function getIcon(type: keyof typeof Icons) {
  return Icons[type] || '•'
}

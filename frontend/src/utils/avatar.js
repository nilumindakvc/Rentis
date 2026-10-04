export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const AVATAR_PALETTE = [
  ['#a855f7', '#ec4899'],
  ['#22c55e', '#4ade80'],
  ['#3b82f6', '#60a5fa'],
  ['#f97316', '#fb923c'],
  ['#e11d48', '#fb7185'],
  ['#06b6d4', '#22d3ee'],
  ['#d97706', '#fbbf24'],
  ['#8b5cf6', '#a78bfa'],
]

export function avatarColors(seed) {
  if (!seed) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

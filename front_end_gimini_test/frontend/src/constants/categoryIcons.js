export const CATEGORY_ICONS = {
  Healthcare: '\u{1F3E5}',
  Education: '\u{1F393}',
  Hospitality: '\u{1F3E8}',
  Vehicle: '\u{1F697}',
  Industrial: '\u{1F3ED}',
  Food: '\u{1F37D}\u{FE0F}',
  Retail: '\u{1F3EA}',
  Office: '\u{1F3E2}',
  Living: '\u{1F3E0}',
  Events: '\u{1F389}',
}

export const RENTAL_TERM_LABELS = {
  long_term: 'Long-term (years)',
  medium_term: 'Medium-term (months)',
  short_term: 'Short-term (days)',
}

export function categoryIcon(name) {
  return CATEGORY_ICONS[name] || '\u{1F4CD}'
}

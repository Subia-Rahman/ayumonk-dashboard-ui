// Slug → emoji glyph for the mobile bottom nav. The desktop top nav uses MUI
// icons (resolved via Layout.jsx#iconForSlug), but the mobile BottomNav renders
// inside a span styled with fontSize, so we want a single-character glyph.
// New slugs added to /accessible-menus on the backend default to "📁" until an
// entry is added here.
const EMOJI_BY_SLUG = {
  dashboard: "🏠",
  "hr-dashboard": "📊",
  analytics: "📊",
  "company-data": "🏢",
  "company-details": "🏢",
  "company-users": "👥",
  departments: "🏬",
  questions: "❓",
  themes: "🎨",
  kpis: "🎯",
  challenges: "🏆",
  sessions: "📅",
  "suggestion-master": "🌿",
  "kpi-suggestion-mapping": "🔗",
  roles: "🛡️",
  permissions: "🔑",
  policies: "📜",
  "role-assignments": "👤",
  menus: "📚",
  "cxo-metrics": "📈",
  "my-responses": "📝",
  submissions: "📝",
  profile: "👤",
};

export const emojiForSlug = (slug) => EMOJI_BY_SLUG[slug] || "📁";

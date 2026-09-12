export const colors = {
  // Brand - Exact Lorabiz Signature Pink/Magenta
  primary: "#C82D75", // Iconic Lorabiz Pink
  primaryDark: "#9D1755", // Deep luxury magenta
  primaryLight: "#E54F98", // Vibrant glow pink
  primarySoft: "rgba(200, 45, 117, 0.12)",
  accent: "#8B5CF6", // Electric purple / violet accent

  // Backgrounds - Ultra-clean dark glassmorphism
  background: "#070B14", // Deep rich midnight pitch
  surface: "#0F172A", // Elevated slate surface
  surfaceElevated: "#182238", // Luxury card container
  surfaceBorder: "#1E293B",
  surfaceBorderLight: "rgba(200, 45, 117, 0.25)", // Subtle pink border glow

  // Typography
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#FFFFFF",

  // Status & Feedback
  success: "#10B981",
  successSurface: "#064E3B",
  warning: "#F59E0B",
  warningSurface: "#78350F",
  error: "#EF4444",
  errorSurface: "#7F1D1D",
  info: "#38BDF8",

  // Service Specific Accents
  gold: "#F59E0B", // Slips & Premium
  purple: "#8B5CF6", // CAC Services
  cyan: "#06B6D4", // Utilities & Data
  pink: "#C82D75", // Lorabiz Core
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text },
  bodyMuted: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted },
};

export const colors = {
  // Brand
  primary: "#0284C7", // Sky blue brand
  primaryDark: "#0369A1",
  primaryLight: "#38BDF8",
  accent: "#2563EB",

  // Backgrounds
  background: "#090D16", // Deep midnight navy
  surface: "#111827", // Card container
  surfaceElevated: "#1E293B", // Modal / elevated sheet
  surfaceBorder: "#1E293B",
  surfaceBorderLight: "#334155",

  // Typography
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#090D16",

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
  purple: "#8B5CF6", // CAC LLC
  cyan: "#06B6D4", // Utilities
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

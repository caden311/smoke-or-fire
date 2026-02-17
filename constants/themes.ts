export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundGradientEnd: string;
  surface: string;
  surfaceLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Game colors
  fire: string;
  smoke: string;
  success: string;
  accent: string;

  // Cards
  cardFace: string;
  cardFaceBorder: string;
  cardBack: string;
  cardBackAccent: string;
  cardSuitRed: string;
  cardSuitBlack: string;

  // UI
  buttonPrimary: string;
  buttonSecondary: string;
  overlay: string;
  divider: string;

  // Status bar
  statusBarStyle: "light" | "dark";
}

export const darkTheme: ThemeColors = {
  // Backgrounds
  background: "#0D0D0D",
  backgroundGradientEnd: "#1A1A2E",
  surface: "#1A1A1A",
  surfaceLight: "#2A2A2A",

  // Text
  textPrimary: "#F0F0F0",
  textSecondary: "#AAAAAA",
  textMuted: "#666666",

  // Game colors
  fire: "#E63946",
  smoke: "#888888",
  success: "#2ECC71",
  accent: "#F4C430",

  // Cards
  cardFace: "#FFFEF2",
  cardFaceBorder: "#DDDDDD",
  cardBack: "#1B3A4B",
  cardBackAccent: "#264653",
  cardSuitRed: "#E63946",
  cardSuitBlack: "#1A1A1A",

  // UI
  buttonPrimary: "#E63946",
  buttonSecondary: "#2A2A2A",
  overlay: "rgba(0, 0, 0, 0.7)",
  divider: "#333333",

  // Status bar
  statusBarStyle: "light",
};

export const lightTheme: ThemeColors = {
  // Backgrounds
  background: "#F8F5F0",
  backgroundGradientEnd: "#EDE8E0",
  surface: "#FFFFFF",
  surfaceLight: "#F0ECE6",

  // Text
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textMuted: "#999999",

  // Game colors
  fire: "#D93240",
  smoke: "#666666",
  success: "#27AE60",
  accent: "#E6B422",

  // Cards
  cardFace: "#FFFFFF",
  cardFaceBorder: "#E0DDD5",
  cardBack: "#2C5364",
  cardBackAccent: "#3A6B7D",
  cardSuitRed: "#D93240",
  cardSuitBlack: "#1A1A1A",

  // UI
  buttonPrimary: "#D93240",
  buttonSecondary: "#E8E4DC",
  overlay: "rgba(0, 0, 0, 0.5)",
  divider: "#E0DDD5",

  // Status bar
  statusBarStyle: "dark",
};

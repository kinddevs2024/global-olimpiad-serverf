import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

// System theme - follows OS preference (dark/light)
const getSystemTheme = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

const SYSTEM_DARK_THEME = {
  name: "system",
  bgPrimary: "#000000",
  bgSecondary: "#0a0a0a",
  bgTertiary: "#141414",
  textPrimary: "#ffffff",
  textSecondary: "#a0a0a0",
  textTertiary: "#666666",
  accent: "#ffffff",
  border: "rgba(255, 255, 255, 0.1)",
  borderHover: "rgba(255, 255, 255, 0.3)",
  glow: "rgba(255, 255, 255, 0.3)",
  glowStrong: "rgba(255, 255, 255, 0.5)",
  success: "#00ff00",
  error: "#ff0000",
  warning: "#ffff00",
};

const SYSTEM_LIGHT_THEME = {
  name: "system",
  bgPrimary: "#ffffff",
  bgSecondary: "#f5f5f5",
  bgTertiary: "#e8e8e8",
  textPrimary: "#000000",
  textSecondary: "#4a4a4a",
  textTertiary: "#888888",
  accent: "#000000",
  border: "rgba(0, 0, 0, 0.1)",
  borderHover: "rgba(0, 0, 0, 0.3)",
  glow: "rgba(0, 0, 0, 0.1)",
  glowStrong: "rgba(0, 0, 0, 0.2)",
  success: "#00aa00",
  error: "#cc0000",
  warning: "#ccaa00",
};

const THEMES = {
  "kid-friendly": {
    name: "kid-friendly",
    bgPrimary: "#FFFFFF",
    bgSecondary: "#F5F9FC",
    bgTertiary: "#E3F2FD",
    textPrimary: "#1565C0",
    textSecondary: "#546E7A",
    textTertiary: "#90CAF9",
    accent: "#4FC3F7",
    border: "rgba(79, 195, 247, 0.2)",
    borderHover: "rgba(79, 195, 247, 0.4)",
    glow: "rgba(79, 195, 247, 0.3)",
    glowStrong: "rgba(79, 195, 247, 0.5)",
    success: "#81C784",
    error: "#EF5350",
    warning: "#FFE082",
  },
};

const DEFAULT_CUSTOM_THEME = {
  name: "custom",
  bgPrimary: "#1a1a2e",
  bgSecondary: "#16213e",
  bgTertiary: "#0f3460",
  textPrimary: "#e94560",
  textSecondary: "#c4c4c4",
  textTertiary: "#8b8b8b",
  accent: "#e94560",
  border: "rgba(233, 69, 96, 0.2)",
  borderHover: "rgba(233, 69, 96, 0.4)",
  glow: "rgba(233, 69, 96, 0.3)",
  glowStrong: "rgba(233, 69, 96, 0.5)",
  success: "#00ff88",
  error: "#ff4444",
  warning: "#ffaa00",
};

const STORAGE_KEYS = {
  theme: "olympiad_theme",
  customTheme: "olympiad_custom_theme",
  itemsPerPage: "olympiad_items_per_page",
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState("kid-friendly");
  const [customTheme, setCustomTheme] = useState(DEFAULT_CUSTOM_THEME);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [systemPreference, setSystemPreference] = useState(getSystemTheme());

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e) => {
        setSystemPreference(e.matches ? "dark" : "light");
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme =
      localStorage.getItem(STORAGE_KEYS.theme) || "kid-friendly";
    const savedCustomTheme = localStorage.getItem(STORAGE_KEYS.customTheme);
    const savedItemsPerPage = localStorage.getItem(STORAGE_KEYS.itemsPerPage);

    // Migrate old dark/light themes to system
    if (savedTheme === "dark" || savedTheme === "light") {
      localStorage.setItem(STORAGE_KEYS.theme, "system");
      setCurrentTheme("system");
    } else {
      setCurrentTheme(savedTheme);
    }

    if (savedCustomTheme) {
      try {
        setCustomTheme(JSON.parse(savedCustomTheme));
      } catch (e) {
        console.error("Error parsing custom theme:", e);
      }
    }

    if (savedItemsPerPage) {
      const parsed = parseInt(savedItemsPerPage, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    let theme;

    if (currentTheme === "custom") {
      theme = customTheme;
    } else if (currentTheme === "system") {
      // Use system preference for system theme
      theme =
        systemPreference === "dark" ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME;
    } else {
      theme = THEMES[currentTheme];
    }

    if (theme) {
      const root = document.documentElement;
      const body = document.body;

      // Set CSS variables
      root.style.setProperty("--bg-primary", theme.bgPrimary);
      root.style.setProperty("--bg-secondary", theme.bgSecondary);
      root.style.setProperty("--bg-tertiary", theme.bgTertiary);
      root.style.setProperty("--text-primary", theme.textPrimary);
      root.style.setProperty("--text-secondary", theme.textSecondary);
      root.style.setProperty("--text-tertiary", theme.textTertiary);
      root.style.setProperty("--accent", theme.accent);
      root.style.setProperty("--border", theme.border);
      root.style.setProperty("--border-hover", theme.borderHover);
      root.style.setProperty("--glow", theme.glow);
      root.style.setProperty("--glow-strong", theme.glowStrong);
      root.style.setProperty("--success", theme.success);
      root.style.setProperty("--error", theme.error);
      root.style.setProperty("--warning", theme.warning);

      // Set data-theme attribute for conditional styling
      if (body) {
        if (currentTheme === "kid-friendly") {
          body.setAttribute("data-theme", "kid-friendly");
        } else {
          body.removeAttribute("data-theme");
        }
      }
    }
  }, [currentTheme, customTheme, systemPreference]);

  const changeTheme = (themeName) => {
    if (THEMES[themeName] || themeName === "custom" || themeName === "system") {
      setCurrentTheme(themeName);
      localStorage.setItem(STORAGE_KEYS.theme, themeName);
    }
  };

  const updateCustomTheme = (themeUpdates) => {
    const updated = { ...customTheme, ...themeUpdates };
    setCustomTheme(updated);
    localStorage.setItem(STORAGE_KEYS.customTheme, JSON.stringify(updated));

    // If custom theme is active, apply changes immediately
    if (currentTheme === "custom") {
      setCurrentTheme("custom"); // Trigger re-render
    }
  };

  const updateItemsPerPage = (count) => {
    const num = parseInt(count, 10);
    if (!isNaN(num) && num > 0) {
      setItemsPerPage(num);
      localStorage.setItem(STORAGE_KEYS.itemsPerPage, num.toString());
    }
  };

  const resetCustomTheme = () => {
    setCustomTheme(DEFAULT_CUSTOM_THEME);
    localStorage.setItem(
      STORAGE_KEYS.customTheme,
      JSON.stringify(DEFAULT_CUSTOM_THEME)
    );
    if (currentTheme === "custom") {
      setCurrentTheme("custom"); // Trigger re-render
    }
  };

  const value = {
    currentTheme,
    customTheme,
    itemsPerPage,
    changeTheme,
    updateCustomTheme,
    updateItemsPerPage,
    resetCustomTheme,
    availableThemes: Object.keys(THEMES).concat("system", "custom"),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

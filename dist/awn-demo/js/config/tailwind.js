// Unified Tailwind Configuration for Awn (عون) harmonized with variables.css
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Official Jordanian Identity mapped to CSS variables
        jordan: {
          crimson: "var(--color-brand, #8a1538)" /* Base Crimson */,
          crimsonHover: "var(--color-brand-hover, #72122e)",
          crimsonLight: "#fdf4f6" /* Very soft tint */,
          emerald: "var(--color-success, #007A3D)" /* Base Green */,
          emeraldHover: "#006331",
          emeraldLight: "#e6f4ed",
          dark: "var(--color-text, #0f172a)" /* Slate 900 for Sidebar/Headers */,
          darker: "#0b1322" /* Deeper Slate */,
          gold: "var(--color-accent, #C5A059)",
        },
        // Semantic Aliases for easy usage
        primary: {
          DEFAULT: "var(--color-brand, #8a1538)",
          hover: "var(--color-brand-hover, #72122e)",
          50: "#fdf4f6",
          100: "#fbe8ec",
        },
        secondary: {
          DEFAULT: "var(--color-accent, #C5A059)",
          hover: "var(--color-brand-hover, #a8843c)",
          50: "#f3ead4",
        },
        background: "var(--color-background, #f5f4f0)" /* Comfortable UI background */,
        surface: "var(--color-surface, #ffffff)",
        border: "var(--color-border, #dfe3e8)",
      },
      fontFamily: {
        cairo: ["var(--font-family-base, 'Cairo')", "sans-serif"],
        amiri: ["Amiri", "serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        soft: "var(--shadow-sm, 0 2px 10px -2px rgba(0, 0, 0, 0.05))",
        premium: "var(--shadow-md, 0 8px 30px rgba(0, 0, 0, 0.04))",
      },
    },
  },
};

// Unified Tailwind Configuration for Awn (عون)
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Official Jordanian Identity
        jordan: {
          crimson: "#8a1538" /* Base Crimson */,
          crimsonHover: "#72122e",
          crimsonLight: "#fdf4f6" /* Very soft tint */,
          emerald: "#007A3D" /* Base Green */,
          emeraldHover: "#006331",
          emeraldLight: "#e6f4ed",
          dark: "#0f172a" /* Slate 900 for Sidebar/Headers */,
          darker: "#0b1322" /* Deeper Slate */,
          gold: "#C5A059",
        },
        // Semantic Aliases for easy usage
        primary: {
          DEFAULT: "#8a1538",
          hover: "#72122e",
          50: "#fdf4f6",
          100: "#fbe8ec",
        },
        secondary: {
          DEFAULT: "#C5A059",
          hover: "#a8843c",
          50: "#f3ead4",
        },
        background: "#f5f4f0" /* Comfortable UI background */,
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        amiri: ["Amiri", "serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(0, 0, 0, 0.05)",
        premium: "0 8px 30px rgba(0, 0, 0, 0.04)",
      },
    },
  },
};

import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BioCoda brand palette: exact tokens from the BioCoda design system.
        ink: "#18301A", // headings, strongest text
        text: "#2C3A2C", // body text
        forest: "#3B7D3C", // primary green (logo, headings)
        moss: "#2F6B30", // interactive green (links, buttons): darkened for WCAG AA text/contrast
        leaf: "#255C27", // darker green for hover
        orchid: "#8E5BB5", // coda accent (logo/decorative)
        risk: "#6D3D9A", // at-risk text: darkened orchid for WCAG AA contrast
        track: "#2F6B30", // on-track text: darkened for WCAG AA contrast
        unknown: "#9C978B", // awaiting EO
        canvas: "#EFF3EC", // lichen background
        panel: "#F6F9F4", // secondary panel
        line: "#DCE5D7", // hairline borders
        line2: "#E8EEE4",
        field: "#E4EBDE",
        muted: "#5E5A50", // bark, secondary text / UI chrome
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

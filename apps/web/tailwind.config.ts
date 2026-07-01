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
        forest: "#3B7D3C", // primary green
        moss: "#3B7D3C", // brand green (links, primary actions, on-track)
        leaf: "#2F6B30", // darker green for hover
        orchid: "#8E5BB5", // coda accent + at-risk
        risk: "#8E5BB5", // at-risk (orchid, per brand doc)
        track: "#3B7D3C", // on-track (brand green)
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

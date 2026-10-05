import type { Template } from "@/lib/types";

export const events = [
  "Innovation Day 2026",
  "Data Engineering Summit",
  "Hackathon 2026",
  "Team Outing",
  "Townhall"
];

export const templates: Template[] = [
  {
    id: "ecolab",
    name: "Corporate Ecolab",
    eyebrow: "ECOLAB  /  DIGITAL CENTER",
    title: "Better together",
    subtitle: "DIGITAL CENTER · BANGALORE",
    footer: "#EDCMoments · Bangalore, India",
    tags: ["Corporate", "Blue & white"],
    color: "#075ca8",
    accent: "#00a3e0",
    background: "#f4f9ff"
  },
  {
    id: "data-engineering",
    name: "Data Engineering",
    eyebrow: "DATA ENGINEERING DAY",
    title: "Build. Transform. Innovate.",
    subtitle: "DATABRICKS · DELTA · SPARK · AZURE",
    footer: "Build. Transform. Innovate.",
    tags: ["Data", "Engineering"],
    color: "#532cc7",
    accent: "#ff7a45",
    background: "#f7f4ff"
  },
  {
    id: "ai-innovation",
    name: "AI & Innovation",
    eyebrow: "AI INNOVATION FEST",
    title: "The future, together",
    subtitle: "MACHINE LEARNING · CLOUD · IDEAS",
    footer: "Innovating Together",
    tags: ["AI", "Innovation"],
    color: "#075b75",
    accent: "#36cdb4",
    background: "#effbfa"
  },
  {
    id: "team-celebration",
    name: "Team Celebration",
    eyebrow: "TEAM CELEBRATION",
    title: "Good times. Great team.",
    subtitle: "ONE TEAM · SO MANY MOMENTS",
    footer: "One Team One Goal",
    tags: ["Celebration", "Team"],
    color: "#a43a72",
    accent: "#ffbb55",
    background: "#fff6fb"
  },
  {
    id: "hackathon",
    name: "Hackathon",
    eyebrow: "EDC HACKATHON",
    title: "Code. Create. Conquer.",
    subtitle: "CODE · API · CLOUD · ROBOTS",
    footer: "Code Create Conquer",
    tags: ["Hackathon", "Create"],
    color: "#2743a4",
    accent: "#52d6a6",
    background: "#f1f5ff"
  }
];

export const stickers = [
  { category: "Technology", label: "AI", glyph: "✳" },
  { category: "Technology", label: "Cloud", glyph: "☁" },
  { category: "Technology", label: "Data", glyph: "▤" },
  { category: "Technology", label: "SQL", glyph: "⌘" },
  { category: "Technology", label: "Analytics", glyph: "▥" },
  { category: "Celebration", label: "Trophy", glyph: "🏆" },
  { category: "Celebration", label: "Confetti", glyph: "🎉" },
  { category: "Celebration", label: "Stars", glyph: "✦" },
  { category: "Celebration", label: "Balloons", glyph: "🎈" },
  { category: "Ecolab", label: "Innovation", glyph: "✺" },
  { category: "Ecolab", label: "People", glyph: "♧" },
  { category: "Ecolab", label: "Sustainability", glyph: "♻" }
];

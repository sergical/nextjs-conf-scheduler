import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { rooms, speakers, talks, tracks } from "./schema";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Seed data - based on Next.js Conf 2025
const seedTracks = [
  {
    id: "ai",
    name: "AI & Agents",
    color: "#8b5cf6",
    description: "Build intelligent applications with AI agents and machine learning",
  },
  {
    id: "perf",
    name: "Performance",
    color: "#ef4444",
    description: "Optimize your applications for speed and efficiency",
  },
  {
    id: "fullstack",
    name: "Full Stack",
    color: "#3b82f6",
    description: "End-to-end application development patterns",
  },
  {
    id: "dx",
    name: "Developer Experience",
    color: "#22c55e",
    description: "Tools and patterns for better developer productivity",
  },
  {
    id: "platform",
    name: "Platform",
    color: "#06b6d4",
    description: "Infrastructure, deployment, and platform features",
  },
];

const seedRooms = [
  { id: "main", name: "Main Stage", capacity: 500 },
  { id: "workshop", name: "Workshop Room", capacity: 100 },
];

const seedSpeakers = [
  {
    id: "aryaman",
    name: "Aryaman Khandelwal",
    bio: "Building the future of coding at Vercel.",
    avatar: "https://avatars.githubusercontent.com/u/58844932?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: null,
  },
  {
    id: "fouad",
    name: "Fouad Matin",
    bio: "Co-founder at OpenAI. Previously Vercel.",
    avatar: "https://avatars.githubusercontent.com/u/1833497?v=4",
    company: "OpenAI",
    role: "Co-founder",
    twitter: "fouadmatin",
  },
  {
    id: "swyx",
    name: "Swyx",
    bio: "Founder of Latent.Space. Writer, speaker, and developer advocate.",
    avatar: "https://avatars.githubusercontent.com/u/6764957?v=4",
    company: "Latent.Space",
    role: "Founder",
    twitter: "swyx",
  },
  {
    id: "aurora",
    name: "Aurora Scharff",
    bio: "Senior consultant specializing in React and Next.js architecture at Crayon.",
    avatar: "https://avatars.githubusercontent.com/u/12576798?v=4",
    company: "Crayon Consulting",
    role: "Senior Consultant",
    twitter: "aurorascharff",
  },
  {
    id: "jude",
    name: "Jude Gao",
    bio: "Software Engineer at Vercel working on AI integrations and the Vercel AI SDK.",
    avatar: "https://avatars.githubusercontent.com/u/13400636?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: "jude_gao",
  },
  {
    id: "simeon",
    name: "Simeon Griggs",
    bio: "Developer Relations at Sanity. Passionate about content operations and the modern web.",
    avatar: "https://avatars.githubusercontent.com/u/9684022?v=4",
    company: "Sanity",
    role: "Developer Relations",
    twitter: "simeonGriggs",
  },
  {
    id: "ankita",
    name: "Ankita Kulkarni",
    bio: "Independent developer and educator. Building modern course platforms with Next.js.",
    avatar: "https://avatars.githubusercontent.com/u/3398322?v=4",
    company: "Independent",
    role: "Developer & Educator",
    twitter: "kulaborat",
  },
  {
    id: "rhys",
    name: "Rhys Sullivan",
    bio: "Software Engineer at Vercel working on state management and backend architecture.",
    avatar: "https://avatars.githubusercontent.com/u/17914795?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: "rhyssull",
  },
  {
    id: "fred",
    name: "Fred Patton",
    bio: "Developer Advocate at Auth0 specializing in AI agents and authentication.",
    avatar: "https://avatars.githubusercontent.com/u/12345678?v=4",
    company: "Auth0",
    role: "Developer Advocate",
    twitter: null,
  },
  {
    id: "ryan",
    name: "Ryan Vogel",
    bio: "Software Engineer at Databricks working on AI integrations.",
    avatar: "https://avatars.githubusercontent.com/u/12345679?v=4",
    company: "Databricks",
    role: "Software Engineer",
    twitter: null,
  },
  {
    id: "bryce",
    name: "Bryce Kalow",
    bio: "Developer Experience at Clerk. Focused on making authentication seamless for developers.",
    avatar: "https://avatars.githubusercontent.com/u/12444803?v=4",
    company: "Clerk",
    role: "Developer Experience",
    twitter: "brycekalow",
  },
  {
    id: "luke",
    name: "Luke Sandberg",
    bio: "Software Engineer at Vercel working on Turbopack. Making JavaScript bundling fast.",
    avatar: "https://avatars.githubusercontent.com/u/437973?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: null,
  },
  {
    id: "francois",
    name: "François Best",
    bio: "Founder of 47ng. Creator of nuqs for type-safe URL state management.",
    avatar: "https://avatars.githubusercontent.com/u/1174092?v=4",
    company: "47ng",
    role: "Founder",
    twitter: "fortysevenfx",
  },
  {
    id: "christopher",
    name: "Christopher Burns",
    bio: "Founder at Consent. Making privacy compliance developer-friendly.",
    avatar: "https://avatars.githubusercontent.com/u/12345680?v=4",
    company: "Consent",
    role: "Founder",
    twitter: null,
  },
  {
    id: "lydia",
    name: "Lydia Hallie",
    bio: "Developer Advocate at Bun. Known for visual explanations of JavaScript concepts.",
    avatar: "https://avatars.githubusercontent.com/u/35983091?v=4",
    company: "Bun",
    role: "Developer Advocate",
    twitter: "lydiahallie",
  },
  {
    id: "tim",
    name: "Tim Neutkens",
    bio: "Lead maintainer of Next.js. Building the future of React frameworks at Vercel.",
    avatar: "https://avatars.githubusercontent.com/u/6324199?v=4",
    company: "Vercel",
    role: "Next.js Lead",
    twitter: "timneutkens",
  },
  {
    id: "rich",
    name: "Rich Harris",
    bio: "Creator of Svelte and Rollup. Working on the future of web frameworks at Vercel.",
    avatar: "https://avatars.githubusercontent.com/u/1162160?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: "Rich_Harris",
  },
  {
    id: "sebastien",
    name: "Sebastien Chopin",
    bio: "Creator of Nuxt.js. Building great developer experiences at Vercel.",
    avatar: "https://avatars.githubusercontent.com/u/904724?v=4",
    company: "Vercel",
    role: "Software Engineer",
    twitter: "Atinux",
  },
  {
    id: "kapehe",
    name: "Kapehe Sevilleja",
    bio: "Developer Advocate at Vercel. Passionate about teaching and developer education.",
    avatar: "https://avatars.githubusercontent.com/u/7886696?v=4",
    company: "Vercel",
    role: "Developer Advocate",
    twitter: "kapaborat",
  },
  {
    id: "goncy",
    name: "Goncy Pozzo",
    bio: "Developer Advocate at Vercel. Teaching Next.js best practices and migrations.",
    avatar: "https://avatars.githubusercontent.com/u/6494462?v=4",
    company: "Vercel",
    role: "Developer Advocate",
    twitter: "gonzypozzo",
  },
  {
    id: "james",
    name: "James Ward",
    bio: "Developer Advocate at AWS. Building full stack applications with cloud services.",
    avatar: "https://avatars.githubusercontent.com/u/65876?v=4",
    company: "AWS",
    role: "Developer Advocate",
    twitter: "_JamesWard",
  },
];

// Conference schedule: October 22, 2025 (single day)
const day1 = new Date("2025-10-22T09:00:00").getTime() / 1000;

const hour = 3600;
const minute = 60;

const seedTalks = [
  // Morning Sessions
  {
    id: "coding-future",
    title: "Coding for the Future",
    description:
      "A panel discussion on how AI is transforming the way we write code. Featuring perspectives from Vercel, OpenAI, FactoryAI, and Latent.Space on the future of software development.",
    speakerId: "swyx",
    trackId: "ai",
    roomId: "main",
    startTime: day1,
    endTime: day1 + 25 * minute,
    level: "intermediate" as const,
    format: "panel" as const,
  },
  {
    id: "composition-caching",
    title: "Composition, Caching, and Architecture in Modern Next.js",
    description:
      "Deep dive into composition patterns, caching strategies, and architectural decisions for building scalable Next.js applications. Learn how to structure your app for maintainability and performance.",
    speakerId: "aurora",
    trackId: "fullstack",
    roomId: "main",
    startTime: day1 + 30 * minute,
    endTime: day1 + hour,
    level: "advanced" as const,
    format: "talk" as const,
  },
  {
    id: "nextjs-ai-agents",
    title: "Next.js for AI Agents",
    description:
      "Learn how to build AI agents with Next.js and the Vercel AI SDK. Cover tool calling, streaming responses, and building production-ready AI applications.",
    speakerId: "jude",
    trackId: "ai",
    roomId: "main",
    startTime: day1 + hour + 5 * minute,
    endTime: day1 + hour + 30 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "clankers-content",
    title: "Clankers and Content Operations",
    description:
      "Explore content operations and how modern headless CMS solutions integrate with Next.js. Build scalable content-driven applications with Sanity.",
    speakerId: "simeon",
    trackId: "fullstack",
    roomId: "main",
    startTime: day1 + hour + 35 * minute,
    endTime: day1 + hour + 55 * minute,
    level: "beginner" as const,
    format: "talk" as const,
  },
  {
    id: "course-platform",
    title: "Build. Scale. Teach: Architecting a Production-Ready Course Platform",
    description:
      "Learn how to architect and scale a modern course platform with Next.js. Covers authentication, payments, video streaming, and content delivery at scale.",
    speakerId: "ankita",
    trackId: "fullstack",
    roomId: "main",
    startTime: day1 + 2 * hour,
    endTime: day1 + 2 * hour + 25 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "reactive-state",
    title: "Reactive State for the Backend",
    description:
      "Explore reactive state management patterns for backend services. Learn how to build real-time, event-driven architectures with Next.js.",
    speakerId: "rhys",
    trackId: "platform",
    roomId: "main",
    startTime: day1 + 2 * hour + 30 * minute,
    endTime: day1 + 2 * hour + 45 * minute,
    level: "advanced" as const,
    format: "talk" as const,
  },
  // Afternoon Sessions
  {
    id: "ambient-agents",
    title: "Ambient Agents on Next.js: Seven Levers for Token Efficiency",
    description:
      "Master token efficiency when building AI agents. Learn seven key strategies to reduce costs and improve performance of your AI-powered Next.js applications.",
    speakerId: "fred",
    trackId: "ai",
    roomId: "main",
    startTime: day1 + 3 * hour,
    endTime: day1 + 3 * hour + 25 * minute,
    level: "advanced" as const,
    format: "talk" as const,
  },
  {
    id: "integrated-ai",
    title: "Fully Integrated AI that Actually Ships",
    description:
      "Learn how to ship AI features that work in production. Cover error handling, fallbacks, monitoring, and integration patterns for reliable AI applications.",
    speakerId: "ryan",
    trackId: "ai",
    roomId: "main",
    startTime: day1 + 3 * hour + 30 * minute,
    endTime: day1 + 3 * hour + 50 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "dx-ai-age",
    title: "Developer Experience in the Age of AI",
    description:
      "How AI is changing developer experience and what it means for tools, authentication, and the future of building applications.",
    speakerId: "bryce",
    trackId: "dx",
    roomId: "main",
    startTime: day1 + 4 * hour,
    endTime: day1 + 4 * hour + 25 * minute,
    level: "beginner" as const,
    format: "talk" as const,
  },
  {
    id: "turbo-yet",
    title: "Are We Turbo Yet?",
    description:
      "The state of Turbopack and the future of JavaScript bundling. Learn about the latest improvements, performance gains, and what's coming next.",
    speakerId: "luke",
    trackId: "perf",
    roomId: "main",
    startTime: day1 + 4 * hour + 30 * minute,
    endTime: day1 + 4 * hour + 55 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "type-safe-url",
    title: "Type-safe URL State in Next.js with nuqs",
    description:
      "Master URL state management with nuqs. Learn how to build type-safe, shareable URL state that works with React Server Components and the App Router.",
    speakerId: "francois",
    trackId: "dx",
    roomId: "main",
    startTime: day1 + 5 * hour,
    endTime: day1 + 5 * hour + 25 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "consent-banner",
    title: "Why Your Consent Banner Should Be in Your Bundle",
    description:
      "Rethink privacy compliance for modern web apps. Learn why consent management belongs in your application bundle and how to implement it properly.",
    speakerId: "christopher",
    trackId: "platform",
    roomId: "main",
    startTime: day1 + 5 * hour + 30 * minute,
    endTime: day1 + 5 * hour + 55 * minute,
    level: "beginner" as const,
    format: "talk" as const,
  },
  {
    id: "bun-speed",
    title: "Next.js at the Speed of Bun",
    description:
      "Explore how Bun can supercharge your Next.js development experience. Faster installs, faster builds, and a better developer experience.",
    speakerId: "lydia",
    trackId: "perf",
    roomId: "main",
    startTime: day1 + 6 * hour,
    endTime: day1 + 6 * hour + 20 * minute,
    level: "intermediate" as const,
    format: "talk" as const,
  },
  {
    id: "open-web",
    title: "The Open Web",
    description:
      "A panel featuring the creators of Next.js, Svelte, and Nuxt discussing the future of the open web, framework collaboration, and web standards.",
    speakerId: "tim",
    trackId: "platform",
    roomId: "main",
    startTime: day1 + 6 * hour + 30 * minute,
    endTime: day1 + 7 * hour + 10 * minute,
    level: "beginner" as const,
    format: "panel" as const,
  },
  {
    id: "closing-keynote",
    title: "Closing Keynote",
    description: "Closing remarks and a look ahead to the future of Next.js and the web platform.",
    speakerId: "kapehe",
    trackId: "platform",
    roomId: "main",
    startTime: day1 + 7 * hour + 15 * minute,
    endTime: day1 + 7 * hour + 20 * minute,
    level: "beginner" as const,
    format: "keynote" as const,
  },
  // Workshops
  {
    id: "aws-ai-workshop",
    title: "Building Full Stack AI Applications with Vercel and AWS",
    description:
      "Hands-on workshop building AI applications that combine Vercel's frontend platform with AWS backend services. Learn integration patterns and best practices.",
    speakerId: "james",
    trackId: "ai",
    roomId: "workshop",
    startTime: day1 + 2 * hour,
    endTime: day1 + 2 * hour + 30 * minute,
    level: "intermediate" as const,
    format: "workshop" as const,
  },
  {
    id: "nextjs16-migration",
    title: "Hands On: How to Migrate to Next.js 16 and 'use cache'",
    description:
      "Step-by-step workshop on migrating your application to Next.js 16. Learn the new caching APIs, 'use cache' directive, and migration strategies.",
    speakerId: "goncy",
    trackId: "fullstack",
    roomId: "workshop",
    startTime: day1 + 4 * hour,
    endTime: day1 + 4 * hour + 40 * minute,
    level: "intermediate" as const,
    format: "workshop" as const,
  },
];

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(talks);
  await db.delete(speakers);
  await db.delete(tracks);
  await db.delete(rooms);

  // Insert tracks
  await db.insert(tracks).values(seedTracks);
  console.log(`Inserted ${seedTracks.length} tracks`);

  // Insert rooms
  await db.insert(rooms).values(seedRooms);
  console.log(`Inserted ${seedRooms.length} rooms`);

  // Insert speakers
  await db.insert(speakers).values(seedSpeakers);
  console.log(`Inserted ${seedSpeakers.length} speakers`);

  // Insert talks
  await db.insert(talks).values(seedTalks);
  console.log(`Inserted ${seedTalks.length} talks`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

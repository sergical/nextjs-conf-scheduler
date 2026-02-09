import { anthropic } from "@ai-sdk/anthropic";
import * as Sentry from "@sentry/nextjs";
import { generateText, streamText } from "ai";
import { checkConflicts, getTalkDetails, getTracks, getUserSchedule, searchTalks } from "./tools";

// Agent definitions with their specialized roles
export const AGENTS = {
  router: {
    name: "router",
    model: anthropic("claude-haiku-4-5-20250929"),
    description: "Routes requests to specialized agents",
  },
  search: {
    name: "search-agent",
    model: anthropic("claude-sonnet-4-5-20250929"),
    description: "Handles talk search, recommendations, and conflict checking",
  },
  info: {
    name: "info-agent",
    model: anthropic("claude-haiku-4-5-20250929"),
    description: "Handles simple info queries like tracks and schedule",
  },
} as const;

type AgentType = "search" | "info";

// Router determines which agent should handle the request
const routerSystemPrompt = `You are a routing agent for a conference schedule assistant.
Analyze the user's message and determine which specialized agent should handle it.

Choose "search" for:
- Searching for talks by topic, speaker, or keywords
- Getting recommendations based on interests
- Finding workshops, keynotes, or specific talk formats
- Checking for schedule conflicts
- Complex queries requiring reasoning about talks

Choose "info" for:
- Listing available tracks
- Viewing the user's current schedule
- Simple factual questions about the conference

Respond with ONLY the agent name: "search" or "info"`;

// Search agent handles complex queries
const searchAgentSystemPrompt = `You are a search specialist for Next.js Conf 2025.
Your job is to find relevant talks and make recommendations.

The conference is on October 22, 2025 in San Francisco. It's a single-day event.

Available tracks:
- AI & Agents (id: ai): Build intelligent applications with AI agents and machine learning
- Performance (id: perf): Optimize your applications for speed and efficiency
- Full Stack (id: fullstack): End-to-end application development patterns
- Developer Experience (id: dx): Tools and patterns for better developer productivity
- Platform (id: platform): Infrastructure, deployment, and platform features

When helping users:
1. Use searchTalks to find relevant sessions
2. Use getTalkDetails for more information on specific talks
3. Use checkConflicts before recommending multiple sessions
4. Explain why you're recommending each talk

Be concise but helpful.`;

// Info agent handles simple queries
const infoAgentSystemPrompt = `You are an info assistant for Next.js Conf 2025.
Your job is to provide quick information about tracks and the user's schedule.

Available tracks:
- AI & Agents (id: ai)
- Performance (id: perf)
- Full Stack (id: fullstack)
- Developer Experience (id: dx)
- Platform (id: platform)

Use the tools to fetch the requested information and present it clearly.`;

// Route the request to the appropriate agent
export async function routeRequest(userMessage: string): Promise<AgentType> {
  return Sentry.startSpan(
    {
      name: "ai.agent.router",
      op: "ai.pipeline",
      attributes: {
        "ai.pipeline.name": "router",
        "ai.model.id": "claude-haiku-4-5-20250929",
      },
    },
    async () => {
      const { text } = await generateText({
        model: AGENTS.router.model,
        system: routerSystemPrompt,
        prompt: userMessage,
      });

      const agent = text.trim().toLowerCase() as AgentType;

      Sentry.setContext("ai.routing", {
        selectedAgent: agent,
        userMessage: userMessage.slice(0, 100),
      });

      return agent === "info" ? "info" : "search";
    },
  );
}

// Get tools for the search agent
function getSearchTools(_userId: string) {
  return {
    searchTalks,
    getTalkDetails,
    checkConflicts,
  };
}

// Get tools for the info agent
function getInfoTools(userId: string) {
  return {
    getTracks,
    getUserSchedule: getUserSchedule(userId),
  };
}

// Execute the search agent
export async function executeSearchAgent(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userId: string,
) {
  return Sentry.startSpan(
    {
      name: "ai.agent.search",
      op: "ai.pipeline",
      attributes: {
        "ai.pipeline.name": "search-agent",
        "ai.model.id": "claude-sonnet-4-5-20250929",
      },
    },
    async () => {
      const result = streamText({
        model: AGENTS.search.model,
        system: searchAgentSystemPrompt,
        messages,
        tools: getSearchTools(userId),
      });

      return result;
    },
  );
}

// Execute the info agent
export async function executeInfoAgent(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userId: string,
) {
  return Sentry.startSpan(
    {
      name: "ai.agent.info",
      op: "ai.pipeline",
      attributes: {
        "ai.pipeline.name": "info-agent",
        "ai.model.id": "claude-haiku-4-5-20250929",
      },
    },
    async () => {
      const result = streamText({
        model: AGENTS.info.model,
        system: infoAgentSystemPrompt,
        messages,
        tools: getInfoTools(userId),
      });

      return result;
    },
  );
}

// Main orchestrator that handles the full pipeline
export async function runAgentPipeline(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userId: string,
) {
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();

  if (!lastUserMessage) {
    throw new Error("No user message found");
  }

  // Route to the appropriate agent
  const targetAgent = await routeRequest(lastUserMessage.content);

  // Execute the selected agent
  if (targetAgent === "info") {
    return executeInfoAgent(messages, userId);
  } else {
    return executeSearchAgent(messages, userId);
  }
}

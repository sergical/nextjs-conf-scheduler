import { createUIMessageStreamResponse } from "ai";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/dal";
import { runAgentPipeline } from "@/lib/ai/agents";

export async function POST(req: Request) {
  const startTime = Date.now();
  const { userId } = await requireAuth();
  const { messages } = await req.json();

  // Wrap the entire pipeline in a Sentry transaction
  return Sentry.startSpan(
    {
      name: "ai.chat.request",
      op: "ai.pipeline",
      attributes: {
        "ai.pipeline.name": "conference-scheduler",
        "user.id": userId,
      },
    },
    async () => {
      // Convert messages to the format expected by the agent pipeline
      const formattedMessages = messages.map(
        (m: {
          role: string;
          content: string | Array<{ type: string; text?: string }>;
        }) => ({
          role: m.role as "user" | "assistant",
          content:
            typeof m.content === "string"
              ? m.content
              : (m.content as Array<{ type: string; text?: string }>)
                  .filter((p) => p.type === "text")
                  .map((p) => p.text || "")
                  .join(""),
        })
      );

      const result = await runAgentPipeline(formattedMessages, userId);

      // Wide event log for AI chat request
      Sentry.logger.info("AI chat request processed", {
        user_id: userId,
        message_count: messages.length,
        pipeline: "conference-scheduler",
        duration_ms: Date.now() - startTime,
      });

      return createUIMessageStreamResponse({
        stream: result.toUIMessageStream(),
      });
    }
  );
}

"use client";

import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EXAMPLE_PROMPTS = [
  "I'm interested in AI and machine learning talks",
  "I'm a beginner, what talks should I attend?",
  "Show me all the workshops available",
  "I want to learn about performance optimization",
  "Help me build a schedule focused on developer experience",
];

export function AIChat() {
  const [inputValue, setInputValue] = useState("");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat" }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue("");
    await sendMessage({ text: message });
  };

  const handleExampleClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      <Card className="min-h-[400px] max-h-[600px] overflow-y-auto">
        <CardContent className="pt-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Start by telling me about your interests, or try one of these examples:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return <span key={i}>{part.text}</span>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <span className="animate-pulse text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Tell me about your interests..."
          className="flex-1 px-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          {isLoading ? "Thinking..." : "Send"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        The AI will search the conference schedule and recommend talks based on your interests.
      </p>
    </div>
  );
}

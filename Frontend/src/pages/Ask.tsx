import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { postData } from "@/lib/api";  // ✅ IMPORTANT: connect to backend

const Ask = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hello! I'm your AI assistant for groundwater data. You can ask me questions about water levels, trends, policies, or analysis. How can I help you today?",
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const newMessages = [...messages, { type: "user", content: query }];
    setMessages(newMessages);
    setQuery("");

    toast({
      title: "Processing...",
      description: "AI is generating a response.",
    });

    try {
      // ⭐ CALL BACKEND /ask API
      const response = await postData("/ask_ai", { query,
      k:5  
       });

      const botReply = response?.answer || "Sorry, I couldn't fetch an answer.";

      setMessages((prev) => [...prev, { type: "bot", content: botReply }]);
    } catch (error) {
      console.error("Ask API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "⚠️ Unable to reach AI backend. Please check if the server is running.",
        },
      ]);

      toast({
        title: "Error",
        description: "Backend not responding.",
        variant: "destructive",
      });
    }
  };

  const suggestedQuestions = [
    "What is the average water level decline rate in Gujarat?",
    "How does monsoon affect groundwater recharge?",
    "Which districts have critical water levels?",
    "What are the key policies under Atal Bhujal scheme?",
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
          Ask AI Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          Get instant answers about groundwater data, trends, and policies from
          our knowledge base.
        </p>
      </div>

      {/* Chat */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.type === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      message.type === "user"
                        ? "bg-gradient-water shadow-water"
                        : "bg-secondary"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-gradient-water text-white shadow-water"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about groundwater data..."
              className="flex-1"
            />
            <Button
              type="submit"
              className="bg-gradient-water shadow-water"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Suggested Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3 whitespace-normal"
                onClick={() => setQuery(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ask;

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, BookOpen, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Curriculum } from "@/pages/Generator";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("curriculum");
    if (stored) {
      setCurriculum(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          message: input,
          planId: curriculum?.planId || null,
          conversationHistory: messages,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Message Failed",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex flex-col">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="flex-1 container mx-auto px-4 pb-4 grid lg:grid-cols-[400px_1fr] gap-4 overflow-hidden">
        {/* Left Panel - Curriculum Summary */}
        <Card className="p-6 shadow-card overflow-y-auto hidden lg:block">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Your Curriculum</h2>
          </div>

          {curriculum ? (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="font-medium">Duration:</span>{" "}
                {curriculum.duration_weeks} weeks
              </div>
              
              <div className="space-y-2">
                {curriculum.modules.slice(0, 5).map((module) => (
                  <div
                    key={module.week}
                    className="p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="font-medium text-primary">
                      Week {module.week}: {module.subject}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {module.title}
                    </div>
                  </div>
                ))}
                {curriculum.modules.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    + {curriculum.modules.length - 5} more weeks
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate("/generator")}
              >
                View Full Curriculum
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No curriculum generated yet.
              </p>
              <Button
                variant="default"
                onClick={() => navigate("/generator")}
              >
                Generate Curriculum
              </Button>
            </div>
          )}
        </Card>

        {/* Right Panel - Chat */}
        <Card className="p-6 shadow-card flex flex-col h-[calc(100vh-180px)]">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Ethical AI Assistant</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Hi! I'm your ethical AI learning assistant. Ask me questions about your studies,
                  and I'll help guide your learning journey.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Remember: I'm here to help you understand, not to provide answers to exams or assignments.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask me about your studies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = input;
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.replace("data: ", "");
            if (content === "[DONE]") continue;

            assistantMessage += content;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = assistantMessage;
              return newMessages;
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://localhost:8000/upload", formData);
      alert("PDF uploaded successfully!");
    } catch (error) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
          AI Document Assistant
        </h1>

        {/* Upload Section */}
        <div className="mb-6 bg-gray-900 p-4 rounded-xl">
          <label className="block text-sm mb-2">Upload PDF Document</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        {/* Chat Window */}
        <div
          ref={chatContainerRef}
          className="h-[60vh] overflow-y-auto bg-gray-900 rounded-2xl p-6 mb-4 space-y-4"
        >
          {messages.length === 0 && (
            <p className="text-gray-500 text-center mt-10">
              Upload a PDF and start chatting...
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600" : "bg-gray-800"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask anything about your document..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500"
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 rounded-xl font-medium"
          >
            {isStreaming ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

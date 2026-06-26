import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Sparkles, UploadCloud, FileText, Trash2, ArrowUp, Zap } from "lucide-react";
import "./App.css";

interface Message {
  role: "user" | "assistant" | "status";
  content: string;
}

const RUNTIME_SESSION_ID = "session_" + Math.random().toString(36).substring(2, 9);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, statusMessage]);

  const sendAnalysis = async () => {
    if (!input.trim() || isStreaming || !uploadedResume) {
      alert("Please upload your resume first!");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentJobDesc = input;
    setInput("");
    setIsStreaming(true);
    setStatusMessage("Analyzing resume vs job description...");

    try {
      const response = await fetch(
        "http://localhost:8000/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_description: currentJobDesc,
            session_id: RUNTIME_SESSION_ID,
          }),
        }
      );

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
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(
        `http://localhost:8000/upload-resume?session_id=${RUNTIME_SESSION_ID}`,
        formData
      );
      setUploadedResume(file.name);
      setMessages([{ role: "assistant", content: "✅ Resume uploaded successfully! Now paste a job description to analyze." }]);
    } catch (error) {
      alert("Resume upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearSession = () => {
    setMessages([]);
    setUploadedResume(null);
    setStatusMessage(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="brand-title">JobAI Coach</div>
            <div className="brand-subtitle">Powered by Gemini</div>
          </div>
        </div>

        <div className="sidebar-content">
          <div>
            <div className="section-title">Your Resume</div>
            
            <div className="upload-zone">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={isUploading}
                className="upload-input"
              />
              
              {isUploading ? (
                <>
                  <div className="spinner"></div>
                  <div className="upload-text">Processing Resume...</div>
                </>
              ) : uploadedResume ? (
                <div className="file-active">
                  <FileText size={18} className="file-icon" />
                  <div className="file-name" title={uploadedResume}>{uploadedResume}</div>
                </div>
              ) : (
                <>
                  <UploadCloud size={24} className="upload-icon" />
                  <div className="upload-text">Upload Your Resume</div>
                  <div className="upload-subtext">PDF only • Max 5MB</div>
                </>
              )}
            </div>
          </div>

          {uploadedResume && (
            <button className="clear-btn" onClick={clearSession}>
              <Trash2 size={16} />
              Clear Session
            </button>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        <header className="chat-header">
          <div className="model-badge">
            <Zap size={14} className="sparkle-icon" />
            AI Career Coach
          </div>
        </header>

        <div className="chat-scroll-area" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-container">
                <Sparkles size={32} />
              </div>
              <div className="empty-title">Ready to Optimize Your Career?</div>
              <div className="empty-desc">
                Upload your resume on the left, then paste any job description here to get detailed analysis, match score, gap suggestions, and more.
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="avatar ai">
                    <Sparkles size={18} />
                  </div>
                )}
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {statusMessage && (
            <div className="message-row assistant">
              <div className="status-badge">
                <div className="pulse-dot"></div>
                {statusMessage}
              </div>
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendAnalysis();
                }
              }}
              placeholder="Paste the job description here..."
              className="chat-input"
              disabled={isStreaming || !uploadedResume}
              rows={2}
            />
            <button 
              className="send-btn" 
              onClick={sendAnalysis}
              disabled={isStreaming || !input.trim() || !uploadedResume}
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
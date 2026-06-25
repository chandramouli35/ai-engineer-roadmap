import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Sparkles, FileText, UploadCloud, Trash2, ArrowUp, Zap, MessageSquare } from "lucide-react";
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
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, statusMessage, isStreaming]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = input;
    setInput("");
    setIsStreaming(true);
    setStatusMessage("Analyzing context...");

    try {
      const response = await fetch(
        "https://ai-document-backend-m5lc.onrender.com/chat/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            message: currentMessage,
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

            if (content.startsWith("[STATUS:")) {
              const statusValue = content.replace("[STATUS: ", "").replace("]", "");
              setStatusMessage(statusValue);
              continue;
            }

            if (content.startsWith("Error occurred:")) {
              assistantMessage = content;
              break;
            }

            setStatusMessage(null);
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
        {
          role: "assistant",
          content: "Connection error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(
        `https://ai-document-backend-m5lc.onrender.com/upload?session_id=${RUNTIME_SESSION_ID}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadedFile(file.name);
    } catch (error) {
      alert("Upload failed. Please ensure the backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      await axios.delete(
        `https://ai-document-backend-m5lc.onrender.com/session?session_id=${RUNTIME_SESSION_ID}`
      );
      setMessages([]);
      setUploadedFile(null);
      setStatusMessage(null);
    } catch (error) {
      alert("Failed to clear session.");
    }
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
            <div className="brand-title">DocuMind Studio</div>
            <div className="brand-subtitle">Google AI Engineer Edition</div>
          </div>
        </div>

        <div className="sidebar-content">
          <div>
            <div className="section-title">Knowledge Base</div>
            
            <div className="upload-zone">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="upload-input"
              />
              
              {isUploading ? (
                <>
                  <div className="spinner"></div>
                  <div className="upload-text">Processing PDF...</div>
                </>
              ) : uploadedFile ? (
                <div style={{ width: '100%', textAlign: 'left', zIndex: 20, position: 'relative' }}>
                   <div className="file-active">
                     <FileText size={18} className="file-icon" />
                     <div className="file-name" title={uploadedFile}>{uploadedFile}</div>
                   </div>
                </div>
              ) : (
                <>
                  <UploadCloud size={24} className="upload-icon" />
                  <div className="upload-text">Upload Source Document</div>
                  <div className="upload-subtext">PDF only (Max 10MB)</div>
                </>
              )}
            </div>
          </div>

          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearChatHistory} style={{ zIndex: 20 }}>
              <Trash2 size={16} />
              Clear Session
            </button>
          )}

          <div style={{ marginTop: 'auto' }}>
             <div className="section-title">System Status</div>
             <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Model</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>gemini-2.5</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Latency</span>
                  <span style={{ fontWeight: 500, color: '#34a853' }}>Optimal</span>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="chat-header">
           <div className="model-badge">
             <Zap size={14} className="sparkle-icon" />
             Gemini Advanced Engine
           </div>
        </header>

        <div className="chat-scroll-area" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-container">
                <MessageSquare size={28} />
              </div>
              <div className="empty-title">How can I help you today?</div>
              <div className="empty-desc">
                Upload a document in the sidebar to provide context, then ask me anything about it. I'll synthesize the information using Google's Gemini models.
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
                  {msg.content ? (
                    msg.content
                  ) : (
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  )}
                </div>
                
                {msg.role === "user" && (
                  <div className="avatar" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', marginLeft: '16px' }}>
                     <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }}></div>
                  </div>
                )}
              </div>
            ))
          )}

          {statusMessage && (
            <div className="message-row assistant">
               <div style={{ width: '36px' }}></div>
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
                  sendMessage();
                }
              }}
              placeholder={uploadedFile ? "Ask anything about the document..." : "Upload a PDF or enter a prompt here..."}
              className="chat-input"
              disabled={isStreaming}
              rows={1}
            />
            <button 
              className="send-btn" 
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            DocuMind AI may display inaccurate info, including about people, so double-check its responses.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

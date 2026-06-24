// // import { useState, useRef, useEffect } from "react";
// // import axios from "axios";

// // interface Message {
// //   role: "user" | "assistant";
// //   content: string;
// // }

// // function App() {
// //   const [messages, setMessages] = useState<Message[]>([]);
// //   const [input, setInput] = useState("");
// //   const [isStreaming, setIsStreaming] = useState(false);
// //   const [isUploading, setIsUploading] = useState(false);
// //   const chatContainerRef = useRef<HTMLDivElement>(null);

// //   // Auto scroll to bottom
// //   useEffect(() => {
// //     chatContainerRef.current?.scrollTo({
// //       top: chatContainerRef.current.scrollHeight,
// //       behavior: "smooth",
// //     });
// //   }, [messages]);

// //   const sendMessage = async () => {
// //     if (!input.trim() || isStreaming) return;

// //     const userMessage: Message = { role: "user", content: input };
// //     setMessages((prev) => [...prev, userMessage]);
// //     const currentMessage = input;
// //     setInput("");
// //     setIsStreaming(true);

// //     try {
// //       const response = await fetch(
// //         "https://ai-document-backend-m5lc.onrender.com/chat/stream",
// //         {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ message: currentMessage }),
// //         },
// //       );

// //       const reader = response.body?.getReader();
// //       if (!reader) return;

// //       let assistantMessage = "";
// //       setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

// //       while (true) {
// //         const { done, value } = await reader.read();
// //         if (done) break;

// //         const text = new TextDecoder().decode(value);
// //         const lines = text.split("\n");

// //         for (const line of lines) {
// //           if (line.startsWith("data: ")) {
// //             const content = line.replace("data: ", "");
// //             if (content === "[DONE]") continue;

// //             assistantMessage += content;
// //             setMessages((prev) => {
// //               const newMessages = [...prev];
// //               newMessages[newMessages.length - 1].content = assistantMessage;
// //               return newMessages;
// //             });
// //           }
// //         }
// //       }
// //     } catch (error) {
// //       console.error(error);
// //       setMessages((prev) => [
// //         ...prev,
// //         { role: "assistant", content: "Sorry, something went wrong." },
// //       ]);
// //     } finally {
// //       setIsStreaming(false);
// //     }
// //   };

// //   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;

// //     setIsUploading(true);
// //     const formData = new FormData();
// //     formData.append("file", file);

// //     try {
// //       await axios.post(
// //         "https://ai-document-backend-m5lc.onrender.com/upload",
// //         formData,
// //       );
// //       alert("PDF uploaded successfully!");
// //     } catch (error) {
// //       alert("Upload failed");
// //     } finally {
// //       setIsUploading(false);
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-950 text-white">
// //       <div className="max-w-4xl mx-auto p-4">
// //         <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">
// //           AI Document Assistant
// //         </h1>

// //         {/* Upload Section */}
// //         <div className="mb-6 bg-gray-900 p-4 rounded-xl">
// //           <label className="block text-sm mb-2">Upload PDF Document</label>
// //           <input
// //             type="file"
// //             accept=".pdf"
// //             onChange={handleFileUpload}
// //             disabled={isUploading}
// //             className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
// //           />
// //         </div>

// //         {/* Chat Window */}
// //         <div
// //           ref={chatContainerRef}
// //           className="h-[60vh] overflow-y-auto bg-gray-900 rounded-2xl p-6 mb-4 space-y-4"
// //         >
// //           {messages.length === 0 && (
// //             <p className="text-gray-500 text-center mt-10">
// //               Upload a PDF and start chatting...
// //             </p>
// //           )}
// //           {messages.map((msg, i) => (
// //             <div
// //               key={i}
// //               className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
// //             >
// //               <div
// //                 className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600" : "bg-gray-800"}`}
// //               >
// //                 {msg.content}
// //               </div>
// //             </div>
// //           ))}
// //         </div>

// //         {/* Input */}
// //         <div className="flex gap-3">
// //           <input
// //             type="text"
// //             value={input}
// //             onChange={(e) => setInput(e.target.value)}
// //             onKeyPress={(e) => e.key === "Enter" && sendMessage()}
// //             placeholder="Ask anything about your document..."
// //             className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500"
// //             disabled={isStreaming}
// //           />
// //           <button
// //             onClick={sendMessage}
// //             disabled={isStreaming || !input.trim()}
// //             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 rounded-xl font-medium"
// //           >
// //             {isStreaming ? "Thinking..." : "Send"}
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default App;
// import { useState, useRef, useEffect } from "react";
// import axios from "axios";

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// function App() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadedFile, setUploadedFile] = useState<string | null>(null);
//   const chatContainerRef = useRef<HTMLDivElement>(null);

//   // Auto scroll to bottom smoothly
//   useEffect(() => {
//     chatContainerRef.current?.scrollTo({
//       top: chatContainerRef.current.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages]);

//   const sendMessage = async () => {
//     if (!input.trim() || isStreaming) return;

//     const userMessage: Message = { role: "user", content: input };
//     setMessages((prev) => [...prev, userMessage]);
//     const currentMessage = input;
//     setInput("");
//     setIsStreaming(true);

//     try {
//       const response = await fetch(
//         "https://ai-document-backend-m5lc.onrender.com/chat/stream",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ message: currentMessage }),
//         },
//       );

//       const reader = response.body?.getReader();
//       if (!reader) return;

//       let assistantMessage = "";
//       setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const text = new TextDecoder().decode(value);
//         const lines = text.split("\n");

//         for (const line of lines) {
//           if (line.startsWith("data: ")) {
//             const content = line.replace("data: ", "");
//             if (content === "[DONE]") continue;

//             assistantMessage += content;
//             setMessages((prev) => {
//               const newMessages = [...prev];
//               newMessages[newMessages.length - 1].content = assistantMessage;
//               return newMessages;
//             });
//           }
//         }
//       }
//     } catch (error) {
//       console.error(error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content:
//             "Something went wrong. Please verify your connection or try again.",
//         },
//       ]);
//     } finally {
//       setIsStreaming(false);
//     }
//   };

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       await axios.post(
//         "https://ai-document-backend-m5lc.onrender.com/upload",
//         formData,
//       );
//       setUploadedFile(file.name);
//     } catch (error) {
//       alert("Upload failed. Make sure your backend service is awake.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col lg:flex-row h-screen w-full bg-[#0d0e12] text-gray-100 font-sans overflow-hidden">
//       {/* LEFT PANEL: Control Sidebar */}
//       <div className="w-full lg:w-[320px] bg-[#14161e] border-b lg:border-b-0 lg:border-r border-[#242731] p-6 flex flex-col justify-between shrink-0">
//         <div>
//           {/* Branded Header */}
//           <div className="flex items-center gap-3 mb-8">
//             <div className="h-9 w-9 bg-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/30">
//               Ω
//             </div>
//             <div>
//               <h2 className="text-lg font-semibold tracking-tight text-white m-0">
//                 DocuMind AI
//               </h2>
//               <p className="text-xs text-gray-500">v1.0 • Enterprise Suite</p>
//             </div>
//           </div>

//           {/* Upload Area styled like premium SaaS */}
//           <div className="space-y-3">
//             <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
//               Source Document
//             </label>

//             <div className="relative group border-2 border-dashed border-[#2e313e] hover:border-purple-500/50 bg-[#1a1c26] rounded-xl p-5 transition-all duration-200 text-center cursor-pointer">
//               <input
//                 type="file"
//                 accept=".pdf"
//                 onChange={handleFileUpload}
//                 disabled={isUploading}
//                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
//               />

//               {isUploading ? (
//                 <div className="space-y-2">
//                   <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
//                   <p className="text-sm text-gray-400">
//                     Ingesting text lines...
//                   </p>
//                 </div>
//               ) : uploadedFile ? (
//                 <div>
//                   <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center mx-auto mb-2 text-sm font-bold">
//                     PDF
//                   </div>
//                   <p className="text-sm font-medium text-gray-200 truncate px-2">
//                     {uploadedFile}
//                   </p>
//                   <p className="text-xs text-purple-400 mt-1 font-medium">
//                     Ready to analyze
//                   </p>
//                 </div>
//               ) : (
//                 <div>
//                   <div className="text-gray-400 text-xl mb-1">+</div>
//                   <p className="text-sm text-gray-300 font-medium">
//                     Drop or Upload PDF
//                   </p>
//                   <p className="text-xs text-gray-500 mt-0.5">Max size 10MB</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* System Status Metrics */}
//         <div className="hidden lg:block pt-6 border-t border-[#242731]">
//           <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
//             <span>LLM Core Engine</span>
//             <span className="text-green-400 flex items-center gap-1">
//               <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />{" "}
//               Connected
//             </span>
//           </div>
//           <div className="bg-[#1a1c26] text-[11px] font-mono p-2.5 rounded-lg border border-[#242731] text-gray-400 truncate">
//             gemini-2.5-flash
//           </div>
//         </div>
//       </div>

//       {/* RIGHT PANEL: The Main Canvas */}
//       <div className="flex-1 flex flex-col h-full bg-[#0d0e12] relative">
//         {/* Dynamic Canvas Header */}
//         <div className="h-16 border-b border-[#242731] px-6 flex items-center justify-between bg-[#0d0e12]/80 backdrop-blur-md z-10">
//           <div className="flex items-center gap-2">
//             <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
//               Workspace
//             </span>
//             <span className="text-gray-600">/</span>
//             <h3 className="text-sm font-medium text-gray-200 m-0">
//               Interactive Analysis Session
//             </h3>
//           </div>
//         </div>

//         {/* Messaging Stream Window */}
//         <div
//           ref={chatContainerRef}
//           className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
//         >
//           {messages.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
//               <div className="h-12 w-12 bg-[#14161e] border border-[#242731] rounded-2xl flex items-center justify-center text-gray-400 shadow-xl">
//                 💬
//               </div>
//               <div>
//                 <h3 className="text-base font-medium text-gray-200 mb-1">
//                   Contextual Chat System
//                 </h3>
//                 <p className="text-sm text-gray-500 leading-relaxed">
//                   Provide an input document file on the left side menu, then use
//                   the terminal field below to trigger queries or summarize
//                   specific metrics.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             messages.map((msg, i) => (
//               <div
//                 key={i}
//                 className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//               >
//                 <div
//                   className={`max-w-[75%] p-4 rounded-xl text-sm leading-relaxed ${
//                     msg.role === "user"
//                       ? "bg-purple-600 text-white font-medium ml-12 rounded-br-none shadow-lg shadow-purple-900/10"
//                       : "bg-[#14161e] text-gray-200 border border-[#242731] mr-12 rounded-bl-none"
//                   }`}
//                 >
//                   {msg.content ? (
//                     <span className="whitespace-pre-wrap">{msg.content}</span>
//                   ) : (
//                     <div className="flex items-center gap-1.5 py-1 px-0.5">
//                       <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
//                       <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
//                       <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" />
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Input Dock Area */}
//         <div className="p-6 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12] to-transparent">
//           <div className="max-w-3xl mx-auto flex gap-3 bg-[#14161e] border border-[#242731] focus-within:border-purple-500/60 rounded-xl p-2 transition-all shadow-2xl">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//               placeholder={
//                 uploadedFile
//                   ? "Ask a question about this document..."
//                   : "Upload a PDF first to begin analyzing..."
//               }
//               className="flex-1 bg-transparent border-0 outline-none px-3 text-sm text-white placeholder-gray-500 disabled:opacity-50"
//               disabled={isStreaming}
//             />
//             <button
//               onClick={sendMessage}
//               disabled={isStreaming || !input.trim()}
//               className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 text-white disabled:text-gray-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-purple-900/20 flex items-center gap-2"
//             >
//               {isStreaming ? "Streaming" : "Execute"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  role: "user" | "assistant" | "status";
  content: string;
}

const RUNTIME_SESSION_ID =
  "session_" + Math.random().toString(36).substring(2, 9);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, statusMessage]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = input;
    setInput("");
    setIsStreaming(true);
    setStatusMessage("Routing semantic vectors...");

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
        },
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
              const statusValue = content
                .replace("[STATUS: ", "")
                .replace("]", "");
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
          content: "Pipeline execution failure. System re-routing blocked.",
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
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setUploadedFile(file.name);
    } catch (error) {
      alert("Ingestion aborted. Verify infrastructure partition status.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      await axios.delete(
        `https://ai-document-backend-m5lc.onrender.com/session?session_id=${RUNTIME_SESSION_ID}`,
      );
      setMessages([]);
      setUploadedFile(null);
      setStatusMessage(null);
    } catch (error) {
      alert("Failed to drop session constraints.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#faf9f6] text-[#2c3e2c] font-sans overflow-hidden antialiased select-none">
      {/* MINIMAL NAVIGATION STRIPE */}
      <nav className="w-16 bg-[#f4f1e6] border-r border-[#e3e8e1] flex flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="h-9 w-9 bg-[#1e301e] rounded-lg flex items-center justify-center text-[#faf9f6] font-mono text-sm font-bold shadow-sm">
            Ω
          </div>
          <div className="h-px w-6 bg-[#e3e8e1]" />
          <div className="h-8 w-8 rounded-md bg-[#fff] border border-[#e3e8e1] flex items-center justify-center text-xs text-[#4a6c4a] shadow-sm cursor-pointer font-bold">
            [{uploadedFile ? "1" : "0"}]
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-[#4a6c4a] animate-pulse" />
        </div>
      </nav>

      {/* DATA CONTROLS INTERFACE PANEL */}
      <aside className="w-72 bg-[#fbfaf5] border-r border-[#e3e8e1] p-5 flex flex-col justify-between h-full shrink-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-[11px] font-bold tracking-widest text-[#7d8f7d] uppercase font-mono">
              Context Pipeline
            </h2>
            <p className="text-xs text-[#5a705a] mt-1 leading-normal">
              Isolate knowledge boundaries per runtime block.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative border border-dashed border-[#cad2c9] hover:border-[#4a6c4a] bg-[#fff]/50 hover:bg-[#fff] rounded-xl p-5 transition-all duration-200 text-center cursor-pointer group shadow-sm">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
              />

              {isUploading ? (
                <div className="py-2 space-y-2">
                  <div className="animate-spin w-4 h-4 border-2 border-[#4a6c4a] border-t-transparent rounded-full mx-auto" />
                  <p className="text-[11px] font-medium text-[#4a6c4a] font-mono">
                    Indexing chunks...
                  </p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-1.5 text-left">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#b86b4f] font-mono">
                    Active Document
                  </div>
                  <p className="text-xs font-semibold text-[#1e301e] truncate">
                    {uploadedFile}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <p className="text-xs text-[#1e301e] font-semibold">
                    Incorporate Knowledge Ingestion
                  </p>
                  <p className="text-[10px] text-[#7d8f7d] font-mono mt-0.5">
                    Automated Pinecone vector sync
                  </p>
                </div>
              )}
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChatHistory}
                className="w-full text-[11px] py-2 px-3 border border-[#e3e8e1] bg-[#fff] hover:bg-[#fffcfb] hover:border-[#f5ded7] text-[#b86b4f] rounded-lg transition-all font-semibold font-mono shadow-sm"
              >
                Clear History Matrix
              </button>
            )}
          </div>
        </div>

        {/* Distributed Diagnostic Ledger metrics */}
        <div className="pt-4 border-t border-[#e3e8e1] space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#7d8f7d]">
            <span>NODE STATUS</span>
            <span className="font-bold text-[#4a6c4a]">PROD_OK</span>
          </div>
          <div className="bg-[#f4f1e6]/40 border border-[#e3e8e1] p-2.5 rounded-lg font-mono text-[10px] text-[#5a705a] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#8fa38f]">Model:</span>
              <span className="text-[#1e301e] font-semibold">gemini-2.5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8fa38f]">Vector:</span>
              <span className="text-[#1e301e] font-semibold">pinecone_db</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CHAT CANVAS ARCHITECTURE LAYER */}
      <main className="flex-1 flex flex-col h-full bg-[#faf9f6]">
        <header className="h-14 border-b border-[#e3e8e1] px-8 flex items-center justify-between bg-[#fff]/30 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[#7d8f7d]">RUNTIME CLUSTER</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#1e301e] font-semibold">SESSION_ACTIVE</span>
          </div>
        </header>

        {/* Clean canvas using modern left-and-right structural layouts */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-16 py-8 space-y-8"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-4">
              <div className="h-10 w-10 bg-[#fff] border border-[#e3e8e1] rounded-xl flex items-center justify-center text-sm shadow-sm text-[#4a6c4a]">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1e301e] tracking-wider uppercase font-mono">
                  Neural Retrieval Terminal
                </h3>
                <p className="text-xs text-[#7d8f7d] leading-relaxed mt-1">
                  System parses document vectors automatically. Contextual query
                  routing switches gracefully to live search fallbacks if
                  document assertions fall short.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-1 py-1 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-[#1e301e] font-semibold border-r-2 border-[#4a6c4a] pr-4 text-right"
                      : "text-[#2c3e2c] border-l border-[#e3e8e1] pl-4 text-left font-normal"
                  }`}
                >
                  {msg.content ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-1 w-1 rounded-full bg-[#b86b4f] animate-ping" />
                      <span className="text-[10px] font-mono tracking-widest text-[#b86b4f] uppercase font-bold">
                        Awaiting Stream Chunk
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Micro status state indicator badge */}
          {statusMessage && (
            <div className="flex justify-start">
              <div className="text-[10px] font-mono font-bold tracking-widest text-[#b86b4f] bg-[#fff] border border-[#f5ded7] py-1 px-2.5 rounded flex items-center gap-2 uppercase shadow-sm">
                <span className="h-1 w-1 rounded-full bg-[#b86b4f] animate-pulse" />
                {statusMessage}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <footer className="p-6 bg-gradient-to-t from-[#faf9f6] via-[#faf9f6] to-transparent">
          <div className="max-w-3xl mx-auto flex items-center bg-[#fff] border border-[#e3e8e1] focus-within:border-[#4a6c4a] rounded-xl p-2 transition-all duration-200 shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                uploadedFile
                  ? "Query document variables..."
                  : "Awaiting document load context optimization..."
              }
              className="flex-1 bg-transparent border-0 outline-none px-3 text-xs md:text-sm font-medium text-[#1e301e] placeholder-[#b2bcae]"
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className="bg-[#1e301e] hover:bg-[#2d442d] disabled:bg-[#f4f1e6] text-[#faf9f6] disabled:text-[#cad2c9] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all duration-150 shrink-0 shadow-sm"
            >
              {isStreaming ? "RUNNING" : "EXECUTE"}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

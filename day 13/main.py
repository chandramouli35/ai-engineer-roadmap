import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import asyncio

load_dotenv()

app = FastAPI(title="AI Agent API", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# ==================== LLM (for now simple, later connect full agent) ====================
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.5,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "AI Streaming API is running ⚡"}

# ==================== Streaming Endpoint ====================
async def stream_response(message: str):
    """Stream AI response word by word"""
    try:
        response = llm.astream([HumanMessage(content=message)])
        
        async for chunk in response:
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.05)  # Control streaming speed
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_response(request.message),
        media_type="text/event-stream"
    )

# Keep your old non-streaming endpoint for comparison
@app.post("/chat")
async def chat_normal(request: ChatRequest):
    response = await llm.ainvoke([HumanMessage(content=request.message)])
    return {"answer": response.content}

print("🚀 FastAPI Streaming Server Started!")
print("Test at: http://localhost:8000/docs")
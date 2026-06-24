import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import asyncio

load_dotenv()

app = FastAPI(title="AI Document Assistant", version="1.0")

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

# ==================== LLM & Tools Setup (Simplified for now) ====================
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.5,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

@app.get("/health")
async def health():
    return {"status": "ok", "message": "AI Document Assistant is running 🚀"}

# Basic Streaming Endpoint (we'll upgrade to full agent later)
async def stream_response(message: str):
    try:
        async for chunk in llm.astream([HumanMessage(content=message)]):
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.03)
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_response(request.message),
        media_type="text/event-stream"
    )

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    # TODO: Later add full Pinecone indexing
    return {
        "filename": file.filename,
        "status": "success",
        "message": "PDF uploaded successfully. Indexing coming in next step."
    }

print("🚀 AI Document Assistant Backend Started!")
print("Visit: http://localhost:8000/docs")
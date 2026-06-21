import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

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

class ChatResponse(BaseModel):
    answer: str
    tools_used: List[str] = []

# ==================== Load Your Agent (Simplified for now) ====================
# You can later import your full multi-tool agent from Day 11
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.5,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "AI Agent API is running 🚀"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await llm.ainvoke([HumanMessage(content=request.message)])
        return ChatResponse(
            answer=response.content,
            tools_used=["llm"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    content = await file.read()
    # TODO: Later add full indexing to Pinecone
    return {
        "filename": file.filename,
        "status": "uploaded",
        "message": "PDF received. Indexing to Pinecone coming soon."
    }

print("🚀 FastAPI AI Agent Server Started!")
print("Go to: http://localhost:8000/docs")
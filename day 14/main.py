# import os
# from dotenv import load_dotenv
# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# from typing import List
# import asyncio

# load_dotenv()

# app = FastAPI(title="AI Document Assistant", version="1.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class ChatRequest(BaseModel):
#     message: str
#     session_id: str = "default"

# # ==================== LLM & Tools Setup (Simplified for now) ====================
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.messages import HumanMessage

# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0.5,
#     google_api_key=os.getenv("GEMINI_API_KEY")
# )

# @app.get("/health")
# async def health():
#     return {"status": "ok", "message": "AI Document Assistant is running 🚀"}

# # Basic Streaming Endpoint (we'll upgrade to full agent later)
# async def stream_response(message: str):
#     try:
#         async for chunk in llm.astream([HumanMessage(content=message)]):
#             if chunk.content:
#                 yield f"data: {chunk.content}\n\n"
#                 await asyncio.sleep(0.03)
#         yield "data: [DONE]\n\n"
#     except Exception as e:
#         yield f"data: Error: {str(e)}\n\n"

# @app.post("/chat/stream")
# async def chat_stream(request: ChatRequest):
#     return StreamingResponse(
#         stream_response(request.message),
#         media_type="text/event-stream"
#     )

# @app.post("/upload")
# async def upload_pdf(file: UploadFile = File(...)):
#     if not file.filename.endswith(".pdf"):
#         raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
#     content = await file.read()
#     # TODO: Later add full Pinecone indexing
#     return {
#         "filename": file.filename,
#         "status": "success",
#         "message": "PDF uploaded successfully. Indexing coming in next step."
#     }

# print("🚀 AI Document Assistant Backend Started!")
# print("Visit: http://localhost:8000/docs")

import os
import io
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from pypdf import PdfReader

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

app = FastAPI(title="AI Document Assistant", version="1.0")

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# Global in-memory store for extracted document text keyed by session_id
# Note: For production with heavy multi-user traffic, replace this with Redis or a DB.
document_store = {}

# Initialize Gemini with automatic retries for handling 503 errors
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY"),
    max_retries=3,  # Automatically handles temporary 503/429 spikes
)

@app.get("/health")
async def health():
    return {"status": "ok", "message": "AI Document Assistant is fully operational 🚀"}

async def stream_response(message: str, session_id: str):
    try:
        # Retrieve context text if a PDF has been uploaded for this session
        context = document_store.get(session_id, "")
        
        messages = []
        if context:
            # Inject document text safely as context instruction
            messages.append(SystemMessage(content=(
                "You are an expert Document Assistant. Analyze the provided document context "
                "carefully and answer the user's question accurately based on it. "
                f"\n\n--- DOCUMENT CONTEXT ---\n{context}\n-------------------------"
            )))
        else:
            messages.append(SystemMessage(content="You are a helpful assistant. No document has been uploaded yet."))
            
        messages.append(HumanMessage(content=message))

        # Stream the chunks back to the client
        async for chunk in llm.astream(messages):
            if chunk.content:
                # Format properly for Server-Sent Events (SSE)
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.01)
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error occurred: {str(e)}\n\n"

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_response(request.message, request.session_id),
        media_type="text/event-stream"
    )

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), session_id: str = "default"):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        
        # Parse PDF in memory without saving to local disk
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="The PDF appears to be empty or contains scannable images with no raw text.")
            
        # Store text context matched against the session ID
        document_store[session_id] = extracted_text
        
        return {
            "filename": file.filename,
            "status": "success",
            "message": "PDF processed and text extracted successfully into system memory."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Render maps dynamic ports to the PORT environment variable.
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
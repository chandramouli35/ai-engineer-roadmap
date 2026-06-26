import os
import io
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from pypdf import PdfReader

# LangChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

app = FastAPI(title="AI Job Application Assistant", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobAnalysisRequest(BaseModel):
    job_description: str
    session_id: str = "default"

# Global store for resume text
resume_store = {}

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY"),
    max_retries=3,
)

@app.get("/health")
async def health():
    return {"status": "ok", "message": "AI Job Assistant is running 🚀"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), session_id: str = "default"):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        resume_store[session_id] = text.strip()
        return {"status": "success", "message": "Resume processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

async def stream_analysis(job_description: str, session_id: str):
    try:
        resume_text = resume_store.get(session_id, "")
        
        if not resume_text:
            yield "data: Please upload your resume first.\n\n"
            yield "data: [DONE]\n\n"
            return

        prompt = f"""
You are an expert career coach and HR consultant.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Provide a detailed analysis with:
1. Match Score (out of 100)
2. Strong Matching Skills
3. Missing / Gap Skills
4. Top 3 Resume Improvement Suggestions
5. Overall Recommendation

Be honest, specific, and actionable.
"""

        async for chunk in llm.astream([HumanMessage(content=prompt)]):
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.02)
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@app.post("/analyze")
async def analyze_job(request: JobAnalysisRequest):
    return StreamingResponse(
        stream_analysis(request.job_description, request.session_id),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
import os
import io
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, validator
from dotenv import load_dotenv
from pypdf import PdfReader

# LangChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

load_dotenv()

app = FastAPI(title="AI Job Application Assistant", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global resume storage
resume_store = {}

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.4,
    google_api_key=os.getenv("GEMINI_API_KEY"),
    max_retries=3,
)

class AnalyzeRequest(BaseModel):
    job_description: str
    session_id: str = "default"

class CoverLetterRequest(BaseModel):
    job_description: str
    company_name: str = "the company"
    session_id: str = "default"

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

# ==================== Cover Letter Streaming ====================
async def stream_cover_letter(job_description: str, company_name: str, session_id: str):
    try:
        resume_text = resume_store.get(session_id, "")
        if not resume_text:
            yield "data: Please upload your resume first.\n\n"
            yield "data: [DONE]\n\n"
            return

        prompt = f"""
You are an expert career coach and professional writer.

Generate a compelling, personalized cover letter based on:

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

COMPANY NAME:
{company_name}

Requirements:
- Professional but conversational tone
- 3-4 paragraphs only
- Strong opening hook mentioning the role
- Connect candidate's real projects to job requirements
- Use actual experience from resume
- Confident closing with call to action
- Sound human, not AI generated

Return ONLY the cover letter text. No explanation, no subject line.
"""

        async for chunk in llm.astream([HumanMessage(content=prompt)]):
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.03)
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@app.post("/cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    return StreamingResponse(
        stream_cover_letter(request.job_description, request.company_name, request.session_id),
        media_type="text/event-stream"
    )

# ==================== Interview Prep ====================
async def stream_interview_prep(job_description: str, session_id: str):
    try:
        resume_text = resume_store.get(session_id, "")
        if not resume_text:
            yield "data: Please upload your resume first.\n\n"
            yield "data: [DONE]\n\n"
            return

        prompt = f"""
You are a senior technical interviewer with 10+ years experience.

Based on this resume and job description, generate interview preparation material.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON with this structure:
{{
  "technical_questions": [{{ "question": "...", "why_asked": "...", "suggested_answer": "..." }}],
  "behavioral_questions": [{{ "question": "...", "framework": "STAR", "suggested_answer": "..." }}],
  "questions_to_ask": ["...", "..."],
  "topics_to_prepare": ["...", "..."],
  "red_flags_to_address": ["...", "..."]
}}

Generate 5 technical and 3 behavioral questions. Be specific to the candidate's experience.
"""

        async for chunk in llm.astream([HumanMessage(content=prompt)]):
            if chunk.content:
                yield f"data: {chunk.content}\n\n"
                await asyncio.sleep(0.03)
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@app.post("/interview-prep")
async def generate_interview_prep(request: AnalyzeRequest):
    return StreamingResponse(
        stream_interview_prep(request.job_description, request.session_id),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
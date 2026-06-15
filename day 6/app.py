import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

# ==================== CONFIG ====================
PDF_FILE = "sample.pdf"   # Make sure this file exists in day 6 folder

# ==================== 1. Load & Split with Better Chunking ====================
print("=== Loading & Splitting Document (Advanced) ===\n")

loader = PyPDFLoader(PDF_FILE)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,       # Experiment: Try 500 vs 1000
    chunk_overlap=150,    # Experiment: Try 50 vs 200
    separators=["\n\n", "\n", ".", " ", ""]
)

chunks = text_splitter.split_documents(docs)

print(f"Split into {len(chunks)} chunks\n")

# ==================== 2. Embeddings & Vector Store with Metadata ====================
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db_day6"
)

print("✅ Vector Store Created with Metadata!\n")

# ==================== 3. MMR Retriever (Diverse Results) ====================
retriever = vectorstore.as_retriever(
    search_type="mmr",                    # Maximal Marginal Relevance
    search_kwargs={"k": 4, "fetch_k": 10} # Get 4 diverse chunks
)

# ==================== 4. RAG Prompt & LLM ====================
prompt_template = """Answer the question based only on the following context.
If you cannot find the answer, say "I don't have enough information."

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(prompt_template)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== 5. Advanced RAG Chain ====================
def format_docs(docs):
    return "\n\n---\n\n".join(f"Source: Page {doc.metadata.get('page', 'N/A')}\n{doc.page_content}" for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print("🚀 Advanced RAG Pipeline Ready (MMR + Better Chunking)\n")
print("Ask questions about your PDF. Type 'exit' to quit.\n")

# ==================== Testing ====================
while True:
    question = input("You: ").strip()
    if question.lower() in ['exit', 'quit', 'bye']:
        print("👋 Day 6 Session 2 Done!")
        break
    if question:
        print("\n🤖 Thinking...\n")
        answer = rag_chain.invoke(question)
        print("Answer:\n", answer)
        print("-" * 90)
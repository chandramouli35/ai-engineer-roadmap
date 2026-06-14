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

# ==================== 1. Load, Split & Store in Vector DB ====================
print("=== Building Vector Store (from PDF) ===\n")

# Make sure you have a PDF named "sample.pdf" in this day 5 folder
loader = PyPDFLoader("sample.pdf")
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = text_splitter.split_documents(docs)

print(f"Loaded {len(docs)} pages → Split into {len(chunks)} chunks\n")

# Embeddings + Vector Store (Chroma)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"   # Saves locally
)

print("✅ Vector Store Created Successfully!\n")

# ==================== 2. Retriever ====================
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})  # Get top 3 relevant chunks

# ==================== 3. RAG Prompt ====================
template = """You are a helpful assistant. Answer the question based only on the following context.
If you don't know the answer, just say "I don't have enough information."

Context:
{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# ==================== 4. LLM ====================
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",   # More stable model
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== 5. Full RAG Chain (LCEL) ====================
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print("🚀 Full RAG Pipeline Ready! Ask questions about your PDF.\n")
print("Type 'exit' to quit.\n")

# ==================== Interactive Testing ====================
while True:
    question = input("You: ").strip()
    if question.lower() in ['exit', 'quit', 'bye']:
        print("👋 Goodbye!")
        break
    if question:
        print("\n🤖 Thinking...\n")
        answer = rag_chain.invoke(question)
        print("Answer:", answer)
        print("-" * 80)
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

# ==================== CONFIG ====================
PDF_FILE = "sample.pdf"

# ==================== 1. Load & Split ====================
print("=== Loading PDF and Splitting ===\n")

loader = PyPDFLoader(PDF_FILE)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
chunks = text_splitter.split_documents(docs)

print(f"Split into {len(chunks)} chunks\n")

# ==================== 2. Embeddings ====================
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== 3. Pinecone Vector Store ====================
print("=== Storing vectors in Pinecone Cloud ===\n")

vectorstore = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name="ai-engineer-day7",   # Must match the index name you created
    namespace="default"              # Optional
)

print("✅ Successfully stored in Pinecone Cloud!\n")

# ==================== 4. Retriever & RAG Chain ====================
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_template(
    """Answer the question based only on the following context.
If you don't know, say "I don't have enough information."

Context:
{context}

Question: {question}
Answer:"""
)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print("🚀 Pinecone RAG Ready! Ask questions.\n")

while True:
    q = input("You: ").strip()
    if q.lower() in ['exit', 'quit']:
        break
    if q:
        print("\n🤖 Thinking...\n")
        answer = rag_chain.invoke(q)
        print("Answer:", answer)
        print("-" * 80)
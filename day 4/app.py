import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

# ==================== Thing 1: Document Loader ====================
print("=== Thing 1: Loading PDF Document ===")

# Put any PDF file in this day 4 folder and rename it to "sample.pdf"
# Or change the path below to your PDF file
loader = PyPDFLoader("sample.pdf")  

docs = loader.load()

print(f"Total pages loaded: {len(docs)}")
print(f"Sample content from first page:\n{docs[0].page_content[:500]}...\n")
print("-" * 80)

# ==================== Thing 2: Text Splitter ====================
print("\n=== Thing 2: Splitting Document into Chunks ===")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # characters per chunk
    chunk_overlap=200,    # overlap between chunks
    separators=["\n\n", "\n", ".", " ", ""]
)

chunks = text_splitter.split_documents(docs)

print(f"Total chunks created: {len(chunks)}")
print(f"\nSample Chunk 1:\n{chunks[0].page_content[:300]}...\n")
print("-" * 80)

# ==================== Thing 3: Embeddings ====================
print("\n=== Thing 3: Creating Embeddings ===")

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# Embed just the first chunk (to avoid quota issues)
sample_embedding = embeddings.embed_query(chunks[0].page_content)

print(f"Embedding created successfully!")
print(f"Vector dimension: {len(sample_embedding)}")
print(f"First 10 numbers of vector: {sample_embedding[:10]}")
print("\n🎉 Session 2 Completed!")

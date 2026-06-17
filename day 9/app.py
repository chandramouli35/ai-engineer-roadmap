import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_message_histories import ChatMessageHistory

load_dotenv()

# ==================== CONFIG ====================
PDF_FILE = "sample.pdf"   # Change if needed

# ==================== 1. Vector Store (Pinecone) ====================
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

vectorstore = PineconeVectorStore(
    index_name="ai-engineer-day7",   # Use your index from Day 7
    embedding=embeddings,
    namespace="default"
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# ==================== 2. Contextualize Question Prompt ====================
contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "Given a chat history and the latest user question, "
               "reformulate the question to be a standalone question that can be understood "
               "without the chat history. If no reformulation is needed, return it as is."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}")
])

# ==================== 3. LLM ====================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== 4. RAG Prompt ====================
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Answer the question based on the following context.\n\n"
               "Context:\n{context}"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}")
])

# ==================== 5. Conversational RAG Chain ====================
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Contextualize chain
contextualize_chain = contextualize_prompt | llm | StrOutputParser()

# Full RAG Chain
def contextualized_question(input_dict):
    if input_dict.get("chat_history"):
        return contextualize_chain.invoke(input_dict)
    else:
        return input_dict["question"]

rag_chain = (
    {
        "context": contextualized_question | retriever | format_docs,
        "question": lambda x: x["question"],
        "chat_history": lambda x: x["chat_history"]
    }
    | rag_prompt
    | llm
    | StrOutputParser()
)

# ==================== Chat History ====================
chat_history = ChatMessageHistory()

print("🚀 Conversational RAG Ready! (With Memory)\n")
print("Ask follow-up questions. Type 'clear' to reset history or 'exit' to quit.\n")

# ==================== Interactive Loop ====================
while True:
    question = input("You: ").strip()
    
    if question.lower() in ['exit', 'quit', 'bye']:
        print("👋 Goodbye!")
        break
        
    if question.lower() == 'clear':
        chat_history.clear()
        print("🧹 Chat history cleared.\n")
        continue
        
    if question:
        print("\n🤖 Thinking...\n")
        
        response = rag_chain.invoke({
            "question": question,
            "chat_history": chat_history.messages
        })
        
        print("Answer:", response)
        print("-" * 90)
        
        # Save to history
        chat_history.add_user_message(question)
        chat_history.add_ai_message(response)
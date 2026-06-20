import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

# ==================== LLM ====================
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.5,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== Tools ====================

# Tool 1: Web Search (Tavily)
web_search = TavilySearchResults(max_results=3)

# Tool 2: Calculator
@tool
def calculator(expression: str) -> str:
    """Useful for doing math calculations."""
    try:
        return str(eval(expression))
    except:
        return "Error in calculation"

# Tool 3: RAG Tool (from your Pinecone)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

vectorstore = PineconeVectorStore(
    index_name="ai-engineer-day7",
    embedding=embeddings,
    namespace="default"
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

@tool
def rag_search(query: str) -> str:
    """Search in the uploaded PDF document for relevant information."""
    docs = retriever.invoke(query)
    return "\n\n".join([doc.page_content for doc in docs])

tools = [web_search, calculator, rag_search]

# Bind tools to LLM
llm_with_tools = llm.bind_tools(tools)

# ==================== State ====================
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# ==================== Nodes ====================
def agent_node(state: AgentState):
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# Simple tool calling node
def tool_node(state: AgentState):
    # This is handled automatically by LangGraph when tools are bound
    pass

# ==================== Build Graph ====================
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)

# Add tools as a separate node (LangGraph will handle routing)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    lambda state: "tools" if state["messages"][-1].tool_calls else END
)
workflow.add_edge("tools", "agent")   # After tool use, go back to agent

agent = workflow.compile()

print("🚀 Multi-Tool Agent Ready! (Web Search + RAG + Calculator)\n")
print("Ask complex questions. Type 'exit' to quit.\n")

# ==================== Test Loop ====================
while True:
    user_input = input("You: ").strip()
    if user_input.lower() in ['exit', 'quit', 'bye']:
        print("👋 Goodbye!")
        break
    if user_input:
        print("\n🤖 Agent thinking...\n")
        result = agent.invoke({"messages": [HumanMessage(content=user_input)]})
        print("Agent:", result["messages"][-1].content)
        print("-" * 90)
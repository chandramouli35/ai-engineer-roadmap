import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()

# ==================== LLM ====================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# ==================== State Definition ====================
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]   # This keeps chat history

# ==================== Node: Call LLM ====================
def call_llm(state: AgentState):
    messages = state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

# ==================== Build the Graph ====================
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("llm", call_llm)

# Add edges
workflow.set_entry_point("llm")
workflow.add_edge("llm", END)

# Compile the graph into an agent
agent = workflow.compile()

print("🚀 Simple LangGraph Agent Ready!\n")
print("Type your messages. Type 'exit' to quit.\n")

# ==================== Interactive Loop ====================
while True:
    user_input = input("You: ").strip()
    
    if user_input.lower() in ['exit', 'quit', 'bye']:
        print("👋 Goodbye!")
        break
        
    if user_input:
        print("\n🤖 Agent is thinking...\n")
        
        # Run the agent
        result = agent.invoke({
            "messages": [HumanMessage(content=user_input)]
        })
        
        # Print the last response
        print("Agent:", result["messages"][-1].content)
        print("-" * 80)
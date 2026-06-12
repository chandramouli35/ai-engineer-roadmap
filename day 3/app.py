import asyncio
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Use stable model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.7,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

async def main():
    print("🚀 Day 3 - LangChain Basics\n")
    
    # Thing 1: Basic LLM Call
    print("=== Thing 1: Basic LLM Call ===")
    response1 = await llm.ainvoke("Explain what is LangChain in one sentence.")
    print("Answer:", response1.content)
    print("-" * 60)

    # Thing 2: Prompt Template
    print("\n=== Thing 2: Prompt Template ===")
    prompt_template = ChatPromptTemplate.from_template(
        "You are a helpful mentor. Explain {topic} to a JavaScript developer transitioning to Python."
    )
    chain2 = prompt_template | llm
    response2 = await chain2.ainvoke({"topic": "Prompt Templates"})
    print("Answer:", response2.content)
    print("-" * 60)

    # Thing 3: LCEL Chain
    print("\n=== Thing 3: Full Chain using LCEL ===")
    prompt = ChatPromptTemplate.from_template(
        """You are an expert AI tutor.
        Explain the concept in simple words and compare it with JavaScript.
        
        Concept: {concept}
        """
    )
    output_parser = StrOutputParser()
    chain = prompt | llm | output_parser
    response3 = await chain.ainvoke({"concept": "Chains in LangChain"})
    print("Answer:", response3)
    print("-" * 60)

    print("\n🎉 Day 3 Session 2 Completed!")

if __name__ == "__main__":
    asyncio.run(main())
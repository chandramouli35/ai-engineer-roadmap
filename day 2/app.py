import asyncio
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# System Prompt - This defines how Gemini should behave
SYSTEM_PROMPT = """
You are an expert AI Engineering mentor.
You specialize in helping JavaScript developers learn Python and AI engineering.
Always explain concepts by comparing them with JavaScript when possible.
Keep answers clear, practical, and encouraging.
"""

async def stream_response(chat_session, user_input: str):
    try:
        print(f"\n🤖 You: {user_input}")
        print("\n🔄 Gemini is thinking...\n")
        
        response = chat_session.send_message(user_input, stream=True)
        
        print("💬 Gemini: ", end="", flush=True)
        full_text = ""
        
        for chunk in response:
            if chunk.text:
                text = chunk.text
                print(text, end="", flush=True)
                full_text += text
                await asyncio.sleep(0.01)
        
        print("\n" + "-"*60)
        return full_text
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None

async def main():
    print("🚀 Day 2 - Gemini with System Prompt + Memory\n")
    print("Commands: 'clear' = reset chat | 'exit' = quit\n")
    
    # Create chat with system prompt and settings
    chat_session = client.chats.create(
        model="gemini-2.0-flash-exp",
        config={
            "temperature": 0.7,           # Change this to 0.0 or 1.0 to test
            "system_instruction": SYSTEM_PROMPT
        }
    )
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("👋 See you on Day 3! Keep going bro.")
            break
            
        if user_input.lower() == 'clear':
            print("🧹 Chat history cleared.\n")
            chat_session = client.chats.create(
                model="gemini-2.0-flash-exp",
                config={"temperature": 0.7, "system_instruction": SYSTEM_PROMPT}
            )
            continue
            
        if user_input:
            await stream_response(chat_session, user_input)

if __name__ == "__main__":
    asyncio.run(main())
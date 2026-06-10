import asyncio
import os
from dotenv import load_dotenv
from google import genai  # New official package

# Load environment variables
load_dotenv()

# Configure the Async Gemini Client using the .aio modifier
# This aligns perfectly with async/await workflows
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")).aio

async def stream_gemini_response(prompt: str):
    try:
        print(f"\n🤖 Prompt: {prompt}")
        print("\n🔄 Gemini is thinking...\n")
        
        # FIX: Changed generate_content(..., stream=True) 
        # TO: generate_content_stream(...) 
        # Added 'await' before the client call because we are using the async (.aio) client
        response = await client.models.generate_content_stream(
            model="gemini-2.0-flash",   # Main stable production flash model
            contents=prompt
        )
        
        print("💬 Response: ", end="", flush=True)
        
        # Iterate asynchronously over the streamed chunks
        async for chunk in response:
            if chunk.text:
                print(chunk.text, end="", flush=True)
        
        print("\n\n✅ Done!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTip: Make sure your API key is correct and you created it recently.")

async def main():
    print("🚀 Gemini AI Chat - Day 1 (Fixed)\n")
    print("Type your message and press Enter. Type 'exit' to quit.\n")
    
    while True:
        # Note: standard input() blocks the async thread, which is fine for a simple local script
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("👋 Goodbye!")
            break
        if user_input.strip():
            await stream_gemini_response(user_input)

if __name__ == "__main__":
    asyncio.run(main())
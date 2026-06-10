import asyncio
from typing import List, Dict

class AIProfessional:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.skills: List[str] = []
        self.projects: List[Dict] = []

    def add_skill(self, skill: str):
        self.skills.append(skill)

    async def simulate_ai_task(self, task_name: str):
        print(f"🤖 Working on: {task_name}")
        await asyncio.sleep(1.5)
        return f"✅ Completed {task_name}"

async def main():
    dev = AIProfessional("Chandra", "AI Engineer")
    dev.add_skill("Python")
    dev.add_skill("LangChain")
    
    tasks = [
        dev.simulate_ai_task("Building RAG system"),
        dev.simulate_ai_task("Fine-tuning LLM")
    ]
    
    results = await asyncio.gather(*tasks)
    print("\nResults:", results)
    print(f"\n{dev.name}'s skills: {dev.skills}")

if __name__ == "__main__":
    asyncio.run(main())
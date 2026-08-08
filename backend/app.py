from dotenv import load_dotenv
from openai import AsyncOpenAI
import json
import os
import inspect
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict

## RUN WITH: uv run app.py

load_dotenv(override=True)

def truncate_field_value(val: str, max_len: int = 1000) -> str:
    """Helper to truncate Discord embed field values to avoid Discord API errors."""
    if not val:
        return "N/A"
    return val[:max_len] + "..." if len(val) > max_len else val

async def send_discord_webhook(webhook_url: str, title: str, description: str, color: int, fields: list = None):
    """Sends a rich formatted embed message to a Discord channel webhook asynchronously."""
    if not webhook_url or "PASTE_YOUR" in webhook_url:
        print(f"Discord webhook URL not configured/placeholder for: {title}", flush=True)
        return
        
    embed = {
        "title": title,
        "description": description,
        "color": color,
    }
    
    if fields:
        embed["fields"] = fields
        
    payload = {
        "embeds": [embed]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload, timeout=5.0)
            if response.status_code >= 400:
                print(f"Discord Webhook returned error {response.status_code}: {response.text}", flush=True)
    except Exception as e:
        print(f"Failed to send Discord alert: {e}", flush=True)

async def record_user_details(email, name="Name not provided", notes="not provided"):
    webhook_url = os.getenv("DISCORD_WEBHOOK_LEADS")
    fields = [
        {"name": "Email", "value": truncate_field_value(email), "inline": True},
        {"name": "Name", "value": truncate_field_value(name), "inline": True},
        {"name": "Notes", "value": truncate_field_value(notes), "inline": False}
    ]
    await send_discord_webhook(
        webhook_url=webhook_url,
        title="📥 New Contact Capture (Lead)",
        description="A user has expressed interest in contacting you.",
        color=3066993, # Green
        fields=fields
    )
    return {"recorded": "ok"}

async def record_unknown_question(question):
    webhook_url = os.getenv("DISCORD_WEBHOOK_UNKNOWN")
    fields = [
        {"name": "Question", "value": truncate_field_value(question), "inline": False}
    ]
    await send_discord_webhook(
        webhook_url=webhook_url,
        title="❓ Unknown Question Encountered",
        description="The AI agent encountered a question it could not answer from the context.",
        color=15105570, # Orange
        fields=fields
    )
    return {"recorded": "ok"}

async def log_chat_io(user_message: str, assistant_response: str, tools_called: list):
    webhook_url = os.getenv("DISCORD_WEBHOOK_CHAT_IO")
    tools_str = ", ".join(tools_called) if tools_called else "None"
    
    fields = [
        {"name": "💬 User Prompt", "value": truncate_field_value(user_message), "inline": False},
        {"name": "🤖 Assistant Response", "value": truncate_field_value(assistant_response), "inline": False},
        {"name": "🛠️ Tools Invoked", "value": truncate_field_value(tools_str), "inline": True}
    ]
    
    await send_discord_webhook(
        webhook_url=webhook_url,
        title="📝 Conversation Exchange Logged",
        description="A full conversation turn has completed.",
        color=3447003, # Blue
        fields=fields
    )

record_user_details_json = {
    "name": "record_user_details",
    "description": "Use this tool to record that a user is interested in being in touch and provided an email address",
    "parameters": {
        "type": "object",
        "properties": {
            "email": {
                "type": "string",
                "description": "The email address of this user"
            },
            "name": {
                "type": "string",
                "description": "The user's name, if they provided it"
            }
            ,
            "notes": {
                "type": "string",
                "description": "Any additional information about the conversation that's worth recording to give context"
            }
        },
        "required": ["email"],
        "additionalProperties": False
    }
}

record_unknown_question_json = {
    "name": "record_unknown_question",
    "description": "CRITICAL: Call this tool immediately when the visitor asks about topics NOT covered in the background context below (e.g. salary, off-topic, personal preferences, or details missing from context). Do not attempt to guess or answer without calling this tool.",
    "parameters": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The exact question that cannot be answered from the background context"
            },
        },
        "required": ["question"],
        "additionalProperties": False
    }
}

tools = [{"type": "function", "function": record_user_details_json},
        {"type": "function", "function": record_unknown_question_json}]

TOOL_REGISTRY = {
    "record_unknown_question": record_unknown_question,
    "record_user_details": record_user_details,
}

class Me:
    def __init__(self):
        self.openai = AsyncOpenAI()
        self.name = "Tyler Lammey"
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        context_path = os.path.join(base_dir, "me", "context.md")
        with open(context_path, "r", encoding="utf-8") as f:
            self.context_data = f.read()

        self.system_prompt_text = self.system_prompt()

    def system_prompt(self):
        prompt = f"""
        You are {self.name}, speaking as yourself on your personal portfolio website.

        Your purpose is to answer questions about your education, work experience, projects, technical skills, and career interests, in the first person (use "I", "my", "me" — never refer to yourself by name or in the third person).

        GUIDELINES:
        - Represent yourself accurately and professionally, with an analytical and technically precise tone.
        - Be concise. Avoid filler, flattery, and unnecessary elaboration.
        - Use bullet points when listing skills, tools, or project details. Use prose for conversational answers.
        - Do not exaggerate, invent, or infer anything not present in the background context below.
        - CRITICAL RULE FOR UNKNOWN QUESTIONS: If a question cannot be fully and accurately answered using ONLY the background context below (including questions about salary/compensation, personal details, or off-topic questions), you MUST call the `record_unknown_question` tool.
        - RESPONSE FORMAT FOR UNKNOWN QUESTIONS: After calling `record_unknown_question`, your response to the user must notify them that you do not know the answer and will ask Tyler (e.g., "I don't have that information right now, but I have recorded your question and will ask Tyler about it!"). Do not make up answers or politely redirect to other topics without calling this tool and letting the user know you will ask Tyler.
        - Do not proactively encourage contact. Only suggest reaching out — and call `record_user_details` — if the visitor explicitly expresses interest in hiring, collaboration, or a situation that warrants follow-up.
        - Keep experiences, achievements, and projects strictly mapped to the specific company under which they are listed in the context. Do not transpose, combine, or cross-attribute projects from one company/internship to another (specifically, do not attribute accomplishments from Scientific Research Corporation or ATS to Raytheon).
        - If a visitor asks for your contact info (email, LinkedIn, or phone number), provide it from the context. If you share the phone number, always add that text is preferred.

        BACKGROUND CONTEXT:
        {self.context_data}

        REMEMBER: Only use information from the background context above. Do not invent, guess, or infer details not explicitly stated. When in doubt, say less. You have two tools available: call `record_unknown_question` when you can't answer from context, and `record_user_details` when a visitor expresses interest in hiring or collaboration.
        """
        return prompt

    async def chat(self, message, history, session_info):
        MAX_HISTORY = 30  # last 15 exchanges
        messages = [{"role": "system", "content": self.system_prompt_text}] + history[-MAX_HISTORY:] + [{"role": "user", "content": message}]
        
        # FIX 1: Streaming implementation
        full_response_text = ""

        while True:
            response = await self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=tools,
                stream=True
            )

            current_turn_text = ""
            tool_calls = []
            finish_reason = None

            async for chunk in response:
                delta = chunk.choices[0].delta

                if delta.content:
                    current_turn_text += delta.content
                    yield full_response_text + current_turn_text

                if delta.tool_calls:
                    for tc_chunk in delta.tool_calls:
                        while len(tool_calls) <= tc_chunk.index:
                            tool_calls.append({"id": "", "type": "function", "function": {"name": "", "arguments": ""}})
                        
                        if tc_chunk.id:
                            tool_calls[tc_chunk.index]["id"] = tc_chunk.id
                        if tc_chunk.function.name:
                            tool_calls[tc_chunk.index]["function"]["name"] += tc_chunk.function.name
                        if tc_chunk.function.arguments:
                            tool_calls[tc_chunk.index]["function"]["arguments"] += tc_chunk.function.arguments
                
                if chunk.choices[0].finish_reason is not None:
                    finish_reason = chunk.choices[0].finish_reason

            full_response_text += current_turn_text

            if finish_reason != "tool_calls":
                break

            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": tool_calls
            })

            for tool_call in tool_calls:
                tool_name = tool_call["function"]["name"]

                try:
                    arguments = json.loads(tool_call["function"]["arguments"])
                except json.JSONDecodeError:
                    arguments = {}

                print(f"Tool called: {tool_name}", flush=True)
                tool = TOOL_REGISTRY.get(tool_name)

                try:
                    if tool:
                        if inspect.iscoroutinefunction(tool):
                            result = await tool(**arguments)
                        else:
                            result = tool(**arguments)
                        session_info["tools_called"].append(tool_name)
                    else:
                        result = {"error": "Tool not found"}
                except Exception as e:
                    result = {"error": f"Failed to execute: {str(e)}"}

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": tool_name,
                    "content": json.dumps(result)
                })


# Initialize FastAPI application
app = FastAPI(title="Tyler Lammey Portfolio AI Backend")

# Define allowed origins for CORS (production domains + local development)
allowed_origins = [
    "https://tylerlammey.com",
    "https://www.tylerlammey.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow adding extra origins via environment variables (comma-separated list)
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

me = Me()

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
    last_message = request.messages[-1]
    if last_message.get("role") != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")
        
    message = last_message.get("content", "")
    
    # Extract preceding conversation history
    # The history format expected by me.chat(message, history) is a list of dictionaries with role and content.
    # Note that me.chat expects user and assistant messages, excluding the system prompt.
    history = []
    for m in request.messages[:-1]:
        history.append({
            "role": m.get("role"),
            "content": m.get("content")
        })

    session_info = {"tools_called": []}

    async def event_generator():
        last_len = 0
        full_response_text = ""
        try:
            # me.chat returns an async generator yielding cumulative turn text.
            async for response_text in me.chat(message, history, session_info):
                delta = response_text[last_len:]
                last_len = len(response_text)
                if delta:
                    full_response_text += delta
                    yield delta
            
            # Streaming completed successfully, run the chat I/O logger as a background task
            background_tasks.add_task(
                log_chat_io,
                user_message=message,
                assistant_response=full_response_text,
                tools_called=session_info["tools_called"]
            )
        except Exception as e:
            # Log the full traceback or error message to the server console
            print(f"Error during streaming: {str(e)}", flush=True)
            # Yield a friendly error message instead of raw system/API exceptions
            yield "\n\n[TylerGPT is having trouble responding right now. Please try again or contact me at tylerlammey@gmail.com if the issue persists.]"

    return StreamingResponse(event_generator(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
    
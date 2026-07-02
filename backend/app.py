from dotenv import load_dotenv
from openai import OpenAI
import json
import os
import requests
from pypdf import PdfReader
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict

## RUN WITH: uv run app.py

load_dotenv(override=True)

def push(text):
    try:
        requests.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token": os.getenv("PUSHOVER_TOKEN"),
                "user": os.getenv("PUSHOVER_USER"),
                "message": text,
            },
            timeout=3.0
        )
    except Exception as e:
        print(f"Failed to send Pushover alert: {e}", flush=True)


def record_user_details(email, name="Name not provided", notes="not provided"):
    push(f"Recording {name} with email {email} and notes {notes}")
    return {"recorded": "ok"}

def record_unknown_question(question):
    push(f"Recording {question}")
    return {"recorded": "ok"}

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
    "description": "Always use this tool to record any question that couldn't be answered as you didn't know the answer",
    "parameters": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The question that couldn't be answered"
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
        self.openai = OpenAI()
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
        - If a question cannot be answered from the context, call `record_unknown_question` and let the visitor know you don't have that information.
        - Do not proactively encourage contact. Only suggest reaching out — and call `record_user_details` — if the visitor explicitly expresses interest in hiring, collaboration, or a situation that warrants follow-up.
        - Keep experiences, achievements, and projects strictly mapped to the specific company under which they are listed in the context. Do not transpose, combine, or cross-attribute projects from one company/internship to another (specifically, do not attribute accomplishments from Scientific Research Corporation or ATS to Raytheon).
        - If asked about topics unrelated to your professional background, politely redirect the conversation.
        - If a visitor asks for your contact info (email, LinkedIn, or phone number), provide it from the context. If you share the phone number, always add that text is preferred.

        BACKGROUND CONTEXT:
        {self.context_data}

        REMEMBER: Only use information from the background context above. Do not invent, guess, or infer details not explicitly stated. When in doubt, say less. You have two tools available: call `record_unknown_question` when you can't answer from context, and `record_user_details` when a visitor expresses interest in hiring or collaboration.
        """
        return prompt

    def chat(self, message, history):
        MAX_HISTORY = 30  # last 15 exchanges
        messages = [{"role": "system", "content": self.system_prompt_text}] + history[-MAX_HISTORY:] + [{"role": "user", "content": message}]
        
        # FIX 1: Streaming implementation
        full_response_text = ""

        while True:
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=tools,
                stream=True
            )

            current_turn_text = ""
            tool_calls = []
            finish_reason = None

            for chunk in response:
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
                    result = tool(**arguments) if tool else {"error": "Tool not found"}
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
async def chat_endpoint(request: ChatRequest):
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

    def event_generator():
        last_len = 0
        try:
            # me.chat returns a generator yielding cumulative turn text.
            for response_text in me.chat(message, history):
                delta = response_text[last_len:]
                last_len = len(response_text)
                if delta:
                    yield delta
        except Exception as e:
            # Log the full traceback or error message to the server console
            print(f"Error during streaming: {str(e)}", flush=True)
            # Yield a friendly error message instead of raw system/API exceptions
            yield "\n\n[TylerGPT is having trouble responding right now. Please try again or contact me at tylerlammey@gmail.com if the issue persists.]"

    return StreamingResponse(event_generator(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
    
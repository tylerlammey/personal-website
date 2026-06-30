# Tyler Lammey — Personal Portfolio and AI Agent

This repository contains the codebase for my personal portfolio website. The project features a custom AI assistant agent, TylerGPT, designed to answer queries regarding my professional experience, academic background, projects, and technical competencies.

---

## Technical Stack

### Frontend
* **Core**: React (Vite) and JavaScript
* **Styling**: Responsive Vanilla CSS with a grid layout and dark-violet theme
* **Features**: Streaming response rendering, suggested prompt chips, interactive custom notification toasts, and smooth scroll navigation

### Backend
* **Core**: Python and FastAPI
* **AI Engine**: OpenAI API (`gpt-4o-mini`) using streaming completions
* **Context Layer**: Structured local database (`backend/me/context.md`) serving as the source of truth for the AI agent
* **Telemetry**: Integrated Pushover API notifications to log contact requests and visitor feedback

---

## Local Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **OpenAI API Key**

### 1. Set Up the Backend
Navigate to the `/backend` directory:
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `/backend` directory and insert your credentials:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   # Optional:
   PUSHOVER_TOKEN=your_pushover_app_token
   PUSHOVER_USER=your_pushover_user_key
   ```
4. Start the FastAPI application:
   ```bash
   python app.py
   ```
   *The server runs locally at `http://localhost:8000`.*

### 2. Set Up the Frontend
Navigate to the `/frontend` directory:
1. Install Node modules:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## AI Agent Architecture
To ensure accuracy and prevent model hallucinations, the assistant utilizes a structured retrieval-augmented framework:
* **Background Context**: The backend parses a verified markdown profile (`backend/me/context.md`) containing details on academic history, skills, and past internships.
* **Strict Constraints**: System prompt guidelines restrict the model's responses strictly to the parsed context. It is explicitly prohibited from transposing details or accomplishments across different roles (such as differentiating between previous work at Scientific Research Corporation and my current, ongoing internship at Raytheon).
* **Tool Call Integrations**: The model registers function tools to automatically record interested visitor emails and log unanswered questions for manual review.

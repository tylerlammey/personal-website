import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// ─── Inline styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0A0A0F;
    --surface: #111118;
    --surface2: #18181f;
    --border: rgba(124,58,237,0.18);
    --violet: #7C3AED;
    --violet-light: #A78BFA;
    --violet-glow: rgba(124,58,237,0.35);
    --text: #F4F4F8;
    --muted: #8884A0;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Inter', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    overflow-x: hidden;
  }



  /* ── Nav ── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2.5rem;
    height: 60px;
    background: rgba(10,10,15,0.72);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--mono);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .nav-logo a {
    text-decoration: none;
    color: var(--violet-light);
    transition: filter 0.25s, opacity 0.25s;
  }
  .nav-logo a:hover {
    filter: brightness(1.15);
    opacity: 0.9;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--muted);
    text-decoration: none;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--violet-light); }

  .nav-separator {
    color: rgba(255, 255, 255, 0.15);
    font-size: 0.82rem;
    pointer-events: none;
    user-select: none;
  }
  .nav-icon-link {
    display: flex;
    align-items: center;
    color: var(--muted) !important;
    transition: color 0.2s;
  }
  .nav-icon-link:hover {
    color: var(--violet-light) !important;
  }

  /* ── Sections ── */
  section {
    position: relative;
    z-index: 1;
    max-width: 1100px;
    margin: 0 auto;
    padding: 4rem 6rem;
  }

  .section-label {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--violet);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .section-title {
    font-family: var(--mono);
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 1rem;
    text-align: center;
  }

  .section-sub {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.7;
    max-width: 520px;
    margin: 0 auto 2.5rem;
    text-align: center;
  }

  /* ── Hero ── */
  #hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-top: 80px;
    gap: 0;
  }

  .hero-eyebrow {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--violet);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 1.2rem;
  }

  .hero-name {
    font-family: var(--mono);
    font-size: clamp(2.4rem, 6vw, 4.2rem);
    font-weight: 700;
    line-height: 1.05;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .hero-tagline {
    color: var(--muted);
    font-size: 1rem;
    font-weight: 300;
    margin-bottom: 3rem;
  }

  /* glow orb behind chat */
  .orb {
    position: absolute;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%);
    pointer-events: none;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: blur(40px);
    animation: pulse 4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  }

  /* ── ChatGPT-style Chat Window ── */
  @keyframes returnNormal {
    from {
      opacity: 0.1;
      transform: scale(1.08) translateY(-40px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes enterFullscreen {
    0% {
      opacity: 0;
      transform: scale(0.88) translateY(16px);
      border-radius: 40px;
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      border-radius: 0;
    }
  }

  @keyframes backdropFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .chat-container {
    position: relative;
    width: 100%;
    max-width: 850px;
    background: #212121;
    border-radius: 16px;
    border: 1px solid #303030;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 700px;
    text-align: left; /* overrides text-align: center inherited from #root in index.css */
    animation: returnNormal 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform, opacity;
  }

  .chat-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    border-radius: 0;
    border: none;
    z-index: 9999;
    animation: enterFullscreen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .fullscreen-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    z-index: 9998;
    animation: backdropFadeIn 0.4s ease forwards;
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem 0.5rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: #212121;
  }

  .chat-header-model-selector {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    transition: background-color 0.2s, color 0.2s;
    font-size: 0.95rem;
    font-weight: 600;
    color: #b4b4b4;
    font-family: var(--sans);
  }
  .chat-header-model-selector:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ececec;
  }
  .chat-header-model-selector .chevron-icon {
    opacity: 0.7;
    margin-top: 1px;
  }

  .chat-header-btn {
    background: none;
    border: none;
    color: #b4b4b4;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    transition: background-color 0.2s, color 0.2s;
  }
  .chat-header-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ececec;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }

  .chat-messages::-webkit-scrollbar { width: 6px; }
  .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  .msg-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    animation: fadeUp 0.3s ease;
    width: 100%;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg-row.user {
    justify-content: flex-end;
  }

  .msg-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
  }

  .msg-avatar.assistant {
    background: transparent;
    padding: 0;
    object-fit: cover;
    margin-right: -8px;
  }
  .msg-avatar.user {
    display: none;
  }

  .msg-bubble {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .msg-bubble.assistant {
    background: #2a2a2a;
    color: #ececec;
    border-radius: 20px;
    padding: 0.75rem 1.25rem;
    max-width: 75%;
    word-break: break-word;
  }
  .msg-bubble.assistant p {
    margin: 0 0 0.75rem 0;
  }
  .msg-bubble.assistant p:last-child {
    margin-bottom: 0;
  }
  .msg-bubble.assistant ul, .msg-bubble.assistant ol {
    margin: 0 0 0.75rem 1.25rem;
    padding: 0;
  }
  .msg-bubble.assistant li {
    margin-bottom: 0.35rem;
  }
  .msg-bubble.assistant li:last-child {
    margin-bottom: 0;
  }
  .msg-bubble.assistant pre {
    background: #1e1e1e;
    padding: 0.75rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.75rem 0;
  }
  .msg-bubble.assistant code {
    font-family: var(--mono);
    font-size: 0.85rem;
    background: rgba(255,255,255,0.06);
    padding: 0.15rem 0.3rem;
    border-radius: 4px;
  }
  .msg-bubble.assistant pre code {
    background: none;
    padding: 0;
    border-radius: 0;
  }

  .msg-bubble.user {
    background: #2f2f2f;
    color: #ececec;
    border-radius: 20px;
    padding: 0.75rem 1.25rem;
    max-width: 70%;
    word-break: break-word;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 0.5rem 0;
  }

  .typing-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #b4b4b4;
    animation: bounce 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  .chat-input-area {
    padding: 0 1.5rem 1.5rem;
    background: #212121;
  }

  .chat-input-bar {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    background: #2f2f2f;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 26px;
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    transition: background-color 0.2s, box-shadow 0.2s;
    cursor: text;
  }
  .chat-input-bar:focus-within {
    box-shadow: 0 0 0 1px rgba(255,255,255,0.15);
  }

  .chat-textarea {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #ececec;
    font-size: 0.95rem;
    font-family: var(--sans);
    resize: none;
    max-height: 200px;
    min-height: 24px;
    line-height: 1.5;
    overflow-y: auto;
    scrollbar-width: none;
    align-self: center;
    padding: 4px 0;
  }
  .chat-textarea::placeholder { color: #8e8ea0; }

  .chat-send-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ffffff;
    color: #171717;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s, color 0.2s, transform 0.1s;
  }
  .chat-send-btn:hover:not(:disabled) {
    background: #e5e5e5;
  }
  .chat-send-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
  .chat-send-btn:disabled {
    background: #383838;
    color: #676767;
    cursor: not-allowed;
  }

  .chat-attach-btn {
    background: none;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    align-self: center;
    color: #b4b4b4;
    transition: background-color 0.2s;
  }
  .chat-attach-btn:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .chat-hint {
    font-size: 0.7rem;
    color: #8e8ea0;
    text-align: center;
    margin-top: 0.6rem;
  }

  .chat-toast {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #111118;
    border: 1px solid rgba(124, 58, 237, 0.4);
    color: var(--violet-light);
    padding: 0.6rem 1.2rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-family: var(--sans);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    z-index: 10;
    pointer-events: none;
    animation: fadeInOut 3s forwards;
    text-align: center;
    max-width: 80%;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, 10px); }
    10% { opacity: 1; transform: translate(-50%, 0); }
    90% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, -10px); }
  }

  .suggested-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    max-width: 850px;
    width: 100%;
  }

  .prompt-chip {
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 100px;
    padding: 0.35rem 0.9rem;
    font-size: 0.75rem;
    color: var(--violet-light);
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
    white-space: nowrap;
  }
  .prompt-chip:hover {
    background: rgba(124,58,237,0.22);
    border-color: var(--violet);
  }

  /* ── Projects ── */
  #projects { border-top: 1px solid var(--border); }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .project-card {
    background: var(--surface);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 1.5rem;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .project-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--violet), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .project-card:hover {
    border-color: rgba(124,58,237,0.35);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(124,58,237,0.12);
  }
  .project-card:hover::before { opacity: 1; }

  .project-icon {
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }

  .project-title {
    font-family: var(--mono);
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .project-desc {
    font-size: 0.82rem;
    color: var(--muted);
    line-height: 1.65;
    margin-bottom: 1rem;
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tag {
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.2);
    border-radius: 4px;
    padding: 0.18rem 0.55rem;
    font-size: 0.68rem;
    font-family: var(--mono);
    color: var(--violet-light);
    letter-spacing: 0.04em;
  }

  .project-links {
    display: flex;
    gap: 0.75rem;
    margin-top: auto;
    padding-top: 1rem;
  }

  .project-link {
    font-size: 0.75rem;
    color: var(--muted);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transition: color 0.2s;
  }
  .project-link:hover { color: var(--violet-light); }

  /* ── Resume ── */
  #resume { border-top: 1px solid var(--border); }

  .resume-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }

  .education-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-top: 2rem;
  }

  .education-highlights-card {
    background: rgba(255,255,255,0.01);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .rpi-logo-wrapper {
    width: 90px;
    height: 90px;
    border-radius: 12px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }

  .rpi-logo-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .rpi-logo-fallback {
    color: #e21b23;
    font-size: 1.5rem;
    font-weight: 800;
    font-family: var(--mono);
    letter-spacing: -0.05em;
  }

  .highlights-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .highlight-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }

  .highlight-metric {
    display: flex;
    align-items: flex-start;
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .metric-label {
    color: var(--muted);
    font-family: var(--mono);
    width: 95px;
    flex-shrink: 0;
  }

  .metric-value {
    color: var(--text-h);
    font-weight: 500;
  }

  .highlight-tags {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .highlight-tag {
    background: rgba(124,58,237,0.1);
    color: var(--violet-light);
    border: 1px solid rgba(124,58,237,0.25);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-family: var(--mono);
    width: fit-content;
  }

  #education { border-top: 1px solid var(--border); }

  @media (max-width: 720px) {
    .resume-layout { grid-template-columns: 1fr; }
    .education-layout { grid-template-columns: 1fr; }
    .projects-grid { grid-template-columns: 1fr; }
    nav { padding: 0 1.25rem; }
    section { padding: 4rem 1.25rem; }
  }

  .resume-col-title {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--violet);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .resume-col-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .timeline-item {
    position: relative;
    padding-left: 1.25rem;
    margin-bottom: 1.75rem;
  }
  .timeline-item::before {
    content: '';
    position: absolute;
    left: 0; top: 6px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--violet);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
  }
  .timeline-item::after {
    content: '';
    position: absolute;
    left: 2.5px; top: 14px;
    width: 1px;
    height: calc(100% + 0.5rem);
    background: var(--border);
  }
  .timeline-item:last-child::after {
    height: 100%;
    background: var(--border);
  }

  .timeline-role {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.15rem;
  }

  .timeline-org {
    font-size: 0.78rem;
    color: var(--violet-light);
    margin-bottom: 0.15rem;
    font-family: var(--mono);
  }

  .timeline-date {
    font-size: 0.7rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
    font-family: var(--mono);
  }

  .timeline-desc {
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.65;
  }

  .skill-group { margin-bottom: 1.25rem; }
  .skill-group-name {
    font-size: 0.7rem;
    font-family: var(--mono);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }
  .skill-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .skill-pill {
    background: var(--surface2);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 5px;
    padding: 0.25rem 0.65rem;
    font-size: 0.75rem;
    color: var(--text);
    font-family: var(--mono);
    transition: border-color 0.2s, background 0.2s;
  }
  .skill-pill:hover {
    border-color: rgba(124,58,237,0.4);
    background: rgba(124,58,237,0.08);
    color: var(--violet-light);
  }

  .resume-download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2.5rem;
    background: linear-gradient(135deg, var(--violet) 0%, #5b21b6 100%);
    color: #fff;
    padding: 0.7rem 1.5rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    font-family: var(--mono);
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: opacity 0.2s, transform 0.15s;
    border: none;
    cursor: pointer;
  }
  .resume-download-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  /* ── Footer ── */
  footer {
    position: relative;
    z-index: 1;
    padding: 2.5rem 2rem;
    border-top: 1px solid var(--border);
    font-size: 0.8rem;
    color: var(--muted);
    font-family: var(--sans);
    background: rgba(10, 10, 15, 0.4);
  }
  .footer-content {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .footer-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .footer-link {
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .footer-link:hover {
    color: var(--violet-light);
  }
  .footer-dot {
    color: rgba(255, 255, 255, 0.15);
    user-select: none;
  }
`;

// ─── Data (edit these to personalize) ─────────────────────────────────────────
const PROJECTS = [
  {
    icon: "🤖",
    title: "TylerGPT AI Agent",
    desc: "A conversational AI assistant integrated directly into this portfolio page. Combines a React frontend streaming parser with a FastAPI backend acting as a context-aware resume agent.",
    tags: ["React", "FastAPI", "OpenAI API", "SSE Stream"],
    demo: "#agent",
    code: "https://github.com/tylerlammey/personal-website",
  },
  {
    icon: "🌱",
    title: "Automated IoT Plant Care System",
    desc: "An edge-to-cloud plant monitoring system with real-time telemetry, automated watering control cycles, and a remote FastAPI web application interface.",
    tags: ["Arduino", "C++", "FastAPI", "Python", "IoT"],
    demo: "",
    code: "https://github.com/tylerlammey/automated-IoT-plant-care",
  },
  {
    icon: "⚛️",
    title: "Nuclear Magnetic Resonance (NMR) Qubits",
    desc: "A theoretical research paper analyzing NMR quantum computing, formulating Hamiltonian systems, modeling pseudo-pure state initialization, and evaluating scalability limitations.",
    tags: ["Quantum Computing", "NMR", "Academic Research"],
    demo: "/nmr_qubits_paper.pdf",
    code: "",
  },
  {
    icon: "⚓",
    title: "UTUX Underwater Exploration Website",
    desc: "Developed the entire backend API and collaborated on the frontend interface for the University of Toronto Underwater Exploration (UTUX) student design club website.",
    tags: ["FastAPI", "React", "SQL", "Web API"],
    demo: "",
    code: "https://github.com/U-of-T-Underwater-Exploration/website",
  },
];

const EXPERIENCE = [
  {
    role: "Radar Systems Engineering Intern",
    org: "Raytheon (RTX)",
    date: "Summer 2026",
    desc: "Maintained and debugged MATLAB modeling codebases by correcting variable defects inside data structures. Developed a VBA automation tool that generates technical PDF deliverables from database records to reduce manual overhead, and validated software updates through structured testing.",
  },
  {
    role: "Radar Engineer Intern",
    org: "Scientific Research Corporation",
    date: "Summer 2025",
    desc: "Automated radar waveform measurements and documentation using SCPI-controlled lab instrumentation. Wrote Python file conversion tools utilized across the engineering team.",
  },
  {
    role: "Software Engineer Intern",
    org: "Advanced Technologies and Services, Inc.",
    date: "Summer 2024",
    desc: "Built network testing scripts performing packet emulation (TCP/UDP) hosted on Google Cloud. Developed a FastAPI & Angular management console for ISPs to monitor distributed IoT network testing devices.",
  },
];

const EDUCATION = [
  {
    role: "B.S. Computer and Systems Engineering",
    org: "Rensselaer Polytechnic Institute",
    date: "2023 – 2027",
    desc: "GPA: 3.82 · Dean's List · RPISEC (Cybersecurity), RPai (Artificial Intelligence), Quantum Computing Club.",
  },
];

const SKILLS = [
  { group: "Languages", items: ["Python", "C++", "C", "JavaScript", "TypeScript", "HTML/CSS", "SQL", "Bash", "MATLAB"] },
  { group: "Software & Frameworks", items: ["React", "FastAPI", "Angular", "OpenCV", "NumPy", "Pandas", "Matplotlib", "GCP", "Arduino", "Linux", "Git", "Docker", "REST APIs"] },
  { group: "AI/ML", items: ["OpenAI API", "LLM Tool Calling", "Prompt Engineering"] },
  { group: "Competencies", items: ["RF/Radar Eng.", "Embedded Systems", "IoT", "Networking", "Waveform Analysis", "Automation", "SCPI", "Ethernet", "SPI", "PWM"] },
  { group: "Security", items: ["Secret Security Clearance"] },
];

const SUGGESTED = [
  "What are your strongest technical skills?",
  "Tell me about your SRC internship.",
  "What projects have you built?",
  "Where do you go to school?",
  "Tell me about your time at ATS.",
];

// ─── Chat Component ────────────────────────────────────────────────────────────
function ChatWindow({ pendingPrompt, onPromptSent, isFullscreen, setIsFullscreen }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm TylerGPT, Tyler's AI assistant. Ask me anything about my experience, projects, or skills.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const handleAttachClick = () => {
    const FUNNY_NOTES = [
      "Nice try! File upload is disabled, but you can view my full resume below or ask me any questions about my experience!",
      "Attachment feature is currently a placeholder. Feel free to download my resume below or reach out directly!",
      "File upload is disabled. I already have all of Tyler's credentials and projects loaded in my database!",
      "Nice try, but I only accept files from Tyler. You can find his full PDF resume at the bottom of the page!"
    ];
    const randomNote = FUNNY_NOTES[Math.floor(Math.random() * FUNNY_NOTES.length)];

    setToast(randomNote);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(""), 3000);
  };

  // Manage auto-scroll logic during streaming
  const handleScroll = () => {
    const container = chatMessagesRef.current;
    if (!container) return;
    // Calculate distance from the bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // If the user scrolls up (more than 80px), pause autoscroll. If they scroll back to the bottom, re-enable it.
    if (distanceFromBottom > 80) {
      setShouldAutoScroll(false);
    } else if (distanceFromBottom <= 15) {
      setShouldAutoScroll(true);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll && chatMessagesRef.current) {
      const container = chatMessagesRef.current;
      // Directly setting scrollTop is fast, non-queued, and avoids scrolling the parent browser window
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading, shouldAutoScroll]);

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm TylerGPT, Tyler's AI assistant. Ask me anything about my experience, projects, or skills.",
      },
    ]);
    setShouldAutoScroll(true);
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: msg };
    const assistantPlaceholder = { role: "assistant", content: "" };
    const history = [...messages, userMsg];

    // Add user message and assistant placeholder bubble immediately
    setMessages([...history, assistantPlaceholder]);
    setLoading(true);
    setShouldAutoScroll(true); // Force scroll to bottom on user input

    try {
      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to connect to backend");
      }

      // Read streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          streamedText += chunk;
          setMessages([...history, { role: "assistant", content: streamedText }]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages([...history, { role: "assistant", content: "Network error — TylerGPT is offline. Please reach out to me at tylerlammey@gmail.com to let me know!" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pendingPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(pendingPrompt);
      onPromptSent();
    }
  }, [pendingPrompt, onPromptSent]);

  useEffect(() => {
    autoResize();
  }, [input]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`chat-container ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-model-selector">
          <span>TylerGPT-4o mini</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button className="chat-header-btn" onClick={handleReset} title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
            </svg>
          </button>
          <button
            className="chat-header-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-messages"
        ref={chatMessagesRef}
        onScroll={handleScroll}
      >
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            {m.role === "assistant" && (
              <div className="msg-avatar assistant">
                <svg width="36" height="36" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="13" fill="url(#avatarGlow)" opacity="0.15" />
                  <circle cx="14" cy="14" r="12" fill="url(#avatarBgGrad)" stroke="url(#avatarBorderGrad)" strokeWidth="1.2" />
                  <path d="M 6.5 23 C 6.5 19 9.5 17.5 14 17.5 C 18.5 17.5 21.5 19 21.5 23" stroke="url(#avatarIconGrad)" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="10.5" y="8" width="7" height="8" rx="3.5" fill="url(#avatarBgGrad)" stroke="url(#avatarIconGrad)" strokeWidth="1.5" />
                  <path d="M 14 15.5 V 17.5" stroke="url(#avatarIconGrad)" strokeWidth="1.5" />
                  <path d="M 11.5 11.5 H 16.5" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M 14 8 V 5.5" stroke="url(#avatarIconGrad)" strokeWidth="1" />
                  <circle cx="14" cy="4.5" r="1" fill="#A78BFA" />
                  <defs>
                    <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="avatarBgGrad" x1="0" y1="0" x2="28" y2="28">
                      <stop offset="0%" stopColor="#1E1235" />
                      <stop offset="100%" stopColor="#0F091D" />
                    </linearGradient>
                    <linearGradient id="avatarBorderGrad" x1="0" y1="0" x2="28" y2="28">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="50%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#4C1D95" />
                    </linearGradient>
                    <linearGradient id="avatarIconGrad" x1="6" y1="5" x2="22" y2="23">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#C0A8FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
            <div className={`msg-bubble ${m.role}`}>
              {m.role === "assistant" ? (
                m.content === "" ? (
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-bar" onClick={(e) => {
          if (e.target.closest("button")) return;
          textareaRef.current?.focus();
        }}>
          <button
            className="chat-attach-btn"
            type="button"
            title="Add attachment"
            onClick={handleAttachClick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="#b4b4b4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask about skills, experience, projects…"
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            title="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L12 20M12 4L5 11M12 4L19 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="chat-hint">TylerGPT can make mistakes. Check important info.</div>
      </div>
      {toast && (
        <div className="chat-toast" key={toast}>
          {toast}
        </div>
      )}
    </div>
  );
}

function InteractiveGrid({ paused }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const spacing = 45;
    let cols = Math.ceil(width / spacing) + 1;
    let rows = Math.ceil(height / spacing) + 1;
    let nodes = [];

    // Detect mobile or touch-only devices to save CPU/battery and avoid layout conflicts
    const checkIsMobile = () =>
      window.innerWidth <= 768 ||
      ("ontouchstart" in window) ||
      navigator.maxTouchPoints > 0;
    let isMobile = checkIsMobile();

    const initNodes = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      isMobile = checkIsMobile();

      nodes = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          nodes.push({
            baseX: x * spacing,
            baseY: y * spacing,
            x: x * spacing,
            y: y * spacing,
            col: x,
            row: y,
          });
        }
      }
    };

    initNodes();

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(124, 58, 237, 0.055)"; // Keep base grid visible on mobile
      ctx.lineWidth = 1;

      // Draw horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * spacing);
        ctx.lineTo(width, r * spacing);
        ctx.stroke();
      }

      // Draw vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * spacing, 0);
        ctx.lineTo(c * spacing, height);
        ctx.stroke();
      }
    };

    const handleResize = () => {
      initNodes();
      if (isMobile) {
        drawStatic();
      }
    };

    const handleMouseMove = (e) => {
      if (isMobile) return;
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      if (isMobile) return;
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    const draw = () => {
      if (paused) return;
      if (isMobile) {
        drawStatic();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Update node positions
      const radius = 130;
      const strength = 22;

      nodes.forEach((node) => {
        const dx = mouse.current.x - node.baseX;
        const dy = mouse.current.y - node.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = node.baseX;
        let targetY = node.baseY;

        const isBoundary =
          node.col === 0 ||
          node.col === cols - 1 ||
          node.row === 0 ||
          node.row === rows - 1;

        if (!isBoundary && dist < radius) {
          const force = (radius - dist) / radius;
          const distRatio = Math.sin(force * Math.PI / 2);
          const pull = distRatio * strength;
          const angle = Math.atan2(dy, dx);
          // Pull points inwards towards the cursor
          targetX = node.baseX + Math.cos(angle) * pull;
          targetY = node.baseY + Math.sin(angle) * pull;
        }

        // Smooth springy movement
        node.x += (targetX - node.x) * 0.12;
        node.y += (targetY - node.y) * 0.12;
      });

      // Create radial gradient for glowing lines around the mouse
      const grad = ctx.createRadialGradient(
        mouse.current.x,
        mouse.current.y,
        0,
        mouse.current.x,
        mouse.current.y,
        220
      );
      grad.addColorStop(0, "rgba(124, 58, 237, 0.28)");
      grad.addColorStop(0.5, "rgba(124, 58, 237, 0.11)");
      grad.addColorStop(1, "rgba(124, 58, 237, 0.055)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;

      // Draw horizontal lines (using quadratic curves for fluid/smooth bending)
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        const rowStartIndex = r * cols;
        const firstNode = nodes[rowStartIndex];
        if (firstNode) {
          ctx.moveTo(firstNode.x, firstNode.y);
          for (let c = 1; c < cols - 1; c++) {
            const node = nodes[rowStartIndex + c];
            const nextNode = nodes[rowStartIndex + c + 1];
            if (node && nextNode) {
              const xc = (node.x + nextNode.x) / 2;
              const yc = (node.y + nextNode.y) / 2;
              ctx.quadraticCurveTo(node.x, node.y, xc, yc);
            }
          }
          const lastNode = nodes[rowStartIndex + cols - 1];
          if (lastNode) {
            ctx.lineTo(lastNode.x, lastNode.y);
          }
          ctx.stroke();
        }
      }

      // Draw vertical lines (using quadratic curves for fluid/smooth bending)
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        const firstNode = nodes[c];
        if (firstNode) {
          ctx.moveTo(firstNode.x, firstNode.y);
          for (let r = 1; r < rows - 1; r++) {
            const node = nodes[r * cols + c];
            const nextNode = nodes[(r + 1) * cols + c];
            if (node && nextNode) {
              const xc = (node.x + nextNode.x) / 2;
              const yc = (node.y + nextNode.y) / 2;
              ctx.quadraticCurveTo(node.x, node.y, xc, yc);
            }
          }
          const lastNode = nodes[(rows - 1) * cols + c];
          if (lastNode) {
            ctx.lineTo(lastNode.x, lastNode.y);
          }
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    if (paused) {
      drawStatic();
    } else {
      if (isMobile) {
        drawStatic();
      } else {
        draw();
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <style>{css}</style>
      <InteractiveGrid paused={isFullscreen} />

      {/* Nav */}
      <nav>
        <div className="nav-logo">
          <a href="#agent" onClick={(e) => { e.preventDefault(); setIsFullscreen(false); scrollTo("agent"); }}>
            {'<TylerLammey />'}
          </a>
        </div>
        <ul className="nav-links">
          <li><a href="#agent" onClick={(e) => { e.preventDefault(); setIsFullscreen(false); scrollTo("agent"); }}>AI Agent</a></li>
          <li><a href="#projects" onClick={(e) => { e.preventDefault(); setIsFullscreen(false); scrollTo("projects"); }}>Projects</a></li>
          <li><a href="#resume" onClick={(e) => { e.preventDefault(); setIsFullscreen(false); scrollTo("resume"); }}>Resume</a></li>
          <li className="nav-separator">|</li>
          <li>
            <a href="https://github.com/tylerlammey" target="_blank" rel="noopener noreferrer" title="GitHub" className="nav-icon-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"></path></svg>
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/tyler-lammey" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="nav-icon-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </li>
          <li>
            <a href="mailto:tylerlammey@gmail.com" title="Email" className="nav-icon-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero / AI Agent */}
      <section id="agent" style={{ maxWidth: "100%", padding: "0", position: "relative", overflow: isFullscreen ? "visible" : "hidden", zIndex: isFullscreen ? 10000 : 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "6rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
          <div className="orb" />
          <div className="hero-eyebrow">Computer Engineering Student @ RPI</div>
          <div className="hero-name">Tyler Lammey</div>
          <div className="hero-tagline">Radar Systems Engineering Intern at Raytheon.</div>

          <div className="suggested-prompts">
            {SUGGESTED.map((s) => (
              <button key={s} className="prompt-chip" onClick={() => setPendingPrompt(s)}>
                {s}
              </button>
            ))}
          </div>

          {isFullscreen && (
            <div className="fullscreen-backdrop" onClick={() => setIsFullscreen(false)} />
          )}
          {isFullscreen && (
            <div style={{ height: 700, width: "100%", maxWidth: 850 }} />
          )}
          <ChatWindow
            pendingPrompt={pendingPrompt}
            onPromptSent={() => setPendingPrompt(null)}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
          />
        </div>
      </section>

      {/* Projects */}
      <section id="projects">
        <div className="section-label">Work</div>
        <div className="section-title">Featured Projects</div>
        <p className="section-sub">A collection of things I've built — from internal tooling to consumer products.</p>
        <div className="projects-grid">
          {PROJECTS.map((p) => (
            <div className="project-card" key={p.title}>
              <div className="project-icon">{p.icon}</div>
              <div className="project-title">{p.title}</div>
              <div className="project-desc">{p.desc}</div>
              <div className="project-tags">
                {p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
              {(p.demo || p.code) && (
                <div className="project-links">
                  {p.demo && (
                    <a
                      className="project-link"
                      href={p.demo}
                      target={p.demo.startsWith("#") ? undefined : "_blank"}
                      rel={p.demo.startsWith("#") ? undefined : "noopener noreferrer"}
                      onClick={(e) => {
                        if (p.demo.startsWith("#")) {
                          e.preventDefault();
                          scrollTo(p.demo.substring(1));
                        }
                      }}
                    >
                      {p.demo.endsWith(".pdf") ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      )}
                      {p.demo.endsWith(".pdf") ? "Read Paper" : "Live Demo"}
                    </a>
                  )}
                  {p.code && (
                    <a className="project-link" href={p.code} target="_blank" rel="noopener noreferrer">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>
                      Source
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Resume */}
      <section id="resume">
        <div className="section-label">Background</div>
        <div className="section-title">Experience & Skills</div>
        <p className="section-sub">Internship experiences, academic background, and technical skills.</p>

        <div className="resume-layout">
          {/* Left: Experience + Education */}
          <div>
            <div className="resume-col-title">Experience</div>
            {EXPERIENCE.map((e) => (
              <div className="timeline-item" key={e.role + e.org}>
                <div className="timeline-role">{e.role}</div>
                <div className="timeline-org">{e.org}</div>
                <div className="timeline-date">{e.date}</div>
                <div className="timeline-desc">{e.desc}</div>
              </div>
            ))}

            <div className="resume-col-title" style={{ marginTop: "2rem" }}>Education</div>
            {EDUCATION.map((e) => (
              <div className="timeline-item" key={e.role}>
                <div className="timeline-role">{e.role}</div>
                <div className="timeline-org">{e.org}</div>
                <div className="timeline-date">{e.date}</div>
                <div className="timeline-desc">{e.desc}</div>
              </div>
            ))}
          </div>

          {/* Right: Skills */}
          <div>
            <div className="resume-col-title">Skills</div>
            {SKILLS.map((sg) => (
              <div className="skill-group" key={sg.group}>
                <div className="skill-group-name">{sg.group}</div>
                <div className="skill-pills">
                  {sg.items.map((s) => <span className="skill-pill" key={s}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <a 
          href="/Tyler_Lammey_Resume.pdf" 
          download="Tyler_Lammey_Resume.pdf" 
          className="resume-download-btn"
          onClick={() => {
            window.open('/Tyler_Lammey_Resume.pdf', '_blank');
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download Full Resume
        </a>
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-left">
            Built with React · Powered by TylerGPT · {new Date().getFullYear()}
          </div>
          <div className="footer-right">
            <a href="mailto:tylerlammey@gmail.com" className="footer-link">tylerlammey@gmail.com</a>
            <span className="footer-dot">·</span>
            <a href="https://github.com/tylerlammey" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
            <span className="footer-dot">·</span>
            <a href="https://www.linkedin.com/in/tyler-lammey" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</a>
          </div>
        </div>
      </footer>
    </>
  );
}

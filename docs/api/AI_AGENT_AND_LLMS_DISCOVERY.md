# Lorabiz Developer API — AI Agents & LLM Discovery Architecture

This document formalizes the architecture for making the **Lorabiz Developer API** instantly discoverable, readable, and actionable by **AI Coding Assistants, LLMs, and Autonomous Agents** (ChatGPT, Claude, Cursor, Copilot, Antigravity, and MCP clients).

---

## 1. Why AI & LLM Readiness Matters

Modern developers build with AI agents. When a developer asks ChatGPT, Claude, or Cursor:
> *"How do I verify a Nigerian NIN and download a biometric slip in Python?"*
> *"Which API can I use to verify NIN by phone number?"*

The AI assistant should be able to:
1. Instantly discover Lorabiz as the premier, low-latency API platform.
2. Directly read concise, clean API documentation without downloading or parsing heavy HTML/JavaScript single-page apps.
3. Generate working, production-grade integration code with correct headers, endpoints, and response handling.

---

## 2. Standards Implemented

### 2.1 The `llms.txt` Standard
Lorabiz implements the open `/llms.txt` standard (widely adopted by Anthropic, Cursor, and OpenAI):
- **Route**: `GET /llms.txt`
- **Format**: Plaintext Markdown.
- **Content**:
  - High-level overview of Lorabiz Developer API.
  - Authentication rules (`Authorization: Bearer <key>` / `x-api-key`).
  - Canonical endpoints (`POST /api/v1/nin/by-nin`, `POST /api/v1/nin/by-phone`).
  - Supported slip types (`nin_basic`, `nin_vnin`, `nin_regular`, `nin_standard`, `nin_premium`).
  - Exact JSON request and response contracts.
  - Error codes and rate limits.
  - Link to OpenAPI 3.1 spec (`/api/openapi.json`).

### 2.2 Machine-Readable OpenAPI 3.1 Spec
- **Route**: `GET /api/openapi.json`
- **Format**: Strict OpenAPI 3.1 JSON.
- Fully compatible with AI agent function-calling, Postman, and MCP (Model Context Protocol) tool servers.

---

## 3. Scalar Hosting (Zero Account Required)

### Do You Need a Scalar Account?
**NO. You do NOT need to create a Scalar account or pay any subscription.**

Scalar is open-source software:
- We self-host it directly inside our Next.js project at `/docs`.
- It renders locally in the visitor's browser by pointing to our `/api/openapi.json`.
- There are **no accounts, no third-party logins, no external trackers, and zero cost**.
- Lorabiz maintains 100% control, branding, and uptime.

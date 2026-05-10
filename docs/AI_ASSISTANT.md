# AI Assistant (Chatbot)

A natural-language interface to your T&E data, powered by the Anthropic API.

## What it does

A floating "Ask AI" button in the bottom-right corner of every page opens a
chat widget. Users can ask questions like:

- "How much did I spend on flights last quarter?"
- "Any pending expense reports?"
- "Show me my upcoming travel."
- "Where are policy violations happening?"
- "What was my biggest expense in March?"

The assistant answers using **only** real data from the database — it calls
backend tools (function calls) and reasons over the results before replying.

## Architecture

```
User → Chat widget (React)
         │
         ▼
   POST /chat/message  ── current_user (JWT)
         │
         ▼
   chat_service.chat()
         │
         ├──> Anthropic API (Claude)  ── system prompt + tool defs
         │         ▲
         │         │
         │         └──── tool_result blocks
         │                     ▲
         └──> chat_tools.execute_tool(...)
                     │
                     ▼
                SQLAlchemy queries
              (role-filtered, same
               pattern as analytics)
```

### Role-aware data access

Every tool respects the existing role model — there is no way for the LLM to
bypass it because the filter happens **inside Python**, before any data is
returned to the model:

| Role     | Data scope                                |
| -------- | ----------------------------------------- |
| employee | Only their own expenses & travel          |
| manager  | Their data + direct reports' data         |
| finance  | All employees                             |

### Tools exposed to the model

| Tool                     | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `get_expense_summary`    | Totals, by-category, by-status breakdown |
| `list_expenses`          | Filter individual items by date/category/amount/status |
| `list_travel_requests`   | Filter trips by destination/status/upcoming |
| `get_recent_activity`    | Latest events (expense + travel)         |
| `get_monthly_trend`      | Spend over time                          |
| `get_policy_violations`  | Violations grouped by category           |
| `get_today`              | Server's date — for "last quarter" math  |

## Setup

1. Install the new Python dep:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Add your Anthropic API key to `backend/.env`:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-5   # optional — this is the default
   ```

   Get a key at https://console.anthropic.com.

3. Restart the backend. The widget will auto-detect that the API is
   configured by calling `GET /chat/health`. If the key is missing, the
   widget shows a yellow "not configured" banner instead of erroring.

## Files added

```
backend/app/schemas/chat.py            # request/response Pydantic models
backend/app/services/chat_tools.py     # tool defs + role-filtered DB queries
backend/app/services/chat_service.py   # Anthropic API + tool-use loop
backend/app/routers/chat.py            # POST /chat/message, GET /chat/health
frontend/src/api/chat.ts               # typed API client
frontend/src/components/ChatWidget/ChatWidget.tsx   # floating widget
```

## Files modified

```
backend/app/main.py            # mount chat router
backend/app/config.py          # ANTHROPIC_API_KEY / ANTHROPIC_MODEL settings
backend/requirements.txt       # + anthropic==0.39.0
backend/.env                   # + AI Assistant section (key blank)
frontend/src/components/Layout/AppLayout.tsx   # mount <ChatWidget />
```

## Limits / safeguards

- Conversation history is capped at 40 turns per request.
- Each message is at most 4000 chars.
- The tool-use loop is hard-capped at 8 iterations to prevent runaway costs.
- All data access is JWT-authenticated and role-scoped — same as the rest of
  the app.
- The system prompt instructs the model never to invent data; if a tool
  returns no rows, it must say so plainly.

## Cost notes

A typical question runs 1–3 tool iterations. With `claude-sonnet-4-5`,
that's roughly $0.005–$0.02 per question. Switch `ANTHROPIC_MODEL` to
`claude-haiku-4-5` for ~5x cheaper responses at slightly reduced reasoning
quality.

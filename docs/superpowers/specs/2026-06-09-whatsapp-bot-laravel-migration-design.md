# WhatsApp Auto-Reply Bot → Laravel Migration

**Date:** 2026-06-09
**Status:** Design approved, pending spec review

## Goal

Move the standalone Node WhatsApp auto-reply bot
(`D:\Francis\projects\2026\Eloquent\Solutions\whatsapp-autoreply`) entirely into
the Laravel backend (`backend/`). The Meta-registered webhook URL stays
**unchanged** — the cutover is server-side only (nginx repoint). After this
migration the Node app is decommissioned (process stopped; repo not deleted).

Laravel today only **stores** inbound messages (`WaWebhookController::receive`)
as a passive mirror for bizrezzy chats. It must absorb the full reply brain.

## Non-goals (out of scope)

- **Two-product (Rezzy + Agent Tracker) prompt routing** via the CTWA referral.
  This migration only *captures* the referral so the data is not lost; routing
  logic is a separate later spec ("phase 2").
- **Operator tooling:** the Node dashboard, SSE live log, web-push, PWA, manual
  send/template testers, model-switch UI, and runtime credential editing are all
  dropped. bizrezzy already shows chat threads; notifications are a later,
  separate effort.
- **Voice replies (TTS):** dropped for now. Inbound voice notes are still
  transcribed (Whisper) and answered, but every reply goes out as **text** —
  there is no voice-out. (This matches the Node app's behaviour when TTS is
  disabled.) Can be added back later.
- Cleanup/removal of the now-unused relay endpoints (`persona`, `shop-context`,
  `sales-prompt`, `relay-out`, `relay-transcript`) — they stay in place during
  the migration (harmless) and are removed in a later pass.

## Constraints

- The Meta webhook URL must not change (ads depend on it; do not re-register in
  Meta). Cutover is nginx-only.
- Node and Laravel run on the **same droplet** (confirmed) — nginx can repoint
  the webhook path from Node (`:3001`) to Laravel (php-fpm) locally.
- Live, ad-driven revenue line: the cutover must be instantly reversible.

## Architecture & data flow

```
Meta ──POST──▶ /wa/webhook  (Laravel — FAST synchronous path)
                 1. verify X-Hub-Signature-256 (HMAC-SHA256, app secret)
                 2. dedupe + store inbound message (chats keep working)
                 3. capture CTWA referral onto the contact (first time only)
                 4. dispatch ProcessWhatsAppMessage (database queue)
                 5. return 200   ◀── Meta acknowledged in <1s
                                          │
                                          ▼  (worker)
                 ProcessWhatsAppMessage  (SLOW path)
                 route (sales vs tenant) → resolve credentials →
                 skip reactions/stickers/emoji-only →
                 bare-greeting shortcut (no LLM) →
                 [voice: download + Whisper transcribe → treat as text] →
                 persona + prompt selection →
                 build history from stored wa_messages →
                 Claude reply (+ onboarding tool for leads) →
                 send text via Cloud API → record outbound message
```

The webhook handler does only fast work (verify, store, dispatch). All slow
work (media download, transcription, Claude, TTS, sending) runs in the queued
job on a background worker.

## Components

All new code lives under `backend/`. Mirrors the Node `lib/*` modules so the
port is a faithful 1:1 of proven behaviour.

| Component | Type | Responsibility | Ports from |
|---|---|---|---|
| `WaWebhookController::receive` | change | add signature verify; capture referral; dispatch job. Keep storing inbound for chats. | server.js webhook head |
| `Jobs/ProcessWhatsAppMessage` | new | the full reply pipeline (orchestrator) | server.js POST handler |
| `Services/ClaudeClient` | new | Anthropic Messages API: `reply()` and `agentReply()` (tool use), system-prompt caching | lib/claude.js |
| `Services/Transcriber` | new | OpenAI Whisper transcription; `available()` gate on key | lib/transcribe.js |
| `Services/WhatsAppCloud` | reuse | existing `sendText()` + `downloadMedia()` — no change needed (text-only replies) | lib/whatsapp.js |
| `Services/PersonaResolver` | new | known customer → provider persona; else lead. Extract from existing `persona()`. | lib/personas.js |
| `Services/PromptResolver` | new | active override / provider / default sales prompt + whether onboarding tool is offered | lib/salesPrompt.js |
| `Services/Onboarder` | new | create (or recover) a shop and build the deterministic credentials message | lib/onboard.js |
| `Support/Greetings` | new | bare-greeting detection + canned welcome text | lib/greetings.js |
| `Support/ConversationHistory` | new | build last-N `{role, content}` from stored `wa_messages` | lib/history.js (replaces in-memory) |
| `Support/BotPrompts` | new | the Rezzy sales prompt constant + `providerPrompt($shop, $category)` | server.js + lib/personas.js |

### Routing (sales vs tenant)

- **Sales line** = inbound `phone_number_id` equals `config('services.whatsapp.phone_number_id')` (our own Eloquent number). Runs the lead/sales + onboarding flow, or a known customer's provider persona.
- **Tenant shop** = `WaAccount` lookup by `phone_number_id`. Always that shop's provider persona; never the onboarding tool.
- **Unknown number** = already stored for chats; no reply.

Credentials per request: sales line uses the sales `phone_number_id` + its token —
`config('services.whatsapp.default_token')` if our sales number is under our own
WABA (the common case), otherwise a dedicated `whatsapp.sales_token` env
(plan-time check against the Node `.env`'s `WHATSAPP_TOKEN`). Tenant uses the
`WaAccount` token (falling back to `default_token`).

### Prompts

The two base prompts move into Laravel (`Support/BotPrompts`), because Node — which currently holds them — is going away:
- **Rezzy sales prompt** (the long lead/onboarding persona).
- **Provider prompt** builder (a shop's customer-facing assistant).

`PromptResolver` keeps the existing precedence exactly:
1. An active custom `BotPrompt` override (non-default, `is_active`) → its body, for everyone on the sales line, onboarding tool **off** (live persona test).
2. Else known customer of our shop → provider prompt, tool off.
3. Else lead → Rezzy sales prompt, onboarding tool **on**.

The `bot_prompts` "default = null body" semantics are preserved: a null/absent override means "use the base Rezzy sales prompt from `BotPrompts`". No schema change to `bot_prompts`.

### Conversation history

Node kept the last 10 messages per `(phone_number_id, sender)` in memory (lost on
restart). Laravel rebuilds the same window from the already-stored `wa_messages`
for the contact: `in` → `user`, `out` → `assistant`, using the stored body
(voice notes use their saved transcript). This is strictly better — it survives
restarts and is the single source of truth. Window size keeps the Node value
(10), configurable.

### Voice

- Inbound `audio`/`voice`: job downloads via `WhatsAppCloud::downloadMedia`,
  transcribes with `Transcriber`; the stored inbound message body is updated to
  the transcript (so chats show the words). Then it is answered like text.
- **All replies go out as text** (`sendText`). No voice-out / TTS in this phase.
- If transcription is unavailable or fails, the polite "please type your
  message" fallback is sent (as today).

### Onboarding tool

`ClaudeClient::agentReply` offers the `create_business_account` tool to leads
only. On tool use, `Onboarder` creates (or recovers, by last-9-digit phone
match) the shop and returns a deterministic credentials message — the model
never types IDs/PINs. Internally calls the existing shop-creation path (Shop
model / ShopController logic) and the same recovery lookup that `shop-by-phone`
uses, but in-process instead of over HTTP.

## Config / env (added to `config/services.php`)

```php
'whatsapp' => [
    // existing: verify_token, graph_version, relay_secret, default_token
    'app_secret'      => env('WHATSAPP_APP_SECRET'),       // signature verify
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),  // our sales line
],
'anthropic' => [
    'key'   => env('ANTHROPIC_API_KEY'),
    'model' => env('CLAUDE_MODEL', 'claude-haiku-4-5'),
],
'openai' => [
    'key'           => env('OPENAI_API_KEY'),     // Whisper transcription only
    'whisper_model' => env('WHISPER_MODEL', 'whisper-1'),
],
```

Reuse the same values already in the Node `.env`. When `anthropic.key` is unset
the bot cannot reply (hard requirement); when `openai.key` is unset, voice
transcription is skipped and voice notes get the "please type your message"
fallback (graceful, as today). No TTS config — voice-out is dropped this phase.

## Queue infrastructure

- `QUEUE_CONNECTION=database`; run `php artisan queue:table` + `failed_jobs`
  migration.
- A **systemd** unit on the droplet runs
  `php artisan queue:work --tries=3 --timeout=120 --sleep=1`. Timeout exceeds the
  Claude + Whisper + TTS worst case; `tries=3` gives retry on transient Graph/API
  errors.
- Deploy gains one step after `git pull`: `php artisan queue:restart` so the
  long-running worker reloads new code.
- Failed jobs land in `failed_jobs` for inspection; they never block the webhook
  (which has already returned 200).

## Referral capture (data only)

- Migration: add nullable `referral` JSON column to `wa_contacts`.
- In `receive` (or the job's first-touch), if `messages[].referral` is present
  and the contact has none stored yet, persist `source_id`, `headline`,
  `source_url`, `ctwa_clid`. Captured once; never overwritten.
- No routing behaviour now. This exists solely so phase 2 (two-product routing)
  has the data, since the referral only arrives on the first message and cannot
  be backfilled.

## Cutover plan (Approach A — parallel build, reversible flip)

1. Build the entire pipeline in Laravel behind the **existing** `/wa/webhook`
   route. Node keeps owning Meta's URL throughout — no behaviour change yet.
2. Test before cutover:
   - Unit + feature tests green (see Testing).
   - Replay real captured webhook payloads at the Laravel endpoint on the
     droplet (or staging) and confirm correct replies via `Http::fake` in tests
     and a live test number end-to-end.
3. **Cutover:** edit the nginx server block so the webhook path proxies to
   Laravel (php-fpm) instead of Node (`:3001`); `nginx -t` then reload. Verify
   token and app secret already match the Node values, so Meta sees no change.
4. **Rollback:** revert the nginx block + reload. Node is still running and
   immediately resumes — seconds to undo.
5. After a stable observation period, stop the Node process (systemd/pm2). Do
   **not** delete the Node repo.

Plan-time verification (not yet done): the exact nginx server block / location
for the webhook path, and the Node process manager (pm2 vs systemd).

## Error handling

- **Signature fail** → 403, no processing (new behaviour; today's `receive` does
  not verify).
- **Unknown `phone_number_id`** → store for chats, no reply (unchanged).
- **Claude/Graph/OpenAI failure** → job retries (`tries=3`); exhausted →
  `failed_jobs`; webhook already 200'd so Meta never retry-storms.
- **Transcription failure / unavailable** → polite "please type your message"
  fallback (as today).
- **Relay/mirror semantics** → no longer needed; Laravel records both sides
  directly when it sends.

## Testing

- **Unit:** `Greetings` detection + canned text; `ConversationHistory` mapping;
  `PersonaResolver`; `PromptResolver` precedence; signature verification;
  `Onboarder` credentials-message builder and 422/recover branches.
- **Feature:** `receive` rejects bad signatures, stores + dispatches on good
  ones; `ProcessWhatsAppMessage` produces the correct reply for: lead (sales
  prompt + tool offered), known customer (provider prompt), tenant number, bare
  greeting (no Claude call), voice note (transcribe → **text** reply), active
  override (everyone gets it, no tool). Use `Http::fake` (Graph + Anthropic +
  OpenAI Whisper), `Queue::fake`/`Bus::fake`, and `Storage::fake` for media.
- Existing `BotPromptTest`, `WaChatTest`, `WaWebhook`-related tests stay green.

## Migration order (informs the implementation plan)

1. Config + env wiring; `BotPrompts` support (base prompts).
2. Leaf services: `ClaudeClient`, `Transcriber`, `Greetings`,
   `ConversationHistory`, `PersonaResolver`, `PromptResolver`, `Onboarder` —
   each with unit tests.
3. `ProcessWhatsAppMessage` job wiring the above + feature tests.
4. `receive` changes: signature verify, referral capture, dispatch; queue infra
   (migrations + systemd worker).
5. Cutover (nginx repoint) + observation + Node decommission.

# FULL-mode Talking Avatar ("Video Assistant") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated full-screen "Video Assistant" that lets a customer have a voice conversation with a LiveAvatar FULL-mode talking avatar whose answers come from the existing Rezzy chat brain.

**Architecture:** New frontend screen (eloquent-bookings) connects via `@heygen/liveavatar-web-sdk` to a LiveAvatar FULL-mode session brokered by a new Laravel endpoint (API key stays server-side). LiveAvatar handles ASR + voice + video, but the "thinking" step is routed to a new OpenAI-compatible custom-LLM bridge endpoint that runs the existing `ClaudeClient` brain server-side and streams back the reply. All new files/routes/columns; existing chat, live chat, WhatsApp, and the orb are untouched.

**Tech Stack:** Laravel 11 (PHP 8.2, PHPUnit 11, `Http` facade, `StreamedResponse`), React 18 + Vite + TypeScript (react-router v6, axios), `@heygen/liveavatar-web-sdk`, LiveAvatar FULL mode + custom-LLM.

## Global Constraints

- **Do NOT modify** any of: `backend/app/Jobs/ProcessWaReply.php`, `backend/app/Services/Wa/ClaudeClient.php`, `backend/app/Http/Controllers/ChatController.php`, existing `routes/api.php` chat lines, `eloquent-bookings/src/pages/ShopChat.tsx`, `eloquent-bookings/src/lib/chat.ts`, `eloquent-bookings/src/components/AiCoreOrb.tsx`. Reuse only by calling/importing.
- **Brain reuse is read-only:** the bridge calls `ClaudeClient` (+ `PersonaResolver`, optionally `BookingTools`) and never persists a chat message, sends WhatsApp, or runs TTS. Booking-tool execution uses an isolated `WaContact` with `channel='avatar'` so it never merges into the live-chat (`channel='app'`) thread.
- **Secret hygiene:** `LIVEAVATAR_API_KEY` and `LIVEAVATAR_SESSION_SECRET` never reach the browser. The browser only ever receives a short-lived LiveAvatar session credential.
- **Config keys (exact):** `services.liveavatar.api_key`, `services.liveavatar.base_url` (default `https://api.liveavatar.com`), `services.liveavatar.llm_config_id`, `services.liveavatar.session_secret`, `services.liveavatar.default_avatar_id`, `services.liveavatar.default_voice_id`.
- **Backend tests:** `php artisan test` from `backend/`; use `Http::fake()` and `RefreshDatabase`, mirroring `tests/Feature/LiveChatTest.php`.
- **Frontend env:** API base via `import.meta.env.VITE_API_URL` through `src/lib/api.ts` (axios, auto-injects `X-Device-Id`). New screen styles namespaced `c-avatar-*` in `src/styles/customer.css`. No secrets in frontend.
- **Route label/path (exact):** button label `Video Assistant`; route `/shop/:id/avatar`.
- TDD: write the failing test first, watch it fail, implement minimally, watch it pass, commit. Frequent commits.

## Known external unknowns (verify against live LiveAvatar before/while implementing)

These are LiveAvatar-facing contract details the docs did not fully pin down. Internal logic is fully unit-testable with mocks regardless; the LiveAvatar-facing glue is confirmed by the manual end-to-end task (Task 11).

- Exact token + start request/response field names for FULL mode (`avatar_id`, `voice_id`, `llm_configuration_id`, `system_prompt`, interactivity).
- Exact OpenAI request shape LiveAvatar POSTs to the custom-LLM endpoint, and whether it requires true streaming SSE or accepts a single completion. This plan builds standard OpenAI **streaming** (`chat.completion.chunk` deltas + `data: [DONE]`), which is the safe superset.
- `@heygen/liveavatar-web-sdk` exact init/connect API (package confirmed; method names verified from its README at implementation time).

When a verified detail differs, adjust the request/response mapping in `LiveAvatarClient` (Task 3) and `AvatarLlmController` (Task 6) only — the surrounding structure holds. If the custom-LLM bridge proves unworkable, fall back to Approach C (drop Task 6's brain call; set a rich `system_prompt` from `PersonaResolver` and let LiveAvatar's own LLM answer) — same screen, button, and session flow.

---

## File structure

**Backend (new files):**
- `backend/config/services.php` — *modify*: add `liveavatar` block (additive).
- `backend/database/migrations/2026_06_21_000001_add_avatar_columns_to_shops_table.php` — *create*.
- `backend/app/Services/Avatar/AvatarSessionToken.php` — *create*: sign/verify `{shop_id, device_id}` token.
- `backend/app/Services/Avatar/LiveAvatarClient.php` — *create*: talk to LiveAvatar REST (create session).
- `backend/app/Services/Avatar/AvatarBrain.php` — *create*: read-only wrapper that turns OpenAI messages + session token into a reply string using `PersonaResolver` + `ClaudeClient` (+ `BookingTools`).
- `backend/app/Http/Controllers/AvatarController.php` — *create*: `POST /avatar/shops/{shop}/session`.
- `backend/app/Http/Controllers/AvatarLlmController.php` — *create*: `POST /avatar/llm/chat/completions` (OpenAI SSE bridge).
- `backend/routes/api.php` — *modify*: append new `avatar` routes (do not edit existing lines).
- Tests under `backend/tests/Feature/` and `backend/tests/Unit/`.

**Frontend (new files):**
- `eloquent-bookings/src/lib/avatar.ts` — *create*: `createAvatarSession(shopId)`.
- `eloquent-bookings/src/pages/AvatarCall.tsx` — *create*: the call screen.
- `eloquent-bookings/src/App.tsx` — *modify*: add one route.
- `eloquent-bookings/src/pages/ShopDetail.tsx` — *modify*: add one button in `.c-chat-row`.
- `eloquent-bookings/src/styles/customer.css` — *modify*: append `c-avatar-*` styles.
- `eloquent-bookings/.env.example` — *modify*: document any new optional var (none required; session is brokered).

---

## Task 1: LiveAvatar config block

**Files:**
- Modify: `backend/config/services.php`

**Interfaces:**
- Produces: `config('services.liveavatar.*')` keys listed in Global Constraints.

- [ ] **Step 1: Add the config block**

In `backend/config/services.php`, add alongside the existing `anthropic`/`openai`/`ziina` entries:

```php
'liveavatar' => [
    'api_key'           => env('LIVEAVATAR_API_KEY'),
    'base_url'          => env('LIVEAVATAR_BASE_URL', 'https://api.liveavatar.com'),
    'llm_config_id'     => env('LIVEAVATAR_LLM_CONFIG_ID'),
    'session_secret'    => env('LIVEAVATAR_SESSION_SECRET'),
    'default_avatar_id' => env('LIVEAVATAR_DEFAULT_AVATAR_ID'),
    'default_voice_id'  => env('LIVEAVATAR_DEFAULT_VOICE_ID'),
],
```

- [ ] **Step 2: Document env keys**

Append to `backend/.env.example` (create the lines if the file exists; if not, skip):

```
LIVEAVATAR_API_KEY=
LIVEAVATAR_BASE_URL=https://api.liveavatar.com
LIVEAVATAR_LLM_CONFIG_ID=
LIVEAVATAR_SESSION_SECRET=
LIVEAVATAR_DEFAULT_AVATAR_ID=
LIVEAVATAR_DEFAULT_VOICE_ID=
```

- [ ] **Step 3: Commit**

```bash
git add backend/config/services.php backend/.env.example
git commit -m "feat(avatar): add liveavatar config block"
```

---

## Task 2: Migration — avatar columns on shops

**Files:**
- Create: `backend/database/migrations/2026_06_21_000001_add_avatar_columns_to_shops_table.php`
- Test: `backend/tests/Feature/Avatar/ShopAvatarColumnsTest.php`

**Interfaces:**
- Produces: `shops.avatar_id` (string, nullable), `shops.voice_id` (string, nullable). Both mass-assignable on `Shop`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/Avatar/ShopAvatarColumnsTest.php`:

```php
<?php

namespace Tests\Feature\Avatar;

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopAvatarColumnsTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_persists_avatar_and_voice_ids(): void
    {
        $shop = Shop::factory()->create([
            'avatar_id' => 'av_123',
            'voice_id'  => 'vo_456',
        ]);

        $this->assertSame('av_123', $shop->fresh()->avatar_id);
        $this->assertSame('vo_456', $shop->fresh()->voice_id);
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd backend && php artisan test --filter=ShopAvatarColumnsTest`
Expected: FAIL (unknown column `avatar_id` / not mass-assignable).

- [ ] **Step 3: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('avatar_id')->nullable()->after('persona');
            $table->string('voice_id')->nullable()->after('avatar_id');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['avatar_id', 'voice_id']);
        });
    }
};
```

- [ ] **Step 4: Make the columns mass-assignable**

In `backend/app/Models/Shop.php`, add `'avatar_id'` and `'voice_id'` to the `$fillable` array (if the model uses `$guarded = []` instead, skip this step).

- [ ] **Step 5: Run the test and watch it pass**

Run: `cd backend && php artisan test --filter=ShopAvatarColumnsTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/database/migrations/2026_06_21_000001_add_avatar_columns_to_shops_table.php backend/app/Models/Shop.php backend/tests/Feature/Avatar/ShopAvatarColumnsTest.php
git commit -m "feat(avatar): add nullable avatar_id/voice_id to shops"
```

---

## Task 3: AvatarSessionToken (signed session context)

**Files:**
- Create: `backend/app/Services/Avatar/AvatarSessionToken.php`
- Test: `backend/tests/Unit/Avatar/AvatarSessionTokenTest.php`

**Interfaces:**
- Produces:
  - `AvatarSessionToken::issue(int $shopId, string $deviceId): string` — returns an opaque signed token (base64url `payload.signature`, HMAC-SHA256 over payload with `services.liveavatar.session_secret`).
  - `AvatarSessionToken::verify(string $token): array` — returns `['shop_id' => int, 'device_id' => string]` or throws `InvalidArgumentException` on bad signature.
  - `AvatarSessionToken::MARKER` = `'[[avatar-session:%s]]'` — sprintf template used to embed the token in a system prompt.
  - `AvatarSessionToken::extractFromText(string $text): ?string` — pulls the token out of any text containing the marker, else null.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Unit\Avatar;

use App\Services\Avatar\AvatarSessionToken;
use Tests\TestCase;

class AvatarSessionTokenTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['services.liveavatar.session_secret' => 'unit-secret']);
    }

    public function test_issue_then_verify_roundtrips(): void
    {
        $token = AvatarSessionToken::issue(42, 'dev-abc');
        $this->assertSame(['shop_id' => 42, 'device_id' => 'dev-abc'], AvatarSessionToken::verify($token));
    }

    public function test_tampered_token_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        AvatarSessionToken::verify(AvatarSessionToken::issue(1, 'd') . 'x');
    }

    public function test_extract_from_text_finds_marker(): void
    {
        $token = AvatarSessionToken::issue(7, 'dev-9');
        $sys = "You are helpful.\n" . sprintf(AvatarSessionToken::MARKER, $token);
        $this->assertSame($token, AvatarSessionToken::extractFromText($sys));
        $this->assertNull(AvatarSessionToken::extractFromText('no marker here'));
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd backend && php artisan test --filter=AvatarSessionTokenTest`
Expected: FAIL (class not found).

- [ ] **Step 3: Implement**

```php
<?php

namespace App\Services\Avatar;

use InvalidArgumentException;

class AvatarSessionToken
{
    public const MARKER = '[[avatar-session:%s]]';

    public static function issue(int $shopId, string $deviceId): string
    {
        $payload = self::b64(json_encode(['s' => $shopId, 'd' => $deviceId]));
        return $payload . '.' . self::sign($payload);
    }

    public static function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2 || ! hash_equals(self::sign($parts[0]), $parts[1])) {
            throw new InvalidArgumentException('Invalid avatar session token.');
        }
        $data = json_decode(self::unb64($parts[0]), true);
        if (! is_array($data) || ! isset($data['s'], $data['d'])) {
            throw new InvalidArgumentException('Malformed avatar session token.');
        }
        return ['shop_id' => (int) $data['s'], 'device_id' => (string) $data['d']];
    }

    public static function extractFromText(string $text): ?string
    {
        if (preg_match('/\[\[avatar-session:([^\]]+)\]\]/', $text, $m)) {
            return $m[1];
        }
        return null;
    }

    private static function sign(string $payload): string
    {
        $secret = (string) config('services.liveavatar.session_secret');
        return self::b64(hash_hmac('sha256', $payload, $secret, true));
    }

    private static function b64(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function unb64(string $enc): string
    {
        return base64_decode(strtr($enc, '-_', '+/'));
    }
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `cd backend && php artisan test --filter=AvatarSessionTokenTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Avatar/AvatarSessionToken.php backend/tests/Unit/Avatar/AvatarSessionTokenTest.php
git commit -m "feat(avatar): signed session-context token"
```

---

## Task 4: LiveAvatarClient (session brokering)

**Files:**
- Create: `backend/app/Services/Avatar/LiveAvatarClient.php`
- Test: `backend/tests/Unit/Avatar/LiveAvatarClientTest.php`

**Interfaces:**
- Consumes: `config('services.liveavatar.*')`.
- Produces: `LiveAvatarClient::createSession(array $opts): array` where `$opts` has keys `avatar_id`, `voice_id`, `system_prompt`, and returns the decoded LiveAvatar JSON (passed straight back to the browser). Throws `RuntimeException` if API key missing or LiveAvatar returns non-2xx.

> NOTE: Endpoint paths/field names below follow the documented FULL-mode token+start flow and MUST be reconciled with live LiveAvatar docs in Task 11. Keep all LiveAvatar-specific paths/keys inside this class so adjustments are localized.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Unit\Avatar;

use App\Services\Avatar\LiveAvatarClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LiveAvatarClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.liveavatar.api_key'       => 'la-test',
            'services.liveavatar.base_url'       => 'https://api.liveavatar.com',
            'services.liveavatar.llm_config_id'  => 'llm-cfg-1',
        ]);
    }

    public function test_create_session_sends_avatar_voice_and_llm_config(): void
    {
        Http::fake([
            '*/v1/sessions/token' => Http::response(['token' => 'sess-tok'], 200),
            '*/v1/sessions/start' => Http::response(['session_id' => 'sid', 'livekit' => ['url' => 'wss://x']], 200),
        ]);

        $out = app(LiveAvatarClient::class)->createSession([
            'avatar_id'     => 'av_1',
            'voice_id'      => 'vo_1',
            'system_prompt' => 'be nice',
        ]);

        $this->assertSame('sid', $out['session_id']);
        Http::assertSent(function ($req) {
            return str_contains($req->url(), '/v1/sessions/start')
                && $req['avatar_id'] === 'av_1'
                && $req['voice_id'] === 'vo_1'
                && $req['llm_configuration_id'] === 'llm-cfg-1'
                && str_contains($req['system_prompt'], 'be nice');
        });
    }

    public function test_missing_api_key_throws(): void
    {
        config(['services.liveavatar.api_key' => null]);
        $this->expectException(\RuntimeException::class);
        app(LiveAvatarClient::class)->createSession(['avatar_id' => 'a', 'voice_id' => 'v', 'system_prompt' => 'x']);
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd backend && php artisan test --filter=LiveAvatarClientTest`
Expected: FAIL (class not found).

- [ ] **Step 3: Implement**

```php
<?php

namespace App\Services\Avatar;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class LiveAvatarClient
{
    public function createSession(array $opts): array
    {
        $token = $this->request()->post('/v1/sessions/token', [
            'mode' => 'FULL',
        ])->throw()->json('token');

        $resp = $this->request()->post('/v1/sessions/start', [
            'token'                => $token,
            'avatar_id'            => $opts['avatar_id'],
            'voice_id'             => $opts['voice_id'],
            'llm_configuration_id' => config('services.liveavatar.llm_config_id'),
            'system_prompt'        => $opts['system_prompt'],
            'interactivity'        => 'conversational',
        ])->throw()->json();

        return $resp;
    }

    private function request(): PendingRequest
    {
        $key = config('services.liveavatar.api_key');
        if (empty($key)) {
            throw new RuntimeException('LiveAvatar is not configured (LIVEAVATAR_API_KEY missing).');
        }

        return Http::withToken($key)
            ->baseUrl(rtrim((string) config('services.liveavatar.base_url'), '/'))
            ->acceptJson()
            ->timeout(30);
    }
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `cd backend && php artisan test --filter=LiveAvatarClientTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Avatar/LiveAvatarClient.php backend/tests/Unit/Avatar/LiveAvatarClientTest.php
git commit -m "feat(avatar): LiveAvatarClient session broker"
```

---

## Task 5: AvatarController — session mint endpoint

**Files:**
- Create: `backend/app/Http/Controllers/AvatarController.php`
- Modify: `backend/routes/api.php` (append only)
- Test: `backend/tests/Feature/Avatar/AvatarSessionEndpointTest.php`

**Interfaces:**
- Consumes: `LiveAvatarClient::createSession`, `AvatarSessionToken::issue`, existing `PersonaResolver` (resolve its constructor/method by reading `backend/app/Services/Wa/`), `config('services.liveavatar.default_*')`.
- Produces: `POST /api/avatar/shops/{shop}/session` → 200 JSON = LiveAvatar session creds. Requires `X-Device-Id` header (same contract as ChatController).

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature\Avatar;

use App\Models\Shop;
use App\Services\Avatar\LiveAvatarClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AvatarSessionEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.liveavatar.api_key'           => 'la-test',
            'services.liveavatar.llm_config_id'      => 'cfg',
            'services.liveavatar.session_secret'     => 'sek',
            'services.liveavatar.default_avatar_id'  => 'av_default',
            'services.liveavatar.default_voice_id'   => 'vo_default',
            'services.anthropic.key'                 => 'sk-test',
        ]);
    }

    public function test_session_endpoint_returns_creds_and_uses_shop_avatar(): void
    {
        $shop = Shop::factory()->create(['avatar_id' => 'av_shop', 'voice_id' => 'vo_shop']);

        $mock = Mockery::mock(LiveAvatarClient::class);
        $mock->shouldReceive('createSession')
            ->once()
            ->andReturnUsing(function (array $opts) {
                // shop-level avatar wins over default; token marker present in system prompt
                $this->assertSame('av_shop', $opts['avatar_id']);
                $this->assertSame('vo_shop', $opts['voice_id']);
                $this->assertStringContainsString('[[avatar-session:', $opts['system_prompt']);
                return ['session_id' => 'sid', 'livekit' => ['url' => 'wss://x']];
            });
        $this->app->instance(LiveAvatarClient::class, $mock);

        $res = $this->withHeader('X-Device-Id', 'dev-1')
            ->postJson("/api/avatar/shops/{$shop->id}/session");

        $res->assertOk()->assertJsonPath('session_id', 'sid');
    }

    public function test_missing_device_id_is_rejected(): void
    {
        $shop = Shop::factory()->create();
        $this->postJson("/api/avatar/shops/{$shop->id}/session")->assertStatus(422);
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd backend && php artisan test --filter=AvatarSessionEndpointTest`
Expected: FAIL (route/controller missing).

- [ ] **Step 3: Read PersonaResolver to get its real signature**

Run: open `backend/app/Services/Wa/PersonaResolver.php`. Identify the method that builds the system prompt from a `Shop` (the agent report noted it grounds prompts with shop context + date). Use that exact method below where the placeholder `personaSystemPrompt($shop)` appears.

- [ ] **Step 4: Implement the controller**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\Avatar\AvatarSessionToken;
use App\Services\Avatar\LiveAvatarClient;
use App\Services\Wa\PersonaResolver;
use Illuminate\Http\Request;

class AvatarController extends Controller
{
    public function session(Request $request, Shop $shop, LiveAvatarClient $client, PersonaResolver $persona)
    {
        $deviceId = (string) $request->header('X-Device-Id');
        if ($deviceId === '') {
            return response()->json(['message' => 'X-Device-Id header required'], 422);
        }

        $token = AvatarSessionToken::issue($shop->id, $deviceId);

        // Base persona prompt for safety (LiveAvatar needs non-empty context),
        // plus the signed marker the bridge parses to rebuild authoritative context.
        $base = $persona->systemFor($shop); // <-- replace with PersonaResolver's real method (Step 3)
        $systemPrompt = $base . "\n" . sprintf(AvatarSessionToken::MARKER, $token);

        $creds = $client->createSession([
            'avatar_id'     => $shop->avatar_id ?: config('services.liveavatar.default_avatar_id'),
            'voice_id'      => $shop->voice_id ?: config('services.liveavatar.default_voice_id'),
            'system_prompt' => $systemPrompt,
        ]);

        return response()->json($creds);
    }
}
```

- [ ] **Step 5: Append the route (do not edit existing lines)**

At the end of `backend/routes/api.php`:

```php
// Video Assistant (LiveAvatar FULL mode) — isolated from Live Chat.
Route::post('/avatar/shops/{shop}/session', [\App\Http\Controllers\AvatarController::class, 'session'])
    ->middleware('throttle:20,1');
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `cd backend && php artisan test --filter=AvatarSessionEndpointTest`
Expected: PASS. If `PersonaResolver::systemFor` was the wrong name, fix to the real one and re-run.

- [ ] **Step 7: Commit**

```bash
git add backend/app/Http/Controllers/AvatarController.php backend/routes/api.php backend/tests/Feature/Avatar/AvatarSessionEndpointTest.php
git commit -m "feat(avatar): session mint endpoint"
```

---

## Task 6: AvatarBrain + custom-LLM bridge (OpenAI SSE)

**Files:**
- Create: `backend/app/Services/Avatar/AvatarBrain.php`
- Create: `backend/app/Http/Controllers/AvatarLlmController.php`
- Modify: `backend/routes/api.php` (append only)
- Test: `backend/tests/Feature/Avatar/AvatarLlmBridgeTest.php`

**Interfaces:**
- Consumes: `AvatarSessionToken::verify/extractFromText`, `PersonaResolver`, `App\Services\Wa\ClaudeClient` (`reply(string $system, array $history): string`), `App\Models\Shop`, `App\Models\WaContact` (for booking-tool identity), `App\Services\Wa\BookingTools`.
- Produces:
  - `AvatarBrain::answer(array $openAiMessages): string` — extracts the session token from the system message, resolves the shop, maps the remaining OpenAI messages to Claude history, runs the brain, returns reply text. Throws `InvalidArgumentException` if no valid token.
  - `POST /api/avatar/llm/chat/completions` → `text/event-stream`, OpenAI `chat.completion.chunk` deltas then `data: [DONE]`.

> Booking tools: v1 wires `ClaudeClient::reply()` (knowledge-grounded, no tool execution) to keep the first cut safe and simple. Booking-tool execution via `toolLoop` + an isolated `channel='avatar'` `WaContact` is a fast-follow (see Task 6b) — structured so only `AvatarBrain::answer` changes.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature\Avatar;

use App\Models\Shop;
use App\Services\Avatar\AvatarSessionToken;
use App\Services\Wa\ClaudeClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AvatarLlmBridgeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.liveavatar.session_secret' => 'sek', 'services.anthropic.key' => 'sk-test']);
    }

    public function test_bridge_streams_brain_reply_as_openai_sse(): void
    {
        $shop = Shop::factory()->create();
        $token = AvatarSessionToken::issue($shop->id, 'dev-1');

        $claude = Mockery::mock(ClaudeClient::class);
        $claude->shouldReceive('reply')->once()->andReturn('We open at 9am.');
        $this->app->instance(ClaudeClient::class, $claude);

        $payload = [
            'messages' => [
                ['role' => 'system', 'content' => "ctx\n" . sprintf(AvatarSessionToken::MARKER, $token)],
                ['role' => 'user', 'content' => 'what time do you open?'],
            ],
            'stream' => true,
        ];

        $res = $this->postJson('/api/avatar/llm/chat/completions', $payload);
        $res->assertOk();
        $body = $res->streamedContent();
        $this->assertStringContainsString('"delta"', $body);
        $this->assertStringContainsString('We open at 9am.', $body);
        $this->assertStringContainsString('data: [DONE]', $body);
    }

    public function test_bridge_rejects_request_without_valid_token(): void
    {
        $res = $this->postJson('/api/avatar/llm/chat/completions', [
            'messages' => [['role' => 'user', 'content' => 'hi']],
        ]);
        $res->assertStatus(400);
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd backend && php artisan test --filter=AvatarLlmBridgeTest`
Expected: FAIL (route/class missing).

- [ ] **Step 3: Implement AvatarBrain**

Read `backend/app/Services/Wa/PersonaResolver.php` and `ClaudeClient.php` first to confirm method names; use the real `PersonaResolver` system method (same one as Task 5).

```php
<?php

namespace App\Services\Avatar;

use App\Models\Shop;
use App\Services\Wa\ClaudeClient;
use App\Services\Wa\PersonaResolver;
use InvalidArgumentException;

class AvatarBrain
{
    public function __construct(
        private ClaudeClient $claude,
        private PersonaResolver $persona,
    ) {}

    /** @param array<int,array{role:string,content:mixed}> $messages */
    public function answer(array $messages): string
    {
        $system = collect($messages)->firstWhere('role', 'system')['content'] ?? '';
        $token = AvatarSessionToken::extractFromText(is_string($system) ? $system : '');
        if ($token === null) {
            throw new InvalidArgumentException('Missing avatar session token.');
        }
        $ctx = AvatarSessionToken::verify($token); // throws on tamper
        $shop = Shop::findOrFail($ctx['shop_id']);

        $history = [];
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'system') {
                continue;
            }
            $role = $m['role'] === 'assistant' ? 'assistant' : 'user';
            $history[] = ['role' => $role, 'content' => (string) ($m['content'] ?? '')];
        }

        $prompt = $this->persona->systemFor($shop); // <-- real PersonaResolver method
        return $this->claude->reply($prompt, $history);
    }
}
```

- [ ] **Step 4: Implement the streaming controller**

```php
<?php

namespace App\Http\Controllers;

use App\Services\Avatar\AvatarBrain;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AvatarLlmController extends Controller
{
    public function completions(Request $request, AvatarBrain $brain): StreamedResponse
    {
        try {
            $text = $brain->answer((array) $request->input('messages', []));
        } catch (\InvalidArgumentException $e) {
            // 400 without streaming so a misconfigured session fails fast.
            abort(400, $e->getMessage());
        }

        return response()->stream(function () use ($text) {
            $chunk = [
                'id'      => 'chatcmpl-avatar',
                'object'  => 'chat.completion.chunk',
                'choices' => [[
                    'index' => 0,
                    'delta' => ['role' => 'assistant', 'content' => $text],
                    'finish_reason' => null,
                ]],
            ];
            echo 'data: ' . json_encode($chunk) . "\n\n";

            $done = [
                'id'      => 'chatcmpl-avatar',
                'object'  => 'chat.completion.chunk',
                'choices' => [['index' => 0, 'delta' => new \stdClass(), 'finish_reason' => 'stop']],
            ];
            echo 'data: ' . json_encode($done) . "\n\n";
            echo "data: [DONE]\n\n";
            flush();
        }, 200, [
            'Content-Type'  => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
```

- [ ] **Step 5: Append the route**

At the end of `backend/routes/api.php`:

```php
Route::post('/avatar/llm/chat/completions', [\App\Http\Controllers\AvatarLlmController::class, 'completions'])
    ->middleware('throttle:60,1');
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `cd backend && php artisan test --filter=AvatarLlmBridgeTest`
Expected: PASS. (`streamedContent()` materializes the streamed body for assertions.)

- [ ] **Step 7: Commit**

```bash
git add backend/app/Services/Avatar/AvatarBrain.php backend/app/Http/Controllers/AvatarLlmController.php backend/routes/api.php backend/tests/Feature/Avatar/AvatarLlmBridgeTest.php
git commit -m "feat(avatar): OpenAI-compatible custom-LLM bridge over Rezzy brain"
```

---

## Task 6b (fast-follow, optional): booking tools via isolated avatar contact

**Files:**
- Modify: `backend/app/Services/Avatar/AvatarBrain.php`
- Test: extend `backend/tests/Feature/Avatar/AvatarLlmBridgeTest.php`

**Interfaces:**
- Consumes: `App\Models\WaContact`, `App\Services\Wa\BookingTools` (`defs()`, `execute($shop,$contact,$tool,$input)`), `ClaudeClient::toolLoop`.
- Produces: same `AvatarBrain::answer` signature; internally switches `reply()` → `toolLoop()` with a `channel='avatar'` contact.

- [ ] **Step 1: Write the failing test**

```php
public function test_booking_uses_isolated_avatar_channel_contact(): void
{
    $shop = Shop::factory()->create();
    $token = \App\Services\Avatar\AvatarSessionToken::issue($shop->id, 'dev-7');

    $claude = \Mockery::mock(\App\Services\Wa\ClaudeClient::class);
    $claude->shouldReceive('toolLoop')->once()->andReturn('Booked!');
    $this->app->instance(\App\Services\Wa\ClaudeClient::class, $claude);

    $this->postJson('/api/avatar/llm/chat/completions', [
        'messages' => [
            ['role' => 'system', 'content' => sprintf(\App\Services\Avatar\AvatarSessionToken::MARKER, $token)],
            ['role' => 'user', 'content' => 'book me 3pm tomorrow'],
        ],
    ])->assertOk();

    $contact = \App\Models\WaContact::where('shop_id', $shop->id)
        ->where('device_id', 'dev-7')->where('channel', 'avatar')->first();
    $this->assertNotNull($contact);
    // must NOT have created an 'app' (live-chat) contact
    $this->assertNull(\App\Models\WaContact::where('channel', 'app')->first());
}
```

- [ ] **Step 2: Run it and watch it fail** — `cd backend && php artisan test --filter=AvatarLlmBridgeTest`. Expected: FAIL.

- [ ] **Step 3: Switch AvatarBrain to toolLoop with an isolated contact**

In `AvatarBrain::answer`, after resolving `$ctx`/`$shop`, before returning, replace the `reply()` call with:

```php
$contact = \App\Models\WaContact::firstOrCreate(
    ['shop_id' => $shop->id, 'device_id' => $ctx['device_id'], 'channel' => 'avatar'],
);

$tools = \App\Services\Wa\BookingTools::defs();
return $this->claude->toolLoop(
    $prompt,
    $history,
    $tools,
    fn (string $tool, array $input) => app(\App\Services\Wa\BookingTools::class)->execute($shop, $contact, $tool, $input),
);
```

Inject `BookingTools` only if the resolver needs constructor wiring; otherwise `app()` as above (matches `ProcessWaReply`).

- [ ] **Step 4: Run the test and watch it pass** — Expected: PASS, and the existing `test_bridge_streams_brain_reply_as_openai_sse` must be updated to mock `toolLoop` instead of `reply`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Avatar/AvatarBrain.php backend/tests/Feature/Avatar/AvatarLlmBridgeTest.php
git commit -m "feat(avatar): booking tools via isolated avatar-channel contact"
```

---

## Task 7: Frontend session lib

**Files:**
- Create: `eloquent-bookings/src/lib/avatar.ts`

**Interfaces:**
- Consumes: the shared axios client `src/lib/api.ts` (default export `api`).
- Produces: `createAvatarSession(shopId: string | number): Promise<AvatarSession>` where `AvatarSession` is the raw LiveAvatar creds object (typed loosely as `Record<string, unknown>` plus known fields once verified in Task 11).

- [ ] **Step 1: Implement**

```ts
import api from './api';

export type AvatarSession = {
  session_id?: string;
  livekit?: { url?: string; token?: string };
  [k: string]: unknown;
};

export async function createAvatarSession(shopId: string | number): Promise<AvatarSession> {
  const { data } = await api.post(`/avatar/shops/${shopId}/session`);
  return data as AvatarSession;
}
```

- [ ] **Step 2: Type-check**

Run: `cd eloquent-bookings && npx tsc -b --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add eloquent-bookings/src/lib/avatar.ts
git commit -m "feat(avatar): frontend session lib"
```

---

## Task 8: AvatarCall screen

**Files:**
- Create: `eloquent-bookings/src/pages/AvatarCall.tsx`
- Modify: `eloquent-bookings/src/styles/customer.css` (append `c-avatar-*`)

**Interfaces:**
- Consumes: `createAvatarSession`, `@heygen/liveavatar-web-sdk`, `AiCoreOrb` (import only, unchanged) for the connecting/idle visual, react-router `useParams`/`useNavigate`.
- Produces: default-exported `AvatarCall` React component rendered at `/shop/:id/avatar`.

> The SDK init/connect/stop method names are confirmed against the `@heygen/liveavatar-web-sdk` README at implementation time. The structure below (fetch creds → connect into a video element → End tears down → cleanup on unmount) is what must hold.

- [ ] **Step 1: Install the SDK**

Run: `cd eloquent-bookings && npm install @heygen/liveavatar-web-sdk`

- [ ] **Step 2: Implement the screen**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAvatarSession } from '../lib/avatar';

type Phase = 'connecting' | 'live' | 'mic-denied' | 'error';

export default function AvatarCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<{ stop: () => Promise<void> | void } | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        // Mic permission first — voice conversation requires it.
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) setPhase('mic-denied');
        return;
      }

      try {
        const creds = await createAvatarSession(id!);
        if (cancelled) return;
        // SDK wiring — verify exact API against the package README (Task 11).
        const { LiveAvatar } = await import('@heygen/liveavatar-web-sdk');
        const session = new LiveAvatar({ videoElement: videoRef.current!, ...creds });
        await session.connect();
        sessionRef.current = session;
        if (!cancelled) setPhase('live');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start the assistant.');
          setPhase('error');
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      void sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [id]);

  function endCall() {
    void sessionRef.current?.stop();
    sessionRef.current = null;
    navigate(-1);
  }

  return (
    <div className="c-avatar-stage">
      <video ref={videoRef} className="c-avatar-video" autoPlay playsInline />
      {phase === 'connecting' && <div className="c-avatar-status">Connecting…</div>}
      {phase === 'mic-denied' && (
        <div className="c-avatar-status">Microphone access is needed to talk. Enable it and retry.</div>
      )}
      {phase === 'error' && <div className="c-avatar-status">{error || 'Something went wrong.'}</div>}
      <button className="c-avatar-end" onClick={endCall}>End</button>
    </div>
  );
}
```

- [ ] **Step 3: Append namespaced styles**

In `eloquent-bookings/src/styles/customer.css`:

```css
.c-avatar-stage { position: fixed; inset: 0; background: #000; display: flex; align-items: center; justify-content: center; }
.c-avatar-video { width: 100%; height: 100%; object-fit: cover; }
.c-avatar-status { position: absolute; bottom: 96px; left: 0; right: 0; text-align: center; color: #fff; font-size: 14px; padding: 0 24px; }
.c-avatar-end { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); height: 48px; padding: 0 28px; border-radius: 999px; border: none; background: #e5484d; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
```

- [ ] **Step 4: Type-check**

Run: `cd eloquent-bookings && npx tsc -b --noEmit`
Expected: no new errors. (If the SDK's type for `LiveAvatar` differs, adjust the `new LiveAvatar(...)` call to match its README.)

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/pages/AvatarCall.tsx eloquent-bookings/src/styles/customer.css eloquent-bookings/package.json eloquent-bookings/package-lock.json
git commit -m "feat(avatar): voice-conversation call screen"
```

---

## Task 9: Route + button wiring

**Files:**
- Modify: `eloquent-bookings/src/App.tsx`
- Modify: `eloquent-bookings/src/pages/ShopDetail.tsx`

**Interfaces:**
- Consumes: `AvatarCall` (Task 8).
- Produces: route `/shop/:id/avatar`; a `Video Assistant` button in the existing `.c-chat-row`.

- [ ] **Step 1: Add the route**

In `eloquent-bookings/src/App.tsx`, with the other full-screen routes (outside `MobileLayout`):

```tsx
import AvatarCall from './pages/AvatarCall';
// ...
<Route path="/shop/:id/avatar" element={<AvatarCall />} />
```

- [ ] **Step 2: Add the button**

In `eloquent-bookings/src/pages/ShopDetail.tsx`, inside the existing `.c-chat-row` block, after the Live Chat button (additive — do not change the existing buttons):

```tsx
<button
  className="c-chat-btn"
  onClick={() => navigate(`/shop/${shop.id}/avatar`)}
>
  Video Assistant
</button>
```

- [ ] **Step 3: Type-check + build**

Run: `cd eloquent-bookings && npx tsc -b --noEmit && npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add eloquent-bookings/src/App.tsx eloquent-bookings/src/pages/ShopDetail.tsx
git commit -m "feat(avatar): Video Assistant button + route"
```

---

## Task 10: Backend regression sweep

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && php artisan test`
Expected: all tests pass, including the pre-existing `LiveChatTest` and `ProcessWaReplyTest` (proves the existing chat path is undisturbed).

- [ ] **Step 2: If anything unrelated fails**, stop and investigate before proceeding — the avatar work must not have touched existing behaviour.

---

## Task 11: One-time LiveAvatar setup + manual end-to-end (human-in-the-loop)

**Files:** none (ops + manual verification). This is where the external unknowns get reconciled.

- [ ] **Step 1: Provision LiveAvatar**
  - In the LiveAvatar dashboard (app.liveavatar.com): get the API key → set `LIVEAVATAR_API_KEY`.
  - Register the API key for custom-LLM (returns `secret_id`); create ONE LLM configuration with `base_url = https://api.eloquentservice.com/api/avatar/llm` and `model_name` of your choice; set `LIVEAVATAR_LLM_CONFIG_ID`.
  - Pick/create an avatar + voice; set `LIVEAVATAR_DEFAULT_AVATAR_ID` / `LIVEAVATAR_DEFAULT_VOICE_ID`.
  - Set a random `LIVEAVATAR_SESSION_SECRET`.

- [ ] **Step 2: Verify the LiveAvatar contract against live docs/dashboard**
  - Confirm the token/start endpoint paths and field names used in `LiveAvatarClient` (Task 4). Adjust there if different.
  - Confirm the exact OpenAI request LiveAvatar sends to `/avatar/llm/chat/completions` (run a real session and inspect logs). Confirm streaming chunk format is accepted; adjust `AvatarLlmController` (Task 6) if needed.
  - Confirm `@heygen/liveavatar-web-sdk` init/connect/stop method names; adjust `AvatarCall` (Task 8).

- [ ] **Step 3: Seed a test shop avatar** (optional) — set `avatar_id`/`voice_id` on one shop, or rely on defaults.

- [ ] **Step 4: End-to-end on a real device**
  - Open a shop → tap **Video Assistant** → allow mic → speak "what time do you open?" → confirm the avatar answers using real shop knowledge.
  - Tap **End** → confirm the session tears down (no lingering credit usage).
  - Open **Live Chat** for the same shop → confirm it still works and the avatar conversation did NOT appear in the live-chat thread.

- [ ] **Step 5: Note results** in the PR description (what was verified, any contract adjustments made).

---

## Self-review notes (author)

- Spec coverage: isolation guarantees (Global Constraints + Tasks touch only new files/append-only routes), per-salon avatar (Task 2 + Task 5 fallback), Rezzy brain reuse read-only (Tasks 6/6b), voice conversation (Task 8 mic-first), cost guardrails (End button + unmount teardown in Task 8; idle timeout deferred — see below), error handling (Task 8 phases + Task 6 400), testing (Tasks 2–6, 10), data/config (Tasks 1–2).
- **Idle timeout** from the spec is not yet a coded task; it depends on SDK event hooks confirmed in Task 11. Add it as a small follow-up after the SDK API is known (listen for silence/disconnect events → call `endCall`). Flagged rather than silently dropped.
- Type consistency: `AvatarSessionToken` methods, `LiveAvatarClient::createSession`, `AvatarBrain::answer`, and `createAvatarSession` names match across tasks. `PersonaResolver::systemFor` is a placeholder to be replaced with the resolver's real method name (called out in Tasks 5 & 6).
- Fallback to Approach C is documented in "Known external unknowns".
```

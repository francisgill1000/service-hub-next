# Owner Voice Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A floating voice assistant in the admin app that lets non-technical shop owners ask business questions (and perform actions) by voice, in English or Arabic, with spoken + written answers grounded in their own shop's live data.

**Architecture:** A synchronous Laravel endpoint runs one turn inline — transcribe (Whisper) → Claude tool-loop scoped to the authenticated shop → synthesize speech (OpenAI TTS) — returning transcript + answer text + answer audio. The admin PWA mounts a mic FAB on every screen that opens a voice panel; conversation history is held client-side and echoed each turn (stateless server).

**Tech Stack:** Laravel 12 (PHP 8.4), Sanctum auth, existing `Transcriber`/`Speech`/`ClaudeClient`/`ReportsAggregator` services; React + Vite + TypeScript admin PWA, `MediaRecorder`, axios.

## Global Constraints

- Backend: PHP 8.4, Laravel 12; tests use `php artisan test`.
- All assistant data access is scoped to `$request->user()` (the authenticated Shop via Sanctum). Never trust a client-supplied shop id. This is intentionally stricter than the existing `ReportsController` (which trusts `?shop_id=`).
- Currency is **AED**; spoken answers say "dirhams", never use markdown/tables.
- Language: reply in the **same language the owner spoke** (English or Arabic), auto-detected by Whisper.
- Mutations (`cancel_booking`, `update_booking_status`, `update_hours`, `update_service_price`) MUST NOT execute until the owner confirms in a later turn (conversational confirm-gate driven by the system prompt).
- Reuse existing services; do not re-implement transcription, TTS, Claude, or report aggregation.
- Audio replies are stored on the `public` disk under `assistant/{shopId}/` and returned as URLs via `Storage::disk('public')->url(...)`.
- Frontend `VITE_API_URL` already configured; the axios client (`lib/api.ts`) attaches the Bearer token automatically.

---

## Phase 1 — Backend reporting (read-only)

### Task 1: Period resolver

**Files:**
- Create: `backend/app/Support/Assistant/PeriodResolver.php`
- Test: `backend/tests/Unit/PeriodResolverTest.php`

**Interfaces:**
- Produces: `PeriodResolver::resolve(string $period, ?Carbon $now = null): array` → `[Carbon $from /*startOfDay*/, Carbon $to /*endOfDay*/]`.

- [ ] **Step 1: Write the failing test**

```php
<?php
namespace Tests\Unit;

use App\Support\Assistant\PeriodResolver;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PeriodResolverTest extends TestCase
{
    public function test_this_month_spans_the_calendar_month(): void
    {
        $now = Carbon::parse('2026-06-27 12:00:00');
        [$from, $to] = PeriodResolver::resolve('this_month', $now);
        $this->assertSame('2026-06-01 00:00:00', $from->toDateTimeString());
        $this->assertSame('2026-06-30 23:59:59', $to->toDateTimeString());
    }

    public function test_today_spans_one_day(): void
    {
        $now = Carbon::parse('2026-06-27 12:00:00');
        [$from, $to] = PeriodResolver::resolve('today', $now);
        $this->assertSame('2026-06-27 00:00:00', $from->toDateTimeString());
        $this->assertSame('2026-06-27 23:59:59', $to->toDateTimeString());
    }

    public function test_unknown_period_defaults_to_this_month(): void
    {
        $now = Carbon::parse('2026-06-27 12:00:00');
        [$from, $to] = PeriodResolver::resolve('garbage', $now);
        $this->assertSame('2026-06-01 00:00:00', $from->toDateTimeString());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=PeriodResolverTest`
Expected: FAIL — class `App\Support\Assistant\PeriodResolver` not found.

- [ ] **Step 3: Write minimal implementation**

```php
<?php
namespace App\Support\Assistant;

use Illuminate\Support\Carbon;

/**
 * Maps a spoken period word ("this month", normalized by the model to
 * "this_month") to a concrete [from, to] date range for the reporting tools.
 */
class PeriodResolver
{
    /** @return array{0: Carbon, 1: Carbon} */
    public static function resolve(string $period, ?Carbon $now = null): array
    {
        $now = $now ? $now->copy() : Carbon::now();
        return match ($period) {
            'today'      => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'yesterday'  => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay()],
            'this_week'  => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'this_month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'last_month' => [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->subMonthNoOverflow()->endOfMonth()],
            'this_year'  => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            default      => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=PeriodResolverTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Support/Assistant/PeriodResolver.php backend/tests/Unit/PeriodResolverTest.php
git commit -m "feat(assistant): period resolver for reporting tools"
```

---

### Task 2: Read tools (`OwnerAssistantTools`)

**Files:**
- Create: `backend/app/Services/Assistant/OwnerAssistantTools.php`
- Test: `backend/tests/Feature/OwnerAssistantToolsTest.php`

**Interfaces:**
- Consumes: `PeriodResolver::resolve()`, `App\Services\Reports\ReportsAggregator` (`revenueSummary/staffSummary/servicesSummary/timePatternsSummary(int $shopId, Carbon $from, Carbon $to): array`).
- Produces:
  - `OwnerAssistantTools::defs(): array` — Anthropic tool schemas (read tools in Phase 1).
  - `(new OwnerAssistantTools($aggregator))->execute(Shop $shop, string $tool, array $input): string` — JSON string result, scoped to `$shop->id`.

- [ ] **Step 1: Write the failing test**

Uses the existing local laundry seeders so figures are deterministic. (`LocalLaundryShopSeeder` creates shop #1; `LocalDemoBookingsSeeder` fills the current month.)

```php
<?php
namespace Tests\Feature;

use App\Models\Shop;
use App\Services\Assistant\OwnerAssistantTools;
use App\Services\Reports\ReportsAggregator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerAssistantToolsTest extends TestCase
{
    use RefreshDatabase;

    private function tools(): OwnerAssistantTools
    {
        return new OwnerAssistantTools(app(ReportsAggregator::class));
    }

    private function seedShopWithBooking(): Shop
    {
        $shop = Shop::create([
            'name' => 'Test Laundry', 'shop_code' => '9001', 'pin' => '0000',
            'status' => 'active', 'category_id' => 11,
        ]);
        \DB::table('bookings')->insert([
            'shop_id' => $shop->id, 'date' => now()->toDateString(),
            'start_time' => '10:00', 'end_time' => '10:30', 'status' => 'completed',
            'charges' => 50, 'discount_amount' => 0,
            'services' => json_encode([['id' => 1, 'title' => 'Wash & Fold', 'price' => '50.00']]),
            'booking_reference' => 'BK90001', 'customer_name' => 'Test Cust',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return $shop;
    }

    public function test_get_revenue_returns_this_shop_total(): void
    {
        $shop = $this->seedShopWithBooking();
        $out = json_decode($this->tools()->execute($shop, 'get_revenue', ['period' => 'this_month']), true);
        $this->assertSame(50, (int) $out['kpis']['gross_revenue']);
        $this->assertSame(1, (int) $out['kpis']['total_bookings']);
    }

    public function test_get_bookings_filters_by_status_and_scopes_to_shop(): void
    {
        $shop = $this->seedShopWithBooking();
        $other = Shop::create(['name' => 'Other', 'shop_code' => '9002', 'pin' => '0', 'status' => 'active', 'category_id' => 11]);
        \DB::table('bookings')->insert([
            'shop_id' => $other->id, 'date' => now()->toDateString(),
            'start_time' => '11:00', 'end_time' => '11:30', 'status' => 'completed',
            'charges' => 999, 'discount_amount' => 0, 'services' => '[]',
            'booking_reference' => 'BK90099', 'customer_name' => 'Leak',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $out = json_decode($this->tools()->execute($shop, 'get_bookings', ['period' => 'this_month', 'status' => 'completed'], ), true);

        $this->assertSame(1, $out['count']);
        $refs = array_column($out['bookings'], 'reference');
        $this->assertContains('BK90001', $refs);
        $this->assertNotContains('BK90099', $refs); // never sees the other shop
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=OwnerAssistantToolsTest`
Expected: FAIL — class `App\Services\Assistant\OwnerAssistantTools` not found.

- [ ] **Step 3: Write minimal implementation**

```php
<?php
namespace App\Services\Assistant;

use App\Models\Shop;
use App\Services\Reports\ReportsAggregator;
use App\Support\Assistant\PeriodResolver;
use Illuminate\Support\Facades\DB;

/**
 * Tools the owner voice assistant can call. Every method is scoped to the
 * passed-in $shop — the controller passes the authenticated shop, so cross-shop
 * access is impossible. defs() returns Anthropic tool schemas; execute() runs
 * one tool and returns a JSON string for the tool-result message.
 */
class OwnerAssistantTools
{
    public function __construct(protected ReportsAggregator $aggregator) {}

    public static function defs(): array
    {
        $period = [
            'type' => 'string',
            'enum' => ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year'],
            'description' => 'Time range for the report.',
        ];

        return [
            [
                'name' => 'get_revenue',
                'description' => 'Total revenue, booking counts (completed/cancelled), average booking value and top services for a period. Use for "how much did I make".',
                'input_schema' => ['type' => 'object', 'properties' => ['period' => $period], 'required' => ['period']],
            ],
            [
                'name' => 'get_top_services',
                'description' => 'Most-booked services ranked by count and revenue for a period.',
                'input_schema' => ['type' => 'object', 'properties' => ['period' => $period], 'required' => ['period']],
            ],
            [
                'name' => 'get_staff_performance',
                'description' => 'Per-staff bookings, revenue and completion/cancellation rates for a period.',
                'input_schema' => ['type' => 'object', 'properties' => ['period' => $period], 'required' => ['period']],
            ],
            [
                'name' => 'get_busy_times',
                'description' => 'Busiest days of week and hours for a period.',
                'input_schema' => ['type' => 'object', 'properties' => ['period' => $period], 'required' => ['period']],
            ],
            [
                'name' => 'get_bookings',
                'description' => 'List bookings for a specific date OR a period, optionally filtered by status. Returns a count and up to 8 bookings.',
                'input_schema' => ['type' => 'object', 'properties' => [
                    'date' => ['type' => 'string', 'description' => 'A single date, YYYY-MM-DD. Optional.'],
                    'period' => $period,
                    'status' => ['type' => 'string', 'enum' => ['booked', 'completed', 'cancelled', 'queued']],
                ]],
            ],
        ];
    }

    public function execute(Shop $shop, string $tool, array $input): string
    {
        $result = match ($tool) {
            'get_revenue'           => $this->revenue($shop, $input),
            'get_top_services'      => $this->aggregatorFor($shop, $input, 'servicesSummary'),
            'get_staff_performance' => $this->aggregatorFor($shop, $input, 'staffSummary'),
            'get_busy_times'        => $this->aggregatorFor($shop, $input, 'timePatternsSummary'),
            'get_bookings'          => $this->bookings($shop, $input),
            default                 => ['error' => "unknown tool {$tool}"],
        };

        return json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    protected function revenue(Shop $shop, array $input): array
    {
        [$from, $to] = PeriodResolver::resolve($input['period'] ?? 'this_month');
        return $this->aggregator->revenueSummary($shop->id, $from, $to);
    }

    protected function aggregatorFor(Shop $shop, array $input, string $method): array
    {
        [$from, $to] = PeriodResolver::resolve($input['period'] ?? 'this_month');
        return $this->aggregator->{$method}($shop->id, $from, $to);
    }

    protected function bookings(Shop $shop, array $input): array
    {
        $q = DB::table('bookings')->where('shop_id', $shop->id);

        if (!empty($input['date'])) {
            $q->whereDate('date', $input['date']);
        } else {
            [$from, $to] = PeriodResolver::resolve($input['period'] ?? 'this_month');
            $q->whereBetween('date', [$from->toDateString(), $to->toDateString()]);
        }
        if (!empty($input['status'])) {
            $q->where('status', $input['status']);
        }

        $count = (clone $q)->count();
        $rows = $q->orderBy('date')->orderBy('start_time')->limit(8)->get();

        return [
            'count' => $count,
            'shown' => $rows->count(),
            'bookings' => $rows->map(fn ($b) => [
                'reference' => $b->booking_reference,
                'date' => $b->date,
                'time' => substr((string) $b->start_time, 0, 5),
                'customer' => $b->customer_name,
                'status' => $b->status,
                'charges' => (float) $b->charges,
            ])->all(),
        ];
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=OwnerAssistantToolsTest`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Assistant/OwnerAssistantTools.php backend/tests/Feature/OwnerAssistantToolsTest.php
git commit -m "feat(assistant): read-only reporting tools (revenue, services, staff, busy times, bookings)"
```

---

### Task 3: System-prompt builder

**Files:**
- Create: `backend/app/Support/Assistant/AssistantPrompt.php`
- Test: `backend/tests/Feature/AssistantPromptTest.php`

**Interfaces:**
- Produces: `AssistantPrompt::for(Shop $shop): string`.

- [ ] **Step 1: Write the failing test**

```php
<?php
namespace Tests\Feature;

use App\Models\Shop;
use App\Support\Assistant\AssistantPrompt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssistantPromptTest extends TestCase
{
    use RefreshDatabase;

    public function test_prompt_includes_shop_name_currency_and_confirm_rule(): void
    {
        $shop = Shop::create(['name' => 'FreshPress Laundry', 'shop_code' => '1001', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        $prompt = AssistantPrompt::for($shop);

        $this->assertStringContainsString('FreshPress Laundry', $prompt);
        $this->assertStringContainsString('dirhams', $prompt);
        $this->assertStringContainsString(now()->toDateString(), $prompt);
        $this->assertStringContainsString('confirm', strtolower($prompt));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=AssistantPromptTest`
Expected: FAIL — class not found.

- [ ] **Step 3: Write minimal implementation**

```php
<?php
namespace App\Support\Assistant;

use App\Models\Shop;
use Illuminate\Support\Facades\DB;

/** Builds the owner-assistant system prompt for one shop. */
class AssistantPrompt
{
    public static function for(Shop $shop): string
    {
        $today = now()->toDateString();
        $services = DB::table('catalogs')->where('shop_id', $shop->id)->pluck('title')->implode(', ') ?: 'none yet';
        $staff = DB::table('staff')->where('shop_id', $shop->id)->pluck('name')->implode(', ') ?: 'none';

        return <<<PROMPT
        You are the business assistant for "{$shop->name}", a service business. You help the OWNER (not customers) understand and run their business by voice.

        Today is {$today}. Currency is AED — say "dirhams" out loud, never a currency symbol.
        Services offered: {$services}.
        Staff: {$staff}.

        RULES:
        - The owner may speak English or Arabic. Always reply in the SAME language they used.
        - Keep answers short and natural for a voice note. No markdown, no tables, no bullet lists — speak in sentences. Summarize long lists ("your top service was Wash & Fold with 12 bookings").
        - Use the tools to get real numbers. Never invent figures.
        - For any change (cancelling a booking, changing a status, hours or prices): FIRST say exactly what you will change and ask the owner to confirm. Only call the changing tool AFTER the owner says yes in their next message. If they don't clearly confirm, do not make the change.
        - If a request is ambiguous (e.g. which booking), ask a brief clarifying question.
        PROMPT;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=AssistantPromptTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Support/Assistant/AssistantPrompt.php backend/tests/Feature/AssistantPromptTest.php
git commit -m "feat(assistant): owner system-prompt builder"
```

---

### Task 4: Controller + routes (text endpoint first)

**Files:**
- Create: `backend/app/Http/Controllers/OwnerAssistantController.php`
- Modify: `backend/routes/api.php` (add routes inside a new `auth:sanctum` group)
- Test: `backend/tests/Feature/OwnerAssistantControllerTest.php`

**Interfaces:**
- Consumes: `OwnerAssistantTools`, `AssistantPrompt`, `ClaudeClient::toolLoop()`, `Transcriber`, `Speech`.
- Produces routes:
  - `POST /api/shop/assistant/text` → `{ reply_text, reply_audio_url, history }`
  - `POST /api/shop/assistant/voice` → `{ transcript, reply_text, reply_audio_url, history }`
- Request: `text` (string) or `audio` (file); `history` (JSON array of `{role, content}`).

- [ ] **Step 1: Write the failing test**

Fakes the three external HTTP services so no real API is hit.

```php
<?php
namespace Tests\Feature;

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OwnerAssistantControllerTest extends TestCase
{
    use RefreshDatabase;

    private function authShop(): Shop
    {
        $shop = Shop::create(['name' => 'FreshPress', 'shop_code' => '1001', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        Sanctum::actingAs($shop, ['*']);
        return $shop;
    }

    public function test_text_endpoint_returns_reply_and_audio_url(): void
    {
        Storage::fake('public');
        $this->authShop();
        Http::fake([
            'api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => 'You made 50 dirhams today.']]]),
            'api.openai.com/v1/audio/speech' => Http::response('FAKE_OGG_BYTES', 200),
        ]);

        $res = $this->postJson('/api/shop/assistant/text', ['text' => 'how much today', 'history' => []]);

        $res->assertCreated()
            ->assertJsonPath('reply_text', 'You made 50 dirhams today.')
            ->assertJsonStructure(['reply_text', 'reply_audio_url', 'history']);
        $this->assertNotNull($res->json('reply_audio_url'));
    }

    public function test_text_endpoint_requires_auth(): void
    {
        $res = $this->postJson('/api/shop/assistant/text', ['text' => 'hi']);
        $res->assertUnauthorized();
    }

    public function test_voice_endpoint_transcribes_then_replies(): void
    {
        Storage::fake('public');
        $this->authShop();
        Http::fake([
            'api.openai.com/v1/audio/transcriptions' => Http::response(['text' => 'how much today']),
            'api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => 'Fifty dirhams.']]]),
            'api.openai.com/v1/audio/speech' => Http::response('FAKE_OGG_BYTES', 200),
        ]);

        $audio = UploadedFile::fake()->create('voice.webm', 10, 'audio/webm');
        $res = $this->post('/api/shop/assistant/voice', ['audio' => $audio, 'history' => '[]']);

        $res->assertCreated()
            ->assertJsonPath('transcript', 'how much today')
            ->assertJsonPath('reply_text', 'Fifty dirhams.');
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=OwnerAssistantControllerTest`
Expected: FAIL — route `/api/shop/assistant/text` not found (404/405).

- [ ] **Step 3: Write minimal implementation**

Controller:

```php
<?php
namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\Assistant\OwnerAssistantTools;
use App\Services\Wa\ClaudeClient;
use App\Services\Wa\Speech;
use App\Services\Wa\Transcriber;
use App\Support\Assistant\AssistantPrompt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Owner voice/text assistant. Synchronous: one request = one turn. Scoped to
 * the authenticated shop ($request->user()). History is client-held and echoed
 * back each turn (stateless server).
 */
class OwnerAssistantController extends Controller
{
    public function __construct(
        protected OwnerAssistantTools $tools,
        protected ClaudeClient $claude,
        protected Speech $speech,
        protected Transcriber $transcriber,
    ) {}

    public function text(Request $request)
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'max:2000'],
            'history' => ['sometimes'],
        ]);
        $history = $this->parseHistory($data['history'] ?? []);
        return $this->respond($request->user(), $data['text'], $history);
    }

    public function voice(Request $request)
    {
        $request->validate([
            'audio' => ['required', 'file', 'max:25600'], // 25MB
            'history' => ['sometimes'],
        ]);
        $file = $request->file('audio');
        $transcript = null;
        try {
            $transcript = $this->transcriber->transcribe(
                file_get_contents($file->getRealPath()),
                $file->getMimeType() ?: 'audio/webm'
            );
        } catch (\Throwable $e) {
            Log::warning('assistant transcription failed: ' . $e->getMessage());
        }

        if (!$transcript) {
            return response()->json([
                'transcript' => '',
                'reply_text' => "Sorry, I didn't catch that — please try again.",
                'reply_audio_url' => null,
                'history' => $this->parseHistory($request->input('history', [])),
            ], 201);
        }

        $history = $this->parseHistory($request->input('history', []));
        return $this->respond($request->user(), $transcript, $history, $transcript);
    }

    /** @param array<int, array{role:string, content:string}> $history */
    protected function respond(Shop $shop, string $userText, array $history, ?string $transcript = null)
    {
        $messages = array_merge($history, [['role' => 'user', 'content' => $userText]]);

        $replyText = '';
        try {
            $replyText = $this->claude->toolLoop(
                AssistantPrompt::for($shop),
                $messages,
                OwnerAssistantTools::defs(),
                fn (string $tool, array $input) => $this->tools->execute($shop, $tool, $input),
            );
        } catch (\Throwable $e) {
            Log::error('assistant reply failed: ' . $e->getMessage());
        }
        $replyText = $replyText !== '' ? $replyText : "Sorry, I couldn't work that out — please try again.";

        $audioUrl = null;
        if ($this->speech->available()) {
            try {
                $bytes = $this->speech->synthesize($replyText);
                $path = "assistant/{$shop->id}/reply-" . uniqid() . '.ogg';
                Storage::disk('public')->put($path, $bytes);
                $audioUrl = Storage::disk('public')->url($path);
            } catch (\Throwable $e) {
                Log::warning('assistant tts failed: ' . $e->getMessage());
            }
        }

        $newHistory = array_merge($messages, [['role' => 'assistant', 'content' => $replyText]]);

        return response()->json([
            'transcript' => $transcript ?? $userText,
            'reply_text' => $replyText,
            'reply_audio_url' => $audioUrl,
            'history' => $newHistory,
        ], 201);
    }

    /** Accepts a JSON string or an array; returns a clean role/content list. */
    protected function parseHistory(mixed $raw): array
    {
        $arr = is_string($raw) ? (json_decode($raw, true) ?: []) : (is_array($raw) ? $raw : []);
        return collect($arr)
            ->filter(fn ($m) => isset($m['role'], $m['content']) && in_array($m['role'], ['user', 'assistant'], true))
            ->map(fn ($m) => ['role' => $m['role'], 'content' => (string) $m['content']])
            ->values()->all();
    }
}
```

Routes — add to `backend/routes/api.php` (place near the other `auth:sanctum` groups):

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/shop/assistant/text',  [\App\Http\Controllers\OwnerAssistantController::class, 'text']);
    Route::post('/shop/assistant/voice', [\App\Http\Controllers\OwnerAssistantController::class, 'voice']);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=OwnerAssistantControllerTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Controllers/OwnerAssistantController.php backend/routes/api.php backend/tests/Feature/OwnerAssistantControllerTest.php
git commit -m "feat(assistant): voice + text endpoints (shop-scoped, synchronous)"
```

---

## Phase 2 — Backend mutations (confirm-gated)

### Task 5: Write tools + confirm-gate

**Files:**
- Modify: `backend/app/Services/Assistant/OwnerAssistantTools.php` (add write tool defs + methods)
- Test: `backend/tests/Feature/OwnerAssistantMutationTest.php`

**Interfaces:**
- Adds defs: `cancel_booking{reference}`, `update_booking_status{reference,status}`, `update_hours{day_of_week,start_time,end_time}`, `update_service_price{catalog_id?,service_title?,price}`.
- The confirm-gate is enforced by the system prompt (Task 3), exercised end-to-end in Task 6. This task verifies the tools mutate correctly when called.

- [ ] **Step 1: Write the failing test**

```php
<?php
namespace Tests\Feature;

use App\Models\Shop;
use App\Services\Assistant\OwnerAssistantTools;
use App\Services\Reports\ReportsAggregator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OwnerAssistantMutationTest extends TestCase
{
    use RefreshDatabase;

    private function tools(): OwnerAssistantTools
    {
        return new OwnerAssistantTools(app(ReportsAggregator::class));
    }

    public function test_cancel_booking_sets_status_and_is_shop_scoped(): void
    {
        $shop = Shop::create(['name' => 'A', 'shop_code' => '1', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        DB::table('bookings')->insert([
            'shop_id' => $shop->id, 'date' => now()->toDateString(), 'start_time' => '10:00',
            'end_time' => '10:30', 'status' => 'booked', 'charges' => 10, 'discount_amount' => 0,
            'services' => '[]', 'booking_reference' => 'BK00001', 'customer_name' => 'X',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $out = json_decode($this->tools()->execute($shop, 'cancel_booking', ['reference' => 'BK00001']), true);

        $this->assertTrue($out['cancelled']);
        $this->assertSame('cancelled', DB::table('bookings')->where('booking_reference', 'BK00001')->value('status'));
    }

    public function test_cancel_booking_unknown_reference_returns_error(): void
    {
        $shop = Shop::create(['name' => 'A', 'shop_code' => '1', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        $out = json_decode($this->tools()->execute($shop, 'cancel_booking', ['reference' => 'NOPE']), true);
        $this->assertArrayHasKey('error', $out);
    }

    public function test_update_service_price_changes_catalog(): void
    {
        $shop = Shop::create(['name' => 'A', 'shop_code' => '1', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        $id = DB::table('catalogs')->insertGetId([
            'shop_id' => $shop->id, 'title' => 'Wash & Fold', 'price' => 12,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $out = json_decode($this->tools()->execute($shop, 'update_service_price', ['catalog_id' => $id, 'price' => 15]), true);

        $this->assertTrue($out['updated']);
        $this->assertEquals(15, DB::table('catalogs')->where('id', $id)->value('price'));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=OwnerAssistantMutationTest`
Expected: FAIL — `cancel_booking` falls into `default` → returns `{"error":"unknown tool cancel_booking"}`, assertions fail.

- [ ] **Step 3: Write minimal implementation**

Add the write defs to the `defs()` return array (append after `get_bookings`):

```php
            [
                'name' => 'cancel_booking',
                'description' => 'Cancel one booking by reference. Only call after the owner has confirmed in their previous message.',
                'input_schema' => ['type' => 'object', 'properties' => [
                    'reference' => ['type' => 'string', 'description' => 'Booking reference, e.g. BK00001'],
                ], 'required' => ['reference']],
            ],
            [
                'name' => 'update_booking_status',
                'description' => 'Set a booking status. Only call after the owner has confirmed.',
                'input_schema' => ['type' => 'object', 'properties' => [
                    'reference' => ['type' => 'string'],
                    'status' => ['type' => 'string', 'enum' => ['booked', 'completed', 'cancelled', 'queued']],
                ], 'required' => ['reference', 'status']],
            ],
            [
                'name' => 'update_hours',
                'description' => 'Set opening hours for one weekday (0=Sunday..6=Saturday). Only call after the owner has confirmed.',
                'input_schema' => ['type' => 'object', 'properties' => [
                    'day_of_week' => ['type' => 'integer', 'description' => '0=Sunday .. 6=Saturday'],
                    'start_time' => ['type' => 'string', 'description' => 'HH:MM 24h'],
                    'end_time' => ['type' => 'string', 'description' => 'HH:MM 24h'],
                ], 'required' => ['day_of_week', 'start_time', 'end_time']],
            ],
            [
                'name' => 'update_service_price',
                'description' => 'Change a service price. Identify the service by catalog_id (preferred) or service_title. Only call after the owner has confirmed.',
                'input_schema' => ['type' => 'object', 'properties' => [
                    'catalog_id' => ['type' => 'integer'],
                    'service_title' => ['type' => 'string'],
                    'price' => ['type' => 'number'],
                ], 'required' => ['price']],
            ],
```

Add the matching cases to `execute()`'s `match` (before `default`):

```php
            'cancel_booking'        => $this->cancelBooking($shop, $input),
            'update_booking_status' => $this->updateStatus($shop, $input),
            'update_hours'          => $this->updateHours($shop, $input),
            'update_service_price'  => $this->updatePrice($shop, $input),
```

Add the methods to the class:

```php
    protected function cancelBooking(Shop $shop, array $input): array
    {
        $n = DB::table('bookings')
            ->where('shop_id', $shop->id)
            ->where('booking_reference', $input['reference'] ?? '')
            ->update(['status' => 'cancelled', 'updated_at' => now()]);
        return $n ? ['cancelled' => true, 'reference' => $input['reference']]
                  : ['error' => 'No booking with that reference in your shop.'];
    }

    protected function updateStatus(Shop $shop, array $input): array
    {
        $n = DB::table('bookings')
            ->where('shop_id', $shop->id)
            ->where('booking_reference', $input['reference'] ?? '')
            ->update(['status' => $input['status'], 'updated_at' => now()]);
        return $n ? ['updated' => true, 'reference' => $input['reference'], 'status' => $input['status']]
                  : ['error' => 'No booking with that reference in your shop.'];
    }

    protected function updateHours(Shop $shop, array $input): array
    {
        DB::table('shop_working_hours')->updateOrInsert(
            ['shop_id' => $shop->id, 'day_of_week' => (int) $input['day_of_week']],
            ['start_time' => $input['start_time'] . ':00', 'end_time' => $input['end_time'] . ':00', 'slot_duration' => 30, 'updated_at' => now(), 'created_at' => now()]
        );
        return ['updated' => true, 'day_of_week' => (int) $input['day_of_week']];
    }

    protected function updatePrice(Shop $shop, array $input): array
    {
        $q = DB::table('catalogs')->where('shop_id', $shop->id);
        if (!empty($input['catalog_id'])) {
            $q->where('id', (int) $input['catalog_id']);
        } elseif (!empty($input['service_title'])) {
            $q->where('title', $input['service_title']);
        } else {
            return ['error' => 'Tell me which service to reprice.'];
        }
        $n = $q->update(['price' => $input['price'], 'updated_at' => now()]);
        return $n ? ['updated' => true, 'price' => $input['price']]
                  : ['error' => 'No matching service in your shop.'];
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=OwnerAssistantMutationTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Assistant/OwnerAssistantTools.php backend/tests/Feature/OwnerAssistantMutationTest.php
git commit -m "feat(assistant): confirm-gated write tools (cancel, status, hours, price)"
```

---

### Task 6: Confirm-gate end-to-end test

**Files:**
- Test: `backend/tests/Feature/OwnerAssistantConfirmGateTest.php`

**Interfaces:**
- Consumes: the `/api/shop/assistant/text` endpoint and a faked Anthropic that, on the FIRST turn, returns a clarifying/confirmation text (no tool_use), and on the SECOND turn returns a `tool_use` for `cancel_booking`.

- [ ] **Step 1: Write the failing test**

```php
<?php
namespace Tests\Feature;

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OwnerAssistantConfirmGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_mutation_only_runs_after_confirmation_turn(): void
    {
        Storage::fake('public');
        $shop = Shop::create(['name' => 'A', 'shop_code' => '1', 'pin' => '1', 'status' => 'active', 'category_id' => 11]);
        Sanctum::actingAs($shop, ['*']);
        DB::table('bookings')->insert([
            'shop_id' => $shop->id, 'date' => now()->toDateString(), 'start_time' => '10:00',
            'end_time' => '10:30', 'status' => 'booked', 'charges' => 10, 'discount_amount' => 0,
            'services' => '[]', 'booking_reference' => 'BK00001', 'customer_name' => 'X',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // Turn 1: model asks for confirmation (no tool_use). TTS faked.
        Http::fake([
            'api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => 'Cancel BK00001? Say yes to confirm.']]]),
            'api.openai.com/v1/audio/speech' => Http::response('OGG', 200),
        ]);
        $r1 = $this->postJson('/api/shop/assistant/text', ['text' => 'cancel BK00001', 'history' => []]);
        $r1->assertCreated();
        $this->assertSame('booked', DB::table('bookings')->where('booking_reference', 'BK00001')->value('status')); // NOT cancelled yet

        // Turn 2: owner confirms; model now calls the tool, then summarizes.
        Http::fake([
            'api.anthropic.com/*' => Http::sequence()
                ->push(['content' => [['type' => 'tool_use', 'id' => 'tu1', 'name' => 'cancel_booking', 'input' => ['reference' => 'BK00001']]]])
                ->push(['content' => [['type' => 'text', 'text' => 'Done, BK00001 is cancelled.']]]),
            'api.openai.com/v1/audio/speech' => Http::response('OGG', 200),
        ]);
        $r2 = $this->postJson('/api/shop/assistant/text', ['text' => 'yes', 'history' => $r1->json('history')]);
        $r2->assertCreated()->assertJsonPath('reply_text', 'Done, BK00001 is cancelled.');
        $this->assertSame('cancelled', DB::table('bookings')->where('booking_reference', 'BK00001')->value('status'));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=OwnerAssistantConfirmGateTest`
Expected: FAIL initially only if anything in Tasks 4–5 is wired wrong; if those are correct this should PASS. (It documents/locks the behavior.)

- [ ] **Step 3: Implementation**

No new code — this test exercises Tasks 4 + 5. If it fails, fix the wiring there.

- [ ] **Step 4: Run the full assistant suite**

Run: `php artisan test --filter=OwnerAssistant`
Expected: PASS (all assistant tests).

- [ ] **Step 5: Commit**

```bash
git add backend/tests/Feature/OwnerAssistantConfirmGateTest.php
git commit -m "test(assistant): confirm-gate enforced across two turns"
```

---

## Phase 3 — Admin frontend

### Task 7: API client + types

**Files:**
- Create: `admin/src/lib/assistant.ts`
- Test: `admin/src/lib/assistant.test.ts`

**Interfaces:**
- Produces:
  - `type AssistantTurn = { role: 'user' | 'assistant'; content: string }`
  - `type AssistantReply = { transcript: string; reply_text: string; reply_audio_url: string | null; history: AssistantTurn[] }`
  - `postText(text: string, history: AssistantTurn[]): Promise<AssistantReply>`
  - `postVoice(audio: Blob, history: AssistantTurn[]): Promise<AssistantReply>`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { postText, postVoice } from './assistant';

vi.mock('./api');

describe('assistant lib', () => {
  beforeEach(() => vi.resetAllMocks());

  it('postText sends text + history and returns the reply', async () => {
    (api.post as unknown as vi.Mock).mockResolvedValue({
      data: { transcript: 'hi', reply_text: 'hello', reply_audio_url: '/x.ogg', history: [] },
    });
    const out = await postText('hi', []);
    expect(api.post).toHaveBeenCalledWith('/shop/assistant/text', { text: 'hi', history: [] });
    expect(out.reply_text).toBe('hello');
  });

  it('postVoice posts multipart form data', async () => {
    (api.post as unknown as vi.Mock).mockResolvedValue({
      data: { transcript: 'q', reply_text: 'a', reply_audio_url: null, history: [] },
    });
    const blob = new Blob(['x'], { type: 'audio/webm' });
    await postVoice(blob, []);
    const [url, form] = (api.post as unknown as vi.Mock).mock.calls[0];
    expect(url).toBe('/shop/assistant/voice');
    expect(form).toBeInstanceOf(FormData);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `admin/`): `npx vitest run src/lib/assistant.test.ts`
Expected: FAIL — `./assistant` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import api from './api';

export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply = {
  transcript: string;
  reply_text: string;
  reply_audio_url: string | null;
  history: AssistantTurn[];
};

export async function postText(text: string, history: AssistantTurn[]): Promise<AssistantReply> {
  const { data } = await api.post('/shop/assistant/text', { text, history });
  return data;
}

export async function postVoice(audio: Blob, history: AssistantTurn[]): Promise<AssistantReply> {
  const form = new FormData();
  const ext = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'mp4' : 'webm';
  form.append('audio', audio, `voice.${ext}`);
  form.append('history', JSON.stringify(history));
  const { data } = await api.post('/shop/assistant/voice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (in `admin/`): `npx vitest run src/lib/assistant.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add admin/src/lib/assistant.ts admin/src/lib/assistant.test.ts
git commit -m "feat(admin): assistant API client"
```

---

### Task 8: Recorder hook

**Files:**
- Create: `admin/src/hooks/useRecorder.ts`

**Interfaces:**
- Produces: `useRecorder(): { recording: boolean; start(): Promise<void>; stop(): Promise<Blob | null>; supported: boolean }`.

(Extracted from the proven `eloquent-bookings/src/pages/ShopChat.tsx` recorder; no test — it wraps the browser `MediaRecorder` API which jsdom does not implement. It is exercised manually and via the panel.)

- [ ] **Step 1: Write the hook**

```ts
import { useRef, useState } from 'react';

function pickMime(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return undefined;
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined';

  async function start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec) { resolve(null); return; }
      rec.onstop = () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setRecording(false);
        resolve(blob.size > 0 ? blob : null);
      };
      rec.stop();
    });
  }

  return { recording, start, stop, supported };
}
```

- [ ] **Step 2: Commit**

```bash
git add admin/src/hooks/useRecorder.ts
git commit -m "feat(admin): MediaRecorder hook for the voice assistant"
```

---

### Task 9: Voice panel component

**Files:**
- Create: `admin/src/components/VoiceAssistantPanel.tsx`
- Test: `admin/src/components/VoiceAssistantPanel.test.tsx`
- Modify: `admin/src/styles/mobile.css` (append panel styles)

**Interfaces:**
- Consumes: `postText`, `postVoice`, `AssistantTurn` (Task 7); `useRecorder` (Task 8).
- Produces: `export function VoiceAssistantPanel({ onClose }: { onClose: () => void })`.

- [ ] **Step 1: Write the failing test**

Mocks the lib and the recorder so no browser APIs are needed; verifies a typed question renders the assistant reply bubble.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

vi.mock('@/lib/assistant', () => ({
  postText: vi.fn().mockResolvedValue({ transcript: 'hi', reply_text: 'You made 50 dirhams.', reply_audio_url: null, history: [] }),
  postVoice: vi.fn(),
}));
vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: () => ({ recording: false, start: vi.fn(), stop: vi.fn(), supported: true }),
}));

describe('VoiceAssistantPanel', () => {
  it('shows the assistant reply after a typed question', async () => {
    render(<VoiceAssistantPanel onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/type/i), { target: { value: 'how much' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByText('You made 50 dirhams.')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `admin/`): `npx vitest run src/components/VoiceAssistantPanel.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { useRef, useState } from 'react';
import { Icons } from '@/components/Icons';
import { postText, postVoice, type AssistantTurn } from '@/lib/assistant';
import { useRecorder } from '@/hooks/useRecorder';

export function VoiceAssistantPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<AssistantTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const { recording, start, stop, supported } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playReply(url: string | null) {
    if (!url) return;
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.src = url;
    void a.play().catch(() => undefined);
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setBusy(true); setError('');
    setHistory((h) => [...h, { role: 'user', content: text }]);
    try {
      const res = await postText(text, history);
      setHistory(res.history);
      playReply(res.reply_audio_url);
    } catch { setError('Could not reach the assistant.'); }
    finally { setBusy(false); setDraft(''); }
  }

  async function toggleMic() {
    if (recording) {
      setBusy(true);
      const blob = await stop();
      if (!blob) { setBusy(false); return; }
      setHistory((h) => [...h, { role: 'user', content: '🎤 …' }]);
      try {
        const res = await postVoice(blob, history);
        setHistory(res.history);
        playReply(res.reply_audio_url);
      } catch { setError('Could not reach the assistant.'); }
      finally { setBusy(false); }
    } else {
      setError('');
      try { await start(); } catch { setError('Microphone permission needed.'); }
    }
  }

  return (
    <div className="va-overlay" role="dialog" aria-label="Voice assistant">
      <div className="va-panel">
        <div className="va-head">
          <span className="va-title">Ask about your business</span>
          <button className="c-icon-btn" aria-label="Close" onClick={onClose}><Icons.ChevronLeft size={18} /></button>
        </div>

        <div className="va-thread">
          {history.length === 0 && <p className="va-hint">Tap the mic and ask, e.g. “How much did I make this month?”</p>}
          {history.map((m, i) => (
            <div key={i} className={`va-bubble ${m.role === 'user' ? 'va-user' : 'va-ai'}`}>{m.content}</div>
          ))}
          {error && <div className="c-error-box">{error}</div>}
        </div>

        <div className="va-controls">
          <input className="va-input" placeholder="Type a question…" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send(draft); }} disabled={busy} />
          <button className="c-btn" aria-label="Send" disabled={busy || !draft.trim()} onClick={() => void send(draft)}>
            <Icons.Send size={16} />
          </button>
          {supported && (
            <button className={`va-mic ${recording ? 'recording' : ''}`} aria-label="Microphone" disabled={busy && !recording} onClick={() => void toggleMic()}>
              <Icons.Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

Append to `admin/src/styles/mobile.css`:

```css
/* Voice assistant */
.va-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.45); display: flex; align-items: flex-end; }
.va-panel { width: 100%; max-height: 78dvh; display: flex; flex-direction: column; background: var(--surface-1); border-top-left-radius: 18px; border-top-right-radius: 18px; border: 1px solid var(--border-1); }
.va-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-1); }
.va-title { font-weight: 800; color: var(--text-1); }
.va-thread { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.va-hint { color: var(--text-3); font-size: 13px; text-align: center; margin: auto 0; }
.va-bubble { max-width: 84%; padding: 9px 12px; border-radius: 14px; font-size: 14px; line-height: 1.4; }
.va-user { align-self: flex-end; background: var(--mint-300); color: #04110c; }
.va-ai { align-self: flex-start; background: var(--surface-2); color: var(--text-1); }
.va-controls { display: flex; align-items: center; gap: 8px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--border-1); }
.va-input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-1); border-radius: 999px; padding: 10px 14px; color: var(--text-1); font: inherit; font-size: 14px; outline: none; }
.va-mic { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--text-1); border: 1px solid var(--border-1); }
.va-mic.recording { background: var(--danger); color: #fff; animation: va-pulse 1.2s ease-in-out infinite; }
@keyframes va-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.5); } 50% { box-shadow: 0 0 0 8px rgba(248,113,113,0); } }
```

Note: if `Icons.Mic` / `Icons.Send` are not yet exported, add them in `admin/src/components/Icons.tsx` from `lucide-react` (`Mic`, `Send`) following the existing export pattern in that file.

- [ ] **Step 4: Run test to verify it passes**

Run (in `admin/`): `npx vitest run src/components/VoiceAssistantPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add admin/src/components/VoiceAssistantPanel.tsx admin/src/components/VoiceAssistantPanel.test.tsx admin/src/styles/mobile.css admin/src/components/Icons.tsx
git commit -m "feat(admin): voice assistant panel"
```

---

### Task 10: Floating FAB + mount on every screen

**Files:**
- Create: `admin/src/components/VoiceAssistantFab.tsx`
- Modify: `admin/src/layout/MobileLayout.tsx` (mount the FAB inside `.mobile-app`)
- Modify: `admin/src/styles/mobile.css` (FAB styles)
- Test: `admin/src/components/VoiceAssistantFab.test.tsx`

**Interfaces:**
- Consumes: `VoiceAssistantPanel` (Task 9).
- Produces: `export function VoiceAssistantFab()` — renders a mic button; toggles the panel.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceAssistantFab } from './VoiceAssistantFab';

vi.mock('./VoiceAssistantPanel', () => ({
  VoiceAssistantPanel: ({ onClose }: { onClose: () => void }) => <div data-testid="panel" onClick={onClose}>panel</div>,
}));

describe('VoiceAssistantFab', () => {
  it('opens the panel when tapped', () => {
    render(<VoiceAssistantFab />);
    expect(screen.queryByTestId('panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /assistant/i }));
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `admin/`): `npx vitest run src/components/VoiceAssistantFab.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { useState } from 'react';
import { Icons } from '@/components/Icons';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

export function VoiceAssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="va-fab" aria-label="Voice assistant" onClick={() => setOpen(true)}>
        <Icons.Mic size={22} />
      </button>
      {open && <VoiceAssistantPanel onClose={() => setOpen(false)} />}
    </>
  );
}
```

Mount in `admin/src/layout/MobileLayout.tsx` — import it and render inside `.mobile-app`, before the tabbar:

```tsx
import { VoiceAssistantFab } from '@/components/VoiceAssistantFab';
// ...
  return (
    <div className="mobile-app">
      <main className="mobile-main"><Outlet /></main>
      <VoiceAssistantFab />
      <div className="m-tabbar">
        {/* unchanged */}
      </div>
    </div>
  );
```

Append FAB styles to `admin/src/styles/mobile.css`:

```css
.va-fab {
  position: fixed; right: 16px; bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  width: 54px; height: 54px; border-radius: 50%; z-index: 55;
  display: grid; place-items: center; color: #04110c;
  background: var(--mint-300); border: none;
  box-shadow: 0 8px 22px -6px var(--mint-glow), 0 0 0 1px rgba(0,0,0,0.05);
}
.va-fab:active { transform: scale(0.96); }
```

- [ ] **Step 4: Run test to verify it passes**

Run (in `admin/`): `npx vitest run src/components/VoiceAssistantFab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full check + commit**

Run (in `admin/`): `npx tsc -b && npx vitest run`
Expected: typecheck clean, all tests pass.

```bash
git add admin/src/components/VoiceAssistantFab.tsx admin/src/components/VoiceAssistantFab.test.tsx admin/src/layout/MobileLayout.tsx admin/src/styles/mobile.css
git commit -m "feat(admin): floating voice assistant button on every screen"
```

---

## Final verification

- [ ] Backend: `php artisan test --filter=OwnerAssistant && php artisan test --filter=PeriodResolver` → all pass.
- [ ] Admin: `npx tsc -b && npx vitest run` → clean.
- [ ] Manual (via `start-local.bat`): log in (1001/1234), tap the mic FAB, ask "how much did I make this month?" → hear + see "571 dirhams" answer; ask "cancel BK00027" → assistant asks to confirm → say "yes" → booking cancelled. Try the same in Arabic.

## Notes for the implementer

- The storage URL needs the public symlink: ensure `php artisan storage:link` has been run once locally (it likely has, since chat voice notes already use the public disk).
- Filament/queue not involved — this feature is fully synchronous.
- Phase 1 (Tasks 1–4) is independently shippable (read-only assistant). Phase 2 (Tasks 5–6) adds mutations. Phase 3 (Tasks 7–10) is the UI; the text endpoint makes the UI testable even before voice hardware.

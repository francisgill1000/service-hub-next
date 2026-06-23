# App-aware AI Assistant — Implementation Plan (Plan A: core)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the customer app's AI page from a single-shot service finder into a multi-turn, app-aware assistant that answers about the user's favourites, bookings, account and the shop catalogue, and can navigate anywhere and sign the user in or up.

**Architecture:** A server-side Claude tool loop replaces the single classify call in `AiController`. A new `AssistantAgent` service drives the loop over `ClaudeClient`; `AssistantTools` defines and executes the tools. **Read tools** (favourites, bookings, account, shops, categories) run server-side and are device-scoped via `X-Device-Id` (logged-in `User` only needed for `get_account`). **Action tools** (`navigate`, `register`, `login`) short-circuit the loop and return an `action` directive the React app executes; auth submission reuses the existing `/login` `/register` endpoints so passwords never reach the LLM.

**Tech Stack:** Laravel (PHP 8.3) + Anthropic Messages API (`claude-haiku-4-5`); Vite + React + TypeScript + react-router-dom; axios; Vitest + Testing Library; PHPUnit feature tests.

## Global Constraints

- Backend runs **PHP 8.3** on the API host; do not use 8.4-only syntax.
- LLM model id comes from `config('services.anthropic.model')` (default `claude-haiku-4-5`); key from `config('services.anthropic.key')`. Never hardcode.
- Reuse the existing `App\Services\Wa\ClaudeClient` for HTTP/caching; do **not** add an Anthropic SDK.
- Dates/times are **Asia/Dubai** (`Carbon::now('Asia/Dubai')`).
- Favourites and bookings are **device-scoped** by the `X-Device-Id` request header. There is **no Customer model** — a logged-in customer is a `User` resolved via `auth:sanctum` / `$request->user()`.
- The `POST /ai/search` route, its `throttle:30,1` middleware, and the public (no-auth) access stay unchanged.
- Keep replies to **one or two short, friendly sentences** (matches current UX/copy).
- Frontend uses the `@/` path alias and the shared `api` axios instance (auto-attaches `X-Device-Id` + Bearer). Tests run under Vitest with jsdom.
- This plan is **Plan A**. Booking mutation tools (`create_booking`/`cancel_booking`/`reschedule_booking`) are explicitly **out of scope** here and handled in a follow-up Plan B.

---

## File Structure

**Backend (create):**
- `backend/app/Services/Ai/AssistantTools.php` — tool definitions + read-tool execution (device-scoped); stashes shop payloads for card rendering.
- `backend/app/Services/Ai/AssistantAgent.php` — the tool loop; returns `['reply', 'action', 'shops', 'categories']`.
- `backend/tests/Feature/AssistantToolsTest.php` — per-tool data tests.
- `backend/tests/Feature/AssistantAgentTest.php` — loop + action short-circuit tests (faked Claude HTTP).

**Backend (modify):**
- `backend/app/Services/Wa/ClaudeClient.php` — add a public `raw()` passthrough to the private `request()`.
- `backend/app/Http/Controllers/AiController.php` — `search()` now runs `AssistantAgent`; keeps `categories()` and the shop-shaping helpers.

**Frontend (create):**
- `eloquent-bookings/src/components/AuthInline.tsx` — inline password form for conversational auth.
- `eloquent-bookings/src/lib/ai.test.ts`, `src/context/VoiceSearchContext.test.tsx`, `src/components/AuthInline.test.tsx` — tests.

**Frontend (modify):**
- `eloquent-bookings/src/lib/ai.ts` — multi-turn request + `action` in response types.
- `eloquent-bookings/src/context/VoiceSearchContext.tsx` — send thread history; execute `navigate`; attach `auth` payload to messages.
- `eloquent-bookings/src/pages/AI.tsx` — render `AuthInline` for messages carrying an `auth` payload.

---

## Phase 1 — Backend

### Task 1: Expose a raw Claude turn on `ClaudeClient`

The assistant loop needs the full decoded response per turn (text + every `tool_use` block with ids) so it can echo tool calls back and detect action tools. `toolLoop()` hides that and `agentReply()` collapses to one block. Add a thin public passthrough; leave existing methods untouched.

**Files:**
- Modify: `backend/app/Services/Wa/ClaudeClient.php`
- Test: `backend/tests/Feature/AssistantAgentTest.php` (covers it indirectly in Task 3)

**Interfaces:**
- Produces: `ClaudeClient::raw(string $system, array $messages, array $tools = []): array` — returns the decoded Anthropic response (`['content' => [...], ...]`).

- [ ] **Step 1: Add the method**

In `backend/app/Services/Wa/ClaudeClient.php`, add directly above the private `request()` method:

```php
    /**
     * One raw Anthropic turn — full decoded response (text + tool_use blocks
     * with ids). The assistant agent drives its own loop over this.
     *
     * @param array<int, array{role: string, content: mixed}> $messages
     * @param array<int, array<string, mixed>> $tools
     * @return array<string, mixed>
     */
    public function raw(string $system, array $messages, array $tools = []): array
    {
        return $this->request($system, $messages, $tools);
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Services/Wa/ClaudeClient.php
git commit -m "feat(ai): expose raw() turn on ClaudeClient for the assistant loop"
```

---

### Task 2: `AssistantTools` — definitions + read-tool execution

One class owns the tool schemas and executes the read tools, device-scoped. Action tools (`navigate`/`register`/`login`) are declared here but are **not** executed server-side — the agent detects them and returns directives (Task 3). `search_shops`/`get_shop`/`list_favourites` stash full shop payloads in `collectedShops()` so the controller can keep rendering `ShopCard`s.

**Files:**
- Create: `backend/app/Services/Ai/AssistantTools.php`
- Test: `backend/tests/Feature/AssistantToolsTest.php`

**Interfaces:**
- Consumes: `App\Support\ServiceCategories`, `App\Models\Shop`, `App\Models\Booking`, `App\Models\GuestFavourite`.
- Produces:
  - `new AssistantTools(string $deviceId, ?User $user, ?float $lat, ?float $lon)`
  - `AssistantTools::defs(): array` — Anthropic tool schemas (read + action).
  - `AssistantTools::ACTION_TOOLS` (const `['navigate','register','login']`).
  - `executeRead(string $name, array $input): string` — JSON string result for the model.
  - `collectedShops(): \Illuminate\Support\Collection` — full shop rows gathered this run.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/AssistantToolsTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GuestFavourite;
use App\Models\Shop;
use App\Models\User;
use App\Services\Ai\AssistantTools;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssistantToolsTest extends TestCase
{
    use RefreshDatabase;

    private function tools(string $device = 'dev-1', ?User $user = null): AssistantTools
    {
        return new AssistantTools($device, $user, null, null);
    }

    public function test_list_categories_returns_only_categories_with_shops(): void
    {
        Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false, 'category_id' => 1]);

        $json = $this->tools()->executeRead('list_categories', []);
        $data = json_decode($json, true);

        $names = array_column($data['categories'], 'name');
        $this->assertContains('Barber', $names);
    }

    public function test_list_favourites_is_device_scoped(): void
    {
        $mine = Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false]);
        $other = Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false]);
        GuestFavourite::create(['device_id' => 'dev-1', 'shop_id' => $mine->id]);
        GuestFavourite::create(['device_id' => 'dev-2', 'shop_id' => $other->id]);

        $data = json_decode($this->tools('dev-1')->executeRead('list_favourites', []), true);

        $ids = array_column($data['favourites'], 'id');
        $this->assertEquals([$mine->id], $ids);
    }

    public function test_list_bookings_is_device_scoped_and_filters_scope(): void
    {
        $shop = Shop::factory()->create();
        $upcoming = Booking::factory()->create([
            'shop_id' => $shop->id, 'device_id' => 'dev-1',
            'date' => now('Asia/Dubai')->addDay()->toDateString(), 'status' => 'booked',
        ]);
        Booking::factory()->create([
            'shop_id' => $shop->id, 'device_id' => 'dev-2',
            'date' => now('Asia/Dubai')->addDay()->toDateString(), 'status' => 'booked',
        ]);

        $data = json_decode($this->tools('dev-1')->executeRead('list_bookings', ['scope' => 'upcoming']), true);

        $refs = array_column($data['bookings'], 'reference');
        $this->assertEquals([$upcoming->booking_reference], $refs);
    }

    public function test_get_account_signals_not_logged_in_for_guest(): void
    {
        $data = json_decode($this->tools()->executeRead('get_account', []), true);
        $this->assertFalse($data['logged_in']);
    }

    public function test_get_account_returns_profile_when_logged_in(): void
    {
        $user = User::factory()->create(['name' => 'Aisha', 'phone' => '0501234567']);
        $data = json_decode($this->tools('dev-1', $user)->executeRead('get_account', []), true);

        $this->assertTrue($data['logged_in']);
        $this->assertEquals('Aisha', $data['name']);
    }

    public function test_search_shops_stashes_full_shop_rows(): void
    {
        Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false, 'category_id' => 1, 'name' => 'Sharp Cuts']);

        $tools = $this->tools();
        $tools->executeRead('search_shops', ['category_id' => 1]);

        $this->assertSame('Sharp Cuts', $tools->collectedShops()->first()->name);
    }

    public function test_defs_include_read_and_action_tools(): void
    {
        $names = array_column(AssistantTools::defs(), 'name');
        foreach (['list_favourites', 'list_bookings', 'get_account', 'search_shops', 'get_shop', 'list_categories', 'navigate', 'register', 'login'] as $expected) {
            $this->assertContains($expected, $names);
        }
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=AssistantToolsTest`
Expected: FAIL — `Class "App\Services\Ai\AssistantTools" not found`.

- [ ] **Step 3: Implement `AssistantTools`**

Create `backend/app/Services/Ai/AssistantTools.php`:

```php
<?php

namespace App\Services\Ai;

use App\Models\Booking;
use App\Models\GuestFavourite;
use App\Models\Shop;
use App\Models\User;
use App\Support\ServiceCategories;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Tools for the customer in-app assistant. Read tools run here, device-scoped
 * by X-Device-Id (only get_account needs a logged-in User). Action tools
 * (navigate/register/login) are declared but executed by the client; the agent
 * detects them and returns a directive instead of calling executeRead().
 */
class AssistantTools
{
    public const ACTION_TOOLS = ['navigate', 'register', 'login'];

    private Collection $collected;

    public function __construct(
        private string $deviceId,
        private ?User $user = null,
        private ?float $lat = null,
        private ?float $lon = null,
    ) {
        $this->collected = collect();
    }

    /** Full shop rows gathered by search_shops/get_shop/list_favourites this run. */
    public function collectedShops(): Collection
    {
        return $this->collected;
    }

    public static function defs(): array
    {
        $routes = '"/", "/explore", "/near-me", "/ai", "/favourites", "/bookings", "/account", "/login", "/register", or "/shop/{id}"';

        return [
            ['name' => 'list_categories', 'description' => 'List the service categories that currently have shops, with a count each.', 'input_schema' => ['type' => 'object', 'properties' => (object) []]],
            ['name' => 'search_shops', 'description' => 'Search active shops. Filter by free-text query and/or a category id (1-10). Set near=true to rank by distance from the user (only works if their location is known).', 'input_schema' => ['type' => 'object', 'properties' => [
                'query' => ['type' => 'string', 'description' => 'Free text, e.g. a shop or service name'],
                'category_id' => ['type' => 'integer', 'description' => 'A category id 1-10'],
                'near' => ['type' => 'boolean', 'description' => 'Rank by distance from the user'],
            ]]],
            ['name' => 'get_shop', 'description' => 'Get one shop with its services and working hours.', 'input_schema' => ['type' => 'object', 'properties' => [
                'shop_id' => ['type' => 'integer'],
            ], 'required' => ['shop_id']]],
            ['name' => 'list_favourites', 'description' => "List the shops this user has favourited.", 'input_schema' => ['type' => 'object', 'properties' => (object) []]],
            ['name' => 'list_bookings', 'description' => "List this user's bookings. scope is 'upcoming', 'history', or 'all'.", 'input_schema' => ['type' => 'object', 'properties' => [
                'scope' => ['type' => 'string', 'enum' => ['upcoming', 'history', 'all']],
            ]]],
            ['name' => 'get_account', 'description' => "Get the signed-in user's account details. Returns logged_in:false if they are a guest.", 'input_schema' => ['type' => 'object', 'properties' => (object) []]],

            ['name' => 'navigate', 'description' => "Take the user to an app screen. route is one of {$routes}.", 'input_schema' => ['type' => 'object', 'properties' => [
                'route' => ['type' => 'string', 'description' => "One of {$routes}"],
            ], 'required' => ['route']]],
            ['name' => 'register', 'description' => 'Start creating an account. Collect the name and phone in conversation first; the user types their password on a secure field (never ask for the password).', 'input_schema' => ['type' => 'object', 'properties' => [
                'name' => ['type' => 'string'],
                'phone' => ['type' => 'string'],
            ]]],
            ['name' => 'login', 'description' => 'Start signing the user in. Collect the phone in conversation first; the user types their password on a secure field (never ask for the password).', 'input_schema' => ['type' => 'object', 'properties' => [
                'phone' => ['type' => 'string'],
            ]]],
        ];
    }

    /** Execute a read tool; always returns a JSON string for the model. */
    public function executeRead(string $name, array $input): string
    {
        $result = match ($name) {
            'list_categories' => $this->listCategories(),
            'search_shops' => $this->searchShops($input),
            'get_shop' => $this->getShop($input),
            'list_favourites' => $this->listFavourites(),
            'list_bookings' => $this->listBookings($input),
            'get_account' => $this->getAccount(),
            default => ['error' => "Unknown tool {$name}"],
        };

        return json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    private function listCategories(): array
    {
        $counts = Shop::where('status', Shop::ACTIVE)
            ->where('is_master', false)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, COUNT(*) as cnt')
            ->groupBy('category_id')
            ->pluck('cnt', 'category_id');

        $categories = collect(ServiceCategories::all())
            ->filter(fn ($c) => (int) ($counts[$c['id']] ?? 0) > 0)
            ->map(fn ($c) => ['id' => $c['id'], 'name' => $c['name'], 'count' => (int) ($counts[$c['id']] ?? 0)])
            ->values()
            ->all();

        return ['categories' => $categories];
    }

    private function searchShops(array $input): array
    {
        $query = Shop::query()
            ->where('status', Shop::ACTIVE)
            ->where('is_master', false);

        if (!empty($input['category_id']) && in_array((int) $input['category_id'], ServiceCategories::ids(), true)) {
            $query->where('category_id', (int) $input['category_id']);
        }
        if (!empty($input['query'])) {
            $q = trim((string) $input['query']);
            $query->where(fn ($w) => $w->where('name', 'LIKE', "%{$q}%")->orWhere('location', 'LIKE', "%{$q}%"));
        }

        $near = !empty($input['near']) && $this->lat !== null && $this->lon !== null;
        $distanceExpr = "(6371 * ACOS(LEAST(1, GREATEST(-1, COS(RADIANS(?)) * COS(RADIANS(lat)) * COS(RADIANS(lon) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(lat))))))";

        if ($near) {
            $query->whereNotNull('lat')->whereNotNull('lon')
                ->select('shops.*')->selectRaw($distanceExpr . ' as distance_km', [$this->lat, $this->lon, $this->lat]);
        }

        $query->withCount(['guest_favourites as is_favourite' => fn ($q) => $q->where('device_id', $this->deviceId)])
            ->with('today_working_hours');

        $near
            ? $query->orderByRaw($distanceExpr . ' asc', [$this->lat, $this->lon, $this->lat])
            : $query->orderByDesc('is_verified')->orderByDesc('id');

        $shops = $query->limit(15)->get();
        if ($near) {
            $shops->transform(function ($shop) {
                $shop->distance = number_format((float) ($shop->distance_km ?? 0), 1) . ' km';
                return $shop;
            });
        }

        $this->collected = $shops;

        return ['shops' => $shops->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'location' => $s->location,
            'rating' => $s->rating, 'is_favourite' => (bool) $s->is_favourite,
            'distance' => $s->distance ?? null,
        ])->all()];
    }

    private function getShop(array $input): array
    {
        $shop = Shop::where('status', Shop::ACTIVE)
            ->with(['today_working_hours', 'catalogs'])
            ->withCount(['guest_favourites as is_favourite' => fn ($q) => $q->where('device_id', $this->deviceId)])
            ->find((int) ($input['shop_id'] ?? 0));

        if (!$shop) {
            return ['error' => 'No such shop.'];
        }

        $this->collected = collect([$shop]);

        return ['shop' => [
            'id' => $shop->id, 'name' => $shop->name, 'location' => $shop->location,
            'rating' => $shop->rating, 'is_favourite' => (bool) $shop->is_favourite,
            'services' => $shop->catalogs->map(fn ($c) => ['title' => $c->title, 'price' => $c->price])->all(),
        ]];
    }

    private function listFavourites(): array
    {
        $shops = Shop::where('status', Shop::ACTIVE)
            ->whereHas('guest_favourites', fn ($q) => $q->where('device_id', $this->deviceId))
            ->withCount(['guest_favourites as is_favourite' => fn ($q) => $q->where('device_id', $this->deviceId)])
            ->with('today_working_hours')
            ->orderByDesc('id')
            ->get();

        $this->collected = $shops;

        return ['favourites' => $shops->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'location' => $s->location,
        ])->all()];
    }

    private function listBookings(array $input): array
    {
        $scope = $input['scope'] ?? 'all';
        $today = Carbon::now('Asia/Dubai')->startOfDay()->toDateString();

        $bookings = Booking::where('device_id', $this->deviceId)
            ->when($scope === 'upcoming', fn ($q) => $q->whereDate('date', '>=', $today))
            ->when($scope === 'history', fn ($q) => $q->whereDate('date', '<', $today))
            ->with('shop:id,name,location')
            ->orderByDesc('date')
            ->limit(20)
            ->get();

        return ['bookings' => $bookings->map(fn ($b) => [
            'reference' => $b->booking_reference,
            'date' => Carbon::parse($b->date)->toDateString(),
            'time' => $b->slot,
            'status' => $b->status,
            'shop' => $b->shop?->name,
            'services' => collect($b->services ?? [])->pluck('title')->filter()->values()->all(),
        ])->all()];
    }

    private function getAccount(): array
    {
        if (!$this->user) {
            return ['logged_in' => false];
        }

        return [
            'logged_in' => true,
            'name' => $this->user->name,
            'phone' => $this->user->phone,
        ];
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && php artisan test --filter=AssistantToolsTest`
Expected: PASS (7 tests).

> If `Booking::factory()` or `Shop::factory()` lacks a needed column default, set it explicitly in the test `create([...])` call rather than changing the factory.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Ai/AssistantTools.php backend/tests/Feature/AssistantToolsTest.php
git commit -m "feat(ai): device-scoped read tools for the customer assistant"
```

---

### Task 3: `AssistantAgent` — the tool loop with action short-circuit

Drives the conversation over `ClaudeClient::raw()`. Each turn: if the model called an **action** tool, stop and return `['reply' => text, 'action' => directive]`; if it called **read** tools, execute them, echo the tool calls + results, and continue; if it produced plain text, return it.

**Files:**
- Create: `backend/app/Services/Ai/AssistantAgent.php`
- Test: `backend/tests/Feature/AssistantAgentTest.php`

**Interfaces:**
- Consumes: `ClaudeClient::raw()`, `AssistantTools` (`defs()`, `ACTION_TOOLS`, `executeRead()`, `collectedShops()`).
- Produces: `AssistantAgent::run(string $system, array $messages, AssistantTools $tools, int $maxTurns = 5): array` returning `['reply' => string, 'action' => ?array, 'shops' => \Illuminate\Support\Collection]`. `action` shape: `['type' => 'navigate'|'register'|'login', 'route'?, 'fields'?]`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/AssistantAgentTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Services\Ai\AssistantAgent;
use App\Services\Ai\AssistantTools;
use App\Services\Wa\ClaudeClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantAgentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.anthropic.key' => 'sk-test', 'services.anthropic.model' => 'claude-haiku-4-5']);
    }

    /** Queue Anthropic responses in order; each is a full /messages body. */
    private function fakeTurns(array $bodies): void
    {
        Http::fake(['api.anthropic.com/v1/messages' => Http::sequence(
            ...array_map(fn ($b) => Http::response($b), $bodies)
        )]);
    }

    private function textTurn(string $text): array
    {
        return ['content' => [['type' => 'text', 'text' => $text]]];
    }

    private function toolTurn(string $text, string $tool, array $input, string $id = 'tu_1'): array
    {
        return ['content' => array_values(array_filter([
            $text !== '' ? ['type' => 'text', 'text' => $text] : null,
            ['type' => 'tool_use', 'id' => $id, 'name' => $tool, 'input' => (object) $input],
        ]))];
    }

    private function agent(): AssistantAgent
    {
        return new AssistantAgent(new ClaudeClient());
    }

    public function test_plain_text_turn_returns_reply_with_no_action(): void
    {
        $this->fakeTurns([$this->textTurn('Hi! I can help you find services.')]);

        $out = $this->agent()->run('sys', [['role' => 'user', 'content' => 'hello']], new AssistantTools('dev-1'));

        $this->assertSame('Hi! I can help you find services.', $out['reply']);
        $this->assertNull($out['action']);
    }

    public function test_read_tool_then_text_runs_two_turns_and_collects_shops(): void
    {
        Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false, 'category_id' => 1, 'name' => 'Sharp Cuts']);

        $this->fakeTurns([
            $this->toolTurn('', 'search_shops', ['category_id' => 1]),
            $this->textTurn('Here are some barbers 👇'),
        ]);

        $out = $this->agent()->run('sys', [['role' => 'user', 'content' => 'find a barber']], new AssistantTools('dev-1'));

        $this->assertSame('Here are some barbers 👇', $out['reply']);
        $this->assertSame('Sharp Cuts', $out['shops']->first()->name);
    }

    public function test_action_tool_short_circuits_with_navigate_directive(): void
    {
        $this->fakeTurns([$this->toolTurn('Taking you to your bookings!', 'navigate', ['route' => '/bookings'])]);

        $out = $this->agent()->run('sys', [['role' => 'user', 'content' => 'show my bookings page']], new AssistantTools('dev-1'));

        $this->assertSame(['type' => 'navigate', 'route' => '/bookings'], $out['action']);
        $this->assertSame('Taking you to your bookings!', $out['reply']);
    }

    public function test_register_action_carries_collected_fields(): void
    {
        $this->fakeTurns([$this->toolTurn('Great — last step!', 'register', ['name' => 'Aisha', 'phone' => '0501234567'])]);

        $out = $this->agent()->run('sys', [['role' => 'user', 'content' => 'sign me up, I am Aisha 0501234567']], new AssistantTools('dev-1'));

        $this->assertSame('register', $out['action']['type']);
        $this->assertSame(['name' => 'Aisha', 'phone' => '0501234567'], $out['action']['fields']);
    }

    public function test_invalid_navigate_route_is_ignored(): void
    {
        $this->fakeTurns([
            $this->toolTurn('', 'navigate', ['route' => '/evil']),
            $this->textTurn('I can take you to your bookings or account.'),
        ]);

        $out = $this->agent()->run('sys', [['role' => 'user', 'content' => 'go somewhere']], new AssistantTools('dev-1'));

        $this->assertNull($out['action']);
        $this->assertSame('I can take you to your bookings or account.', $out['reply']);
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=AssistantAgentTest`
Expected: FAIL — `Class "App\Services\Ai\AssistantAgent" not found`.

- [ ] **Step 3: Implement `AssistantAgent`**

Create `backend/app/Services/Ai/AssistantAgent.php`:

```php
<?php

namespace App\Services\Ai;

use App\Services\Wa\ClaudeClient;
use Illuminate\Support\Collection;

/**
 * Runs the customer assistant tool loop. Read tools execute server-side and the
 * loop continues; an action tool (navigate/register/login) stops the loop and
 * returns a directive for the client to execute.
 */
class AssistantAgent
{
    /** Routes the model is allowed to navigate to. /shop/{id} is matched separately. */
    private const STATIC_ROUTES = ['/', '/explore', '/near-me', '/ai', '/favourites', '/bookings', '/account', '/login', '/register'];

    public function __construct(private ClaudeClient $claude) {}

    /**
     * @param array<int, array{role: string, content: mixed}> $messages
     * @return array{reply: string, action: ?array, shops: Collection}
     */
    public function run(string $system, array $messages, AssistantTools $tools, int $maxTurns = 5): array
    {
        $defs = AssistantTools::defs();

        for ($turn = 0; $turn < $maxTurns; $turn++) {
            $res = $this->claude->raw($system, $messages, $defs);
            $content = $res['content'] ?? [];

            $text = trim(collect($content)->where('type', 'text')->pluck('text')->implode(''));
            $toolBlocks = collect($content)->where('type', 'tool_use')->values();

            if ($toolBlocks->isEmpty()) {
                return ['reply' => $text, 'action' => null, 'shops' => $tools->collectedShops()];
            }

            // An action tool ends the turn with a client directive.
            $action = $toolBlocks
                ->map(fn ($b) => $this->actionFor($b['name'], (array) ($b['input'] ?? [])))
                ->first(fn ($a) => $a !== null);

            if ($action !== null) {
                return ['reply' => $text, 'action' => $action, 'shops' => $tools->collectedShops()];
            }

            // Read tools: echo the assistant turn, append one tool_result each, continue.
            $messages[] = ['role' => 'assistant', 'content' => array_map(function ($b) {
                if (($b['type'] ?? null) === 'tool_use') {
                    $b['input'] = (object) ($b['input'] ?? []);
                }
                return $b;
            }, $content)];

            $messages[] = ['role' => 'user', 'content' => $toolBlocks->map(fn ($t) => [
                'type' => 'tool_result',
                'tool_use_id' => $t['id'],
                'content' => $tools->executeRead($t['name'], (array) ($t['input'] ?? [])),
            ])->all()];
        }

        // Loop exhausted mid-tool-call — return whatever text we have, no action.
        return ['reply' => '', 'action' => null, 'shops' => $tools->collectedShops()];
    }

    /** Build a client directive for an action tool, or null for read tools / invalid input. */
    private function actionFor(string $name, array $input): ?array
    {
        if (!in_array($name, AssistantTools::ACTION_TOOLS, true)) {
            return null;
        }

        if ($name === 'navigate') {
            $route = trim((string) ($input['route'] ?? ''));
            $ok = in_array($route, self::STATIC_ROUTES, true) || preg_match('#^/shop/\d+$#', $route) === 1;
            return $ok ? ['type' => 'navigate', 'route' => $route] : null;
        }

        if ($name === 'register') {
            return ['type' => 'register', 'fields' => array_filter([
                'name' => isset($input['name']) ? (string) $input['name'] : null,
                'phone' => isset($input['phone']) ? (string) $input['phone'] : null,
            ], fn ($v) => $v !== null)];
        }

        // login
        return ['type' => 'login', 'fields' => array_filter([
            'phone' => isset($input['phone']) ? (string) $input['phone'] : null,
        ], fn ($v) => $v !== null)];
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && php artisan test --filter=AssistantAgentTest`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/Ai/AssistantAgent.php backend/tests/Feature/AssistantAgentTest.php
git commit -m "feat(ai): assistant tool loop with action short-circuit"
```

---

### Task 4: Wire `AiController::search` to the agent (new request/response shape)

`search()` now accepts a multi-turn `messages` array (falls back to a single `message` for safety) and returns `{ reply, action, shops, categories }`. The system prompt becomes the app-aware assistant prompt. `categories()` and the existing shop helpers stay; the old `classify()`/`shopsForCategory()` private helpers are removed (now covered by tools).

**Files:**
- Modify: `backend/app/Http/Controllers/AiController.php`
- Test: `backend/tests/Feature/AssistantSearchTest.php` (create)

**Interfaces:**
- Consumes: `AssistantAgent::run()`, `AssistantTools`.
- Produces: `POST /ai/search` → `{ reply: string, action: object|null, shops: Shop[], categories: [] }`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/AssistantSearchTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.anthropic.key' => 'sk-test', 'services.anthropic.model' => 'claude-haiku-4-5']);
    }

    private function fakeTurns(array $bodies): void
    {
        Http::fake(['api.anthropic.com/v1/messages' => Http::sequence(
            ...array_map(fn ($b) => Http::response($b), $bodies)
        )]);
    }

    public function test_returns_reply_and_shops_for_a_search(): void
    {
        Shop::factory()->create(['status' => Shop::ACTIVE, 'is_master' => false, 'category_id' => 1, 'name' => 'Sharp Cuts']);

        $this->fakeTurns([
            ['content' => [['type' => 'tool_use', 'id' => 'tu_1', 'name' => 'search_shops', 'input' => (object) ['category_id' => 1]]]],
            ['content' => [['type' => 'text', 'text' => 'Here are some barbers 👇']]],
        ]);

        $res = $this->withHeaders(['X-Device-Id' => 'dev-1'])
            ->postJson('/api/ai/search', ['messages' => [['role' => 'user', 'content' => 'find a barber']]]);

        $res->assertOk()
            ->assertJsonPath('reply', 'Here are some barbers 👇')
            ->assertJsonPath('shops.0.name', 'Sharp Cuts')
            ->assertJsonPath('action', null);
    }

    public function test_returns_navigate_action(): void
    {
        $this->fakeTurns([
            ['content' => [['type' => 'text', 'text' => 'Opening your favourites!'], ['type' => 'tool_use', 'id' => 'tu_1', 'name' => 'navigate', 'input' => (object) ['route' => '/favourites']]]],
        ]);

        $res = $this->withHeaders(['X-Device-Id' => 'dev-1'])
            ->postJson('/api/ai/search', ['messages' => [['role' => 'user', 'content' => 'open my favourites']]]);

        $res->assertOk()
            ->assertJsonPath('action.type', 'navigate')
            ->assertJsonPath('action.route', '/favourites');
    }

    public function test_still_accepts_legacy_single_message(): void
    {
        $this->fakeTurns([['content' => [['type' => 'text', 'text' => 'Hello!']]]]);

        $res = $this->withHeaders(['X-Device-Id' => 'dev-1'])
            ->postJson('/api/ai/search', ['message' => 'hi']);

        $res->assertOk()->assertJsonPath('reply', 'Hello!');
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=AssistantSearchTest`
Expected: FAIL — assertions on `action`/`shops` shape fail against the old classify response.

- [ ] **Step 3: Replace the controller body**

Replace the entire contents of `backend/app/Http/Controllers/AiController.php` with:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\Ai\AssistantAgent;
use App\Services\Ai\AssistantTools;
use App\Services\Wa\ClaudeClient;
use App\Support\ServiceCategories;
use Illuminate\Http\Request;

/**
 * App-aware assistant for the customer app. Runs a Claude tool loop: read tools
 * (favourites, bookings, account, shops, categories) execute server-side and are
 * device-scoped; action tools (navigate, register, login) return a directive the
 * client executes. Matching shops come back in the SAME shape ShopCard consumes.
 */
class AiController extends Controller
{
    public function search(Request $request)
    {
        $validated = $request->validate([
            'messages' => 'array',
            'messages.*.role' => 'required_with:messages|string|in:user,assistant',
            'messages.*.content' => 'required_with:messages|string|max:2000',
            'message' => 'nullable|string|max:2000',
            'lat' => 'nullable|numeric|between:-90,90',
            'lon' => 'nullable|numeric|between:-180,180',
        ]);

        $messages = $validated['messages'] ?? [];
        if (!$messages && !empty($validated['message'])) {
            $messages = [['role' => 'user', 'content' => $validated['message']]];
        }
        if (!$messages) {
            return response()->json(['reply' => 'How can I help?', 'action' => null, 'shops' => [], 'categories' => []]);
        }

        $tools = new AssistantTools(
            (string) $request->header('X-Device-Id'),
            $request->user(),
            isset($validated['lat']) ? (float) $validated['lat'] : null,
            isset($validated['lon']) ? (float) $validated['lon'] : null,
        );

        try {
            $out = (new AssistantAgent(new ClaudeClient()))->run($this->systemPrompt(), $messages, $tools);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'reply' => 'Something went wrong on my side — please try again.',
                'action' => null, 'shops' => [], 'categories' => [],
            ]);
        }

        return response()->json([
            'reply' => $out['reply'] !== '' ? $out['reply'] : 'Sorry, I did not catch that — could you rephrase?',
            'action' => $out['action'],
            'shops' => $out['shops']->values(),
            'categories' => [],
        ]);
    }

    /**
     * Service categories that currently have at least one bookable shop, with a
     * shop count each — used for the "what can I search?" chips. No Claude call.
     */
    public function categories()
    {
        $counts = Shop::where('status', Shop::ACTIVE)
            ->where('is_master', false)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, COUNT(*) as cnt')
            ->groupBy('category_id')
            ->pluck('cnt', 'category_id');

        $categories = collect(ServiceCategories::all())
            ->filter(fn ($c) => (int) ($counts[$c['id']] ?? 0) > 0)
            ->map(fn ($c) => ['id' => $c['id'], 'name' => $c['name'], 'count' => (int) ($counts[$c['id']] ?? 0)])
            ->values();

        return response()->json(['categories' => $categories]);
    }

    private function systemPrompt(): string
    {
        $catalogue = collect(ServiceCategories::all())
            ->map(fn ($c) => "{$c['id']} = {$c['name']}")
            ->implode("\n");

        return <<<SYS
You are Rezzy's in-app assistant. Rezzy lists local service shops customers can browse, favourite and book.

You can:
- Answer about the user's own favourites, bookings, and account.
- Search and describe shops and the services they offer.
- Take the user to any app screen, and sign them in or create their account.

The service categories are:
{$catalogue}

Use the tools rather than guessing. Prefer the most specific tool. To find shops use search_shops (pass near=true only when the user implies location). For "my favourites"/"my bookings"/"my account" use list_favourites/list_bookings/get_account.

To take the user somewhere, call navigate with one of the allowed routes. To create an account call register (collect the name and phone in conversation first); to sign in call login (collect the phone first). NEVER ask for or repeat a password — the app collects it securely after you call register/login.

If get_account returns logged_in:false and the user wants account-only info, offer to sign them in (call login).

Keep every reply to one or two short, friendly sentences. If a request is unrelated to Rezzy, say you can only help with local services and bookings.
SYS;
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && php artisan test --filter=AssistantSearchTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full assistant suite + sanity-check nothing else broke**

Run: `cd backend && php artisan test --filter=Assistant`
Expected: PASS (all Assistant* tests).

> If an old `AiSearchTest` existed and asserted the legacy `{intent, category_id}` shape, it now describes removed behaviour — delete that file (its scenarios are replaced by `AssistantSearchTest`). Confirm it exists before deleting: `ls backend/tests/Feature/AiSearchTest.php`.

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/AiController.php backend/tests/Feature/AssistantSearchTest.php
git commit -m "feat(ai): AiController runs the app-aware assistant agent"
```

---

## Phase 2 — Frontend

### Task 5: `lib/ai.ts` — multi-turn request + action types

`aiSearch` now sends the conversation history and parses an optional `action`.

**Files:**
- Modify: `eloquent-bookings/src/lib/ai.ts`
- Test: `eloquent-bookings/src/lib/ai.test.ts` (create)

**Interfaces:**
- Produces:
  - `type AiAction = { type: 'navigate'; route: string } | { type: 'register'; fields: { name?: string; phone?: string } } | { type: 'login'; fields: { phone?: string } }`
  - `type AiChatMessage = { role: 'user' | 'assistant'; content: string }`
  - `aiSearch(messages: AiChatMessage[], coords?: { lat: number; lon: number }): Promise<AiSearchResult>` where `AiSearchResult` gains `action?: AiAction | null`.

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/lib/ai.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { aiSearch } from './ai';

vi.mock('./api', () => ({ default: { post: vi.fn() } }));

describe('aiSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the message thread and coords', async () => {
    (api.post as any).mockResolvedValue({ data: { reply: 'hi', action: null, shops: [] } });

    await aiSearch([{ role: 'user', content: 'find a barber' }], { lat: 25, lon: 55 });

    expect(api.post).toHaveBeenCalledWith('/ai/search', {
      messages: [{ role: 'user', content: 'find a barber' }],
      lat: 25,
      lon: 55,
    });
  });

  it('returns the action from the response', async () => {
    (api.post as any).mockResolvedValue({ data: { reply: 'ok', action: { type: 'navigate', route: '/bookings' }, shops: [] } });

    const res = await aiSearch([{ role: 'user', content: 'open bookings' }]);

    expect(res.action).toEqual({ type: 'navigate', route: '/bookings' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/lib/ai.test.ts`
Expected: FAIL — `aiSearch` current signature takes `(message, coords)` so the call shape mismatches.

- [ ] **Step 3: Update `lib/ai.ts`**

Replace `eloquent-bookings/src/lib/ai.ts` with:

```ts
import api from './api';
import type { Shop } from '@/types';

export type AiCategory = { id: number; name: string; count: number };

export type AiChatMessage = { role: 'user' | 'assistant'; content: string };

export type AiAction =
  | { type: 'navigate'; route: string }
  | { type: 'register'; fields: { name?: string; phone?: string } }
  | { type: 'login'; fields: { phone?: string } };

export type AiSearchResult = {
  reply: string;
  action?: AiAction | null;
  shops: Shop[];
  categories?: AiCategory[];
};

/**
 * Ask the in-app assistant. Sends the conversation so far; the backend runs a
 * tool loop and may return matching shops (ShopCard shape) and/or an action
 * directive (navigate / register / login) for the app to execute. Pass coords
 * when available so "near me" queries rank by distance.
 */
export async function aiSearch(
  messages: AiChatMessage[],
  coords?: { lat: number; lon: number },
): Promise<AiSearchResult> {
  const res = await api.post<AiSearchResult>('/ai/search', {
    messages,
    lat: coords?.lat,
    lon: coords?.lon,
  });
  return res.data;
}

/** Service categories that currently have shops (with counts), for the chips. */
export async function getAiCategories(): Promise<AiCategory[]> {
  const res = await api.get<{ categories: AiCategory[] }>('/ai/categories');
  return res.data.categories ?? [];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd eloquent-bookings && npx vitest run src/lib/ai.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/lib/ai.ts eloquent-bookings/src/lib/ai.test.ts
git commit -m "feat(ai): multi-turn aiSearch with action directives"
```

---

### Task 6: `VoiceSearchContext` — send thread history, execute actions

`send()` now builds the message thread from prior turns, executes a `navigate` action via the router, and attaches an `auth` payload to the AI message for `register`/`login` (consumed by `AuthInline` in Task 8). The provider already lives inside both the router and `CustomerProvider`, so it can use `useNavigate`.

**Files:**
- Modify: `eloquent-bookings/src/context/VoiceSearchContext.tsx`
- Test: `eloquent-bookings/src/context/VoiceSearchContext.test.tsx` (create)

**Interfaces:**
- Consumes: `aiSearch`, `AiChatMessage`, `AiAction` from `@/lib/ai`; `useNavigate` from `react-router-dom`.
- Produces: `AiMsg` gains `auth?: { mode: 'login' | 'register'; name?: string; phone?: string }`. Adds `signedIn(name: string)` to the context value (appends a confirmation turn after a successful inline auth).

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/context/VoiceSearchContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VoiceSearchProvider, useVoiceSearch } from './VoiceSearchContext';
import * as aiLib from '@/lib/ai';

const navigateSpy = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigateSpy,
}));

function Harness() {
  const { messages, send } = useVoiceSearch();
  return (
    <div>
      <button onClick={() => send('hello')}>go</button>
      <ul>{messages.map((m) => <li key={m.id} data-role={m.role} data-auth={m.auth?.mode ?? ''}>{m.text}</li>)}</ul>
    </div>
  );
}

function renderHarness() {
  return render(<MemoryRouter><VoiceSearchProvider><Harness /></VoiceSearchProvider></MemoryRouter>);
}

describe('VoiceSearchContext.send', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the thread history including the new user turn', async () => {
    const spy = vi.spyOn(aiLib, 'aiSearch').mockResolvedValue({ reply: 'hi there', shops: [], action: null });
    renderHarness();

    await act(async () => { screen.getByText('go').click(); });

    expect(spy).toHaveBeenCalledWith([{ role: 'user', content: 'hello' }], undefined);
    expect(screen.getByText('hi there')).toBeInTheDocument();
  });

  it('executes a navigate action via the router', async () => {
    vi.spyOn(aiLib, 'aiSearch').mockResolvedValue({ reply: 'opening', shops: [], action: { type: 'navigate', route: '/bookings' } });
    renderHarness();

    await act(async () => { screen.getByText('go').click(); });

    expect(navigateSpy).toHaveBeenCalledWith('/bookings');
  });

  it('attaches an auth payload for a login action', async () => {
    vi.spyOn(aiLib, 'aiSearch').mockResolvedValue({ reply: 'one sec', shops: [], action: { type: 'login', fields: { phone: '0501234567' } } });
    renderHarness();

    await act(async () => { screen.getByText('go').click(); });

    const aiTurn = screen.getByText('one sec').closest('li');
    expect(aiTurn?.getAttribute('data-auth')).toBe('login');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/context/VoiceSearchContext.test.tsx`
Expected: FAIL — `send` calls `aiSearch(trimmed, coords)` (string, not thread) and has no action handling.

- [ ] **Step 3: Update the provider**

In `eloquent-bookings/src/context/VoiceSearchContext.tsx`:

a) Update imports at the top:

```tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSearch, type AiCategory, type AiChatMessage } from '@/lib/ai';
import { toggleFavourite } from '@/lib/shops';
import type { Shop } from '@/types';
```

b) Extend `AiMsg` and the context type:

```tsx
export type AiMsg = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  shops?: Shop[];
  categories?: AiCategory[];
  auth?: { mode: 'login' | 'register'; name?: string; phone?: string };
};
```

Add `signedIn: (name: string) => void;` to the `VoiceSearch` type (after `favourite`).

c) Inside `VoiceSearchProvider`, add the router hook near the other hooks:

```tsx
  const navigate = useNavigate();
```

d) Replace the whole `send` callback with the version below (builds history, handles actions):

```tsx
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Build the Anthropic-style thread from prior turns + this one. Skip turns
    // with no text (e.g. inline auth prompts).
    const history: AiChatMessage[] = messages
      .filter((m) => m.text.trim() !== '')
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    history.push({ role: 'user', content: trimmed });

    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: trimmed }]);
    setSending(true);
    try {
      const res = await aiSearch(history, coordsRef.current);

      const action = res.action ?? null;
      const auth = action && (action.type === 'login' || action.type === 'register')
        ? { mode: action.type, ...action.fields }
        : undefined;

      setMessages((prev) => [...prev, {
        id: nextId.current++,
        role: 'ai',
        text: res.reply,
        shops: res.shops?.length ? res.shops : undefined,
        categories: res.categories?.length ? res.categories : undefined,
        auth,
      }]);

      if (action?.type === 'navigate') navigate(action.route);
    } catch {
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'ai', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }, [messages, navigate]);
```

e) Add a `signedIn` helper just before the `return` (after `favourite`):

```tsx
  const signedIn = useCallback((name: string) => {
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'ai', text: `✅ You're signed in${name ? `, ${name}` : ''}.` }]);
  }, []);
```

f) Add `signedIn` to the provider value object:

```tsx
    <Ctx.Provider value={{ messages, listening, sending, interim, supported, startListening, stopListening, toggleListening, send, favourite, signedIn }}>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd eloquent-bookings && npx vitest run src/context/VoiceSearchContext.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/context/VoiceSearchContext.tsx eloquent-bookings/src/context/VoiceSearchContext.test.tsx
git commit -m "feat(ai): thread-aware send with navigate + auth action handling"
```

---

### Task 7: `AuthInline` — secure inline auth form

Renders under an AI message carrying an `auth` payload. Name/phone are prefilled (and editable); password is typed here and sent **only** to `/login` `/register` — never to `/ai/search`. On success it stores the token via `CustomerContext` and tells the thread.

**Files:**
- Create: `eloquent-bookings/src/components/AuthInline.tsx`
- Test: `eloquent-bookings/src/components/AuthInline.test.tsx`

**Interfaces:**
- Consumes: `api` (`@/lib/api`), `useCustomer` (`@/context/CustomerContext`).
- Produces: `AuthInline({ mode, name, phone, onDone }: { mode: 'login' | 'register'; name?: string; phone?: string; onDone: (name: string) => void })`.

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/components/AuthInline.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '@/lib/api';
import { AuthInline } from './AuthInline';

const loginCustomer = vi.fn();
vi.mock('@/context/CustomerContext', () => ({ useCustomer: () => ({ loginCustomer }) }));
vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));

describe('AuthInline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs in with the prefilled phone + typed password and reports done', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 'tok', user: { id: 1, name: 'Aisha' } } });
    const onDone = vi.fn();
    render(<AuthInline mode="login" phone="0501234567" onDone={onDone} />);

    await userEvent.type(screen.getByPlaceholderText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/login', { phone: '0501234567', password: 'secret' }));
    expect(loginCustomer).toHaveBeenCalledWith({ id: 1, name: 'Aisha' }, 'tok');
    expect(onDone).toHaveBeenCalledWith('Aisha');
  });

  it('registers with name, phone, password + confirmation', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 'tok', user: { id: 2, name: 'Sam' } } });
    const onDone = vi.fn();
    render(<AuthInline mode="register" name="Sam" phone="0509999999" onDone={onDone} />);

    await userEvent.type(screen.getByPlaceholderText(/^password/i), 'secret');
    await userEvent.type(screen.getByPlaceholderText(/confirm/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/register', {
      name: 'Sam', phone: '0509999999', password: 'secret', password_confirmation: 'secret',
    }));
    expect(onDone).toHaveBeenCalledWith('Sam');
  });

  it('shows an error and does not call onDone on failure', async () => {
    (api.post as any).mockRejectedValue({ response: { data: { message: 'Invalid credentials provided.' } } });
    const onDone = vi.fn();
    render(<AuthInline mode="login" phone="0501234567" onDone={onDone} />);

    await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials provided.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/components/AuthInline.test.tsx`
Expected: FAIL — module `./AuthInline` does not exist.

- [ ] **Step 3: Implement `AuthInline`**

Create `eloquent-bookings/src/components/AuthInline.tsx`:

```tsx
import { useState } from 'react';
import api from '@/lib/api';
import { useCustomer } from '@/context/CustomerContext';

type Props = {
  mode: 'login' | 'register';
  name?: string;
  phone?: string;
  onDone: (name: string) => void;
};

/**
 * Inline auth under an assistant message. Name/phone are prefilled from what the
 * AI collected (editable); the password is typed here and sent ONLY to the real
 * /login /register endpoints — it never goes through the AI turn.
 */
export function AuthInline({ mode, name: initialName = '', phone: initialPhone = '', onDone }: Props) {
  const { loginCustomer } = useCustomer();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (mode === 'register' && !name.trim()) { setError('Name is required.'); return; }
    if (!phone.trim()) { setError('Mobile number is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (mode === 'register' && password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      const payload = mode === 'register'
        ? { name: name.trim(), phone: phone.trim(), password, password_confirmation: confirm }
        : { phone: phone.trim(), password };
      const res = await api.post(mode === 'register' ? '/register' : '/login', payload);
      if (res.data?.token && res.data?.user) {
        loginCustomer(res.data.user, res.data.token);
        setDone(true);
        onDone(res.data.user.name ?? name.trim());
      } else {
        setError('Unexpected response — please try again.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
      setError(first || data?.message || (mode === 'register' ? 'Registration failed.' : 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  return (
    <div className="c-ai-auth">
      {mode === 'register' && (
        <input className="c-ai-auth-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <input className="c-ai-auth-input" placeholder="Mobile number" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="c-ai-auth-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {mode === 'register' && (
        <input className="c-ai-auth-input" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      )}
      {error && <div className="c-ai-auth-error">{error}</div>}
      <button className="c-ai-auth-submit" disabled={loading} onClick={submit}>
        {mode === 'register' ? 'Create account' : 'Sign in'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd eloquent-bookings && npx vitest run src/components/AuthInline.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/components/AuthInline.tsx eloquent-bookings/src/components/AuthInline.test.tsx
git commit -m "feat(ai): secure inline auth form for conversational sign in/up"
```

---

### Task 8: Render `AuthInline` in the AI page

Wire the inline form into the thread: any AI message with an `auth` payload renders `AuthInline` below its bubble; on completion it calls `signedIn(name)`.

**Files:**
- Modify: `eloquent-bookings/src/pages/AI.tsx`

**Interfaces:**
- Consumes: `AuthInline` (`@/components/AuthInline`); `signedIn` from `useVoiceSearch()`.

- [ ] **Step 1: Add the import and destructure `signedIn`**

In `eloquent-bookings/src/pages/AI.tsx`, add to imports:

```tsx
import { AuthInline } from '@/components/AuthInline';
```

Update the hook destructure:

```tsx
  const { messages, listening, sending, interim, supported, send, favourite, signedIn } = useVoiceSearch();
```

- [ ] **Step 2: Render the form inside the message map**

Inside the `messages.map((m) => ( ... ))` block, add this directly after the category-chips block and before the shops block:

```tsx
            {m.auth && (
              <AuthInline
                mode={m.auth.mode}
                name={m.auth.name}
                phone={m.auth.phone}
                onDone={(name) => signedIn(name)}
              />
            )}
```

- [ ] **Step 3: Verify the full frontend suite passes and it type-checks**

Run: `cd eloquent-bookings && npx vitest run && npx tsc --noEmit`
Expected: PASS; no type errors.

- [ ] **Step 4: Commit**

```bash
git add eloquent-bookings/src/pages/AI.tsx
git commit -m "feat(ai): render inline auth in the assistant thread"
```

---

### Task 9: Minimal styling for inline auth + manual smoke test

Add styles so the inline auth and any new bits look at home, then manually verify the end-to-end flows.

**Files:**
- Modify: the customer app's stylesheet that defines `c-ai-*` classes (find it: `grep -rl "c-ai-results" eloquent-bookings/src`).

**Interfaces:** none (CSS only).

- [ ] **Step 1: Add styles**

Append to the stylesheet that holds the other `c-ai-*` rules:

```css
.c-ai-auth { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 4px; max-width: 280px; }
.c-ai-auth-input { padding: 10px 12px; border: 1px solid var(--c-border, #e2e2e2); border-radius: 10px; font-size: 15px; }
.c-ai-auth-error { color: #c0392b; font-size: 13px; }
.c-ai-auth-submit { padding: 10px 12px; border: 0; border-radius: 10px; background: var(--c-mint, #1fb6a6); color: #fff; font-weight: 600; }
.c-ai-auth-submit:disabled { opacity: .6; }
```

> Match the existing token names if the stylesheet uses different ones (check the file you found); the fallbacks keep it usable either way.

- [ ] **Step 2: Manual smoke test (run the app)**

Run the customer app (`cd eloquent-bookings && npm run dev`) and, against a working API, verify each flow in the AI screen:

1. "What services can I search?" → a friendly reply (catalogue awareness).
2. "Find a barber near me" → reply + shop cards render.
3. "What are my favourite shops?" → lists favourites (after favouriting one).
4. "Show my booking history" → lists past bookings (with a device that has bookings).
5. "Take me to my bookings" → app navigates to `/bookings`.
6. "Create an account for me, I'm Aisha, 0501234567" → AI collects, inline form appears prefilled; type a password → account created, "✅ You're signed in".
7. "Log me in, my number is 0501234567" → inline form appears; sign in succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style(ai): inline auth styling for the assistant"
```

---

## Self-Review

**Spec coverage:**
- Read tools (favourites, bookings, account, shops, get_shop, categories) → Task 2. ✅
- Tool loop + action short-circuit → Task 3. ✅
- New endpoint shape + app-aware system prompt → Task 4. ✅
- Multi-turn frontend request → Tasks 5–6. ✅
- Navigate action → Tasks 3 (directive), 6 (execution). ✅
- Conversational auth (name/phone in chat, password typed, reuse `/login` `/register`, store token) → Tasks 6–8. ✅
- Error handling (tool errors as strings; loop cap; guest `get_account` → offer login; off-topic decline) → Tasks 2/3 + system prompt in Task 4. ✅
- Booking mutations → intentionally **deferred to Plan B** per spec "Delivery phasing". ✅
- Testing (backend per-tool + loop + endpoint; frontend lib/context/component) → every task ships tests. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every test step has full test bodies and exact run commands. ✅

**Type/name consistency:** `AssistantTools` (`defs`/`executeRead`/`collectedShops`/`ACTION_TOOLS`), `AssistantAgent::run` returning `['reply','action','shops']`, `AiAction`/`AiChatMessage`/`aiSearch(messages, coords)`, `AiMsg.auth`, `signedIn`, and `AuthInline` props are used identically across backend Tasks 2–4 and frontend Tasks 5–8. ✅

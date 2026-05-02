# Staffing Phase 1 — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-staff support to bookings: each shop can have N staff, each booking is assigned to one staff (auto, load-balanced) or queued if all are busy. Queued bookings auto-promote when any staff frees up.

**Architecture:** A new `staff` table per shop. `bookings` gains a nullable `staff_id` and a new `queued` status. A `StaffAssigner` service centralises the "find a staff for this slot" and "promote queued bookings" logic. Conflict prevention moves from per-shop unique slot to per-staff unique slot (multiple staff can share a slot).

**Tech Stack:** Laravel 12 (PHP 8.2), PHPUnit 11, SQLite in-memory for tests, Eloquent models, Sanctum routes (existing).

**Scope of this plan:** Backend only — migrations, models, controllers, the assignment service, and tests. Frontend (Next.js shop dashboard) and mobile (React Native) updates are in separate plans (`2026-04-30-staffing-phase-1-frontend.md`, `2026-04-30-staffing-phase-1-mobile.md`) to be written after this one ships.

**Spec:** [docs/superpowers/specs/2026-04-30-staffing-phase-1-design.md](../specs/2026-04-30-staffing-phase-1-design.md)

---

## File Structure

| Path | Status | Responsibility |
|---|---|---|
| `backend/database/migrations/2026_05_01_000001_create_staff_table.php` | Create | New `staff` table |
| `backend/database/migrations/2026_05_01_000002_add_staff_to_bookings_table.php` | Create | Add `staff_id`, swap unique index |
| `backend/app/Models/Staff.php` | Create | Eloquent model |
| `backend/database/factories/StaffFactory.php` | Create | Test factory |
| `backend/database/factories/ShopFactory.php` | Create | Needed by feature tests |
| `backend/database/factories/BookingFactory.php` | Create | Needed by feature tests |
| `backend/app/Services/StaffAssigner.php` | Create | `assignOrQueue()` + `sweep()` logic |
| `backend/app/Http/Requests/StoreStaffRequest.php` | Create | Validation for create |
| `backend/app/Http/Requests/UpdateStaffRequest.php` | Create | Validation for update |
| `backend/app/Http/Controllers/StaffController.php` | Create | CRUD + reassign endpoints |
| `backend/app/Http/Controllers/BookingController.php` | Modify | Use `StaffAssigner` on `bookSlot`, trigger sweep on `update` |
| `backend/app/Models/Booking.php` | Modify | `staff()` relationship; remove old unique-slot check |
| `backend/app/Models/Shop.php` | Modify | `staff()` relationship |
| `backend/routes/api.php` | Modify | Staff routes + reassign route |
| `backend/tests/Unit/StaffAssignerTest.php` | Create | Unit tests for assignment logic |
| `backend/tests/Feature/StaffCrudTest.php` | Create | Staff endpoints |
| `backend/tests/Feature/BookingAssignmentTest.php` | Create | Booking creation auto-assigns/queues |
| `backend/tests/Feature/QueuePromotionTest.php` | Create | Cancel/complete/reassign promote |

All tests use `RefreshDatabase` trait against the in-memory SQLite configured in `phpunit.xml`. `Http::fake()` is used in feature tests to stub the `Notify::push` outbound call.

---

## Task 1: Migrations and `Staff` model

**Files:**
- Create: `backend/database/migrations/2026_05_01_000001_create_staff_table.php`
- Create: `backend/database/migrations/2026_05_01_000002_add_staff_to_bookings_table.php`
- Create: `backend/app/Models/Staff.php`
- Create: `backend/database/factories/StaffFactory.php`

- [ ] **Step 1.1: Write the staff-table migration**

Create `backend/database/migrations/2026_05_01_000001_create_staff_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->index();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
```

- [ ] **Step 1.2: Write the bookings-alteration migration**

Create `backend/database/migrations/2026_05_01_000002_add_staff_to_bookings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('staff_id')->nullable()->after('shop_id');
            $table->index('staff_id');
        });

        // Drop the old per-shop unique slot index. The exact constraint name
        // Laravel generated is `bookings_shop_id_date_start_time_unique`.
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique('bookings_shop_id_date_start_time_unique');
        });

        // Add the new per-staff unique slot index. NULL staff_id (queued)
        // is treated as distinct, so multiple queued bookings on the same
        // (date, start_time) are allowed.
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique(['staff_id', 'date', 'start_time'], 'bookings_staff_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique('bookings_staff_slot_unique');
            $table->dropIndex(['staff_id']);
            $table->dropColumn('staff_id');
            $table->unique(['shop_id', 'date', 'start_time']);
        });
    }
};
```

- [ ] **Step 1.3: Run migrations to verify they apply cleanly**

Run:

```bash
cd backend && php artisan migrate:fresh --env=testing
```

Expected: all migrations succeed including the two new ones, no errors.

- [ ] **Step 1.4: Write a test that creates a Staff via the factory**

Create `backend/tests/Unit/StaffModelTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_factory_creates_active_staff(): void
    {
        $staff = Staff::factory()->create(['shop_id' => 1, 'name' => 'Ali']);

        $this->assertDatabaseHas('staff', [
            'id' => $staff->id,
            'shop_id' => 1,
            'name' => 'Ali',
            'is_active' => true,
        ]);
    }
}
```

- [ ] **Step 1.5: Run the test, expect failure (model and factory don't exist)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffModelTest.php
```

Expected: ERROR — `Class "App\Models\Staff" not found`.

- [ ] **Step 1.6: Create the `Staff` model**

Create `backend/app/Models/Staff.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff';

    protected $fillable = ['shop_id', 'name', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    protected static function newFactory()
    {
        return \Database\Factories\StaffFactory::new();
    }
}
```

- [ ] **Step 1.7: Create the factory**

Create `backend/database/factories/StaffFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    protected $model = Staff::class;

    public function definition(): array
    {
        return [
            'shop_id' => 1,
            'name' => fake()->firstName(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
```

- [ ] **Step 1.8: Run the test, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffModelTest.php
```

Expected: 1 test, 1 assertion, OK.

- [ ] **Step 1.9: Commit**

```bash
git add backend/database/migrations/2026_05_01_000001_create_staff_table.php \
        backend/database/migrations/2026_05_01_000002_add_staff_to_bookings_table.php \
        backend/app/Models/Staff.php \
        backend/database/factories/StaffFactory.php \
        backend/tests/Unit/StaffModelTest.php
git commit -m "feat(staffing): add staff table, model, factory, and bookings.staff_id"
```

---

## Task 2: Add `Shop`/`Booking` relationships and supporting factories

**Files:**
- Modify: `backend/app/Models/Shop.php`
- Modify: `backend/app/Models/Booking.php`
- Create: `backend/database/factories/ShopFactory.php`
- Create: `backend/database/factories/BookingFactory.php`

- [ ] **Step 2.1: Write the failing relationship test**

Append to `backend/tests/Unit/StaffModelTest.php`:

```php
public function test_staff_belongs_to_shop_and_has_bookings(): void
{
    $shop = \App\Models\Shop::factory()->create();
    $staff = \App\Models\Staff::factory()->create(['shop_id' => $shop->id]);
    $booking = \App\Models\Booking::factory()->create([
        'shop_id' => $shop->id,
        'staff_id' => $staff->id,
    ]);

    $this->assertEquals($shop->id, $staff->shop->id);
    $this->assertEquals($staff->id, $booking->staff->id);
    $this->assertTrue($staff->bookings->contains($booking));
    $this->assertTrue($shop->staff->contains($staff));
}
```

- [ ] **Step 2.2: Run the test, expect failure (factories missing)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffModelTest.php::test_staff_belongs_to_shop_and_has_bookings
```

Expected: ERROR about missing `ShopFactory` or `BookingFactory`.

- [ ] **Step 2.3: Create `ShopFactory`**

Create `backend/database/factories/ShopFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shop>
 */
class ShopFactory extends Factory
{
    protected $model = Shop::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'shop_code' => (string) fake()->unique()->numberBetween(100000, 999999),
            'pin' => str_pad((string) fake()->unique()->numberBetween(0, 9999), 4, '0', STR_PAD_LEFT),
            'lat' => fake()->latitude(),
            'lon' => fake()->longitude(),
        ];
    }
}
```

- [ ] **Step 2.4: Wire `Shop::factory()`**

Modify `backend/app/Models/Shop.php` — add `HasFactory` trait import and use it:

```php
// At top of file:
use Illuminate\Database\Eloquent\Factories\HasFactory;

// In the class declaration line, replace:
//   class Shop extends Model
// with:
class Shop extends Model
{
    use HasFactory, HasBase64Image, HasApiTokens;
```

(The existing `use HasBase64Image, HasApiTokens;` line replaces with the line above.)

- [ ] **Step 2.5: Add `staff()` relationship to `Shop`**

Append to the `Shop` model class body:

```php
public function staff()
{
    return $this->hasMany(Staff::class);
}
```

- [ ] **Step 2.6: Create `BookingFactory`**

Create `backend/database/factories/BookingFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'shop_id' => 1,
            'staff_id' => null,
            'date' => now()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'booked',
            'device_id' => fake()->uuid(),
            'charges' => 0,
            'services' => [],
        ];
    }

    public function queued(): static
    {
        return $this->state(fn () => ['staff_id' => null, 'status' => 'queued']);
    }
}
```

- [ ] **Step 2.7: Wire `Booking::factory()` and add `staff()` relationship**

Modify `backend/app/Models/Booking.php`:

In `$fillable`, add `'staff_id'`:

```php
protected $fillable = [
    'shop_id',
    'staff_id',
    'date',
    'start_time',
    'end_time',
    'status',
    'device_id',
    'charges',
    'services',
    'booking_reference',
    'customer_name',
    'customer_whatsapp',
];
```

Append to the class body, after the existing `shop()` method:

```php
public function staff()
{
    return $this->belongsTo(Staff::class);
}
```

- [ ] **Step 2.8: Run the test, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffModelTest.php
```

Expected: 2 tests, all assertions pass.

- [ ] **Step 2.9: Commit**

```bash
git add backend/app/Models/Shop.php \
        backend/app/Models/Booking.php \
        backend/database/factories/ShopFactory.php \
        backend/database/factories/BookingFactory.php \
        backend/tests/Unit/StaffModelTest.php
git commit -m "feat(staffing): add Shop/Booking relationships to Staff and supporting factories"
```

---

## Task 3: `StaffAssigner::assignOrQueue` — auto-assignment with fewest-today + tie-break

**Files:**
- Create: `backend/app/Services/StaffAssigner.php`
- Create: `backend/tests/Unit/StaffAssignerTest.php`

This task implements the assignment algorithm from spec §2 in isolation, without touching the booking controller yet.

- [ ] **Step 3.1: Write the failing unit test for the basic happy path**

Create `backend/tests/Unit/StaffAssignerTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Shop;
use App\Models\Staff;
use App\Services\StaffAssigner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAssignerTest extends TestCase
{
    use RefreshDatabase;

    public function test_picks_only_active_staff_when_one_is_inactive(): void
    {
        $shop = Shop::factory()->create();
        $inactive = Staff::factory()->inactive()->create(['shop_id' => $shop->id]);
        $active = Staff::factory()->create(['shop_id' => $shop->id]);

        $picked = (new StaffAssigner())->pickStaffForSlot(
            shopId: $shop->id,
            date: '2026-05-11',
            startTime: '10:00:00'
        );

        $this->assertEquals($active->id, $picked?->id);
    }
}
```

- [ ] **Step 3.2: Run the test, expect failure (class missing)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php
```

Expected: ERROR — `Class "App\Services\StaffAssigner" not found`.

- [ ] **Step 3.3: Create the `StaffAssigner` skeleton with `pickStaffForSlot`**

Create `backend/app/Services/StaffAssigner.php`:

```php
<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Staff;

class StaffAssigner
{
    /**
     * Pick the staff with the fewest bookings today (excluding cancelled),
     * tie-broken by lowest id, who is free for the given slot.
     * Returns null if no active staff is free.
     */
    public function pickStaffForSlot(int $shopId, string $date, string $startTime): ?Staff
    {
        $busyStaffIds = Booking::where('shop_id', $shopId)
            ->where('date', $date)
            ->where('start_time', $startTime)
            ->whereNotNull('staff_id')
            ->pluck('staff_id')
            ->all();

        $candidates = Staff::where('shop_id', $shopId)
            ->where('is_active', true)
            ->whereNotIn('id', $busyStaffIds)
            ->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        // Compute fewest-today count for each candidate
        $counts = Booking::where('shop_id', $shopId)
            ->where('date', $date)
            ->whereIn('staff_id', $candidates->pluck('id'))
            ->where('status', '!=', 'cancelled')
            ->selectRaw('staff_id, COUNT(*) as c')
            ->groupBy('staff_id')
            ->pluck('c', 'staff_id')
            ->all();

        return $candidates
            ->sortBy(fn ($s) => [(int) ($counts[$s->id] ?? 0), $s->id])
            ->first();
    }
}
```

- [ ] **Step 3.4: Run test, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php
```

Expected: 1 test, OK.

- [ ] **Step 3.5: Add the fewest-today test**

Append to `StaffAssignerTest`:

```php
public function test_picks_staff_with_fewest_bookings_today(): void
{
    $shop = Shop::factory()->create();
    $busy = Staff::factory()->create(['shop_id' => $shop->id, 'name' => 'Busy']);
    $light = Staff::factory()->create(['shop_id' => $shop->id, 'name' => 'Light']);

    // Busy already has 2 bookings today
    Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $busy->id,
        'date' => '2026-05-11', 'start_time' => '09:00:00', 'end_time' => '09:30:00',
    ]);
    Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $busy->id,
        'date' => '2026-05-11', 'start_time' => '09:30:00', 'end_time' => '10:00:00',
    ]);

    $picked = (new StaffAssigner())->pickStaffForSlot(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '11:00:00'
    );

    $this->assertEquals($light->id, $picked->id);
}
```

- [ ] **Step 3.6: Run the new test, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php::test_picks_staff_with_fewest_bookings_today
```

Expected: PASS.

- [ ] **Step 3.7: Add tie-breaker test (lower id wins on equal count)**

Append to `StaffAssignerTest`:

```php
public function test_tie_break_by_lowest_id_when_counts_equal(): void
{
    $shop = Shop::factory()->create();
    $first = Staff::factory()->create(['shop_id' => $shop->id]);
    $second = Staff::factory()->create(['shop_id' => $shop->id]);
    // Both have zero bookings today

    $picked = (new StaffAssigner())->pickStaffForSlot(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '11:00:00'
    );

    $this->assertEquals($first->id, $picked->id);
}
```

- [ ] **Step 3.8: Run, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php::test_tie_break_by_lowest_id_when_counts_equal
```

Expected: PASS.

- [ ] **Step 3.9: Add "all busy returns null" test**

Append to `StaffAssignerTest`:

```php
public function test_returns_null_when_all_active_staff_busy_at_slot(): void
{
    $shop = Shop::factory()->create();
    $a = Staff::factory()->create(['shop_id' => $shop->id]);
    $b = Staff::factory()->create(['shop_id' => $shop->id]);

    Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $a->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $b->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $picked = (new StaffAssigner())->pickStaffForSlot(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '10:00:00'
    );

    $this->assertNull($picked);
}
```

- [ ] **Step 3.10: Run, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php::test_returns_null_when_all_active_staff_busy_at_slot
```

Expected: PASS.

- [ ] **Step 3.11: Add "no staff at all returns null" test**

Append to `StaffAssignerTest`:

```php
public function test_returns_null_when_shop_has_no_active_staff(): void
{
    $shop = Shop::factory()->create();
    Staff::factory()->inactive()->create(['shop_id' => $shop->id]);

    $picked = (new StaffAssigner())->pickStaffForSlot(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '10:00:00'
    );

    $this->assertNull($picked);
}
```

- [ ] **Step 3.12: Run all StaffAssigner tests, expect all pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php
```

Expected: 5 tests, all OK.

- [ ] **Step 3.13: Commit**

```bash
git add backend/app/Services/StaffAssigner.php \
        backend/tests/Unit/StaffAssignerTest.php
git commit -m "feat(staffing): StaffAssigner.pickStaffForSlot with load balancing and tie-break"
```

---

## Task 4: Wire `StaffAssigner` into `BookingController::bookSlot`

**Files:**
- Modify: `backend/app/Http/Controllers/BookingController.php`
- Modify: `backend/app/Models/Booking.php`
- Create: `backend/tests/Feature/BookingAssignmentTest.php`

- [ ] **Step 4.1: Write the failing feature test for the auto-assigned path**

Create `backend/tests/Feature/BookingAssignmentTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(); // stub Notify::push outbound HTTP
    }

    public function test_book_slot_assigns_to_only_free_staff(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);

        $response = $this->withHeaders(['X-Device-Id' => 'dev-1'])
            ->postJson("/api/shops/{$shop->id}/book", [
                'date' => '2026-05-11',
                'start_time' => '10:00:00',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('bookings', [
            'shop_id' => $shop->id,
            'staff_id' => $staff->id,
            'status' => 'booked',
            'date' => '2026-05-11',
            'start_time' => '10:00:00',
        ]);
    }

    public function test_book_slot_queues_when_all_staff_busy(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);

        // Pre-book the only staff at 10:00
        \App\Models\Booking::factory()->create([
            'shop_id' => $shop->id, 'staff_id' => $staff->id,
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);

        $response = $this->withHeaders(['X-Device-Id' => 'dev-2'])
            ->postJson("/api/shops/{$shop->id}/book", [
                'date' => '2026-05-11',
                'start_time' => '10:00:00',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('bookings', [
            'shop_id' => $shop->id,
            'staff_id' => null,
            'status' => 'queued',
            'date' => '2026-05-11',
            'start_time' => '10:00:00',
            'device_id' => 'dev-2',
        ]);
    }
}
```

- [ ] **Step 4.2: Run, expect failure**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingAssignmentTest.php
```

Expected: FAIL — first test currently saves booking with `staff_id = null` (no assignment yet). Or 409 due to old uniqueness logic in `Booking::ensureSlotIsAvailableOrFail`.

- [ ] **Step 4.3: Remove the old per-shop uniqueness check from `Booking`**

Modify `backend/app/Models/Booking.php` — delete the `ensureSlotIsAvailableOrFail` method entirely (lines 87-103). Conflict prevention is now per-staff and lives in `StaffAssigner`/the unique index.

- [ ] **Step 4.4: Update `BookingController::bookSlot` to use `StaffAssigner`**

In `backend/app/Http/Controllers/BookingController.php`:

Add at top with the other imports:

```php
use App\Services\StaffAssigner;
```

Replace the body of `bookSlot` (the entire method) with:

```php
public function bookSlot(BookSlotRequest $request, Shop $shop)
{
    try {
        return DB::transaction(function () use ($request, $shop) {

            $date = Carbon::parse($request->date)->format('Y-m-d');
            $startTime = $request->start_time;

            $workingHour = $shop->getWorkingHourOrFail($date);

            $staff = (new StaffAssigner())->pickStaffForSlot(
                shopId: $shop->id,
                date: $date,
                startTime: $startTime
            );

            $booking = Booking::create([
                'status'            => $staff ? 'booked' : 'queued',
                'shop_id'           => $shop->id,
                'staff_id'          => $staff?->id,
                'date'              => $date,
                'start_time'        => $startTime,
                'end_time'          => $shop->getEndSlot(
                    $startTime,
                    $workingHour->slot_duration
                ),
                'device_id'         => $request->header('X-Device-Id'),
                'charges'           => $request->charges ?? 0,
                'services'          => $request->services ?? [],
                'customer_name'     => $request->customer_name,
                'customer_whatsapp' => $request->customer_whatsapp,
            ]);

            $payload = $booking->toArray();
            $payload['notification_url'] = "https://eloquentservice.com/shop/bookings/action?id=" . $payload['id'];

            $message = $staff
                ? "New booking confirmed: " . $booking->booking_reference . " (assigned to {$staff->name})"
                : "Booking queued: " . $booking->booking_reference . " (no staff free)";

            Notify::push($shop->id, 'booking', $message, $payload);

            return response()->json([
                'message' => $staff ? 'Booking confirmed successfully' : 'Booking queued — waiting for a free staff',
                'data' => $booking,
            ], 201);
        });
    } catch (HttpException $e) {
        return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
    } catch (\Throwable $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}
```

- [ ] **Step 4.5: Run the feature tests, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingAssignmentTest.php
```

Expected: 2 tests, OK.

- [ ] **Step 4.6: Run the full unit suite to confirm no regressions**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit
```

Expected: all unit tests pass.

- [ ] **Step 4.7: Commit**

```bash
git add backend/app/Http/Controllers/BookingController.php \
        backend/app/Models/Booking.php \
        backend/tests/Feature/BookingAssignmentTest.php
git commit -m "feat(staffing): auto-assign staff or queue on bookSlot"
```

---

## Task 5: `StaffAssigner::sweep` — promote queued bookings when a staff frees up

**Files:**
- Modify: `backend/app/Services/StaffAssigner.php`
- Modify: `backend/tests/Unit/StaffAssignerTest.php`

This task adds the queue-promotion method. It does NOT yet wire into any controller — that's Task 6 onward.

- [ ] **Step 5.1: Write the failing unit test for sweep**

Append to `backend/tests/Unit/StaffAssignerTest.php`:

```php
public function test_sweep_promotes_oldest_queued_booking_for_freed_slot(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);

    // Two queued bookings on the same slot, in known order
    $older = Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        'created_at' => now()->subMinutes(10),
    ]);
    $newer = Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        'created_at' => now()->subMinutes(2),
    ]);

    $promoted = (new StaffAssigner())->sweep(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '10:00:00'
    );

    $this->assertCount(1, $promoted);
    $this->assertEquals($older->id, $promoted[0]->id);

    $older->refresh();
    $newer->refresh();

    $this->assertEquals($staff->id, $older->staff_id);
    $this->assertEquals('booked', strtolower($older->status));
    $this->assertNull($newer->staff_id);
    $this->assertEquals('queued', strtolower($newer->status));
}
```

- [ ] **Step 5.2: Run, expect failure (method missing)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php::test_sweep_promotes_oldest_queued_booking_for_freed_slot
```

Expected: ERROR — undefined method `sweep`.

- [ ] **Step 5.3: Implement `sweep`**

At the top of `backend/app/Services/StaffAssigner.php`, add the `Notify` import:

```php
use App\Services\Notify;
```

Append to the class body:

```php
/**
 * After a staff has freed up at a (shop, date, startTime), promote
 * queued bookings to booked when a free staff exists. Returns
 * the bookings that were promoted (in promotion order).
 */
public function sweep(int $shopId, string $date, string $startTime): array
{
    $promoted = [];

    while (true) {
        $next = Booking::where('shop_id', $shopId)
            ->where('date', $date)
            ->where('start_time', $startTime)
            ->whereNull('staff_id')
            ->where('status', 'queued')
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$next) break;

        $staff = $this->pickStaffForSlot($shopId, $date, $startTime);
        if (!$staff) break;

        $next->update([
            'staff_id' => $staff->id,
            'status' => 'booked',
        ]);

        Notify::push(
            $shopId,
            'booking',
            "Queued booking promoted: {$next->booking_reference} (assigned to {$staff->name})",
            $next->fresh()->toArray()
        );

        $promoted[] = $next;
    }

    return $promoted;
}
```

- [ ] **Step 5.4: Run, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php::test_sweep_promotes_oldest_queued_booking_for_freed_slot
```

Expected: PASS.

- [ ] **Step 5.5: Add a "no free staff means no promotion" test**

Append to `StaffAssignerTest`:

```php
public function test_sweep_promotes_nothing_when_no_staff_free(): void
{
    $shop = Shop::factory()->create();
    // No active staff at all
    Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $promoted = (new StaffAssigner())->sweep(
        shopId: $shop->id,
        date: '2026-05-11',
        startTime: '10:00:00'
    );

    $this->assertEmpty($promoted);
}
```

- [ ] **Step 5.6: Run all StaffAssigner tests**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Unit/StaffAssignerTest.php
```

Expected: 7 tests, all OK.

- [ ] **Step 5.7: Commit**

```bash
git add backend/app/Services/StaffAssigner.php \
        backend/tests/Unit/StaffAssignerTest.php
git commit -m "feat(staffing): StaffAssigner.sweep promotes oldest queued bookings"
```

---

## Task 6: Trigger `sweep` on booking status change (cancelled / completed)

**Files:**
- Modify: `backend/app/Http/Controllers/BookingController.php` (the `update` method around line 165)
- Create: `backend/tests/Feature/QueuePromotionTest.php`

- [ ] **Step 6.1: Read the current `update` method**

Read `backend/app/Http/Controllers/BookingController.php` around line 165 to confirm the current implementation. The method validates status and calls `$booking->update(['status' => …])`.

- [ ] **Step 6.2: Write the failing test for cancellation triggering promotion**

Create `backend/tests/Feature/QueuePromotionTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Shop;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QueuePromotionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake();
    }

    public function test_cancelling_a_booking_promotes_a_queued_booking_for_same_slot(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);

        $assigned = Booking::factory()->create([
            'shop_id' => $shop->id, 'staff_id' => $staff->id, 'status' => 'booked',
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);
        $queued = Booking::factory()->queued()->create([
            'shop_id' => $shop->id,
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);

        $response = $this->putJson("/api/booking/{$assigned->id}", ['status' => 'cancelled']);
        $response->assertStatus(200);

        $queued->refresh();
        $this->assertEquals($staff->id, $queued->staff_id);
        $this->assertEquals('booked', strtolower($queued->status));
    }
}
```

- [ ] **Step 6.3: Run, expect failure (no sweep wired in)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/QueuePromotionTest.php
```

Expected: FAIL — `$queued->staff_id` is still null.

- [ ] **Step 6.4: Wire sweep into the update method**

Modify `backend/app/Http/Controllers/BookingController.php`. At the top of the file, ensure `StaffAssigner` is imported (it should already be from Task 4).

Find the `update($id, Request $request)` method (around line 160) and replace its body with:

```php
public function update($id, Request $request)
{
    $booking = Booking::findOrFail($id);

    $validated = $request->validate([
        'status' => 'required|in:booked,completed,cancelled,Booked,Completed,Cancelled'
    ]);

    $previousStatus = strtolower($booking->status);
    $previousStaffId = $booking->staff_id;

    $booking->update(['status' => strtolower($validated['status'])]);

    $newStatus = strtolower($validated['status']);
    $vacates = in_array($newStatus, ['cancelled', 'completed'], true)
        && in_array($previousStatus, ['booked'], true)
        && $previousStaffId !== null;

    if ($vacates) {
        (new StaffAssigner())->sweep(
            shopId: $booking->shop_id,
            date: \Carbon\Carbon::parse($booking->date)->format('Y-m-d'),
            startTime: $booking->getRawOriginal('start_time')
        );
    }

    return response()->json($booking->fresh());
}
```

(Note: `getRawOriginal('start_time')` returns the underlying `HH:MM:SS` string, bypassing the model's `H:i` cast which would otherwise drop the seconds.)

- [ ] **Step 6.5: Run, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/QueuePromotionTest.php
```

Expected: PASS.

- [ ] **Step 6.6: Add the "completed also promotes" test**

Append to `QueuePromotionTest`:

```php
public function test_marking_completed_also_promotes_a_queued_booking(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);

    $assigned = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id, 'status' => 'booked',
        'date' => '2026-05-11', 'start_time' => '11:00:00', 'end_time' => '11:30:00',
    ]);
    $queued = Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '11:00:00', 'end_time' => '11:30:00',
    ]);

    $this->putJson("/api/booking/{$assigned->id}", ['status' => 'completed'])
        ->assertStatus(200);

    $queued->refresh();
    $this->assertEquals($staff->id, $queued->staff_id);
    $this->assertEquals('booked', strtolower($queued->status));
}
```

- [ ] **Step 6.7: Run all QueuePromotionTest tests**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/QueuePromotionTest.php
```

Expected: 2 tests, OK.

- [ ] **Step 6.8: Commit**

```bash
git add backend/app/Http/Controllers/BookingController.php \
        backend/tests/Feature/QueuePromotionTest.php
git commit -m "feat(staffing): cancel/complete promotes oldest queued booking on freed slot"
```

---

## Task 7: Staff CRUD endpoints

**Files:**
- Create: `backend/app/Http/Requests/StoreStaffRequest.php`
- Create: `backend/app/Http/Requests/UpdateStaffRequest.php`
- Create: `backend/app/Http/Controllers/StaffController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/StaffCrudTest.php`

- [ ] **Step 7.1: Write the failing CRUD test**

Create `backend/tests/Feature/StaffCrudTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_list_update_deactivate_staff_for_a_shop(): void
    {
        $shop = Shop::factory()->create();

        // Create
        $createResp = $this->postJson("/api/shops/{$shop->id}/staff", ['name' => 'Ali']);
        $createResp->assertStatus(201)
            ->assertJsonPath('data.name', 'Ali')
            ->assertJsonPath('data.is_active', true);

        $id = $createResp->json('data.id');

        // List
        $this->getJson("/api/shops/{$shop->id}/staff")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // Update name
        $this->putJson("/api/shops/{$shop->id}/staff/{$id}", ['name' => 'Ali B.'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Ali B.');

        // Deactivate
        $this->putJson("/api/shops/{$shop->id}/staff/{$id}", ['is_active' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_create_staff_requires_name(): void
    {
        $shop = Shop::factory()->create();
        $this->postJson("/api/shops/{$shop->id}/staff", [])
            ->assertStatus(422);
    }
}
```

- [ ] **Step 7.2: Run, expect failure (routes missing)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/StaffCrudTest.php
```

Expected: FAIL with 404 (route not defined).

- [ ] **Step 7.3: Create `StoreStaffRequest`**

Create `backend/app/Http/Requests/StoreStaffRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
```

- [ ] **Step 7.4: Create `UpdateStaffRequest`**

Create `backend/app/Http/Requests/UpdateStaffRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
```

- [ ] **Step 7.5: Create `StaffController`**

Create `backend/app/Http/Controllers/StaffController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Models\Shop;
use App\Models\Staff;
use App\Services\StaffAssigner;

class StaffController extends Controller
{
    public function index(Shop $shop)
    {
        return response()->json([
            'data' => $shop->staff()->orderBy('id')->get(),
        ]);
    }

    public function store(StoreStaffRequest $request, Shop $shop)
    {
        $staff = $shop->staff()->create([
            'name' => $request->name,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json(['data' => $staff], 201);
    }

    public function show(Shop $shop, Staff $staff)
    {
        abort_unless($staff->shop_id === $shop->id, 404);
        return response()->json(['data' => $staff]);
    }

    public function update(UpdateStaffRequest $request, Shop $shop, Staff $staff)
    {
        abort_unless($staff->shop_id === $shop->id, 404);

        $wasInactive = !$staff->is_active;
        $staff->update($request->only(['name', 'is_active']));

        // If staff was just (re)activated, sweep all queued bookings for the shop.
        if ($wasInactive && $staff->fresh()->is_active) {
            $this->sweepAllQueuedForShop($shop->id);
        }

        return response()->json(['data' => $staff->fresh()]);
    }

    public function destroy(Shop $shop, Staff $staff)
    {
        abort_unless($staff->shop_id === $shop->id, 404);
        $staff->update(['is_active' => false]);
        return response()->json(['data' => $staff->fresh()]);
    }

    private function sweepAllQueuedForShop(int $shopId): void
    {
        $assigner = new StaffAssigner();
        $slots = \App\Models\Booking::where('shop_id', $shopId)
            ->whereNull('staff_id')
            ->where('status', 'queued')
            ->select('date', 'start_time')
            ->distinct()
            ->get();

        foreach ($slots as $row) {
            $assigner->sweep(
                shopId: $shopId,
                date: \Carbon\Carbon::parse($row->date)->format('Y-m-d'),
                startTime: $row->getRawOriginal('start_time'),
            );
        }
    }
}
```

- [ ] **Step 7.6: Add the routes**

Modify `backend/routes/api.php`. Find the line with `Route::apiResource('/shops', ShopController::class);` (line 110) and immediately after it, add:

```php
Route::get('/shops/{shop}/staff', [\App\Http\Controllers\StaffController::class, 'index']);
Route::post('/shops/{shop}/staff', [\App\Http\Controllers\StaffController::class, 'store']);
Route::get('/shops/{shop}/staff/{staff}', [\App\Http\Controllers\StaffController::class, 'show']);
Route::put('/shops/{shop}/staff/{staff}', [\App\Http\Controllers\StaffController::class, 'update']);
Route::delete('/shops/{shop}/staff/{staff}', [\App\Http\Controllers\StaffController::class, 'destroy']);
```

- [ ] **Step 7.7: Run the CRUD tests, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/StaffCrudTest.php
```

Expected: 2 tests, OK.

- [ ] **Step 7.8: Add the "activating staff sweeps queued" test**

Append to `StaffCrudTest`:

```php
public function test_activating_a_previously_inactive_staff_promotes_queued_bookings(): void
{
    $shop = Shop::factory()->create();
    $inactive = Staff::factory()->inactive()->create(['shop_id' => $shop->id]);

    $queued = \App\Models\Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $this->putJson("/api/shops/{$shop->id}/staff/{$inactive->id}", ['is_active' => true])
        ->assertStatus(200);

    $queued->refresh();
    $this->assertEquals($inactive->id, $queued->staff_id);
    $this->assertEquals('booked', strtolower($queued->status));
}
```

- [ ] **Step 7.9: Run all CRUD tests, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/StaffCrudTest.php
```

Expected: 3 tests, OK.

- [ ] **Step 7.10: Commit**

```bash
git add backend/app/Http/Controllers/StaffController.php \
        backend/app/Http/Requests/StoreStaffRequest.php \
        backend/app/Http/Requests/UpdateStaffRequest.php \
        backend/routes/api.php \
        backend/tests/Feature/StaffCrudTest.php
git commit -m "feat(staffing): staff CRUD endpoints + activation triggers queue sweep"
```

---

## Task 8: Reassign endpoint

**Files:**
- Modify: `backend/app/Http/Controllers/StaffController.php`
- Modify: `backend/routes/api.php`
- Modify: `backend/tests/Feature/QueuePromotionTest.php`

- [ ] **Step 8.1: Write the failing reassign test**

Append to `backend/tests/Feature/QueuePromotionTest.php`:

```php
public function test_reassigning_a_booking_promotes_a_queued_booking_for_vacated_slot(): void
{
    $shop = Shop::factory()->create();
    $ali = Staff::factory()->create(['shop_id' => $shop->id, 'name' => 'Ali']);
    $sara = Staff::factory()->create(['shop_id' => $shop->id, 'name' => 'Sara']);

    // Ali holds 10:00, Sara is free
    $aliBooking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $ali->id, 'status' => 'booked',
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    // Queued booking on the same slot
    $queued = Booking::factory()->queued()->create([
        'shop_id' => $shop->id,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    // Reassign Ali's booking to Sara → Ali frees up at 10:00, queued promotes to Ali
    $this->postJson("/api/booking/{$aliBooking->id}/reassign", ['staff_id' => $sara->id])
        ->assertStatus(200);

    $aliBooking->refresh();
    $queued->refresh();

    $this->assertEquals($sara->id, $aliBooking->staff_id);
    $this->assertEquals($ali->id, $queued->staff_id);
    $this->assertEquals('booked', strtolower($queued->status));
}

public function test_reassign_fails_if_target_staff_already_busy_at_slot(): void
{
    $shop = Shop::factory()->create();
    $ali = Staff::factory()->create(['shop_id' => $shop->id]);
    $sara = Staff::factory()->create(['shop_id' => $shop->id]);

    $aliBooking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $ali->id, 'status' => 'booked',
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $sara->id, 'status' => 'booked',
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $this->postJson("/api/booking/{$aliBooking->id}/reassign", ['staff_id' => $sara->id])
        ->assertStatus(409);
}
```

- [ ] **Step 8.2: Run, expect failure (route 404)**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/QueuePromotionTest.php
```

Expected: 2 of 4 tests fail (the new ones).

- [ ] **Step 8.3: Add `reassign` to `StaffController`**

Append to `backend/app/Http/Controllers/StaffController.php` inside the class:

```php
public function reassign(\Illuminate\Http\Request $request, $bookingId)
{
    $request->validate(['staff_id' => 'required|integer|exists:staff,id']);

    $booking = \App\Models\Booking::findOrFail($bookingId);
    $target = Staff::findOrFail($request->staff_id);

    abort_unless($target->shop_id === $booking->shop_id, 422);
    abort_unless($target->is_active, 422);

    $sourceStaffId = $booking->staff_id;

    // Conflict check on target (skip self)
    $conflict = \App\Models\Booking::where('shop_id', $booking->shop_id)
        ->where('staff_id', $target->id)
        ->where('date', $booking->getRawOriginal('date'))
        ->where('start_time', $booking->getRawOriginal('start_time'))
        ->where('id', '!=', $booking->id)
        ->exists();

    if ($conflict) {
        return response()->json(['message' => 'Target staff is already booked at this slot.'], 409);
    }

    $booking->update(['staff_id' => $target->id, 'status' => 'booked']);

    // If we vacated a different staff, sweep that slot
    if ($sourceStaffId && $sourceStaffId !== $target->id) {
        (new StaffAssigner())->sweep(
            shopId: $booking->shop_id,
            date: \Carbon\Carbon::parse($booking->date)->format('Y-m-d'),
            startTime: $booking->getRawOriginal('start_time'),
        );
    }

    return response()->json(['data' => $booking->fresh()]);
}
```

- [ ] **Step 8.4: Add the route**

Modify `backend/routes/api.php`. Below the staff routes added in Task 7, add:

```php
Route::post('/booking/{booking}/reassign', [\App\Http\Controllers\StaffController::class, 'reassign']);
```

- [ ] **Step 8.5: Run all queue-promotion tests, expect pass**

Run:

```bash
cd backend && vendor/bin/phpunit tests/Feature/QueuePromotionTest.php
```

Expected: 4 tests, OK.

- [ ] **Step 8.6: Run the full feature + unit test suites to confirm no regressions**

Run:

```bash
cd backend && vendor/bin/phpunit
```

Expected: all tests pass.

- [ ] **Step 8.7: Commit**

```bash
git add backend/app/Http/Controllers/StaffController.php \
        backend/routes/api.php \
        backend/tests/Feature/QueuePromotionTest.php
git commit -m "feat(staffing): reassign endpoint with conflict check and source-slot sweep"
```

---

## Task 9: Final verification + cleanup

- [ ] **Step 9.1: Run the complete test suite**

Run:

```bash
cd backend && vendor/bin/phpunit
```

Expected: ALL tests green.

- [ ] **Step 9.2: Run `php artisan migrate:fresh` against the dev database to confirm migrations apply cleanly outside the test env**

Run:

```bash
cd backend && php artisan migrate:fresh
```

Expected: all migrations succeed, no errors.

- [ ] **Step 9.3: Smoke-check with `php artisan tinker`**

Run:

```bash
cd backend && php artisan tinker --execute='
$s = \App\Models\Shop::factory()->create();
$staff = \App\Models\Staff::factory()->create(["shop_id" => $s->id, "name" => "TestStaff"]);
echo "OK shop={$s->id} staff={$staff->id}\n";
'
```

Expected: line `OK shop=N staff=M` printed, no exceptions.

- [ ] **Step 9.4: Verify the unique index swap by attempting a duplicate**

Run:

```bash
cd backend && php artisan tinker --execute='
$s = \App\Models\Shop::factory()->create();
$a = \App\Models\Staff::factory()->create(["shop_id" => $s->id]);
$b = \App\Models\Staff::factory()->create(["shop_id" => $s->id]);

// Two staff, same slot — should both succeed
\App\Models\Booking::create([
    "shop_id" => $s->id, "staff_id" => $a->id,
    "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
    "status" => "booked", "device_id" => "x",
]);
\App\Models\Booking::create([
    "shop_id" => $s->id, "staff_id" => $b->id,
    "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
    "status" => "booked", "device_id" => "y",
]);

// Two queued (staff_id null) on same slot — should also both succeed
\App\Models\Booking::create([
    "shop_id" => $s->id, "staff_id" => null,
    "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
    "status" => "queued", "device_id" => "z",
]);
\App\Models\Booking::create([
    "shop_id" => $s->id, "staff_id" => null,
    "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
    "status" => "queued", "device_id" => "w",
]);

echo "OK 4 bookings created\n";
'
```

Expected: `OK 4 bookings created` — confirms the unique index allows multi-staff on same slot and multiple queued on same slot.

- [ ] **Step 9.5: Verify same-staff duplicate still rejected**

Run:

```bash
cd backend && php artisan tinker --execute='
try {
    $s = \App\Models\Shop::factory()->create();
    $a = \App\Models\Staff::factory()->create(["shop_id" => $s->id]);
    \App\Models\Booking::create([
        "shop_id" => $s->id, "staff_id" => $a->id,
        "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
        "status" => "booked", "device_id" => "x",
    ]);
    \App\Models\Booking::create([
        "shop_id" => $s->id, "staff_id" => $a->id,
        "date" => "2026-05-11", "start_time" => "10:00:00", "end_time" => "10:30:00",
        "status" => "booked", "device_id" => "y",
    ]);
    echo "FAIL — duplicate accepted\n";
} catch (\Throwable $e) {
    echo "OK duplicate rejected: " . substr($e->getMessage(), 0, 80) . "\n";
}
'
```

Expected: `OK duplicate rejected: ...` — confirms unique constraint enforces one booking per staff per slot.

- [ ] **Step 9.6: Final commit (if any pending changes)**

Run `git status`. If anything is uncommitted, decide whether it's relevant:

```bash
git status
```

If clean, the plan is complete.

---

## Out-of-scope follow-ups (next plans)

- `2026-04-30-staffing-phase-1-frontend.md` — Next.js shop dashboard: Staff CRUD page, calendar grouped by staff, Queue tab, reassign UI.
- `2026-04-30-staffing-phase-1-mobile.md` — React Native shop app: staff filter on bookings screen, queue indicator, manual assign action.
- Phase 2: per-staff working hours and days off.
- Phase 3: customer-visible staff selection, service-staff capability matrix, staff login.

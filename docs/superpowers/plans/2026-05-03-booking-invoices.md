# Booking Invoices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Auto-issue an invoice when a booking is completed, with PDF download, mark-paid action, and WhatsApp sharing — all on the existing booking action page.

**Architecture:** A new `booking_invoices` table (one row per completed booking, unique on `booking_id`). Invoice creation is hooked inside `BookingController::update`. PDF rendered with `barryvdh/laravel-dompdf`. Frontend adds a section to the booking action page.

**Tech Stack:** Laravel 12 + PHPUnit 11 + dompdf (backend); Next.js 16 + Tailwind + axios (frontend).

**Spec:** [docs/superpowers/specs/2026-05-03-booking-invoices-design.md](../specs/2026-05-03-booking-invoices-design.md)

---

## File Structure

| Path | Status | Responsibility |
|---|---|---|
| `backend/database/migrations/2026_05_03_000001_create_booking_invoices_table.php` | Create | New table |
| `backend/app/Models/BookingInvoice.php` | Create | Eloquent model + invoice_number boot hook |
| `backend/database/factories/BookingInvoiceFactory.php` | Create | Test factory |
| `backend/app/Models/Booking.php` | Modify | Add `invoice()` hasOne |
| `backend/app/Http/Controllers/BookingController.php` | Modify | (a) auto-create invoice on completion; (b) cascade cancel; (c) eager-load `invoice` in `show` |
| `backend/app/Http/Controllers/BookingInvoiceController.php` | Create | New controller for `show`, `pdf`, `markPaid` |
| `backend/routes/api.php` | Modify | Add 3 invoice routes |
| `backend/resources/views/invoices/booking-invoice.blade.php` | Create | PDF Blade template |
| `backend/tests/Feature/BookingInvoiceTest.php` | Create | Feature tests for the full flow |
| `frontend/src/app/shop/bookings/action/page.js` | Modify | Add Invoice section |

Tests follow the existing pattern: `RefreshDatabase`, in-memory SQLite, `Http::fake()` to stub `Notify::push`.

Backend commits land on inner `backend/` repo's `main` branch (per established pattern). Frontend commits land on outer repo's `master`.

---

## Task 1: Migration + `BookingInvoice` model + factory

**Files:**
- Create: `backend/database/migrations/2026_05_03_000001_create_booking_invoices_table.php`
- Create: `backend/app/Models/BookingInvoice.php`
- Create: `backend/database/factories/BookingInvoiceFactory.php`
- Modify: `backend/app/Models/Booking.php`

- [ ] **Step 1.1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id')->unique();
            $table->string('invoice_number')->unique();
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->string('status')->default('issued'); // issued | paid | cancelled
            $table->dateTime('issued_at')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_invoices');
    }
};
```

- [ ] **Step 1.2: Create the model**

`backend/app/Models/BookingInvoice.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id', 'invoice_number',
        'subtotal', 'total', 'status',
        'issued_at', 'paid_at',
    ];

    protected $casts = [
        'subtotal'  => 'decimal:2',
        'total'     => 'decimal:2',
        'issued_at' => 'datetime',
        'paid_at'   => 'datetime',
    ];

    protected static function booted()
    {
        static::created(function ($invoice) {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = 'INV' . str_pad((string) $invoice->id, 5, '0', STR_PAD_LEFT);
                $invoice->saveQuietly();
            }
        });
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    protected static function newFactory()
    {
        return \Database\Factories\BookingInvoiceFactory::new();
    }
}
```

- [ ] **Step 1.3: Create the factory**

`backend/database/factories/BookingInvoiceFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\BookingInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingInvoiceFactory extends Factory
{
    protected $model = BookingInvoice::class;

    public function definition(): array
    {
        return [
            'booking_id'    => 1,
            'subtotal'      => 100,
            'total'         => 100,
            'status'        => 'issued',
            'issued_at'     => now(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => 'paid', 'paid_at' => now()]);
    }
}
```

- [ ] **Step 1.4: Add `invoice()` to Booking model**

In `backend/app/Models/Booking.php`, append inside the class body (alongside `staff()` / `shop()`):

```php
public function invoice()
{
    return $this->hasOne(BookingInvoice::class);
}
```

- [ ] **Step 1.5: Run migrations + smoke test the factory**

```bash
cd backend && php artisan migrate
cd backend && php artisan tinker --execute='
$shop = \App\Models\Shop::factory()->create();
$staff = \App\Models\Staff::factory()->create(["shop_id" => $shop->id]);
$booking = \App\Models\Booking::factory()->create(["shop_id" => $shop->id, "staff_id" => $staff->id, "charges" => 75]);
$invoice = \App\Models\BookingInvoice::create([
    "booking_id" => $booking->id,
    "subtotal" => 75, "total" => 75,
    "status" => "issued", "issued_at" => now(),
]);
echo "OK invoice_number=" . $invoice->fresh()->invoice_number . "\n";
'
```

Expected: `OK invoice_number=INV00001` (or higher if other rows exist).

- [ ] **Step 1.6: Do NOT commit yet.**

---

## Task 2: Auto-create invoice on completion + cascade cancel

**Files:**
- Modify: `backend/app/Http/Controllers/BookingController.php`
- Create: `backend/tests/Feature/BookingInvoiceTest.php`

- [ ] **Step 2.1: Write the failing feature test for auto-creation**

`backend/tests/Feature/BookingInvoiceTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingInvoice;
use App\Models\Shop;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake();
    }

    public function test_completing_a_booking_creates_an_invoice(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);
        $booking = Booking::factory()->create([
            'shop_id' => $shop->id, 'staff_id' => $staff->id,
            'status' => 'booked', 'charges' => 75,
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);

        $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed'])
            ->assertStatus(200);

        $this->assertDatabaseHas('booking_invoices', [
            'booking_id' => $booking->id,
            'subtotal'   => '75.00',
            'total'      => '75.00',
            'status'     => 'issued',
        ]);
    }

    public function test_completing_twice_is_idempotent(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);
        $booking = Booking::factory()->create([
            'shop_id' => $shop->id, 'staff_id' => $staff->id,
            'status' => 'booked', 'charges' => 75,
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);

        $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);
        // Re-mark completed (e.g., admin clicks the button again)
        $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);

        $this->assertEquals(1, BookingInvoice::where('booking_id', $booking->id)->count());
    }

    public function test_cancelling_a_booking_cancels_its_invoice(): void
    {
        $shop = Shop::factory()->create();
        $staff = Staff::factory()->create(['shop_id' => $shop->id]);
        $booking = Booking::factory()->create([
            'shop_id' => $shop->id, 'staff_id' => $staff->id,
            'status' => 'booked', 'charges' => 75,
            'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
        ]);

        // Complete first → creates invoice
        $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);

        // Now cancel it
        $this->putJson("/api/booking/{$booking->id}", ['status' => 'cancelled']);

        $this->assertDatabaseHas('booking_invoices', [
            'booking_id' => $booking->id,
            'status'     => 'cancelled',
        ]);
    }
}
```

- [ ] **Step 2.2: Run, expect failure**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php
```

Expected: 3 tests fail (no invoice gets created yet).

- [ ] **Step 2.3: Wire invoice creation into `BookingController::update`**

In `backend/app/Http/Controllers/BookingController.php`, find the `update($id, Request $request)` method (the one we modified in Task 6 of staffing — it currently has the staff sweep logic). Add invoice handling AFTER the existing sweep block. Final method body should be:

```php
public function update($id, Request $request)
{
    $booking = Booking::findOrFail($id);

    $validated = $request->validate([
        'status' => 'required|in:booked,completed,cancelled,Booked,Completed,Cancelled'
    ]);

    $previousStatus = strtolower($booking->status);
    $previousStaffId = $booking->staff_id;
    $newStatus = strtolower($validated['status']);

    // The Task 6 (staffing) behaviour: cancel/complete nullifies staff_id so the slot frees up.
    $updates = ['status' => $newStatus];
    if (in_array($newStatus, ['cancelled', 'completed'], true) && $previousStaffId !== null) {
        $updates['staff_id'] = null;
    }
    $booking->update($updates);

    $vacates = in_array($newStatus, ['cancelled', 'completed'], true)
        && $previousStatus === 'booked'
        && $previousStaffId !== null;

    if ($vacates) {
        (new \App\Services\StaffAssigner())->sweep(
            shopId: $booking->shop_id,
            date: \Carbon\Carbon::parse($booking->date)->format('Y-m-d'),
            startTime: $booking->getRawOriginal('start_time')
        );
    }

    // --- Invoice handling ---
    if ($newStatus === 'completed' && $previousStatus === 'booked') {
        \App\Models\BookingInvoice::firstOrCreate(
            ['booking_id' => $booking->id],
            [
                'subtotal'  => $booking->charges ?? 0,
                'total'     => $booking->charges ?? 0,
                'status'    => 'issued',
                'issued_at' => now(),
            ]
        );
    }

    if ($newStatus === 'cancelled') {
        $booking->invoice?->update(['status' => 'cancelled']);
    }

    return response()->json($booking->fresh(['staff', 'invoice']));
}
```

(Note: I'm consolidating the previous staffing logic with the new invoice logic. The staff `null` setting was already in production from Task 6 of the staffing plan; just re-stating it here so the merged method is coherent in one place.)

- [ ] **Step 2.4: Eager-load invoice on `show`**

In `BookingController::show($id)` (around line 105), update the `with(...)` to include `invoice`:

```php
$booking = Booking::with(['shop', 'staff:id,name,is_active', 'invoice'])->find($id);
```

(If the `show` method doesn't currently use `with()`, add it. Check the file.)

- [ ] **Step 2.5: Run, expect green**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php
```

Expected: 3 tests, OK.

- [ ] **Step 2.6: Run full suite — no regressions**

```bash
cd backend && vendor/bin/phpunit
```

Expected: all tests pass.

- [ ] **Step 2.7: DO NOT commit.**

---

## Task 3: API endpoints (JSON, PDF, mark-paid)

**Files:**
- Create: `backend/app/Http/Controllers/BookingInvoiceController.php`
- Modify: `backend/routes/api.php`
- Modify: `backend/tests/Feature/BookingInvoiceTest.php`

- [ ] **Step 3.1: Append failing tests**

Append to `BookingInvoiceTest.php`:

```php
public function test_get_invoice_json_returns_invoice_for_completed_booking(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);
    $booking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id,
        'status' => 'booked', 'charges' => 100,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);

    $this->getJson("/api/booking/{$booking->id}/invoice")
        ->assertStatus(200)
        ->assertJsonPath('data.booking_id', $booking->id)
        ->assertJsonPath('data.status', 'issued')
        ->assertJsonPath('data.total', '100.00');
}

public function test_get_invoice_returns_404_when_no_invoice_exists(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);
    $booking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id,
        'status' => 'booked', 'charges' => 100,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);

    $this->getJson("/api/booking/{$booking->id}/invoice")
        ->assertStatus(404);
}

public function test_mark_paid_flips_status_and_sets_paid_at(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);
    $booking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id,
        'status' => 'booked', 'charges' => 100,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);

    $invoiceId = BookingInvoice::where('booking_id', $booking->id)->first()->id;

    $this->postJson("/api/invoice/{$invoiceId}/mark-paid")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'paid');

    $this->assertNotNull(BookingInvoice::find($invoiceId)->paid_at);
}

public function test_mark_paid_returns_409_if_already_paid(): void
{
    $shop = Shop::factory()->create();
    $staff = Staff::factory()->create(['shop_id' => $shop->id]);
    $booking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id,
        'status' => 'booked', 'charges' => 100,
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);
    $invoice = BookingInvoice::where('booking_id', $booking->id)->first();

    $this->postJson("/api/invoice/{$invoice->id}/mark-paid")->assertStatus(200);
    $this->postJson("/api/invoice/{$invoice->id}/mark-paid")->assertStatus(409);
}
```

(PDF test deferred to Task 4 once the Blade view exists.)

- [ ] **Step 3.2: Run, expect failure (routes missing)**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php
```

Expected: 4 new tests fail with 404.

- [ ] **Step 3.3: Create the controller**

`backend/app/Http/Controllers/BookingInvoiceController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingInvoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class BookingInvoiceController extends Controller
{
    public function show($bookingId)
    {
        $booking = Booking::with(['shop', 'staff:id,name', 'invoice'])->findOrFail($bookingId);

        if (!$booking->invoice) {
            return response()->json(['message' => 'No invoice for this booking.'], 404);
        }

        return response()->json(['data' => $booking->invoice]);
    }

    public function pdf($bookingId)
    {
        $booking = Booking::with(['shop', 'invoice'])->findOrFail($bookingId);

        if (!$booking->invoice) {
            abort(404, 'No invoice for this booking.');
        }

        $pdf = Pdf::loadView('invoices.booking-invoice', [
            'booking' => $booking,
            'invoice' => $booking->invoice,
            'shop'    => $booking->shop,
        ]);

        return $pdf->stream("{$booking->invoice->invoice_number}.pdf");
    }

    public function markPaid($invoiceId)
    {
        $invoice = BookingInvoice::findOrFail($invoiceId);

        if ($invoice->status !== 'issued') {
            return response()->json([
                'message' => "Invoice is already {$invoice->status}.",
            ], 409);
        }

        $invoice->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json(['data' => $invoice->fresh()]);
    }
}
```

- [ ] **Step 3.4: Add routes**

Modify `backend/routes/api.php`. After the existing booking routes (around the `Route::post('/shops/{shop}/book', ...)` block), add:

```php
Route::get('/booking/{booking}/invoice', [\App\Http\Controllers\BookingInvoiceController::class, 'show']);
Route::get('/booking/{booking}/invoice/pdf', [\App\Http\Controllers\BookingInvoiceController::class, 'pdf']);
Route::post('/invoice/{invoice}/mark-paid', [\App\Http\Controllers\BookingInvoiceController::class, 'markPaid']);
```

- [ ] **Step 3.5: Run JSON + mark-paid tests, expect green**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php --filter='test_get_invoice_json_returns_invoice|test_get_invoice_returns_404|test_mark_paid_flips|test_mark_paid_returns_409'
```

Expected: 4 tests, OK. PDF route still has no Blade view; that's the next task.

- [ ] **Step 3.6: DO NOT commit.**

---

## Task 4: PDF Blade template

**Files:**
- Create: `backend/resources/views/invoices/booking-invoice.blade.php`
- Modify: `backend/tests/Feature/BookingInvoiceTest.php`

- [ ] **Step 4.1: Append PDF test**

Append to `BookingInvoiceTest.php`:

```php
public function test_pdf_endpoint_returns_pdf_stream(): void
{
    $shop = Shop::factory()->create(['name' => 'Test Shop']);
    $staff = Staff::factory()->create(['shop_id' => $shop->id, 'name' => 'Ali']);
    $booking = Booking::factory()->create([
        'shop_id' => $shop->id, 'staff_id' => $staff->id,
        'status' => 'booked', 'charges' => 100,
        'customer_name' => 'Layla',
        'services' => [
            ['title' => 'Haircut', 'price' => 50],
            ['title' => 'Beard trim', 'price' => 50],
        ],
        'date' => '2026-05-11', 'start_time' => '10:00:00', 'end_time' => '10:30:00',
    ]);
    $this->putJson("/api/booking/{$booking->id}", ['status' => 'completed']);

    $response = $this->get("/api/booking/{$booking->id}/invoice/pdf");
    $response->assertStatus(200);
    $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type'));
}
```

- [ ] **Step 4.2: Run, expect failure (view missing)**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php::test_pdf_endpoint_returns_pdf_stream
```

Expected: failure with `View [invoices.booking-invoice] not found`.

- [ ] **Step 4.3: Create the Blade template**

`backend/resources/views/invoices/booking-invoice.blade.php`:

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 11pt; }
        .container { max-width: 720px; margin: 0 auto; padding: 30px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #4b8eff; padding-bottom: 16px; margin-bottom: 24px; }
        .shop-name { font-size: 20pt; font-weight: 900; color: #4b8eff; }
        .shop-meta { color: #6b7280; font-size: 9pt; line-height: 1.5; }
        .invoice-title { font-size: 14pt; font-weight: 900; text-align: right; }
        .invoice-meta { text-align: right; font-size: 9pt; color: #6b7280; line-height: 1.6; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 900; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; }
        .status-issued { background: #4b8eff20; color: #4b8eff; }
        .status-paid { background: #22c55e20; color: #16a34a; }
        .status-cancelled { background: #ef444420; color: #dc2626; }
        .section-title { font-size: 9pt; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; font-weight: 700; margin-bottom: 6px; }
        .customer-block { margin-bottom: 24px; }
        .customer-name { font-size: 13pt; font-weight: 700; }
        .customer-meta { color: #6b7280; font-size: 9pt; margin-top: 2px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
        table.items th { text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding: 8px 0; }
        table.items td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 11pt; }
        table.items td.right { text-align: right; }
        .totals { margin-top: 16px; width: 100%; }
        .totals td { padding: 4px 0; font-size: 11pt; }
        .totals td.label { text-align: right; color: #6b7280; padding-right: 16px; width: 75%; }
        .totals td.value { text-align: right; font-weight: 700; }
        .totals tr.total td { font-size: 13pt; font-weight: 900; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px; }
        .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 8pt; text-align: center; }
        .stamp { position: absolute; right: 60px; top: 220px; transform: rotate(-15deg); padding: 8px 24px; border: 4px solid; border-radius: 8px; font-size: 28pt; font-weight: 900; letter-spacing: 4px; opacity: 0.4; }
        .stamp-paid { color: #16a34a; border-color: #16a34a; }
        .stamp-cancelled { color: #dc2626; border-color: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        @if($invoice->status === 'paid')
            <div class="stamp stamp-paid">PAID</div>
        @elseif($invoice->status === 'cancelled')
            <div class="stamp stamp-cancelled">CANCELLED</div>
        @endif

        <div class="header">
            <div>
                <div class="shop-name">{{ $shop->name }}</div>
                <div class="shop-meta">
                    @if(!empty($shop->address)) {{ $shop->address }}<br> @endif
                    @if(!empty($shop->whatsapp)) WhatsApp: {{ $shop->whatsapp }}<br> @endif
                    @if(!empty($shop->shop_code)) Code: {{ $shop->shop_code }} @endif
                </div>
            </div>
            <div>
                <div class="invoice-title">INVOICE {{ $invoice->invoice_number }}</div>
                <div class="invoice-meta">
                    Issued: {{ \Carbon\Carbon::parse($invoice->issued_at)->format('d M Y') }}<br>
                    @if($invoice->paid_at)
                        Paid: {{ \Carbon\Carbon::parse($invoice->paid_at)->format('d M Y') }}<br>
                    @endif
                    <span class="status-badge status-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span>
                </div>
            </div>
        </div>

        <div class="customer-block">
            <div class="section-title">Bill to</div>
            <div class="customer-name">{{ $booking->customer_name ?? 'Guest' }}</div>
            <div class="customer-meta">
                @if(!empty($booking->customer_whatsapp)) {{ $booking->customer_whatsapp }} · @endif
                Booking {{ $booking->booking_reference }}
                · {{ \Carbon\Carbon::parse($booking->date)->format('d M Y') }}
                {{ $booking->getRawOriginal('start_time') ? '· ' . substr($booking->getRawOriginal('start_time'), 0, 5) : '' }}
            </div>
        </div>

        <div class="section-title">Services</div>
        <table class="items">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="right">Price</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $services = is_array($booking->services) ? $booking->services : (json_decode($booking->services ?? '[]', true) ?: []);
                @endphp
                @forelse($services as $service)
                    <tr>
                        <td>{{ $service['title'] ?? $service['name'] ?? 'Service' }}</td>
                        <td class="right">AED {{ number_format((float)($service['price'] ?? 0), 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td>Booking total</td>
                        <td class="right">AED {{ number_format((float)$invoice->total, 2) }}</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <table class="totals">
            <tr>
                <td class="label">Subtotal</td>
                <td class="value">AED {{ number_format((float)$invoice->subtotal, 2) }}</td>
            </tr>
            <tr class="total">
                <td class="label">Total</td>
                <td class="value">AED {{ number_format((float)$invoice->total, 2) }}</td>
            </tr>
        </table>

        <div class="footer">
            Generated by Rezzy · Booking {{ $booking->booking_reference }} · Invoice {{ $invoice->invoice_number }}
        </div>
    </div>
</body>
</html>
```

- [ ] **Step 4.4: Run PDF test, expect green**

```bash
cd backend && vendor/bin/phpunit tests/Feature/BookingInvoiceTest.php
```

Expected: all 8 tests OK.

- [ ] **Step 4.5: Run full suite — no regressions**

```bash
cd backend && vendor/bin/phpunit
```

- [ ] **Step 4.6: DO NOT commit.**

---

## Task 5: Frontend invoice section on booking action page

**Files:**
- Modify: `frontend/src/app/shop/bookings/action/page.js`

The page already has a Staff section we added. Add an Invoice section below Services (or above the persistent footer with Mark Complete / Cancel).

- [ ] **Step 5.1: Add invoice state and handlers**

In `ConfirmationPageContent`, after the existing `useState`s and before `handleBookingUpdate`, add:

```jsx
const [markingPaid, setMarkingPaid] = useState(false);

const handleMarkInvoicePaid = async () => {
    if (!bookingDetails?.invoice?.id) return;
    setMarkingPaid(true);
    try {
        const { data } = await api.post(`/invoice/${bookingDetails.invoice.id}/mark-paid`);
        setBookingDetails((prev) => ({ ...prev, invoice: { ...prev.invoice, ...data.data } }));
        await notify({
            title: 'Marked Paid',
            text: 'Invoice updated.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
        });
    } catch (e) {
        await notify({
            icon: 'error',
            title: 'Error',
            text: e?.response?.data?.message || 'Could not mark paid',
        });
    } finally {
        setMarkingPaid(false);
    }
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const invoicePdfUrl = bookingDetails?.id ? `${apiBase}/booking/${bookingDetails.id}/invoice/pdf` : null;

const sendInvoiceWhatsApp = () => {
    if (!bookingDetails?.customer_whatsapp || !invoicePdfUrl) return;
    const num = String(bookingDetails.customer_whatsapp).replace(/\D/g, '');
    const msg = encodeURIComponent(
        `Your invoice ${bookingDetails.invoice.invoice_number} from ${bookingDetails.shop?.name || 'us'}: ${invoicePdfUrl}`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
};
```

- [ ] **Step 5.2: Add the Invoice section to the JSX**

Find the closing of the Services Section in the page (the section that has `Services Booked` heading). Right after that closing `</div>` (and before the persistent footer's main close), add:

```jsx
{bookingDetails?.invoice && (
    <div className="w-full mt-8">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center">
            <span className="w-1 h-5 bg-[#137fec] rounded-full mr-3"></span>
            Invoice
        </h3>
        <div className="w-full rounded-2xl p-5 shadow-xl border border-[#1E293B] space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invoice</p>
                    <p className="text-base font-black text-white">{bookingDetails.invoice.invoice_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${
                    bookingDetails.invoice.status === 'paid'
                        ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                        : bookingDetails.invoice.status === 'cancelled'
                            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                            : 'bg-[#137fec]/15 text-[#137fec] border border-[#137fec]/30'
                }`}>
                    {bookingDetails.invoice.status}
                </span>
            </div>
            <div className="border-t border-[#1E293B] pt-3 flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="font-black text-white">AED {Number(bookingDetails.invoice.total).toFixed(2)}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <a
                    href={invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-[#137fec]/10 hover:bg-[#137fec]/20 border border-[#137fec]/30 text-[#137fec] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download PDF
                </a>

                {bookingDetails.invoice.status === 'issued' && (
                    <button
                        onClick={handleMarkInvoicePaid}
                        disabled={markingPaid}
                        className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">paid</span>
                        {markingPaid ? 'Saving…' : 'Mark Paid'}
                    </button>
                )}

                {bookingDetails.customer_whatsapp && (
                    <button
                        onClick={sendInvoiceWhatsApp}
                        className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">share</span>
                        Send via WhatsApp
                    </button>
                )}
            </div>
        </div>
    </div>
)}
```

- [ ] **Step 5.3: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 5.4: DO NOT commit.**

---

## Task 6: Final verification

- [ ] **Step 6.1: Full backend suite**

```bash
cd backend && vendor/bin/phpunit
```

Expected: all green (was 20 from staffing + new invoice tests = ~28).

- [ ] **Step 6.2: End-to-end smoke (manual, browser-side)**

After deploying:
1. Have a booking in `Booked` state with `charges = 75` and a customer.
2. Click "Mark as Complete" on the action page.
3. Refresh — Invoice section appears with `INVxxxxx` number, "ISSUED" badge, total `AED 75.00`.
4. Click "Download PDF" — opens new tab with branded invoice.
5. Click "Mark Paid" — status flips to `PAID`, button disappears, paid_at timestamps.
6. Click "Send via WhatsApp" — wa.me opens with pre-filled message.
7. Cancel the booking — refresh, invoice status flips to `cancelled`.

- [ ] **Step 6.3: DO NOT commit. Report changes for the user to review.**

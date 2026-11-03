# Parking Log BD — পার্কিং লগ

A free, fully offline parking log for small parking lots, garages, and
building parking in Bangladesh. Check vehicles in, charge exit fees from
**your own hourly rates**, and keep a searchable exit history — in English
or বাংলা. No accounts, no servers, no network requests.

Live demo: https://fahad3235.github.io/parking-log-bd/

## Problem

A small lot owner or caretaker usually tracks parked vehicles on paper or
in their head: who came in, when, and what they owe on exit. Paper logs get
lost, exit math gets argued over, and yesterday's collections are forgotten
by morning. This app keeps the whole log in the browser, computes the fee
from rates the owner sets, and exports everything as JSON.

## Features

1. **Vehicle check-in** — number plate, type (Motorcycle / Car / CNG /
   Auto-rickshaw / Bus / Truck), entry time (defaults to now), optional
   driver phone (validated as a Bangladeshi mobile when given) and note.
   A plate that is already parked cannot be checked in twice.
2. **Exit with fee math** — pick the exit time (defaults to now) and see
   the fee preview before confirming: billed hours are whole hours rounded
   up, minimum 1 hour, times your hourly rate for that vehicle type.
   Exit before entry and future times are rejected inline.
3. **Dashboard** — vehicles parked now, exits today, revenue collected
   today, and the longest-parked vehicle with its elapsed time.
4. **Search & filters** — parked list searchable by plate with a type
   filter; history searchable by plate and filterable by exit date.
5. **Your hourly rates** — per-type BDT/hour rates, saved in the browser.
   Rates start at ৳0 (unset): the app never assumes a price. Fees are
   always computed from rates you entered.
6. **Data portability** — JSON export of parked vehicles, history, and
   rates; strict import validation (bad JSON, wrong format, unknown
   vehicle type, exit before entry, duplicate parked plates, and bad
   rates are all rejected); two-step erase-all (type DELETE).
7. **Full EN/বাংলা UI toggle** (persisted) with Bengali digits in Bangla
   mode, responsive down to 390px mobile, and empty/loading/error states
   throughout. All data stays in `localStorage` on the device.

## Stack

Vanilla HTML/CSS/JS. No build step, no dependencies, no frameworks, no
network requests. All fee/date math lives in `js/logic.js` as pure
functions (no DOM, no hidden `Date.now()`), so it is unit-tested directly.

## Prerequisites

Any modern browser (Chrome, Firefox, Safari, Edge). Nothing to install.

## Install

No install. Open `index.html` directly, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Dev commands

```sh
node tests/test.js    # 15 unit tests (fee math, validation, import, filters)
node tests/smoke.js   # 12 headless-Chrome checks (check-in, duplicate, exit, history, i18n)
```

The smoke test drives the stock Playwright `headless_shell` binary over raw
CDP against the `file://` page; it needs no network.

## Data format

Exported JSON is versioned (`version: 1`) with three keys:

```json
{
  "version": 1,
  "parked": [{ "plate": "METRO-GA 12-3456", "type": "car",
               "entryMs": 1793455200000, "phone": "", "note": "" }],
  "history": [{ "plate": "METRO-GA 12-3456", "type": "car",
                "entryMs": 1793455200000, "exitMs": 1793464200000, "fee": 150,
                "phone": "", "note": "" }],
  "rates": { "motorcycle": 20, "car": 50, "cng": 30, "bus": 100 }
}
```

## Deployment

Static site — any static host works. GitHub Pages: push to `main` and
enable Pages (Deploy from a branch, `main` / root).

## Limitations

- Data lives in one browser's `localStorage`; it is not synced between
  devices. Use Export/Import to move it.
- Fees are only as correct as the rates and times entered; the app does
  not verify plates, identities, or payments.
- Times use the device clock; a wrong device clock gives wrong durations.
- This is a personal log tool, not an official parking-authority system,
  and it issues no receipts or legal records.

## Status

Complete MVP. Ships EMPTY (no sample vehicles, no preset prices) — every
record and every rate is entered by the user.

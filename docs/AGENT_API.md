# Intertemporal System Agent API

This file is the handoff guide for agents that need to log work, check future schedule windows, manage fixed responsibilities, and read weekly capacity reports.

## Setup

Base URL:

```bash
export BASE_URL="http://localhost:3000"
```

Production URL:

```bash
export BASE_URL="https://intertemporal-system.vercel.app"
```

Agent-authenticated endpoints require:

```bash
export AGENT_API_KEY="your bearer token"
```

Use this header on every agent endpoint:

```bash
-H "Authorization: Bearer $AGENT_API_KEY"
```

All request bodies are JSON:

```bash
-H "Content-Type: application/json"
```

Timezone source of truth: `America/New_York`.

## Block IDs

The system has 14 canonical blocks:

```text
sun_morning
sun_evening
mon_morning
mon_evening
tue_morning
tue_evening
wed_morning
wed_evening
thu_morning
thu_evening
fri_morning
fri_evening
sat_morning
sat_evening
```

Morning blocks run from `06:00` to `14:00`.
Nap is `14:00` to `16:00`.
Evening blocks run from `16:00` to `00:00`.
Sleep is `00:00` to `06:00`.

Rest attribution for logging:

- Nap logs from `14:00` to `16:00` belong to that day's morning block.
- Sleep logs from `00:00` to `06:00` belong to the previous day's evening block.
- Every log gets a `shift_status` of `active`, `nap`, or `sleep`.

## Validation Errors

Invalid JSON returns:

```json
{
  "error": "Invalid JSON body",
  "issues": {},
  "form_errors": []
}
```

Invalid fields return HTTP `400` with structured field errors:

```json
{
  "error": "Invalid log payload",
  "issues": {
    "activity": ["'activity' is required"]
  },
  "form_errors": []
}
```

Unauthorized requests return HTTP `401`:

```json
{
  "error": "Unauthorized. Provide a valid Bearer token."
}
```

## Logs

### Create Log

`POST /api/logs`

Auth: required.

Body:

```json
{
  "activity": "cleaned the car",
  "duration_minutes": 10,
  "logged_at": "2026-06-01T14:30:00-04:00",
  "notes": "optional context",
  "block_id": "optional explicit block override"
}
```

Fields:

- `activity`: required string.
- `duration_minutes`: optional positive integer.
- `logged_at`: optional ISO timestamp with offset. Defaults to now.
- `notes`: optional string.
- `block_id`: optional block override.

Response:

```json
{
  "log": {
    "id": "uuid",
    "block_id": "mon_morning",
    "logged_at": "2026-06-01T18:30:00.000Z",
    "activity": "cleaned the car",
    "duration_minutes": 10,
    "source": "agent",
    "shift_status": "nap",
    "notes": null,
    "week_start": "2026-06-01",
    "created_at": "2026-06-02T00:00:00.000Z"
  },
  "resolved_block": {
    "id": "mon_morning",
    "label": "Monday Morning Lionel",
    "emoji": "🌅"
  },
  "shift_status": "nap",
  "narrative": "Monday Morning Lionel cleaned the car at 2:30pm, took 10 min.",
  "message": "Monday Morning Lionel cleaned the car at 2:30pm, took 10 min."
}
```

Example:

```bash
curl -sS -X POST "$BASE_URL/api/logs" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"activity":"cleaned the car","duration_minutes":10,"logged_at":"2026-06-01T14:30:00-04:00"}'
```

Expected nap attribution:

```json
{
  "resolved_block": {
    "id": "mon_morning",
    "label": "Monday Morning Lionel"
  },
  "shift_status": "nap",
  "narrative": "Monday Morning Lionel cleaned the car at 2:30pm, took 10 min."
}
```

### List Logs

`GET /api/logs`

Auth: required.

Optional query params:

- `block_id`
- `week_start`
- `source`
- `shift_status`
- `limit`, max `200`

Example:

```bash
curl -sS "$BASE_URL/api/logs?block_id=mon_morning&week_start=2026-06-01&shift_status=nap" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Response:

```json
{
  "logs": [],
  "count": 0
}
```

## Schedule Check

Use this before proposing or committing a future appointment. It checks 5 minute samples across the window in `America/New_York`.

`POST /api/schedule/check`

Auth: required.

Body:

```json
{
  "startAt": "2026-06-01T14:30:00-04:00",
  "endAt": "2026-06-01T14:45:00-04:00"
}
```

Response if blocked by nap:

```json
{
  "schedulable": false,
  "timezone": "America/New_York",
  "startAt": "2026-06-01T18:30:00.000Z",
  "endAt": "2026-06-01T18:45:00.000Z",
  "reasons": ["Nap window is protected."],
  "touchedBlocks": []
}
```

Response if accepted:

```json
{
  "schedulable": true,
  "timezone": "America/New_York",
  "startAt": "2026-06-01T13:00:00.000Z",
  "endAt": "2026-06-01T13:30:00.000Z",
  "reasons": [],
  "touchedBlocks": ["Monday Morning Lionel"]
}
```

Example:

```bash
curl -sS -X POST "$BASE_URL/api/schedule/check" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"startAt":"2026-06-01T14:30:00-04:00","endAt":"2026-06-01T14:45:00-04:00"}'
```

The endpoint rejects overlaps with:

- Nap, `14:00` to `16:00`.
- Sleep, `00:00` to `06:00`.
- Fixed responsibilities in the `responsibilities` table.

## Responsibilities

Responsibilities are fixed recurring commitments attached to a block.

Times use `HH:MM` or `HH:MM:SS`.

### List Responsibilities

`GET /api/responsibilities`

Auth: required.

Optional query params:

- `block_id`

Example:

```bash
curl -sS "$BASE_URL/api/responsibilities?block_id=tue_evening" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Response:

```json
{
  "responsibilities": [
    {
      "id": "uuid",
      "block_id": "tue_evening",
      "title": "Weekly Livestream",
      "description": "Tuesday evening piano livestream",
      "fixed_start_time": "17:00:00",
      "fixed_end_time": "19:00:00",
      "is_recurring": true,
      "created_at": "2026-06-02T00:00:00.000Z",
      "updated_at": "2026-06-02T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Create Responsibility

`POST /api/responsibilities`

Auth: required.

Body:

```json
{
  "block_id": "mon_morning",
  "title": "Inbox cleanup",
  "description": "Clear priority messages",
  "fixed_start_time": "09:00",
  "fixed_end_time": "09:30",
  "is_recurring": true
}
```

Example:

```bash
curl -sS -X POST "$BASE_URL/api/responsibilities" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"block_id":"mon_morning","title":"Inbox cleanup","description":"Clear priority messages","fixed_start_time":"09:00","fixed_end_time":"09:30","is_recurring":true}'
```

Response:

```json
{
  "responsibility": {
    "id": "uuid",
    "block_id": "mon_morning",
    "title": "Inbox cleanup",
    "description": "Clear priority messages",
    "fixed_start_time": "09:00:00",
    "fixed_end_time": "09:30:00",
    "is_recurring": true
  }
}
```

### Get Responsibility

`GET /api/responsibilities/{id}`

Auth: required.

Example:

```bash
curl -sS "$BASE_URL/api/responsibilities/RESPONSIBILITY_ID" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

### Update Responsibility

`PATCH /api/responsibilities/{id}`

Auth: required.

Body can include any editable field:

```json
{
  "title": "Updated inbox cleanup",
  "description": "Clear priority messages and calendar holds",
  "fixed_start_time": "10:00",
  "fixed_end_time": "10:45",
  "is_recurring": true
}
```

Example:

```bash
curl -sS -X PATCH "$BASE_URL/api/responsibilities/RESPONSIBILITY_ID" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated inbox cleanup","fixed_start_time":"10:00","fixed_end_time":"10:45"}'
```

### Delete Responsibility

`DELETE /api/responsibilities/{id}`

Auth: required.

Example:

```bash
curl -sS -X DELETE "$BASE_URL/api/responsibilities/RESPONSIBILITY_ID" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Response:

```json
{
  "ok": true,
  "deleted_id": "RESPONSIBILITY_ID"
}
```

### Block-scoped Responsibility Read and Create

The older block-scoped endpoint is still available:

```text
GET /api/blocks/{blockId}/responsibilities
POST /api/blocks/{blockId}/responsibilities
```

Auth: required.

For `POST`, omit `block_id` from the body because it comes from the path.

```json
{
  "title": "Inbox cleanup",
  "description": "Clear priority messages",
  "fixed_start_time": "09:00",
  "fixed_end_time": "09:30",
  "is_recurring": true
}
```

## Report

`GET /api/report`

Auth: required.

Optional query params:

- `week_start`, formatted as `YYYY-MM-DD`.

Example:

```bash
curl -sS "$BASE_URL/api/report?week_start=2026-06-01" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Response includes all 14 blocks:

```json
{
  "week_start": "2026-06-01",
  "total_logs": 0,
  "total_minutes": 0,
  "totals": {
    "logCount": 0,
    "loggedMinutes": 0,
    "committedMinutes": 420,
    "capacityMinutes": 6720,
    "allocatedMinutes": 420,
    "remainingMinutes": 6300
  },
  "by_block": {
    "sun_morning": {
      "id": "sun_morning",
      "label": "Sunday Morning Lionel",
      "capacityMinutes": 480,
      "committedMinutes": 240,
      "loggedMinutes": 0,
      "allocatedMinutes": 240,
      "remainingMinutes": 240,
      "utilization": 0.5,
      "status": "balanced"
    }
  },
  "blocks": [],
  "busiest_blocks": ["sun_morning", "thu_evening", "tue_evening"],
  "most_free_blocks": ["sun_evening", "mon_morning", "mon_evening"]
}
```

Status values:

```text
open
balanced
busy
swamped
```

Status rules:

- `swamped`: utilization is at least `88%`, or remaining time is `45` minutes or less.
- `busy`: utilization is at least `68%`.
- `open`: utilization is `25%` or less.
- `balanced`: anything between open and busy.

## Current Context

### Agent Current Block

`GET /api/blocks/current`

Auth: required.

Example:

```bash
curl -sS "$BASE_URL/api/blocks/current" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

During active shift:

```json
{
  "is_rest_period": false,
  "rest_label": null,
  "block": {
    "id": "mon_morning",
    "label": "Monday Morning Lionel",
    "period": "morning",
    "day_of_week": 1,
    "emoji": "🌅",
    "color": "#1A5C6B"
  },
  "responsibilities": [],
  "recent_logs": [],
  "week_start": "2026-06-01",
  "timestamp": "2026-06-02T00:00:00.000Z"
}
```

During rest:

```json
{
  "is_rest_period": true,
  "rest_label": "Night Sleep (12am-6am)",
  "block": null,
  "responsibilities": [],
  "recent_logs": [],
  "week_start": "2026-06-01",
  "timestamp": "2026-06-02T00:00:00.000Z"
}
```

### GUI Current Block

`GET /api/gui/current`

Auth: not required.

This is for browser UI only. Agents should prefer `/api/blocks/current`.

## GUI Logging

`POST /api/gui/logs`

Auth: not required.

This endpoint is intended for the local browser UI. Agents should use `/api/logs`.

Body:

```json
{
  "activity": "cleaned the car",
  "duration_minutes": 10,
  "block_id": "mon_morning",
  "notes": "optional context"
}
```

## Quick Verification Commands

Run these after the Supabase schema has `activity_logs.shift_status`.

Nap logging should attribute to Monday Morning Lionel:

```bash
curl -sS -X POST "$BASE_URL/api/logs" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"activity":"cleaned the car","duration_minutes":10,"logged_at":"2026-06-01T14:30:00-04:00"}'
```

Schedule check should reject a nap overlap:

```bash
curl -sS -X POST "$BASE_URL/api/schedule/check" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"startAt":"2026-06-01T14:30:00-04:00","endAt":"2026-06-01T14:45:00-04:00"}'
```

Report should return 14 blocks, each with a status:

```bash
curl -sS "$BASE_URL/api/report?week_start=2026-06-01" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

## Migration Reminder

If the database existed before `shift_status`, run this once in Supabase SQL Editor:

```sql
alter table public.activity_logs
add column if not exists shift_status text not null default 'active';

update public.activity_logs
set shift_status = 'active'
where shift_status is null;

alter table public.activity_logs
alter column shift_status set default 'active';

alter table public.activity_logs
alter column shift_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_logs_shift_status_check'
      and conrelid = 'public.activity_logs'::regclass
  ) then
    alter table public.activity_logs
    add constraint activity_logs_shift_status_check
    check (shift_status in ('active', 'nap', 'sleep'));
  end if;
end $$;
```

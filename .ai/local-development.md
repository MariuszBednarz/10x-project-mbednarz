# Local Development - Supabase

## Quick Commands

### Start Supabase (gdy chcesz pracować)

```bash
npx supabase start
```

### Stop Supabase (żeby zwolnić zasoby komputera)

```bash
npx supabase stop
```

### Sprawdź status

```bash
npx supabase status
```

### Reset bazy danych (przeładuj wszystkie migracje)

```bash
npx supabase db reset
```

### Zobacz logi

```bash
npx supabase logs
```

## Ważne adresy (gdy Supabase jest uruchomiony)

- **API URL**: http://127.0.0.1:54321
- **Studio** (GUI do bazy): http://127.0.0.1:54323
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Mailpit** (testowanie emaili): http://127.0.0.1:54324

## Credentials (lokalne)

W pliku `.env`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## Migracje

Wszystkie migracje są w `supabase/migrations/`. Uruchamiają się automatycznie przy `supabase start`.

Kolejność:

1. `20250123000000_create_hospital_wards.sql` - tabela hospital_wards (współdzielona z innymi mikroserwisami)
2. `20250123000001_create_user_favorites.sql` - ulubione oddziały użytkowników
3. `20250123000002_create_ai_insights.sql` - AI insights
4. `20250123000003_create_scraping_logs.sql` - logi scrapowania
5. `20250123000004_update_hospital_wards_rls.sql` - RLS dla hospital_wards
6. `20250123000005_add_search_indexes.sql` - indeksy wyszukiwania
7. `20250123000006_add_triggers.sql` - triggery
8. `20250123000007_add_helper_functions.sql` - funkcje pomocnicze

## Authentication

Lokalna instancja ma pełny system auth. Emaile nie są wysyłane - możesz je zobaczyć w Mailpit (http://127.0.0.1:54324).

## RLS (Row Level Security)

Wszystkie polityki RLS działają tak samo jak w produkcji. Możesz je testować lokalnie.

## Docker

Supabase CLI zarządza kontenerami Docker automatycznie:

- Używa dedykowanych portów (54321-54327)
- Nie koliduje z innymi projektami Docker
- Volumes są tworzone automatycznie

## Troubleshooting

### Supabase nie startuje

```bash
npx supabase stop --no-backup
npx supabase start
```

### Migracje się nie aplikują

```bash
npx supabase db reset
```

### Zwalnianie zasobów

Po zakończeniu pracy:

```bash
npx supabase stop
```


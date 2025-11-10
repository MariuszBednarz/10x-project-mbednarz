# Test Plan - HosLU MVP

> **Framework:** Vitest  
> **Focus:** Minimalne testy jednostkowe dla krytycznej logiki biznesowej

---

## Zakres testów

### Priorytet 1 - Walidacja (CRITICAL)

- `src/lib/validation/wards.schema.ts` - walidacja wyszukiwania oddziałów, ochrona XSS/SQL injection
- `src/lib/validation/hospitals.schema.ts` - walidacja filtrów szpitali
- `src/lib/validation/common.schema.ts` - walidacja paginacji
- `src/lib/validation/favorites.schema.ts` - walidacja ulubionych

### Priorytet 2 - Utilities (HIGH)

- `src/lib/utils/auth.ts` - `getAuthenticatedUser()`, `isValidUUID()`
- `src/lib/utils/error-handler.ts` - identyfikacja błędów
- `src/lib/utils/type-guards.ts` - parsowanie danych (polskie znaki, liczby)

### Priorytet 3 - Services (MEDIUM)

- `src/lib/services/wards.service.ts` - logika agregacji oddziałów
- `src/lib/services/status.service.ts` - parsowanie statusu systemu

---

## Setup

### Instalacja

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

### Konfiguracja (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
});
```

### Setup (`vitest.setup.ts`)

```typescript
import "@testing-library/jest-dom";
```

### Skrypty (`package.json`)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## Kluczowe scenariusze testowe

### 1. Walidacja - ochrona przed XSS/SQL Injection

**Plik:** `src/lib/validation/wards.schema.test.ts`

**Co testować:**

- Polskie znaki (ąćęłńóśźż) są akceptowane
- Próby XSS (`<script>alert(1)</script>`) są blokowane
- Próby SQL injection (`'; DROP TABLE--`) są blokowane
- Zbyt długie zapytania (>100 znaków) są odrzucane

### 2. Autentykacja - weryfikacja użytkownika

**Plik:** `src/lib/utils/auth.test.ts`

**Co testować:**

- `getAuthenticatedUser()` zwraca `null` gdy brak użytkownika
- Rzuca błąd gdy email nie zweryfikowany
- Zwraca użytkownika gdy autentykacja OK
- `isValidUUID()` waliduje format UUID

### 3. Parsowanie danych - obsługa błędnych danych

**Plik:** `src/lib/utils/type-guards.test.ts`

**Co testować:**

- `parseAvailablePlaces()` parsuje liczby i znak `-` jako 0
- `validateWardName()` blokuje puste/za długie nazwy i znaki specjalne
- `safeParseBoolean()` zwraca wartość domyślną dla błędnych danych

### 4. Services - mockowanie Supabase

**Plik:** `src/lib/services/wards.service.test.ts`

**Co testować:**

- Wywołanie RPC `get_wards_aggregated` z poprawnymi parametrami
- Obsługa błędów bazy danych
- Poprawna paginacja wyników

---

## Uruchamianie testów

```bash
npm test                    # Tryb watch
npm run test:ui             # UI przeglądarki
npm test -- auth.test.ts    # Konkretny plik
```

---

## Dobre praktyki

1. **Pliki testowe:** `*.test.ts` obok źródeł
2. **Mockowanie Supabase:** Zawsze używaj `vi.fn()` dla klienta Supabase
3. **Edge cases:** Testuj `null`, `undefined`, puste stringi, wartości skrajne
4. **Polskie znaki:** Zawsze testuj `ąćęłńóśźż`
5. **Bezpieczeństwo:** Blokuj XSS i SQL injection
6. **Nazwy:** Opisowe: `it('zwraca null gdy brak użytkownika')` zamiast `it('test1')`

---

## Checklist implementacji

- [x] Instalacja Vitest + zależności
- [x] Konfiguracja `vitest.config.ts` i `vitest.setup.ts`
- [x] Testy walidacji (4 pliki) - **PRIORYTET 1**
- [x] Testy utils (3 pliki) - **PRIORYTET 2**
- [x] Testy services (2 pliki) - **PRIORYTET 3**

**Szacowany czas:** 4-6 godzin dla doświadczonego developera  
**Minimalna liczba testów:** ~30-40 testów  
**Pliki do przetestowania:** ~9 plików źródłowych

---

**End of Document**

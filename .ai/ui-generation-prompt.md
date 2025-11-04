# HosLU Frontend Implementation - Staged UI Generation Prompt

## 📌 CEL

Generować komponenty UI i widoki frontendowe w etapach kontrolowanych.
Po każdej fazie: podsumowanie + plan 3 kolejnych kroków + ⏸️ oczekiwanie na feedback.

---

## 📚 ŹRÓDŁA PRAWDY (PRIORYTET!)

### Specyfikacja UI

**@ui-plan.md** - Kompletna specyfikacja wszystkich widoków i komponentów (sekcje 3-5)

### Reguły Implementacji (obowiązkowe w tej kolejności)

1. **@shared.mdc** - Struktura projektu, kodowanie, best practices
2. **@astro.mdc** - Zasady Astro 5, Server Endpoints, prerender
3. **@api-supabase-astro-init.mdc** - Setup Supabase Client, Middleware, Types
4. **@backend.mdc** - Supabase, API routes, Zod validation
5. **@frontend.mdc** - Styling, Tailwind, Accessibility
6. **@react.mdc** - React 19 + Hooks, functional components
7. **@ui-shadcn-helper.mdc** - shadcn/ui komponenty i instalacja
8. **@db-supabase-migrations.mdc** - Jeśli potrzebne migracje (rzadko przy UI)

### Referencje Projektowe

- **@api-implementation-plan.md** - API endpoints, request/response shapes
- **@src/types.ts** - Główne typy i DTOs
- **@src/types/database.types.ts** - Typy bazy danych (Supabase)
- **@src/lib/services/** - Istniejące serwisy (favorites, hospitals, insights, etc.)

### Tech Stack

- **Astro 5** (SSR/SSG) + **React 19** (interactive components only)
- **Tailwind CSS 4** (domyślne komponenty, bez custom stylowania)
- **shadcn/ui** (komponenty z @/components/ui/)
- **Lucide React** do ikon
- **Supabase** (auth + API)
- **Zod** do validacji
- **React State + SessionStorage** (brak globalnych bibliotek state management)

---

## 🏗️ WORKFLOW: Jak Pracujemy

### 1️⃣ FAZA ANALITYCZNA (5 min)

**Input**: Ty mówisz "chcę komponent X" lub "widok Y"

**Moja analiza:**

1. ✅ Szukam w @ui-plan.md pełną specyfikację
2. ✅ Wylistowuję komponenty potrzebne (zarówno custom jak i shadcn/ui)
3. ✅ Wymieniam API endpoints z @api-implementation-plan.md
4. ✅ Określam interakcje użytkownika (click, toggle, search, form submission)
5. ✅ Mapuję wymagany stan (React State, SessionStorage, globals?)
6. ✅ Sprawdzam czy potrzebne komponenty shadcn/ui (jeśli tak → komendy instalacji)
7. ✅ Określam strukturę folderów (wg @shared.mdc)
8. ✅ Wymieniam Zod schematy validacji (jeśli potrzebne)

**Output**: Tabelka/plan techniczny z powyższymi elementami (BEZ KODU)

### 2️⃣ FAZA IMPLEMENTACJI (do 3 kroki naraz)

Realizuję maksymalnie **3 konkretne kroki** z listy poniżej:

| Krok  | Nazwa                 | Co robić                                                            |
| ----- | --------------------- | ------------------------------------------------------------------- |
| **A** | Struktura Komponenty  | Stwórz JSX/TSX bez logiki, tylko DIV struktura                      |
| **B** | Layout + Styling      | Dodaj Tailwind CSS styling, responsywność                           |
| **C** | shadcn/ui Komponenty  | Importuj i zintegruuj Button, Input, Card, Alert, etc.              |
| **D** | React State           | useState, useEffect, custom hooks, state initialization             |
| **E** | API Integration       | Fetch, error handling, loading states, response parsing             |
| **F** | User Interactions     | Click handlers, form submission, toggle, search input               |
| **G** | Loading States        | Skeleton loaders, spinners, disabled buttons                        |
| **H** | Error Handling        | Toast/Alert notyfikacje, graceful degradation                       |
| **I** | Empty States          | "No results", "No favorites", "No hospitals" messaging              |
| **J** | Optimistic Updates    | Immediate UI updates dla favorites, undo on error                   |
| **K** | WCAG AA Accessibility | aria-labels, focus indicators, semantic HTML, screen reader support |
| **L** | Responsiveness        | Mobile-first breakpoints (sm:, md:, lg:), touch targets (44px)      |
| **M** | Performance           | useCallback, useMemo, React.memo, memoization                       |

**Format każdego kroku:**

```markdown
## ✅ Krok {LITERA}: {NAZWA}

### Czego dokonałem:

- {konkretne działania}
- Plik: `src/components/.../NazwaKomponentu.tsx`
- Dodane: {liczba linii kodu, co konkretnie}

### Kod / Zmiany:

{pokazanie nowych plików lub zmian - kod w blocie}

### Status:

- [x] {podetap 1}
- [x] {podetap 2}
- [x] {podetap 3}
```

### 3️⃣ PAUZA I FEEDBACK

Po 3 krokach **STOP i czekam**:

```markdown
## 📊 PODSUMOWANIE: Wykonane 3 Kroki

### ✅ Co zrobione:

1. **Krok {X}**: {konkretny efekt - np. "Struktura WardCard z Tailwind"}
2. **Krok {Y}**: {konkretny efekt - np. "useState dla favorite toggle"}
3. **Krok {Z}**: {konkretny efekt - np. "API integration dla /api/users/me/favorites"}

### 📋 Co pozostało (poprzednie kroki):

- [ ] Krok ...
- [ ] Krok ...
- [ ] Krok ...

### Planuję 3 Kolejne Kroki:

1. **Krok ...** - uzasadnienie (np. "Error handling dla 4xx/5xx")
2. **Krok ...** - uzasadnienie
3. **Krok ...** - uzasadnienie

### ⏸️ **OCZEKUJĘ NA TWÓJ FEEDBACK**

Możesz:

- ✅ "OK, kontynuuj" → Zaczynam Kroki {X}, {Y}, {Z}
- 🔧 "Zmień X na Y w kroku {Z}" → Mofię i kontynuuję
- ❌ "Najpierw zrób {kroki}" → Zmieniam plan
- 📋 Zadaj pytanie → Wyjaśniam
```

---

## 🚨 REGUŁY IMPLEMENTACJI (PRIORYTET!)

### 1. Reguły > Best Practices

Zasady z @\*.mdc mają pierwszeństwo przed ogólnymi best practices.

### 2. Specyfikacja = Źródło Prawdy

@ui-plan.md zawiera każdy detail:

- Layouty (ASCII art)
- Props komponenty (TypeScript interfaces)
- Kolory, wymiary, spacing (sekcja 5 - Design System)
- API endpoints (sekcja 3 - każdy widok)
- Interakcje, stany, edge cases

### 3. Accessibility First (WCAG AA)

- Zawsze dodaj aria-labels dla ikon bez tekstu
- Semantic HTML (button, link, form)
- Focus indicators (ring-2 ring-primary)
- Color contrast 4.5:1 minimum
- Screen reader support

### 4. Mobile-First Design

- Base styles dla mobile
- Responsive variants (sm:, md:, lg:) dla desktop
- Touch targets minimum 44x44px

### 5. Error Handling Zawsze

- Obsłużyć 4xx, 5xx, network errors
- Toast/Alert notyfikacje
- Graceful degradation (app działa bez AI insights, etc.)

### 6. Optimistic UI Updates

- Dla favorites toggle, favorite add/remove
- Immediate UI update → API call → rollback on error

### 7. Simplicity Over Design

- Działające proste > piękne niedokończone
- Domyślne komponenty shadcn/ui (bez customizacji)

### 8. State Management Minimalist

- React State dla local state (search, toggle)
- SessionStorage dla dismissed banners
- LocalStorage dla cookie consent
- **BEZ** globalnych bibliotek (Redux, Zustand)

---

## 📁 STRUKTURA PROJEKTU (Obowiązkowa)

```
src/
├── components/
│   ├── ui/                          ← shadcn/ui komponenty
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ... (inne shadcn)
│   ├── hooks/                       ← Custom React hooks
│   │   ├── useFavorites.ts
│   │   └── useDebounce.ts
│   ├── [FeatureName]/               ← Komponenty feature-specific
│   │   ├── WardCard.tsx
│   │   ├── HospitalCard.tsx
│   │   └── SearchBar.tsx
│   └── Layout.astro                 ← Astro layout
├── lib/
│   ├── services/                    ← API services
│   │   ├── favorites.service.ts
│   │   ├── hospitals.service.ts
│   │   └── ...
│   ├── utils/
│   │   ├── api-response.ts
│   │   ├── error-handler.ts
│   │   └── ...
│   └── validation/                  ← Zod schematy
│       ├── favorites.schema.ts
│       └── ...
├── pages/
│   ├── index.astro                  ← Landing page
│   ├── login.astro
│   ├── wards.astro                  ← Ward list
│   ├── wards/[wardName].astro       ← Hospital list
│   ├── settings.astro
│   └── api/                         ← API endpoints
│       ├── ... routes
├── types/
│   ├── database.types.ts            ← Supabase types
│   └── ...
└── types.ts                         ← Shared DTOs

```

---

## 🎯 CHECKLIST: Komponent Gotowy

Zanim powiem "komponent/widok gotowy", musi być:

- [ ] Komponenty zbudowane wg specyfikacji (layout, struktura)
- [ ] Wszystkie API endpoints zintegrowane (fetch + error handling)
- [ ] Wszystkie interakcje użytkownika działają (click, form, toggle)
- [ ] Loading states (skeleton lub spinner)
- [ ] Error handling (Toast/Alert notyfikacje)
- [ ] Empty states (no results, no favorites, etc.)
- [ ] Mobile responsive (44px touch targets, mobile-first)
- [ ] WCAG AA Accessibility (aria, focus, semantic HTML)
- [ ] Edge cases obsługiwane (negative values, long names, offline)
- [ ] Performance OK (memo, useCallback, debounce gdzie potrzebne)
- [ ] Linter happy (brak błędów)

---

## 🚀 JAK ZACZĄĆ

### Step 1: Instalacja shadcn/ui

```bash
npx shadcn@latest add card badge input button alert separator skeleton toast sheet dialog switch dropdown-menu
```

### Step 2: Ty mówisz

```
Chcę wygenerować: [Komponent/Widok]
Np: "Ward List (/wards)" lub "WardCard komponent"
```

### Step 3: Ja robię Faza 1

Przesyłam tabelkę analityczną z:

- Komponenty potrzebne
- API endpoints
- Stan (local/session)
- shadcn/ui komponenty
- Struktura folderów

### Step 4: Ty potwierdzasz

```
OK, plan się podoba / Zmień X / Najpierw zrób Y
```

### Step 5: Ja robię Faza 2

Realizuję Kroki A, B, C (lub inne)
→ ⏸️ Czekam na feedback

### Step 6: Ty dasz feedback

```
OK, idź dalej / Zmień to / Rób to inaczej
```

### Step 7: Powtarzaj

Kroki D, E, F → ⏸️
Kroki G, H, I → ⏸️
... itd aż do checklist ✅

---

## 💡 TIPS

1. **Zawsze czytaj @ui-plan.md** - tam jest wszystko
2. **Reguły mają pierwszeństwo** - nie pytaj, aplikuj
3. **API endpoints z @api-implementation-plan.md** - sprawdzaj tam
4. **Edge cases z sekcji 6** - zawsze je obsłużyć
5. **Error mapowanie z sekcji 6** - Toast/Alert → HTTP codes
6. **Accessibility nie jest optional** - WCAG AA zawsze
7. **SessionStorage dla dismissible banners** - `insightDismissed`, `verificationReminderDismissed`
8. **Optimistic updates dla favorites** - immediate toggle, rollback on error

---

## ⚙️ ZMIENNE ŚRODOWISKOWE

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
```

Są dostępne w `import.meta.env` wg @astro.mdc

---

**Version:** 1.0  
**Status:** Ready to Use  
**Last Updated:** 2025-10-30

Aby zacząć generowanie UI: Powiedz nazwę komponenty/widoku i czy coś Ci się nie podoba w procesie.

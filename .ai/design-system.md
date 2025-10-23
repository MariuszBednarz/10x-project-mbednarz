# HosLU - Design System Documentation

> **Źródło:** Analiza screenów z Figma (zakładka ScrapeApp)  
> **Data:** 2025-10-23  
> **Cel:** Implementacja frontend z Astro 5 + React 19 + shadcn/ui

---

## ⚠️ WAŻNE: Priorytet Feature nad Design

**FUNKCJONALNOŚĆ MA PIERWSZEŃSTWO PRZED DESIGNEM!**

- Design z Figmy to **wytyczne**, nie sztywne wymagania pixel-perfect
- Priorytet: **działające features** zgodne z PRD
- Używaj **domyślnych komponentów shadcn/ui** zamiast custom stylowania
- Jeśli coś jest trudne/czasochłonne wizualnie, użyj prostszego rozwiązania
- **User-friendly > Pretty** - czytelność i użyteczność są najważniejsze
- Szybkość implementacji > Perfekcja wizualna

**Zasada MVP:** Lepiej prosty działający feature niż piękny niedokończony.

---

## 1. Kolorystyka

### Kolory główne

```css
/* Primary - Turkusowy/Teal */
--primary: #3f7a78; /* Navbar, główne elementy */
--primary-light: #5da8a5; /* Hover states */
--primary-mint: #1bd9b7; /* Akcenty, aktywne filtry */
--primary-dark: #2d5a58; /* Dark mode / footer */

/* Neutralne */
--background: #f5f5f5; /* Tło aplikacji */
--card: #ffffff; /* Karty, dropdown */
--text-primary: #1a1a1a; /* Nagłówki, główny tekst */
--text-secondary: #6b7280; /* Timestamps, helper text */
--border: #e5e7eb; /* Separatory, borders */

/* Statusowe */
--success: #10b981; /* Zielony (>5 miejsc) - DO ZAIMPLEMENTOWANIA */
--warning: #f59e0b; /* Żółty (1-5 miejsc) - DO ZAIMPLEMENTOWANIA */
--error: #ef4444; /* Czerwony (≤0 lub ujemne) */
--error-dark: #dc2626; /* Ciemniejszy czerwony */

/* Akcenty */
--favorite: #ec4899; /* Różowy dla ikon serca */
--link: #3b82f6; /* Niebieski dla linków */
```

### Mapowanie do Tailwind CSS 4

```javascript
// tailwind.config.js
theme: {
  colors: {
    primary: {
      DEFAULT: '#3f7a78',
      light: '#5da8a5',
      mint: '#1bd9b7',
      dark: '#2d5a58'
    },
    // ... reszta kolorów
  }
}
```

---

## 2. Typography

### Font Stack

- **Primary:** System fonts (najlepiej Inter lub podobny)
- **Fallback:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Rozmiary i wagi

```css
/* Nagłówki */
--h1: 2rem (32px), font-weight: 700; /* "Lista oddziałów" */
--h2: 1.5rem (24px), font-weight: 700; /* Nazwa oddziału */
--h3: 1.25rem (20px), font-weight: 600; /* Nazwa szpitala */

/* Body text */
--body: 1rem (16px), font-weight: 400; /* Normalna treść */
--body-small: 0.875rem (14px), font-weight: 400; /* Timestamps */
--body-xs: 0.75rem (12px), font-weight: 400; /* Footer, helper text */

/* Numbers/Metrics */
--metric: 2rem (32px), font-weight: 700; /* "-10" liczba miejsc */
--metric-label: 0.75rem (12px), font-weight: 500, uppercase; /* "MIEJSCA" */
```

---

## 3. Layout & Spacing

### Container

- **Max-width desktop:** 1280px (xl)
- **Padding:** 16px mobile, 24px tablet, 32px desktop

### Spacing Scale (Tailwind)

```
2px  → space-0.5
4px  → space-1
8px  → space-2
12px → space-3
16px → space-4  ← Standardowy padding kart
24px → space-6  ← Separacja sekcji
32px → space-8
48px → space-12
```

### Grid System

- **Mobile:** Single column, full width
- **Tablet:** 2 columns (opcjonalnie)
- **Desktop:** 2-3 columns (opcjonalnie)

---

## 4. Komponenty

### 4.1. Navbar (Navigation Bar)

**Desktop:**

```
┌─────────────────────────────────────────────────────┐
│ DoSzpitala    Oddziały  O aplikacji  Regulamin  Źródło │
└─────────────────────────────────────────────────────┘
```

- Tło: `--primary-dark` (#2d5a58)
- Tekst: biały
- Height: 64px
- Logo (left): bold, 1.5rem
- Links (right): spacing-6, hover underline

**Mobile:**

```
┌─────────────────────────────────────────────────────┐
│ ☰                DoSzpitala                      👤 │
└─────────────────────────────────────────────────────┘
```

- Hamburger menu (left)
- Logo (center)
- User icon (right)

**shadcn/ui:** Custom navbar + Sheet dla mobile menu

---

### 4.2. Page Header z AI Insight i Search

**Struktura (od góry):**

```
[AI Insight Banner - centered, full width]     ← Alert component (sekcja 4.10)

Lista oddziałów                                ← H1 (bold, text-primary)
Woj. Lubelskie                                ← Subtitle (text-secondary)

[🔍 Search input........................] [Filtry 🔽]  ← Search + Filtry w jednej linii
```

**Layout:**

- AI Insight: Pod headerem (navbar), nad tytułem, wyśrodkowany
- Tytuł "Lista oddziałów": Bold, 2rem
- Subtitle "Woj. Lubelskie": Szary, 1rem
- Search + Filtry: Flex row, gap-4, search zajmuje więcej miejsca (flex-1)

**Spacing:**

- AI Insight → Tytuł: space-4
- Tytuł → Subtitle: space-1
- Subtitle → Search/Filtry: space-4
- Header → Content (lista): space-6

**Mobile:**

- Search i Filtry stack vertically (flex-col)
- Search full width
- Filtry full width (poniżej search)

---

### 4.3. Karta Oddziału (Lista główna)

```
┌─────────────────────────────────────────────────────┐
│ Szpitalny Oddział Ratunkowy                    😢 › │  ← Jeśli problemy
│                                                     │
│ OIT DOROŚLI                                       › │  ← Normalny
│                                                     │
│ ŁÓŻKA WZMOŻONEGO NADZORU MEDYCZNEGO (IOM)...    › │
└─────────────────────────────────────────────────────┘
```

**Właściwości:**

- Tło: białe (#ffffff)
- Border: subtle (#e5e7eb) lub shadow
- Padding: 16px
- Radius: 8px
- Hover: lekki shadow + primary border
- Sad emoji (😢): czerwony, tylko jeśli wszystkie szpitale ≤0
- Chevron (›): szary, right aligned

**shadcn/ui:** Card lub custom div z hover states

---

### 4.4. Filtry (Dropdown + Pills)

**Dropdown "Powiaty":**

```
┌──────────────────────┐
│ Powiaty          ▼  │  ← Select/Dropdown
└──────────────────────┘
```

- Tło: białe
- Border: #e5e7eb
- Chevron: primary color
- Padding: 12px

**Pills (wybrane filtry):**

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
│Lubelski ✕│ │Kraśnicki✕│ │Opolski ✕│ │Wyczyść  │
└──────────┘ └──────────┘ └──────────┘ └─────────┘
```

- Tło: `--primary-light` z opacity 20%
- Tekst: `--primary-dark`
- X button: hover czerwony
- "Wyczyść": primary-mint color, no background

**shadcn/ui:** Select + Badge (variant="secondary")

---

### 4.5. Toggle "Tylko ulubione"

```
👥  ⚪────────  👤   ← OFF (szary)
👥  ────────⚪  👤   ← ON (zielony)
```

**Właściwości:**

- OFF: szare tło, biały thumb
- ON: zielone tło (#10b981), biały thumb
- Ikony: group (left), user (right)

**shadcn/ui:** Switch component

---

### 4.6. Karta Szpitala (Lista w oddziale)

```
┌─────────────────────────────────────────────────────┐
│  🏥  Samodzielny Publiczny Zakład...        ♡  😢  │
│      Aktualizacja: 2024-10-03 20:08:53              │
│                                          MIEJSCA    │
│                                            -10      │
└─────────────────────────────────────────────────────┘
```

**Layout:**

- **Left side:**
  - Hospital icon (🏥): turkusowa, okrągła, 40px
  - Nazwa szpitala: bold, dark, 1.25rem
  - Timestamp: szary, small (14px)
- **Right side (top):**
  - Heart icon (♡/♥): outline/filled, różowy
  - Sad emoji (😢): czerwony, dla ≤0
- **Right side (bottom):**
  - Label "MIEJSCA": uppercase, 12px, szary
  - Number: 2rem, bold, turkusowy (ujemne) lub zielony/żółty/czerwony

**Spacing:**

- Padding: 16px
- Icon → Text: 12px
- Between rows: 8px separators

**shadcn/ui:** Card + flex layout

---

### 4.7. Badge dla liczby miejsc (DO ZAIMPLEMENTOWANIA)

**PRD wymaga kolorów:**

- **Zielony (>5 miejsc):** `bg-green-500`, tekst biały
- **Żółty (1-5 miejsc):** `bg-yellow-500`, tekst czarny
- **Czerwony (≤0):** `bg-red-500`, tekst biały, + sad emoji

```tsx
// Przykład logiki
const getBadgeVariant = (places: number) => {
  if (places > 5) return "success"; // zielony
  if (places >= 1) return "warning"; // żółty
  return "destructive"; // czerwony
};
```

**shadcn/ui:** Badge component z custom variants

---

### 4.8. Search Bar

**Layout:**

```
┌──────────────────────────────────────┐  ┌──────────┐
│  🔍  Szukaj oddziału lub szpitala   │  │ Filtry ▼ │
└──────────────────────────────────────┘  └──────────┘
```

**Właściwości:**

- Input z ikoną lupy (left)
- Placeholder: "Szukaj oddziału lub szpitala..."
- Clear "X" button (right) - pojawia się gdy jest tekst
- Live search z debounce 300ms
- Border: #e5e7eb, focus: primary color
- Height: 44px (mobile touch-friendly)

**shadcn/ui:** Input component z custom ikonami

---

### 4.9. Warning Banner (Stale Data)

**Lokalizacja:** Tuż pod headerem (navbar), przed AI Insight

**Kiedy wyświetlać:** Dane starsze niż 12 godzin

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Dane mogą być nieaktualne (ostatnia aktualizacja │
│     12h temu). Sprawdź źródło dla pewności. [Link]  │
└─────────────────────────────────────────────────────┘
```

**Właściwości:**

- Tło: żółte/pomarańczowe (`bg-yellow-50` border `border-yellow-300`)
- Ikona: ⚠️ lub AlertCircle (yellow)
- Tekst: Czytelny, z linkiem do źródła danych
- Dismissible: NIE (zawsze widoczny gdy dane stare)

**shadcn/ui:** Alert component z variant="warning"

---

### 4.10. AI Insight Banner

**Lokalizacja:** Pod headerem (i warning banner jeśli jest), nad tytułem "Lista oddziałów", wyśrodkowany

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ 💡 Niska dostępność: Kardiologia (3 miejsca).       │
│    Wysoka: Ortopedia (27 miejsc)                    │
└─────────────────────────────────────────────────────┘
```

**Właściwości:**

- Tło: jasno-niebieskie (`bg-blue-50` border `border-blue-300`)
- Ikona: 💡 lub Info icon
- Tekst: Jedno-dwa zdania, centered
- Cache: 24h, generowane o 6:00
- Graceful degradation: jeśli brak, nie pokazuj nic

**shadcn/ui:** Alert component z variant="info" (lub custom)

---

### 4.11. Footer

**Desktop & Mobile (sticky bottom):**

```
┌─────────────────────────────────────────────────────┐
│ Regulamin    Źródło danych 🔗                       │
│                          © 2023 Mariusz Bednarz     │
└─────────────────────────────────────────────────────┘
```

**Właściwości:**

- Tło: `--primary-dark` (#2d5a58)
- Tekst: biały
- Padding: 16px
- Links: hover underline
- Copyright: right aligned (desktop), center (mobile)

---

## 5. Ikony

### System ikon

**Zalecane:** Lucide React (jest w shadcn/ui)

### Używane ikony:

```tsx
import {
  Heart, // Ulubione (outline/filled)
  ChevronRight, // Nawigacja do szczegółów
  ChevronLeft, // Powrót
  ChevronDown, // Dropdown
  X, // Zamknij, usuń filtr
  Menu, // Hamburger menu
  Users, // Group icon (toggle)
  User, // User profile icon
  Filter, // Ikona filtrów
  Search, // DO ZAIMPLEMENTOWANIA - search bar
  AlertCircle, // DO ZAIMPLEMENTOWANIA - ostrzeżenia
  ExternalLink, // Link do źródła
} from "lucide-react";
```

### Emoji (alternatywnie jako ikony):

- 😢 (Sad face) - przepełnienie, `text-red-500`
- 🏥 (Hospital) - ikona lokalizacji, `text-primary`
- ⚠️ (Warning) - ostrzeżenia dla starych danych

---

## 6. Stany i Interakcje

### 6.1. Hover States

- **Karty:** Lekki shadow + primary border (2px)
- **Buttons:** Background lightness +10%
- **Links:** Underline
- **Heart icon:** Scale 1.1, fill color

### 6.2. Active States

- **Selected filter pill:** Darker background
- **Toggle ON:** Zielone tło
- **Favorite (filled heart):** Różowy fill

### 6.3. Loading States (DO ZAIMPLEMENTOWANIA)

- **Skeleton loader** dla list podczas ładowania
- **Spinner** dla akcji (dodawanie do ulubionych)

**shadcn/ui:** Skeleton component

### 6.4. Error States

**Zasada:** Używaj domyślnych komponentów shadcn/ui z user-friendly messages (PL)

- **Stale data (>12h):** Warning banner u góry (sekcja 4.9) - żółty Alert
- **Failed scraping:** Error Alert banner: "Nie udało się pobrać najnowszych danych. Pokazujemy ostatnie dostępne."
- **Loading error:** Alert z "Błąd ładowania danych. Spróbuj odświeżyć stronę."
- **Network error:** Alert z "Brak połączenia. Sprawdź internet i odśwież."

**Priorytet:** Czytelny komunikat > Ładny design

**shadcn/ui:** Alert component z variants: "default", "warning", "destructive"

---

## 7. Responsywność

### Breakpoints (Tailwind)

```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Layout Changes

**Mobile (<768px):**

- Hamburger menu
- Single column
- Full width cards
- Stacked filters
- Larger touch targets (min 44px)

**Tablet (768px - 1024px):**

- Horizontal nav możliwe
- 2-column grid opcjonalnie
- Sidebar dla filtrów (opcjonalnie)

**Desktop (>1024px):**

- Full horizontal nav
- Multi-column layout
- Hover effects bardziej widoczne
- Więcej content na ekranie

---

## 8. Animacje i Transitions

### Standardowe transitions

```css
transition: all 150ms ease-in-out; /* Hover, focus */
transition: transform 200ms ease; /* Scale effects */
```

### Animacje

- **Accordion open/close:** 200ms ease
- **Optimistic update (favorite):** Immediate fill + 300ms fade
- **Filter pills add/remove:** 150ms fade + slide
- **Page transitions:** 200ms fade (opcjonalnie)

**Tailwind:** `transition-all duration-150 ease-in-out`

---

## 9. Komponenty shadcn/ui - Mapowanie

### Dostępne w projekcie:

- ✅ **Button** - akcje, nawigacja, "Wyczyść"

### Do dodania:

- **Card** - listy oddziałów i szpitali
- **Badge** - pills filtrów, liczba miejsc, statusy
- **Select** - dropdown "Powiaty"
- **Switch** - toggle "tylko ulubione"
- **Input** - search bar (z ikoną)
- **Alert** - AI insights, warning banner, error messages
- **Separator** - między elementami list
- **Skeleton** - loading states
- **Toast** - powiadomienia o akcjach
- **Sheet** - mobile menu (hamburger)

### Instalacja:

```bash
npx shadcn@latest add card badge select switch input alert separator skeleton toast sheet
```

---

## 10. Brakujące elementy w screenach (do zaprojektowania)

### Doprecyzowanie implementacji:

1. **✅ AI Insight Banner** - ZAIMPLEMENTOWANE (sekcja 4.10)
   - Lokalizacja: Pod headerem, nad "Lista oddziałów", centered
   - Alert component z variant="info"

2. **✅ Search Bar** - ZAIMPLEMENTOWANE (sekcja 4.8)
   - Lokalizacja: Pod "Woj. Lubelskie" w jednej linii z filtrami
   - Input component z ikonami Search i X

3. **✅ Warning Banner** - ZAIMPLEMENTOWANE (sekcja 4.9)
   - Tuż pod headerem (przed AI Insight)
   - Trigger: dane starsze niż 12h
   - Alert component z variant="warning"

4. **Badge kolorystyczny** - Opisany w sekcji 4.7
   - Zielony >5, żółty 1-5, czerwony ≤0
   - Implementacja w React z getBadgeVariant()

5. **Landing Page / Auth screens** - MINIMALNE
   - **Zasada:** Reużywalne komponenty (Card, Input, Button, Alert)
   - **Login:** Email + Password + Button "Zaloguj"
   - **Register:** Email + Password + Checkbox zgody + Button "Zarejestruj"
   - **Style:** Centered card, białe tło, primary buttons
   - **NIE robimy:** Custom ilustracji, skomplikowanych layoutów
   - **Priorytet:** Działające formy > Wygląd

6. **Error States** - DOMYŚLNE KOMPONENTY
   - Używaj standardowych Alert components z shadcn/ui
   - User-friendly messages (PL), np. "Nie udało się załadować danych"
   - NIE custom error pages, tylko Alert banners
   - Graceful degradation zawsze

7. **Cookie Consent Banner** - RODO compliance
   - Sticky bottom, minimal design
   - Używaj gotowego komponentu lub prosty Alert
   - Akcje: Akceptuj / Odrzuć (bez skomplikowanych ustawień w MVP)

---

## 11. Accessibility (a11y)

### Wymagania:

- **Focus indicators:** Widoczne outline dla keyboard navigation
- **ARIA labels:** Dla ikon bez tekstu
- **Color contrast:** WCAG AA minimum (4.5:1 dla tekstu)
- **Touch targets:** Min 44x44px dla mobile
- **Screen reader support:** Semantic HTML, proper headings

### Przykłady:

```tsx
<button aria-label="Dodaj do ulubionych">
  <Heart />
</button>

<div role="status" aria-live="polite">
  Zaktualizowano listę oddziałów
</div>
```

---

## 12. Performance Considerations

### Optymalizacje:

- **Lazy loading** komponentów poniżej fold
- **Virtual scrolling** dla długich list (opcjonalnie)
- **Debounce** search input (300ms)
- **Optimistic UI** dla favorite toggle
- **Image optimization** dla ikon (SVG preferred)
- **Code splitting** per route (Astro automatycznie)

---

## 13. Dark Mode (Out of Scope MVP)

**Status:** Nie w MVP, ale design system gotowy na rozszerzenie.

**Przygotowanie:**

```css
/* Dodać w przyszłości */
@media (prefers-color-scheme: dark) {
  --background: #1a1a1a;
  --card: #2d2d2d;
  --text-primary: #ffffff;
  /* ... */
}
```

---

## 14. Podsumowanie dla developera

### Kolejność implementacji:

**PAMIĘTAJ: Feature > Design. Działające proste > Piękne niedokończone.**

1. Setup Tailwind + shadcn/ui z kolorami custom
2. Navbar (desktop + mobile z hamburger Sheet)
3. Footer (sticky)
4. Warning Banner (>12h stale data)
5. AI Insight Banner (centered, Alert component)
6. Page Header (tytuł + subtitle)
7. Search bar + Filtry (jedna linia)
8. Lista oddziałów (Card + chevron + sad emoji)
9. Lista szpitali (Card + icons + badge miejsc - BEZ accordiona)
10. Badge kolorystyczny (zielony/żółty/czerwony dla miejsc)
11. Toggle "tylko ulubione" (Switch)
12. Error states (domyślne Alert components)
13. Loading states (Skeleton)
14. Auth screens (MINIMALNE - Card + Input + Button)
15. Toast notifications (optimistic updates)
16. Cookie consent (prosty Alert/Banner)
17. Responsywność (mobile-first)
18. Basic a11y (focus indicators, ARIA labels)

### Narzędzia:

- **Tailwind CSS IntelliSense** (VSCode extension)
- **Headless UI** (przez shadcn/ui)
- **Lucide React** (ikony)
- **clsx** lub **cn** helper (conditional classes)

---

**Version:** 1.0  
**Created:** 2025-10-23  
**Based on:** Figma screens analysis (ScrapeApp tab)  
**Status:** Ready for implementation 🚀

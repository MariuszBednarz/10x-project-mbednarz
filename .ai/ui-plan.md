# HosLU UI Implementation Guide

> **Version:** 1.0  
> **Status:** Ready for Implementation  
> **Purpose:** Complete technical specification for UI development

---

## 1. Tech Stack & Core Principles

### Stack

- **Framework:** Astro 5 (SSG/SSR) + React 19 (interactive components)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (default styles, no customization)
- **Icons:** Lucide React
- **Auth:** Supabase Auth (@supabase/supabase-js)
- **State:** React State + SessionStorage

### Core Principles

1. **KISS** - Maximum simplicity, feature over design
2. **Mobile First** - Design for mobile, enhance for desktop
3. **Accessibility First** - WCAG AA (4.5:1 contrast, focus indicators, ARIA)
4. **Progressive Enhancement** - Basic functionality without JavaScript
5. **Graceful Degradation** - App works even when API fails (no AI insights = OK)

### Install shadcn/ui Components

```bash
npx shadcn@latest add card badge input button alert separator skeleton toast sheet dialog switch dropdown-menu
```

---

## 2. Routing & Navigation

### Route Structure

**Public (unauthenticated):**

```
/                       - Landing Page (info + registration form)
/o-aplikacji           - About page (public info)
/login                 - Login form
/register              - Registration form (optional, can use Landing)
/verify-email          - Email verification reminder
/regulamin             - Terms of Service
/polityka-prywatnosci  - Privacy Policy
```

**Protected (authenticated):**

```
/wards                 - Ward list (main view)
/wards/[wardName]      - Hospital list for ward (URL-encoded)
/settings              - Account settings
```

### Navigation Rules

- **Clear filters:** Return from `/wards/[wardName]` → `/wards` clears search and toggle
- **Scroll position:** Browser native (preserved on back)
- **Search state:** Always cleared between views
- **401 Response:** Auto redirect to `/login`
- **After login:** Redirect to `/wards`
- **After logout:** Redirect to `/login`
- **Deep linking:** `/wards/[wardName]` works as direct link (shareable)

### Navbar Structure

**Desktop:**

```
DoSzpitala | Oddziały | O aplikacji | 💡 | 👤▼
```

- Logo/Brand: "DoSzpitala" (left, links to `/wards` if logged in, `/` if not)
- Link "Oddziały": `/wards` (authenticated only)
- Link "O aplikacji": `/o-aplikacji` (always visible)
- 💡 Icon: Shows when AI Insight dismissed (click restores banner), hidden on 204
- User Dropdown 👤: DropdownMenu (Ustawienia → `/settings`, Separator, Wyloguj)

**Mobile:**

```
☰   DoSzpitala                            💡  👤
```

- Hamburger ☰: Opens Sheet (slide from left)
- Logo: Center
- 💡 Icon: Conditional (right)
- User Icon 👤: Opens dropdown (right)

**Hamburger Menu (Sheet):**

- Oddziały → `/wards`
- O aplikacji → `/o-aplikacji`
- Ustawienia → `/settings`
- Separator
- Wyloguj (red text)

---

## 3. Pages Implementation

### 3.1. Landing Page (/)

**Layout:**

```
┌────────────────────────────────────┐
│ [Hero Section]                     │
│ H1: "HosLU - Dostępność miejsc"    │
│ Description (1-2 sentences)        │
│ 3 benefits with icons              │
├────────────────────────────────────┤
│ [Registration Form - Centered Card]│
│ Input: Email (required)            │
│ Input: Password (required, min 8)  │
│ Checkbox: RODO (required)          │
│ Button: "Zarejestruj się"          │
│ Link: "Masz już konto? Zaloguj się"│
├────────────────────────────────────┤
│ [Footer Section]                   │
│ Link to source data                │
│ Additional info                    │
│ Copyright                          │
└────────────────────────────────────┘
```

**Components:**

- Hero: H1 (text-2xl font-bold), subtitle, bullet list with icons
- Form Card: centered, max-width 400px
- Email Input: type="email", validation
- Password Input: type="password", min 8 chars
- RODO Checkbox: "Akceptuję [Regulamin] i [Politykę Prywatności]" (inline links, required)
- Button: primary, full width
- Link: centered, text-sm

**API:**

- `POST /auth/v1/signup` (Supabase Auth)

**States:**

- Loading: Button spinner
- Error: Toast "Email już istnieje" or validation errors inline (red, text-sm)
- Success: Redirect to `/verify-email` with message

**Validation:**

- Email format, password length ≥8, RODO checked

---

### 3.2. Login (/login)

**Layout:**

```
┌────────────────────────────────────┐
│ [Login Form - Centered Card]       │
│ Input: Email                       │
│ Input: Password                    │
│ Button: "Zaloguj się"              │
│ Link: "Nie masz konta? Zarejestruj"│
└────────────────────────────────────┘
```

**API:**

- `POST /auth/v1/token?grant_type=password` (Supabase Auth)

**States:**

- Loading: Button spinner
- Error 401: Toast "Nieprawidłowy email lub hasło"
- Error 403: Toast "Potwierdź swój adres email przed zalogowaniem"
- Success: Redirect to `/wards`

---

### 3.3. Ward List (/wards)

**Layout:**

```
┌────────────────────────────────────┐
│ [Navbar]                           │
├────────────────────────────────────┤
│ [⚠️ WARNING BANNER] (if >12h)      │
├────────────────────────────────────┤
│ [💡 AI INSIGHT BANNER] (centered)  │
├────────────────────────────────────┤
│                                    │
│ Lista oddziałów (H1)               │
│ Woj. Lubelskie (subtitle)          │
│                                    │
│ [🔍 Search...] [👤 Tylko ulubione] │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ ⭐ Kardiologia              › │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ ☆ Ortopedia                  › │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Components:**

1. **Warning Banner** (conditional, data >12h):
   - Alert variant="warning"
   - bg-yellow-50, border-yellow-300
   - Icon: AlertTriangle (Lucide)
   - Text: "Dane mogą być nieaktualne (ostatnia aktualizacja {X}h temu). Sprawdź [źródło] dla pewności."
   - Link to source (external)
   - NOT dismissible (permanent)

2. **AI Insight Banner** (conditional, if available):
   - Alert variant="info"
   - bg-blue-50, border-blue-300
   - Icon: Lightbulb (Lucide)
   - Text: e.g., "Niska dostępność: Kardiologia (3 miejsca). Wysoka: Ortopedia (27 miejsc)"
   - Dismissible (X button)
   - On dismiss: sessionStorage `insightDismissed: true`
   - 💡 icon in navbar allows restore
   - Hidden completely on 204 No Content

3. **Title & Subtitle:**
   - H1: "Lista oddziałów" (text-2xl, font-bold)
   - Subtitle: "Woj. Lubelskie" (text-muted-foreground, text-sm)

4. **Search Bar:**
   - Input component
   - Icon: Search (left)
   - Placeholder: "Szukaj oddziału..."
   - Clear button: X (visible when text present)
   - Debounce: 300ms
   - Validation: min 2 chars (at 1 char - no action, at 0 - show all)
   - Height: 44px (mobile touch target)

5. **Toggle "Tylko ulubione":**
   - Switch component
   - Label: "Tylko ulubione" with User icon
   - OFF: gray background, white thumb
   - ON: green background (#10b981), white thumb
   - Filters list to favorites only

6. **Ward Cards:**
   - Card component
   - Structure:
     ```
     ┌────────────────────────────────┐
     │ ⭐ Kardiologia              › │
     └────────────────────────────────┘
     ```
   - Elements:
     - Star: ⭐ (filled, Star) or ☆ (outline, StarOff) - clickable
     - Ward name: center-left, bold, text-base
     - Chevron: › (ChevronRight, right-aligned)
   - NO emoji, NO aggregated data, NO additional info
   - Click card → redirect to `/wards/{wardName}`
   - Click star → toggle favorite (optimistic update)
   - Hover: subtle shadow + primary border
   - Min height: 44px

**Sorting:**

- Favorites (alphabetically A-Z) → Others (alphabetically A-Z)

**API Endpoints:**

- `GET /api/wards?search={query}&favorites_only={bool}` - ward list
- `GET /api/users/me/favorites` - get favorites with full data
- `POST /api/users/me/favorites` - add favorite (body: `{ward_name: string}`)
- `DELETE /api/users/me/favorites/by-ward/{wardName}` - remove favorite (URL-encoded wardName)
- `GET /api/insights/current` - AI insight (graceful 204 No Content)
- `GET /api/status` - data freshness (isStale, lastScrapeTime)

**Optimistic Update Logic:**

```typescript
const handleFavoriteToggle = async (wardName: string, isFavorite: boolean) => {
  // 1. Optimistic UI update
  updateLocalState(wardName, !isFavorite);

  try {
    if (isFavorite) {
      // Remove from favorites - uses wardName as identifier
      const encodedWardName = encodeURIComponent(wardName);
      await DELETE(`/api/users/me/favorites/by-ward/${encodedWardName}`);
    } else {
      // Add to favorites
      await POST("/api/users/me/favorites", { ward_name: wardName });
    }

    // Invalidate cache
    invalidateWardsCache();
  } catch (error) {
    // 2. Rollback on error
    updateLocalState(wardName, isFavorite);
    toast.error("Nie udało się zaktualizować ulubionych. Spróbuj ponownie.");
  }
};
```

**Empty States:**

- No search results: "Nie znaleziono wyników dla {tekst}"
- No favorites: "Nie masz jeszcze ulubionych oddziałów. Kliknij gwiazdkę obok nazwy oddziału, aby dodać do ulubionych."

**Responsive:**

- Desktop: Search and Toggle in one line (flex-row, gap-4)
- Mobile: Search full width, Toggle below (flex-col, gap-2)

**Cache:**

- Ward list: 10 min, invalidate on favorite change

---

### 3.4. Hospital List (/wards/[wardName])

**Layout:**

```
┌────────────────────────────────────┐
│ [Navbar]                           │
├────────────────────────────────────┤
│ ← Powrót                           │
│                                    │
│ Kardiologia (H1)                   │
│ 5 szpitali (subtitle)              │
│                                    │
│ [🔍 Szukaj szpitala lub powiatu...]│
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🏥 Szpital Kliniczny Nr 1      │ │
│ │ Lublin                         │ │
│ │ Dane: 03.10.2024 20:08         │ │
│ │                       MIEJSCA  │ │
│ │                          12    │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Components:**

1. **Back Button:**
   - Button variant="ghost", text-sm
   - "← Powrót"
   - Link to `/wards`
   - **Important:** Clears all filters and search on /wards

2. **Title & Subtitle:**
   - H1: "{wardName}" (text-2xl, font-bold)
   - Subtitle: "{count} szpitali" (text-muted-foreground, text-sm)

3. **Search Bar:**
   - Input component
   - Icon: Search
   - Placeholder: "Szukaj szpitala lub powiatu..."
   - Clear button: X
   - Debounce: 300ms
   - Min 2 chars
   - Searches: hospital name AND district (case-insensitive)

4. **Hospital Cards:**
   - Card component
   - Structure:
     ```
     ┌────────────────────────────────┐
     │ 🏥 Szpital Kliniczny Nr 1      │
     │ Lublin                         │
     │ Dane: 03.10.2024 20:08         │
     │                       MIEJSCA  │
     │                          12    │
     └────────────────────────────────┘
     ```
   - Elements:
     - Icon 🏥: Turquoise (#3f7a78), circular, 40px (Hospital from Lucide)
     - Hospital name: Bold, text-base, truncate on mobile
     - District: Text-sm, text-muted-foreground, second line
     - Timestamp: "Dane: {lastUpdated}" (text-xs, text-muted-foreground)
       - Format: DD.MM.YYYY HH:MM (Polish format)
     - Label "MIEJSCA": Right top corner
     - Badge with number: Large, bold, right-aligned, bottom
       - **Green (>5):** bg-green-500, text-white
       - **Yellow (1-5):** bg-yellow-500, text-black
       - **Red (≤0):** bg-red-500, text-white
     - Negative values: Display with minus (e.g., "-3")
     - Tooltip for ≤0: "Brak wolnych miejsc, oddział przepełniony"

**Badge Color Logic:**

```typescript
function getBadgeColor(places: string): string {
  const num = parseInt(places);
  if (isNaN(num)) return "bg-gray-500 text-white";
  if (num > 5) return "bg-green-500 text-white";
  if (num >= 1) return "bg-yellow-500 text-black";
  return "bg-red-500 text-white"; // includes negative
}
```

**Date Format Helper:**

```typescript
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
```

**Sorting:**

- availablePlaces DESC (most places first)
- VARCHAR → INTEGER conversion backend-side
- Negative values treated as worse than 0

**API:**

- `GET /api/wards/{wardName}/hospitals?search={query}` - hospital list

**Empty States:**

- No hospitals: "Brak szpitali w tym oddziale."
- No search results: "Nie znaleziono wyników dla {query}"

**Responsive:**

- Mobile: Single column, full width cards
- Desktop: Optional 2 columns

**Cache:**

- Hospital list: 10 min (read-only)

---

### 3.5. Settings (/settings)

**Layout:**

```
┌────────────────────────────────────┐
│ [Navbar]                           │
├────────────────────────────────────┤
│                                    │
│ Ustawienia konta (H1)              │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Email                          │ │
│ │ user@example.com               │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Data rejestracji               │ │
│ │ 2024-10-01 10:30               │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Status                         │ │
│ │ ✓ Zweryfikowany                │ │
│ └────────────────────────────────┘ │
│                                    │
│ [Usuń konto]                       │
└────────────────────────────────────┘
```

**Components:**

1. **Account Info Cards:**
   - Email: read-only, text-base
   - Registration date: format DD.MM.YYYY HH:MM
   - Status: "✓ Zweryfikowany" (green) OR "⚠️ Niezweryfikowany" (yellow)

2. **Delete Account Button:**
   - Button variant="destructive" (red)
   - Opens Dialog on click

3. **Confirmation Dialog:**
   - Title: "Usuń konto?"
   - Content: "Ta operacja jest nieodwracalna. Wszystkie twoje dane, w tym ulubione oddziały, zostaną trwale usunięte."
   - Actions:
     - Button "Anuluj" (variant="outline", closes dialog)
     - Button "Usuń konto" (variant="destructive", triggers DELETE)

**Delete Flow:**

1. Click "Usuń konto" → Dialog opens
2. Click "Usuń konto" in dialog → Loading state (spinner)
3. Success:
   - DELETE request
   - Logout (clear session)
   - Redirect to `/`
   - Toast: "Konto zostało usunięte"
4. Error:
   - Toast: "Nie udało się usunąć konta. Spróbuj ponownie."
   - Dialog stays open

**API:**

- `GET /api/users/me` - user profile
- `DELETE /api/users/me` - delete account

**Email Not Verified:**

- Status: "⚠️ Niezweryfikowany" (yellow badge)
- Alert (info): "Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny."
- Button: "Wyślij ponownie email weryfikacyjny"

---

### 3.6. Verify Email (/verify-email)

**Layout:**

```
┌────────────────────────────────────┐
│ Alert (info):                      │
│ "Sprawdź swoją skrzynkę email      │
│ i kliknij link weryfikacyjny"      │
│                                    │
│ Email wysłany do: {user.email}     │
│                                    │
│ [Wyślij ponownie email]            │
│ [Powrót do logowania]              │
└────────────────────────────────────┘
```

**Components:**

- Alert component (info, blue)
- Button "Wyślij ponownie" (secondary)
- Link "Powrót do logowania"
- Rate limiting: max 3x in 10 minutes

---

### 3.7. About Page (/o-aplikacji)

**Layout:**

```
┌────────────────────────────────────┐
│ [Navbar - public version]          │
├────────────────────────────────────┤
│ O aplikacji (H1)                   │
│                                    │
│ [Content sections with Cards]      │
│ - How it works                     │
│ - Data collection (RODO)           │
│ - Data source (link)               │
│ - Contact                          │
│ - Tech stack                       │
│                                    │
│ [Footer]                           │
└────────────────────────────────────┘
```

**Public Navbar:**

```
DoSzpitala | O aplikacji | Zaloguj
```

---

### 3.8. Terms (/regulamin) & Privacy (/polityka-prywatnosci)

**Layout:**

```
┌────────────────────────────────────┐
│ [Navbar - public]                  │
├────────────────────────────────────┤
│ Regulamin / Polityka Prywatności   │
│                                    │
│ [Content card with text]           │
│ Last updated: {date}               │
│                                    │
│ [Footer]                           │
└────────────────────────────────────┘
```

**Privacy Policy Must Include:**

- What data collected (email, password)
- How stored (Supabase, encryption)
- Processing purposes
- User rights (GDPR)
- Contact data administrator

---

## 4. Reusable Components

### 4.1. WardCard Component

**Props:**

```typescript
interface WardCardProps {
  wardName: string;
  isFavorite: boolean;
  onFavoriteToggle: (wardName: string) => void;
  onClick: () => void;
}
```

**Structure:**

```tsx
<Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer min-h-[44px] flex items-center justify-between p-4">
  <Button
    variant="ghost"
    size="icon"
    onClick={handleFavoriteToggle}
    aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
  >
    {isFavorite ? <Star className="fill-yellow-500" /> : <StarOff />}
  </Button>

  <div className="flex-1 text-center font-bold" onClick={handleCardClick}>
    {wardName}
  </div>

  <ChevronRight className="text-muted-foreground" />
</Card>
```

---

### 4.2. HospitalCard Component

**Props:**

```typescript
interface HospitalCardProps {
  hospitalName: string;
  district: string;
  availablePlaces: string; // VARCHAR from API
  lastUpdated: string; // timestamp
}
```

**Structure:**

```tsx
<Card className="p-4 space-y-2">
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-primary rounded-full p-2">
        <Hospital className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-base">{hospitalName}</h3>
        <p className="text-sm text-muted-foreground">{district}</p>
      </div>
    </div>
  </div>

  <div className="text-xs text-muted-foreground">Dane: {formatDate(lastUpdated)}</div>

  <div className="flex justify-between items-end">
    <span className="text-xs text-muted-foreground">MIEJSCA</span>
    <Badge className={getBadgeColor(availablePlaces)} size="lg">
      {availablePlaces}
    </Badge>
  </div>
</Card>
```

---

### 4.3. SearchBar Component

**Props:**

```typescript
interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  minChars?: number; // default: 2
  debounceMs?: number; // default: 300
}
```

**Structure:**

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

  <Input type="text" placeholder={placeholder} value={value} onChange={handleChange} className="pl-10 pr-10 h-[44px]" />

  {value && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-2 top-1/2 -translate-y-1/2"
      onClick={handleClear}
      aria-label="Wyczyść wyszukiwanie"
    >
      <X />
    </Button>
  )}
</div>
```

**Logic:**

```typescript
const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
  const timer = setTimeout(() => {
    if (value.length === 0 || value.length >= minChars) {
      setDebouncedValue(value);
    }
  }, debounceMs);

  return () => clearTimeout(timer);
}, [value, minChars, debounceMs]);

useEffect(() => {
  onChange(debouncedValue);
}, [debouncedValue]);
```

---

### 4.4. WarningBanner Component

**Props:**

```typescript
interface WarningBannerProps {
  lastScrapeTime: string;
  hoursSinceLastScrape: number;
  sourceUrl: string;
}
```

**Structure:**

```tsx
<Alert variant="warning" className="mb-4">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Dane mogą być nieaktualne</AlertTitle>
  <AlertDescription>
    Ostatnia aktualizacja {hoursSinceLastScrape}h temu. Sprawdź{" "}
    <a href={sourceUrl} target="_blank" rel="noopener" className="underline">
      źródło
    </a>{" "}
    dla pewności.
  </AlertDescription>
</Alert>
```

**Trigger:** Display when data >12h old

---

### 4.5. AIInsightBanner Component

**Props:**

```typescript
interface AIInsightBannerProps {
  insightText: string;
  onDismiss: () => void;
}
```

**Structure:**

```tsx
<Alert variant="info" className="mb-4 relative">
  <Lightbulb className="h-4 w-4" />
  <AlertTitle>AI Insight</AlertTitle>
  <AlertDescription>{insightText}</AlertDescription>

  <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onDismiss} aria-label="Ukryj insight">
    <X />
  </Button>
</Alert>
```

**Logic:**

```typescript
const handleDismiss = () => {
  sessionStorage.setItem("insightDismissed", "true");
  onDismiss();
};

// In Navbar:
const showInsightIcon = sessionStorage.getItem("insightDismissed") === "true" && insightAvailable;

const handleRestoreInsight = () => {
  sessionStorage.removeItem("insightDismissed");
  // Trigger re-render
};
```

---

### 4.6. FavoriteToggle Component

**Props:**

```typescript
interface FavoriteToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}
```

**Structure:**

```tsx
<div className="flex items-center gap-2">
  <User className="w-4 h-4" />
  <Label htmlFor="favorites-toggle">Tylko ulubione</Label>
  <Switch id="favorites-toggle" checked={enabled} onCheckedChange={onChange} />
</div>
```

---

### 4.7. EmptyState Component

**Props:**

```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

**Structure:**

```tsx
<Alert variant="info" className="text-center">
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription>{description}</AlertDescription>
  {actionLabel && onAction && (
    <Button onClick={onAction} className="mt-4">
      {actionLabel}
    </Button>
  )}
</Alert>
```

---

### 4.8. SkeletonLoader Component

**Ward Card Skeleton:**

```tsx
<Card className="p-4 space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</Card>
```

**Hospital Card Skeleton:**

```tsx
<Card className="p-4 space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-8 w-full" />
</Card>
```

**Usage:** Show 5-10 skeletons during initial load

---

### 4.9. Footer Component

**Desktop:**

```
┌────────────────────────────────────────────────────┐
│  Regulamin │ Polityka Prywatności │ Źródło danych │
│  © 2025 HosLU. Dane mają charakter informacyjny.  │
└────────────────────────────────────────────────────┘
```

**Properties:**

- Background: primary-dark (#2d5a58)
- Text: white
- Links: "Regulamin", "Polityka Prywatności", "Źródło danych" (external link)
- Copyright + Disclaimer

**Mobile:** Stacked (flex-col), centered

---

### 4.10. Cookie Consent Banner

**Layout (sticky bottom):**

```
┌────────────────────────────────────────────────────┐
│ Ta strona używa ciasteczek. [Polityka Prywatności]│
│ [Akceptuj] [Odrzuć]                                │
└────────────────────────────────────────────────────┘
```

**Logic:**

- Click "Akceptuj" → localStorage `cookieConsent: "accepted"` + hide banner
- Click "Odrzuć" → localStorage `cookieConsent: "rejected"` + hide banner
- Don't show if decision exists in localStorage
- **No tracking in MVP** - localStorage only for preference

---

## 5. Design System

### 5.1. Colors

```javascript
// tailwind.config.js
colors: {
  primary: {
    DEFAULT: '#3f7a78',  // Turquoise - navbar, main elements
    light: '#5da8a5',    // Hover states
    mint: '#1bd9b7',     // Accents, active filters
    dark: '#2d5a58'      // Footer, dark mode
  },
  background: '#f5f5f5',  // App background
  card: '#ffffff',        // Cards, dropdowns
  success: '#10b981',     // Green (>5 places)
  warning: '#f59e0b',     // Yellow (1-5 places)
  error: '#ef4444',       // Red (≤0 or negative)
  favorite: '#ec4899',    // Pink for heart icons
  link: '#3b82f6'         // Blue for links
}
```

### 5.2. Typography

```css
/* Headings */
--h1: 2rem (32px), font-weight: 700; /* "Lista oddziałów" */
--h2: 1.5rem (24px), font-weight: 700; /* Ward name */
--h3: 1.25rem (20px), font-weight: 600; /* Hospital name */

/* Body */
--body: 1rem (16px), font-weight: 400; /* Normal content */
--body-small: 0.875rem (14px), font-weight: 400; /* Timestamps */
--body-xs: 0.75rem (12px), font-weight: 400; /* Footer, helpers */

/* Metrics */
--metric: 2rem (32px), font-weight: 700; /* "-10" places number */
--metric-label: 0.75rem (12px), font-weight: 500, uppercase; /* "MIEJSCA" */
```

**Font Stack:**

- Primary: Inter or system fonts
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### 5.3. Spacing Scale (Tailwind)

```
2px  → space-0.5
4px  → space-1
8px  → space-2
12px → space-3
16px → space-4  ← Standard card padding
24px → space-6  ← Section separation
32px → space-8
48px → space-12
```

### 5.4. Layout

**Container:**

- Max-width desktop: 1280px (xl)
- Padding: 16px mobile, 24px tablet, 32px desktop

**Grid:**

- Mobile: Single column, full width
- Tablet: 2 columns (optional)
- Desktop: 2-3 columns (optional)

### 5.5. Icons (Lucide React)

```typescript
import {
  Heart, // Favorites (outline/filled)
  Star, // Favorites filled
  StarOff, // Favorites outline
  ChevronRight, // Navigate to details
  ChevronLeft, // Back
  ChevronDown, // Dropdown
  X, // Close, remove filter
  Menu, // Hamburger menu
  Users, // Group icon (toggle)
  User, // User profile icon
  Filter, // Filter icon
  Search, // Search bar
  AlertCircle, // Warnings
  AlertTriangle, // Warning banner
  ExternalLink, // Link to source
  Lightbulb, // AI Insight
  Hospital, // Hospital card icon
} from "lucide-react";
```

---

## 6. Error Handling & Edge Cases

### 6.1. HTTP Error Mapping

| Code    | Scenario                | UI Response                                   | Action                     |
| ------- | ----------------------- | --------------------------------------------- | -------------------------- |
| 401     | Session expired         | Redirect → `/login`                           | Clear session, logout      |
| 403     | Email not verified      | Toast: "Potwierdź swój adres email..."        | Link to resend             |
| 404     | Ward/Resource not found | Toast: "Nie znaleziono danych" + Empty state  | Back button / Clear search |
| 409     | Duplicate favorite      | Toast: "Ten oddział jest już w ulubionych"    | No action                  |
| 422     | Validation error        | Toast: "Nieprawidłowe dane..."                | Highlight invalid fields   |
| 429     | Rate limit              | Toast: "Zbyt wiele żądań. Spróbuj za chwilę." | Disable temporarily        |
| 500     | Server error            | Toast: "Błąd serwera. Spróbuj później."       | Retry button (optional)    |
| 503     | Service unavailable     | Toast: "Serwis chwilowo niedostępny."         | Retry button               |
| Network | Offline/Timeout         | Toast: "Brak połączenia z internetem."        | Retry button               |

### 6.2. Display Strategy

**Toast (Temporary Feedback):**

- User operations (favorite toggle, login, delete account)
- API errors (4xx, 5xx)
- Success messages (optional)
- Position: Top-right (desktop), Top-center (mobile)
- **Important:** User must close manually (no auto-dismiss)

**Alert Banner (Persistent Feedback):**

- System errors (stale data, scraping failure)
- Contextual messages (email verification reminder)
- Warning Banner: Permanent (not dismissible)
- AI Insight Banner: Dismissible

**Empty State (In-context Feedback):**

- No search results
- No favorites
- No hospitals in ward
- 404 Not Found

### 6.3. Loading States

**Initial Page Load:**

- Skeleton loaders (5-10 cards)
- Shimmer animation (gradient)
- Matches actual card structure

**Search Loading:**

- Spinner in search input (right side, next to X button)
- OR skeleton loaders (replace list)
- Debounce minimizes loading states

**Action Loading:**

- Button spinner (login, register, delete account)
- Inline spinner (optional for operations)
- Disable button during loading

### 6.4. Edge Cases

**1. Ward Name with Polish Characters:**

- URL encoding: `/wards/Chirurgia%20Og%C3%B3lna`
- Backend decoding
- Display proper name in UI

**2. Negative Values (availablePlaces):**

- Red badge with value (e.g., "-3")
- Tooltip: "Brak wolnych miejsc, oddział przepełniony"
- Warning icon (AlertCircle, red)
- Sorting: negative < 0 < positive

**3. Non-numeric availablePlaces:**

- Backend converts VARCHAR to INTEGER safely
- Fallback: gray badge with "N/A"
- Sorting: at end of list

**4. No AI Insight (204 No Content):**

- Banner doesn't render at all
- 💡 icon in navbar **hidden**
- Graceful degradation (no error message)

**5. Orphaned Favorites (ward no longer exists):**

- Backend trigger removes orphaned favorites automatically
- UI doesn't show non-existent wards
- No user action needed

**6. Long Ward/Hospital Names:**

- Text truncate (max 2 lines)
- Tooltip with full name (title attribute)
- Responsive ellipsis

**7. Very Long AI Insight (>200 chars):**

- Max-height with overflow-y-auto
- OR truncate with "Czytaj więcej" (expand)

**8. Email Verification Reminder:**

- Alert banner on `/wards` if email not verified
- "⚠️ Zweryfikuj swój email. [Wyślij ponownie]"
- Dismissible (X button)
- sessionStorage `verificationReminderDismissed: true`

---

## 7. Responsiveness & Accessibility

### 7.1. Breakpoints (Tailwind CSS)

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

**Strategy:** Mobile first (base styles) → Progressive enhancement (md:, lg:)

### 7.2. Mobile Adaptations

| Component       | Desktop                     | Mobile                    |
| --------------- | --------------------------- | ------------------------- |
| Navbar          | Horizontal links + dropdown | Hamburger menu (Sheet)    |
| Search + Toggle | Flex-row, one line          | Flex-col, stacked         |
| Cards           | Optional 2 columns          | Single column, full width |
| Footer          | Horizontal links            | Stacked, centered         |
| Typography      | Standard sizes              | Slightly smaller          |

**Touch Targets:**

- Min 44x44px (Apple HIG, Material Design)
- Spacing between interactive elements: min 8px

### 7.3. Accessibility (WCAG AA)

**Color Contrast:**

- Minimum 4.5:1 for text
- Badge colors verified:
  - Green bg-green-500 + white text ✅
  - Yellow bg-yellow-500 + black text ✅
  - Red bg-red-500 + white text ✅

**Focus Indicators:**

- Visible outline (ring-2 ring-primary)
- High contrast (blue or primary color)
- Never remove outline

**ARIA Labels:**

- Icons without text: aria-label
- Buttons: descriptive labels (not just "Button")
- Alerts: aria-live for dynamic content
- Tooltips: aria-describedby

**Semantic HTML:**

- Proper heading hierarchy (H1 → H2 → H3)
- Landmark roles (nav, main, footer)
- Lists: `<ul>`, `<ol>` for navigation
- Forms: `<label>` linked to `<input>` (htmlFor)

**Keyboard Navigation:**

- Tab order logical (top-to-bottom, left-to-right)
- Enter/Space for buttons and links
- Escape closes dialogs/menus
- Focus trap in modals

**Screen Reader Support:**

- Descriptive link text (not "Click here")
- Alt text for icons (or aria-hidden for decorative)
- Status announcements (aria-live="polite")
- Form validation errors announced

**Example:**

```tsx
<button
  onClick={handleFavoriteToggle}
  aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
  aria-pressed={isFavorite}
>
  <Star className={isFavorite ? "fill-yellow-500" : ""} />
</button>
```

---

## 8. State Management & Cache

### 8.1. State Management

**React Local State:**

- Search queries (ward search, hospital search)
- Toggle states (tylko ulubione)
- Loading states (initial load, search loading)
- Error states (API failures)
- Dialog/Modal open states

**Supabase Client:**

- Authentication session (JWT tokens)
- User profile (email, id)
- httpOnly cookies (secure token storage)

**SessionStorage:**

- `insightDismissed: boolean` - AI Insight banner dismissed state
- `verificationReminderDismissed: boolean` - Email verification reminder
- Scroll position (optional)

**LocalStorage:**

- `cookieConsent: 'accepted' | 'rejected'` - Cookie consent preference

**No Global State Library:** Complexity not justified for MVP

### 8.2. Cache Strategy

| Data Type      | Duration    | Invalidation Trigger    |
| -------------- | ----------- | ----------------------- |
| Ward List      | 10 min      | Favorite add/remove     |
| Hospital List  | 10 min      | Never (read-only)       |
| AI Insights    | 1h (client) | Never (24h server-side) |
| System Status  | 5 min       | Never                   |
| User Profile   | Session     | Logout                  |
| Favorites List | Session     | Add/Remove favorite     |

**Implementation:**

- React Query (tanstack/query) OR Supabase cache OR custom fetch wrapper
- Cache keys based on query params
- Invalidation via cache.invalidate() on mutations

---

## 9. RODO Compliance & Security

### 9.1. Cookie Consent

**Location:** Sticky bottom
**Content:** "Ta strona używa ciasteczek. [Polityka Prywatności]"
**Actions:** [Akceptuj] [Odrzuć]
**Storage:** localStorage `cookieConsent: "accepted"/"rejected"`
**No tracking in MVP** - localStorage only for preference

### 9.2. Terms & Privacy Policy

**Links in:**

- Footer (permanent, always visible)
- Registration checkbox (inline links)
- Cookie consent banner

**Content Requirements:**

- Terms: Usage conditions, data disclaimer
- Privacy: RODO compliance, data collected, processing, user rights

### 9.3. Account Deletion (GDPR Right to Erasure)

**Endpoint:** `DELETE /api/users/me`

**Flow:**

1. User → Settings → "Usuń konto"
2. Confirmation dialog (irreversibility warning)
3. DELETE request
4. CASCADE deletion of user_favorites (database level)
5. Logout + clear session
6. Redirect → `/`
7. Toast: "Konto zostało usunięte"

**Data Deletion:**

- auth.users (Supabase Admin API)
- user_favorites (CASCADE DELETE)
- JWT tokens invalidated

### 9.4. Security UI

**Input Sanitization:**

- Search queries: escape HTML, SQL injection prevention
- Zod validation schemas (backend)
- Client-side validation (UX feedback)

**Authentication:**

- JWT Bearer tokens (httpOnly cookies)
- Supabase Auth (secure by default)
- Session expiration (refresh tokens)
- 401 → auto logout + redirect

**Authorization:**

- RLS policies (database level)
- User can only access own favorites
- No cross-user data leakage

**HTTPS:**

- Enforced by Supabase in production
- No mixed content

**Rate Limiting:**

- Backend enforced (Supabase defaults)

---

## 10. Performance Optimizations

### 10.1. Client-Side

**Code Splitting:**

- Astro islands (hydrate only interactive components)
- React components lazy-loaded
- Route-based code splitting

**Image Optimization:**

- Astro Image component
- WebP format with fallbacks
- Responsive images (srcset)
- Lazy loading (loading="lazy")

**CSS Optimization:**

- Tailwind purge (production builds)
- Critical CSS inlined
- No unused styles

**JavaScript Optimization:**

- Tree shaking (Vite)
- Minification (production)
- Modern bundle (ES modules)

### 10.2. API Optimizations

**Request Batching:**

- Combine related API calls (wards + favorites in one request)
- GraphQL-style select projection (Supabase)

**Caching:**

- HTTP cache headers (Cache-Control, ETag)
- Client-side cache (10 min ward list, 5 min status)
- Server-side cache (24h AI insights)

**Pagination:**

- Limit: 50 (default), max 100
- Offset-based pagination
- Infinite scroll (future enhancement)

**Debouncing:**

- Search queries (300ms)
- Favorite toggles (prevent double-click)

### 10.3. Database Optimizations

**Indexes:**

- ward_name (trigram index for fuzzy search)
- district (B-tree for filtering)
- scrapedAt (DESC for freshness sorting)
- user_id (favorites lookup)

**Query Optimization:**

- SELECT projection (only needed columns)
- JOINs instead of N+1 queries
- Aggregate functions (database-side)

---

## 11. Implementation Checklist

### Missing Features (Identified)

- [x] **Back Button** on /wards/[wardName] page - "← Powrót" link to /wards with filter clearing (see line 353-357)

### Phase 1: Core Pages (Week 1-2)

- [x] Landing Page + Registration
- [x] Login + Auth flow
- [x] Ward List (/wards)
- [x] Hospital List (/wards/[wardName])

### Phase 2: Features (Week 3)

- [x] Favorites functionality (optimistic updates)
- [x] Search & Filter
- [x] Settings page + Account deletion

### Phase 3: Enhancements (Week 4)

- [x] AI Insights banner
- [x] Warning banner (stale data)
- [x] Error handling + Loading states

### Phase 4: Polish & Testing (Week 5)

- [x] Responsiveness (mobile optimization)
- [ ] Accessibility audit (WCAG AA)
- [ ] User acceptance testing
- [ ] Performance optimization

### Components to Install

```bash
npx shadcn@latest add card badge input button alert separator skeleton toast sheet dialog switch dropdown-menu checkbox
```

**Status: ✅ COMPLETED** - All components installed

### Accessibility Checklist

- [x] Keyboard navigation (Tab, Enter, Escape)
- [x] Focus indicators visible
- [x] ARIA labels present
- [x] Color contrast 4.5:1+
- [x] Semantic HTML
- [x] Form labels linked

### RODO Checklist

- [x] Cookie consent banner
- [x] Privacy policy page
- [x] Terms of service page
- [x] Account deletion flow
- [ ] Data export (future)

### Testing Checklist

- [x] Registration + verification flow
- [x] Login + auth redirects
- [x] Ward search (live, debounced)
- [x] Favorite toggle (optimistic update)
- [x] Hospital list sorting
- [x] Badge colors (green/yellow/red)
- [x] Stale data warning (>12h)
- [x] AI Insight dismiss/restore
- [x] Account deletion
- [x] Mobile responsiveness
- [x] Keyboard navigation
- [ ] Screen reader compatibility (needs manual testing)

---

**END OF GUIDE**

This document contains all technical specifications needed to implement the HosLU UI. Reference specific sections as needed during development.

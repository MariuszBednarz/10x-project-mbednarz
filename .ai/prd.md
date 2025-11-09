# Dokument wymagań produktu (PRD) – HosLU MVP

## 1. Przegląd produktu

HosLU to aplikacja webowa PWA dedykowana ratownikom medycznym i służbom zdrowia, agregująca dane o dostępności wolnych miejsc w szpitalach na Lubelszczyźnie. Aplikacja rozwiązuje problem nieresponsywnej strony urzędu wojewódzkiego, umożliwiając szybkie podejmowanie decyzji o wyborze szpitala.

## 2. Problem użytkownika

Ratownicy medyczni tracą cenny czas próbując uzyskać aktualne informacje o dostępności miejsc w szpitalach z nieresponsywnej, przestarzałej strony urzędu wojewódzkiego. Potrzebują szybkiego dostępu do tych danych na urządzeniach mobilnych podczas jazdy karetką, aby podjąć właściwą decyzję o wyborze szpitala dla pacjenta.

## 3. Wymagania funkcjonalne

### 3.1. Scraping i agregacja danych

**Zaimplementowana mikrousługa NestJS:**

- **Endpoint źródłowy:** https://szpitale.lublin.uw.gov.pl/page/1,raporty-szpitali.html (zabezpieczona przed botami)
- **Technologia:** Puppeteer z headless Chromium, NestJS framework
- **Częstotliwość:** Co 12 godzin (00:00 i 12:00, timezone: Europe/Warsaw) przez @nestjs/schedule CRON
- **Proces scrapowania:**
  1. ScraperService pobiera listę oddziałów ze strony głównej
  2. Dla każdego oddziału z linkiem wchodzi na podstronę i ekstraktuje dane szpitali
  3. DataService mapuje surowe dane do WardDataDto (TypeScript)
  4. UPSERT do Supabase z konfliktem na (wardName, hospitalName)
  5. Automatyczna deduplicja przed zapisem, szczegółowe logi operacji
- **Struktura danych:** Oddział → Lista Szpitali (powiat, nazwa, liczba wolnych miejsc, data aktualizacji ze źródła, timestamp scrapowania)
- **Pola timestampu:**
  - `lastUpdated` (string) - timestamp ze strony źródłowej (niezaufany, tylko do wyświetlenia)
  - `scrapedAt` (timestamp) - czas wykonania scrapowania przez mikrousługę (zaufany, do wszystkich operacji)
  - `created_at`, `updated_at` - automatyczne pole bazodanowe
- **Wartości ujemne** oznaczają przepełnienie oddziału
- **Hosting:** Render.com
- **Monitoring:** Health check endpoint (`/health`), szczegółowe logi (inserted/updated statistics)
- **Error handling:** Try-catch z retry logic, zachowanie ostatnich danych przy awarii
- Zawsze widoczny timestamp ostatniej aktualizacji oraz link do źródła danych jako fallback

### 3.2. Uwierzytelnianie użytkowników

- Rejestracja: email + hasło (minimalne dane)
- Odzyskiwanie/reset hasła
- Obowiązkowa weryfikacja emaila
- Landing page z formularzem rejestracji
- Funkcja usunięcia konta i danych

### 3.3. Przeglądanie danych

- Lista oddziałów jako ekran główny
- Kliknięcie w oddział → redirect do listy szpitali
- Karty szpitali (bez accordionów - wszystkie dane widoczne):
  - Nazwa, powiat, badge z liczbą miejsc (kod kolorystyczny: zielony >5, żółty 1-5, czerwony ≤0)
  - Ikona lokalizacji, timestamp aktualizacji
  - Ikona ulubionego (serce), ikona sad emoji dla przepełnienia
  - Link do źródła danych zawsze dostępny
- Obsługa wartości ujemnych: czerwony badge, sad emoji, tooltip "Brak wolnych miejsc, oddział przepełniony"

### 3.4. Personalizacja (ulubione oddziały)

- Oznaczanie oddziałów jako ulubione (ikona gwiazdki)
- Ulubione przenoszone na górę listy
- Brak limitu liczby ulubionych
- Optimistic update UI przy dodawaniu/usuwaniu

### 3.5. Wyszukiwanie i filtrowanie

- **Lokalizacja:** Pod tytułem "Woj. Lubelskie", w jednej linii: Search bar + Filtry
- Live search z debounce 300ms, case-insensitive
- Placeholder: "Szukaj oddziału lub szpitala..."
- Na ekranie oddziałów: wyszukiwanie po nazwie oddziału
- Na ekranie szpitali: wyszukiwanie po nazwie szpitala i powiecie
- Clear "X" button (pojawia się gdy jest tekst)
- Toggle "tylko ulubione" (Switch component)
- Dropdown "Powiaty" z multiselect pills

### 3.6. AI Insights (Claude API)

- Generowanie raz dziennie o 6:00
- **Lokalizacja:** Pod headerem (navbar), nad tytułem "Lista oddziałów", wyśrodkowany
- Format: jedno-dwa zdania w Alert component (jasno-niebieski)
- Przykład: "💡 Niska dostępność: Kardiologia (3 miejsca). Wysoka: Ortopedia (27 miejsc)"
- Cache na 24h, te same insights dla wszystkich użytkowników
- Graceful degradation: jeśli API nie odpowie, po prostu nie pokazuj banneru

### 3.7. Obsługa nieaktualnych danych

- **Warning Banner:** Tuż pod headerem (navbar), przed AI Insight
- **Trigger:** Dane starsze niż 12 godzin
- **Treść:** "⚠️ Dane mogą być nieaktualne (ostatnia aktualizacja 12h temu). Sprawdź źródło dla pewności. [Link]"
- **Style:** Żółty Alert component, zawsze widoczny (nie dismissible)
- Jeśli scraping nie powiódł się: dodatkowy Error Alert: "Nie udało się pobrać najnowszych danych. Pokazujemy ostatnie dostępne."

### 3.8. Bezpieczeństwo i zgodność

- HTTPS, rate limiting, CORS, JWT dla authenticated endpoints
- Szyfrowanie haseł, minimalne zbieranie danych
- Zgodność z RODO: polityka prywatności, regulamin, cookie banner, checkbox zgody
- Disclaimer w UI: "Dane mają charakter informacyjny. W przypadku wątpliwości zweryfikuj informacje bezpośrednio ze szpitalem"

## 4. Granice produktu

### 4.1. Poza zakresem MVP

- Nawigacja GPS do szpitala
- Spersonalizowane komunikaty AI per user
- Inne regiony poza województwem lubelskim
- Powiadomienia push
- Eksport danych do PDF
- Statystyki osobiste użytkownika
- Tryb ciemny
- Edycja profilu/zmiana emaila
- Zaawansowane filtry (po powiecie, custom sortowanie)
- Współdzielenie list ulubionych między użytkownikami

## 5. Historyjki użytkowników

### US-001: Rejestracja konta

**Jako** ratownik medyczny  
**Chcę** szybko założyć konto w aplikacji  
**Aby** móc korzystać z funkcji personalizacji

**Kryteria akceptacji:**

- Formularz rejestracyjny na landing page z polami: email, hasło
- Checkbox zgody na regulamin i politykę prywatności
- Po rejestracji wysyłany email weryfikacyjny
- Po weryfikacji użytkownik może się zalogować
- Bezpośredni dostęp do listy oddziałów (brak onboarding tour)

### US-002: Logowanie

**Jako** zarejestrowany użytkownik  
**Chcę** się zalogować  
**Aby** mieć dostęp do moich ulubionych oddziałów

**Kryteria akceptacji:**

- Po podaniu prawidłowych danych użytkownik widzi główny ekran z listą oddziałów
- Błędne dane wyświetlają komunikat o nieprawidłowych danych
- Sesja użytkownika jest bezpiecznie zarządzana (JWT)

### US-003: Przeglądanie dostępności miejsc

**Jako** ratownik medyczny w karetce  
**Chcę** szybko sprawdzić dostępność miejsc w konkretnym oddziale  
**Aby** podjąć decyzję do którego szpitala zawieźć pacjenta

**Kryteria akceptacji:**

- Po zalogowaniu widzi listę oddziałów z AI insight banner pod headerem (centered)
- Może użyć wyszukiwania (pod "Woj. Lubelskie") aby znaleźć konkretny oddział
- Po kliknięciu w oddział widzi listę szpitali
- Każdy szpital pokazuje w jednej karcie: nazwę, powiat, badge z liczbą miejsc, timestamp, ikonę ulubionego
- Wszystkie dane widoczne od razu (bez rozwijania accordionów)
- Może kliknąć link do źródła danych dla weryfikacji
- Jeśli dane >12h, widzi warning banner u góry

### US-004: Personalizacja ulubionych

**Jako** ratownik medyczny  
**Chcę** oznaczyć najczęściej używane oddziały jako ulubione  
**Aby** szybciej do nich dotrzeć podczas pracy

**Kryteria akceptacji:**

- Przy każdym oddziale ikona gwiazdki
- Kliknięcie gwiazdki dodaje do ulubionych (optimistic update)
- Ulubione przenoszone na górę listy
- Filtr "tylko ulubione" dostępny
- Ulubione zachowane między sesjami

### US-005: Interpretacja przepełnienia oddziału

**Jako** ratownik medyczny  
**Chcę** zrozumieć co oznacza ujemna liczba miejsc  
**Aby** podjąć właściwą decyzję

**Kryteria akceptacji:**

- Szpital z ujemną liczbą ma czerwony badge z wartością (np. "-3")
- Ikona ostrzeżenia i tooltip: "Brak wolnych miejsc, oddział przepełniony"
- W sortowaniu ujemne wartości są gorsze niż 0

### US-006: Korzystanie z aplikacji przy nieaktualnych danych

**Jako** ratownik medyczny  
**Chcę** wiedzieć kiedy dane były ostatnio aktualizowane  
**Aby** ocenić ich wiarygodność

**Kryteria akceptacji:**

- Timestamp ostatniej aktualizacji zawsze widoczny na każdej karcie szpitala
- Warning banner u góry (tuż pod headerem) gdy dane >12h: "⚠️ Dane mogą być nieaktualne..."
- Komunikat gdy scraping się nie powiódł: Error Alert "Nie udało się pobrać najnowszych danych..."
- Link do źródła zawsze dostępny w warning bannerze i footerze

## 6. Stack techniczny

### 6.1. Architektura

- **Backend:** Supabase (baza danych PostgreSQL, autentykacja JWT)
- **Frontend:** PWA (Progressive Web App), responsywna dla telefonów i tabletów
- **Scraping Microservice:** NestJS + Puppeteer (zaimplementowana, Render.com Web Service)
  - Framework: NestJS z TypeScript
  - Scraping engine: Puppeteer (headless Chromium)
  - Scheduling: @nestjs/schedule (CRON: `0 */12 * * *`)
  - Database client: @supabase/supabase-js (Service Role Key)
  - Health monitoring: `/health` endpoint
  - Containerization: Docker (Puppeteer base image)
- **AI:** Claude API (Anthropic)
- **Hosting:**
  - Scraper: Render.com Web Service (free tier)
  - Frontend: TBC
  - Database: Supabase Cloud (free tier MVP)

### 6.2. Bezpieczeństwo

- HTTPS, rate limiting, JWT authentication
- Szyfrowanie haseł, CORS, podstawowa walidacja inputów

### 6.3. Testing

- Testy jednostkowe i integracyjne kodu
- Testy manualne przed deploymentem
- Monitoring logów po deploymencie
- Uptime monitoring, error tracking

## 7. Metryki sukcesu

### 7.1. KPI MVP

1. **Minimum 30 zarejestrowanych użytkowników**
   - Pomiar: liczba zweryfikowanych kont
   - Tracking: manualne zapytanie do bazy

2. **Średnio minimum 3 ulubione oddziały na aktywnego użytkownika**
   - Aktywny użytkownik = zalogował się min 1x w ostatnim miesiącu
   - Tracking: zapytanie agregujące z tabeli ulubionych

3. **Retencja: logowania minimum 2x w tygodniu przez 3 miesiące**
   - Cel: 83% tygodni (10 z 12 tygodni)
   - Tracking: logi logowań (user_id, login_timestamp), manualna analiza

### 7.2. Metryki operacyjne

- Success rate scrapingu (target: >95%)
- Uptime aplikacji
- Error rate
- Liczba wywołań AI API i success rate

## 8. Kluczowe ryzyka

1. **Scraping może przestać działać** przy zmianach struktury źródła
   - Mitygacja: monitoring, alerty, link do źródła jako fallback

2. **Niska adopcja** (nie osiągnięcie 30 użytkowników)
   - Mitygacja: bezpośrednie dotarcie do stacji pogotowia, demonstracje

3. **Dane mogą być nieaktualne**
   - Mitygacja: jasna komunikacja timestampu, link do źródła, disclaimer

4. **Koszt API Claude** przy skali
   - Mitygacja: cache na 24h, jedno wywołanie dziennie dla wszystkich

5. **Odpowiedzialność prawna** za nieprawidłowe dane
   - Mitygacja: wyraźny disclaimer, zawsze dostępny link do źródła

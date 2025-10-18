# Dokument wymagań produktu (PRD) – HosLU MVP

## 1. Przegląd produktu

HosLU to aplikacja webowa PWA dedykowana ratownikom medycznym i służbom zdrowia, agregująca dane o dostępności wolnych miejsc w szpitalach na Lubelszczyźnie. Aplikacja rozwiązuje problem nieresponsywnej strony urzędu wojewódzkiego, umożliwiając szybkie podejmowanie decyzji o wyborze szpitala.

## 2. Problem użytkownika

Ratownicy medyczni tracą cenny czas próbując uzyskać aktualne informacje o dostępności miejsc w szpitalach z nieresponsywnej, przestarzałej strony urzędu wojewódzkiego. Potrzebują szybkiego dostępu do tych danych na urządzeniach mobilnych podczas jazdy karetką, aby podjąć właściwą decyzję o wyborze szpitala dla pacjenta.

## 3. Wymagania funkcjonalne

### 3.1. Scraping i agregacja danych

- Automatyczne pobieranie danych ze strony https://szpitale.lublin.uw.gov.pl/page/1,raporty-szpitali.html przy użyciu Puppeteer (strona zabezpieczona przed botami)
- Częstotliwość: co 12-24 godziny
- Struktura danych: Oddział → Lista Szpitali (powiat, nazwa, liczba wolnych miejsc, data aktualizacji)
- Wartości ujemne oznaczają przepełnienie oddziału
- Zawsze widoczny timestamp ostatniej aktualizacji oraz link do źródła danych jako fallback

### 3.2. Uwierzytelnianie użytkowników

- Rejestracja: email + hasło (minimalne dane)
- Obowiązkowa weryfikacja emaila
- Landing page z formularzem rejestracji
- Funkcja usunięcia konta i danych

### 3.3. Przeglądanie danych

- Lista oddziałów jako ekran główny
- Kliknięcie w oddział → redirect do listy szpitali
- Accordiony dla szczegółów każdego szpitala:
  - Zwiniête: nazwa, powiat, badge z liczbą miejsc (kod kolorystyczny: zielony >5, żółty 1-5, czerwony ≤0), timestamp
  - Rozwinięte: pełne dane, dokładna data/godzina aktualizacji, link do źródła
- Obsługa wartości ujemnych: czerwony badge, ikona ostrzeżenia, tooltip "Brak wolnych miejsc, oddział przepełniony"

### 3.4. Personalizacja (ulubione oddziały)

- Oznaczanie oddziałów jako ulubione (ikona gwiazdki)
- Ulubione przenoszone na górę listy
- Brak limitu liczby ulubionych
- Optimistic update UI przy dodawaniu/usuwaniu

### 3.5. Wyszukiwanie i filtrowanie

- Live search z debounce 300ms, case-insensitive
- Na ekranie oddziałów: wyszukiwanie po nazwie oddziału
- Na ekranie szpitali: wyszukiwanie po nazwie szpitala i powiecie
- Clear "X" button
- Toggle "tylko ulubione"

### 3.6. AI Insights (Claude API)

- Generowanie raz dziennie o 6:00
- Format: jedno zdanie jako sticky banner na górze ekranu
- Przykład: "Niska dostępność: Kardiologia (3 miejsca). Wysoka: Ortopedia (27 miejsc)"
- Cache na 24h, te same insights dla wszystkich użytkowników
- Graceful degradation jeśli API nie odpowie

### 3.7. Obsługa nieaktualnych danych

- Jeśli scraping nie powiódł się: wyświetl ostatnie dane + komunikat "Nie udało się pobrać najnowszych danych. Pokazujemy ostatnie z [data]. [Link do źródła]"
- Badge ostrzegawczy dla danych starszych niż 24h (żółty) lub 48h (czerwony)

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

- Po zalogowaniu widzi listę oddziałów z AI insight na górze (jedno zdanie)
- Może użyć wyszukiwania aby znaleźć konkretny oddział
- Po kliknięciu w oddział widzi listę szpitali
- Każdy szpital pokazuje: nazwę, powiat, badge z liczbą miejsc, timestamp
- Może rozwinąć accordion dla szczegółów
- Może kliknąć link do źródła danych dla weryfikacji

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

- Timestamp ostatniej aktualizacji zawsze widoczny
- Komunikat gdy scraping się nie powiódł: "Nie udało się pobrać najnowszych danych..."
- Link do źródła zawsze dostępny
- Badge ostrzegawczy dla danych >24h (żółty) lub >48h (czerwony)

## 6. Stack techniczny

### 6.1. Architektura

- **Backend:** Supabase (baza danych, autentykacja)
- **Frontend:** PWA (Progressive Web App), responsywna dla telefonów i tabletów
- **Scraping:** Puppeteer (wymaga implementacji poza Supabase - np. Vercel Functions, AWS Lambda, Railway)
- **AI:** Claude API (Anthropic)
- **Hosting:** Do określenia (wymagany cron job dla scrapingu)

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

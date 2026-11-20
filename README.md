# Twój sklep TCG — sklep i panel administratora

Wielostronicowy sklep Pokémon w czarno-żółtym stylu: 50 kategorii z osobnymi adresami, strony produktów, wyszukiwanie, filtrowanie i panel zarządzania produktami.

## Vercel

Domyślny build: **Next.js**, Node.js **24.x**. Produkty: **Neon PostgreSQL**. Zdjęcia: **prywatny Vercel Blob**. Instrukcja podłączenia usług i ustawienia hasła: [VERCEL.md](./VERCEL.md).

```powershell
npm ci
npm run build
npm start
```

Build generuje `.next/routes-manifest.json` i wykonuje migrację PostgreSQL, jeśli ustawiono połączenie. Bez skonfigurowanych usług publiczny katalog startowy działa tylko do odczytu; panel wyświetla brakujące ustawienia.

## Lokalnie

W pustej konfiguracji lokalnej:

```powershell
npm ci
node scripts/create-admin-env.mjs
Copy-Item .local/admin-vercel.env .env.local
Add-Content .env.local 'SHOP_LOCAL=1'
npm run dev
```

Jeżeli `.env.local` już istnieje, dodaj brakujące klucze ręcznie, zachowując dotychczasową konfigurację. Adres domyślny: `http://localhost:3000`. Hasło do `/admin` znajduje się w `.local/admin-password.txt`. Lokalna baza SQLite i zdjęcia są w ignorowanym katalogu `.local`. Ten tryb nigdy nie uruchamia zapisu do SQLite na Vercel.

## Adresy i panel

- `/`, `/sklep` — strona główna i katalog
- `/kategoria/pokemon`, `/kategoria/etb` — osobne kategorie
- `/produkt/terastal-gathering-coin-set-espeon` — strona produktu
- `/live-stream`, `/wydarzenia`, `/ulubione`, `/pomoc` — osobne podstrony
- `/admin/login`, `/admin`, `/admin/produkty/nowy`, `/admin/kategorie` — logowanie i zarządzanie

Panel obsługuje nazwę, adres produktu, opis, cenę brutto, stan, SKU, kategorię, język i galerię do 10 zdjęć. Pozwala tworzyć szkice, publikować, wyróżniać, oznaczać do live, archiwizować i przywracać. Limit zdjęcia wynosi 4 MB; pierwsze zdjęcie jest główne, kolejność można zmieniać.

Autoryzacja i walidacja odbywają się na serwerze. Kontrola wersji chroni równoczesne zmiany. Vercel korzysta z podpisanej sesji i hasła przechowywanego jako scrypt. Nagłówki tożsamości Cloudflare nie dają dostępu do panelu na Vercel.

Kategorie są w `lib/shop/categories.json`, a 12 produktów startowych w `lib/shop/seed.json`. Jednorazowy import nie nadpisuje edycji. Stan początkowy wynosi 0, ponieważ dostępność nie została potwierdzona.

## Zgodność z Sites

Zachowano osobny runtime Cloudflare D1/R2 i logowanie Sites. Polecenia `npm run dev:sites`, `npm run build:sites` i `npm run start:sites` uruchamiają ten wariant. Budowanie przez workflow Sites wymaga `SHOP_TARGET=cloudflare`.

Na Sites serwer rozpoznaje administratora po sekrecie `ADMIN_EMAIL_SHA256`; adres e-mail nie jest wyświetlany w interfejsie. Migracje D1 pozostają w `drizzle`, a schemat PostgreSQL w `db/postgres.sql`. Dane z D1/R2 nie są automatycznie kopiowane do Neon/Blob.

## Weryfikacja

Test integracyjny sprawdza 50 kategorii, produkty, 404, autoryzację, walidację i ochronę Origin, CRUD, konflikty wersji, szkice, archiwizację, galerie oraz zapis i odczyt zdjęć. Przeciwko lokalnemu Next.js na porcie 3000:

```powershell
$env:SHOP_TEST_RUNTIME='vercel'
node tests/catalog-integration.mjs
```

Test korzysta z lokalnego hasła i tworzy produkt testowy, który na końcu archiwizuje. Nie uruchamiaj go przeciwko katalogowi produkcyjnemu.

## Zakres sprzedaży i grafiki

Koszyk i ulubione zapisują się na urządzeniu klienta. Koszyk sprawdza ceny i dostępność, ale nie rezerwuje towaru. Płatności, finalizacja zamówień, wysyłka i obsługa zamówień wymagają osobnej integracji; strona informuje o tym klienta i nie przyjmuje płatności.

W miejscu logo widnieje neutralny napis „TWOJE LOGO”. Lokalne grafiki produktów służą do prezentacji katalogu. Znaki Pokémon i nazwy produktów należą do ich właścicieli.

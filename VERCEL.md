# PokePaka na Vercel

Projekt działa jako Next.js na Node.js 24. Produkty zapisuje w PostgreSQL (Neon), a zdjęcia w prywatnym Vercel Blob. Panel `/admin` ma własne logowanie hasłem.

## Ustawienia projektu

Repozytorium sklepu na GitHub, gałąź `main`. Root Directory: `./`, czyli katalog zawierający `package.json` w repozytorium.

- Framework Preset: **Next.js**
- Node.js: **24.x**
- Build Command: `npm run build`
- Install Command: `npm ci`
- Output Directory: `.next`

Te ustawienia zawiera także `vercel.json`. Usuń stare nadpisania wskazujące `dist`, Vinext lub `build:sites`. Usuń `POKEPAKA_TARGET=cloudflare`, jeśli ustawiono je w Vercel. Build musi zakończyć się komunikatem `Verified: .next/routes-manifest.json is ready for Vercel.`

## Baza produktów — Neon

W projekcie Vercel otwórz **Storage → Create Database**, wybierz **Neon / PostgreSQL** i podłącz bazę do projektu. Wybierz region zbliżony do funkcji Vercel oraz plan odpowiadający Twoim potrzebom; sprawdź limity i opłaty w panelu dostawcy.

Integracja powinna udostępnić `DATABASE_URL` lub `POSTGRES_URL`. Jeśli użyto własnego prefiksu, dodaj `DATABASE_URL` z wartością połączenia PostgreSQL dostarczoną przez Neon. Zalecane jest połączenie z poolerem. Zmienna jest wyłącznie serwerowa, bez prefiksu `NEXT_PUBLIC_`.

Build automatycznie wykonuje `scripts/migrate-postgres.mjs`: tworzy brakujące tabele i indeks, zachowując istniejące produkty. Po pierwszym wejściu do sklepu jednorazowo importuje 12 produktów startowych. Ich stan magazynowy wynosi 0 do czasu ręcznego ustawienia dostępności.

## Zdjęcia — Vercel Blob

W **Storage → Create Database → Blob** utwórz magazyn z dostępem **Private** i podłącz go do projektu. Aplikacja obsługuje `BLOB_READ_WRITE_TOKEN` oraz automatyczne uwierzytelnianie OIDC (`BLOB_STORE_ID` i `VERCEL_OIDC_TOKEN`). Połączenie magazynu w panelu powinno dodać potrzebne zmienne.

Zdjęcia są udostępniane klientom przez `/media/...`. Nie ustawiaj magazynu jako Public: aplikacja korzysta z trybu Private. Limit pojedynczego zdjęcia wynosi 4 MB; obsługiwane formaty to PNG, JPG, WebP i GIF.

## Hasło administratora

W terminalu VS Code, w katalogu projektu, uruchom:

```powershell
node scripts/create-admin-env.mjs
```

Skrypt zapisuje dwa lokalne pliki wykluczone z Git:

- `.local/admin-vercel.env` — `ADMIN_PASSWORD_HASH` i `ADMIN_SESSION_SECRET` do ustawienia w Vercel.
- `.local/admin-password.txt` — hasło do logowania w `/admin`.

Ponowne uruchomienie zachowuje istniejące dane. Nie wysyłaj tych plików do repozytorium ani na czat. Zachowaj hasło w menedżerze haseł.

W **Settings → Environment Variables** dodaj osobno `ADMIN_PASSWORD_HASH` i `ADMIN_SESSION_SECRET`, kopiując ich wartości z `.local/admin-vercel.env`. Hash ma format `scrypt:...:...`; skopiuj całość bez nazwy klucza i bez cudzysłowów.

Włącz zmienne i połączenia usług dla Production. Dla Preview zalecana jest osobna baza/gałąź Neon i osobny magazyn, aby testy nie zmieniały katalogu produkcyjnego.

Po ustawieniu wszystkich zmiennych uruchom **Redeploy** najnowszego wdrożenia. Otwórz `/admin`, zaloguj się hasłem z lokalnego pliku i dodaj produkt ze zdjęciem. Sprawdź, czy po odświeżeniu i na innym urządzeniu produkt ma tę samą cenę, stan i galerię.

## Diagnostyka

Bez bazy publiczny sklep pokazuje katalog startowy tylko do odczytu. Panel nie pozwala zapisywać produktów w nietrwałym systemie plików Vercel. `/admin/login` wyświetla brakujące ustawienia. Lokalny tryb SQLite jest wyłączony, gdy aplikacja działa na Vercel.

Jeśli powraca `NEXT_NO_ROUTES_MANIFEST`, sprawdź Root Directory, nadpisania Build Command i Output Directory, a następnie uruchom Redeploy bez starego cache. `npm run build` musi używać Next.js, nie `npm run build:sites`.

Jeśli baza zgłasza błąd podczas budowania, sprawdź `DATABASE_URL`, status Neon i zakres środowiska zmiennej. `npm run db:migrate:vercel` wykonuje tę samą migrację ręcznie z lokalnym `.env.local` wskazującym właściwą bazę.

Dokumentacja: [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Neon i Vercel](https://neon.com/docs/guides/vercel-overview), [Vercel Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk).

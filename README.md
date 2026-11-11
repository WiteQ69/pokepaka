# PokePaka — sklep i panel administratora

Nowa, wielostronicowa odsłona PokePaka w czarno-żółtym stylu. Zaplecze działa na Vinext i Cloudflare Workers. Produkty przechowywane są w D1, a zdjęcia przesyłane przez panel w R2.

## Adresy

- / — strona główna
- /sklep — pełny katalog
- /kategoria/pokemon — przykładowa kategoria
- /kategoria/etb — przykładowa podkategoria
- /produkt/terastal-gathering-coin-set-espeon — przykładowa strona produktu
- /live-stream — produkty do otwierania na żywo
- /wydarzenia — osobna strona wydarzeń
- /ulubione — zapisane produkty
- /pomoc — pytania i odpowiedzi
- /admin — panel administratora
- /admin/produkty/nowy — dodawanie produktu
- /admin/kategorie — pełna struktura kategorii

Każda z 50 kategorii z dostarczonego menu ma własny adres. Zwykłe linki i renderowanie po stronie serwera działają także przy bezpośrednim otwarciu lub odświeżeniu podstrony.

## Panel

Dostęp wymaga zalogowania przez ChatGPT na konto wskazane w zmiennej środowiskowej ADMIN_EMAIL. Autoryzacja jest sprawdzana na serwerze przy każdej operacji. Przynależność do konta właściciela nie jest ustalana na podstawie przeglądarkowego localStorage.

Panel pozwala dodawać i edytować nazwę, adres produktu, opis, cenę brutto, liczbę sztuk, SKU, kategorię, język i galerię do 10 zdjęć. Obsługuje szkice, publikację, wyróżnianie, oznaczanie do live i odwracalną archiwizację. Zdjęcia można przesyłać z dysku, przeciągać lub dodawać przez HTTPS. Pierwsze zdjęcie jest główne; kolejność można zmieniać.

Zapis jest trwały, wspólny dla wszystkich urządzeń i od razu widoczny w sklepie. Kontrola wersji zapobiega nadpisaniu równoczesnych zmian z innego okna.

## Pierwsze uruchomienie

Pierwsze wejście właściciela do panelu importuje 12 produktów z wcześniejszego katalogu. Import jest jednorazowy i nie nadpisuje późniejszych edycji. Początkowy stan magazynowy wynosi 0, ponieważ dostępność tych produktów nie została potwierdzona. Administrator może ją ustawić w formularzu.

Kategorie pochodzą z menu HTML przekazanego przez użytkownika. Dane startowe są w lib/shop/seed.json, a hierarchia w lib/shop/categories.json. Import jest oddzielony od migracji schematu.

## Rozwój lokalny

Wymagane Node.js >=22.13 i npm. Zainstaluj zależności zgodnie z workflow Sites, następnie uruchom npm run dev. Lokalny adres jest wypisywany przez serwer (domyślnie http://127.0.0.1:5173).

W lokalnym .dev.vars ustaw ADMIN_EMAIL=seedy@sites.test. Wejdź na /signin-with-chatgpt?return_to=/admin, aby zalogować się tożsamością testową dostarczaną przez starter. Ta symulacja nie występuje w wersji produkcyjnej.

Po zmianie schematu uruchom npm run db:generate. Lokalne migracje D1 i build opisuje dokumentacja startera Sites. Migracje w drizzle są częścią źródeł; nie wolno zmieniać już zastosowanych migracji. Wdrożenie przez Sites stosuje migracje produkcyjne.

## Weryfikacja

- Build produkcyjny Vinext i kontrola typów TypeScript.
- Test integracyjny tests/catalog-integration.mjs: 50 adresów kategorii, strony produktów, 404, ochrona panelu, odrzucanie podszytych nagłówków, ochrona przed obcym Origin, walidacja cen i zdjęć, tworzenie, trwała edycja, konflikt wersji, duplikaty adresów, szkice, archiwizacja i przywracanie.
- Faktyczne przesłanie obrazów do R2 i odczyt zapisanych bajtów; odrzucenie SVG.
- Test w przeglądarce: utworzenie produktu z dwiema fotografiami, galeria, cena i liczba sztuk oraz suma koszyka 2 × 149,99 zł = 299,98 zł.
- Układy mobilne 390 px, kategorie, produkt, lista i formularz administratora bez poziomego przepełnienia.

## Zakres sprzedaży

Katalog, magazyn i panel administratora mają działające zaplecze. Koszyk i ulubione są zapisywane lokalnie na urządzeniu klienta. Koszyk sprawdza aktualne ceny i dostępność produktów, ale nie rezerwuje towaru.

Finalizacja zamówień, płatności, wysyłki i obsługa zamówień nie są jeszcze podłączone. Strona jawnie informuje o tym w koszyku i na stronie produktu. Nie przyjmuje płatności ani nie składa zamówień.

## Grafiki

Logo z przezroczystym tłem zostało przygotowane z pliku użytkownika i znajduje się w public/assets/pokepaka-logo.png. Zdjęcia produktów pochodzą z pokepaka.pl, grafiki kart z images.pokemontcg.io, a ilustracja Eevee z PokeAPI/sprites. Znaki Pokémon i nazwy produktów należą do właścicieli. Kroje są wczytywane z Google Fonts.

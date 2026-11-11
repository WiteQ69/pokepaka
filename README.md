# PokePaka — nowa odsłona

Responsywny projekt sklepu kolekcjonerskiego po polsku. Wersja demonstracyjna przygotowana na podstawie publicznego katalogu pokepaka.pl z 11 listopada 2026 r. Aktualizacja: czarno-żółty styl sklepu inspirowany układem Karcianego Bunkra, z własną marką i grafikami PokePaka.

## Uruchomienie

Wymagany Node.js 20 lub nowszy. Brak zależności do instalowania.

```
node serve.mjs
```

Otwórz http://127.0.0.1:4173. Katalog `dist` można umieścić na hostingu statycznym. Strona wymaga serwera HTTP, ponieważ wczytuje products.json.

## Gotowe

- Nowy projekt graficzny, układ mobilny i desktopowy.
- Katalog z 12 przykładowymi produktami, zdjęciami i cenami z obecnego sklepu.
- Wyszukiwanie, kategorie, typy produktów, sortowanie i doładowywanie listy.
- Okno szczegółów i link do produktu źródłowego.
- Ulubione i koszyk zapisane lokalnie w przeglądarce.
- Zmiana liczby sztuk, usuwanie produktów oraz przeliczanie wartości.
- Menu mobilne, sekcja YouTube, pytania i odpowiedzi, dane kontaktowe.

## Przed rozpoczęciem sprzedaży

To frontend pokazowy. Nie przyjmuje zamówień ani płatności, a koszyk nie rezerwuje towaru. Ceny i dostępność wymagają synchronizacji z właściwą bazą sklepu. Należy podłączyć backend e-commerce, stany magazynowe, płatności, dostawy, finalizację zakupów i właściwe dokumenty sklepu. Treść oznaczeń demonstracyjnych usunąć dopiero po uruchomieniu obsługi sprzedaży.

## Pliki

- dist/index.html — układ i treści
- dist/styles.css — styl i responsywność
- dist/bunker-theme.css — nowa czarno-żółta szata, nagłówek, typografia Oswald i karty produktów
- dist/app.js — interakcje
- dist/products.json — przykładowy katalog
- dist/assets — lokalne zdjęcia oraz ikona

Zdjęcia produktów: pokepaka.pl. Grafiki kart: images.pokemontcg.io. Ilustracja Eevee: repozytorium PokeAPI/sprites. Znaki Pokémon i nazwy produktów należą do ich właścicieli. Kroje DM Sans, Space Grotesk i Oswald wczytywane są z Google Fonts. Pozostałe elementy graficzne to HTML/CSS i ikony SVG. Logo dostarczył użytkownik; białe tło usunięto narzędziem imagegen. Finalny plik: dist/assets/pokepaka-logo.png (1753 × 897 px, RGBA, przezroczyste narożniki). Umieszczono go w nagłówku i stopce.

Prompt edycji logo: usuń wyłącznie białe tło, zastąp je przezroczystością alfa; zachowaj napis POKEPAKA, kształt, proporcje, żółto-pomarańczowe litery, granatowe i turkusowe kontury oraz czerwone obramowanie; bez nowego projektu, tekstu, efektów i białej obwódki.

## Weryfikacja

Sprawdzono składnię JavaScript, odpowiedź HTTP, ładowanie obrazów i układ desktopowy oraz mobilny. W przeglądarce sprawdzono wyniki wyszukiwania, pusty wynik, ulubione, okno produktu, dodawanie do koszyka, zmianę ilości i wartości 95 → 190 zł, zachowanie po odświeżeniu, usuwanie, filtry kategorii, 12 produktów po doładowaniu i sortowanie cen rosnąco.

Po aktualizacji sprawdzono wyszukiwarkę z nowym przyciskiem, przeliczenie koszyka 95 → 190 zł, menu mobilne, filtr One Piece, szczegóły produktu i układy 390, 768 oraz 1440 px. Brak poziomego przepełnienia i uszkodzonych obrazów w sprawdzonych widokach.

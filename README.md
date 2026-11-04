# Scorekeeper — Hartenjagen & klaverjassen

Mobiele web-app (PWA) om scores bij te houden tijdens hartenjagen en klaverjassen. Eén persoon houdt de score bij op z'n telefoon; geen login, geen backend — alles staat lokaal op het apparaat.

## Spelregels hartenjagen

Deze regels zijn bewust zo gekozen en moeten bij een volgende iteratie **niet** stilzwijgend veranderen:

### Varianten
Alle varianten zijn voor 4–6 spelers. Een ronde-invoer moet optellen tot exact het aantal punten per ronde, anders wordt hij geweigerd. De grens (retour vanaf of spelen tot) en de bedragen zijn per spel instelbaar bij de setup; de grens is standaard 100, behalve bij Nederlands (15 punten).

- **Nederlands (25 punten)**: 32 kaarten (7 en hoger). 8 harten × 1, schoppenvrouw 5, klaverenboer 2, ruiten tien 10. Met retourspel.
- **Nederlands (15 punten)**: 32 kaarten, zonder de ruiten tien: 8 harten × 1, schoppenvrouw 5, klaverenboer 2. Met retourspel, standaard **vanaf 50**.
- **Amerikaans (52 kaarten)**: 26 punten per ronde: 13 harten × 1, schoppenvrouw 13. **Geen retourspel**, zie hieronder.

Spellen van vóór deze indeling behouden hun eigen regels; oude "Standaard (52 kaarten)"-spellen tellen dus door met 25 punten en retourspel.

### Pit (alles halen)
- De speler die alles haalt **kiest zelf**: het aantal punten per ronde eraf voor zichzelf (−25, −15 of −26) óf erbij voor alle anderen (+25, +15 of +26).
- Pit-waardes werken **altijd direct op de score** en worden nooit omgekeerd door het retourspel.
- Een negatieve score door een pit vóór het retourspel is **geen** winst.

### Retourspel (Nederlands)
- Zodra **één** speler bij de grens is geweest (100, of 50 bij 15 punten), gaat **iedereen** retour: vanaf de volgende ronde telt elk gehaald punt voor alle spelers omlaag. Lage spelers hebben hier dus veel voordeel van.
- De speler die de 100 passeert houdt de overschrijding (90 + 17 → 107). De ronde waarin dat gebeurt telt zelf nog gewoon omhoog.
- **Winnen**: de eerste speler die tijdens het retourspel **onder de 0** komt (−1 of lager; precies 0 is nog geen winst).
- Een speler die al negatief staat (door een pit) op het moment dat het retourspel begint, wint **direct**.

### Einde (Amerikaans)
- Zodra een speler **op of over de 100** staat, stopt het spel en wint de **laagste** speler. Dat geldt ook als de grens door een pit wordt bereikt.
- Negatief staan door een pit is geen winst: het spel loopt door tot iemand de 100 haalt.
- Staan meerdere spelers gelijk op de laagste score, dan is het **gelijkspel**, zonder afrekening.

### Gelijk uitmelden (Nederlands)
- Komen er in dezelfde ronde **meerdere spelers onder de 0**, dan vraagt de app wie zich als eerste heeft uitgemeld. Die speler wint en krijgt de betaling — óók als een ander lager staat. "Laatste ronde ongedaan maken" wist deze keuze weer.

### Afrekening
- **Optioneel**: om geld spelen zet je per spel aan met de schuifknop "Spelen om geld" bij de setup (standaard uit). Daarna verschijnen de velden voor cent per punt en cent per spel. Staat hij uit, dan toont de app geen afrekening. Spellen van vóór deze optie houden hun afrekening.
- **Winner takes all**: iedere verliezer betaalt de winnaar **€0,50 (spel) + €0,05 per punt** van de eigen eindscore (negatieve score = alleen de €0,50).
- Onder de afrekening staat de opmerking dat dit **exclusief verrekening van eventuele pit-potjes** is; de app houdt pit-potjes zelf niet bij.

## Spelregels klaverjassen

Bij de setup kies je **Klaverjassen**: 2 teams ("Wij"/"Zij" standaard, namen aanpasbaar), de telling (standaard **Concours**) en wie er als eerste deelt. Geen uitbetaalschema — de afrekening blijft bij klaverjassen verborgen.

### Drie tellingen
- **Volledig tot 1600**: ruwe scores, 162 kaartpunten + roem per ronde. Eerste team op 1600 of hoger wint.
- **Afgerond tot 160**: je telt de kaarten gewoon tot 162, maar de score wordt afgerond op tientallen: 82 punten → 8, 97 → 10. **De eerste afronding krijgt voorrang**: het team waarvan je de punten intypt wordt afgerond, het andere team krijgt 16 min dat — een ronde telt dus altijd op tot 16 (97–65 met 97 getypt → 10–6; met 65 getypt → 9–7). De "rest"-knop telt niet als invullen; zonder invoer (bijv. pit) geldt de troefmaker als geteld. Roem gaat er los overheen (20 → 2). Eerste team op 160 wint.
- **Concours (16 rondes)**: er worden altijd **16 rondes** gespeeld (iedereen deelt 4×), dus 2592 kaartpunten in totaal. Ruwe scores, zonder afronding. **Punten, roem en pit worden per team los bijgehouden** (pit = +100 per pit) en zijn per ronde te zien op het scoreblad. Na de laatste ronde wint het team met het hoogste totaal (punten + roem + pit); er is geen eerdere winnaar. Exact gelijk is **gelijkspel**.
- Invoer is bij alle tellingen op de ruwe 162-schaal; de app rekent zelf om.
- Komen beide teams in dezelfde ronde over de grens (volledig en afgerond), dan wint de hoogste; bij exact gelijke stand wordt doorgespeeld.

### Delen en nat gaan
- De app houdt bij **wie er deelt** (wisselt elke ronde); bij invoer kies je welk team troef maakte (standaard het niet-delende team).
- **Nat**: het troefmakende team heeft inclusief roem **niet méér** punten dan de tegenstander (81–81 is dus ook nat). Dan gaan **alle punten plus alle roem** (en een eventuele pit-bonus) naar de tegenstander. Dit geldt ook bij concours: daar landen ze in de punten-, roem- en pitkolom van de tegenstander.

### Roem
- Roem kan **tijdens de ronde** los worden bijgehouden (paneel met +20/+50/+100 per team op het spelscherm) en wordt bij het opslaan van de ronde verrekend; het vooringevulde bedrag is in het invoerscherm nog aan te passen.

### Pit
- Een team dat alle slagen haalt krijgt alle punten **+100** (volledige telling en concours) oftewel **+10** (afgeronde telling), bovenop de roem.

## Bediening / UI-keuzes

- UI-taal is **Nederlands**; alle teksten staan in `src/ui/strings.ts`.
- **Uitleg van de spelregels** staat in een popup (`RulesDialog`), te openen bij de setup en op het spelscherm. Hij toont de regels van het gekozen spel en de gekozen telling. Verandert een spelregel, werk dan ook deze teksten bij.
- Spelscherm is een kolom met vaste hoogte: de **"Ronde invoeren"-knop blijft altijd in beeld**, alleen de scoretabel scrollt.
- Highlights op de standen: **groen + "laagste"** en **oranje + "hoogste"** (allen bij gelijke stand; niets zolang iedereen gelijk staat). De winnaar krijgt amber + 🏆.
- Banner "↓ Retourspel — punten tellen af" zodra het retourspel actief is.
- Punteninvoer: veld op 0 **leegt zichzelf bij focus**; een andere waarde wordt geselecteerd om direct te overschrijven; leeg veld telt als 0 en springt bij verlaten terug naar 0. Alleen cijfers, afgekapt op het rondetotaal.
- **Dark mode** volgt de systeeminstelling; het donkerrood (`red-700`) wordt in dark mode een lichter rood (`red-400` met donkere tekst) op `stone-950/800`-vlakken.

## Techniek

- **Vite + React + TypeScript + Tailwind CSS 4 + vite-plugin-pwa** (installeerbaar, offline). Geen backend, geen router-library.
- Opslag: `localStorage` onder de sleutel `scorekeeper.games.v1`; meerdere spellen naast elkaar (hervatten, historie, verwijderen).
- **Rondes zijn de bron van waarheid**: scores worden altijd herberekend door alle rondes opnieuw af te spelen (`computeState`; klaverjassen via `src/engine/klaverjas.ts`). Daardoor is undo triviaal — maar een regelwijziging herinterpreteert ook oude opgeslagen spellen.
- Structuur:
  - `src/engine/` — pure, volledig geteste spellogica (types, rules, scoring, validation, payment). Geen React.
  - `src/state/` — reducer + localStorage-persistentie (`gameStore.tsx`, `storage.ts`).
  - `src/pages/` + `src/components/` — Home, Setup, GameScreen, RoundEntry.
- Tests: **Vitest** (`npm test`) dekken de volledige regelset, inclusief randgevallen (precies 0, pit vóór retour, tie, overschrijding).

## Ontwikkelen & deployen

```bash
npm install
npm run dev     # dev-server op :5173
npm test        # engine- en store-tests
npm run build   # productie-build incl. service worker
```

`npm test` en `npm run build` gelden ook voor de native apps; zie "Native apps" hieronder voor de rest.

Deploy: het GitHub-repo is aan Vercel gekoppeld — **elke commit op `main` deployt automatisch naar productie**. Push dus alleen naar `main` wat live mag.

## Native apps (App Store en Play Store)

De iOS- en Android-app zijn een [Capacitor](https://capacitorjs.com)-schil om dezelfde web-app. De webbestanden zitten in de app zelf, dus ze werken volledig offline en praten met geen enkele server. App-ID: `nl.btnt.scorekeeper` (na publicatie niet meer te wijzigen). iOS is alleen voor iPhone, beide apps alleen in portret.

```bash
npm run build:native   # web-build zonder service worker + cap sync naar ios/ en android/
npx cap open ios       # openen in Xcode
npx cap open android   # openen in Android Studio
```

Draai `build:native` na elke webwijziging, anders bevat de app nog de oude versie. Android vereist **JDK 21**: Gradle 8.14 draait niet op de JDK 25 van Android Studio, dus zet in Android Studio de Gradle JDK op 21.

- Iconen en splash komen uit `assets/`; het ontwerp staat in `assets/icon.svg` (een waaier van drie kaarten op `#b91c1c`). De PNG's in `assets/` en `public/pwa-*.png` zijn daaruit afgeleid: bij het voorgrondicoon voor Android zonder achtergrond, bij de PWA-iconen iets kleiner vanwege de maskering. Na een wijziging: `npx @capacitor/assets generate --ios --android`, met dezelfde achtergrondkleuren als nu in de native projecten.
- Elke release: verhoog `versionCode` en `versionName` in `android/app/build.gradle` en `Version` en `Build` in Xcode.
- Updates lopen via store-review, niet via Vercel. De web-app blijft los daarvan bestaan.
- Spellen staan per installatie in de eigen opslag: spellen uit de PWA gaan niet mee naar de app.

### Publiceren

1. **Accounts**: Apple Developer Program en Google Play Console. Controleer de actuele kosten en voorwaarden. Nieuwe persoonlijke Google-accounts moesten eerder eerst een gesloten test met testers draaien voordat ze naar productie mochten.
2. **Privacybeleid**: beide stores vragen een openbare URL. Die is `https://scorekeeper-gules.vercel.app/privacy.html` (bron: `public/privacy.html`, ook gelinkt op het startscherm). Bij een eigen domein ook de link in `src/pages/Home.tsx` aanpassen. Bij de privacyvragen in de stores kun je opgeven dat de app geen gegevens verzamelt. Apple vraagt ook een support-URL: `https://scorekeeper-gules.vercel.app/support.html` (bron: `public/support.html`).
3. **iOS**: kies in Xcode je team onder Signing & Capabilities, dan Product → Archive → Distribute App → App Store Connect. Vul in App Store Connect de vermelding en de screenshots in en dien in via TestFlight of direct.
4. **Android**: Build → Generate Signed App Bundle in Android Studio en upload de `.aab` naar de Play Console. Bewaar de keystore veilig en buiten git; laat Play App Signing aanstaan.

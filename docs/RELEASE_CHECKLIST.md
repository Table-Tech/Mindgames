# Puzzaro — release checklist (App Store + Play Store)

Stand van zaken: 8 oktober 2026, branch `redesign/arcade-ui`.

Legenda: `[x]` = gedaan / bestaat · `[ ]` = nog te doen.
🔴 = blokkeert de release · 🟠 = vereist door één store · 🟡 = sterk aanbevolen · 🟢 = kan na de launch.
👤 = hier is jouw beslissing, account of actie voor nodig.

---

## Deel 1 — Wat er al is

### Spellen
- [x] **Sudoku**: 6 moeilijkheden (Easy → Extreme), generator met unieke oplossing, notities, auto-pencil, undo, 3 hints, 3 fouten = game over, score, pauze, opslaan en hervatten
- [x] **Woordspel** (werktitel "Wordle"): 5 letters / 6 pogingen, correcte logica voor dubbele letters, toetsenbord met letterstatus, hard mode, opslaan en hervatten
- [x] **Mahjong Solitaire**: 144 stenen in 5 lagen, altijd oplosbaar, hint (3), oplosbare shuffle (2), undo, score, opslaan en hervatten
- [x] Generator-crash bij sommige Mahjong-seeds opgelost (met test over 300 seeds)

### Functies rond de spellen
- [x] Dagelijkse puzzel per spel (zelfde puzzel wereldwijd, op UTC-datum)
- [x] Free play / oefenmodus per spel, met "Resume"
- [x] Statistieken: gespeeld, win-%, beste/gemiddelde tijd, huidige/beste streak, woordspel-verdeling, Sudoku per moeilijkheid
- [x] Weekoverzicht van de streak
- [x] Lokale dag-leaderboard (op het apparaat)
- [x] Resultaatscherm met confetti en delen (woordspel als gekleurd raster)
- [x] Onboarding per spel (eenmalig)
- [x] Dagelijkse herinnering (lokale notificatie, instelbaar tijdstip)
- [x] Geluidseffecten (zelf gesynthetiseerd, `assets/sounds/*.wav`) en haptics, allebei aan/uit
- [x] Thema: licht / donker / automatisch
- [x] Instellingen: naam, thema, geluid, haptics, Sudoku-opties, hard mode, herinnering, sync, data wissen
- [x] Sudoku-opties "Auto-clear notes" en "Highlight mistakes" werken
- [x] "Clear all data" wist ook de cloud: save, eigen dag-scores en het anonieme account

### Ontwerp
- [x] "Arcade sticker"-stijl op alle schermen (Fredoka + Nunito, eigen kleur per spel), ook in donkere modus
- [x] Eigen tabbalk (Play / Stats / Settings) en headers
- [x] App-icoon, Android adaptive icon, splash (licht + donker) en Play-icoon 512 px — gegenereerd met `node scripts/generate-assets.mjs`, vervangbaar door definitieve artwork
- [x] Woordspel past op kleine schermen (tegels en toetsen schalen mee)
- [x] Mahjong-tegels worden als tekst weergegeven in plaats van als gekleurde emoji (`U+FE0E`)
- [x] Toegankelijkheidslabels op knoppen en cellen
- [x] Vangnet voor crashes: vriendelijk foutscherm met "Try again" in plaats van een wit scherm

### Techniek
- [x] Expo SDK 54 / React Native 0.81 / TypeScript
- [x] SOLID-opzet: pure spelregels (`session.ts`), `GameRepository`, game-registry en -catalogus, cloud ontkoppeld via events
- [x] 45 unit-tests slagen; typecheck en lint zonder fouten
- [x] Firebase: anonieme login, Firestore cloud-save, security rules in `firestore.rules`
- [x] RevenueCat-integratie voor "Remove ads" (product `remove_ads`, entitlement `no_ads`), prijs uit de store, herstel van aankopen
- [x] De nep-aankoop zonder RevenueCat-sleutel werkt alleen nog in development; in release-builds zijn aankopen dan "niet beschikbaar"
- [x] **AdMob** (`react-native-google-mobile-ads`): adaptieve banner, interstitial na elke 3 puzzels (vooraf geladen, resultaat verschijnt na de ad), geen ads voor betalende gebruikers
- [x] Toestemming via Google UMP (AVG), daarna de iOS App Tracking Transparency-vraag; "Privacy choices" in Settings voor EER/VK-gebruikers
- [x] In development altijd Google's test-ads; een release-build zonder ingestelde ad-unit-ID's toont gewoon geen ads
- [x] Ads (en Firebase) worden in Expo Go overgeslagen, dus testen via QR blijft werken
- [x] iPad: inhoud gecentreerd met een maximale breedte; `UIRequiresFullScreen` gezet (vereist voor een iPad-app die alleen staand werkt)
- [x] `app.json`: versie 1.0.0, iconen, splash, `ITSAppUsesNonExemptEncryption: false`, ongeldige iOS-sleutel weg
- [x] Android-permissies opgeschoond: `RECORD_AUDIO`, `SCHEDULE_EXACT_ALARM` en `USE_EXACT_ALARM` geblokkeerd, microfoon uit in `expo-audio`
- [x] Naam van het woordspel staat op één plek (`src/games/wordle/name.ts`)
- [x] EAS-project gekoppeld (`@tabletech/puzzaro`), build-profielen development / preview / production
- [x] Bundle-id / package: `com.puzzaro.tabletech`
- [x] README bijgewerkt

### Documenten (concept)
- [x] Privacybeleid: `docs/privacy-policy.md`
- [x] Store-teksten (naam, subtitel, keywords, beschrijvingen, screenshotlijst): `docs/store-listing.md`

---

## Deel 2 — Wat nog moet

### A. Blokkers voor beide stores 🔴

**Beslissingen 👤**
- [x] Woordspel heet **"Word Guess"** (niet "Wordle", handelsmerk van The New York Times); aanpassen kan in `src/games/wordle/name.ts`
- [ ] 🔴👤 Checken of de naam "Puzzaro" vrij is in beide stores (en als merk)
- [x] **v1 (Play Store) komt zonder advertenties en aankopen**: `ADS_ENABLED = false`, en de AdMob-SDK zit niet in de build (`expo.autolinking.exclude`, plugin-config bewaard in `docs/admob-plugin.json`). AdMob is wel volledig ingebouwd voor een latere update (sectie D).
- [x] **iPad wordt ondersteund**

**Privacy en juridisch 👤**
- [ ] 🔴👤 Privacybeleid afmaken en online zetten (concept klopt met v1: geen ads/aankopen; nog in te vullen: naam, adres/land, Firestore-regio, e-mail, website)
- [ ] 🔴👤 Support-URL of -e-mailadres (Apple verplicht een support-URL)
- [ ] 🔴👤 Nieuwe Firestore-rules deployen (eigenaars mogen hun eigen scores nu verwijderen; nodig voor "Clear all data"): `firebase deploy --only firestore:rules`

**Aankopen ("Remove ads") 👤** — pas nodig samen met ads, niet voor v1
- [ ] 🔴👤 Product `remove_ads` (niet-verbruikbaar) in App Store Connect én Play Console
- [ ] 🔴👤 In RevenueCat: entitlement `no_ads`, een "current" offering met dat product, beide apps gekoppeld
- [ ] 🔴👤 RevenueCat-sleutels als EAS-environment-variables voor de production-build
- [ ] 🔴👤 Paid Apps Agreement (Apple) en betaalprofiel (Google), met bank- en belastinggegevens
- [ ] 🔴👤 Testen in de sandbox: kopen, annuleren, herstellen, opnieuw installeren

**Firebase productie 👤**
- [ ] 🔴👤 Productieproject controleren: anonieme login aan, rules gedeployd
- [x] `.easignore` zorgt dat EAS-cloud-builds `google-services.json` en `GoogleService-Info.plist` meekrijgen (ze blijven buiten git)

**Build en submit 👤**
- [ ] 🔴👤 Production-build per platform: `eas build --profile production --platform ios|android`
- [ ] 🔴👤 `eas.json` → `submit.production` invullen: iOS `ascAppId` en `appleTeamId`; Android `serviceAccountKeyPath` en `track`

**Testen op echte toestellen 👤**
- [ ] 🔴👤 Alle drie de spellen volledig uitspelen (winnen én verliezen), op iOS en Android
- [ ] 🔴👤 Kleine schermen (iPhone SE / kleine Android) en donkere modus nalopen
- [ ] 🔴👤 Verse installatie, afsluiten en hervatten, offline gebruik
- [ ] 🔴👤 Notificatie komt binnen op het ingestelde tijdstip (incl. toestemmingsvraag Android 13+)
- [ ] 🔴👤 Mahjong-tegels op een paar Android-toestellen: tekst in plaats van emoji?
- [ ] 🔴👤 Geluiden: klinken ze goed, en niet te hard? (Vervangen kan met dezelfde bestandsnamen.)
- [ ] 🔴👤 "Clear all data": verdwijnt het `/users/{uid}`-document in Firestore echt?
- [ ] 🟡👤 Definitief icoon: het gegenereerde icoon goedkeuren of laten vervangen door een ontwerper

### B. Alleen Apple App Store 🟠
- [ ] 🟠👤 Apple Developer Program (€99/jaar)
- [ ] 🟠👤 App aanmaken in App Store Connect met bundle-id `com.puzzaro.tabletech`
- [ ] 🟠👤 Screenshots: iPhone 6,9" (1320×2868) **én iPad 13" (2064×2752)**, want iPad wordt ondersteund
- [ ] 🟠👤 Layout op een echte iPad (of simulator) nalopen
- [ ] 🟠👤 App Privacy ("nutrition labels") invullen, consistent met het privacybeleid
- [ ] 🟠👤 Leeftijdsclassificatie-vragenlijst invullen
- [ ] 🟠👤 Privacy manifest controleren in de build (`PrivacyInfo.xcprivacy` voor AsyncStorage, Firebase, RevenueCat)
- [ ] 🟠👤 Listing invullen (concept in `docs/store-listing.md`)
- [ ] 🟠👤 TestFlight-ronde voor de review

### C. Alleen Google Play 🟠
- [ ] 🟠👤 Play Console-account ($25 eenmalig) en identiteitsverificatie
- [ ] 🟠👤 **Verplichte gesloten test bij een nieuw persoonlijk account: minimaal 12 testers, 14 dagen aaneengesloten.** Plan dit vroeg: het is meestal het langste traject.
- [ ] 🟠👤 Data safety-formulier invullen
- [ ] 🟠👤 Contentclassificatie (IARC) en doelgroep (13+ of 18+, om het Families-beleid te vermijden)
- [ ] 🟠👤 "Bevat advertenties" aanvinken
- [x] Feature graphic 1024×500 (`store/feature-graphic-1024x500.png`) en icoon 512 (`store/play-icon-512.png`)
- [ ] 🟠👤 Minimaal 2 telefoon-screenshots
- [ ] 🟠👤 Target SDK in de build controleren tegen de actuele Play-eis (Expo SDK 54 target API 36)

### D. Advertenties (AdMob) — voor een update na v1 🟡
- [x] `react-native-google-mobile-ads` geïnstalleerd en geconfigureerd (plugin in `app.json`)
- [x] Banner (`src/ads/AdBanner.tsx`) en interstitial (`src/ads/interstitial.ts`)
- [x] Test-ads in development
- [x] Toestemming (UMP) en iOS-trackingvraag, "Privacy choices" in Settings
- [x] Privacybeleid-concept aangevuld met AdMob
- [ ] 🔴👤 AdMob-account aanmaken, de app toevoegen voor iOS en Android, en een banner- en interstitial-ad-unit per platform aanmaken
- [ ] 🔴👤 De **echte AdMob-app-ID's** in `app.json` zetten (`androidAppId` / `iosAppId` bij de `react-native-google-mobile-ads`-plugin). Er staan nu Google's voorbeeld-ID's: daarmee verdien je niets.
- [ ] 🔴👤 De ad-unit-ID's als EAS-environment-variables: `EXPO_PUBLIC_ADMOB_BANNER_IOS`, `EXPO_PUBLIC_ADMOB_BANNER_ANDROID`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID`
- [ ] 🔴👤 In AdMob → **Privacy & messaging** een AVG-toestemmingsbericht (EER/VK) aanmaken en publiceren; zonder dat bericht toont UMP geen formulier
- [ ] 🟠👤 Optioneel in dezelfde sectie een "IDFA explainer"-bericht voor iOS
- [ ] 🟠👤 `app-ads.txt` op je ontwikkelaarswebsite (dezelfde site als in de store-listing)
- [ ] 🟠 De volledige lijst SKAdNetwork-ID's van Google toevoegen aan `skAdNetworkItems` in `app.json` (nu staat alleen Google's eigen ID erin)
- [ ] 🔴👤 Nieuwe development-build maken: AdMob is native code (`eas build --profile development` of `npx expo run:android`). In Expo Go zie je geen ads.
- [ ] 🔴👤 Testen: toestemmingsformulier (zet je toestel op een EU-locatie of gebruik UMP-debug), ATT-vraag op iOS, banner, interstitial na 3 puzzels, en geen ads meer na "Remove ads"

### E. Sterk aanbevolen voor v1 🟡
- [ ] 🟡 Woordenlijst: één lijst van ~4.200 woorden voor antwoorden én pogingen. Splitsen in een kleine lijst bekende antwoordwoorden en een grote lijst geldige pogingen (10k+). 👤 Kies een bron met een geschikte licentie.
- [ ] 🟡 Crashrapportage (Firebase Crashlytics of Sentry). Het foutscherm heeft al een `onError`-haak. Vergt een nieuwe native build.
- [ ] 🟡👤 Firebase App Check (Play Integrity / App Attest registreren in de console), zodat niet iedereen scores kan wegschrijven
- [ ] 🟡👤 Leaderboard: alleen lokaal zichtbaar; cloud-scores worden wel opgeslagen maar niet getoond. Globale ranglijst bouwen of cloud-scores uitzetten? Let op: namen van anderen tonen vraagt bij Apple om filteren/melden (richtlijn 1.2).
- [ ] 🟡👤 Daily wisselt om 00:00 UTC (in Nederland 01:00/02:00). Zo laten of naar lokale tijd?
- [ ] 🟡 Toegankelijkheid testen met VoiceOver/TalkBack en grote tekst (`allowFontScaling` staat op sommige plekken uit)
- [ ] 🟡 End-to-end-test (bijv. Maestro) voor de hoofdflows

### F. Na de launch 🟢
- [ ] 🟢 Analytics (Firebase Analytics), alleen met toestemming
- [ ] 🟢 Nederlandse vertaling (en andere talen)
- [ ] 🟢 OTA-updates via EAS Update (channels staan al in `eas.json`)
- [ ] 🟢 Store-reviewprompt na een paar gewonnen dailies (`expo-store-review`)
- [ ] 🟢 Meer spellen: dankzij de registry en catalogus is dat één entry per plek
- [ ] 🟢 Achievements / Game Center / Play Games

---

## Volgorde die ik aanraad

1. **Beslissingen** 👤: naam woordspel, wel/geen ads in v1, iPad wel/niet.
2. **Accounts** 👤: Apple Developer, Play Console. Start de Google-account-verificatie meteen.
3. **Privacybeleid + support-pagina** online 👤 (concept ligt klaar).
4. **Firebase-rules deployen en EAS-secrets** 👤.
5. **Production-builds** → Google gesloten test (12 testers / 14 dagen) starten → tegelijk TestFlight.
6. **Store-listings**, screenshots, privacyformulieren, classificaties (teksten liggen klaar).
7. **Review indienen** bij beide stores.

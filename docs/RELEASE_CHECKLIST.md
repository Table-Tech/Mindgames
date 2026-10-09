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
- [x] Advertenties achter één schakelaar `ADS_ENABLED` (`src/ads/config.ts`), staat uit: geen test-popup, geen "Ad slot"-balk, geen "Remove ads"-kaart
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
- [ ] 🔴👤 **Nieuwe naam voor het woordspel** ("Wordle" is een handelsmerk van The New York Times). Daarna één regel aanpassen in `src/games/wordle/name.ts`, en `[WORD GAME NAME]` invullen in `docs/store-listing.md`.
- [ ] 🔴👤 Checken of de naam "Puzzaro" vrij is in beide stores (en als merk)
- [ ] 🔴👤 **v1 met of zonder advertenties?** Zonder: niets meer te doen. Met: zie sectie D, en daarna `ADS_ENABLED = true`.
- [ ] 🟠👤 iPad ondersteunen in v1? Zo niet: `supportsTablet: false` in `app.json`.

**Privacy en juridisch 👤**
- [ ] 🔴👤 Privacybeleid afmaken (placeholders invullen) en online zetten op een publieke URL
- [ ] 🔴👤 Support-URL of -e-mailadres (Apple verplicht een support-URL)
- [ ] 🔴👤 Nieuwe Firestore-rules deployen (eigenaars mogen hun eigen scores nu verwijderen; nodig voor "Clear all data"): `firebase deploy --only firestore:rules`

**Aankopen 👤** (alleen nodig als je met advertenties uitbrengt; zonder ads is er niets te koop)
- [ ] 🔴👤 Product `remove_ads` (niet-verbruikbaar) in App Store Connect én Play Console
- [ ] 🔴👤 In RevenueCat: entitlement `no_ads`, een "current" offering met dat product, beide apps gekoppeld
- [ ] 🔴👤 RevenueCat-sleutels als EAS-environment-variables voor de production-build
- [ ] 🔴👤 Paid Apps Agreement (Apple) en betaalprofiel (Google), met bank- en belastinggegevens
- [ ] 🔴👤 Testen in de sandbox: kopen, annuleren, herstellen, opnieuw installeren

**Firebase productie 👤**
- [ ] 🔴👤 Productieproject controleren: anonieme login aan, rules gedeployd
- [ ] 🔴👤 `google-services.json` en `GoogleService-Info.plist` als EAS-secret-bestanden voor cloud-builds

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
- [ ] 🟠👤 Screenshots: iPhone 6,9" (1320×2868), en iPad 13" als tablets aan blijven
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
- [ ] 🟠👤 "Bevat advertenties" aanvinken als je met ads uitbrengt
- [ ] 🟠👤 Feature graphic 1024×500 (heeft het definitieve naam/logo-ontwerp nodig) en minimaal 2 telefoon-screenshots; het 512-icoon staat klaar in `store/play-icon-512.png`
- [ ] 🟠👤 Target SDK in de build controleren tegen de actuele Play-eis (Expo SDK 54 target API 36)

### D. Als je met advertenties uitbrengt 🔴/🟠
- [ ] 🔴 `react-native-google-mobile-ads` installeren en configureren (AdMob app-ID's in `app.json`, nieuwe dev-build nodig) — kan ik doen zodra je kiest voor ads en de AdMob-ID's hebt
- [ ] 🔴 Echte banner in `src/ads/AdBanner.tsx` en interstitial in `showInterstitial()` (`src/ads/interstitial.ts`)
- [ ] 🔴 Test-ad-unit-ID's in development
- [ ] 🔴 Toestemmingspopup (Google UMP) voor de EER/VK
- [ ] 🟠 iOS: App Tracking Transparency-prompt + `NSUserTrackingUsageDescription`, en SKAdNetwork-ID's
- [ ] 🟠👤 `app-ads.txt` op je ontwikkelaarswebsite
- [ ] 🟠👤 Privacybeleid en -formulieren aanvullen met de advertentie-ID (de tekst staat al klaar in het concept)
- [ ] 🔴 `ADS_ENABLED = true` in `src/ads/config.ts`

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

# Puzzaro — release checklist

Stand van zaken: **13 oktober 2026**.

Legenda: `[x]` = gedaan · `[ ]` = nog te doen · 👤 = jouw actie/account/beslissing nodig
🔴 = blokkeert · 🟠 = vereist door één store · 🟡 = sterk aanbevolen · 🟢 = na de launch

## Waar staan we nu?

| | Status |
|---|---|
| **v1.0.0 (Android, zonder ads)** | Productie (177 landen) goedgekeurd en op 13 okt **gepubliceerd**: https://play.google.com/store/apps/details?id=com.puzzaro.tabletech |
| **v1.1.0 (ads + "Remove ads")** | Code klaar op branch **`feature/ads`** (ook op GitHub). Preview-APK met echte AdMob-blokken **gebouwd** (EAS build `09b187f3`), nog **te testen**. RevenueCat-koppeling wacht op Google. |
| **iOS / App Store** | Nog niet gestart (code is iPad/iOS-klaar, accounts en build nog niet). |
| **Branches** | `main` = v1 (default branch op GitHub) · `feature/ads` = v1.1.0 |

---

## Deel 1 — Wat er al is

### Spellen en functies
- [x] **Sudoku**: 6 moeilijkheden, unieke oplossing, notities, auto-notes, undo, 3 hints, 3 hartjes, score, pauze, opslaan/hervatten
- [x] **Word Guess** (niet "Wordle", handelsmerk NYT): 5 letters / 6 pogingen, hard mode, opslaan/hervatten
- [x] **Mahjong Solitaire**: 144 stenen, altijd oplosbaar, hints, shuffles, undo, opslaan/hervatten (generator-crash bij sommige seeds opgelost)
- [x] Dagelijkse puzzels (wereldwijd gelijk, UTC), free play met "Resume", statistieken, streaks met weekoverzicht, lokale leaderboard
- [x] Onboarding, dagelijkse herinnering, geluiden + haptics (aan/uit), thema licht/donker/automatisch
- [x] Sudoku-opties "Auto-clear notes" en "Highlight mistakes" werken
- [x] "Clear all data" wist ook de cloud (save, eigen scores, anoniem account)
- [x] **Delen**: opgemaakte tekst per spel (streak, hartjes, raster) + **deelafbeelding 1080×1350** in de app-stijl (iOS: beeld + tekst, Android: beeld)

### Ontwerp
- [x] "Arcade sticker"-stijl op alle schermen, ook donker; eigen tabbalk en headers
- [x] App-icoon, adaptive icon, splash, Play-icoon 512 en feature graphic 1024×500 (`scripts/generate-assets.mjs`)
- [x] 6 store-screenshots 1080×1920 (`store/screenshots/`, `scripts/frame-screenshots.mjs`)
- [x] Word Guess past op kleine schermen; iPad: inhoud gecentreerd (max. 600 px), `UIRequiresFullScreen`
- [x] Bug opgelost: Sudoku-illustratie op de Home-kaart liep uit de kaart
- [x] Toegankelijkheidslabels; foutscherm i.p.v. wit scherm bij crashes

### Techniek
- [x] Expo SDK 54 / React Native 0.81 / TypeScript; SOLID-opzet (pure spelregels, `GameRepository`, registry/catalogus, cloud via events)
- [x] **47 unit-tests** slagen; typecheck en lint zonder fouten
- [x] Firebase (anonieme login, Firestore cloud-save, rules), werkt niet in Expo Go en wordt daar overgeslagen
- [x] RevenueCat `react-native-purchases` **10.12.2** (Android-SDK 10.26.0; Play-melding over 10.6.0 opgelost)
- [x] Nep-aankoop zonder sleutel alleen in development; release zonder sleutel = "niet beschikbaar"
- [x] Permissies opgeschoond (`RECORD_AUDIO`, exact alarm geblokkeerd; v1 ook `AD_ID` geblokkeerd)
- [x] `.easignore` zodat EAS de Firebase-configbestanden meekrijgt
- [x] EAS-project `@tabletech/puzzaro`, keystore bij EAS, build-profielen development / preview / production

### Documenten en pagina's
- [x] Privacybeleid en supportpagina **online**: https://table-tech.github.io/Mindgames/privacy-policy en …/support (TechTable, KvK 98067826, info@techtable.nl, data in de EU)
- [x] Store-teksten: `docs/store-listing.md`

---

## Deel 2 — Wat nog moet

### A. v1.0.0 live in de Play Store (bezig)
- [x] Play Console-bedrijfsaccount (geen verplichte gesloten test van 14 dagen)
- [x] App aangemaakt: "Puzzaro: Daily Puzzles", game, gratis
- [x] Data safety ingevuld (Naam = optioneel; Andere acties + Apparaat-ID's = vereist; alleen app-functionaliteit; niet gedeeld)
- [x] Advertentie-ID-verklaring: **Nee** (v1)
- [x] Store-vermelding: teksten, icoon, feature graphic, screenshots
- [x] Productie-build versiecode 4 geüpload naar **Interne tests**
- [x] Interne test v1.0.0 (versiecode 4) **goedgekeurd** door Google
- [x] Productie-release 4 (1.0.0), 177 landen + rest van de wereld, goedgekeurd
- [x] Gepubliceerd via "Beheerd publiceren" (13 okt 2026)
- [ ] 👤 Controleren dat de app in de Play Store staat en installeren als echte gebruiker
- [ ] 🟡👤 Optioneel: nieuwe Home-screenshot zonder de (inmiddels opgeloste) Sudoku-kaartbug

### B. Update 1.1.0: advertenties + "Remove ads" (`feature/ads`)
**Klaar**
- [x] Ads aan, AdMob-SDK in de build, `AD_ID` toegestaan, versie 1.1.0
- [x] Banner, interstitial (elke 3 puzzels), toestemming (UMP), iOS-trackingvraag, "Privacy choices" in Settings
- [x] AdMob-app-ID via `app.config.js` uit EAS; productie-build zonder ID stopt bewust met een fout
- [x] `react-native-google-mobile-ads` vast op **16.3.4** (Ads-SDK 25.0.0). Nieuwere versies bouwen niet op Expo 54 / Kotlin 2.1 — pas na een Expo-upgrade ophogen.
- [x] Privacybeleid met AdMob + RevenueCat klaar op de branch (datum invullen bij release)
- [x] AdMob-account, Android-app, ad units **Banner** en **Interstitial** aangemaakt
- [x] EAS-variabelen (production + preview): `ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_BANNER_ANDROID`, `EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID`, `EXPO_PUBLIC_REVENUECAT_ANDROID` (ook development)
- [x] Play Console: in-app-product **`remove_ads`** actief
- [x] RevenueCat: project + Play Store-app + service account (credentials geüpload)
- [x] Preview-APK met echte ad units gebouwd

**Nog te doen**
- [ ] 👤 AdMob → Instellingen → **Testapparaten**: je telefoon toevoegen (vóór het testen!)
- [ ] 👤 AdMob → Privacy & messaging: **AVG-bericht publiceren** (anders geen toestemmingsformulier)
- [ ] 👤 Preview-APK testen: toestemming, banner, interstitial na 3 puzzels, "Privacy choices"
- [ ] 👤 Play Console → Gebruikers en rechten: service account terugzetten van "Beheren (alle rechten)" naar alleen: app-info bekijken, financiële gegevens bekijken, bestellingen beheren
- [ ] 👤 RevenueCat-credentials **groen** (Google zet rechten pas na 24–36 uur door; tip: beschrijving van `remove_ads` licht aanpassen en opnieuw "Check credentials")
- [ ] 🟡👤 Google Cloud: rol **Pub/Sub Admin** (niet "Lite") + **Cloud Pub/Sub API** aan, daarna in RevenueCat "Connect to Google" (realtime-meldingen; optioneel)
- [ ] 👤 RevenueCat: product `remove_ads`, entitlement **`no_ads`**, offering **`default`** (Lifetime-package) als **Current**
- [ ] 👤 Play Console → Instellingen → **Licentietests**: eigen Gmail toevoegen
- [ ] 👤 Play Console: **betalingsprofiel** TechTable (bank, btw)
- [ ] 🟡👤 `app-ads.txt` op https://techtable.nl/app-ads.txt (regel uit AdMob); Play-website = techtable.nl
- [x] Productie-build 1.1.0 gestart (vanaf `feature/ads`), voor de interne test
- [ ] Na de test: `feature/ads` → `main` mergen, privacybeleid-datum invullen en pushen
- [ ] 👤 1.1.0 via interne test: **aankoop "Remove ads"** en "Restore purchases" testen
- [ ] 👤 Play Console bijwerken: Advertenties = **ja**; advertentie-ID = **ja (advertenties)**; Data safety: Apparaat-ID's ook voor advertenties + **gedeeld met AdMob**, plus **Aankoopgeschiedenis**; contentclassificatie opnieuw
- [ ] 👤 AdMob: app koppelen aan de Play-vermelding zodra die live is
- [ ] 👤 1.1.0 interne test → productie

### C. Apple App Store (later) 🟠
- [ ] 👤 Apple Developer Program (€99/jaar), app in App Store Connect (`com.puzzaro.tabletech`)
- [ ] 👤 AdMob iOS-app + ad units → `ADMOB_IOS_APP_ID`, `EXPO_PUBLIC_ADMOB_*_IOS`; RevenueCat iOS-app → `EXPO_PUBLIC_REVENUECAT_IOS`
- [ ] Volledige SKAdNetwork-lijst van Google in `app.config.js`
- [ ] 👤 Screenshots iPhone 6,9" én iPad 13"; layout op iPad nalopen
- [ ] 👤 App Privacy-labels, leeftijdsclassificatie, privacy manifest in de build controleren, TestFlight

### D. Sterk aanbevolen 🟡
- [ ] Woordenlijst splitsen: bekende antwoordwoorden + grote lijst geldige pogingen (10k+) — 👤 bron met geschikte licentie kiezen
- [ ] Crashrapportage (Crashlytics of Sentry); het foutscherm heeft al een `onError`-haak
- [ ] 👤 Firebase App Check (Play Integrity)
- [ ] 👤 Globale leaderboard tonen of cloud-scores uitzetten (bij namen van anderen: filteren/melden, Apple 1.2)
- [ ] 👤 Daily om 00:00 UTC (NL 01:00/02:00) laten zo of naar lokale tijd?
- [ ] `expo doctor`: patch-updates `expo` 54.0.34 → 54.0.37, `expo-font`, `jest-expo`
- [ ] Toegankelijkheid testen (TalkBack/VoiceOver, grote tekst); end-to-end-tests (bijv. Maestro)

### E. Na de launch 🟢
- [x] `SHARE_URL` = Play Store-link (in 1.1.0); deelkaart toont "Get it free on Google Play"
- [ ] Analytics (met toestemming), Nederlandse vertaling, EAS Update (OTA), reviewprompt, meer spellen, achievements

---

## Volgorde vanaf nu
1. 👤 Interne test v1 → testen → **productie** (A).
2. 👤 Tijdens het wachten: AdMob-testapparaat + AVG-bericht, preview-APK testen, RevenueCat afmaken (B).
3. Zodra v1 live is én RevenueCat groen: merge, build 1.1.0, aankoop testen, Play Console bijwerken, uitbrengen.

# Grade-Check Vault

**Pokémon-Karten scannen · bewerten · handeln · Grading-ROI berechnen**

Eine eigenständige App für Kartensammler. Läuft als Web-App (PWA, installierbar auf dem Homescreen) und lässt sich mit Capacitor zu einer nativen Android-/iOS-App bauen.

---

## Was die App kann

| Bereich | Funktion |
|---|---|
| **Sammlung** | Karten mit Foto, Zustand (PSA-Skala 1–10), Kaufpreis und Wert verwalten; sortieren, filtern, Gewinn/Verlust-Bilanz |
| **Scannen** | Kartensuche in der TCGdex-Datenbank (deutsche Namen) oder eigenes Foto aufnehmen |
| **Grading-ROI** | Berechnet, ob sich PSA-Einschicken lohnt – aus Zustandseinschätzung, Rohwert und PSA-Werten, inkl. aller Kosten |
| **Handel** | Biete-/Such-/Tauschangebote anlegen |
| **Arena** | Kartenbasiertes Kampfspiel: deine Sammlung gegen das „Gefahren-Deck" |
| **Export/Import** | Vollständiges JSON-Backup (mit Fotos) und CSV-Tabelle für Excel/Cardmarket |

Alle Daten bleiben **lokal auf deinem Gerät** (localStorage bzw. nativer Speicher). Kein Server, kein Konto, keine Cloud.

---

## Projektstruktur

```
grade-check/
├── index.html              # Oberfläche + Styling (Vite-Einstiegspunkt im Wurzelordner)
├── src/
│   └── main.js             # Komplette App-Logik + Capacitor-Integration
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js               # Service Worker (Offline-Betrieb)
│   └── icons/              # App-Icons (SVG + PNG, inkl. maskable)
├── .github/workflows/
│   └── deploy.yml          # Auto-Deployment auf GitHub Pages
├── capacitor.config.json
├── package.json
├── vite.config.js
└── README.md
```

> **Hinweis zum Vite-Einstiegspunkt:** `index.html` liegt bewusst im **Wurzelordner**, nicht in `src/`. Das ist die Vite-Konvention – `main.js` wird daraus per `<script type="module" src="/src/main.js">` geladen.

---

## Veröffentlichen vom Handy (ohne PC)

Du arbeitest vom Handy – hier zwei Wege, die ohne Rechner funktionieren:

### Weg A – GitHub Pages (empfohlen, automatisch)

1. Lade die Projektdateien in ein neues GitHub-Repository hoch (über die GitHub-Website oder die GitHub-Mobile-App).
2. Gehe im Repo zu **Settings → Pages** und stelle bei „Build and deployment" die Quelle auf **GitHub Actions**.
3. Fertig. Der mitgelieferte Workflow (`.github/workflows/deploy.yml`) baut die App bei jedem Upload automatisch und veröffentlicht sie. Die URL erscheint nach dem ersten Lauf unter **Settings → Pages**.

Jede spätere Änderung über die GitHub-Weboberfläche löst den Build neu aus – komplett vom Handy steuerbar.

### Weg B – Neocities (am einfachsten, ohne Build-Schritt)

Neocities serviert nur statische Dateien, kann aber kein `npm run build`. Dafür gibt es zwei Möglichkeiten:

- **Wenn du einen Build erzeugen kannst** (z. B. einmalig über GitHub Actions, siehe Weg A): Lade den **Inhalt des `dist/`-Ordners** zu Neocities hoch.
- **Ohne Build:** Die App nutzt `import`-Anweisungen für Capacitor, die ein Browser nicht direkt versteht. Für einen build-freien Betrieb müsste man diese entfernen – sag Bescheid, dann erstelle ich dir eine reine Browser-Version als einzelne Datei.

---

## Lokal entwickeln (falls du doch an einen PC kommst)

```bash
npm install
npm run dev        # startet auf http://localhost:5173
npm run build      # erzeugt den dist/-Ordner
```

---

## Als native Android-/iOS-App bauen (Capacitor)

> **Wichtig zur Capacitor-Version:** Die in `package.json` eingetragenen Versionen (`^6.x`) sind ein bewährter, stabiler Stand. Bevor du nativ baust, prüfe kurz auf eine neuere Version:
> ```bash
> npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/camera@latest @capacitor/filesystem@latest
> ```
> So bekommst du automatisch den aktuellen Stand, statt dich auf eine hier fest eingetragene Nummer zu verlassen.

```bash
npm install
npm run build
npx cap add android          # bzw. ios
npx cap sync
npx cap open android         # öffnet Android Studio
```

Der native Build (APK/IPA) braucht Android Studio bzw. Xcode und damit einen Rechner – das geht nicht rein vom Handy. Die **PWA über GitHub Pages funktioniert dagegen vollständig vom Handy** und lässt sich über „Zum Startbildschirm hinzufügen" wie eine App installieren.

---

## Kamera & Foto

- **In der nativen App:** echter Kamerazugriff über das Capacitor-Camera-Plugin.
- **Im Browser/PWA:** Foto über die Dateiauswahl des Geräts (auf dem Handy öffnet das direkt die Kamera). Fotos werden vor dem Speichern auf max. 640 px verkleinert, damit der lokale Speicher nicht zuläuft.

---

## Wichtiger Hinweis zur Grading-ROI-Berechnung

Die ROI-Funktion schätzt den erwarteten Wert nach dem Einschicken. Die hinterlegten **Wahrscheinlichkeiten je Zustand sind konservative Richtwerte, keine Garantie** – die echte PSA-Note hängt von Zentrierung, Ecken, Kanten und Oberfläche ab und kann abweichen.

**Alle Kosten (PSA-Gebühr, Versand, Zoll/EUSt, Wechselkurs) sind in der App frei einstellbar.** Trage vor einer echten Entscheidung die aktuellen PSA-Preise und den tagesaktuellen Wechselkurs ein, da sich diese ändern. Die Zustandsangaben in Verkaufstexten sind als **ehrliche Selbsteinschätzung** gekennzeichnet, ausdrücklich nicht als offizielles Grading.

---

## Technik

- Reines HTML/CSS/JavaScript, kein Framework
- Vite als Build-Tool, Capacitor für die native Hülle
- Kartendaten: [TCGdex](https://www.tcgdex.net) (öffentliche API)
- Keine Tracker, keine Werbung, keine externen Laufzeit-Abhängigkeiten außer den Capacitor-Plugins

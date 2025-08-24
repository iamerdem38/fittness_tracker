# FitTrack All-in-One: Eine vollständige End-to-End Anleitung

Willkommen bei FitTrack! Dies ist eine umfassende Anleitung, die Sie durch den gesamten Prozess führt: von den Voraussetzungen über die Einrichtung des Backends mit Supabase, die Konfiguration des Frontends bis hin zur Veröffentlichung Ihrer fertigen Web-Anwendung auf Netlify.

## Inhaltsverzeichnis
1.  [Projektübersicht & Funktionen](#1-projektübersicht--funktionen)
2.  [Voraussetzungen](#2-voraussetzungen)
3.  [Schritt 1: Supabase einrichten (Backend & Datenbank)](#3-schritt-1-supabase-einrichten-backend--datenbank)
4.  [Schritt 2: Projekt lokal einrichten (Frontend)](#4-schritt-2-projekt-lokal-einrichten-frontend)
5.  [Schritt 3: Projekt auf GitHub hochladen](#5-schritt-3-projekt-auf-github-hochladen)
6.  [Schritt 4: Auf Netlify veröffentlichen (Hosting)](#6-schritt-4-auf-netlify-veröffentlichen-hosting)
7.  [Anleitung zur Benutzung der App](#7-anleitung-zur-benutzung-der-app)
8.  [Verständnis der Projektstruktur](#8-verständnis-der-projektstruktur)
9.  [Zukünftige Erweiterungen](#9-zukünftige-erweiterungen)

---

## 1. Projektübersicht & Funktionen

FitTrack ist eine moderne, responsive Web-Anwendung, die es Ihnen ermöglicht, alle Aspekte Ihrer Fitness- und Ernährungsreise an einem Ort zu verwalten.

**Technologie-Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, DaisyUI
- **Backend & Datenbank:** Supabase (PostgreSQL, Authentifizierung)
- **Hosting:** Netlify
- **Wichtige Bibliotheken:** Recharts (Diagramme), react-router-dom (Routing), html5-qrcode (Barcode-Scanner)

**Hauptfunktionen:**
- ✅ **Sichere Benutzer-Authentifizierung:** Registrierung und Login über Supabase.
- ✅ **Fitness-Tracking:** Erstellen Sie eine persönliche Übungsbibliothek und protokollieren Sie Ihre Trainingseinheiten mit Sätzen, Gewichten und Wiederholungen.
- ✅ **Ernährungs-Tracking:** Führen Sie ein Ernährungstagebuch. Fügen Sie Lebensmittel manuell oder **per Barcode-Scan** mit der Kamera hinzu.
- ✅ **Statistik & Profil:** Verfolgen Sie Ihr Körpergewicht und setzen Sie sich tägliche Kalorienziele.
- ✅ **Daten-Visualisierung:** Aussagekräftige Diagramme (Heatmap für Workouts, Balkendiagramm für Kalorien, Liniendiagramm für Gewicht) zeigen Ihren Fortschritt.
- ✅ **Datensicherheit:** Dank Supabase's Row Level Security kann jeder Benutzer nur seine eigenen Daten sehen und bearbeiten.

## 2. Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass die folgende Software auf Ihrem Computer installiert ist:
- **Node.js & npm:** Node.js ist die Laufzeitumgebung für JavaScript. npm ist der Paketmanager, der mit Node.js geliefert wird. Sie können es von [nodejs.org](https://nodejs.org/) herunterladen.
- **Git:** Ein Versionskontrollsystem, das für das Klonen des Projekts und das Hochladen auf GitHub benötigt wird. [Hier herunterladen](https://git-scm.com/).
- **Ein Code-Editor:** Visual Studio Code wird empfohlen ([kostenloser Download](https://code.visualstudio.com/)).
- **Ein GitHub-Konto:** Notwendig für das Hosting Ihres Codes und die Bereitstellung auf Netlify. [Kostenlos erstellen](https://github.com/).

## 3. Schritt 1: Supabase einrichten (Backend & Datenbank)

Supabase ist eine Open-Source-Alternative zu Firebase. Wir nutzen es für unsere Datenbank, Benutzerauthentifizierung und API.

### 3.1. Supabase Projekt erstellen
1.  Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein kostenloses Konto.
2.  Klicken Sie im Dashboard auf **"New Project"**.
3.  Geben Sie Ihrem Projekt einen Namen (z.B. `fittrack`), erstellen Sie ein sicheres **Datenbankpasswort** (speichern Sie es an einem sicheren Ort) und wählen Sie eine Region in Ihrer Nähe.
4.  Klicken Sie auf **"Create new project"**. Die Erstellung kann einige Minuten dauern.

### 3.2. Datenbanktabellen erstellen
Unsere Anwendung benötigt eine Struktur, um Daten zu speichern. Wir erstellen diese mit SQL.
1.  Navigieren Sie in Ihrem Supabase-Projekt zum **SQL Editor** (im linken Menü das Icon mit der Aufschrift "SQL Editor").
2.  Kopieren Sie die folgenden SQL-Befehle **Block für Block** und führen Sie jeden einzeln aus, indem Sie auf den **"RUN"**-Button klicken.

**Wofür sind diese Tabellen?**
- `profiles`: Speichert benutzerspezifische Daten wie das Kalorienziel.
- `exercises`: Die persönliche Übungsbibliothek jedes Benutzers.
- `workouts`, `workout_sets`: Speichern protokollierte Trainingseinheiten.
- `food_items`, `food_log`: Die Lebensmittel-Bibliothek und das Ernährungstagebuch.
- `weight_log`: Speichert die Gewichtshistorie.

**Wichtig: Row Level Security (RLS)**
Die `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` und `CREATE POLICY` Befehle sind extrem wichtig. Sie erstellen Sicherheitsregeln, die sicherstellen, dass ein Benutzer **nur seine eigenen Daten** sehen, bearbeiten oder löschen kann. Ohne diese Regeln könnte jeder Benutzer die Daten aller anderen Benutzer einsehen.

```sql
-- TABELLE FÜR BENUTZERPROFILE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  calorie_goal INT DEFAULT 2000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS für profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile." ON profiles FOR ALL USING (auth.uid() = id);

-- TABELLE FÜR ÜBUNGEN
CREATE TABLE exercises (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT
);
-- RLS für exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own exercises." ON exercises FOR ALL USING (auth.uid() = user_id);

-- TABELLE FÜR WORKOUTS
CREATE TABLE workouts (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_date DATE NOT NULL
);
-- RLS für workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workouts." ON workouts FOR ALL USING (auth.uid() = user_id);

-- TABELLE FÜR SÄTZE
CREATE TABLE workout_sets (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  workout_id BIGINT REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id BIGINT REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL,
  weight NUMERIC,
  reps INT
);
-- RLS für workout_sets
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sets." ON workout_sets FOR ALL USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));

-- TABELLE FÜR LEBENSMITTEL
CREATE TABLE food_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  serving_size_g INT DEFAULT 100
);
-- RLS für food_items
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own food items." ON food_items FOR ALL USING (auth.uid() = user_id);

-- TABELLE FÜR GETRACKTE LEBENSMITTEL
CREATE TABLE food_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_item_id BIGINT REFERENCES food_items(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  quantity_g NUMERIC NOT NULL
);
-- RLS für food_log
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own food logs." ON food_log FOR ALL USING (auth.uid() = user_id);

-- TABELLE FÜR GEWICHTS-LOG
CREATE TABLE weight_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL
);
-- RLS für weight_log
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weight logs." ON weight_log FOR ALL USING (auth.uid() = user_id);
```

### 3.3. API-Schlüssel abrufen
Damit unsere Frontend-App mit Supabase kommunizieren kann, benötigt sie eine URL und einen API-Schlüssel.
1.  Klicken Sie im linken Menü auf das Zahnrad-Symbol für **Project Settings**.
2.  Wählen Sie **API** aus.
3.  Hier finden Sie Ihre **Project URL** und Ihren **Project API Key** (den `anon` `public` key). Der `anon`-Key ist öffentlich und sicher für die Verwendung im Frontend.
4.  Kopieren Sie diese beiden Werte. Sie werden im nächsten Schritt benötigt.

## 4. Schritt 2: Projekt lokal einrichten (Frontend)

Jetzt, da das Backend bereit ist, konfigurieren wir das Frontend auf Ihrem Computer.

### 4.1. Abhängigkeiten installieren
1.  Öffnen Sie ein Terminal (oder die Kommandozeile/PowerShell) im Hauptverzeichnis des Projekts.
2.  Führen Sie den folgenden Befehl aus, um alle notwendigen Bibliotheken (React, Vite etc.) zu installieren:
    ```bash
    npm install
    ```

### 4.2. Umgebungsvariablen erstellen
Die API-Schlüssel sollten niemals direkt im Code stehen. Wir speichern sie in einer speziellen Datei, die nicht auf GitHub hochgeladen wird.
1.  Erstellen Sie im Hauptverzeichnis des Projekts (auf der gleichen Ebene wie `package.json`) eine neue Datei mit dem Namen `.env`.
2.  Fügen Sie die Supabase URL und den Key ein, die Sie in Schritt 3.3 kopiert haben.
    **ACHTUNG: Dieses Projekt verwendet Vite. Die Variablennamen MÜSSEN mit `VITE_` beginnen!**

    ```
    VITE_SUPABASE_URL=IHRE_SUPABASE_PROJEKT_URL
    VITE_SUPABASE_ANON_KEY=IHR_SUPABASE_ANON_KEY
    ```
    Ersetzen Sie die Platzhalter `IHRE_...` mit Ihren tatsächlichen Werten.

### 4.3. Lokalen Entwicklungsserver starten
Führen Sie den folgenden Befehl aus, um die Anwendung zu starten:
```bash
npm start
```
Ihr Standard-Browser sollte sich nun öffnen und die Anwendung unter `http://localhost:5173` (oder einem ähnlichen Port) anzeigen. Sie können sich registrieren, einloggen und alle Funktionen testen.

## 5. Schritt 3: Projekt auf GitHub hochladen

Um Ihr Projekt mit Netlify zu veröffentlichen, muss der Code in einem GitHub-Repository liegen.
1.  Erstellen Sie ein neues, leeres Repository auf [github.com](https://github.com).
2.  Initialisieren Sie Git in Ihrem lokalen Projektordner, fügen Sie alle Dateien hinzu und machen Sie Ihren ersten Commit:
    ```bash
    git init
    git add .
    git commit -m "Erstes Commit: FitTrack initialisiert"
    ```
3.  Verknüpfen Sie Ihr lokales Repository mit dem auf GitHub und pushen Sie den Code:
    ```bash
    git remote add origin <IHRE_GITHUB_REPO_URL.git>
    git branch -M main
    git push -u origin main
    ```
    Ersetzen Sie `<IHRE_GITHUB_REPO_URL.git>` durch die URL Ihres GitHub-Repos.

## 6. Schritt 4: Auf Netlify veröffentlichen (Hosting)

Netlify ist eine fantastische Plattform, um Frontend-Anwendungen kostenlos und einfach zu hosten.
1.  Erstellen Sie ein kostenloses Konto auf [netlify.com](https://netlify.com) (am besten mit Ihrem GitHub-Konto verknüpfen).
2.  Klicken Sie im Dashboard auf **"Add new site"** -> **"Import an existing project"**.
3.  Wählen Sie **"Deploy with GitHub"** und autorisieren Sie Netlify.
4.  Wählen Sie das GitHub-Repository aus, das Sie in Schritt 5 erstellt haben.
5.  Konfigurieren Sie die Build-Einstellungen (Vite-Standardwerte sind meist korrekt):
    -   **Base directory:** (leer lassen)
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`
6.  **EXTREM WICHTIG: Umgebungsvariablen hinzufügen**
    -   Klicken Sie auf **"Show advanced"** und dann auf **"New variable"**.
    -   Fügen Sie die **gleichen zwei Variablen** wie in Ihrer `.env`-Datei hinzu. **Die Namen müssen exakt übereinstimmen und das `VITE_` Präfix enthalten!**
        -   **Key:** `VITE_SUPABASE_URL`, **Value:** `IHRE_SUPABASE_PROJEKT_URL`
        -   **Key:** `VITE_SUPABASE_ANON_KEY`, **Value:** `IHR_SUPABASE_ANON_KEY`
7.  Klicken Sie auf **"Deploy site"**. Netlify wird nun Ihren Code von GitHub herunterladen, die App bauen und sie auf einer einzigartigen URL (z.B. `irgendwas-zufälliges-12345.netlify.app`) veröffentlichen.

**Herzlichen Glückwunsch! Ihre Fitness-Tracking-Anwendung ist jetzt live!**

## 7. Anleitung zur Benutzung der App

- **Registrieren & Einloggen:** Erstellen Sie ein Konto mit Ihrer E-Mail-Adresse und einem Passwort.
- **Fitness-Seite:**
  - **Übung hinzufügen:** Klicken Sie auf "Add Exercise", um eine neue Übung zu Ihrer Bibliothek hinzuzufügen.
  - **Workout protokollieren:** Klicken Sie auf "Log Workout". Wählen Sie ein Datum und eine Übung aus. Fügen Sie Sätze hinzu (`+ Add Set`) und tragen Sie Gewicht und Wiederholungen ein.
- **Ernährungs-Seite:**
  - **Lebensmittel hinzufügen:** Klicken Sie auf "Add Food Item", um ein Lebensmittel manuell zu Ihrer Bibliothek hinzuzufügen.
  - **Barcode scannen:** Klicken Sie auf "Scan Barcode". Erlauben Sie den Kamerazugriff. Scannen Sie den Barcode eines Produkts. Die Nährwertinformationen werden (falls gefunden) automatisch ausgefüllt. Speichern Sie das Produkt.
  - **Essen protokollieren:** Klicken Sie auf "Log Food". Wählen Sie ein Datum, ein Lebensmittel aus Ihrer Bibliothek und die gegessene Menge in Gramm.
- **Profil-Seite:**
  - **Ziele anpassen:** Ändern Sie Ihr tägliches Kalorienziel.
  - **Gewicht protokollieren:** Tragen Sie Ihr aktuelles Gewicht ein, um Ihren Fortschritt im Diagramm zu sehen.

## 8. Verständnis der Projektstruktur

```
/
├── public/             # Statische Assets (Favicon, _redirects)
│   └── _redirects      # WICHTIG: Leitet alle Anfragen an index.html für React Router um
├── src/                # Der Quellcode Ihrer Anwendung
│   ├── components/     # Alle React-Komponenten (Seiten, Modals, etc.)
│   ├── services/       # Module für externe Dienste (Supabase, API)
│   ├── App.tsx         # Hauptkomponente, steuert Routing
│   ├── index.css       # Globale CSS-Datei und Tailwind-Importe
│   ├── index.tsx       # Der Einstiegspunkt der React-Anwendung
│   └── types.ts        # TypeScript-Typdefinitionen
├── .env                # (Ihre lokale Datei) Geheime API-Schlüssel
├── index.html          # Das Haupt-HTML-Template (Einstiegspunkt für Vite)
├── package.json        # Projektabhängigkeiten und Skripte
├── vite.config.ts      # Konfigurationsdatei für Vite
└── README.md           # Diese Anleitung
```

## 9. Zukünftige Erweiterungen

Dieses Projekt ist eine solide Grundlage. Hier sind einige Ideen, wie Sie es erweitern könnten:
- **Detailliertere Statistiken:** Fügen Sie Diagramme für Makronährstoffe (Protein, Kohlenhydrate, Fett) hinzu.
- **Trainingspläne:** Erstellen Sie eine Funktion, mit der Benutzer ganze Trainingspläne erstellen und wiederverwenden können.
- **Rezept-Datenbank:** Ermöglichen Sie es Benutzern, Rezepte mit Zutaten zu speichern, die dann einfach zum Ernährungstagebuch hinzugefügt werden können.
- **Design-Anpassungen:** Ändern Sie das Theme und die Farben in der `tailwind.config.js`.

Viel Erfolg mit Ihrem Projekt!

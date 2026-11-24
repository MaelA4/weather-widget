# Weather Web Components (`weather-widget` & `weather-history`)

Eine Sammlung eigenständiger, framework-freier Web Components auf Basis nativer Browser-APIs (Custom Elements, Shadow DOM, Fetch API und SVG). Beide Komponenten kommen **ohne API-Key** aus und nutzen offene Schnittstellen von Open-Meteo.

## Überblick der Komponenten

- `weather-widget`: Zeigt das aktuelle Wetter inklusive Temperatur, Wetterzustand, Luftfeuchtigkeit, Windgeschwindigkeit und Niederschlag.
- `weather-history`: Ruft historische Wetterdaten ab und visualisiert Tageshöchst- und Tagestiefstwerte sowie Wetter-Icons als SVG-Diagramm.

---

## Genutzte APIs

- **Open-Meteo Geocoding API** (`https://geocoding-api.open-meteo.com/v1/search`): Löst Städtenamen automatisch in Breiten- und Längengrade (`latitude`, `longitude`) auf, wenn keine Koordinaten übergeben werden.
- **Open-Meteo Weather Forecast API** (`https://api.open-meteo.com/v1/forecast`): Liefert aktuelle Wetterdaten (`current`) sowie Tageswerte (`daily`) für `weather-widget`.
- **Open-Meteo Historical Weather Archive API** (`https://archive-api.open-meteo.com/v1/archive`): Liefert vergangene Tageswerte (`temperature_2m_max`, `temperature_2m_min`, `weather_code`) für einen wählbaren Zeitraum bis zum Vortag für `weather-history`.

## Nutzung: `weather-widget`

Skript einbinden:

```html
<script type="module" src="weather-widget.js" defer></script>
```

Suche über Städtenamen:

```html
<weather-widget city="Berlin"></weather-widget>
```

Direkte Übergabe von GPS-Koordinaten:

```html
<weather-widget lat="49.0069" lng="8.4037"></weather-widget>
```

### Attribute von `weather-widget`

- `city`: Name des gewünschten Ortes (Standard-Fallback im Code: `Berlin`, falls weder `city` noch `lat`/`lng` gesetzt sind).
- `lat` und `lng`: Breiten- und Längengrad für direkte Koordinatenabfragen.
- `units`: Vorgesehenes Attribut zur Steuerung der Einheiten.

---

## Nutzung: `weather-history`

Skript einbinden:

```html
<script type="module" src="weather-history.js" defer></script>
```

Historischen Verlauf für Stadt und Anzahl der Tage anzeigen

```html
<weather-history city="Karlsruhe" days="7"></weather-history>
```

Verlauf über Koordinaten abrufen:

```html
<weather-history lat="49.0069" lng="8.4037" days="14"></weather-history>
```

### Attribute von `weather-history`

- `city`: Name des Ortes für die historische Auswertung.
- `lat` und `lng`: Optionale direkte GPS-Koordinaten.
- `days`: Anzahl der vergangenen Tage (Standard: `7`).

## Unterstützte Wetter- & Regencodes (WMO)

Auszug zentraler WMO-Wettercodes in `weather-widget` (und Gruppenabbildung in `weather-history`):

- `0`: Klarer Himmel
- `1`: Überwiegend klar
- `2`: Teilweise bewölkt
- `3`: Bedeckt
- `40`–`49`: Nebel / Dunst
- `50`–`59`: Nieselregen (leicht bis stark, teils gefrierend)
- `60`–`67`: Regen (leicht, mäßig, stark, unterbrochen/durchgehend, gefrierend)
- `70`–`79`: Schneefall, Schneegriesel und Graupel
- `80`–`82`: Regenschauer (leicht bis sintflutartig)
- `91`–`99`: Gewitter (teils mit Regen, Schnee, Hagel oder Staub)

---

## Lizenz & Datenquelle

Wetter- und Archivdaten bereitgestellt durch Open-Meteo.com unter **CC BY 4.0**.

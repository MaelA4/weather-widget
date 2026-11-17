# weather-widget

weather-widget liefert einen einfachen Weg eine Wettervorhersage zu implementieren.
Hierbei benötigt es keinen API-Key und löst Städtenamen automatisch in GPS-Koordinaten auf.

## Genutzte API's

Nutzt die Open-Meteo Geocoding API für Standortauflösung (wandelt lesbare Ortsnamen in präzise geographische Koordinaten um).

Nutzt die Open-Meteo Geocoding API für tagesaktuelle Wetterdaten, stündliche Verläufe und mehrtägige Vorhersagen.

## Nutzung

Die Komponente sucht die Koordinaten automatisch über die Open-Meteo Geocoding-API:
```<weather-widget city="Berlin"></weather-widget>```

Wenn bereits exakte Koordinaten vorliegen, spart sich die Komponente den Geocoding-Schritt:
```<weather-widget lat="49.0069" lng="8.4037"></weather-widget>```

## Unterstützte Wetter- & Regencodes (WMO)

      0: Klarer Himmel
      1: Überwiegend klar
      2: Teilweise bewölkt
      3: Bedeckt
      61: Leichter Regen
      65: Starker Regen
      71: Schneefall

## Lizenz & Datenquelle

Wetterdaten bereitgestellt durch Open-Meteo.com (CC BY 4.0).

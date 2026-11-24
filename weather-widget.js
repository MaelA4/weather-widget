class WeatherWidget extends HTMLElement {
  static get observedAttributes() {
    return ['city', 'lat', 'lng', 'units'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      loading: true,
      error: null,
      data: null
    };
  }

  connectedCallback() {
    this.render();
    this.fetchWeatherData();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.fetchWeatherData();
    }
  }

  async fetchWeatherData() {
    this.state.loading = true;
    this.render();

    try {
      let lat = this.getAttribute('lat');
      let lng = this.getAttribute('lng');
      let locationName = this.getAttribute('city') || 'Standort';

      if (!lat || !lng) {
        const cityName = this.getAttribute('city') || 'Berlin';
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=de`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Stadt nicht gefunden');
        }

        lat = geoData.results[0].latitude;
        lng = geoData.results[0].longitude;
        locationName = geoData.results[0].name;
      }

      const timezone = 'Europe/Berlin';
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${timezone}`
      );

      if (!weatherRes.ok) {
        throw new Error('Wetterdaten konnten nicht geladen werden');
      }

      const weatherData = await weatherRes.json();

      this.state.data = { locationName, ...weatherData };
      this.state.loading = false;
      this.state.error = null;
    } catch (err) {
      this.state.loading = false;
      this.state.error = err.message;
    }

    this.render();
  }

  getWeatherInfo(code) {
    const map = {
      0: { text: 'Klarer Himmel', icon: '☀️' },
      1: { text: 'Überwiegend klar', icon: '🌤️' },
      2: { text: 'Teilweise bewölkt', icon: '⛅' },
      3: { text: 'Bedeckt', icon: '☁️' },
      4: { text: 'Rauch oder Dunst in der Luft', icon: '🌫️' },
      5: { text: 'Trockener Dunst', icon: '🌫️' },
      6: { text: 'Leichter Staub oder Sand in der Luft', icon: '💨' },
      7: { text: 'Staub oder Sand durch Wind aufgewirbelt', icon: '💨' },
      8: { text: 'Staub- oder Sandwirbel', icon: '🌪️' },
      9: { text: 'Staub- oder Sandsturm in Sichtweite', icon: '🌪️' },
      10: { text: 'Leichter Nebel / Dunst', icon: '🌫️' },
      11: { text: 'Flacher Nebel in Schwaden', icon: '🌫️' },
      12: { text: 'Durchgehender flacher Nebel', icon: '🌫️' },
      13: { text: 'Wetterleuchten ohne Donner', icon: '⚡' },
      14: { text: 'Niederschlag in Sichtweite (Boden nicht erreicht)', icon: '🌧️' },
      15: { text: 'Niederschlag in Entfernung (Boden erreicht)', icon: '🌧️' },
      16: { text: 'Niederschlag in der Nähe (nicht an der Station)', icon: '🌧️' },
      17: { text: 'Gewitter ohne Niederschlag an der Station', icon: '⛈️' },
      18: { text: 'Starke Windböen in Sichtweite', icon: '💨' },
      19: { text: 'Windhose / Wasserhose in Sichtweite', icon: '🌪️' },
      20: { text: 'Vorheriger Nieselregen oder Schneegriesel', icon: '🌦️' },
      21: { text: 'Vorheriger Regen (kein Schauer)', icon: '🌦️' },
      22: { text: 'Vorheriger Schneefall (kein Schauer)', icon: '❄️' },
      23: { text: 'Vorheriger Regen und Schnee oder Eisregen', icon: '🌨️' },
      24: { text: 'Vorheriger gefrierender Nieselregen oder Regen', icon: '🧊' },
      25: { text: 'Vorheriger Regenschauer', icon: '🌦️' },
      26: { text: 'Vorheriger Schnee- oder Graupelschauer', icon: '🌨️' },
      27: { text: 'Vorheriger Hagel- oder Frostgraupelschauer', icon: '🧊' },
      28: { text: 'Vorheriger Nebel oder Eisnebel', icon: '🌫️' },
      29: { text: 'Vorheriges Gewitter', icon: '⛈️' },
      30: { text: 'Leichter bis mäßiger Staub-/Sandsturm (abnehmend)', icon: '💨' },
      31: { text: 'Leichter bis mäßiger Staub-/Sandsturm (unverändert)', icon: '💨' },
      32: { text: 'Leichter bis mäßiger Staub-/Sandsturm (zunehmend)', icon: '💨' },
      33: { text: 'Schwerer Staub-/Sandsturm (abnehmend)', icon: '🌪️' },
      34: { text: 'Schwerer Staub-/Sandsturm (unverändert)', icon: '🌪️' },
      35: { text: 'Schwerer Staub-/Sandsturm (zunehmend)', icon: '🌪️' },
      36: { text: 'Leichter oder mäßiger Schneetreiben (niedrig)', icon: '❄️' },
      37: { text: 'Starkes Schneetreiben (niedrig)', icon: '❄️' },
      38: { text: 'Leichtes oder mäßiges Schneetreiben (hoch)', icon: '❄️' },
      39: { text: 'Starkes Schneetreiben (hoch)', icon: '❄️' },
      40: { text: 'Nebel in Entfernung', icon: '🌫️' },
      41: { text: 'Nebel in Schwaden oder Bänken', icon: '🌫️' },
      42: { text: 'Nebel (Himmel sichtbar, dünner werdend)', icon: '🌫️' },
      43: { text: 'Nebel (Himmel nicht sichtbar, dünner werdend)', icon: '🌫️' },
      44: { text: 'Nebel (Himmel sichtbar, unverändert)', icon: '🌫️' },
      45: { text: 'Nebel (Himmel nicht sichtbar, unverändert)', icon: '🌫️' },
      46: { text: 'Nebel (Himmel sichtbar, dichter werdend)', icon: '🌫️' },
      47: { text: 'Nebel (Himmel nicht sichtbar, dichter werdend)', icon: '🌫️' },
      48: { text: 'Nebel mit Reifansatz (Himmel sichtbar)', icon: '🌫️' },
      49: { text: 'Nebel mit Reifansatz (Himmel nicht sichtbar)', icon: '🌫️' },
      50: { text: 'Sehr leichter Nieselregen (unterbrochen)', icon: '🌦️' },
      51: { text: 'Leichter Nieselregen (durchgehend)', icon: '🌦️' },
      52: { text: 'Mäßiger Nieselregen (unterbrochen)', icon: '🌦️' },
      53: { text: 'Mäßiger Nieselregen (durchgehend)', icon: '🌦️' },
      54: { text: 'Starker Nieselregen (unterbrochen)', icon: '🌦️' },
      55: { text: 'Starker Nieselregen (durchgehend)', icon: '🌦️' },
      56: { text: 'Leichter gefrierender Nieselregen', icon: '🧊' },
      57: { text: 'Mäßiger oder starker gefrierender Nieselregen', icon: '🧊' },
      58: { text: 'Leichter Nieselregen und Regen', icon: '🌦️' },
      59: { text: 'Mäßiger oder starker Nieselregen und Regen', icon: '🌧️' },
      60: { text: 'Leichter Regen (unterbrochen)', icon: '🌧️' },
      61: { text: 'Leichter Regen (durchgehend)', icon: '🌧️' },
      62: { text: 'Mäßiger Regen (unterbrochen)', icon: '🌧️' },
      63: { text: 'Mäßiger Regen (durchgehend)', icon: '🌧️' },
      64: { text: 'Starker Regen (unterbrochen)', icon: '🌧️' },
      65: { text: 'Starker Regen (durchgehend)', icon: '🌧️' },
      66: { text: 'Leichter gefrierender Regen', icon: '🧊' },
      67: { text: 'Mäßiger oder starker gefrierender Regen', icon: '🧊' },
      68: { text: 'Leichter Regen mit Schnee oder Schneeregen', icon: '🌨️' },
      69: { text: 'Mäßiger oder starker Regen mit Schnee oder Schneeregen', icon: '🌨️' },
      70: { text: 'Leichter Schneefall (unterbrochen)', icon: '❄️' },
      71: { text: 'Leichter Schneefall (durchgehend)', icon: '❄️' },
      72: { text: 'Mäßiger Schneefall (unterbrochen)', icon: '❄️' },
      73: { text: 'Mäßiger Schneefall (durchgehend)', icon: '❄️' },
      74: { text: 'Starker Schneefall (unterbrochen)', icon: '❄️' },
      75: { text: 'Starker Schneefall (durchgehend)', icon: '❄️' },
      76: { text: 'Eisnadeln (mit oder ohne Nebel)', icon: '❄️' },
      77: { text: 'Schneegriesel (mit oder ohne Nebel)', icon: '❄️' },
      78: { text: 'Einzelne Schneekristalle (mit oder ohne Nebel)', icon: '❄️' },
      79: { text: 'Eiskörner / Graupel', icon: '🧊' },
      80: { text: 'Leichter Regenschauer', icon: '🌦️' },
      81: { text: 'Mäßiger oder starker Regenschauer', icon: '🌧️' },
      82: { text: 'Sintflutartiger Regenschauer', icon: '🌧️' },
      83: { text: 'Leichter Regen- und Schneeschauer', icon: '🌨️' },
      84: { text: 'Mäßiger oder starker Regen- und Schneeschauer', icon: '🌨️' },
      85: { text: 'Leichter Schneeschauer', icon: '❄️' },
      86: { text: 'Mäßiger oder starker Schneeschauer', icon: '❄️' },
      87: { text: 'Leichter Graupelschauer (Frostgraupel)', icon: '🌨️' },
      88: { text: 'Mäßiger oder starker Graupelschauer (Frostgraupel)', icon: '🌨️' },
      89: { text: 'Leichter Hagelschauer (ohne Gewitter)', icon: '🧊' },
      90: { text: 'Mäßiger oder starker Hagelschauer (ohne Gewitter)', icon: '🧊' },
      91: { text: 'Gewitter in der letzten Stunde, aktuell leichter Regen', icon: '⛈️' },
      92: { text: 'Gewitter in der letzten Stunde, aktuell mäßiger/starker Regen', icon: '⛈️' },
      93: { text: 'Gewitter in der letzten Stunde, aktuell leichter Schnee/Schneeregen', icon: '⛈️' },
      94: { text: 'Gewitter in der letzten Stunde, aktuell mäßiger/starker Schnee/Schneeregen', icon: '⛈️' },
      95: { text: 'Leichtes oder mäßiges Gewitter (mit Regen oder Schnee)', icon: '⛈️' },
      96: { text: 'Gewitter mit leichtem Hagel', icon: '⛈️' },
      97: { text: 'Starkes Gewitter (mit Regen oder Schnee)', icon: '⛈️' },
      98: { text: 'Gewitter mit Staub- oder Sandsturm', icon: '⛈️' },
      99: { text: 'Gewitter mit starkem Hagel', icon: '⛈️' }
    };

    return map[code] || { text: `Wettercode ${code}`, icon: '🌡️' };
  }

  render() {
    const { loading, error, data } = this.state;
    const info = data?.current ? this.getWeatherInfo(data.current.weather_code) : null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 340px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2c3e50, #3498db);
          color: white;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .loader {
          text-align: center;
          padding: 20px;
        }
        .error {
          color: #ff6b6b;
          font-size: 0.9rem;
        }
        h3 {
          margin: 0 0 12px 0;
        }
        .current {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .temp {
          font-size: 2.5rem;
          font-weight: bold;
          line-height: 1.1;
        }
        .condition {
          font-size: 1.05rem;
          margin-top: 6px;
        }
        .icon {
          font-size: 3.5rem;
          line-height: 1;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 0.85rem;
        }
        .meta-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .meta-label {
          display: block;
          font-size: 0.75rem;
          opacity: 0.8;
        }
        .meta-value {
          font-weight: 600;
        }
      </style>

      <div class="weather-widget">
        ${loading ? `<div class="loader">Wetter wird geladen...</div>` : ''}
        ${error ? `<div class="error">Fehler: ${error}</div>` : ''}
        ${!loading && !error && data && info ? `
          <h3>📍 ${data.locationName}</h3>
          <div class="current">
            <div>
              <div class="temp">${data.current.temperature_2m}°C</div>
              <div class="condition">${info.text}</div>
            </div>
            <div class="icon">${info.icon}</div>
          </div>
          <div class="meta">
            <div class="meta-item">
              <span class="meta-label">Luftfeuchtigkeit</span>
              <span class="meta-value">${data.current.relative_humidity_2m ?? '–'}%</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Windgeschwindigkeit</span>
              <span class="meta-value">${data.current.wind_speed_10m ?? '–'} km/h</span>
            </div>
            ${data.current.precipitation > 0 ? `
              <div class="meta-item">
                <span class="meta-label">Niederschlag</span>
                <span class="meta-value">${data.current.precipitation} mm</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('weather-widget', WeatherWidget);

// Weitere Metadaten Anzeigen, Wettercode-Liste erweitern, Daten der vergangenheit Grafisch, unterschiedliche Wetterdienste für Vorhersagen graphisch darstellen

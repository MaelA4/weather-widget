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
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=de`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Stadt nicht gefunden');
        }
        
        lat = geoData.results[0].latitude;
        lng = geoData.results[0].longitude;
        locationName = geoData.results[0].name;
      }

      
      const timezone = 'Europe/Berlin';
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${timezone}`);
      
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
      61: { text: 'Leichter Regen', icon: '🌧️' },
      65: { text: 'Starker Regen', icon: '🌧️' },
      71: { text: 'Schneefall', icon: '❄️' },
    };
    return map[code] || { text: 'Unbekannt', icon: '🌡️' };
  }

  render() {
    const { loading, error, data } = this.state;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 320px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2c3e50, #3498db);
          color: white;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .loader { text-align: center; padding: 20px; }
        .error { color: #ff6b6b; font-size: 0.9rem; }
        .current { display: flex; align-items: center; justify-content: space-between; }
        .temp { font-size: 2.5rem; font-weight: bold; }
        .condition { font-size: 1.1rem; margin-top: 5px; }
      </style>

      <div class="weather-widget">
        ${loading ? `<div class="loader">Wetter wird geladen...</div>` : ''}
        ${error ? `<div class="error">Fehler: ${error}</div>` : ''}
        ${!loading && !error && data ? `
          <h3>📍 ${data.locationName}</h3>
          <div class="current">
            <div>
              <div class="temp">${data.current.temperature_2m}°C</div>
              <div class="condition">${this.getWeatherInfo(data.current.weather_code).text}</div>
            </div>
            <div style="font-size: 3.5rem;">${this.getWeatherInfo(data.current.weather_code).icon}</div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('weather-widget', WeatherWidget);
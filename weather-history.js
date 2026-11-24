class WeatherHistory extends HTMLElement {
  static get observedAttributes() {
    return ['city', 'lat', 'lng', 'days'];
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
    this.fetchHistoryData();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.fetchHistoryData();
    }
  }

  // Berechnet Start- und Enddatum (YYYY-MM-DD) für die letzten X Tage
  getDateRange(daysBack = 7) {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - (daysBack - 1));

    const format = (d) => d.toISOString().split('T')[0];
    return { startDate: format(start), endDate: format(end) };
  }

  async fetchHistoryData() {
    this.state.loading = true;
    this.render();

    try {
      let lat = this.getAttribute('lat');
      let lng = this.getAttribute('lng');
      let locationName = this.getAttribute('city') || 'Standort';
      const days = Math.min(Math.max(parseInt(this.getAttribute('days') || '7', 10), 3), 30);

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

      const { startDate, endDate } = this.getDateRange(days);
      const timezone = 'Europe/Berlin';

      const historyRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${timezone}`
      );

      if (!historyRes.ok) {
        throw new Error('Historische Daten konnten nicht geladen werden');
      }

      const historyData = await historyRes.json();

      this.state.data = {
        locationName,
        startDate,
        endDate,
        daily: historyData.daily
      };
      this.state.loading = false;
      this.state.error = null;
    } catch (err) {
      this.state.loading = false;
      this.state.error = err.message;
    }

    this.render();
  }

  getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code >= 40 && code <= 49) return '🌫️';
    if (code >= 50 && code <= 67) return '🌧️';
    if (code >= 70 && code <= 79) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 91) return '⛈️';
    return '🌡️';
  }

  buildSvgChart(daily) {
    const dates = daily.time;
    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;
    const codes = daily.weather_code;

    const width = 460;
    const height = 190;
    const padLeft = 36;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 38;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const allTemps = [...maxTemps, ...minTemps].filter((v) => v !== null);
    const minVal = Math.floor(Math.min(...allTemps) - 2);
    const maxVal = Math.ceil(Math.max(...allTemps) + 2);
    const range = maxVal - minVal || 1;

    const getX = (i) => padLeft + (dates.length > 1 ? (i / (dates.length - 1)) * plotW : plotW / 2);
    const getY = (val) => padTop + plotH - ((val - minVal) / range) * plotH;

    const maxPoints = maxTemps.map((t, i) => `${getX(i)},${getY(t)}`).join(' ');
    const minPoints = minTemps.map((t, i) => `${getX(i)},${getY(t)}`).join(' ');

    const midVal = Math.round((minVal + maxVal) / 2);
    const gridLines = [minVal, midVal, maxVal]
      .map((val) => {
        const y = getY(val);
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3" />
          <text x="${padLeft - 6}" y="${y + 4}" text-anchor="end" fill="rgba(255,255,255,0.7)" font-size="10">${val}°</text>
        `;
      })
      .join('');

    const pointsAndLabels = dates
      .map((dateStr, i) => {
        const x = getX(i);
        const yMax = getY(maxTemps[i]);
        const yMin = getY(minTemps[i]);
        const code = codes[i];
        const shortDate = dateStr.slice(5).split('-').reverse().join('.');

        return `
          <text x="${x}" y="${padTop - 8}" text-anchor="middle" font-size="13">${this.getWeatherIcon(code)}</text>
          <circle cx="${x}" cy="${yMax}" r="3.5" fill="#ff9f43" />
          <circle cx="${x}" cy="${yMin}" r="3.5" fill="#70a1ff" />
          <text x="${x}" y="${height - 12}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="10">${shortDate}</text>
        `;
      })
      .join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="Historischer Temperaturverlauf">
        ${gridLines}
        <polyline fill="none" stroke="#ff9f43" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${maxPoints}" />
        <polyline fill="none" stroke="#70a1ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${minPoints}" />
        ${pointsAndLabels}
      </svg>
    `;
  }

  render() {
    const { loading, error, data } = this.state;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 500px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1e272e, #2f3640);
          color: white;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 12px;
          gap: 8px;
        }
        h3 {
          margin: 0;
          font-size: 1.15rem;
        }
        .range {
          font-size: 0.8rem;
          opacity: 0.75;
        }
        .chart-svg {
          width: 100%;
          height: auto;
          display: block;
          margin-top: 8px;
        }
        .legend {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 0.8rem;
        }
        .dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .dot-max { background: #ff9f43; }
        .dot-min { background: #70a1ff; }
        .loader {
          text-align: center;
          padding: 30px;
        }
        .error {
          color: #ff6b6b;
          font-size: 0.9rem;
        }
      </style>

      <div class="history-widget">
        ${loading ? `<div class="loader">Verlaufsdaten werden geladen...</div>` : ''}
        ${error ? `<div class="error">Fehler: ${error}</div>` : ''}
        ${!loading && !error && data ? `
          <div class="header">
            <h3>📊 Rückblick: ${data.locationName}</h3>
            <span class="range">${data.startDate} bis ${data.endDate}</span>
          </div>
          ${this.buildSvgChart(data.daily)}
          <div class="legend">
            <span><i class="dot dot-max"></i>Tageshöchstwert</span>
            <span><i class="dot dot-min"></i>Tagestiefstwert</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('weather-history', WeatherHistory);
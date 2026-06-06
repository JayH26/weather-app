import { useState } from "react";
import "./App.css";

const WMO_CODES = {
  0: { label: "Despejado", icon: "☀️" },
  1: { label: "Mayormente despejado", icon: "🌤" },
  2: { label: "Parcialmente nublado", icon: "⛅" },
  3: { label: "Nublado", icon: "☁️" },
  45: { label: "Neblina", icon: "🌫" },
  48: { label: "Neblina con escarcha", icon: "🌫" },
  51: { label: "Llovizna ligera", icon: "🌦" },
  53: { label: "Llovizna moderada", icon: "🌦" },
  55: { label: "Llovizna intensa", icon: "🌦" },
  61: { label: "Lluvia ligera", icon: "🌧" },
  63: { label: "Lluvia moderada", icon: "🌧" },
  65: { label: "Lluvia intensa", icon: "🌧" },
  71: { label: "Nieve ligera", icon: "🌨" },
  73: { label: "Nieve moderada", icon: "🌨" },
  75: { label: "Nieve intensa", icon: "❄️" },
  77: { label: "Granizo", icon: "🌨" },
  80: { label: "Chubascos", icon: "🌦" },
  81: { label: "Chubascos moderados", icon: "🌦" },
  82: { label: "Chubascos intensos", icon: "🌦" },
  85: { label: "Nieve ligera", icon: "🌨" },
  86: { label: "Nieve intensa", icon: "❄️" },
  95: { label: "Tormenta", icon: "⛈" },
  96: { label: "Tormenta con granizo", icon: "⛈" },
  99: { label: "Tormenta fuerte con granizo", icon: "⛈" },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: "Desconocido", icon: "🌡" };
}

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("");
  const [humidity, setHumidity] = useState(null);

  const fetchWeather = async (lat, lon, name = "") => {
    setLoading(true);
    setError(null);
    setCityName(name);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`      );
      const data = await res.json();
      setWeather(data.current_weather);
      setForecast(data.daily);
      setHumidity(data.hourly.relativehumidity_2m[0]);
    } catch {
      setError("No se pudo obtener el clima. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Tu ubicación"),
        () => setError("No se pudo obtener tu ubicación.")
      );
    } else {
      setError("Tu navegador no soporta geolocalización.");
    }
  };

  const searchByCity = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { latitude, longitude, name, country } = data.results[0];
        fetchWeather(latitude, longitude, `${name}, ${country}`);
      } else {
        setError("Ciudad no encontrada.");
        setLoading(false);
      }
    } catch {
      setError("Error al buscar la ciudad.");
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="app">
      <h1>🌤 Weather App</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Escribe una ciudad..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchByCity()}
        />
        <button onClick={searchByCity}>Buscar</button>
        <button onClick={getLocation}>📍 Mi ubicación</button>
      </div>

      {loading && <p className="status">Cargando...</p>}
      {error && <p className="status error">{error}</p>}

      {weather && !loading && (
        <>
          <div className="weather-card">
            <h2>{cityName || "Clima actual"}</h2>
            <div className="current-icon">{getWeatherInfo(weather.weathercode).icon}</div>
            <p className="condition">{getWeatherInfo(weather.weathercode).label}</p>
            <p>🌡 Temperatura: <strong>{weather.temperature}°C</strong></p>
            <p>💨 Viento: <strong>{weather.windspeed} km/h</strong></p>
            <p>🕐 Hora: <strong>{new Date(weather.time).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</strong></p>
            <p>💧 Humedad: <strong>{humidity}%</strong></p>
          </div>

          {forecast && (
            <div className="forecast">
              <h2>Próximos 7 días</h2>
              <div className="forecast-grid">
                {forecast.time.map((day, i) => (
                  <div className="forecast-card" key={day}>
                    <p className="day">{formatDate(day)}</p>
                    <p className="forecast-icon">{getWeatherInfo(forecast.weathercode[i]).icon}</p>
                    <p className="forecast-label">{getWeatherInfo(forecast.weathercode[i]).label}</p>
                    <p className="temp-max">↑ {forecast.temperature_2m_max[i]}°C</p>
                    <p className="temp-min">↓ {forecast.temperature_2m_min[i]}°C</p>
                    <p className="rain">🌧 {forecast.precipitation_sum[i]} mm</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
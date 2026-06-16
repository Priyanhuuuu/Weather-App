const state = {
  unit: localStorage.getItem("weatherflow-unit") || "celsius",
  theme: localStorage.getItem("weatherflow-theme") || "light",
  place: null,
  forecast: null,
  saved: JSON.parse(localStorage.getItem("weatherflow-saved") || "[]"),
};

const weatherCodes = {
  0: ["Clear sky", "sun"],
  1: ["Mostly clear", "sun"],
  2: ["Partly cloudy", "cloud-sun"],
  3: ["Cloudy", "cloud"],
  45: ["Fog", "cloud-fog"],
  48: ["Freezing fog", "cloud-fog"],
  51: ["Light drizzle", "cloud-drizzle"],
  53: ["Drizzle", "cloud-drizzle"],
  55: ["Heavy drizzle", "cloud-drizzle"],
  56: ["Freezing drizzle", "cloud-drizzle"],
  57: ["Freezing drizzle", "cloud-drizzle"],
  61: ["Light rain", "cloud-rain"],
  63: ["Rain", "cloud-rain"],
  65: ["Heavy rain", "cloud-rain"],
  66: ["Freezing rain", "cloud-rain"],
  67: ["Freezing rain", "cloud-rain"],
  71: ["Light snow", "cloud-snow"],
  73: ["Snow", "cloud-snow"],
  75: ["Heavy snow", "cloud-snow"],
  77: ["Snow grains", "cloud-snow"],
  80: ["Rain showers", "cloud-rain"],
  81: ["Rain showers", "cloud-rain"],
  82: ["Heavy showers", "cloud-rain"],
  85: ["Snow showers", "cloud-snow"],
  86: ["Snow showers", "cloud-snow"],
  95: ["Thunderstorm", "cloud-lightning"],
  96: ["Thunderstorm hail", "cloud-lightning"],
  99: ["Thunderstorm hail", "cloud-lightning"],
};

const els = {
  body: document.body,
  placeTitle: document.querySelector("#placeTitle"),
  searchForm: document.querySelector("#searchForm"),
  cityInput: document.querySelector("#cityInput"),
  themeButton: document.querySelector("#themeButton"),
  locationButton: document.querySelector("#locationButton"),
  forecastDays: document.querySelector("#forecastDays"),
  saveCityButton: document.querySelector("#saveCityButton"),
  clearSavedButton: document.querySelector("#clearSavedButton"),
  statusText: document.querySelector("#statusText"),
  currentTemp: document.querySelector("#currentTemp"),
  degreeMark: document.querySelector("#degreeMark"),
  currentSummary: document.querySelector("#currentSummary"),
  weatherMark: document.querySelector("#weatherMark"),
  feelsLike: document.querySelector("#feelsLike"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind"),
  rainChance: document.querySelector("#rainChance"),
  savedList: document.querySelector("#savedList"),
  hourlyStrip: document.querySelector("#hourlyStrip"),
  dailyList: document.querySelector("#dailyList"),
  unitButtons: [...document.querySelectorAll("[data-unit]")],
};

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function hydrateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setStatus(message, isError = false) {
  els.statusText.textContent = message;
  els.statusText.classList.toggle("error", isError);
}

function tempUnitParam() {
  return state.unit === "fahrenheit" ? "&temperature_unit=fahrenheit" : "";
}

function unitLabel() {
  return state.unit === "fahrenheit" ? "°F" : "°C";
}

function formatTemp(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${Math.round(value)}${unitLabel()}`;
}

function weatherMeta(code) {
  return weatherCodes[code] || ["Weather update", "cloud-sun"];
}

function saveSettings() {
  localStorage.setItem("weatherflow-unit", state.unit);
  localStorage.setItem("weatherflow-theme", state.theme);
  localStorage.setItem("weatherflow-saved", JSON.stringify(state.saved));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  if (!data.results?.length) throw new Error("City not found. Try a nearby city or add the country.");
  const city = data.results[0];
  return {
    name: city.name,
    country: city.country,
    admin: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

async function reverseGeocode(latitude, longitude) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
  const data = await fetchJson(url);
  const city = data.results?.[0];
  return {
    name: city?.name || "Current location",
    country: city?.country || "",
    admin: city?.admin1 || "",
    latitude,
    longitude,
  };
}

async function getForecast(place) {
  const days = els.forecastDays.value;
  const params = [
    "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    "hourly=temperature_2m,precipitation_probability,weather_code",
    "daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    "wind_speed_unit=kmh",
    "timezone=auto",
    `forecast_days=${days}`,
    tempUnitParam().replace("&", ""),
  ].filter(Boolean);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&${params.join("&")}`;
  return fetchJson(url);
}

async function loadPlace(place) {
  state.place = place;
  setStatus("Loading live forecast...");
  try {
    state.forecast = await getForecast(place);
    render();
  } catch (error) {
    setStatus(error.message || "Unable to load weather right now.", true);
  }
}

function renderCurrent() {
  if (!state.forecast || !state.place) return;
  const current = state.forecast.current;
  const [summary, iconName] = weatherMeta(current.weather_code);
  const locationParts = [state.place.name, state.place.admin, state.place.country].filter(Boolean);
  els.placeTitle.textContent = locationParts.join(", ");
  els.currentTemp.textContent = Math.round(current.temperature_2m);
  els.degreeMark.textContent = unitLabel();
  els.currentSummary.textContent = summary;
  els.feelsLike.textContent = formatTemp(current.apparent_temperature);
  els.humidity.textContent = `${current.relative_humidity_2m}%`;
  els.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  els.rainChance.textContent = `${state.forecast.hourly.precipitation_probability?.[0] ?? 0}%`;
  els.weatherMark.innerHTML = icon(iconName);
  setStatus(`Updated ${new Date(current.time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`);
}

function renderHourly() {
  if (!state.forecast) return;
  const hourly = state.forecast.hourly;
  const now = new Date();
  const start = hourly.time.findIndex((time) => new Date(time) >= now);
  const sliceStart = Math.max(start, 0);
  els.hourlyStrip.innerHTML = hourly.time.slice(sliceStart, sliceStart + 12).map((time, index) => {
    const actualIndex = sliceStart + index;
    const [summary, iconName] = weatherMeta(hourly.weather_code[actualIndex]);
    return `
      <article class="hour-card" title="${summary}">
        <span>${new Date(time).toLocaleTimeString([], { hour: "numeric" })}</span>
        ${icon(iconName)}
        <strong>${formatTemp(hourly.temperature_2m[actualIndex])}</strong>
        <span>${hourly.precipitation_probability[actualIndex] ?? 0}% rain</span>
      </article>
    `;
  }).join("");
}

function renderDaily() {
  if (!state.forecast) return;
  const daily = state.forecast.daily;
  els.dailyList.innerHTML = daily.time.map((date, index) => {
    const [summary, iconName] = weatherMeta(daily.weather_code[index]);
    const day = new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    return `
      <article class="daily-row">
        <strong>${day}</strong>
        <span>${icon(iconName)} ${summary}</span>
        <strong>${formatTemp(daily.temperature_2m_max[index])} / ${formatTemp(daily.temperature_2m_min[index])}</strong>
      </article>
    `;
  }).join("");
}

function renderSaved() {
  if (!state.saved.length) {
    els.savedList.innerHTML = `<span class="status-text">No saved cities yet.</span>`;
    return;
  }
  els.savedList.innerHTML = state.saved.map((city, index) => `
    <button class="saved-chip" type="button" data-saved-index="${index}">
      ${city.name}${city.country ? `, ${city.country}` : ""}
    </button>
  `).join("");
}

function renderControls() {
  els.body.classList.toggle("dark", state.theme === "dark");
  els.unitButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === state.unit);
  });
  els.themeButton.innerHTML = icon(state.theme === "dark" ? "sun" : "moon");
}

function render() {
  renderControls();
  renderCurrent();
  renderHourly();
  renderDaily();
  renderSaved();
  hydrateIcons();
  saveSettings();
}

async function search(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    setStatus("Type a city name to search.", true);
    return;
  }
  setStatus("Finding city...");
  try {
    await loadPlace(await geocodeCity(trimmed));
  } catch (error) {
    setStatus(error.message || "Could not find that city.", true);
  }
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not available in this browser.", true);
    return;
  }
  setStatus("Waiting for location permission...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await loadPlace(await reverseGeocode(latitude, longitude));
    },
    () => setStatus("Location permission was blocked or unavailable.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function saveCurrentCity() {
  if (!state.place) {
    setStatus("Load a city before saving it.", true);
    return;
  }
  const exists = state.saved.some((city) => city.name === state.place.name && city.country === state.place.country);
  if (!exists) state.saved.unshift(state.place);
  state.saved = state.saved.slice(0, 8);
  renderSaved();
  saveSettings();
  setStatus(`${state.place.name} saved.`);
}

els.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  search(els.cityInput.value);
});

els.locationButton.addEventListener("click", useCurrentLocation);

els.themeButton.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  renderControls();
  hydrateIcons();
  saveSettings();
});

els.forecastDays.addEventListener("change", () => {
  if (state.place) loadPlace(state.place);
});

els.saveCityButton.addEventListener("click", saveCurrentCity);

els.clearSavedButton.addEventListener("click", () => {
  state.saved = [];
  renderSaved();
  saveSettings();
});

els.savedList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-saved-index]");
  if (!button) return;
  loadPlace(state.saved[Number(button.dataset.savedIndex)]);
});

els.unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    renderControls();
    saveSettings();
    if (state.place) loadPlace(state.place);
  });
});

renderControls();
renderSaved();
hydrateIcons();
search("New Delhi");

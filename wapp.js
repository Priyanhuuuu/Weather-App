const apikey = "c488738cca5cc4b89b916c49ec581539";
const apiurl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

async function checkweather(city) {

  const response = await fetch(apiurl + city + `&appid=${apikey}`);

    const data = await response.json();
    console.dir(data);

    // Update UI with real data
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + " Km/h";

     if (data.weather[0].main == "Clouds") {
      weatherIcon.src = "https://cdn-icons-png.flaticon.com/128/1146/1146869.png";
    } 
    else if (data.weather[0].main == "Clear") {
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/128/11742/11742559.png";
    } 
    else if (data.weather[0].main == "Rain") {
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/128/4724/4724094.png";
    } 
    else if (data.weather[0].main == "Drizzle") {
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/128/9342/9342323.png";
    } 
    else if (data.weather[0].main == "Mist") {
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/128/2930/2930095.png";
    }

    console.log("Weather Condition:", data.weather[0].main);
   
 }

// Event listener
searchBtn.addEventListener("click", () => {
  checkweather(searchBox.value);
});

// Pressing Enter in input
searchBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    checkweather(searchBox.value);
  }
});

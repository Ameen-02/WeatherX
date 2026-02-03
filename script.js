const apiKey = "4e3a7d1f6c15f1d61eeed1f7377ba22a";

let unit = "metric";

const loading = document.getElementById("loading");
const weatherCard = document.getElementById("weatherCard");
const historyDiv = document.getElementById("history");

document.getElementById("cityInput").addEventListener("keypress", e => {
  if(e.key === "Enter") getWeather();
});

function showLoading(show) {
  loading.style.display = show ? "block" : "none";
}

function getWeather(cityFromHistory) {
  const city = cityFromHistory || document.getElementById("cityInput").value;
  if (!city) return alert("Enter city name");

  saveHistory(city);
  showLoading(true);

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      if(data.cod !== 200) throw new Error("City not found");
      displayWeather(data);
      getForecast(city);
      getHourly(city);
      getUVandAQI(data.coord.lat, data.coord.lon);
      setBackground(data.weather[0].main);
    })
    .catch(() => alert("City not found or API Error"))
    .finally(() => showLoading(false));
}

function displayWeather(data) {
  weatherCard.style.display = "block";
  const tempUnit = unit === "metric" ? "°C" : "°F";
  document.getElementById("cityName").innerText = `${data.name}, ${data.sys.country}`;
  document.getElementById("temp").innerText = `${Math.round(data.main.temp)}${tempUnit}`;
  document.getElementById("desc").innerText = `${getMood(data.weather[0].main)} ${data.weather[0].description}`;
  document.getElementById("humidity").innerText = data.main.humidity;
  document.getElementById("wind").innerText = data.wind.speed;
  document.getElementById("feels").innerText = Math.round(data.main.feels_like);
  document.getElementById("updateTime").innerText = "Last updated: " + new Date().toLocaleTimeString();
  document.getElementById("sunrise").innerText = new Date(data.sys.sunrise*1000).toLocaleTimeString();
  document.getElementById("sunset").innerText = new Date(data.sys.sunset*1000).toLocaleTimeString();
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function getForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`)
    .then(res=>res.json())
    .then(data=>{
      const forecastDiv = document.getElementById("forecast");
      forecastDiv.innerHTML="";
      for(let i=0;i<data.list.length;i+=8){
        const day=data.list[i];
        const div=document.createElement("div");
        div.innerHTML=`<p>${new Date(day.dt_txt).toLocaleDateString()}</p>
                       <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
                       <p>${Math.round(day.main.temp)}°</p>`;
        forecastDiv.appendChild(div);
      }
    });
}

function getHourly(city){
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`)
    .then(res=>res.json())
    .then(data=>{
      const hourlyDiv=document.getElementById("hourly");
      hourlyDiv.innerHTML="";
      for(let i=0;i<24;i++){
        const hour=data.list[i];
        const div=document.createElement("div");
        div.innerHTML=`<p>${new Date(hour.dt_txt).getHours()}:00</p>
                       <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png">
                       <p>${Math.round(hour.main.temp)}°</p>`;
        hourlyDiv.appendChild(div);
      }
    });
}

function getUVandAQI(lat, lon){
  fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then(res=>res.json())
    .then(data=>{
      document.getElementById("uv").innerText=data.value;
    });

  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then(res=>res.json())
    .then(data=>{
      document.getElementById("aqi").innerText=data.list[0].main.aqi;
    });
}

function getLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    showLoading(true);
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`)
      .then(res=>res.json())
      .then(data=>{
        displayWeather(data);
        getForecast(data.name);
        getHourly(data.name);
        getUVandAQI(latitude, longitude);
        setBackground(data.weather[0].main);
      })
      .finally(()=>showLoading(false));
  });
}

/* Dark Mode */
document.getElementById("modeToggle").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
});

/* Unit Toggle */
document.getElementById("unitToggle").addEventListener("click",()=>{
  unit=unit==="metric"?"imperial":"metric";
  document.getElementById("unitToggle").innerText=unit==="metric"?"°F":"°C";
  getWeather();
});

/* Search History */
function saveHistory(city){
  let history=JSON.parse(localStorage.getItem("weatherHistory"))||[];
  if(!history.includes(city)) history.unshift(city);
  history=history.slice(0,5);
  localStorage.setItem("weatherHistory",JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  const history=JSON.parse(localStorage.getItem("weatherHistory"))||[];
  historyDiv.innerHTML="";
  history.forEach(city=>{
    const span=document.createElement("span");
    span.innerText=city;
    span.onclick=()=>getWeather(city);
    historyDiv.appendChild(span);
  });
}

renderHistory();

/* Weather Mood Emoji */
function getMood(weather){
  if(weather==="Clear") return "😎";
  if(weather==="Rain") return "🌧️";
  if(weather==="Clouds") return "☁️";
  if(weather==="Snow") return "❄️";
  return "🌤️";
}

/* Dynamic Background */
function setBackground(type){
  if(type==="Rain") document.body.style.background="linear-gradient(to right,#373B44,#4286f4)";
  else if(type==="Clear") document.body.style.background="linear-gradient(to right,#fceabb,#f8b500)";
  else if(type==="Clouds") document.body.style.background="linear-gradient(to right,#bdc3c7,#2c3e50)";
  else document.body.style.background="linear-gradient(to right,#1e3c72,#2a5298)";
}

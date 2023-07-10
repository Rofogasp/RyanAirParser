const { ipcRenderer } = require('electron');
const fs = require('fs');

ipcRenderer.on('data', (event, data) => {
  let html = '';

  fetchCityNames(data.departureAirport, data.arrivalAirport).then(citynames => {
    for (let fare of data.fares) {
      if (fare.price) {
        var departureDate = new Date(fare.departureDate),
          arrivalDate = new Date(fare.arrivalDate),
          formattedDate = `${departureDate.getDate()}.${departureDate.getMonth() + 1}.${departureDate.getFullYear()}`,
          duration = Math.floor((arrivalDate - departureDate) / 60000);
        
        html += `
            <div class="flight-card">
              <img class="city-image" src="${__dirname}/../../resources/images/cities/${data.arrivalAirport}.jpg">
              <div class="flight-info">
                <span class="flight-info__hour">${departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="flight-info__city">${citynames.departureCity}</span>
              </div>
              <div class="flight-card__middle">
                <span class="flight-info__date">${formattedDate}</span>
                <img class="plane-icon" src="${__dirname}/../../resources/images/plane_icon.png">
                <span class="flight-info__duration">${duration} mins</span>
              </div>
              <div class="flight-info">
                <span class="flight-info__hour">${arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span class="flight-info__city">${citynames.arrivalCity}</span>
              </div>
              <p class="flight-info__price">${fare.price.value} ${fare.price.currencySymbol}</p>
            </div>
        `;
      }
    }
    // in case of no results in responce
    console.log(html)
    if ( !html ) window.close();

    document.getElementById('data').innerHTML = html;
    document.title = "From " + citynames.departureCity + ", " + data.departureAirport + " to " + citynames.arrivalCity + ", " + data.arrivalAirport;
  });
});

async function fetchCityNames(departureAirport, arrivalAirport) {
  async function readJsonFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(__dirname + '/../../db/cities.json', 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (parseErr) {
            reject(new Error('An error occurred while parsing JSON: ' + parseErr.message));
          }
        }
      });
    });
  }

  async function getNames() {
    const data = await readJsonFile();
    const filteredData = data.filter(item => item.iataCode === departureAirport || item.iataCode === arrivalAirport);
    
    let departureCity, arrivalCity;
    filteredData.forEach(item => {
      if (item.iataCode === departureAirport) {
        departureCity = item.city;
      } else {
        arrivalCity = item.city;
      }
    });
    
    if ( departureCity === undefined || arrivalCity === undefined ) {
      throw new Error('Airport not found: ' + departureAirport);
    }
    return {
      departureCity: departureCity,
      arrivalCity: arrivalCity
    };
  }
  return getNames();
}

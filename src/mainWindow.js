const { ipcRenderer } = require('electron');
const fs = require('fs');

window.onload = () => {
  document.getElementById('confirm-button').addEventListener('click', function(event) {
    event.preventDefault();

    var input1 = checkInput(document.getElementById('input1').value),
      input2 = checkInput(document.getElementById('input2').value),
      datepicker1 = formatDate(new Date(document.getElementById('datepicker1').value)),
      datepicker2 = formatDate(new Date(document.getElementById('datepicker2').value));

    const isReturn = document.getElementById('checkbox').checked;

    if (isReturn) {
      Promise.all([
        fetchFares(input1, input2, datepicker1, datepicker2),
        fetchFares(input2, input1, datepicker1, datepicker2)
      ]).then(([data1, data2]) => {
        console.log("calling window", data1, data2);
        ipcRenderer.send('open-new-window', data1, {x:500, y:0});
        ipcRenderer.send('open-new-window', data2, {x:1000, y:0});
      });
    } else {
      fetchFares(input1, input2, datepicker1, datepicker2).then(data => {
        console.log("calling window", data);
        ipcRenderer.send('open-new-window', data, {x:500, y:0});
      });
    }
  });

  document.getElementById('magic-button').addEventListener('click', function(event) {
    event.preventDefault();

    var input1 = checkInput(document.getElementById('input1').value),
      input2 = checkInput(document.getElementById('input2').value),
      datepicker1 = formatDate(new Date(document.getElementById('datepicker1').value)),
      datepicker2 = formatDate(new Date(document.getElementById('datepicker2').value));

    fetchMagic(input1, input2, datepicker1, datepicker2);
  });

  checkInputlementById('reverse-button').addEventListener('click', function(event) {
    event.preventDefault();
    
    const input1 = document.getElementById('input1');
    const input2 = document.getElementById('input2');
    
    const temp = input1.value;
    input1.value = input2.value;
    input2.value = temp;
  });

  async function fetchFares(input1, input2, dateFrom, dateTo) {
    const response = await fetch(`https://www.ryanair.com/api/farfnd/3/oneWayFares/${input1}/${input2}/cheapestPerDay?outboundDateFrom=${dateFrom}&outboundDateTo=${dateTo}`);
    const data = await response.json();
    var result = data.outbound;

    result.departureAirport = input1;
    result.arrivalAirport = input2;
    return result;
  }

  async function fetchMagic(input1, input2, dateFrom, dateTo) {

    async function readJsonFile() {
      return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/../../db/routes.json', 'utf8', (err, data) => {
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
  
    async function getAllFlightsFromAirport() {
      const data = await readJsonFile();
      const filteredData = data.filter(item => item.airportFrom === input1);
      const airportsTo = filteredData.map(item => item.airportTo);
      return airportsTo;
    }
    
    getAllFlightsFromAirport().then(airportsTo => {
      airportsTo.forEach((airportTo, index) => {
        fetchFares(input1, airportTo, dateFrom, dateTo).then(data => {
          coordinates = {
            x: 500 + 100 * Math.floor(index/10) + index*40,
            y: index % 10 * 40
          }
          ipcRenderer.send('open-new-window', data, coordinates);
        });
        console.log(airportTo)
      });
    }).catch(err => {
      console.error(err);
    });
  }
  

  function formatDate(date) {
    var formattedDate = new Date(date),
      month = '' + (formattedDate.getMonth() + 1),
      day = '' + formattedDate.getDate(),
      year = formattedDate.getFullYear();

      if ( year && ( year > 2030 || year < 2023 ) ) {
        alert( "Input data incorrect: Date is out of bounds ( 2022 < year < 2030 )" );
        throw new Error("Input data incorrect: Date is out of bounds");
      }

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  function checkInput(input) {
    if ( !input ) return "";
    input = input.trim();
    if (input.length !== 3 || input !== input.toUpperCase() ) {
      alert( "Input data incorrect: IATA-code is a three-letter geocode, all letters in upper-case" );
      throw new Error("Input data incorrect: IATA-code is a three-letter geocode, all letters in upper-case");
    } else {
      return input;
    } 
  }
};

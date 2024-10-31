const fs = require('fs');

function readCsv(filename, delimiter = ',') {
    try {
        const fileContent = fs.readFileSync(filename, { encoding: 'utf-8' });
        const rows = fileContent.split('\n');
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (row) {
                const columns = row.split(delimiter);
                data.push(columns);
            }
        }

        return data;
    } catch (err) {
        console.error("Error reading file:", err.message);
        return null;
    }
}
const airportsData = readCsv('airports.csv');
const aeroplanesData = readCsv('aeroplanes.csv');
const flightData = readCsv('valid_flight_data.csv');
const invalidFlightData = readCsv('invalid_flight_data.csv');


function flightDistance(col, airportCode){
    const airports = airportsData.filter(row => row[col] === airportCode);
    if(airports.length > 0){
        const airport = airports[0]
        return {
            distanceFromMAN: parseFloat(airport[2]),
            distanceFromLGW: parseFloat(airport[3])
        };
    }else {
        return null;
    } 
}
function flightDetails(airportsData, aeroplanesData, flightData) {
    const results = flightData.map(flight => {
    const distanceData = flightDistance(0, flight[1]);
    const aeroplane = aeroplanesData.find(a => a[0] === flight[2]);
    if (!distanceData || !aeroplane) {
        return {
            error: `Invalid data for flight ${flight[0]}`,
            flightId: flight[0]
        };
    }
    const distance = flight[0] === 'MAN' ? distanceData.distanceFromMAN : distanceData.distanceFromLGW;
    const economyIncome = flight[3] * flight[6];
    const businessClassIncome = flight[4] * flight[7];
    const firstClassIncome = flight[5] * flight[8];
    const totalIncome = economyIncome + businessClassIncome + firstClassIncome;
   
    // Calculate total cost using the correct cost per seat per mile from 'aeroplane'
    const totalSeatsTaken = parseInt(flight[3]) + parseInt(flight[4]) + parseInt(flight[5]);
    const totalCostPerSeat = parseFloat((aeroplane[1].replace('£', '')) * (distance / 100));
    const totalCost = (totalCostPerSeat* totalSeatsTaken).toFixed(2);
    const profitLoss = (totalIncome - parseFloat(totalCost)).toFixed(2);
    return {
        departure: flight[0],
        destination: flight[1],
        aircraftType: aeroplane[0],
        distance: `${distance} km`,
        profitLoss: `£${profitLoss}`
    };
    });
    return results;
}

function validateAirportCodes(invalidFlightData) {
    const destinationAirport = airportsData.find(airport => airport[0] === invalidFlightData[1]);
    if (!destinationAirport) {
        return {
            departure: invalidFlightData[0],
            destination: invalidFlightData[1],
            error: "Invalid destination airport code."
        };
    }
    return null; // No airport code errors
}


function validateAeroplaneType(flight, aeroplanesData) {
    const aeroplane = aeroplanesData.find(a => a[0] === flight[2]);
    if (!aeroplane) {
        return {
        departure: flight[0],
        destination: flight[1],
        error: "Invalid aeroplane type."
        };
    }
    return aeroplane; // Return the aeroplane data if valid
}
function validateSeatCapacity(flight, aeroplane) {
    const categories = ['economy', 'business', 'first class'];
    const seatIndices = [3, 4, 5];
    const errors = [];
  
    for (let i = 0; i < categories.length; i++) {
        const seatsTaken = parseInt(flight[seatIndices[i]]);
        const seatCapacity = parseInt(aeroplane[seatIndices[i]]);
    
        if (seatsTaken > seatCapacity) {
          errors.push(`Too many ${categories[i]} seats have been booked on this flight`);
        }
      }
    
      const totalSeatsTaken = seatIndices.reduce((total, index) => total + parseInt(flight[index]), 0);
      const totalSeatCapacity = parseInt(aeroplane[3]) + parseInt(aeroplane[4]) + parseInt(aeroplane[5]);
    
      if (totalSeatsTaken > totalSeatCapacity) {
        errors.push("Too many total seats booked on this flight");
      }
    
      // Return an error object if there are any errors, otherwise return null
      return errors.length > 0 ? {
        departure: flight[0],
        destination: flight[1],
        error: errors.join(' and ') // Combine errors with "and"
      } : null; 
}

function validateFlightRange(flight, aeroplane) {
    // Find the destination airport data
    const destinationAirport = airportsData.find(airport => airport[0] === flight[1]);
    if (!destinationAirport) {
        return {
            departure: flight[0],
            destination: flight[1],
            error: "Invalid destination airport code."
        };
    }
    // Calculate distance based on departure airport
    const distance = flight[0] === 'MAN'
    ? parseFloat(destinationAirport[2])  // Distance from MAN
    : parseFloat(destinationAirport[3]); // Distance from LGW
    const maxFlightRange = parseFloat(aeroplane[2]);
    if (distance > maxFlightRange) {
        return {
            departure: flight[0],
            destination: flight[1],
            error: `${aeroplane[0]} doesn't have the range to fly to ${flight[1]}`
        };
    }
    return null; // No range errors
}

function validateFlight(flight, airportsData, aeroplanesData) {
    const airportCodeError = validateAirportCodes(flight, airportsData);
    if (airportCodeError) {
        console.log(airportCodeError);
        return;
    }

    const aeroplane = validateAeroplaneType(flight, aeroplanesData);
    if (aeroplane.error) {
        console.log(aeroplane);
        return;
    }

    const seatCapacityError = validateSeatCapacity(flight, aeroplane);
    if (seatCapacityError) {
      console.log(seatCapacityError); // Log the entire error object
      return seatCapacityError; // Return the error object to stop further processing
    }


    const rangeError = validateFlightRange(flight, aeroplane, airportsData);
    if (rangeError) {
        console.log(rangeError);
        return;
    }

    console.log('Flight is valid:', flight);
}






// Usage example

if (airportsData && aeroplanesData && flightData) {
    const flightResults = flightDetails(airportsData, aeroplanesData, flightData);
    console.log(flightResults);
  } else {
    console.error("Error: Unable to read one or more CSV files.");
  }

  if (airportsData && aeroplanesData && invalidFlightData) {
    // Iterate through each flight in invalidFlightData
    invalidFlightData.forEach(flight => { 
      validateFlight(flight, airportsData, aeroplanesData);
    });
  } else {
    console.error("Error: Unable to read one or more CSV files.");
  }

flightDistance()
flightDetails()
validateAeroplaneType()
validateSeatCapacity()
validateFlightRange()
validateAirportCodes()
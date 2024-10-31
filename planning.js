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
const flightData = readCsv('valid_flight_data.csv')

function flightDistance(col, airportCode){
    const airports = airportsData.filter(row => row[col] === airportCode);
    if(airports.length > 0){
        const airport = airports[0]
        return {
            distanceFromMAN: parseFloat(airport[2]),
            distanceFromLGW: parseFloat(airport[3])
        };
    }else{
        return null;
    } 
}

function flightDetails(airportsData, aeroplanesData, flightData) {
    const results = flightData.map(flight => {
        const distanceData = flightDistance(0, flight[1], airportsData);
        const aeroplane = aeroplanesData.map(a => a[0] === flight[2]);

        if (!distanceData || !aeroplane) {
            return {
                error: `Invalid data for flight ${flight[0]}`, flightID: flight[0]
            };
        }

        // Check flight[1] for the destination airport code
        const distance = flight[0] === 'MAN' ? distanceData.distanceFromMAN : distanceData.distanceFromLGW;

        // Calculate revenues
        const economyRevenue = flight[3] * flight[6];
        const businessClassRevenue = flight[4] * flight[7];
        const firstClassRevenue = flight[5] * flight[8];
        const totalRevenue = economyRevenue + businessClassRevenue + firstClassRevenue;

        // Calculate total cost
        const totalCost = distance * aeroplane[1] * 2; // Assuming aeroplane[1] is cost per mile

        // Calculate profit or loss
        const profitLoss = totalRevenue - totalCost;

        // Return the computed details
        return {
            flightId: flight[0],
            destination: flight[1],
            distance,
            totalRevenue,
            totalCost,
            profitLoss,
        };
    });

    return results;
}





// Usage example

if (airportsData && aeroplanesData && flightData) {
    const flightResults = flightDetails(airportsData, aeroplanesData, flightData);
    console.log(flightResults);
  } else {
    console.error("Error: Unable to read one or more CSV files.");
  }
/*if (airportsData) {
    airportsData.forEach(row => {
        console.log(row);
    });
}*/

flightDistance()
flightDetails()
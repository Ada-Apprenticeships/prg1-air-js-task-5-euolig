const fs = require("fs");

// Reads a CSV file and converts its contents into a 2D array, excluding the header row.
function readCsv(filename, delimiter = ",") {
  try {
    const fileContent = fs.readFileSync(filename, { encoding: "utf-8" });
    const rows = fileContent.split("\n");
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

function flightDetails(airportsData, aeroplanesData, Data) {
  const results = Data.map((flight) => {
    const aeroplane = aeroplanesData.find((a) => a[0] === flight[2]);

    // --- Start of Validation Logic ---
    const errors = [];

    //1. Checks if departure and destination airport codes are valid by matching them against the airports data.
    const departureAirport = flight[0]; 
    if (departureAirport !== "MAN" && departureAirport !== "LGW") {
      return {
       departure: flight[0],
        destination: flight[1],
        error: "Invalid departure airport code",
      };
    }   
    const destinationAirport = airportsData.find(
      (airport) => airport[0] === flight[1]
    );
    if (!departureAirport || !destinationAirport) {
      return {
        departure: flight[0],
        destination: flight[1],
        error: "Invalid destination airport code",
      };
    }

    // 2. Ensures the aeroplane type exists in the aeroplanes data.
    if (!aeroplane) {
      return {
        departure: flight[0],
        destination: flight[1],
        error: errors.push("Invalid aeroplane type."),
      };
    }

    // 3. Validates seat capacities for economy, business, and first-class categories, ensuring booked seats do not exceed available seats.
    const categories = ["economy", "business", "first-class"];
    const seatIndices = [3, 4, 5];
    for (let i = 0; i < categories.length; i++) {
      const seatsTaken = parseInt(flight[seatIndices[i]]);
      const seatCapacity = parseInt(aeroplane[seatIndices[i]]);
      const totalSeatsTaken = seatIndices.reduce(
        (total, index) => total + parseInt(flight[index]),
        0
      );
      const totalSeatCapacity =
        parseInt(aeroplane[3]) +
        parseInt(aeroplane[4]) +
        parseInt(aeroplane[5]);

      if (seatCapacity === 0 && seatsTaken > 0) {
        errors.push(`${aeroplane[0]} doesn't have ${categories[i]} seats`);
      } else if (seatsTaken > seatCapacity) {
        errors.push(
          `Too many ${categories[i]} seats have been booked on this flight (${seatsTaken} > ${seatCapacity})`
        );
      } else if (
        seatsTaken > seatCapacity &&
        totalSeatsTaken > totalSeatCapacity
      ) {
        errors.push("Too many total seats booked on this flight");
      }
    }

    // 4. Checks if the aeroplane's flight range can cover the distance between airports.
    const distance =
      flight[0] === "MAN"
        ? parseFloat(destinationAirport[2])
        : parseFloat(destinationAirport[3]);
    const maxFlightRange = parseFloat(aeroplane[2]);
    if (distance > maxFlightRange) {
      errors.push(
        `${aeroplane[0]} doesn't have the range to fly to ${flight[1]}`
      );
      return {
        departure: flight[0],
        destination: flight[1],
        error: errors.join(" and "),
      };
    }

    // --- End of Validation Logic ---

    // If validations pass, calculates total income from seats booked and total costs based on distance and seat costs.
    // Calculates profit or loss by subtracting total costs from total income.
    // Returns an array of objects containing flight details or errors for each flight.
    if (errors.length > 0) {
      return {
        departure: flight[0],
        destination: flight[1],
        error: errors.join(", "),
      };
    } else {
      const totalIncome =
      flight[3] * flight[6] + flight[4] * flight[7] + flight[5] * flight[8];
      const totalSeatsTaken =
        parseInt(flight[3]) + parseInt(flight[4]) + parseInt(flight[5]);
      const totalCostPerSeat = parseFloat(
        aeroplane[1].replace("£", "") * (distance / 100)
      );
      const totalCost = (totalCostPerSeat * totalSeatsTaken).toFixed(2);
      const profitLoss = (totalIncome - parseFloat(totalCost)).toFixed(2);
      return {
        departure: flight[0],
        destination: flight[1],
        aircraftType: aeroplane[0],
        distance: `${distance} km`,
        profitLoss: `£${profitLoss}`,
      };
    }
  });
  return results;
}

const airportsData = readCsv("airports.csv");
const aeroplanesData = readCsv("aeroplanes.csv");
const flightData = readCsv("valid_flight_data.csv");
const invalidFlightData = readCsv("invalid_flight_data.csv");
const otherFlightData = readCsv("other_flight_data.csv");

// Process valid flights
if (airportsData && aeroplanesData && flightData) {
  const validFlightResults = flightDetails(
    airportsData,
    aeroplanesData,
    flightData
  );
  console.log("Valid Flight Results:", validFlightResults);
  const validFileDetail = validFlightResults
    .map((result) => {
      if (result.error) {
        return `Departure: ${result.departure}, Destination: ${result.destination}, Error: ${result.error}`;
      } else {
        return `Departure: ${result.departure}, Destination: ${result.destination}, Aircraft: ${result.aircraftType}, Distance: ${result.distance}, Profit/Loss: ${result.profitLoss}`;
      }
    })
    .join("\n");
  fs.writeFile("valid_flights_output.txt", validFileDetail, (err) => {
    if (err) throw err;
    console.log("Valid flight details written to valid_flights_output.txt");
  });
} else {
  console.error("Error: Unable to read one or more CSV files.");
}

// Process invalid flights
if (airportsData && aeroplanesData && invalidFlightData) {
  const invalidFlightResults = flightDetails(
    airportsData,
    aeroplanesData,
    invalidFlightData
  );
  console.log("Invalid Flight Results:", invalidFlightResults);
  const invalidFileDetail = invalidFlightResults
    .map((result) => {
      if (result.error) {
        return `Departure: ${result.departure}, Destination: ${result.destination}, Error: ${result.error}`;
      } else {
        // This should ideally not happen, but we'll handle it just in case
        return `Departure: ${result.departure}, Destination: ${result.destination}, Aircraft: ${result.aircraftType}, Distance: ${result.distance}, Profit/Loss: ${result.profitLoss}`;
      }
    })
    .join("\n");
  fs.writeFile("invalid_flights_output.txt", invalidFileDetail, (err) => {
    if (err) throw err;
    console.log("Invalid flight details written to invalid_flights_output.txt");
  });
} else {
  console.error("Error: Unable to read one or more CSV files.");
}
// Process other flights
if (airportsData && aeroplanesData && otherFlightData) {
  const otherFlightResults = flightDetails(
    airportsData,
    aeroplanesData,
    otherFlightData
  );
  console.log("Other Flight Results:", otherFlightResults);
  const otherFileDetail = otherFlightResults
    .map((result) => {
      if (result.error) {
        return `Departure: ${result.departure}, Destination: ${result.destination}, Error: ${result.error}`;
      } else {
        return `Departure: ${result.departure}, Destination: ${result.destination}, Aircraft: ${result.aircraftType}, Distance: ${result.distance}, Profit/Loss: ${result.profitLoss}`;
      }
    })
    .join("\n");
  fs.writeFile("other_flights_output.txt", otherFileDetail, (err) => {
    if (err) throw err;
    console.log("Other flight details written to other_flights_output.txt");
  });
} else {
  console.error("Error: Unable to read one or more CSV files.");
}
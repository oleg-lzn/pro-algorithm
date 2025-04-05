const fs = require("fs");
const path = require("path");
const haversine = require("haversine-distance");

function parseTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// Checker for rides overlap (without travel buffer)
// function ridesOverlap(ride1, ride2) {
//   const start1 = parseTime(ride1.date, ride1.startTime);
//   const end1 = parseTime(ride1.date, ride1.endTime);
//   const start2 = parseTime(ride2.date, ride2.startTime);
//   const end2 = parseTime(ride2.date, ride2.endTime);
//   return start1 < end2 && start2 < end1;
// }

// Travel time in hours based on haversine distance
function estimateTravelTime(fromCoord, toCoord, speedKmH = 60) {
  const distanceKm = haversine(fromCoord, toCoord) / 1000;
  return distanceKm / speedKmH;
}

// Cost calculation
function estimateCost(driver, ride, fromCoord) {
  const toStartKm = haversine(fromCoord, ride.startPoint_coords) / 1000;
  const rideKm = haversine(ride.startPoint_coords, ride.endPoint_coords) / 1000;
  const totalKm = toStartKm + rideKm;
  const travelTimeHr =
    (parseTime(ride.date, ride.endTime) -
      parseTime(ride.date, ride.startTime)) /
    3600000;
  return totalKm * driver.fuelCost + travelTimeHr * 30;
}

// Driver assigner
function assignDrivers(drivers, rides) {
  const assignments = [];
  const assignedRideIds = new Set();
  let totalCost = 0;

  for (const driver of drivers) {
    const driverRides = [];
    const availableRides = rides
      .filter(
        (r) =>
          !assignedRideIds.has(r._id) && r.numberOfSeats <= driver.numberOfSeats // check the places in the car
      )
      .sort(
        (a, b) =>
          parseTime(a.date, a.startTime) - parseTime(b.date, b.startTime)
      );

    let lastRide = null;
    let currentCoord = driver.city_coords;
    let lastRideEndTime = null;

    for (const ride of availableRides) {
      const rideStartTime = parseTime(ride.date, ride.startTime);

      if (lastRide) {
        // Estimate travel time from end of last ride to start of this ride
        const travelTimeHr = estimateTravelTime(
          lastRide.endPoint_coords,
          ride.startPoint_coords
        );
        const adjustedLastEndTime = new Date(
          lastRideEndTime.getTime() + travelTimeHr * 3600000
        );

        if (adjustedLastEndTime > rideStartTime) continue; // not enough time to get there
      }

      const cost = estimateCost(driver, ride, currentCoord);
      driverRides.push(ride._id);
      totalCost += cost;
      assignedRideIds.add(ride._id);
      lastRide = ride;
      lastRideEndTime = parseTime(ride.date, ride.endTime);
      currentCoord = ride.endPoint_coords;
    }

    if (driverRides.length > 0) {
      assignments.push({ driverId: driver.driverId, rideIds: driverRides });
    }
  }

  return { assignments, totalCost: Math.round(totalCost * 100) / 100 };
}

// Load files and run
function main() {
  const driversPath = path.join(__dirname, "drivers.json");
  const ridesPath = path.join(__dirname, "rides.json");
  const drivers = JSON.parse(fs.readFileSync(driversPath, "utf-8"));
  const rides = JSON.parse(fs.readFileSync(ridesPath, "utf-8"));
  const result = assignDrivers(drivers, rides);
  console.log(JSON.stringify(result, null, 2));
}

main();

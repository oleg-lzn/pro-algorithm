# pro-algorithm

Algorithm for rides assignment

# Start Instructions

You have to have nodeJS v.23.6.1 installed

1. Install havershine to calculate distances
   - npm install haversine-distance
2. Run the algorithm using
   - node algorithm.js

The algorithm:

- Ensures the driver's vehicle has enough seats for each ride
- Considers both the ride time and the travel time between rides
- Avoids assigning overlapping rides to the same driver
- Calculates cost per ride based on: Fuel usage (based on distance and driver's fuelCost)
- Time on the road (₪30/hour)
- Includes only drivers who have at least one assigned ride

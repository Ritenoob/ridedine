# RideNDine Simulator Guide

## Overview

The RideNDine simulator generates and processes 100 realistic orders through their complete lifecycle, from creation to delivery. It includes stores, drivers, routing logic, and real-time order progression.

## Features

### Order Lifecycle
Orders progress through these statuses:
1. **created** - Order placed
2. **accepted** - Restaurant accepts order
3. **preparing** - Being prepared
4. **ready** - Ready for pickup
5. **picked_up** - Driver has collected order
6. **en_route** - On the way to customer
7. **delivered** - Successfully delivered

### Stores
The simulator includes 5 stores around Hamilton, ON:
1. **Hoang Gia Pho** (Vietnamese) - The featured chef site integration
2. Mama's Kitchen (Italian)
3. Spice House (Indian)
4. Sushi Express (Japanese)
5. Burrito Bar (Mexican)

Each store has:
- Realistic menu items with prices
- Average preparation times (10-20 minutes)
- Geographic location in Hamilton

### Drivers
10 drivers with:
- Vehicle information
- Capacity (3-4 orders)
- Current location
- Assignment status
- Real-time positioning during deliveries

### Routing Logic
- **Haversine distance calculation** for straight-line distances
- **Road factor** (1.25-1.45x) to simulate actual roads
- **Speed profile** (25-40 km/h) for realistic travel times
- **Batching** - drivers can pick up multiple orders from same store
- **Progressive movement** - drivers gradually move along routes

## API Endpoints

### Initialization
```bash
POST /api/simulator/initialize
```
Initializes the simulator with stores and drivers.

### Generate Orders
```bash
POST /api/simulator/generate-orders
```
Generates 100 orders with staggered creation times.

Response:
```json
{
  "success": true,
  "message": "Generated 100 orders",
  "orderCount": 100
}
```

### Start Simulator
```bash
POST /api/simulator/start
Content-Type: application/json

{
  "speed": 5
}
```
Starts the simulator at specified speed (1x, 5x, 20x, etc.)

### Pause Simulator
```bash
POST /api/simulator/pause
```
Pauses the simulation.

### Reset Simulator
```bash
POST /api/simulator/reset
```
Resets all orders and simulation state.

### Get State
```bash
GET /api/simulator/state
```
Returns complete simulator state including:
- All orders
- All drivers with positions
- All stores
- KPIs (active orders, delivered, avg times, on-time %, driver utilization)

### Get Orders
```bash
GET /api/simulator/orders?status=en_route&storeId=store_hoang_gia_pho
```
Get filtered orders. Query params:
- `status` - Filter by order status
- `storeId` - Filter by store
- `driverId` - Filter by driver

### Get Specific Order
```bash
GET /api/simulator/orders/:orderId
```
Get details for a specific order.

### Get Drivers
```bash
GET /api/simulator/drivers
```
Get all drivers with their current status and positions.

### Get Stores
```bash
GET /api/simulator/stores
```
Get all stores with their metrics.

## Usage Examples

### Quick Start
```bash
# 1. Initialize
curl -X POST http://localhost:8080/api/simulator/initialize

# 2. Generate 100 orders
curl -X POST http://localhost:8080/api/simulator/generate-orders

# 3. Start at 5x speed
curl -X POST http://localhost:8080/api/simulator/start \
  -H "Content-Type: application/json" \
  -d '{"speed": 5}'

# 4. Check state
curl http://localhost:8080/api/simulator/state | jq '.kpis'
```

### Monitor Progress
```bash
# Watch orders in real-time (requires jq and watch)
watch -n 1 'curl -s http://localhost:8080/api/simulator/state | jq ".kpis"'
```

### Filter Orders
```bash
# Get all orders being prepared
curl http://localhost:8080/api/simulator/orders?status=preparing

# Get all orders from Hoang Gia Pho
curl http://localhost:8080/api/simulator/orders?storeId=store_hoang_gia_pho
```

## Dashboard Integration

The simulator is designed to integrate with the admin dashboard at `/admin/driver-simulator` and `/admin/operations`.

### KPIs Displayed
- **Active Orders** - Orders not yet delivered
- **Delivered Orders** - Successfully completed orders
- **Avg Prep Time** - Average time from created to ready
- **Avg Delivery Time** - Average total time from created to delivered
- **On-Time %** - Percentage meeting SLA target
- **Driver Utilization** - Percentage of drivers actively assigned

### Map Integration
The simulator provides real-time coordinates for:
- Store locations (fixed)
- Driver positions (updated during deliveries)
- Customer delivery locations
- Route visualization

### Controls UI
The admin portal should provide:
- **Generate 100 Orders** button
- **Start** button with speed selector (1x, 5x, 20x)
- **Pause** button
- **Reset** button
- **Step +30 seconds** button (for manual progression)

## Technical Details

### Time Simulation
- Simulator runs in accelerated time based on speed multiplier
- Updates occur every real second × speed
- Order progression based on simulated time elapsed

### Order Assignment
- Orders marked "ready" are automatically assigned to nearest available driver
- Drivers can batch orders from same store when capacity allows
- Route calculated as: driver location → store → delivery location

### Distance Calculation
```javascript
// Haversine formula for great-circle distance
distance = haversineDistance(lat1, lon1, lat2, lon2)
roadDistance = distance * roadFactor  // 1.25-1.45
travelTime = (roadDistance / speed) * 60  // minutes
```

### Order Distribution
- Creation times staggered over past hour
- Random customer locations within 5km of each store
- 1-3 items per order
- Realistic pricing with 13% HST (Ontario tax)

## Troubleshooting

### Orders not progressing
- Check if simulator is started: `GET /api/simulator/state` → `isRunning: true`
- Restart simulator: `POST /api/simulator/start`

### No drivers assigned
- Ensure orders reach "ready" status
- Check driver availability: `GET /api/simulator/drivers`
- Increase speed to accelerate time

### KPIs showing 0
- Orders need time to progress through lifecycle
- Use higher speed (5x or 20x) for faster results
- Check total orders count: `GET /api/simulator/orders`

## Best Practices

1. **Always initialize first** - Call `/initialize` before generating orders
2. **Use appropriate speeds** - 1x for demos, 5x for testing, 20x for quick validation
3. **Monitor KPIs** - Check `/state` endpoint regularly for metrics
4. **Reset between tests** - Use `/reset` to start fresh

## Integration with Frontend

Frontend components should poll `/api/simulator/state` every 1-2 seconds to update:
- Dashboard KPIs
- Map with driver positions
- Order tables
- Live status indicators

Use WebSockets or Server-Sent Events for production to avoid polling overhead.

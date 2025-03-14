-- name: RecordTrafficData :one
INSERT INTO traffic_data (
  sensor_id,
  timestamp,
  traffic_volume,
  average_speed,
  congestion_level
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetTrafficDataBySensor :many
SELECT * FROM traffic_data
WHERE sensor_id = $1
AND timestamp BETWEEN $2 AND $3
ORDER BY timestamp DESC;

-- name: GetLatestTrafficData :many
SELECT 
  td.*,
  s.latitude,
  s.longitude
FROM traffic_data td
JOIN sensors s ON td.sensor_id = s.sensor_id
WHERE td.timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY td.timestamp DESC
LIMIT $1;

-- name: GetTrafficAverages :one
SELECT 
  AVG(traffic_volume) as avg_volume,
  AVG(average_speed) as avg_speed,
  sensor_id
FROM traffic_data
WHERE sensor_id = $1
AND timestamp BETWEEN $2 AND $3
GROUP BY sensor_id;

-- name: GetHighCongestionAreas :many
SELECT 
  td.sensor_id,
  s.latitude,
  s.longitude,
  COUNT(*) as high_congestion_count
FROM traffic_data td
JOIN sensors s ON td.sensor_id = s.sensor_id
WHERE td.congestion_level = 'high'
AND td.timestamp BETWEEN $1 AND $2
GROUP BY td.sensor_id, s.latitude, s.longitude
ORDER BY high_congestion_count DESC
LIMIT $3;

-- name: GetDailyTrafficStats :many
SELECT
  DATE_TRUNC('day', timestamp) as day,
  sensor_id,
  AVG(traffic_volume) as avg_volume,
  MAX(traffic_volume) as max_volume,
  MIN(traffic_volume) as min_volume,
  AVG(average_speed) as avg_speed
FROM traffic_data
WHERE timestamp BETWEEN $1 AND $2
GROUP BY day, sensor_id
ORDER BY day, sensor_id;

-- name: GetSensorCongestionDistribution :many
SELECT
  sensor_id,
  congestion_level,
  COUNT(*) as count
FROM traffic_data
WHERE timestamp BETWEEN $1 AND $2
GROUP BY sensor_id, congestion_level
ORDER BY sensor_id, congestion_level;

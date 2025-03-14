-- name: CreateSensorType :one
INSERT INTO sensor_types (
  type_name,
  description
) VALUES (
  $1, $2
) RETURNING *;

-- name: GetSensorType :one
SELECT * FROM sensor_types
WHERE type_id = $1;

-- name: ListSensorTypes :many
SELECT * FROM sensor_types
ORDER BY type_name;

-- name: UpdateSensorType :one
UPDATE sensor_types
SET type_name = $2,
    description = $3
WHERE type_id = $1
RETURNING *;

-- name: DeleteSensorType :exec
DELETE FROM sensor_types
WHERE type_id = $1;

-- name: CreateSensor :one
INSERT INTO sensors (
  latitude,
  longitude,
  type_id,
  installation_date,
  status
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetSensor :one
SELECT 
  s.sensor_id,
  s.latitude,
  s.longitude,
  s.installation_date,
  s.status,
  st.type_name,
  st.description as type_description
FROM sensors s
JOIN sensor_types st ON s.type_id = st.type_id
WHERE s.sensor_id = $1;

-- name: ListSensors :many
SELECT 
  s.sensor_id,
  s.latitude,
  s.longitude,
  s.installation_date,
  s.status,
  st.type_name,
  st.description as type_description
FROM sensors s
JOIN sensor_types st ON s.type_id = st.type_id
ORDER BY s.sensor_id;

-- name: GetSensorsByType :many
SELECT 
  sensor_id,
  latitude,
  longitude,
  installation_date,
  status
FROM sensors
WHERE type_id = $1
ORDER BY sensor_id;

-- name: GetActiveSensors :many
SELECT 
  s.sensor_id,
  s.latitude,
  s.longitude,
  s.installation_date,
  s.status,
  st.type_name
FROM sensors s
JOIN sensor_types st ON s.type_id = st.type_id
WHERE s.status = 'active'
ORDER BY s.sensor_id;

-- name: UpdateSensorStatus :one
UPDATE sensors
SET status = $2
WHERE sensor_id = $1
RETURNING *;

-- name: DeleteSensor :exec
DELETE FROM sensors
WHERE sensor_id = $1;

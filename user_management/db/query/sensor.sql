
-- name: AddUserContribution :one
INSERT INTO user_contributed_sensors (
  user_id,
  service,
  service_sensor_id
) VALUES (
  $1, $2, $3
) RETURNING *;

-- name: GetUserContributions :many
SELECT * FROM user_contributed_sensors
WHERE user_id = $1
ORDER BY contributed_at DESC;

-- name: DeleteUserContribution :exec
DELETE FROM user_contributed_sensors
WHERE contribution_id = $1;

-- name: CountUserContributions :one
SELECT COUNT(*) FROM user_contributed_sensors
WHERE user_id = $1;

-- name: ListAllSensors :many
SELECT * FROM user_contributed_sensors
ORDER BY contributed_at DESC
LIMIT $1 OFFSET $2;

-- name: GetTotalSensorCount :one
SELECT COUNT(*) FROM user_contributed_sensors;
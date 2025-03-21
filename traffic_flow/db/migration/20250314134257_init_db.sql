-- +goose Up
-- +goose StatementBegin
CREATE TYPE "congestion_level_type" AS ENUM (
  'low',
  'moderate',
  'high'
);

CREATE TABLE "sensor_types" (
  "type_id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "type_name" varchar(20) UNIQUE NOT NULL,
  "description" varchar(100) DEFAULT ''
);

CREATE TABLE "sensors" (
  "sensor_id" INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "type_id" INT NOT NULL,
  "installation_date" DATE NOT NULL,
  "status" VARCHAR(10) NOT NULL DEFAULT 'active'
);

CREATE TABLE "traffic_data" (
  "sensor_id" int NOT NULL,
  "timestamp" timestamp NOT NULL,
  "traffic_volume" int NOT NULL,
  "average_speed" float NOT NULL,
  "congestion_level" congestion_level_type NOT NULL,
  PRIMARY KEY ("timestamp", "sensor_id")
);

ALTER TABLE "sensors" ADD FOREIGN KEY ("type_id") REFERENCES "sensor_types" ("type_id");
ALTER TABLE "traffic_data" ADD FOREIGN KEY ("sensor_id") REFERENCES "sensors" ("sensor_id");

SELECT create_hypertable('traffic_data', 'timestamp');

CREATE INDEX "traffic_data_sensor_id_idx" ON "traffic_data" ("sensor_id");
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS "traffic_data_sensor_id_idx";
ALTER TABLE "traffic_data" DROP CONSTRAINT "traffic_data_sensor_id_fkey";
DROP TABLE "traffic_data";
ALTER TABLE "sensors" DROP CONSTRAINT "sensors_type_id_fkey";
DROP TABLE "sensors";
DROP TABLE "sensor_types";
DROP TYPE "congestion_level_type";
-- +goose StatementEnd
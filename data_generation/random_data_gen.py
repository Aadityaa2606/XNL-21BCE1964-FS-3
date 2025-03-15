import requests
import json
import random
import time
from datetime import datetime, timedelta
import faker
import pandas as pd
import math  # Added for circular distribution calculations

# Initialize the Faker library for generating realistic data
fake = faker.Faker()

# Base URLs for the two services
BASE_USER_URL = "http://localhost:8080"
BASE_SENSOR_URL = "http://localhost:9090"

# File paths for storing data
USERS_FILE = "users_credentials.csv"
SENSOR_TYPES_FILE = "sensor_types.csv"
SENSORS_FILE = "sensors.csv"
CONTRIBUTIONS_FILE = "contributions.csv"

# Common headers
headers = {
    "Content-Type": "application/json"
}

def create_users(num_users=50):
    """Create users and save their credentials to a file"""
    print(f"Creating {num_users} users...")
    
    users = []
    for i in range(num_users):
        username = fake.user_name() + str(random.randint(100, 999))
        password = fake.password(length=10, special_chars=True)
        full_name = fake.name()
        email = fake.email()
        
        user_data = {
            "username": username,
            "password": password,
            "full_name": full_name,
            "email": email
        }
        
        try:
            response = requests.post(f"{BASE_USER_URL}/users", json=user_data, headers=headers)
            response.raise_for_status()
            created_user = response.json()
            
            user_record = {
                "user_id": created_user["user_id"],
                "username": username,
                "password": password,
                "full_name": full_name,
                "email": email,
                "created_at": created_user["created_at"]
            }
            users.append(user_record)
            print(f"Created user: {username} (ID: {created_user['user_id']})")
            time.sleep(0.1)
            
        except requests.exceptions.RequestException as e:
            print(f"Error creating user {username}: {e}")
    
    df = pd.DataFrame(users)
    df.to_csv(USERS_FILE, index=False)
    print(f"Saved {len(users)} users to {USERS_FILE}")
    return users

def create_sensor_types():
    """Create sensor types for different domains"""
    print("Creating sensor types for various domains...")
    
    domains_and_types = {
        "traffic-flow": [
            {"type_name": "loop_detector", "description": "Embedded wire loops that detect vehicles by electromagnetic induction"},
            {"type_name": "camera_vision", "description": "Computer vision cameras that count vehicles and track movement patterns"},
            {"type_name": "infrared_sensor", "description": "Thermal detection sensors that identify vehicle heat signatures"},
            {"type_name": "bluetooth_beacon", "description": "Detects Bluetooth devices in vehicles to measure travel times"},
            {"type_name": "radar_detector", "description": "Uses radar technology to count vehicles and measure speeds"}
        ],
        "air-quality": [
            {"type_name": "particulate_matter", "description": "Measures PM2.5 and PM10 concentrations in the air"},
            {"type_name": "ozone_monitor", "description": "Tracks ground-level ozone concentrations"},
            {"type_name": "no2_sensor", "description": "Measures nitrogen dioxide levels from vehicle emissions"},
            {"type_name": "co2_monitor", "description": "Tracks carbon dioxide levels in urban environments"},
            {"type_name": "voc_sensor", "description": "Detects volatile organic compounds in the air"}
        ],
        "power-consumption": [
            {"type_name": "smart_meter", "description": "Measures electricity consumption in real-time"},
            {"type_name": "grid_monitor", "description": "Monitors power loads across distribution networks"},
            {"type_name": "voltage_sensor", "description": "Detects voltage fluctuations in the power grid"},
            {"type_name": "load_balancer", "description": "Measures and reports on power distribution"},
            {"type_name": "renewable_integration", "description": "Monitors integration of renewable energy into the grid"}
        ],
        "water-levels": [
            {"type_name": "ultrasonic_level", "description": "Uses sound waves to measure water levels in reservoirs"},
            {"type_name": "pressure_transducer", "description": "Measures water depth through pressure differences"},
            {"type_name": "bubbler_system", "description": "Uses air pressure to determine water levels"},
            {"type_name": "radar_level", "description": "Uses radar to measure distance to water surface"},
            {"type_name": "float_gauge", "description": "Traditional float system for water level measurement"}
        ],
        "waste-management": [
            {"type_name": "fill_level", "description": "Ultrasonic sensors that monitor garbage bin fill levels"},
            {"type_name": "weight_sensor", "description": "Measures weight of waste in containers"},
            {"type_name": "chemical_detector", "description": "Monitors hazardous materials in waste streams"},
            {"type_name": "compaction_monitor", "description": "Measures effectiveness of waste compaction systems"},
            {"type_name": "sorting_efficiency", "description": "Monitors recycling sorting effectiveness"}
        ],
        "structural-integrity": [
            {"type_name": "strain_gauge", "description": "Measures deformation and strain in structures"},
            {"type_name": "vibration_sensor", "description": "Detects unusual vibrations in buildings and bridges"},
            {"type_name": "tilt_meter", "description": "Measures angular deviation from the horizontal or vertical"},
            {"type_name": "crack_monitor", "description": "Detects and measures growth of cracks in concrete structures"},
            {"type_name": "corrosion_sensor", "description": "Monitors corrosion rates in reinforced concrete"}
        ]
    }
    
    created_types = []
    
    for domain, sensor_types in domains_and_types.items():
        print(f"Creating sensor types for {domain}...")
        for sensor_type in sensor_types:
            try:
                response = requests.post(
                    f"{BASE_SENSOR_URL}/{domain}/sensor-types",
                    json=sensor_type,
                    headers=headers
                )
                response.raise_for_status()
                created_type = response.json()
                created_type["domain"] = domain
                created_types.append(created_type)
                print(f"Created {domain} sensor type: {sensor_type['type_name']} (ID: {created_type['type_id']})")
                time.sleep(0.1)
            except requests.exceptions.RequestException as e:
                print(f"Error creating sensor type {sensor_type['type_name']} for {domain}: {e}")
    
    df = pd.DataFrame(created_types)
    df.to_csv(SENSOR_TYPES_FILE, index=False)
    print(f"Saved {len(created_types)} sensor types to {SENSOR_TYPES_FILE}")
    return created_types

def create_sensors(sensor_types, num_sensors=50):
    """Create sensors at different locations within Bangalore, Karnataka, India"""
    print(f"Creating {num_sensors} sensors...")
    
    all_sensors = []
    
    # Define city center coordinates for Bangalore
    city_center = {
        "lat": 12.9716,  # Bangalore's latitude
        "lng": 77.5946   # Bangalore's longitude
    }
    
    # Calculate sensors per domain
    domains = list(set([st["domain"] for st in sensor_types]))
    sensors_per_domain = num_sensors // len(domains)
    remaining = num_sensors % len(domains)
    
    for domain in domains:
        domain_types = [st for st in sensor_types if st["domain"] == domain]
        domain_sensor_count = sensors_per_domain + (1 if remaining > 0 else 0)
        if remaining > 0:
            remaining -= 1
        print(f"Creating {domain_sensor_count} sensors for {domain}...")
        
        for i in range(domain_sensor_count):
            sensor_type = random.choice(domain_types)
            
            # Generate location within ~20 km radius of Bangalore city center
            theta = random.uniform(0, 2 * math.pi)  # Random angle in radians
            r = 20 * math.sqrt(random.uniform(0, 1))  # Random radius in km, uniform distribution
            delta_lat = (r * math.sin(theta)) / 111  # Convert km to degrees latitude
            delta_lng = (r * math.cos(theta)) / (111 * math.cos(math.radians(city_center["lat"])))  # Adjust for longitude
            
            sensor_data = {
                "latitude": city_center["lat"] + delta_lat,
                "longitude": city_center["lng"] + delta_lng,
                "type_id": sensor_type["type_id"],
                "installation_date": (datetime.now() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
                "status": random.choice(["active", "active", "active", "maintenance", "offline"])
            }
            
            try:
                response = requests.post(
                    f"{BASE_SENSOR_URL}/{domain}/sensors/",
                    json=sensor_data,
                    headers=headers
                )
                response.raise_for_status()
                created_sensor = response.json()
                created_sensor["domain"] = domain
                created_sensor["type_name"] = sensor_type["type_name"]
                all_sensors.append(created_sensor)
                print(f"Created {domain} sensor ID: {created_sensor['sensor_id']} of type: {sensor_type['type_name']}")
                time.sleep(0.1)
            except requests.exceptions.RequestException as e:
                print(f"Error creating sensor for {domain}: {e}")
    
    df = pd.DataFrame(all_sensors)
    df.to_csv(SENSORS_FILE, index=False)
    print(f"Saved {len(all_sensors)} sensors to {SENSORS_FILE}")
    return all_sensors

def create_contributions(users, sensors):
    """Create contribution entries linking sensors to users"""
    print("Creating contribution entries...")
    
    contributions = []
    
    for i, sensor in enumerate(sensors):
        user = users[i % len(users)]
        login_credentials = {"username": user["username"], "password": user["password"]}
        
        try:
            login_response = requests.post(
                f"{BASE_USER_URL}/users/login",
                json=login_credentials,
                headers=headers
            )
            login_response.raise_for_status()
            login_data = login_response.json()
            access_token = login_data["access_token"]
            
            auth_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            
            contribution_data = {
                "service": sensor["domain"].replace("-", "_"),
                "service_sensor_id": sensor["sensor_id"]
            }
            
            response = requests.post(
                f"{BASE_USER_URL}/sensors",
                json=contribution_data,
                headers=auth_headers
            )
            response.raise_for_status()
            contribution = response.json()
            contribution["username"] = user["username"]
            contribution["sensor_domain"] = sensor["domain"]
            contribution["sensor_type"] = sensor["type_name"]
            contributions.append(contribution)
            print(f"Created contribution: User {user['username']} contributed sensor {sensor['sensor_id']} from {sensor['domain']}")
            time.sleep(0.1)
        except requests.exceptions.RequestException as e:
            print(f"Error creating contribution for user {user['username']}, sensor {sensor['sensor_id']}: {e}")
    
    if contributions:
        df = pd.DataFrame(contributions)
        df.to_csv(CONTRIBUTIONS_FILE, index=False)
        print(f"Saved {len(contributions)} contributions to {CONTRIBUTIONS_FILE}")
    
    return contributions

def generate_traffic_records(sensors, num_records=100):
    """Generate random traffic records for traffic-flow sensors within a 2-3 hour time range"""
    print(f"Generating {num_records} traffic records...")
    
    traffic_sensors = [s for s in sensors if s["domain"] == "traffic-flow"]
    
    if not traffic_sensors:
        print("No traffic-flow sensors found. Please run create_sensors first.")
        return []
    
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=random.uniform(2, 3))
    
    VOLUME_RANGES = {
        "low": (10, 100),
        "moderate": (100, 350),
        "high": (350, 600),
        "very_high": (600, 900)
    }
    
    SPEED_RANGES = {
        "low": (5, 15),
        "moderate": (15, 35),
        "high": (35, 55),
        "very_high": (55, 75)
    }
    
    CONGESTION_LEVELS = ["none", "low", "moderate", "high", "severe"]
    CONGESTION_WEIGHTS = [0.1, 0.25, 0.4, 0.15, 0.1]
    
    records = []
    
    for i in range(num_records):
        sensor = random.choice(traffic_sensors)
        timestamp = start_time + timedelta(seconds=random.uniform(0, (end_time - start_time).total_seconds()))
        hour = timestamp.hour
        
        if (7 <= hour <= 9) or (16 <= hour <= 18):
            volume_categories = ["moderate", "high", "very_high"]
            volume_weights = [0.3, 0.5, 0.2]
            volume_range = random.choices(volume_categories, weights=volume_weights, k=1)[0]
            congestion_level = random.choices(CONGESTION_LEVELS, weights=[0.05, 0.15, 0.4, 0.3, 0.1], k=1)[0]
        else:
            volume_categories = ["low", "moderate", "high"]
            volume_weights = [0.3, 0.5, 0.2]
            volume_range = random.choices(volume_categories, weights=volume_weights, k=1)[0]
            congestion_level = random.choices(CONGESTION_LEVELS, weights=[0.2, 0.4, 0.3, 0.08, 0.02], k=1)[0]
        
        traffic_volume = random.randint(*VOLUME_RANGES[volume_range])
        
        if congestion_level in ["high", "severe"]:
            speed_range = random.choice(["low", "moderate"])
        elif congestion_level == "moderate":
            speed_range = random.choice(["moderate", "high"])
        else:
            speed_range = random.choice(["high", "very_high"])
            
        average_speed = round(random.uniform(*SPEED_RANGES[speed_range]), 1)
        
        traffic_data = {
            "sensor_id": sensor["sensor_id"],
            "traffic_volume": traffic_volume,
            "average_speed": average_speed,
            "congestion_level": congestion_level
        }
        
        try:
            response = requests.post(
                f"{BASE_SENSOR_URL}/traffic-flow/traffic/record",
                json=traffic_data,
                headers=headers
            )
            response.raise_for_status()
            created_record = response.json()
            created_record["sensor_type"] = sensor["type_name"]
            created_record["human_timestamp"] = created_record["timestamp"]
            records.append(created_record)
            print(f"Created traffic record for sensor {sensor['sensor_id']} at {created_record['timestamp']}")
            time.sleep(0.05)
        except requests.exceptions.RequestException as e:
            print(f"Error creating traffic record for sensor {sensor['sensor_id']}: {e}")
    
    if records:
        df = pd.DataFrame(records)
        df.to_csv("traffic_records.csv", index=False)
        print(f"Saved {len(records)} traffic records to traffic_records.csv")
    
    return records

def main():
    print("Starting Smart City data generation script...")
    
    users = create_users(100)
    sensor_types = create_sensor_types()
    sensors = create_sensors(sensor_types, 200)  # Increased to 200 sensors
    contributions = create_contributions(users, sensors)
    traffic_records = generate_traffic_records(sensors, 1000)
    
    print("\nData generation complete!")
    print(f"Created {len(users)} users")
    print(f"Created {len(sensor_types)} sensor types")
    print(f"Created {len(sensors)} sensors")
    print(f"Created {len(contributions)} contributions")
    print(f"Generated {len(traffic_records)} traffic records")

if __name__ == "__main__":
    main()
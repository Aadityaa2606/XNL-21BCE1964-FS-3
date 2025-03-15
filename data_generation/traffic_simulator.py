import requests
import json
import random
import time
import pandas as pd
import datetime
import signal
import sys
import os

# Base URL for the sensor service
BASE_SENSOR_URL = "http://localhost:9090"

# Headers for API requests
headers = {
    "Content-Type": "application/json"
}

class TrafficSimulator:
    def __init__(self, sensor_file="sensors.csv"):
        self.running = True
        self.sensor_file = sensor_file
        self.sensors = []
        self.load_sensors()
        self.configure_exit_handler()
        
        # Constants for traffic data
        self.VOLUME_RANGES = {
            "low": (10, 100),
            "moderate": (100, 350),
            "high": (350, 600),
            "very_high": (600, 900)
        }
        
        self.SPEED_RANGES = {
            "low": (5, 15),
            "moderate": (15, 35),
            "high": (35, 55),
            "very_high": (55, 75)
        }
        
        self.CONGESTION_LEVELS = ["none", "low", "moderate", "high", "severe"]
        
        # Log file for successful records
        self.log_file = "traffic_simulator_log.csv"
        self.init_log_file()

    def load_sensors(self):
        """Load sensors from CSV file"""
        try:
            if not os.path.exists(self.sensor_file):
                print(f"Error: {self.sensor_file} not found.")
                sys.exit(1)
                
            df = pd.read_csv(self.sensor_file)
            # Filter only traffic-flow sensors
            self.sensors = df[df['domain'] == 'traffic-flow'].to_dict('records')
            print(f"Loaded {len(self.sensors)} traffic-flow sensors from {self.sensor_file}")
            
            if not self.sensors:
                print("No traffic-flow sensors found in the CSV file.")
                sys.exit(1)
        except Exception as e:
            print(f"Error loading sensors: {e}")
            sys.exit(1)
    
    def init_log_file(self):
        """Initialize log file with headers if it doesn't exist"""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                f.write("timestamp,sensor_id,traffic_volume,average_speed,congestion_level,sensor_type\n")
    
    def log_record(self, record):
        """Log a successful record to the log file"""
        with open(self.log_file, 'a') as f:
            f.write(f"{record['timestamp']},{record['sensor_id']},{record['traffic_volume']},"
                   f"{record['average_speed']},{record['congestion_level']},{record['sensor_type']}\n")
    
    def configure_exit_handler(self):
        """Set up signal handler for graceful shutdown"""
        signal.signal(signal.SIGINT, self.exit_gracefully)
        signal.signal(signal.SIGTERM, self.exit_gracefully)
    
    def exit_gracefully(self, signum, frame):
        """Handle exit signals"""
        print("\nShutting down simulator...")
        self.running = False
    
    def generate_traffic_record(self):
        """Generate a single traffic record for a random sensor"""
        # Pick a random sensor
        sensor = random.choice(self.sensors)
        
        # Get current time
        now = datetime.datetime.now()
        hour = now.hour
        
        # Simulate rush hour patterns (7-9 AM and 4-6 PM tend to have higher volumes)
        if (7 <= hour <= 9) or (16 <= hour <= 18):
            volume_categories = ["moderate", "high", "very_high"]
            volume_weights = [0.3, 0.5, 0.2]
            volume_range = random.choices(volume_categories, weights=volume_weights, k=1)[0]
            
            congestion_level = random.choices(self.CONGESTION_LEVELS, weights=[0.05, 0.15, 0.4, 0.3, 0.1], k=1)[0]
        else:
            volume_categories = ["low", "moderate", "high"]
            volume_weights = [0.3, 0.5, 0.2]
            volume_range = random.choices(volume_categories, weights=volume_weights, k=1)[0]
            
            congestion_level = random.choices(self.CONGESTION_LEVELS, weights=[0.2, 0.4, 0.3, 0.08, 0.02], k=1)[0]
        
        # Generate traffic volume and speed based on congestion
        traffic_volume = random.randint(*self.VOLUME_RANGES[volume_range])
        
        # Speed is inversely correlated with congestion
        if congestion_level in ["high", "severe"]:
            speed_range = random.choice(["low", "moderate"])
        elif congestion_level == "moderate":
            speed_range = random.choice(["moderate", "high"])
        else:
            speed_range = random.choice(["high", "very_high"])
            
        average_speed = round(random.uniform(*self.SPEED_RANGES[speed_range]), 1)
        
        # Create traffic record data
        traffic_data = {
            "sensor_id": sensor["sensor_id"],
            "traffic_volume": traffic_volume,
            "average_speed": average_speed,
            "congestion_level": congestion_level
        }
        
        return traffic_data, sensor
    
    def send_traffic_record(self, traffic_data, sensor):
        """Send a traffic record to the API"""
        try:
            response = requests.post(
                f"{BASE_SENSOR_URL}/traffic-flow/traffic/record",
                json=traffic_data,
                headers=headers
            )
            response.raise_for_status()
            created_record = response.json()
            
            # Add sensor type for logging
            created_record["sensor_type"] = sensor["type_name"]
            
            self.log_record(created_record)
            
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Created traffic record for sensor {sensor['sensor_id']} "
                  f"({sensor['type_name']}): {traffic_data['traffic_volume']} vehicles, "
                  f"{traffic_data['average_speed']} mph, {traffic_data['congestion_level']} congestion")
            
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error sending traffic record: {e}")
            return False
    
    def run(self):
        """Run the traffic simulator until user quits"""
        print("Traffic Simulator started. Press Ctrl+C to quit.")
        print(f"Generating random traffic records for {len(self.sensors)} sensors...")
        
        records_sent = 0
        
        while self.running:
            try:
                # Generate and send a traffic record
                traffic_data, sensor = self.generate_traffic_record()
                success = self.send_traffic_record(traffic_data, sensor)
                
                if success:
                    records_sent += 1
                
                # Random delay between 1 and 60 seconds
                delay = random.uniform(1, 60)
                print(f"Waiting {delay:.1f} seconds until next record...")
                
                # Sleep in small increments to allow for quick response to exit signal
                sleep_time = 0
                while sleep_time < delay and self.running:
                    time.sleep(0.1)
                    sleep_time += 0.1
                
            except Exception as e:
                print(f"Unexpected error: {e}")
                time.sleep(5)  # Wait a bit before retrying
        
        print(f"Traffic Simulator stopped. Sent {records_sent} records.")

if __name__ == "__main__":
    simulator = TrafficSimulator()
    simulator.run()
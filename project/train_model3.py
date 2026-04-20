import pandas as pd
import json
import os
import time
from sklearn.ensemble import RandomForestClassifier

def start_simulation():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, 'smart_hvac_dataset3_5000.csv')
    
    output_dir = os.path.join(base_dir, 'frontend', 'public')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'venue_status.json')
    
    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    features = ['Temp', 'Humidity', 'CO2', 'Density', 'Airflow', 'People']
    X = df[features]
    y = df['Feedback']
    
    print("Training Random Forest Classifier on Feedback...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    print("Starting continuous 2-second simulation loop...")
    rooms = [
        {"id": "room-1", "name": "Room A", "capacity": 30},
        {"id": "room-2", "name": "Room B", "capacity": 25},
        {"id": "hall", "name": "Grand Hall", "capacity": 400},
        {"id": "room-3", "name": "Room C", "capacity": 50},
        {"id": "room-4", "name": "Room D", "capacity": 40}
    ]
    
    while True:
        for i in range(0, len(df) - 5, 5):
            sample_df = df.iloc[i : i+5]
            room_data = []
            
            for j, room in enumerate(rooms):
                row = sample_df.iloc[j]
                
                # Predict feedback
                X_pred = pd.DataFrame([row[features]], columns=features)
                pred_fb = model.predict(X_pred)[0]
                
                # Assign status logic based on action
                if pred_fb == 1:
                    action = "Decrease Temp ❄️"
                    status = "maintenance"
                    load_factor = 1.0
                elif pred_fb == -1:
                    action = "Increase Temp 🔥"
                    status = "inactive"
                    load_factor = 0.7
                else:
                    action = "Maintain 😊"
                    status = "active"
                    load_factor = 0.3
                    
                power_kw = round(row['ACUnits'] * row['ACCapacity'] * load_factor, 2)
                cost_hourly = round(power_kw * 0.15, 2)
                    
                room_data.append({
                    "id": room['id'],
                    "name": room['name'],
                    "capacity": room['capacity'],
                    "status": status,
                    "t_return": round(row['Temp'], 1),
                    "people": int(row['People']),
                    "density": round(row['Density'], 2),
                    "co2": int(row['CO2']),
                    "airflow": round(row['Airflow'], 2),
                    "action": action,
                    "power_kw": power_kw,
                    "cost_hourly": cost_hourly
                })
                
            # Write to JSON for Frontend
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump({"rooms": room_data}, f, indent=2, ensure_ascii=False)
                
            print(f"Updated JSON | Timestep {i // 5}")
            
            # Wait 2 seconds before the next room configuration
            time.sleep(2)

if __name__ == "__main__":
    start_simulation()

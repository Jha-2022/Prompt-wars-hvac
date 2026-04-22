import os
import json
import threading
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestClassifier

app = FastAPI(title="Smart HVAC AI API")

# Allow all origins (so Vercel frontend can talk to Railway backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Global state
model = None
df = None
current_index = 0
current_data = {"rooms": []}
lock = threading.Lock()

ROOMS = [
    {"id": "room-1", "name": "Room A", "capacity": 30},
    {"id": "room-2", "name": "Room B", "capacity": 25},
    {"id": "hall",   "name": "Grand Hall", "capacity": 400},
    {"id": "room-3", "name": "Room C", "capacity": 50},
    {"id": "room-4", "name": "Room D", "capacity": 40},
]

FEATURES = ['Temp', 'Humidity', 'CO2', 'Density', 'Airflow', 'People']


def build_room_data(sample_df):
    rooms_out = []
    for j, room in enumerate(ROOMS):
        row = sample_df.iloc[j]
        X_pred = pd.DataFrame([row[FEATURES]], columns=FEATURES)
        pred_fb = model.predict(X_pred)[0]

        if pred_fb == 1:
            action, status, load_factor = "Decrease Temp ❄️", "maintenance", 1.0
        elif pred_fb == -1:
            action, status, load_factor = "Increase Temp 🔥", "inactive", 0.7
        else:
            action, status, load_factor = "Maintain 😊", "active", 0.3

        power_kw    = round(row['ACUnits'] * row['ACCapacity'] * load_factor, 2)
        cost_hourly = round(power_kw * 0.15, 2)

        rooms_out.append({
            "id": room["id"],
            "name": room["name"],
            "capacity": room["capacity"],
            "status": status,
            "t_return": round(row["Temp"], 1),
            "people": int(row["People"]),
            "density": round(row["Density"], 2),
            "co2": int(row["CO2"]),
            "airflow": round(row["Airflow"], 2),
            "action": action,
            "power_kw": power_kw,
            "cost_hourly": cost_hourly,
        })
    return rooms_out


def background_loop():
    global current_index, current_data
    import time
    while True:
        with lock:
            i = current_index
            sample_df = df.iloc[i: i + 5]
            if len(sample_df) >= 5:
                current_data = {"rooms": build_room_data(sample_df)}
            current_index = (i + 5) % (len(df) - 5)
        time.sleep(2)


@app.on_event("startup")
def startup():
    global model, df
    base = os.path.dirname(__file__)
    csv_path = os.path.join(base, "smart_hvac_dataset3_5000.csv")
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    print("Training Random Forest Classifier...")
    X = df[FEATURES]
    y = df["Feedback"]
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    print("Model ready.")

    # Kick off background data-update thread
    t = threading.Thread(target=background_loop, daemon=True)
    t.start()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/venue_status")
def venue_status():
    with lock:
        return current_data

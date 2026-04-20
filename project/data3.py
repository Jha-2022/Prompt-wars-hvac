import pandas as pd
import time

# load dataset
df = pd.read_csv("smart_hvac_dataset3_5000.csv")

while True:
    for i in range(0, len(df), 5):  # step of 5 rows
        row_block = df.iloc[i:i+5]

        print("\n===== NEW TIME STEP =====\n")

        for j in range(len(row_block)):
            row = row_block.iloc[j]

            # get feedback for EACH row
            feedback = row["Feedback"]

            if feedback == 1:
                action = "Decrease Temperature ❄️"
            elif feedback == -1:
                action = "Increase Temperature 🔥"
            else:
                action = "Maintain 😊"

            print(
                f"Room {j+1} | "
                f"People: {row['People']} | "
                f"Density: {row['Density']} | "
                f"EntryRate: {row['EntryRate']} | "
                f"Temp: {row['Temp']} | "
                f"Humidity: {row['Humidity']} | "
                f"CO2: {row['CO2']} | "
                f"Airflow: {row['Airflow']} | "
                f"Time: {row['Time']} | "
                f"Session: {row['Session']} | "
                f"OutsideTemp: {row['OutsideTemp']} | "
                f"RoomSize: {row['RoomSize']} | "
                f"ACCapacity: {row['ACCapacity']} | "
                f"ACUnits: {row['ACUnits']} | "
                f"Feedback: {feedback}"
            )

            print(f"Action: {action}")
            print("-" * 50)

        time.sleep(2)  # simulate real-time
* VenueHub: Smart HVAC AI Monitoring Platform
VenueHub is a real-time, AI-driven facility monitoring dashboard designed to optimize HVAC (Heating, Ventilation, and Air Conditioning) systems. By leveraging machine learning, the platform predicts optimal climate control actions, monitors live room occupancy, and visualizes power consumption and operating costs across multiple venue spaces.

** 🌟 Key Features
AI-Powered Predictive Control: Utilizes a Random Forest Classifier to analyze room metrics (Temperature, Humidity, CO2, Density, Airflow, People) and predict the optimal HVAC action (Increase, Decrease, or Maintain).

Real-Time Facility Control Panel: A live grid displaying current status, capacity, AI metrics, and active HVAC actions for each room.

Live Trend Graphs: Real-time line charts tracking Temperature and CO2 levels using Recharts.

Power & Cost Analytics: Live breakdown of total power usage (kW) and estimated operating costs (₹/hr) for the entire facility and individual rooms.

Dynamic Occupancy Tracking: Visualized via a live updating pie chart in the sidebar.

🛠️ Tech Stack
Frontend

React 19

Vite

Recharts (Data Visualization)

JavaScript / JSX / CSS

Backend / AI Simulation

Python 3

Pandas (Data Manipulation)

Scikit-Learn (Random Forest Classifier)

🏗️ Architecture & Data Flow
AI Engine (train_model3.py): Trains a model on smart_hvac_dataset3_5000.csv. It runs a continuous simulation loop, predicting feedback for 5 rooms at a time.

Data Bridge: The Python script calculates power, costs, and actions, then writes this data every 2 seconds to frontend/public/venue_status.json.

Frontend (dashboard.jsx): The React application fetches the updated venue_status.json every 2 seconds, dynamically updating the UI components, graphs, and pricing models without requiring page reloads.

🚀 Getting Started
To run the full stack on your local machine, you need to start both the Python simulation and the React development server.

Prerequisites
Node.js & npm

Python 3.x

Pip packages: pandas, scikit-learn

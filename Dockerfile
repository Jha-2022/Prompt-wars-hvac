# Stage 1: Build the Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/project/frontend
COPY project/frontend/package*.json ./
RUN npm install
COPY project/frontend/ ./
RUN npm run build

# Stage 2: Final Run Environment
FROM python:3.9-slim

# Install system dependencies and Node.js for the frontend preview
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies required for train_model3.py
RUN pip install --no-cache-dir pandas scikit-learn

# Copy the entire project
COPY . .

# Copy built frontend assets from the first stage
COPY --from=frontend-builder /app/project/frontend/dist ./project/frontend/dist

# Expose the port for the Vite preview
EXPOSE 4173

# Run the simulation and the frontend preview simultaneously
CMD python3 project/train_model3.py & cd project/frontend && npm run preview -- --host

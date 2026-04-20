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

# Copy Python requirements and install
# Note: Since there is no requirements.txt, we install manually based on imports
RUN pip install --no-cache-dir pandas scikit-learn

# Copy the entire project
COPY . .

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/project/frontend/dist ./project/frontend/dist

# Expose the port the frontend will run on (Vite preview defaults to 4173)
EXPOSE 4173

# Start both the simulation script and the frontend preview
# Using a shell to run both processes
CMD python3 project/train_model3.py & cd project/frontend && npm run preview -- --host

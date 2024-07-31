#!/bin/bash

# Run Docker Compose to start Neo4j and Fuseki
docker-compose up -d

# Navigate to the backend directory
cd backend

# Set the FLASK_APP environment variable
export FLASK_APP=app.py

# Activate the virtual environment
source venv/bin/activate

# pasue to allow the docker images to start
pasue 5

# Run the Flask app
flask run

# Navigate back to the top-level directory
cd ..

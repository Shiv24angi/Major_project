# Production Dockerfile for Agent 6 FastAPI Backend
FROM python:3.11-slim


# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system build dependencies if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# Ensure storage directory exists
RUN mkdir -p storage/agent6_outputs

# Expose default port
EXPOSE 8000

# Run FastAPI app with dynamic port binding for cloud hosts (Render, Railway, Cloud Run)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

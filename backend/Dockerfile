# LITMUS backend (FastAPI) — local Docker only, prod stays on Render.
# Build: docker build -t litmus-backend ./backend
# Run:   docker run -p 8000:8000 --env-file backend/.env backend image
# Start inside: uvicorn main:app --host 0.0.0.0 --port $PORT (root: backend/)
FROM python:3.12-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

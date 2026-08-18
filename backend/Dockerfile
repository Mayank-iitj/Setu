FROM python:3.10-slim

WORKDIR /app

# OR-Tools needs a C++ runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends g++ && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY data/ ./data/

EXPOSE 8000

CMD ["uvicorn", "backend.src.main:app", "--host", "0.0.0.0", "--port", "8000"]

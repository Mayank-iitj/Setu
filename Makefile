.PHONY: all up down seed simulate dev setup

setup:
	cp .env.example .env
	python -m venv venv
	./venv/Scripts/pip install -r backend/requirements.txt
	cd frontend && npm install

up:
	docker compose up -d

down:
	docker compose down -v

seed:
	@echo "Seeding synthetic network..."
	./venv/Scripts/python scripts/seed.py

simulate:
	@echo "Starting simulator..."
	./venv/Scripts/python scripts/simulate.py

dev:
	@echo "Starting development servers..."
	# In windows, we can run them in background or use a runner like honcho/foreman.
	# For simplicity here we just print instructions or run them sequentially.
	start ./venv/Scripts/uvicorn backend.src.main:app --reload --port 8000
	cd frontend && start npm run dev

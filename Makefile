.PHONY: setup dev api web test bench down clean

VENV := ./venv/bin

setup:
	cp -n .env.example .env || true
	python3 -m venv venv
	$(VENV)/pip install --upgrade pip
	$(VENV)/pip install -r backend/requirements.txt
	cd frontend && npm install

api:
	$(VENV)/uvicorn backend.src.main:app --reload --port 8000

web:
	cd frontend && npm run dev

dev:
	@echo "Run 'make api' and 'make web' in two terminals."

test:
	$(VENV)/pytest backend/tests

bench:
	$(VENV)/python -m backend.src.engine.benchmarks.cli C101

down:
	docker compose down -v

clean:
	rm -rf venv frontend/node_modules

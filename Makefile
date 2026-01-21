PYTHON = python3
CLI = src/aloud/cli.py
API_APP = aloud.api:app
API_HOST = 0.0.0.0
API_PORT = 8000
FRONTEND_PORT = 19006
FRONTEND_DIR = frontend
NPM = npm
ARCH_DIR = architecture
ARCH_DIAGRAM = $(ARCH_DIR)/diagram.mmd
ARCH_PNG = $(ARCH_DIR)/diagram.png
MMD_CLI = ./frontend/node_modules/.bin/mmdc
PYTEST = $(PYTHON) -m pytest
BLACK = $(PYTHON) -m black
RUFF = $(PYTHON) -m ruff
BUILD = $(PYTHON) -m build
IP_CMD = $(PYTHON) -c "import socket; ip='127.0.0.1'; sock=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); \
sock.connect(('8.8.8.8', 80)); ip=sock.getsockname()[0]; sock.close(); print(ip)"

.PHONY: install install-dev build test format lint deploy dev frontend-install frontend-web frontend-start clean run list-voices architecture-png

install:
	$(PYTHON) -m pip install -e .

install-dev:
	$(PYTHON) -m pip install -e .[dev]

build:
	$(BUILD)

test:
	$(PYTEST)

format:
	$(BLACK) src tests

lint:
	$(RUFF) check src tests

deploy:
	@IP=$$($(IP_CMD)); \
	echo "API: http://$${IP}:$(API_PORT)"; \
	echo "Frontend (Expo web): http://$${IP}:$(FRONTEND_PORT)"; \
	$(PYTHON) -m uvicorn $(API_APP) --host $(API_HOST) --port $(API_PORT)

dev:
	@IP=$$($(IP_CMD)); \
	echo "API: http://$${IP}:$(API_PORT)"; \
	echo "Frontend (Expo web): http://$${IP}:$(FRONTEND_PORT)"; \
	trap 'kill $$API_PID' INT TERM EXIT; \
	$(PYTHON) -m uvicorn $(API_APP) --host $(API_HOST) --port $(API_PORT) & \
	API_PID=$$!; \
	EXPO_PUBLIC_API_BASE_URL=http://$${IP}:$(API_PORT) $(NPM) --prefix $(FRONTEND_DIR) run web

frontend-install:
	$(NPM) --prefix $(FRONTEND_DIR) install

frontend-web:
	$(NPM) --prefix $(FRONTEND_DIR) run web

frontend-start:
	$(NPM) --prefix $(FRONTEND_DIR) run start

clean:
	rm -rf build dist *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +

# Shortcuts for testing without installing
run:
	$(PYTHON) $(CLI) $(ARGS)

list-voices:
	$(PYTHON) $(CLI) --list-voices

architecture-png:
	$(MMD_CLI) -i $(ARCH_DIAGRAM) -o $(ARCH_PNG)

PYTHON = python3
CLI = src/aloud/cli.py
API_APP = aloud.api:app
API_HOST = 0.0.0.0
API_PORT = 8000
ARCH_DIR = architecture
ARCH_DIAGRAM = $(ARCH_DIR)/diagram.mmd
ARCH_PNG = $(ARCH_DIR)/diagram.png
MMD_CLI = ./frontend/node_modules/.bin/mmdc
PYTEST = $(PYTHON) -m pytest
BLACK = $(PYTHON) -m black
RUFF = $(PYTHON) -m ruff
BUILD = $(PYTHON) -m build

.PHONY: install install-dev build test format lint deploy clean run list-voices architecture-png

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
	$(PYTHON) -m uvicorn $(API_APP) --host $(API_HOST) --port $(API_PORT)

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

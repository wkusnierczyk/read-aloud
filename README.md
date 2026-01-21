````markdown
# Aloud CLI

A native command-line tool to read text, files, or websites aloud using your system's TTS engine.

## Installation

You can install this tool locally in editable mode.

```bash
# From the project root
pip install -e .
```

## Usage

Once installed, you can use the command `aloud` from anywhere in your terminal.

### 1. Read a Website
```bash
aloud --url https://example.com
```

### 2. Read a File
```bash
aloud --file notes.txt
```

### 3. Read Direct Text
```bash
aloud "Hello, this is a test."
```

### 4. Piped Input
```bash
echo "Piping works too" | aloud
```

### Configuration

* **Change Speed:** Use `--speed` (e.g., `0.8` for slow, `1.5` for fast).
    ```bash
    aloud --url https://example.com --speed 1.25
    ```
* **Change Voice:** Use `--voice` with a name or ID.
    ```bash
    # First, list available voices
    aloud --list-voices
    
    # Then use a unique part of the name
    aloud --url https://example.com --voice "Zira"
    ```
````
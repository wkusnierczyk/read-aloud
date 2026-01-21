# Read Aloud

Read Aloud is a BWYN (Buiild What You Need0 convenience mini-project exposing text-to-speech facilty as a CLI, a service, and a GUI.

It reads text or websites aloud by driving the platform-native speech commands
(`say`, `System.Speech`, `espeak`).
When those are not available, `pyttsx3` is used as a fallback. 

Includes:
- Core library (`aloud.core`)
- CLI (`aloud.cli`)
- API service (`aloud.api`)
- React Native (Expo) frontend

## Architecture

![Architecture diagram](architecture/diagram.png)

## Install

```sh
pip install -e .

# or
make install
```

Develoopment tools:

```sh
pip install -e .[dev]

# or
make install-dev
```

## CLI

The CLI provides convenience options to read from a URL, from local file, or directly from an argument or `stdin`.

```sh
aloud --url https://example.com
aloud --file notes.txt
aloud "Hello, this is a test."
echo "Piping works too" | aloud
```

Voide options:

```sh
aloud --list-voices
aloud --url https://example.com --voice "Alex" --speed 1.2
```

## API

Run:

```sh
python3 -m uvicorn aloud.api:app --reload

# or
make backend-run
```

The API provides several endpoints.

| Endpoint      | Description                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /health` | Health check.                                                                                           |
| `GET /voices` | List available voices.                                                                                  |
| `POST /read`  | Read text or URL; body: `{ "text": "...", "voice": "...", "speed": 1.0 }` or `{ "url": "..." }`.        |
| `POST /stop`  | Stop current reading.                                                                                   |

Only one of `text` or `url` is allowed per request.

## Frontend (Expo)

Install dependencies:

```sh
make frontend-install
```

Run web UI:

```sh
make fullstack-run
```

The web UI appears at `http://localhost:19006` by default.

# About

```bash
$ aloud --about

aloud: A CLI tool to read text or websites aloud.
├─ version:    0.1.1
├─ developer:  mailto:you@example.com
├─ source:     https://github.com/wkusnierczyk/read-aloud
└─ licence:    MIT https://opensource.org/licenses/MIT
```


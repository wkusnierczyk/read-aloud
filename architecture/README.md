# Architecture

This repo is organized into a core library, a CLI, an API service, and a
React Native frontend.

```mermaid
flowchart LR
    subgraph Local["Local Environment"]
        Core["Core Library\n(aloud.core)"]
        CLI["CLI\n(aloud.cli)"]
        API["API Service\n(aloud.api)"]
        Frontend["Frontend\n(React Native / Expo)"]
    end

    TTS["Native TTS\n(macOS say / Windows System.Speech / espeak)"]
    Fallback["pyttsx3\n(optional)"]
    Net["HTTP / JSON"]

    CLI --> Core
    API --> Core
    Frontend -->|POST /read| Net --> API
    Core --> TTS
    Core --> Fallback
```

## Render to PNG

Install Mermaid CLI once (from the repo root):

```sh
npm install --prefix frontend @mermaid-js/mermaid-cli
```

Then render:

```sh
make architecture-png
```

Output: `architecture/diagram.png`

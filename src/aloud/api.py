import threading
from typing import Optional
from importlib import metadata

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from aloud.core import AloudEngine, ContentFetcher, PlaybackHandle


def _package_version() -> str:
    try:
        return metadata.version("aloud")
    except metadata.PackageNotFoundError:
        return "unknown"


app = FastAPI(title="Aloud API", version=_package_version())
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_playback_lock = threading.Lock()
_current_playback = None


class ReadRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None
    voice: Optional[str] = None
    speed: float = 1.0


def _resolve_text(payload: ReadRequest) -> str:
    if bool(payload.text) == bool(payload.url):
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one of 'text' or 'url'.",
        )

    if payload.url:
        fetcher = ContentFetcher()
        content = fetcher.fetch(payload.url, is_url=True)
        if content.startswith("Error fetching URL:"):
            raise HTTPException(status_code=400, detail=content)
        return content

    return payload.text or ""


def _set_playback(handle: Optional[PlaybackHandle]) -> None:
    global _current_playback
    with _playback_lock:
        if _current_playback:
            _current_playback.stop()
        _current_playback = handle


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/voices")
def voices() -> dict:
    engine = AloudEngine()
    return {"voices": engine.get_voices()}


@app.post("/read")
def read(payload: ReadRequest) -> dict:
    text = _resolve_text(payload)
    engine = AloudEngine()
    engine.load_text(text).set_properties(
        voice_name=payload.voice,
        speed_multiplier=payload.speed,
    )
    handle = engine.speak_async()
    _set_playback(handle)
    return {"status": "started"}


@app.post("/stop")
def stop() -> dict:
    _set_playback(None)
    return {"status": "stopped"}

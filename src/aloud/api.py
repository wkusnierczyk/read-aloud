from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from aloud.core import AloudEngine, ContentFetcher


app = FastAPI(title="Aloud API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def _run_read(text: str, voice: Optional[str], speed: float) -> None:
    engine = AloudEngine()
    engine.load_text(text).set_properties(
        voice_name=voice, speed_multiplier=speed
    ).speak()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/voices")
def voices() -> dict:
    engine = AloudEngine()
    return {"voices": engine.get_voices()}


@app.post("/read")
def read(payload: ReadRequest, background_tasks: BackgroundTasks) -> dict:
    text = _resolve_text(payload)
    background_tasks.add_task(_run_read, text, payload.voice, payload.speed)
    return {"status": "started"}

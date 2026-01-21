import pytest

from aloud.api import _resolve_text, ReadRequest


def test_resolve_text_requires_exactly_one_field():
    with pytest.raises(Exception):
        _resolve_text(ReadRequest())
    with pytest.raises(Exception):
        _resolve_text(ReadRequest(text="hi", url="https://example.com"))


def test_resolve_text_accepts_text():
    payload = ReadRequest(text="hello")
    assert _resolve_text(payload) == "hello"

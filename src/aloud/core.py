import json
import shutil
import sys
import subprocess

import pyttsx3
import requests
from bs4 import BeautifulSoup

class ContentFetcher:
    """Handles data retrieval from various sources."""
    
    def fetch(self, source, is_url=False):
        if is_url:
            return self._fetch_url(source)
        return source # Treat as raw text if not URL

    def _fetch_url(self, url):
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts and styles
            for script in soup(["script", "style", "nav", "footer"]):
                script.decompose()
                
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return clean_text
        except Exception as e:
            return f"Error fetching URL: {str(e)}"

class AloudEngine:
    """Fluent API wrapper for TTS."""
    
    def __init__(self):
        self._engine = None
        self._init_error = None
        try:
            self._engine = pyttsx3.init()
        except Exception as exc:
            self._init_error = exc
        self._text = ""
        self._voice_name = None
        self._speed_multiplier = 1.0

    def _raise_init_error(self):
        message = (
            "TTS engine unavailable. On macOS, install pyobjc (or reinstall with "
            "`pip install -e .`) to enable pyttsx3."
        )
        if self._init_error:
            message = f"{message}\nOriginal error: {self._init_error}"
        raise RuntimeError(message)

    def _get_voices_macos(self):
        try:
            result = subprocess.run(
                ["say", "-v", "?"],
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError:
            self._raise_init_error()
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"Failed to list voices via 'say': {exc}") from exc

        voices = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            left, _, sample = line.partition("#")
            left = left.rstrip()
            sample = sample.strip()
            parts = left.split()
            if len(parts) < 2:
                continue
            locale = parts[-1]
            name = " ".join(parts[:-1])
            voices.append(
                {"id": name, "name": name, "locale": locale, "sample": sample}
            )
        return voices

    def _get_voices_linux(self):
        voice_cmd = None
        for candidate in ("espeak-ng", "espeak"):
            if shutil.which(candidate):
                voice_cmd = candidate
                break
        if not voice_cmd:
            raise RuntimeError(
                "TTS engine unavailable. Install 'espeak' or 'espeak-ng' "
                "to list voices on Linux."
            )
        try:
            result = subprocess.run(
                [voice_cmd, "--voices"],
                check=True,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"Failed to list voices via '{voice_cmd}': {exc}") from exc

        voices = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line or line.startswith("Pty"):
                continue
            parts = line.split()
            if len(parts) < 4:
                continue
            locale = parts[1]
            name = parts[3]
            voices.append({"id": name, "name": name, "locale": locale})
        return voices

    def _get_voices_windows(self):
        powershell = shutil.which("pwsh") or shutil.which("powershell")
        if not powershell:
            raise RuntimeError(
                "TTS engine unavailable. PowerShell is required to list voices on Windows."
            )
        command = (
            "Add-Type -AssemblyName System.Speech; "
            "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo } | "
            "Select-Object Name,Culture,Id | ConvertTo-Json -Compress"
        )
        try:
            result = subprocess.run(
                [powershell, "-NoProfile", "-Command", command],
                check=True,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as exc:
            raise RuntimeError("Failed to list voices via PowerShell.") from exc

        try:
            payload = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Failed to parse voice list from PowerShell.") from exc

        voices = []
        if isinstance(payload, dict):
            payload = [payload]
        for item in payload:
            name = item.get("Name", "")
            locale = item.get("Culture", "")
            voice_id = item.get("Id", "") or name
            voices.append(
                {"id": name or voice_id, "name": name, "locale": locale, "voice_id": voice_id}
            )
        return voices

    def load_text(self, text):
        self._text = text
        return self

    def set_properties(self, voice_name=None, speed_multiplier=1.0):
        self._voice_name = voice_name
        self._speed_multiplier = speed_multiplier
        if not self._engine:
            return self
        # Handle Speed
        current_rate = self._engine.getProperty('rate')
        new_rate = int(current_rate * speed_multiplier)
        self._engine.setProperty('rate', new_rate)

        # Handle Voice Selection
        if voice_name:
            voices = self._engine.getProperty('voices')
            for voice in voices:
                # Fuzzy match: if provided name is in the voice ID or name
                if voice_name.lower() in voice.name.lower() or voice_name in voice.id:
                    self._engine.setProperty('voice', voice.id)
                    break
        return self

    def get_voices(self):
        if not self._engine:
            if sys.platform == "darwin":
                return self._get_voices_macos()
            if sys.platform.startswith("linux"):
                return self._get_voices_linux()
            if sys.platform.startswith("win"):
                return self._get_voices_windows()
            self._raise_init_error()

        voices = []
        for v in self._engine.getProperty('voices'):
            locale = ""
            if getattr(v, "languages", None):
                raw_locale = v.languages[0]
                if isinstance(raw_locale, bytes):
                    locale = raw_locale.decode("utf-8", errors="ignore")
                else:
                    locale = str(raw_locale)
            voices.append({"id": v.id, "name": v.name, "locale": locale})
        return voices

    def list_voices(self):
        voices = self.get_voices()
        print(f"{'ID':<30} | {'Locale':<10} | {'Name'}")
        print("-" * 80)
        for v in voices:
            print(f"{v['id']:<30} | {v.get('locale',''):<10} | {v['name']}")
        return self

    def speak(self):
        if not self._text:
            return self
        if not self._engine:
            if sys.platform == "darwin":
                return self._speak_macos()
            if sys.platform.startswith("linux"):
                return self._speak_linux()
            if sys.platform.startswith("win"):
                return self._speak_windows()
            self._raise_init_error()

        print("Reading aloud... (Press Ctrl+C to stop)")
        self._engine.say(self._text)
        self._engine.runAndWait()
        return self

    def _speak_macos(self):
        cmd = ["say"]
        if self._voice_name:
            cmd.extend(["-v", self._voice_name])
        if self._speed_multiplier and self._speed_multiplier != 1.0:
            rate = max(80, int(200 * self._speed_multiplier))
            cmd.extend(["-r", str(rate)])
        cmd.append(self._text)
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"Failed to speak via 'say': {exc}") from exc
        return self

    def _speak_linux(self):
        voice_cmd = None
        for candidate in ("espeak-ng", "espeak"):
            if shutil.which(candidate):
                voice_cmd = candidate
                break
        if not voice_cmd:
            self._raise_init_error()

        cmd = [voice_cmd]
        if self._voice_name:
            cmd.extend(["-v", self._voice_name])
        if self._speed_multiplier and self._speed_multiplier != 1.0:
            rate = max(80, int(175 * self._speed_multiplier))
            cmd.extend(["-s", str(rate)])
        cmd.append(self._text)
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"Failed to speak via '{voice_cmd}': {exc}") from exc
        return self

    def _speak_windows(self):
        powershell = shutil.which("pwsh") or shutil.which("powershell")
        if not powershell:
            self._raise_init_error()

        command = (
            "Add-Type -AssemblyName System.Speech; "
            "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$text = [Console]::In.ReadToEnd(); "
        )
        if self._voice_name:
            command += f"$synth.SelectVoice('{self._voice_name}'); "
        if self._speed_multiplier and self._speed_multiplier != 1.0:
            rate = int(round((self._speed_multiplier - 1.0) * 5))
            rate = max(-10, min(10, rate))
            command += f"$synth.Rate = {rate}; "
        command += "$synth.Speak($text);"

        try:
            subprocess.run(
                [powershell, "-NoProfile", "-Command", command],
                check=True,
                input=self._text,
                text=True,
            )
        except subprocess.CalledProcessError as exc:
            raise RuntimeError("Failed to speak via PowerShell.") from exc
        return self

import os
import sys

def fix_dependencies():
    # 1. Verify we are in the project root
    if not os.path.exists("pyproject.toml"):
        print("Error: 'pyproject.toml' not found.")
        print("Please run this script from the root of the 'aloud_cli' project directory.")
        sys.exit(1)

    # 2. Define the corrected content with macOS support
    toml_content = '''[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "aloud"
version = "0.1.1"
description = "A CLI tool to read text or websites aloud."
authors = [{name = "Your Name", email = "you@example.com"}]
dependencies = [
    "pyttsx3>=2.90",
    "requests",
    "beautifulsoup4",
    "pyobjc; sys_platform == 'darwin'"
]
requires-python = ">=3.9"

[project.scripts]
aloud = "aloud.cli:main"
'''

    # 3. Overwrite the file
    try:
        with open("pyproject.toml", "w") as f:
            f.write(toml_content)
        print("✅ Successfully updated pyproject.toml with macOS dependencies.")
        print("   (Added 'pyobjc' for darwin/macOS systems)")
    except Exception as e:
        print(f"❌ Failed to write file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_dependencies()
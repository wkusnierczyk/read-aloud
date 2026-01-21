import argparse
import sys
from aloud.core import AloudEngine, ContentFetcher


def main():
    parser = argparse.ArgumentParser(description="Read text or websites aloud.")

    # Input group: either raw text, a file, or a URL
    group = parser.add_mutually_exclusive_group()
    group.add_argument("text", nargs="?", help="Text to read directly")
    group.add_argument("--url", "-u", help="URL to scrape and read")
    group.add_argument("--file", "-f", help="Text file to read")

    # Configuration
    parser.add_argument("--voice", "-v", help="Name or ID of the voice to use")
    parser.add_argument(
        "--speed",
        "-s",
        type=float,
        default=1.0,
        help="Speed multiplier (e.g., 1.5 for 1.5x speed)",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="List available system voices and exit",
    )

    args = parser.parse_args()
    engine = AloudEngine()

    # 1. Handle "List Voices" command
    if args.list_voices:
        engine.list_voices()
        sys.exit(0)

    # 2. Determine Content
    fetcher = ContentFetcher()
    content = ""

    if args.url:
        print(f"Fetching content from: {args.url}")
        content = fetcher.fetch(args.url, is_url=True)
    elif args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Error: File '{args.file}' not found.")
            sys.exit(1)
    elif args.text:
        content = args.text
    else:
        # Check if piped input exists (e.g. echo "hello" | aloud)
        if not sys.stdin.isatty():
            content = sys.stdin.read()
        else:
            parser.print_help()
            sys.exit(0)

    # 3. Execute Fluent Chain
    engine.load_text(content).set_properties(
        voice_name=args.voice, speed_multiplier=args.speed
    ).speak()


if __name__ == "__main__":
    main()

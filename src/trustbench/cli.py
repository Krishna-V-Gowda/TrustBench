from __future__ import annotations

import argparse
import json
from pathlib import Path

from .cases import run_apex_suite
from .reporting import write_json, write_markdown


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="trustbench",
        description="Executable differential verification for analytical systems.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    verify = subparsers.add_parser(
        "verify-apex", help="Verify exact functions extracted from an Apex app.js file."
    )
    verify.add_argument("--source", type=Path, required=True, help="Path to assets/js/app.js")
    verify.add_argument(
        "--output", type=Path, default=Path("evidence/reports"), help="Output directory"
    )
    verify.add_argument(
        "--adapter",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "adapters" / "apex_runtime.mjs",
        help="Path to the Node exact-source adapter",
    )
    verify.add_argument(
        "--fail-on",
        choices=("never", "failure", "high"),
        default="never",
        help="Optional CI policy. Report generation defaults to a zero exit status.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "verify-apex":
        report = run_apex_suite(args.source, args.adapter)
        args.output.mkdir(parents=True, exist_ok=True)
        stem = f"apex-{report.subject_sha256[:12]}"
        json_path = args.output / f"{stem}.json"
        markdown_path = args.output / f"{stem}.md"
        write_json(report, json_path)
        write_markdown(report, markdown_path)
        print(
            json.dumps(
                {
                    "markdown": str(markdown_path),
                    "json": str(json_path),
                    "summary": report.to_dict()["summary"],
                    "elapsed_seconds": report.elapsed_seconds,
                },
                indent=2,
            )
        )
        if args.fail_on == "failure" and report.counts["failure"]:
            return 1
        if args.fail_on == "high" and report.high_priority_count:
            return 1
        return 0
    raise AssertionError(f"unhandled command: {args.command}")

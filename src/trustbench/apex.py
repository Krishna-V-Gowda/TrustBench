from __future__ import annotations

import hashlib
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class ApexAdapterError(RuntimeError):
    """Raised when the exact-source Apex runtime adapter cannot execute."""


@dataclass(frozen=True, slots=True)
class ApexAdapter:
    source_path: Path
    adapter_script: Path
    node_binary: str = "node"
    timeout_seconds: float = 10.0

    def __post_init__(self) -> None:
        source = self.source_path.resolve()
        adapter = self.adapter_script.resolve()
        if not source.is_file():
            raise FileNotFoundError(f"Apex source not found: {source}")
        if not adapter.is_file():
            raise FileNotFoundError(f"Apex adapter not found: {adapter}")
        object.__setattr__(self, "source_path", source)
        object.__setattr__(self, "adapter_script", adapter)

    @property
    def source_sha256(self) -> str:
        digest = hashlib.sha256()
        with self.source_path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def call(self, operation: str, **payload: Any) -> Any:
        request = {"op": operation, **payload}
        completed = subprocess.run(
            [self.node_binary, str(self.adapter_script), str(self.source_path)],
            input=json.dumps(request, separators=(",", ":")),
            text=True,
            capture_output=True,
            check=False,
            timeout=self.timeout_seconds,
        )
        stdout = completed.stdout.strip()
        try:
            response = json.loads(stdout)
        except json.JSONDecodeError as exc:
            raise ApexAdapterError(
                "Apex adapter returned non-JSON output. "
                f"exit={completed.returncode}; stdout={stdout!r}; stderr={completed.stderr!r}"
            ) from exc
        if completed.returncode != 0 or not response.get("ok"):
            raise ApexAdapterError(
                f"Apex adapter failed: {response.get('error', completed.stderr.strip())}"
            )
        return response.get("result")

    def manifest(self) -> dict[str, Any]:
        manifest = self.call("manifest")
        if manifest["sourceSha256"] != self.source_sha256:
            raise ApexAdapterError("Node and Python source fingerprints disagree")
        return manifest

from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def apex_source() -> Path:
    configured = os.getenv("TRUSTBENCH_APEX_SOURCE")
    if not configured:
        pytest.skip("set TRUSTBENCH_APEX_SOURCE to run exact-subject integration tests")
    path = Path(configured).resolve()
    if not path.is_file():
        pytest.fail(f"TRUSTBENCH_APEX_SOURCE is not a file: {path}")
    return path

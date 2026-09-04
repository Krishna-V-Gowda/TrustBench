.PHONY: test verify transition compile

test:
	PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=src python3 -m pytest -q -p no:cacheprovider

verify:
	PYTHONDONTWRITEBYTECODE=1 bash scripts/verify_delivery.sh

transition:
	PYTHONDONTWRITEBYTECODE=1 bash scripts/reproduce_transition.sh

compile:
	PYTHONDONTWRITEBYTECODE=1 python3 -c 'from pathlib import Path; [compile(p.read_text(), str(p), "exec") for p in list(Path("src").rglob("*.py"))+list(Path("tests").rglob("*.py"))]'
	node --check adapters/apex_runtime.mjs

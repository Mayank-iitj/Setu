"""The engine must stay free of web-layer imports (spec §3.1)."""
import ast
import pathlib

# parents[0]=engine  [1]=tests  [2]=backend  -> backend/src/engine
ENGINE = pathlib.Path(__file__).resolve().parents[2] / "src" / "engine"
FORBIDDEN = {"fastapi", "starlette", "uvicorn", "pydantic"}


def _imported_roots(path: pathlib.Path) -> set[str]:
    tree = ast.parse(path.read_text())
    roots: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(a.name.split(".")[0] for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            roots.add(node.module.split(".")[0])
    return roots


def test_engine_directory_exists():
    assert ENGINE.is_dir(), f"engine package missing at {ENGINE}"


def test_engine_imports_no_web_layer():
    offenders = {}
    for py in ENGINE.rglob("*.py"):
        bad = _imported_roots(py) & FORBIDDEN
        if bad:
            offenders[str(py.relative_to(ENGINE))] = sorted(bad)
    assert not offenders, f"engine must not import web-layer modules: {offenders}"

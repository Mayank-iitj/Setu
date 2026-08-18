"""One-time download of Solomon CVRPTW benchmark instances.

Run once: python scripts/fetch_solomon.py
Instances are committed to the repo so the demo needs no internet (spec §2 goal 5).
"""
import pathlib
import sys
import urllib.request

BASE = "https://raw.githubusercontent.com/iRB-Lab/py-ga-VRPTW/master/data/text"
INSTANCES = ["C101", "C201", "R101", "R201", "RC101", "RC201"]
OUT = pathlib.Path(__file__).resolve().parents[1] / "data" / "solomon"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    failures = []
    for name in INSTANCES:
        dest = OUT / f"{name}.txt"
        if dest.exists():
            print(f"  skip {name} (already present)")
            continue
        try:
            with urllib.request.urlopen(f"{BASE}/{name}.txt", timeout=30) as r:
                body = r.read().decode()
        except Exception as exc:
            failures.append((name, exc))
            print(f"  FAIL {name}: {exc}")
            continue
        if "<!DOCTYPE" in body[:200] or not body.strip():
            failures.append((name, "got HTML, not an instance file"))
            print(f"  FAIL {name}: got HTML, not an instance file")
            continue
        dest.write_text(body)
        print(f"  got  {name} ({len(body.splitlines())} lines)")
    if failures:
        print(f"\n{len(failures)} instance(s) failed. See docs for alternate mirrors.")
        return 1
    print(f"\nAll instances in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

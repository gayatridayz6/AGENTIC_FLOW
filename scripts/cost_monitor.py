"""Token cost calculator. Writes logs/cost.json.

Usage: python scripts/cost_monitor.py <input_tokens> <output_tokens> [model]
Rates are USD per 1M tokens; update RATES to match your contracted pricing.
"""
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
COST_FILE = os.path.join(ROOT, "logs", "cost.json")

RATES = {  # USD per 1M tokens: (input, output). Placeholder values.
    "claude-sonnet-4.5": (3.00, 15.00),
    "gpt-4.1": (2.00, 8.00),
    "default": (3.00, 15.00),
}


def cost_usd(input_tokens: int, output_tokens: int, model: str) -> float:
    in_rate, out_rate = RATES.get(model, RATES["default"])
    return round(input_tokens / 1e6 * in_rate + output_tokens / 1e6 * out_rate, 6)


if __name__ == "__main__":
    in_tok, out_tok = int(sys.argv[1]), int(sys.argv[2])
    model = sys.argv[3] if len(sys.argv) > 3 else "default"
    os.makedirs(os.path.dirname(COST_FILE), exist_ok=True)

    data = {"entries": [], "total_usd": 0.0}
    if os.path.exists(COST_FILE):
        with open(COST_FILE, encoding="utf-8") as f:
            data = json.load(f)

    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "model": model,
        "input_tokens": in_tok,
        "output_tokens": out_tok,
        "cost_usd": cost_usd(in_tok, out_tok, model),
    }
    data["entries"].append(entry)
    data["total_usd"] = round(sum(e["cost_usd"] for e in data["entries"]), 6)
    data["total_tokens"] = sum(e["input_tokens"] + e["output_tokens"] for e in data["entries"])

    with open(COST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Logged {entry['cost_usd']} USD; total {data['total_usd']} USD")

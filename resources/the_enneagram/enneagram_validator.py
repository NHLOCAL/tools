"""Compatibility adapter for validating Enneagram simulations with engine.js."""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
from typing import Any, Iterable


ANSWER_COUNT = 93
HISTORICAL_ANSWER_COUNT = 45
ENGINE_PATH = Path(__file__).with_name("engine.js")

_NODE_ADAPTER = r"""
const fs = require('node:fs');
const engine = require(process.argv[1]);
const answers = JSON.parse(fs.readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify(engine.score(answers)));
"""


class EngineScores(list):
    """Legacy score list with the authoritative engine result attached."""

    def __init__(self, values: Iterable[tuple[int, float]], engine_result: dict[str, Any]):
        super().__init__(values)
        self.engine_result = engine_result


def _validated_answers(answers: Any) -> list[int]:
    if not isinstance(answers, (list, tuple)):
        raise ValueError("Answers must be a list or tuple of 93 integers between 1 and 5.")
    if len(answers) == HISTORICAL_ANSWER_COUNT:
        raise ValueError(
            "Historical 45-answer input is no longer supported; "
            "the current engine requires all 93 answers."
        )
    if len(answers) != ANSWER_COUNT:
        raise ValueError(f"Expected {ANSWER_COUNT} answers, but found {len(answers)}.")
    for index, value in enumerate(answers, start=1):
        if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 5:
            raise ValueError(
                f"Invalid answer value {value!r} at position {index}; "
                "values must be integers between 1 and 5."
            )
    return list(answers)


def _score_with_engine(answers: list[int]) -> dict[str, Any]:
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("Node.js is required to score answers with engine.js.")
    try:
        completed = subprocess.run(
            [node, "-e", _NODE_ADAPTER, str(ENGINE_PATH)],
            input=json.dumps(answers),
            text=True,
            encoding="utf-8",
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        raise RuntimeError(f"Could not start Node.js: {exc}") from exc
    if completed.returncode != 0:
        detail = completed.stderr.strip() or "unknown engine error"
        raise RuntimeError(f"engine.js scoring failed: {detail}")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("engine.js returned invalid JSON.") from exc


def calculate_enneagram_scores(answers: Any) -> EngineScores:
    """Return the legacy ranked score list, backed by the current JS engine result."""
    engine_result = _score_with_engine(_validated_answers(answers))
    ranked = [
        (int(entry["key"]), entry["score"])
        for entry in engine_result["typeRanking"]
    ]
    return EngineScores(ranked, engine_result)


def validate_simulation(sorted_scores: EngineScores, simulated_profile: dict[str, Any]) -> dict[str, str]:
    """Compare a simulated profile with the engine's primary and adjacent-wing result."""
    if not isinstance(sorted_scores, EngineScores):
        raise ValueError(
            "validate_simulation requires the result of calculate_enneagram_scores "
            "so engine abstention and wing rules are available."
        )

    result = sorted_scores.engine_result
    expected_type = simulated_profile["main_type"]
    expected_wing = simulated_profile.get("wing")
    primary = result["primary"]
    wing_result = result.get("wing")
    wing = wing_result.get("dominant") if wing_result else None

    if primary is None and expected_type is None:
        verdict_code = "SUCCESS"
        verdict = "✅ התאמה מלאה. המנוע נמנע כראוי מקביעת טיפוס ראשי."
        calculated = "abstain"
    elif primary is None:
        candidates = result.get("candidates", [])
        if expected_type in candidates:
            verdict_code = "PARTIAL"
            verdict = (
                "⚠️ התאמה חלקית. המנוע נמנע מקביעת טיפוס ראשי; "
                f"טיפוס {expected_type} נמצא בין המועמדים."
            )
        else:
            verdict_code = "FAIL"
            verdict = "❌ אי-התאמה. המנוע נמנע מקביעת טיפוס ראשי."
        calculated = "abstain"
    elif primary == expected_type:
        verdict_code = "SUCCESS"
        verdict = f"✅ התאמה מלאה. זוהה כראשי: {primary}."
        if expected_wing is not None:
            if wing == expected_wing:
                verdict += f" כנף ({expected_wing}) זוהתה."
            elif wing is None:
                verdict_code = "PARTIAL"
                verdict = (
                    f"⚠️ התאמה חלקית. הטיפוס הראשי {primary} זוהה, "
                    f"אך המנוע נמנע מאישור הכנף הצפויה ({expected_wing})."
                )
            else:
                verdict_code = "PARTIAL"
                verdict = (
                    f"⚠️ התאמה חלקית. הטיפוס הראשי {primary} זוהה, "
                    f"אך הכנף הצפויה ({expected_wing}) לא אושרה (זוהתה {wing})."
                )
        calculated = f"{primary}w{wing}" if wing is not None else str(primary)
    else:
        ranked_types = [type_number for type_number, _score in sorted_scores]
        if expected_type in ranked_types[1:3]:
            position = ranked_types.index(expected_type) + 1
            verdict_code = "PARTIAL"
            verdict = f"⚠️ התאמה חלקית. זוהה במקום ה-{position}."
        else:
            verdict_code = "FAIL"
            verdict = f"❌ אי-התאמה. הטיפוס הדומיננטי שזוהה הוא {primary}."
        calculated = f"{primary}w{wing}" if wing is not None else str(primary)

    return {
        "verdict_text": verdict,
        "verdict_code": verdict_code,
        "calculated_top_two": calculated,
    }


if __name__ == "__main__":
    print("This script is intended to be imported as a module.")

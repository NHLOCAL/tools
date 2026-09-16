import unittest
import json
import subprocess
from pathlib import Path

QUESTIONS = json.loads(subprocess.check_output(["node", "-e", "process.stdout.write(JSON.stringify(require(process.argv[1]).questions))", str(Path(__file__).with_name("engine.js"))], text=True, encoding="utf-8"))

from enneagram_validator import (
    EngineScores,
    calculate_enneagram_scores,
    validate_simulation,
)


REVERSE_POSITIONS = (61, 62, 63, 65, 66, 67, 69, 70, 71, 73, 74, 75)
TYPE_POSITIONS = {
    1: (1, 18, 35, 41, 58, 63),
    2: (10, 15, 33, 38, 55, 61),
    5: (2, 19, 25, 42, 59, 65),
    9: (3, 21, 26, 43, 49, 66),
}


def low_keyed_answers():
    answers = [1] * 93
    for position in REVERSE_POSITIONS:
        answers[position - 1] = 5
    answers[75:] = [3] * 18
    return answers


def set_type_rating(answers, type_number, rating):
    for position in TYPE_POSITIONS[type_number]:
        answers[position - 1] = 6 - rating if position in REVERSE_POSITIONS else rating
    for i, question in enumerate(QUESTIONS):
        if question.get("kind") != "contrast":
            continue
        a, b = question["pair"]
        def average(t):
            items = [(6 - answers[j] if q.get("reverse") else answers[j]) for j, q in enumerate(QUESTIONS) if q.get("scale") == str(t)]
            return sum(items) / len(items)
        av, bv = average(a), average(b)
        answers[i] = 3 if av == bv else 1 if av > bv else 5


class ValidatorTests(unittest.TestCase):
    def test_scores_are_list_compatible_and_carry_engine_abstention(self):
        scores = calculate_enneagram_scores([3] * 93)
        self.assertIsInstance(scores, list)
        self.assertIsInstance(scores, EngineScores)
        self.assertEqual(len(scores), 9)
        self.assertIsNone(scores.engine_result["primary"])
        self.assertEqual(scores.engine_result["primaryStatus"], "undifferentiated")

    def test_historical_45_answer_input_has_clear_error(self):
        with self.assertRaisesRegex(ValueError, r"Historical 45-answer input.*93 answers"):
            calculate_enneagram_scores([3] * 45)

    def test_invalid_values_are_rejected_before_node_scoring(self):
        for value in (True, 2.5, 0, 6):
            with self.subTest(value=value):
                answers = [3] * 93
                answers[7] = value
                with self.assertRaisesRegex(ValueError, r"position 8"):
                    calculate_enneagram_scores(answers)

    def test_adjacent_wraparound_wing_is_reported(self):
        answers = low_keyed_answers()
        set_type_rating(answers, 1, 5)
        set_type_rating(answers, 9, 4)

        scores = calculate_enneagram_scores(answers)
        self.assertEqual(scores.engine_result["primary"], 1)
        self.assertEqual(scores.engine_result["wing"]["adjacent"], [9, 2])
        self.assertEqual(scores.engine_result["wing"]["dominant"], 9)

        validation = validate_simulation(scores, {"main_type": 1, "wing": 9})
        self.assertEqual(validation["verdict_code"], "SUCCESS")
        self.assertEqual(validation["calculated_top_two"], "1w9")

    def test_nonadjacent_overall_runner_up_is_never_used_as_wing(self):
        answers = low_keyed_answers()
        set_type_rating(answers, 1, 5)
        set_type_rating(answers, 5, 4)

        scores = calculate_enneagram_scores(answers)
        self.assertEqual(scores[0][0], 1)
        self.assertEqual(scores[1][0], 5)
        self.assertIsNone(scores.engine_result["wing"]["dominant"])

        validation = validate_simulation(scores, {"main_type": 1, "wing": 9})
        self.assertEqual(validation["verdict_code"], "PARTIAL")
        self.assertEqual(validation["calculated_top_two"], "1")
        self.assertNotIn("1w5", validation["calculated_top_two"])
        self.assertIn("נמנע", validation["verdict_text"])

    def test_wrong_adjacent_wing_is_only_a_primary_match(self):
        answers = low_keyed_answers()
        set_type_rating(answers, 1, 5)
        set_type_rating(answers, 9, 4)

        scores = calculate_enneagram_scores(answers)
        validation = validate_simulation(scores, {"main_type": 1, "wing": 2})

        self.assertEqual(validation["verdict_code"], "PARTIAL")
        self.assertEqual(validation["calculated_top_two"], "1w9")
        self.assertIn("הטיפוס הראשי 1 זוהה", validation["verdict_text"])
        self.assertIn("הכנף הצפויה (2) לא אושרה", validation["verdict_text"])

    def test_primary_tie_is_preserved_as_abstention(self):
        answers = low_keyed_answers()
        set_type_rating(answers, 1, 5)
        set_type_rating(answers, 2, 5)

        scores = calculate_enneagram_scores(answers)
        self.assertIsNone(scores.engine_result["primary"])
        self.assertEqual(scores.engine_result["primaryStatus"], "close")

        validation = validate_simulation(scores, {"main_type": 1, "wing": 2})
        self.assertEqual(validation["verdict_code"], "PARTIAL")
        self.assertEqual(validation["calculated_top_two"], "abstain")

    def test_validate_requires_engine_backed_scores(self):
        with self.assertRaisesRegex(ValueError, r"calculate_enneagram_scores"):
            validate_simulation([(1, 100), (5, 90)], {"main_type": 1, "wing": 9})

    def test_expected_neutral_profile_treats_engine_abstention_as_success(self):
        scores = calculate_enneagram_scores([3] * 93)
        validation = validate_simulation(scores, {"main_type": None, "wing": None})

        self.assertEqual(validation["verdict_code"], "SUCCESS")
        self.assertEqual(validation["calculated_top_two"], "abstain")
        self.assertIn("נמנע כראוי", validation["verdict_text"])


if __name__ == "__main__":
    unittest.main()

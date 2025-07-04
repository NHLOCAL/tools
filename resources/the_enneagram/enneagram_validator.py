# enneagram_validator.py (UPDATED)
import json
import sys

# UPDATED: Mapping for 45 questions (5 per type)
QUESTIONS_MAPPING = [
    # Type 1 (5 questions)
    1, 1, 1, 1, 1,
    # Type 2 (5 questions)
    2, 2, 2, 2, 2,
    # Type 3 (5 questions)
    3, 3, 3, 3, 3,
    # Type 4 (5 questions)
    4, 4, 4, 4, 4,
    # Type 5 (5 questions)
    5, 5, 5, 5, 5,
    # Type 6 (5 questions)
    6, 6, 6, 6, 6,
    # Type 7 (5 questions)
    7, 7, 7, 7, 7,
    # Type 8 (5 questions)
    8, 8, 8, 8, 8,
    # Type 9 (5 questions)
    9, 9, 9, 9, 9
]

TYPE_INFO = {
    1: {"name": "המתקן"}, 2: {"name": "המעניק"}, 3: {"name": "הביצועיסט"},
    4: {"name": "האינדיבידואליסט"}, 5: {"name": "הצופה"}, 6: {"name": "הנאמן"},
    7: {"name": "ההרפתקן"}, 8: {"name": "המוביל"}, 9: {"name": "המשכין שלום"}
}

def calculate_enneagram_scores(answers):
    if len(answers) != len(QUESTIONS_MAPPING):
        raise ValueError(f"Error: Expected {len(QUESTIONS_MAPPING)} answers, but found {len(answers)}.")
    scores = {i: 0 for i in range(1, 10)}
    for i, answer_value in enumerate(answers):
        if not 1 <= answer_value <= 5:
             raise ValueError(f"Error: Invalid answer value '{answer_value}' at position {i+1}. Values must be between 1 and 5.")
        question_type = QUESTIONS_MAPPING[i]
        scores[question_type] += answer_value
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)

def validate_simulation(sorted_scores, simulated_profile):
    """Performs comparison and returns a structured result."""
    true_main_type = simulated_profile['main_type']
    true_wing = simulated_profile['wing']
    calculated_main_type = sorted_scores[0][0]
    calculated_secondary_type = sorted_scores[1][0]
    
    verdict = ""
    verdict_code = "FAIL"

    if calculated_main_type == true_main_type:
        verdict = f"✅ התאמה מלאה. זוהה כראשי: {calculated_main_type}."
        verdict_code = "SUCCESS"
        if calculated_secondary_type == true_wing:
            verdict += f" כנף ({true_wing}) זוהתה כשנייה."
        else:
            verdict += f" כנף ({true_wing}) לא זוהתה כשנייה (זוהה {calculated_secondary_type})."
    elif true_main_type in [s[0] for s in sorted_scores[1:3]]:
        position = [s[0] for s in sorted_scores].index(true_main_type) + 1
        verdict = f"⚠️ התאמה חלקית. זוהה במקום ה-{position}."
        verdict_code = "PARTIAL"
    else:
        verdict = f"❌ אי-התאמה. הטיפוס הדומיננטי שזוהה הוא {calculated_main_type}."

    return {
        "verdict_text": verdict,
        "verdict_code": verdict_code,
        "calculated_top_two": f"{calculated_main_type}w{calculated_secondary_type}"
    }

# This part is for standalone execution and won't run when imported
if __name__ == "__main__":
    print("This script is intended to be imported as a module.")
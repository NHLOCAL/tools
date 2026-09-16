# Round 2 blind classification report

Engine 2.0.0; 4 frozen cases. An actual null means the engine withheld a classification under its configured evidence thresholds.
Engine SHA256: `9b4ea92c2275d181f70ec197ceda5852b31cf498865936a3ffe11f604d1c4bb5`
Questionnaire SHA256: `5fbe1d2f35249929ffb984db127cd1c7a050de9c86edbf788848cadabd57e1e3`

The engine and frozen answers were unchanged for holdout scoring; no tuning was performed between rounds.

| Case | Expected type | Actual type | Type outcome | Expected stack | Actual stack | Instinct outcome |
| --- | --- | --- | --- | --- | --- | --- |
| H1 | 5w4 | null | abstention | SX/SP/SO | SX/SP/SO | correct |
| H2 | 2w3 | 2w3 | correct | SP/SO/SX | SP/SO/SX | correct |
| H3 | 4w3 | 4w3 | correct | SP/SX/SO | SP/SX/SO | correct |
| H4 | 7w6 | 7w6 | correct | SO/SP/SX | SO/SP/SX | correct |

Incorrect classifications: none.
Threshold abstentions on labeled cases: H1.

This is a small synthetic blind classification check. It is not psychometric validation.

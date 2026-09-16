# Round 1 blind classification report

Engine 2.0.0; 10 frozen cases. An actual null means the engine withheld a classification under its configured evidence thresholds.
Engine SHA256: `9b4ea92c2275d181f70ec197ceda5852b31cf498865936a3ffe11f604d1c4bb5`
Questionnaire SHA256: `5fbe1d2f35249929ffb984db127cd1c7a050de9c86edbf788848cadabd57e1e3`

| Case | Expected type | Actual type | Type outcome | Expected stack | Actual stack | Instinct outcome |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | 1w9 | 1w9 | correct | SP/SO/SX | SP/SO/SX | correct |
| A2 | 2w1 | 2w1 | correct | SO/SP/SX | SO/SP/SX | correct |
| B1 | 3w2 | 3w2 | correct | SO/SX/SP | SO/SX/SP | correct |
| B2 | 4w5 | 4w5 | correct | SX/SP/SO | SX/SP/SO | correct |
| C1 | 5w6 | 5w6 | correct | SP/SO/SX | SP/SO/SX | correct |
| C2 | 6w5 | 6w5 | correct | SO/SP/SX | SO/SP/SX | correct |
| D1 | 7w8 | 7w8 | correct | SX/SO/SP | SX/SO/SP | correct |
| D2 | 8w9 | 8 | abstention | SP/SX/SO | SP/SX/SO | correct |
| E1 | 9w1 | 9w1 | correct | SO/SP/SX | SO/SP/SX | correct |
| E2 | null | null | correct abstention | null | null | correct abstention |

Incorrect classifications: none.
Threshold abstentions on labeled cases: D2.
Neutral control E2: properly abstained.

This is a small synthetic blind classification check. It is not psychometric validation.

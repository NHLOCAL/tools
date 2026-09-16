# Frozen-rule blind evaluation

Synthetic role-play checks, not human validation. Development personas influenced general decision-rule revisions; holdout answers and Terra replication did not. Wings were specified only in development personas. Three Luna holdout files needed format completion or numeric/choice reconciliation by their original respondents, without score feedback. Terra replication drafts also needed numeric/text reconciliation before completion; see format-corrections.json. Hashes normalize CRLF to LF.

| Group | Core matches | Abstentions | Mismatches | Baseline matches / abstentions / mismatches |
| --- | ---: | ---: | ---: | --- |
| development_luna | 4 | 13 | 1 | 4 / 12 / 2 |
| replication_terra | 10 | 5 | 3 | 11 / 7 / 0 |
| holdout_luna | 8 | 1 | 0 | 9 / 0 / 0 |
| holdout_terra | 9 | 0 | 0 | 9 / 0 / 0 |

| Group with specified wings | Full core + wing matches | No wing | Wrong core or wing |
| --- | ---: | ---: | ---: |
| development_luna | 3 | 14 | 1 |
| replication_terra | 5 | 10 | 3 |

No expected wing was assigned to holdout personas; their wing results are not counted as successes. Instinct scores match the baseline exactly for identical answers.

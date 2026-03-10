# Verification Reference

## The rule

No completion claim without fresh verification evidence.

If you have not run the command that proves the claim in the current work cycle, you cannot honestly make the claim.

## Verification loop

1. Identify the exact claim.
2. Identify the command or artifact that proves it.
3. Run it fresh.
4. Read the full output, not just the exit code.
5. State the result with scope and limits.

## Common claim-to-proof pairs

| Claim | Minimum proof |
|---|---|
| tests pass | exact test command output shows success |
| bug fixed | failing reproduction existed before, passes after |
| build works | build command completes successfully |
| CI is fixed | the failing job or equivalent local command now passes |
| review issue addressed | changed behavior verified, not only code edited |

## Partial verification

If you could not run the decisive proof:
- say that directly
- state what you did verify
- state what remains unverified
- name the next command the user or CI should run

Do not replace missing verification with confidence language like "should", "probably", or "looks good".

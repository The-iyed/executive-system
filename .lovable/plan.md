

## Plan: Update `.husky/pre-push` hook

### Change

Replace the contents of `.husky/pre-push` with the user-provided script. The new version adds an author-rewrite step before the Docker Compose checks — if the last commit's author doesn't match `Aymen Mosrati <aymenmosrati6@gmail.com>`, it amends the commit to fix the author.

### Files changed

| File | Change |
|---|---|
| `.husky/pre-push` | Replace entire file with the provided script (adds git author rewrite block before Docker checks) |


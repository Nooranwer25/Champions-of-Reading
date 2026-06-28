# Security Specification for Obsidian Archive

## Data Invariants
1. A user profile can only be created by the owner.
2. Roles (`role`) and points (`totalPoints`) can only be modified by an `archivist`.
3. Submissions must belong to the logged-in user.
4. Only an `archivist` can transition submission status from `pending` to `approved` or `rejected`.
5. Global stats and league rules are read-only for `champions` and writeable for `archivists`.

## The "Dirty Dozen" Payloads
1. Create a user profile with `role: "archivist"` as a first-time user. (Denied)
2. Update another user's `totalPoints`. (Denied)
3. Submit a book log with a fake `userId`. (Denied)
4. Approve own submission by changing `status` to "approved". (Denied)
5. Delete the `league_rules` document. (Denied)
6. List all user profiles (including PII if any) without being an admin. (Denied)
7. Inject a 1MB string into a book `synopsis`. (Denied)
8. Update `createdAt` field on a submission after it's been created. (Denied)
9. Create a submission with an invalid category. (Denied)
10. Update a submission's `pointsEarned` as a champion. (Denied)
11. Read an "approved" submission of another user. (Allowed - list view)
12. Read a "pending" submission of another user. (Denied)

## Test Runner (Logic Overview)
The `firestore.rules` will be tested against these scenarios to ensure `PERMISSION_DENIED` where appropriate.

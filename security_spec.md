# Security Specification for IPL Fantasy Cricket

## Data Invariants
- A squad must have exactly 3 players.
- A squad must have at least 1 player from each team.
- A user can only create/update their own squad.
- A squad cannot be updated once it is locked.
- Player and Match data are read-only for users (system-generated).

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Spoofing**: User A trying to create a squad for User B.
2. **Identity Spoofing (Update)**: User A trying to update User B's squad.
3. **Ghost Fields**: Adding `isVerified: true` to a squad.
4. **Invalid Player Count**: Creating a squad with 4 players.
5. **Missing MVP**: Creating a squad without an `mvpId`.
6. **Bypassing Lock**: Updating a squad after `locked` is set to true.
7. **Modifying Immutables**: Changing `userId` or `matchId` after creation.
8. **Resource Poisoning**: Injecting 1MB junk string into `matchId`.
9. **Tampering Matches**: Regular user trying to change a match date.
10. **Tampering Players**: Regular user trying to change player `points`.
11. **Email Spoofing**: Unverified email user trying to write.
12. **Blanket Query**: Authenticated user trying to fetch ALL squads (must be restricted to their own).

## Test Runner
See `firestore.rules.test.ts`.

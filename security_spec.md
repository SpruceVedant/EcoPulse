# Security Specification for EcoPulse Carbon Tracking

This document outlines the attribute-based access control (ABAC) restrictions, validation rules, and schema invariants for our application's Firestore database.

## 1. Data Invariants

1. **User Ownership (Self-Access Only)**: A user can only read, list, create, update, or delete records within their own path (`/users/{userId}`). Cross-user access is strictly blocked.
2. **Identity Integrity**: For any write to `/users/{userId}`, `/users/{userId}/footprints/{id}`, `/users/{userId}/badges/{id}`, `/users/{userId}/plans/{id}`, and `/users/{userId}/challenges/{id}`, the authenticating Firestore user's `uid` must exactly equal the `userId` in the document path.
3. **Temporal Invariants**: The `createdAt` field are immutable after document creation. The `updatedAt` field must always match the exact transaction time `request.time`.

## 2. The "Dirty Dozen" Payloads (Anti-Spoof/Anti-Bypass Tests)

These payloads must be rejected by the rules:

1. **Self-Appointed Points Injection**: User attempts to set points directly to 10,000,000 in profile creation or update.
2. **Cross-User Injection**: User `A` attempts to save a footprint inside the subcollection of User `B` (`/users/userB/footprints/someId`).
3. **Immutability Bypass**: User attempts to modify `createdAt` or `userId` inside `/users/{userId}/footprints/{id}` during an update.
4. **Invalid Type for Points**: User attempts to set `points` to a string or custom object.
5. **Junk Character / Denial of Wallet ID**: Attacker attempts to write to a document ID consisting of 1MB of symbols causing index bloating.
6. **Negative Value / State Corruption**: User attempts to write negative emissions (`totalFootprint: -500`) or points (`points: -100`).
7. **Invalid Range for Carbon Score**: User attempts to set `carbonScore` to an unapproved enum value (e.g., `"Critical"` or `"None"` instead of `["Low", "Medium", "High"]`).
8. **Unauthenticated Read**: Guessing of random UUID paths from outside the client without signing in.
9. **Self-Unlocking Unearned Badge**: Directly creating/updating a badge document setting `unlocked: true` without performing the actual calculation triggers.
10. **Forged Timestamp**: User sends a client-side timestamp payload for `updatedAt` instead of `request.time`.
11. **Shadow Key Attacks**: User includes undocumented attributes like `{ "isAdmin": true }` to expand their credentials scope.
12. **Malformed Dictionary Input Types**: User changes the `categories` or `inputs` shapes into raw strings or lists instead of map structures.

---

## 3. High-Integrity Firestore Rules Definition

Our rules are structured with a default-deny gate, type-safety helper routines, and action-based key check gates.

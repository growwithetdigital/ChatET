# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Any path not explicitly matched in `/threads/{threadId}`, `/messages/{messageId}`, `/customEts/{etId}`, or `/memories/{memoryId}` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Enforcement**: Every read and write operation requires an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
3. **Path Variable Hardening**: Every single-document target operation (`get`, `create`, `update`, `delete`) enforces `isValidId(docId)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Strict Ownership Isolation**: Every entity (`Thread`, `ChatMessage`, `CustomET`, `MemoryItem`) requires `ownerId == request.auth.uid` on creation, enforces `existing().ownerId == request.auth.uid` on read/update/delete, and locks `incoming().ownerId == existing().ownerId` as immutable on update.
5. **Relational Consistency (`ChatMessage` -> `Thread`)**: A `ChatMessage` cannot be created unless the referenced `/threads/$(incoming().threadId)` exists AND is owned by `request.auth.uid`. Furthermore, `threadId` and `role` are immutable on update.
6. **Strict Schema & Shadow-Field Prevention**: Every `create` and `update` invokes `isValid[Entity](incoming())` enforcing `keys().hasAll(...)` and `keys().hasOnly(...)` with strict type and `.size()` boundary checks on every string field. Every `update` uses action-based `affectedKeys().hasOnly(...)` gates.
7. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on `create`. On `update`, `createdAt` must equal `existing().createdAt` (immutable) and `updatedAt` must equal `request.time`.
8. **Secure List Queries**: Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid` without `get()` or `exists()` calls to prevent unauthorized query scraping and O(n) read amplification.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Thread Create)**: Authenticated user `user_A` attempts to create `/threads/thread_1` with `ownerId: "user_B"`.
   - **Expected**: `PERMISSION_DENIED` (`data.ownerId == request.auth.uid` fails).
2. **Payload 2 (Unverified Email Spoof Attack)**: Authenticated user `user_A` with `email_verified: false` attempts to create `/threads/thread_1`.
   - **Expected**: `PERMISSION_DENIED` (`isVerified()` fails).
3. **Payload 3 (Shadow Field / Ghost Property Injection on Update)**: Owner `user_A` updates `/threads/thread_1` with valid fields plus `"isAdmin": true`.
   - **Expected**: `PERMISSION_DENIED` (`isValidThread` `hasOnly` and `affectedKeys().hasOnly(...)` reject the shadow field).
4. **Payload 4 (Orphaned Message Write / Relational Violation)**: Owner `user_A` attempts to create `/messages/msg_1` referencing a non-existent `threadId: "thread_ghost"` or a thread owned by `user_B`.
   - **Expected**: `PERMISSION_DENIED` (`exists()` and `get().data.ownerId == request.auth.uid` fail).
5. **Payload 5 (ID Poisoning / Oversized Document ID)**: Owner `user_A` attempts to create `/memories/bad$id!with*invalid/chars` or a 500-char ID.
   - **Expected**: `PERMISSION_DENIED` (`isValidId()` regex and length check fail).
6. **Payload 6 (Denial-of-Wallet String Exhaustion)**: Owner `user_A` attempts to create `/memories/mem_1` with `content` length of 10,000 characters (exceeding `maxLength: 2000`).
   - **Expected**: `PERMISSION_DENIED` (`data.content.size() <= 2000` fails).
7. **Payload 7 (Immutable Field Tampering on Update)**: Owner `user_A` attempts to update `/threads/thread_1` by changing `createdAt` or `ownerId`.
   - **Expected**: `PERMISSION_DENIED` (`incoming().createdAt == existing().createdAt` and `affectedKeys().hasOnly(...)` fail).
8. **Payload 8 (Client Timestamp Forgery)**: Owner `user_A` attempts to create `/customEts/et_1` with a forged past or future `createdAt` instead of `request.time`.
   - **Expected**: `PERMISSION_DENIED` (`incoming().createdAt == request.time` fails).
9. **Payload 9 (Cross-Tenant Read / PII & Private Data Scraping)**: Authenticated `user_B` attempts `get` on `/customEts/et_1` owned by `user_A`.
   - **Expected**: `PERMISSION_DENIED` (`existing().ownerId == request.auth.uid` fails).
10. **Payload 10 (Unconstrained List Query Scraping)**: Authenticated `user_B` attempts an unfiltered `list` query across `/threads` or `/memories` without `where('ownerId', '==', 'user_B')`.
    - **Expected**: `PERMISSION_DENIED` (`resource.data.ownerId == request.auth.uid` fails).
11. **Payload 11 (Enum / State Boundary Violation)**: Owner `user_A` attempts to create `/memories/mem_1` with `category: "hacked_category"`.
    - **Expected**: `PERMISSION_DENIED` (`data.category in ['business', 'personal', 'parenting', 'preference', 'rule']` fails).
12. **Payload 12 (Value Poisoning on Whitelisted Update Key)**: Owner `user_A` attempts to update `pinned` on `/threads/thread_1` with a string `"true"` instead of a boolean.
    - **Expected**: `PERMISSION_DENIED` (`isValidThread(incoming())` enforces `data.pinned is bool`).

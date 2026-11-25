# Billing ledger retention

Service orders, refund requests/documents, transaction claims and the funded account
state are financial history. Normal application DELETE and TRUNCATE operations are
rejected by PostgreSQL triggers. Cancelling an unsent order retains its row with
an expired status; refunds retain their linked requests, events and proofs. Neither
operation erases the original purchase. Catalog,
wallet and challenge removal do not remove these ledger rows.

Order/refund participant foreign keys already use SET NULL. The account state's
historical `userId` is now an independent billing key, without an account-deletion
foreign key. Removing a user/profile can therefore anonymize the account reference
without cascading away periods, original funding lots or cumulative refund claims.
No username, profile or email snapshot is added. Original payer/chain/token/amount,
quotes, existing receipt snapshots, refund proofs and original-order references
remain available to administrators. Retained state cannot grant roles to a missing
account. Reverting the migration is refused while orphaned billing state exists.

This protects normal application and account-deletion paths, not a database owner
who can remove triggers or drop the schema. It does not turn all accounts into soft
deletions. The current refund mutation path still requires an existing user:
orphaned obligations need a separate stable billing-subject/administrator recovery
design. Self-service deletion guards and acceptance of new payments during deletion
are separate work; retained history alone does not provide those guards.
The sibling P2P ledger in PR #126 needs equivalent deletion protection in that
slice; this migration protects the server-service/refund ledgers owned by #81.

PostgreSQL refund tests exercise migration up/down/reapply, DELETE/TRUNCATE and ORM
deletion rejection, ordinary refund transitions, user deletion, retained original
orders/documents/funding, missing-user role exclusion and a refused unsafe rollback.

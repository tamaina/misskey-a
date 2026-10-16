# Federated billing sample v1 (local fixtures only)

Refs #8. This is an opt-in **local protocol/state-machine experiment**, stacked on
#64 → #81 → #126 (`feat/peer-payments`, 2a37bf4a). Refunds currently live in #81;
#126 supplies peer intents and overseas receipt settings. No existing PR is merged.

`backend/federated-sample.ts` is deliberately absent from all API, DI, settings,
inbox, outbox and renderer registries. Merging it does not enable payments.
`createFederatedSampleHarness` rejects operations unless its trusted construction
config explicitly sets `enabled: true`; omitting it stays disabled. A future
runtime adapter would need administrator-only settings, disabled by default, with
an independent review. There is no production enable switch in this slice.

## Implemented path

1. The trusted local config identifies a provider Actor/user, that user's Proposal,
   fixed token/recipient/price, payer Actor/user mappings, and permitted Note URI /
   author mappings. The fixture resolver has no HTTP implementation. It must not
   be replaced with an unrestricted remote URL fetch.
2. A configured Note must explicitly attach a FEP-0ea0 `Link` whose `href` equals
   the Proposal ID and whose `rel` includes both `payment` and the Valueflows
   Proposal URI. Only the Note author’s individual `Person` Actor may publish the Proposal;
   a shared Service Actor is rejected. One user Proposal can serve several linked
   Notes, without copying Proposal activities into each Note. A product name, profile payment link alone, or same server does
   not opt an arbitrary Note in.
3. Proposal ID, attribution, origin, primary/reciprocal Intent IDs, action,
   quantities, fixed-price mode and exact versioned resource identifiers are
   checked. The primary `availableQuantity` must explicitly permit at least one
   unit; zero closes reception. Only the compacted contexts shown in the fixtures are accepted;
   arbitrary JSON-LD contexts and older wire profiles are rejected.
4. `createSampleProposalDiscovery` caches only display capability for 60 seconds,
   with explicit invalidation. A hot cache never approves a purchase. Before every
   new offer and acceptance it calls the existing `ApRequestService.signedGet`
   seam for the individual user's Actor and then their linked Proposal, using
   `FetchAllowSoftFailMask.Strict` and disabling HTML alternate traversal. This
   retains native request signing, content/URL checks and `HttpRequestService`
   SSRF/private-address policy, without adding a separate HTTP fetch path. The
   fixture replaces signedGet with a local document map: no real signature or
   request is made. Current Actor ID/type/payment link, Proposal attribution,
   price, supported resource version and reception availability are revalidated.
   Failure invalidates positive capability; expiry, invalidation and concurrent
   refresh supersession cannot authorize from stale cache. No cached Proposal is
   accepted as payment approval.
5. An authenticated fixture payer submits `OfferAgreement`, addressed to the
   provider. Its `context` is the exact Note URI (a sample v1 convention). Both
   commitments must satisfy the Proposal's intents with identical quantities.
   The separately supplied pending existing PaymentIntent ID is privately bound
   to this offer, payer, provider, Note and terms before any wallet send. An
   already broadcast, hash-bound or confirmed intent cannot be attached later.
6. Only the provider may accept. `AcceptAgreement.object` references the offer;
   `result` contains the finalized Agreement with provider attribution and IDs
   on both commitments. Acceptance does **not** confirm payment or fulfillment.
7. The verified-payment hook reads the same existing intent from the trusted
   store. It requires the existing confirmed status, approved broadcast marker,
   admission/broadcast country evidence, and confirmation timestamp. The receipt
   reader's `ReceiptResult` must be confirmed and contain canonical-block
   evidence. Chain, transaction, log index, sender wallet/address, recipient
   wallet/address, token, amount and event timing must match the frozen intent.
   Pending, reverted, ambiguous or unmatched events do not fulfill.
8. The local fulfillment is one `Create(Document)` receipt addressed only to the
   payer. Its `context` references the Agreement and `url` the Note. It contains
   no wallet, transaction, residence or internal PaymentIntent data. It is a
   local record, **not** evidence that a remote service ran. Nothing is delivered.

The fixture calls the real `requireCountryEligibility` function using an in-memory
EntityManager double at offer and acceptance: declared residence and server
permission are mandatory; foreign receipt defaults OFF. There is no residency or
country fallback. The existing payment preparation/start guards remain untouched.
Recovery of an admitted, confirmed payment does not reapply new-start policy.
The individual provider Actor/user mapping is trusted fixture configuration; remote residency
attestations, identity mapping and policy synchronization are unimplemented.

## Specification baseline and sample conventions

Read the official raw draft texts on 2026-10-17 (UTC):

- [FEP-0837](https://codeberg.org/fediverse/fep/src/branch/main/fep/0837/fep-0837.md),
  SHA-256 `45b6bb51deb64c34de8995f3e1bc3d0c035ccbcfe62b21ee6e5d245f5a9ed0e9`.
- [FEP-0ea0](https://codeberg.org/fediverse/fep/src/branch/main/fep/0ea0/fep-0ea0.md),
  SHA-256 `c27dba7d941db34dc7dc118a17ef700d8ceb36ea8a7aff51083c77ed29e93527`.

Both are DRAFT. The current 0837 raw examples and acceptance section use
`OfferAgreement` / `AcceptAgreement`; one introductory sentence still says
`Offer`. An older rendered copy uses `Offer` / `Accept`. This sample chooses the
current raw examples and rejects the older profile. Current raw makes
`resourceConformsTo` required. No FEP guarantees payment settlement or defines
this sample's ERC20 rail, Note target convention, admission policy or fulfillment.

The service identifier is `urn:misskey-a:sample:note-receipt:v1`. The reciprocal
resource identifier is
`urn:misskey-a:sample:erc20:31337:<token>:<recipient>:base-units:v1`.
Amounts are positive uint256 integer base units; `one` means one base unit for
this private sample rail, not an unscaled display token. Chain 31337 is mandatory;
no mainnet chain can pass this profile. These URNs identify sample conventions,
not a published standard or an assertion of general FEP compliance. Unknown
versions fail closed. No new public ActivityPub extension fields are registered.

## Replay boundaries and limitations

The harness reserves each intent once and each `(chainId, txHash, logIndex)` once.
Identical offer retries reuse the agreement; changed retries fail. Confirmation
retries return a copy of the same receipt. Reservation and fulfillment writes
have no intervening `await`, so concurrent calls in **one harness instance** do
not double consume. There are at most 100 admitted offers per instance. Nothing
issues a Like or changes reaction counters, so existing Likes are not counted
again and the provider never impersonates the payer.

State and claims disappear on restart and are not shared between instances. This
is intentionally unsuitable for real billing. A production adapter would need
transactional persistent claims shared with all purchase/peer/refund consumers,
not a second monetary ledger, plus durable fulfillment/outbox handling. Existing
peer confirmation also owns its database event uniqueness constraint. The sample
never invokes preparation, broadcast, signing, RPC, refunds or role grants.
`ReceiptResult` and store readers are **trusted internal hooks**, not network
payloads or caller-provided booleans. Test fixtures simulate finality; this slice
cannot itself prove a chain's confirmation depth or permanent finality.

No frontend, database migration, full remote negotiation/rejection/cancellation,
real HTTP signing (only the native signedGet seam is wired), ActivityPub delivery, live chain connection, real transfer,
mainnet, custody, balance, or production activation is implemented. This does not
assert legal compliance. Full multi-server federation tests remain future work.

## Reproduce

With the repository dependencies already available, from `packages/backend`:

```sh
node node_modules/vitest/vitest.mjs run --config vitest.config.unit.ts --configLoader runner ../features/billing/test/backend/federated-sample.test.ts ../features/billing/test/backend/transfer-confirmation.test.ts ../features/billing/test/backend/country-eligibility.test.ts --cache=false
```

`federated-sample.fixture.ts` contains the local provider/payer documents, individual-user
Proposal, Actor/Note payment links, pending intent, mock country store, and confirmed
receipt event. The test executes the two-party exchange and checks substitution,
unknown versions, authorization, pending/unapproved receipts, replay, concurrent
reservation and event double consumption. The companion existing tests exercise
the real receipt decoder/confirmation policy and country policy with mocks.
No dependency installation, database or external server is required for these
unit/fixture tests.

/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { FetchAllowSoftFailMask } from '../../federation/backend/protocol/misc/check-against-url.js';
import { receiptEvidenceSchema } from './transfer.schema.js';
import type { ApRequestService } from '../../federation/backend/services/ApRequestService.js';
import type { MiPeerPaymentIntent } from './models/PeerPayment.js';
import type { ReceiptResult } from './transfer-confirmation.js';

export const SAMPLE_SERVICE = 'urn:misskey-a:sample:note-receipt:v1';
export const SAMPLE_CONTEXT = ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/fep/0837'];
const proposalRel = 'https://w3id.org/valueflows/ont/vf#Proposal';
const publicAudience = 'https://www.w3.org/ns/activitystreams#Public';
const uri = v.pipe(v.string(), v.maxLength(2048), v.url());
const quantity = v.object({ hasUnit: v.literal('one'), hasNumericalValue: v.pipe(v.string(), v.regex(/^[1-9][0-9]{0,77}$/)) });
const availability = v.object({ hasUnit: v.literal('one'), hasNumericalValue: v.pipe(v.string(), v.regex(/^(0|[1-9][0-9]{0,77})$/)) });
const intent = v.object({ id: uri, type: v.literal('Intent'), action: v.string(), resourceConformsTo: v.string(), resourceQuantity: quantity, availableQuantity: v.optional(availability) });
const proposalSchema = v.object({ '@context': v.array(v.string()), id: uri, type: v.literal('Proposal'), attributedTo: uri, purpose: v.literal('offer'),
																																		publishes: intent, reciprocal: intent, unitBased: v.literal(false), to: v.literal(publicAudience) });
const commitment = v.object({ type: v.literal('Commitment'), satisfies: uri, resourceQuantity: quantity });
const offerSchema = v.object({ '@context': v.array(v.string()), id: uri, type: v.literal('OfferAgreement'), actor: uri, to: uri, context: uri,
																															object: v.object({ type: v.literal('Agreement'), stipulates: commitment, stipulatesReciprocal: commitment }) });
const linkSchema = v.object({ type: v.literal('Link'), href: uri, rel: v.array(v.string()) });
const noteSchema = v.object({ id: uri, type: v.literal('Note'), attributedTo: uri, attachment: v.array(v.unknown()) });

type Proposal = v.InferOutput<typeof proposalSchema>;
type Offer = v.InferOutput<typeof offerSchema>;
export type SamplePaymentIntent = Pick<MiPeerPaymentIntent, 'id' | 'senderUserId' | 'recipientUserId' | 'terms' | 'chainId' | 'createdAt' | 'status' | 'txHash' | 'logIndex' | 'confirmedAt' | 'broadcastStartedAt' | 'countryEligibility' | 'broadcastCountryEligibility'>;
export type SampleConfig = {
	/** Only a local test harness may opt in. No runtime settings or provider are registered. */
	enabled?: boolean;
	providerActor: string;
	providerUserId: string;
	proposalId: string;
	contractAddress: string;
	toAddress: string;
	amountBaseUnits: string;
	/** Explicit trusted Note bindings; author must be this individual provider Actor. */
	targets: { noteUri: string; authorActor: string }[];
	payers: { actor: string; userId: string }[];
};
export type SampleDependencies = {
	/** Trusted local fixture stores, never a remote request body or arbitrary URL fetch. */
	readObject: (id: string) => Promise<unknown>;
	/** Always use discovery.beforePayment, never its display capability cache. */
	freshProposal: () => Promise<unknown>;
	readPaymentIntent: (id: string) => Promise<SamplePaymentIntent | null>;
	/** Adapter must use existing requireCountryEligibility for new agreements. */
	requireCountryEligibility: (senderUserId: string, recipientUserId: string) => Promise<unknown>;
};

function requireSample(value: unknown): asserts value {
	if (!value) throw new Error('Sample rejected');
}

function sameContext(context: string[]) {
	return context.length === SAMPLE_CONTEXT.length && context.every((value, i) => value === SAMPLE_CONTEXT[i]);
}

function sameQuantity(a: v.InferOutput<typeof quantity>, b: v.InferOutput<typeof quantity>) {
	return a.hasNumericalValue === b.hasNumericalValue;
}

function ownedUri(id: string, actor: string) {
	const value = new URL(id), owner = new URL(actor);
	return value.protocol === 'https:' && value.origin === owner.origin && !value.username && !value.password && !value.hash;
}

/** Sample-only URI: local chain 31337, ERC20 base units, exact recipient. Not a FEP-defined payment rail. */
export function sampleAsset(config: Pick<SampleConfig, 'contractAddress' | 'toAddress'>) {
	return `urn:misskey-a:sample:erc20:31337:${config.contractAddress}:${config.toAddress}:base-units:v1`;
}

/** A compacted, fixed-price subset. Unknown profile versions and product-name matches fail closed. */
export function validateSampleProposal(input: unknown, config: SampleConfig): Proposal {
	const proposal = v.parse(proposalSchema, input);
	requireSample(sameContext(proposal['@context']) && proposal.id === config.proposalId && proposal.attributedTo === config.providerActor && ownedUri(proposal.id, config.providerActor));
	requireSample(proposal.publishes.id === `${proposal.id}#primary` && proposal.publishes.action === 'deliverService' && proposal.publishes.resourceConformsTo === SAMPLE_SERVICE && proposal.publishes.resourceQuantity.hasNumericalValue === '1');
	requireSample(proposal.reciprocal.id === `${proposal.id}#reciprocal` && proposal.reciprocal.action === 'transfer' && proposal.reciprocal.resourceConformsTo === sampleAsset(config) && proposal.reciprocal.resourceQuantity.hasNumericalValue === config.amountBaseUnits);
	requireSample(proposal.publishes.availableQuantity && BigInt(proposal.publishes.availableQuantity.hasNumericalValue) >= 1n);
	requireSample(BigInt(config.amountBaseUnits) < 2n ** 256n && /^0x[0-9a-f]{40}$/.test(config.contractAddress) && /^0x[0-9a-f]{40}$/.test(config.toAddress));
	return proposal;
}

/** Profile-like display cache; never authorizes a purchase. Native signedGet retains SSRF policy. */
export function createSampleProposalDiscovery(native: Pick<ApRequestService, 'signedGet'>, signer: { id: string }, settings: SampleConfig, now = Date.now) {
	const config = structuredClone(settings);
	let cached: { supported: boolean; expiresAt: number } | null = null;
	let generation = 0;

	async function fresh() {
		requireSample(config.enabled === true && ownedUri(config.providerActor, config.providerActor) && ownedUri(config.proposalId, config.providerActor));
		// Strict URL/object checks, no HTML alternate traversal; no fetch/cache fallback.
		const actor = v.parse(v.object({ id: uri, type: v.literal('Person'), attachment: v.array(v.unknown()) }),
			await native.signedGet(config.providerActor, signer, FetchAllowSoftFailMask.Strict, false));
		requireSample(actor.id === config.providerActor && actor.attachment.some(value => {
			const link = v.safeParse(linkSchema, value);
			return link.success && link.output.href === config.proposalId && link.output.rel.includes('payment') && link.output.rel.includes(proposalRel);
		}));
		return validateSampleProposal(await native.signedGet(config.proposalId, signer, FetchAllowSoftFailMask.Strict, false), config);
	}

	async function refresh() {
		const revision = ++generation;
		// Invalidate first, so failed/blocked requests can never leave a usable positive cache.
		cached = null;
		try {
			const proposal = await fresh();
			requireSample(revision === generation);
			cached = { supported: true, expiresAt: now() + 60_000 };
			return proposal;
		} catch (error) {
			cached = null;
			throw error;
		}
	}

	return {
		async capability() {
			if (cached && cached.expiresAt > now()) return { ...cached };
			try { await refresh(); } catch { return { supported: false, expiresAt: now() }; }
			return cached ? { ...cached } : { supported: false, expiresAt: now() };
		},
		/** Every new offer/acceptance fetches the user's profile and latest Proposal, even with a hot cache. */
		beforePayment: refresh,
		invalidate() { generation++; cached = null; },
	};
}

function finalized(agreementId: string, provider: string, offer: Offer) {
	return { type: 'Agreement', id: agreementId, attributedTo: provider,
										stipulates: { ...offer.object.stipulates, id: `${agreementId}#primary` },
										stipulatesReciprocal: { ...offer.object.stipulatesReciprocal, id: `${agreementId}#reciprocal` } };
}

function acceptance(agreementId: string, provider: string, offer: Offer) {
	return { '@context': [...SAMPLE_CONTEXT], type: 'AcceptAgreement', id: `${agreementId}/accept`, actor: provider, to: offer.actor,
										object: offer.id, context: offer.context, result: finalized(agreementId, provider, offer) };
}

function receipt(agreementId: string, provider: string, offer: Offer) {
	return { '@context': [SAMPLE_CONTEXT[0]], type: 'Create', id: `${agreementId}/receipt/create`, actor: provider, to: offer.actor,
										object: { type: 'Document', id: `${agreementId}/receipt`, name: 'sample fulfillment', context: agreementId, url: offer.context } };
}

type Entry = { offer: Offer; payment: SamplePaymentIntent; agreementId: string; state: 'offered' | 'accepted' | 'fulfilled'; receipt: ReturnType<typeof receipt> | null };

/** Local-only in-memory state machine. Deliberately absent from the API/DI/inbox/outbox registries. */
export function createFederatedSampleHarness(settings: SampleConfig, deps: SampleDependencies) {
	// Callers cannot change allowlists or prices after accepting an offer.
	const config = structuredClone(settings);
	const entries = new Map<string, Entry>();
	const intentClaims = new Map<string, string>();
	const eventClaims = new Map<string, string>();

	function enabled() { requireSample(config.enabled === true); }

	function entry(id: string) { const row = entries.get(id); requireSample(row); return row; }

	function paymentMatches(payment: SamplePaymentIntent, payerUserId: string) {
		requireSample(payment.senderUserId === payerUserId && payment.recipientUserId === config.providerUserId && payment.chainId === 31337 && payment.terms.token.chainId === 31337);
		requireSample(payment.terms.token.contractAddress === config.contractAddress && payment.terms.toAddress === config.toAddress && payment.terms.amountBaseUnits === config.amountBaseUnits && payment.countryEligibility != null);
	}

	return {
		async offer(input: unknown, authenticatedActor: string, paymentIntentId: string) {
			enabled();
			const offer = v.parse(offerSchema, input);
			requireSample(sameContext(offer['@context']) && offer.actor === authenticatedActor && ownedUri(offer.id, authenticatedActor) && offer.to === config.providerActor);
			const payer = config.payers.find(item => item.actor === authenticatedActor);
			const target = config.targets.find(item => item.noteUri === offer.context);
			requireSample(payer && target);
			const note = v.parse(noteSchema, await deps.readObject(target.noteUri));
			requireSample(note.id === target.noteUri && note.attributedTo === target.authorActor && target.authorActor === config.providerActor && ownedUri(note.id, note.attributedTo));
			requireSample(note.attachment.some(value => {
				const link = v.safeParse(linkSchema, value);
				return link.success && link.output.href === config.proposalId && link.output.rel.includes('payment') && link.output.rel.includes(proposalRel);
			}));
			const proposal = validateSampleProposal(await deps.freshProposal(), config);
			requireSample(offer.object.stipulates.satisfies === proposal.publishes.id && offer.object.stipulatesReciprocal.satisfies === proposal.reciprocal.id && sameQuantity(offer.object.stipulates.resourceQuantity, proposal.publishes.resourceQuantity) && sameQuantity(offer.object.stipulatesReciprocal.resourceQuantity, proposal.reciprocal.resourceQuantity));
			const prior = entries.get(offer.id);
			if (prior) {
				requireSample(JSON.stringify(prior.offer) === JSON.stringify(offer) && prior.payment.id === paymentIntentId);
				return { state: prior.state, agreementId: prior.agreementId };
			}
			const payment = await deps.readPaymentIntent(paymentIntentId);
			requireSample(payment && payment.id === paymentIntentId && payment.status === 'pending' && payment.txHash === null && payment.broadcastStartedAt === null);
			paymentMatches(payment, payer.userId);
			await deps.requireCountryEligibility(payer.userId, config.providerUserId);
			// No awaits between reservation checks and writes: atomic only within this harness instance.
			requireSample(entries.size < 100 && !entries.has(offer.id) && !intentClaims.has(paymentIntentId));
			const agreementId = `${config.proposalId}/agreements/${encodeURIComponent(offer.id)}`;
			entries.set(offer.id, { offer: structuredClone(offer), payment: structuredClone(payment), agreementId, state: 'offered', receipt: null });
			intentClaims.set(paymentIntentId, offer.id);
			return { state: 'offered', agreementId };
		},
		async accept(offerId: string, authenticatedActor: string) {
			enabled(); requireSample(authenticatedActor === config.providerActor);
			const row = entry(offerId);
			if (row.state === 'offered') {
				// Acceptance immediately precedes any fixture payment action; refresh conditions again.
				validateSampleProposal(await deps.freshProposal(), config);
				requireSample(row.payment.senderUserId);
				await deps.requireCountryEligibility(row.payment.senderUserId, config.providerUserId);
				if (entry(offerId).state === 'offered') row.state = 'accepted';
			}
			return structuredClone(acceptance(row.agreementId, config.providerActor, row.offer));
		},
		/** Trusted verified-payment hook; acceptance and txHash alone never fulfill. No network or Like. */
		async confirm(offerId: string, authenticatedActor: string, result: ReceiptResult) {
			enabled(); requireSample(authenticatedActor === config.providerActor);
			const row = entry(offerId);
			requireSample(row.state !== 'offered');
			if (row.receipt) return structuredClone(row.receipt);
			requireSample(result.status === 'confirmed');
			const proof = v.parse(receiptEvidenceSchema, result.evidence);
			const payment = await deps.readPaymentIntent(row.payment.id);
			requireSample(payment && payment.id === row.payment.id && payment.status === 'confirmed' && payment.confirmedAt !== null && payment.broadcastStartedAt !== null && payment.broadcastCountryEligibility != null);
			requireSample(row.payment.senderUserId);
			paymentMatches(payment, row.payment.senderUserId);
			requireSample(payment.terms.fromAddress === row.payment.terms.fromAddress && payment.terms.senderWalletId === row.payment.terms.senderWalletId && payment.terms.recipientWalletId === row.payment.terms.recipientWalletId);
			requireSample(proof.chainId === payment.chainId && proof.txHash === payment.txHash && proof.blockHash !== undefined && proof.blockNumber !== undefined && proof.timestamp + 2000 >= row.payment.createdAt);
			const logs = proof.transfers.filter(log => log.logIndex === payment.logIndex && log.contractAddress === config.contractAddress && log.fromAddress === row.payment.terms.fromAddress && log.toAddress === config.toAddress && log.amountBaseUnits === config.amountBaseUnits);
			requireSample(logs.length === 1);
			const key = `${proof.chainId}:${proof.txHash}:${logs[0].logIndex}`;
			const claimedBy = eventClaims.get(key);
			requireSample(claimedBy === undefined || claimedBy === offerId);
			// All state changes and the local fulfillment receipt commit together, without an external side effect.
			eventClaims.set(key, offerId);
			row.receipt = receipt(row.agreementId, config.providerActor, row.offer);
			row.state = 'fulfilled';
			return structuredClone(row.receipt);
		},
		status(offerId: string, authenticatedActor: string) {
			enabled(); const row = entry(offerId);
			requireSample(authenticatedActor === row.offer.actor || authenticatedActor === config.providerActor);
			return { state: row.state, agreementId: row.agreementId };
		},
	};
}

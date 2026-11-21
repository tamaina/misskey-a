/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { vi } from 'vitest';
import { createFederatedSampleHarness, createSampleProposalDiscovery, SAMPLE_CONTEXT, SAMPLE_SERVICE, sampleAsset } from '../../backend/federated-sample.js';
import { requireCountryEligibility } from '../../backend/country-eligibility.js';
import type { SampleConfig, SamplePaymentIntent } from '../../backend/federated-sample.js';
import type { ReceiptResult } from '../../backend/transfer-confirmation.js';
import type { DeclaredResidence } from '../../backend/residence.schema.js';
import type { EntityManager } from 'typeorm';

export const provider = 'https://provider.example.test/actor';
export const payer = 'https://payer.example.test/actor';
export const noteUri = 'https://provider.example.test/notes/1';
export const proposalId = 'https://provider.example.test/proposals/sample';
export const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
export const hash = `0x${'a'.repeat(64)}`;
export function sampleFixture(enabled = true) {
	const config: SampleConfig = { enabled, providerActor: provider, providerUserId: 'provider', proposalId, contractAddress: address(3), toAddress: address(2), amountBaseUnits: '7', targets: [{ noteUri, authorActor: provider }], payers: [{ actor: payer, userId: 'payer' }] };
	const quantity = { hasUnit: 'one', hasNumericalValue: '1' };
	const price = { hasUnit: 'one', hasNumericalValue: '7' };
	const proposal = { '@context': [...SAMPLE_CONTEXT], id: proposalId, type: 'Proposal', attributedTo: provider, purpose: 'offer', unitBased: false, to: 'https://www.w3.org/ns/activitystreams#Public',
																				publishes: { type: 'Intent', id: `${proposalId}#primary`, action: 'deliverService', resourceConformsTo: SAMPLE_SERVICE, resourceQuantity: quantity, availableQuantity: { hasUnit: 'one', hasNumericalValue: '1' } },
																				reciprocal: { type: 'Intent', id: `${proposalId}#reciprocal`, action: 'transfer', resourceConformsTo: sampleAsset(config), resourceQuantity: price } };
	const note = { type: 'Note', id: noteUri, attributedTo: provider, attachment: [{ type: 'Link', href: proposalId, rel: ['payment', 'https://w3id.org/valueflows/ont/vf#Proposal'] }] };
	const offer = { '@context': [...SAMPLE_CONTEXT], type: 'OfferAgreement', id: 'https://payer.example.test/offers/1', actor: payer, to: provider, context: noteUri,
																	object: { type: 'Agreement', stipulates: { type: 'Commitment', satisfies: proposal.publishes.id, resourceQuantity: quantity }, stipulatesReciprocal: { type: 'Commitment', satisfies: proposal.reciprocal.id, resourceQuantity: price } } };
	const residence = (country: 'CA' | 'US'): DeclaredResidence => ({ country, subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' });
	const profiles: Record<string, { billingResidence: DeclaredResidence | null; billingPeerReceiptSettings?: unknown }> = { payer: { billingResidence: residence('CA') }, provider: { billingResidence: residence('CA') } };
	const policy = { id: 'server', revision: 1, policy: { countryEligibility: { operatorCountry: 'CA', mode: 'allow', allowedCountries: ['CA', 'US'] }, residenceRequiredSubdivisions: [] } };
	const manager = { query: vi.fn(async () => []), getRepository: () => ({ findOne: async ({ where }: { where: { userId: string } }) => profiles[where.userId] }), findOneBy: async () => policy } as unknown as EntityManager;
	const countryGuard = vi.fn((sender: string, recipient: string) => requireCountryEligibility(manager, sender, recipient));
	const payment: SamplePaymentIntent = { id: 'intent-1', senderUserId: 'payer', recipientUserId: 'provider', chainId: 31337, createdAt: 100, status: 'pending', txHash: null, logIndex: null, confirmedAt: null, broadcastStartedAt: null,
																																								countryEligibility: { policyRevision: 1, policy: { operatorCountry: 'CA', mode: 'domestic', allowedCountries: [] }, sender: residence('CA'), recipient: residence('CA'), recipientReceiptSettings: { revision: 0, acceptForeignPayments: false } }, broadcastCountryEligibility: null,
																																								terms: { senderWalletId: 'wallet-1', recipientWalletId: 'wallet-2', fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7', token: { id: 'mock-token', name: 'mock', chainId: 31337, contractAddress: address(3), decimals: 0, tokenSymbol: 'MOCK', confirmationsRequired: 3, isEnabled: true } } };
	const actor = { id: provider, type: 'Person', attachment: [...note.attachment] };
	const objects: Record<string, unknown> = { [provider]: actor, [proposalId]: proposal, [noteUri]: note };
	const signedGet = vi.fn(async (id: string, _signer: { id: string }, _strict?: number, _alternate?: boolean) => objects[id]);
	let time = 1000;
	const discovery = createSampleProposalDiscovery({ signedGet }, { id: 'local-fixture-signer' }, config, () => time);
	const payments: Record<string, SamplePaymentIntent> = { [payment.id]: payment };
	const deps = { freshProposal: discovery.beforePayment, readObject: vi.fn(async (id: string) => objects[id]), readPaymentIntent: vi.fn(async (id: string) => payments[id] ?? null), requireCountryEligibility: countryGuard };
	const harness = createFederatedSampleHarness(config, deps);
	const proof: ReceiptResult = { status: 'confirmed', evidence: { chainId: 31337, txHash: hash, timestamp: 101, blockHash: `0x${'b'.repeat(64)}`, blockNumber: '10', transfers: [{ logIndex: 2, contractAddress: address(3), fromAddress: address(1), toAddress: address(2), amountBaseUnits: '7' }] } };

	function paid() { Object.assign(payment, { status: 'confirmed', txHash: hash, logIndex: 2, confirmedAt: 110, broadcastStartedAt: 100, broadcastCountryEligibility: payment.countryEligibility }); }

	return { config, harness, actor, discovery, signedGet, advance: (ms: number) => { time += ms; }, deps, offer, proposal, note, payment, payments, proof, profiles, policy, paid, residence, objects };
}

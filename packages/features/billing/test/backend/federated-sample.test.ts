/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { createFederatedSampleHarness, validateSampleProposal } from '../../backend/federated-sample.js';
import { sampleFixture, payer, provider, noteUri, proposalId, address } from './federated-sample.fixture.js';

async function accepted() {
	const f = sampleFixture();
	await f.harness.offer(f.offer, payer, f.payment.id);
	await f.harness.accept(f.offer.id, provider);
	return f;
}

test('disabled sample refuses without reading objects, payments or policy', async () => {
	const f = sampleFixture(false);
	await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow();
	expect(f.deps.readObject).not.toHaveBeenCalled();
	expect(f.deps.readPaymentIntent).not.toHaveBeenCalled();
	expect(f.deps.requireCountryEligibility).not.toHaveBeenCalled();
});

test('local fixture exchange binds offer, finalized agreement and private fulfillment; acceptance is unpaid', async () => {
	const f = sampleFixture();
	const offered = await f.harness.offer(f.offer, payer, f.payment.id);
	expect(offered.state).toBe('offered');
	const accept = await f.harness.accept(f.offer.id, provider);
	expect(accept).toMatchObject({ type: 'AcceptAgreement', actor: provider, to: payer, object: f.offer.id, context: noteUri,
																																result: { type: 'Agreement', id: offered.agreementId, attributedTo: provider,
																																										stipulates: { id: `${offered.agreementId}#primary`, satisfies: `${proposalId}#primary` }, stipulatesReciprocal: { id: `${offered.agreementId}#reciprocal`, satisfies: `${proposalId}#reciprocal` } } });
	expect(f.harness.status(f.offer.id, payer).state).toBe('accepted');
	await expect(f.harness.confirm(f.offer.id, provider, f.proof)).rejects.toThrow();
	f.paid();
	const receipt = await f.harness.confirm(f.offer.id, provider, f.proof);
	expect(receipt).toMatchObject({ type: 'Create', actor: provider, to: payer, object: { type: 'Document', context: offered.agreementId, url: noteUri } });
	for (const privateValue of [f.payment.id, f.payment.txHash, f.payment.terms.fromAddress, f.payment.terms.toAddress, 'billingResidence', 'Like']) expect(JSON.stringify(receipt)).not.toContain(privateValue);
	expect(f.harness.status(f.offer.id, payer).state).toBe('fulfilled');
	expect(f.deps.requireCountryEligibility).toHaveBeenCalledTimes(2);
	// Only snapshots from admission are needed for recovery, as in the existing payment stack.
	f.profiles.payer.billingResidence = null;
	expect(await f.harness.confirm(f.offer.id, provider, f.proof)).toEqual(receipt);
});

test('unknown specification, old contexts, names and altered proposals cannot establish compatibility', () => {
	for (const mutate of [
		(f: ReturnType<typeof sampleFixture>) => { f.proposal.publishes.resourceConformsTo += ':v2'; },
		(f: ReturnType<typeof sampleFixture>) => { f.proposal['@context'][1] = 'https://attacker.example/context'; },
		(f: ReturnType<typeof sampleFixture>) => { f.proposal.attributedTo = payer; },
		(f: ReturnType<typeof sampleFixture>) => { f.proposal.id += '/other'; },
		(f: ReturnType<typeof sampleFixture>) => { f.proposal.reciprocal.resourceConformsTo += ':other'; },
		(f: ReturnType<typeof sampleFixture>) => { f.proposal.reciprocal.resourceQuantity.hasNumericalValue = '8'; },
	]) {
		const f = sampleFixture(); mutate(f);
		expect(() => validateSampleProposal({ ...f.proposal, name: 'sample' }, f.config)).toThrow();
	}
});

test('actor, target, payment link, commitment and authenticated identity substitution fail closed', async () => {
	const mutations: ((f: ReturnType<typeof sampleFixture>) => void)[] = [
		f => { f.offer.actor = provider; }, f => { f.offer.to = payer; }, f => { f.offer.id = 'https://attacker.example/offers/1'; },
		f => { f.offer.context += '/other'; }, f => { f.note.id += '/other'; }, f => { f.note.attributedTo = payer; },
		f => { f.note.attachment = []; }, f => { f.note.attachment[0].href += '/other'; }, f => { f.note.attachment[0].rel = ['payment']; },
		f => { f.offer.object.stipulates.satisfies += '/other'; }, f => { f.offer.object.stipulatesReciprocal.resourceQuantity = { hasUnit: 'one', hasNumericalValue: '8' }; },
	];
	for (const mutate of mutations) {
		const f = sampleFixture(); mutate(f);
		await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow();
	}
	const f = sampleFixture();
	await expect(f.harness.offer(f.offer, provider, f.payment.id)).rejects.toThrow();
});

test('individual user Proposals apply to linked Notes without per-activity copies', async () => {
	const f = sampleFixture();
	const second = `${noteUri}/second`;
	f.config.targets.push({ noteUri: second, authorActor: provider });
	f.objects[second] = { ...f.note, id: second };
	const harness = createFederatedSampleHarness(f.config, f.deps);
	await harness.offer({ ...f.offer, context: second }, payer, f.payment.id);
	expect(harness.status(f.offer.id, payer).state).toBe('offered');
});

test('admission reuses existing residence, country permission and default-OFF overseas recipient guard', async () => {
	for (const mode of ['missing', 'foreign-off', 'server-denied'] as const) {
		const f = sampleFixture();
		if (mode === 'missing') f.profiles.payer.billingResidence = null;
		else f.profiles.provider.billingResidence = f.residence('US');
		if (mode === 'server-denied') { f.profiles.provider.billingPeerReceiptSettings = { revision: 1, acceptForeignPayments: true }; f.policy.policy.countryEligibility.allowedCountries = ['CA']; }
		await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow();
	}
	const f = sampleFixture();
	f.profiles.provider.billingResidence = f.residence('US');
	f.profiles.provider.billingPeerReceiptSettings = { revision: 1, acceptForeignPayments: true };
	await f.harness.offer(f.offer, payer, f.payment.id);
	f.profiles.provider.billingPeerReceiptSettings = { revision: 2, acceptForeignPayments: false };
	await expect(f.harness.accept(f.offer.id, provider)).rejects.toThrow();
	expect(f.harness.status(f.offer.id, payer).state).toBe('offered');
});

test('pending, invalid, unapproved, changed party/terms or wrong event cannot fulfill', async () => {
	for (const mutate of [
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.broadcastStartedAt = null; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.broadcastCountryEligibility = null; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.status = 'pending'; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.senderUserId = 'other'; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.recipientUserId = 'other'; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.terms.fromAddress = address(9); },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.terms.toAddress = address(9); },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.terms.token.contractAddress = address(9); },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.chainId = 1; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.terms.amountBaseUnits = '8'; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.logIndex = 3; },
		(f: Awaited<ReturnType<typeof accepted>>) => { f.payment.txHash = `0x${'c'.repeat(64)}`; },
	]) {
		const f = await accepted(); f.paid(); mutate(f);
		await expect(f.harness.confirm(f.offer.id, provider, f.proof)).rejects.toThrow();
		expect(f.harness.status(f.offer.id, payer).state).toBe('accepted');
	}
	const f = await accepted(); f.paid();
	for (const result of [{ status: 'pending' }, { status: 'invalid' }] as const) await expect(f.harness.confirm(f.offer.id, provider, result)).rejects.toThrow();
});

test('offer replay is idempotent, altered replay and intent reuse are rejected; copies cannot mutate state', async () => {
	const f = await accepted();
	expect((await f.harness.offer(f.offer, payer, f.payment.id)).state).toBe('accepted');
	await expect(f.harness.offer({ ...f.offer, id: `${f.offer.id}/second` }, payer, f.payment.id)).rejects.toThrow();
	await expect(f.harness.offer(f.offer, payer, 'other-intent')).rejects.toThrow();
	const result = await f.harness.accept(f.offer.id, provider); result.result.stipulates.resourceQuantity.hasNumericalValue = '99';
	expect((await f.harness.accept(f.offer.id, provider)).result.stipulates.resourceQuantity.hasNumericalValue).toBe('1');
	f.paid();
	const receipts = await Promise.all([f.harness.confirm(f.offer.id, provider, f.proof), f.harness.confirm(f.offer.id, provider, f.proof)]);
	expect(receipts[0]).toEqual(receipts[1]);
	receipts[0].object.url = 'https://attacker.example/';
	expect((await f.harness.confirm(f.offer.id, provider, f.proof)).object.url).toBe(noteUri);
});

test('one chain/hash/log event cannot fulfill two agreements, even if a faulty fixture duplicates confirmed intents', async () => {
	const f = sampleFixture();
	f.payments.second = { ...structuredClone(f.payment), id: 'second' };
	const second = { ...structuredClone(f.offer), id: `${f.offer.id}/second` };
	await f.harness.offer(f.offer, payer, f.payment.id);
	await f.harness.offer(second, payer, 'second');
	await f.harness.accept(f.offer.id, provider); await f.harness.accept(second.id, provider);
	f.paid(); Object.assign(f.payments.second, structuredClone(f.payment), { id: 'second' });
	await f.harness.confirm(f.offer.id, provider, f.proof);
	await expect(f.harness.confirm(second.id, provider, f.proof)).rejects.toThrow();
});

test('pre-acceptance confirmation and unauthorized acceptance, confirmation or status are rejected', async () => {
	const f = sampleFixture(); await f.harness.offer(f.offer, payer, f.payment.id); f.paid();
	await expect(f.harness.confirm(f.offer.id, provider, f.proof)).rejects.toThrow();
	await expect(f.harness.accept(f.offer.id, payer)).rejects.toThrow();
	await f.harness.accept(f.offer.id, provider);
	await expect(f.harness.confirm(f.offer.id, payer, f.proof)).rejects.toThrow();
	expect(() => f.harness.status(f.offer.id, 'https://attacker.example/actor')).toThrow();
});

test('missing opt-in stays disabled and unknown or altered log evidence cannot fulfill', async () => {
	const disabled = sampleFixture(); delete disabled.config.enabled;
	const harness = createFederatedSampleHarness(disabled.config, disabled.deps);
	await expect(harness.offer(disabled.offer, payer, disabled.payment.id)).rejects.toThrow();
	for (const mode of ['no-block', 'wrong-amount', 'wrong-from', 'wrong-token', 'duplicate'] as const) {
		const f = await accepted(); f.paid();
		const proof = f.proof.evidence;
		if (mode === 'no-block') delete proof.blockHash;
		if (mode === 'wrong-amount') proof.transfers[0].amountBaseUnits = '8';
		if (mode === 'wrong-from') proof.transfers[0].fromAddress = address(9);
		if (mode === 'wrong-token') proof.transfers[0].contractAddress = address(9);
		if (mode === 'duplicate') proof.transfers.push({ ...proof.transfers[0] });
		await expect(f.harness.confirm(f.offer.id, provider, f.proof)).rejects.toThrow();
	}
	const old = sampleFixture(); old.payment.createdAt = 10000;
	await old.harness.offer(old.offer, payer, old.payment.id); await old.harness.accept(old.offer.id, provider); old.paid();
	await expect(old.harness.confirm(old.offer.id, provider, old.proof)).rejects.toThrow();
});

test('pending event can recover, independent log indexes remain independent, concurrent intent reservation is unique', async () => {
	const f = sampleFixture();
	const second = { ...structuredClone(f.offer), id: `${f.offer.id}/second` };
	const attempts = await Promise.allSettled([f.harness.offer(f.offer, payer, f.payment.id), f.harness.offer(second, payer, f.payment.id)]);
	expect(attempts.filter(value => value.status === 'fulfilled')).toHaveLength(1);
	const chosen = attempts[0].status === 'fulfilled' ? f.offer : second;
	await f.harness.accept(chosen.id, provider);
	await expect(f.harness.confirm(chosen.id, provider, { status: 'pending' })).rejects.toThrow();
	f.paid(); await f.harness.confirm(chosen.id, provider, f.proof);
	const third = { ...structuredClone(f.offer), id: `${f.offer.id}/third` };
	const g = sampleFixture(); f.payments.third = { ...structuredClone(g.payment), id: 'third' };
	await f.harness.offer(third, payer, 'third'); await f.harness.accept(third.id, provider);
	Object.assign(f.payments.third, structuredClone(f.payment), { id: 'third', logIndex: 3 });
	g.proof.evidence.transfers[0].logIndex = 3;
	expect((await f.harness.confirm(third.id, provider, g.proof)).object.context).not.toBe(f.harness.status(chosen.id, payer).agreementId);
});

test('capability is cached for display, but each purchase does fresh strict signedGet and rejects price/spec/availability changes', async () => {
	for (const mode of ['price', 'spec', 'closed', 'profile-link', 'attribution'] as const) {
		const f = sampleFixture();
		expect((await f.discovery.capability()).supported).toBe(true);
		expect((await f.discovery.capability()).supported).toBe(true);
		expect(f.signedGet).toHaveBeenCalledTimes(2);
		for (const call of f.signedGet.mock.calls) expect(call.slice(1)).toEqual([{ id: 'local-fixture-signer' }, 0, false]);
		if (mode === 'price') f.proposal.reciprocal.resourceQuantity.hasNumericalValue = '9';
		if (mode === 'spec') f.proposal.publishes.resourceConformsTo += ':v2';
		if (mode === 'closed') f.proposal.publishes.availableQuantity.hasNumericalValue = '0';
		if (mode === 'profile-link') f.actor.attachment = [];
		if (mode === 'attribution') f.proposal.attributedTo = payer;
		// The still-hot positive display cache cannot authorize this offer.
		await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow();
		expect(f.signedGet.mock.calls.length).toBeGreaterThan(2);
	}
});

test('cache expiry, invalidation, failed signedGet/SSRF rejection and changed pre-payment terms fail closed', async () => {
	const f = sampleFixture();
	await f.discovery.capability(); f.advance(60_001); await f.discovery.capability();
	expect(f.signedGet).toHaveBeenCalledTimes(4);
	f.discovery.invalidate(); await f.discovery.capability();
	expect(f.signedGet).toHaveBeenCalledTimes(6);
	f.signedGet.mockRejectedValue(new Error('native private address blocked'));
	await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow('native private address blocked');
	expect((await f.discovery.capability()).supported).toBe(false);
	const g = sampleFixture(); await g.harness.offer(g.offer, payer, g.payment.id);
	g.proposal.publishes.availableQuantity.hasNumericalValue = '0';
	await expect(g.harness.accept(g.offer.id, provider)).rejects.toThrow();
	expect(g.harness.status(g.offer.id, payer).state).toBe('offered');
});

test('Service Actors and another user authoring a target cannot substitute for the target user Actor', async () => {
	const f = sampleFixture(); f.actor.type = 'Service';
	await expect(f.harness.offer(f.offer, payer, f.payment.id)).rejects.toThrow();
	const g = sampleFixture(); g.config.targets[0].authorActor = payer; g.note.attributedTo = payer;
	const harness = createFederatedSampleHarness(g.config, g.deps);
	await expect(harness.offer(g.offer, payer, g.payment.id)).rejects.toThrow();
});

test('explicit invalidation cancels an in-flight pre-payment refresh without stale cache approval', async () => {
	const f = sampleFixture();
	let release: (value: unknown) => void = () => {};
	f.signedGet.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	const pending = f.discovery.beforePayment();
	f.discovery.invalidate(); release(f.actor);
	await expect(pending).rejects.toThrow();
	f.signedGet.mockRejectedValue(new Error('offline'));
	expect((await f.discovery.capability()).supported).toBe(false);
});

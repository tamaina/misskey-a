/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const query = new URL(window.location.href).searchParams;
export const $i = query.has('signedOut') ? null : { id: 'synthetic-owner' };
const state = {
	available: !query.has('unavailable'), enabled: !query.has('disabled'), address: 'owner@example.invalid', usedBytes: 256, quotaBytes: 1024,
	forwarding: { address: null, enabled: false, verified: false, revision: 0, keepLocalCopy: true },
};
const messages = Array.from({ length: 31 }, (_, index) => ({
	id: String(100 - index), subject: `Synthetic mail ${index + 1}`, from: 'sender@example.invalid', createdAt: '2026-11-16T00:00:00Z',
	readAt: null, localStored: true, parseState: 'parsed', localError: null, text: 'Plain <script>text only</script>',
	html: '<p>Isolated body</p><img src="https://tracker.invalid/pixel"><script>parent.mailScriptRan=true</script>',
	attachments: [{ id: 0, filename: 'attachment.txt', size: 7 }],
}));
const sent = [];
export const fixture = window.mailFixture = {
	calls: [], confirmations: [], windows: [], failNext: null, hold: null, release: null,
	cancel: false, deferConfirm: false, resolveConfirm: null, state,
};
export async function confirm(options) {
	fixture.confirmations.push(options);
	if (fixture.deferConfirm) return new Promise(resolve => { fixture.resolveConfirm = resolve; });
	return { canceled: fixture.cancel };
}
export function pageWindow(path) { fixture.windows.push(path); }
export function definePage() {}
const router = {
	getCurrentFullPath: () => window.location.pathname + window.location.search,
	replaceByPath: path => { window.history.replaceState(null, '', path); },
};
export function useRouter() { return router; }
export async function misskeyApi(endpoint, params) {
	fixture.calls.push({ endpoint, params: structuredClone(params) });
	if (fixture.hold === endpoint) await new Promise(resolve => { fixture.release = resolve; });
	if (fixture.failNext === endpoint) { fixture.failNext = null; throw Object.assign(new Error('Synthetic failure'), { code: 'SYNTHETIC_FAILURE' }); }
	let result;
	switch (endpoint) {
		case 'email/state': result = state; break;
		case 'email/list': result = messages.filter(message => !params.untilId || Number(message.id) < Number(params.untilId)).slice(0, params.limit); break;
		case 'email/show': result = messages.find(message => message.id === params.id); break;
		case 'email/read': messages.find(message => message.id === params.id).readAt = params.isRead ? '2026-11-16T01:00:00Z' : null; break;
		case 'email/delete': {
			const list = messages.some(message => message.id === params.id) ? messages : sent;
			list.splice(list.findIndex(message => message.id === params.id), 1); break;
		}
		case 'email/raw': case 'email/attachment': result = { data: btoa('fixture'), filename: endpoint === 'email/raw' ? 'message.eml' : '../attachment.txt', mimeType: 'text/html' }; break;
		case 'email/preview': result = { html: params.format === 'mfm' ? '<strong style="color: red">Synthetic preview</strong>' : null, text: params.body }; break;
		case 'email/send':
			result = { ...params, id: 'submission', state: 'queued', createdAt: '2026-11-16T01:00:00Z', accepted: [], rejected: [] };
			sent.push(result); break;
		case 'email/sent': result = sent; break;
		case 'email/configure': state.enabled = params.enabled; break;
		case 'email/forwarding/configure': state.forwarding = { address: params.address, enabled: false, verified: false, revision: state.forwarding.revision + 1, keepLocalCopy: params.keepLocalCopy }; break;
		case 'email/forwarding/confirm': state.forwarding.verified = true; state.forwarding.enabled = true; break;
		default: throw new Error(`Unexpected fixture endpoint: ${endpoint}`);
	}
	return structuredClone(result);
}

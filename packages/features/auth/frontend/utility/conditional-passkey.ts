/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { base64URLStringToBuffer, bufferToBase64URLString } from '@simplewebauthn/browser';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';

type LibraryExtensions = NonNullable<PublicKeyCredentialRequestOptionsJSON['extensions']>;
type LibraryPrfValues = NonNullable<NonNullable<LibraryExtensions['prf']>['eval']>;

/** Copy extension buffers into DOM-compatible, request-owned ArrayBuffers. */
function normalizeExtensions(extensions: LibraryExtensions | undefined): AuthenticationExtensionsClientInputs | undefined {
	if (!extensions) return undefined;
	const { prf, ...rest } = extensions;
	const copy = (value: LibraryPrfValues['first']): ArrayBuffer => {
		const bytes = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
		return bytes.slice().buffer;
	};
	const values = (value: LibraryPrfValues): AuthenticationExtensionsPRFValues => ({ first: copy(value.first), ...(value.second ? { second: copy(value.second) } : {}) });
	return {
		...rest,
		...(prf ? { prf: {
			...(prf.eval ? { eval: values(prf.eval) } : {}),
			...(prf.evalByCredential ? { evalByCredential: Object.fromEntries(Object.entries(prf.evalByCredential).map(([id, value]) => [id, values(value)])) } : {}),
		} } : {}),
	};
}

// Shorter than the server's 90-second challenge TTL, including initialization time.
export const conditionalPasskeyWaitMs = 75000;

/** Use a request-owned signal rather than the library's shared abort singleton. */
export async function getConditionalCredential(options: PublicKeyCredentialRequestOptionsJSON, signal: AbortSignal): Promise<AuthenticationResponseJSON> {
	const { extensions, ...request } = options;
	const credential = await navigator.credentials.get({
		mediation: 'conditional', signal,
		publicKey: { ...request, challenge: base64URLStringToBuffer(options.challenge), allowCredentials: [], ...(extensions ? { extensions: normalizeExtensions(extensions) } : {}) },
	}) as PublicKeyCredential | null;
	if (!credential || credential.type !== 'public-key') throw new Error('No public-key credential selected');
	const response = credential.response as AuthenticatorAssertionResponse;
	return {
		id: credential.id, rawId: bufferToBase64URLString(credential.rawId), type: 'public-key',
		response: {
			clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
			authenticatorData: bufferToBase64URLString(response.authenticatorData),
			signature: bufferToBase64URLString(response.signature),
			userHandle: response.userHandle ? bufferToBase64URLString(response.userHandle) : undefined,
		},
		clientExtensionResults: credential.getClientExtensionResults(),
		authenticatorAttachment: credential.authenticatorAttachment === 'platform' || credential.authenticatorAttachment === 'cross-platform' ? credential.authenticatorAttachment : undefined,
	};
}

/** One opted-in login surface owns its pending request and ignores stale results. */
export function createConditionalPasskeyLogin<Result>(deps: {
	supported: () => Promise<boolean>;
	inputReady: () => boolean;
	challenge: (signal: AbortSignal) => Promise<{ context: string; option: PublicKeyCredentialRequestOptionsJSON }>;
	credential: (option: PublicKeyCredentialRequestOptionsJSON, signal: AbortSignal) => Promise<AuthenticationResponseJSON>;
	verify: (context: string, credential: AuthenticationResponseJSON) => Promise<Result>;
	verifying: (value: boolean) => void;
	login: (result: Result) => void;
}) {
	let committed: object | undefined;
	let active: { controller: AbortController; timer: number; deadline: number } | undefined;

	function cancel() {
		const previous = active;
		active = undefined;
		if (previous) {
			window.clearTimeout(previous.timer);
			previous.controller.abort();
		}
		if (!committed) deps.verifying(false);
	}

	async function start() {
		if (committed) return;
		cancel();
		const run = { controller: new AbortController(), deadline: Date.now() + conditionalPasskeyWaitMs, timer: window.setTimeout(() => { if (active === run) cancel(); }, conditionalPasskeyWaitMs) };
		active = run;
		const current = () => active === run && !run.controller.signal.aborted && (committed === run || Date.now() < run.deadline);
		try {
			if (!await deps.supported() || !current() || !deps.inputReady()) return;
			const challenge = await deps.challenge(run.controller.signal);
			if (!current()) return;
			const credential = await deps.credential(challenge.option, run.controller.signal);
			if (!current()) return;
			// Choosing a credential commits this login path; manual submission must wait.
			window.clearTimeout(run.timer);
			committed = run;
			deps.verifying(true);
			const result = await deps.verify(challenge.context, credential);
			if (current()) deps.login(result);
		} catch {
			// Opportunistic autofill must leave the normal login methods usable.
		} finally {
			if (committed === run) {
				committed = undefined;
				if (active === run) cancel();
				else deps.verifying(false);
			} else if (active === run) cancel();
		}
	}

	return { start, cancel };
}

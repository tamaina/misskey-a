/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import type { Endpoints } from 'misskey-js';

/** Validate extensible browser transport strings at the finite public API boundary. */
export function registrationWire(credential: RegistrationResponseJSON): Endpoints['i/security/passkey/register/complete']['req']['credential'] {
	const { transports: raw, ...response } = credential.response;
	const transports = raw?.map(transport => {
		switch (transport) {
			case 'ble': case 'cable': case 'hybrid': case 'internal': case 'nfc': case 'smart-card': case 'usb': return transport;
			default: throw new Error('Unsupported authenticator transport');
		}
	});
	return { ...credential, response: { ...response, ...(transports === undefined ? {} : { transports }) } };
}

/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { SecuritySettings } from './security-settings.js';
import type { SecuritySettingsDependencies } from './security-settings.js';
import { sudoIdentity } from './sudo.api.js';
import { securitySettingsContract as contract } from './security-settings.contract.js';
import { toWebAuthnAuthenticationOptions, toWebAuthnRegistrationOptions } from './webauthn.schema.js';

export function createSecuritySettingsRouter(deps: SecuritySettingsDependencies) {
	const security = new SecuritySettings(deps);
	const procedure = createApiProcedure<MiLocalUser>();
	return {
		'i/security/account/delete': procedure(contract['i/security/account/delete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.deleteAccount(sudoIdentity(context), input.acknowledged)),
		'i/security/passkey/passwordless/start': procedure(contract['i/security/passkey/passwordless/start']).use(requirePrincipal<MiLocalUser>()).handler(async ({ context }) => { const result = await security.passwordlessStart(sudoIdentity(context)); return { ...result, options: toWebAuthnAuthenticationOptions(result.options) }; }),
		'i/security/passkey/passwordless/complete': procedure(contract['i/security/passkey/passwordless/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.passwordlessComplete(sudoIdentity(context), input.ticket, input.credential)),
		'i/security/password-login/disable/start': procedure(contract['i/security/password-login/disable/start']).use(requirePrincipal<MiLocalUser>()).handler(async ({ context }) => { const result = await security.disablePasswordStart(sudoIdentity(context)); return { ...result, options: toWebAuthnAuthenticationOptions(result.options) }; }),
		'i/security/password-login/disable/complete': procedure(contract['i/security/password-login/disable/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.disablePasswordComplete(sudoIdentity(context), input.ticket, input.credential)),
		'i/security/password': procedure(contract['i/security/password']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.changePassword(sudoIdentity(context), input.newPassword)),
		'i/security/email': procedure(contract['i/security/email']).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => { await security.changeEmail(sudoIdentity(context), input.email); }),
		'i/security/regenerate-token': procedure(contract['i/security/regenerate-token']).use(requirePrincipal<MiLocalUser>()).handler(({ context }) => security.regenerateToken(sudoIdentity(context))),
		'i/security/state': procedure(contract['i/security/state']).use(requirePrincipal<MiLocalUser>()).handler(({ context }) => security.state(sudoIdentity(context))),
		'i/security/keys/list': procedure(contract['i/security/keys/list']).use(requirePrincipal<MiLocalUser>()).handler(({ context }) => security.listKeys(sudoIdentity(context))),
		'i/security/passkey/register/start': procedure(contract['i/security/passkey/register/start']).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
			const result = await security.registerStart(sudoIdentity(context), input.name);
			return { ...result, options: toWebAuthnRegistrationOptions(result.options) };
		}),
		'i/security/passkey/register/complete': procedure(contract['i/security/passkey/register/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.registerComplete(sudoIdentity(context), input.ticket, input.credential)),
		'i/security/passkey/mfa/start': procedure(contract['i/security/passkey/mfa/start']).use(requirePrincipal<MiLocalUser>()).handler(async ({ context }) => {
			const result = await security.activateStart(sudoIdentity(context));
			return { ...result, options: toWebAuthnAuthenticationOptions(result.options) };
		}),
		'i/security/passkey/mfa/complete': procedure(contract['i/security/passkey/mfa/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.activateComplete(sudoIdentity(context), input.ticket, input.credential, input.recoveryAcknowledged)),
		'i/security/passkey/mfa/disable': procedure(contract['i/security/passkey/mfa/disable']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.disablePasskeyMfa(sudoIdentity(context), input.acknowledged)),
		'i/security/passkey/remove': procedure(contract['i/security/passkey/remove']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.removeKey(sudoIdentity(context), input.credentialId)),
		'i/security/passkey/rename': procedure(contract['i/security/passkey/rename']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.renameKey(sudoIdentity(context), input.credentialId, input.name)),
		'i/security/passkey/passwordless': procedure(contract['i/security/passkey/passwordless']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.passwordless(sudoIdentity(context), input.enabled)),
		'i/security/totp/start': procedure(contract['i/security/totp/start']).use(requirePrincipal<MiLocalUser>()).handler(({ context }) => security.totpStart(sudoIdentity(context))),
		'i/security/totp/complete': procedure(contract['i/security/totp/complete']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.totpComplete(sudoIdentity(context), input.token)),
		'i/security/totp/remove': procedure(contract['i/security/totp/remove']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.removeTotp(sudoIdentity(context), input.confirmDisableMfa)),
		'i/security/recovery-codes': procedure(contract['i/security/recovery-codes']).use(requirePrincipal<MiLocalUser>()).handler(({ input, context }) => security.recoveryCodes(sudoIdentity(context), input.regenerate)),
	};
}

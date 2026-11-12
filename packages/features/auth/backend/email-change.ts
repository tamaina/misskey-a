/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { BrowserSessionIdentity } from '@features/api/backend/transport/context.js';
import type { EmailService } from '@features/email/backend/services/EmailService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { Config } from '@/config.js';
import { MiBrowserSession } from './models/BrowserSession.js';
import { MiUserSecurityKey } from './models/UserSecurityKey.js';
import type { FreshPasskeyReauthentication } from './fresh-passkey-reauthentication.js';
import { freshReauthenticationPolicyStamp } from './fresh-passkey-reauthentication.js';
import { assertLegacyMfaManagement, assertSameMfaPolicy } from './mfa-policy.js';
import type { MfaPolicySnapshot } from './mfa-policy.js';
import type { SudoService, SudoIdentity } from './sudo.js';
import { MiPasswordResetRequest } from './models/PasswordResetRequest.js';
import { L_CHARS, secureRndstr } from './utility/secure-rndstr.js';

export const emailChangeErrors = {
	incorrectPassword: { message: 'Incorrect password.', code: 'INCORRECT_PASSWORD', id: 'e54c1d7e-e7d6-4103-86b6-0a95069b4ad3' },
	unavailable: { message: 'Unavailable email address.', code: 'UNAVAILABLE', id: 'a2defefb-f220-8849-0af6-17f816099323' },
	emailRequired: { message: 'Email address is required.', code: 'EMAIL_REQUIRED', id: '324c7a88-59f2-492f-903f-89134f93e47e' },
} as const;
export interface EmailChangeDependencies {
	db: Pick<DataSource, 'transaction'>;
	config: Pick<Config, 'url'>;
	serverSettings: Pick<MiMeta, 'emailRequiredForSignup'>;
	emailService: Pick<EmailService, 'sendEmail' | 'validateEmailForAccount'>;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
type EmailState = Pick<MiUserProfile, 'email' | 'emailVerified' | 'emailVerifyCode'>;
export function emailChangeTargetStamp(email: string | null, profile: EmailState): string {
	return createHash('sha256').update(JSON.stringify(['update-email', email, profile.email ?? null, profile.emailVerified === true, profile.emailVerifyCode ?? null])).digest('hex');
}
export async function validateEmailChange(deps: Pick<EmailChangeDependencies, 'serverSettings' | 'emailService'>, email: string | null) {
	if (email === null) {
		if (deps.serverSettings.emailRequiredForSignup) throw apiError(emailChangeErrors.emailRequired);
	} else if (!(await deps.emailService.validateEmailForAccount(email)).available) throw apiError(emailChangeErrors.unavailable);
}

type Authority = { kind: 'fresh'; proof: Awaited<ReturnType<FreshPasskeyReauthentication['complete']>> }
	| { kind: 'legacy'; nativeToken: string; profile: MfaPolicySnapshot & EmailState; session?: BrowserSessionIdentity; omitEmail?: boolean }
	| { kind: 'sudo'; service: SudoService; identity: SudoIdentity };

/** One row update; notifications and external delivery happen only after commit. */
export async function changeEmail(deps: EmailChangeDependencies, userId: string, email: string | null, authority: Authority) {
	await validateEmailChange(deps, email);
	const code = email === null ? null : secureRndstr(16, { chars: L_CHARS });
	await deps.db.transaction(async manager => {
		const user = await manager.getRepository(MiUser).findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
		if (!user || user.host !== null || user.isDeleted || user.isSuspended || !user.token) throw new Error('authentication failed');
		const profile = await manager.getRepository(MiUserProfile).findOneOrFail({ where: { userId }, lock: { mode: 'pessimistic_write' } });
		if (profile.userId !== userId || profile.passwordLoginDisabled === true) throw new Error('authentication failed');
		const sudoDeadline = authority.kind === 'sudo' ? authority.service.assert(await authority.service.lock(authority.identity, manager, user, profile)) : null;
		const session = authority.kind === 'sudo' ? undefined : authority.kind === 'fresh' ? { id: authority.proof.sessionId, userId: authority.proof.userId } : authority.session;
		if (session && (session.userId !== userId || !await manager.getRepository(MiBrowserSession).findOne({ where: { id: session.id, userId, revokedAt: IsNull() }, lock: { mode: 'pessimistic_write' } }))) throw new Error('authentication failed');
		if (authority.kind === 'fresh') {
			const proof = authority.proof;
			const keys = await manager.getRepository(MiUserSecurityKey).findBy({ userId });
			if (proof.userId !== userId || proof.purpose !== 'update-email' || proof.targetStamp !== emailChangeTargetStamp(email, profile) || proof.policyStamp !== freshReauthenticationPolicyStamp(profile, keys) || performance.now() >= proof.expiresAtMonotonic) throw new Error('authentication failed');
		} else if (authority.kind === 'legacy') {
			assertLegacyMfaManagement(profile); assertSameMfaPolicy(authority.profile, profile);
			if (user.token !== authority.nativeToken || emailChangeTargetStamp(email, authority.profile) !== emailChangeTargetStamp(email, profile)) throw new Error('authentication failed');
		}
		if (email === null && deps.serverSettings.emailRequiredForSignup) throw apiError(emailChangeErrors.emailRequired);
		// The legacy optional field historically omitted this SET column entirely.
		const omitEmail = authority.kind === 'legacy' && authority.omitEmail === true;
		await manager.getRepository(MiUserProfile).update({ userId }, { ...(omitEmail ? {} : { email }), emailVerified: false, emailVerifyCode: code });
		// A reset mailed to the previous address must not survive this change.
		await manager.getRepository(MiPasswordResetRequest).delete({ userId });
		if (authority.kind === 'fresh' && performance.now() >= authority.proof.expiresAtMonotonic) throw new Error('authentication failed');
		if (sudoDeadline !== null && Date.now() >= sudoDeadline) throw new Error('authentication failed');
	});
	const packed = await deps.userEntityService.packSelf(userId, { includeSecrets: true });
	deps.globalEventService.publishMainStream(userId, 'meUpdated', packed);
	if (email !== null) {
		const link = `${deps.config.url}/verify-email/${code}`;
		// Delivery failure cannot roll back committed data or make a ticket reusable.
		await deps.emailService.sendEmail(email, 'Email verification', `To verify email, please click this link:<br><a href="${link}">${link}</a>`, `To verify email, please click this link: ${link}`);
	}
	return packed;
}

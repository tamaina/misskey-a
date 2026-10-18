/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SigninHistoryRepository } from '../session-signin-repository.js';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { SigninEntityService } from '@features/auth/backend/serializers/SigninEntityService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { AuthSessionRequest, AuthSessionEffects } from '../session.effects.js';
import { BrowserSessionService } from '../services/BrowserSessionService.js';
import { toSessionHeaders } from '../session.schema.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../models/UserSecurityKey.js';
import { MiBrowserSession } from '../models/BrowserSession.js';
import { assertCurrentSigninAssurance, assertSigninDeadline, consumeSigninAssurance, SigninPolicyError } from '../signin-assurance.js';
import { MiOidcProvider } from '../models/OidcProvider.js';
import { MiOidcIdentity } from '../models/OidcIdentity.js';
import type { SigninAssurance } from '../signin-assurance.js';

@Injectable()
export class SigninService {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninHistoryRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private signinEntityService: SigninEntityService,
		private emailService: EmailService,
		private notificationService: NotificationService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private browserSessionService: BrowserSessionService,
	) {
	}

	@bindThis
	public async signin(request: AuthSessionRequest, reply: AuthSessionEffects, user: Pick<MiLocalUser, 'id' | 'token'>, proof: SigninAssurance): Promise<{ finished: true; id: string; i: string }> {
		consumeSigninAssurance(proof, user.id);
		const { token } = await this.userProfilesRepository.manager.transaction(async manager => {
			// Match account deletion and token regeneration: user precedes profile/session locks.
			const current = await manager.getRepository(MiUser).findOne({ where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
			if (!current) throw new SigninPolicyError();
			const profile = await manager.getRepository(MiUserProfile).findOne({ where: { userId: user.id }, lock: { mode: 'pessimistic_write' } });
			if (!profile) throw new SigninPolicyError();
			const keys = await manager.getRepository(MiUserSecurityKey).findBy({ userId: user.id });
			assertCurrentSigninAssurance(proof, current, profile, keys);
			if (proof.mode === 'oidc') {
				const external = proof.external;
				if (!external) throw new SigninPolicyError();
				const provider = await manager.getRepository(MiOidcProvider).findOne({ where: { id: external.providerId }, lock: { mode: 'pessimistic_read' } });
				const identity = await manager.getRepository(MiOidcIdentity).findOne({ where: { id: external.identityId, userId: current.id, providerId: external.providerId, issuer: external.issuer, subject: external.subject }, lock: { mode: 'pessimistic_read' } });
				if (!provider?.enabled || provider.version !== external.providerVersion || provider.issuer !== external.issuer || !identity) throw new SigninPolicyError();
			}
			const issued = await this.browserSessionService.issue(user.id, manager.getRepository(MiBrowserSession));
			assertSigninDeadline(proof);
			return issued;
		});
		return this.completeSignin(request, reply, user.id, token);
	}

	@bindThis
	public async signinSignup(request: AuthSessionRequest, reply: AuthSessionEffects, account: Pick<MiLocalUser, 'id' | 'token'>): Promise<{ finished: true; id: string; i: string }> {
		const { token } = await this.browserSessionService.issueForNewAccount(account);
		return this.completeSignin(request, reply, account.id, token);
	}

	private completeSignin(request: AuthSessionRequest, reply: AuthSessionEffects, userId: string, token: string): { finished: true; id: string; i: string } {
		// The transaction has committed before any login side effect is scheduled.
		setImmediate(async () => {
			this.notificationService.createNotification(userId, 'login', {});

			const record = await this.signinsRepository.insertOne({
				id: this.idService.gen(),
				userId,
				ip: request.ip,
				headers: toSessionHeaders(request.headers),
				success: true,
			});

			this.globalEventService.publishMainStream(userId, 'signin', await this.signinEntityService.pack(record));

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId });
			if (profile.email && profile.emailVerified) {
				this.emailService.sendEmail(profile.email, 'New login / ログインがありました',
					'There is a new login. If you do not recognize this login, update the security status of your account, including changing your password. / 新しいログインがありました。このログインに心当たりがない場合は、パスワードを変更するなど、アカウントのセキュリティ状態を更新してください。',
					'There is a new login. If you do not recognize this login, update the security status of your account, including changing your password. / 新しいログインがありました。このログインに心当たりがない場合は、パスワードを変更するなど、アカウントのセキュリティ状態を更新してください。');
			}
		});

		reply.code(200);
		return {
			finished: true,
			id: userId,
			i: token,
		};
	}
}

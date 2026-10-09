/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull, LessThanOrEqual } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { toSessionHeaders } from '../session.schema.js';
import { sessionField, sessionText, sessionErrorMessage, type AuthSessionBody, type AuthSessionRequest, type AuthSessionEffects } from '../session.effects.js';
import { L_CHARS, secureRndstr } from '../utility/secure-rndstr.js';
import { SigninService } from './SigninService.js';
import type { RegistrationTicketsRepository, UsedUsernamesRepository, UserPendingsRepository, UserProfilesRepository, UsersRepository, MiRegistrationTicket, MiMeta } from '@features/persistence/backend/repositories/models.js';

const invitationCodeMailTimeoutMs = 1000 * 60 * 30;

@Injectable()
export class SignupApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: Omit<UserPendingsRepository, 'findOneByOrFail' | 'insertOne'> & { findOneByOrFail(where: { code: import('@features/users/backend/json-value.schema.js').PackedJsonValue | undefined }): Promise<import('../models/UserPending.js').MiUserPending>; insertOne(entity: import('typeorm').QueryDeepPartialEntity<import('../models/UserPending.js').MiUserPending>): Promise<import('../models/UserPending.js').MiUserPending> },

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private captchaService: CaptchaService,
		private signupService: SignupService,
		private signinService: SigninService,
		private emailService: EmailService,
	) {
	}

	@bindThis
	public async signup(
		body: AuthSessionBody,
		request: AuthSessionRequest,
		reply: AuthSessionEffects,
	) {
		// Verify *Captcha
		// ただしテスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test') {
			if (this.meta.enableHcaptcha && this.meta.hcaptchaSecretKey) {
				await this.captchaService.verifyHcaptcha(this.meta.hcaptchaSecretKey, sessionField(body, 'hcaptcha-response')).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableMcaptcha && this.meta.mcaptchaSecretKey && this.meta.mcaptchaSitekey && this.meta.mcaptchaInstanceUrl) {
				await this.captchaService.verifyMcaptcha(this.meta.mcaptchaSecretKey, this.meta.mcaptchaSitekey, this.meta.mcaptchaInstanceUrl, sessionField(body, 'm-captcha-response')).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableRecaptcha && this.meta.recaptchaSecretKey) {
				await this.captchaService.verifyRecaptcha(this.meta.recaptchaSecretKey, sessionField(body, 'g-recaptcha-response')).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableTurnstile && this.meta.turnstileSecretKey) {
				await this.captchaService.verifyTurnstile(this.meta.turnstileSecretKey, sessionField(body, 'turnstile-response')).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}

			if (this.meta.enableTestcaptcha) {
				await this.captchaService.verifyTestcaptcha(sessionField(body, 'testcaptcha-response')).catch(err => {
					throw new FastifyReplyError(400, err);
				});
			}
		}

		const username = sessionField(body, 'username');
		const password = sessionField(body, 'password');
		const host = process.env.NODE_ENV === 'test' ? (sessionField(body, 'host') ?? null) : null;
		const invitationCode = sessionField(body, 'invitationCode');
		const emailAddress = sessionField(body, 'emailAddress');

		if (this.meta.emailRequiredForSignup) {
			if (emailAddress == null || typeof emailAddress !== 'string') {
				reply.code(400);
				return;
			}

			const res = await this.emailService.validateEmailForAccount(emailAddress);
			if (!res.available) {
				reply.code(400);
				return;
			}
		}

		let ticket: MiRegistrationTicket | null = null;

		// テスト時はこの機構は障害となるため無効にする
		if (process.env.NODE_ENV !== 'test' && this.meta.disableRegistration) {
			if (invitationCode == null || typeof invitationCode !== 'string') {
				reply.code(400);
				return;
			}

			// ここでの検証はあくまで早期リジェクトのための事前チェックで、
			// 実際の使用可否は消費直前の claimRegistrationTicket() が担保する
			ticket = await this.registrationTicketsRepository.findOneBy({
				code: invitationCode,
			});

			if (ticket == null || ticket.usedById != null) {
				reply.code(400);
				return;
			}

			if (ticket.expiresAt && ticket.expiresAt < new Date()) {
				reply.code(400);
				return;
			}

			// メアド認証が有効の場合
			if (this.meta.emailRequiredForSignup) {
				// メアド認証済みならエラー
				if (ticket.usedBy) {
					reply.code(400);
					return;
				}

				// 認証しておらず、メール送信から30分以内ならエラー
				if (ticket.usedAt && ticket.usedAt.getTime() + invitationCodeMailTimeoutMs > Date.now()) {
					reply.code(400);
					return;
				}
			} else if (ticket.usedAt) {
				reply.code(400);
				return;
			}
		}

		if (this.meta.emailRequiredForSignup) {
			if (await this.usersRepository.exists({ where: { usernameLower: sessionText(username).toLowerCase(), host: IsNull() } })) {
				throw new FastifyReplyError(400, 'DUPLICATED_USERNAME');
			}

			// Check deleted username duplication
			if (await this.usedUsernamesRepository.exists({ where: { username: sessionText(username).toLowerCase() } })) {
				throw new FastifyReplyError(400, 'USED_USERNAME');
			}

			const isPreserved = this.meta.preservedUsernames.map(x => x.toLowerCase()).includes(sessionText(username).toLowerCase());
			if (isPreserved) {
				throw new FastifyReplyError(400, 'DENIED_USERNAME');
			}

			const code = secureRndstr(16, { chars: L_CHARS });

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(sessionText(password), salt);

			if (ticket && !await this.claimRegistrationTicket(ticket)) {
				reply.code(400);
				return;
			}

			try {
				const pendingUser = await this.userPendingsRepository.insertOne({
					id: this.idService.gen(),
					code,
					email: sessionText(emailAddress),
					username: sessionText(username),
					password: hash,
				});

				const link = `${this.config.url}/signup-complete/${code}`;

				this.emailService.sendEmail(sessionText(emailAddress), 'Signup',
					`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
					`To complete signup, please click this link: ${link}`);

				if (ticket) {
					await this.registrationTicketsRepository.update(ticket.id, {
						pendingUserId: pendingUser.id,
					});
				}
			} catch (err) {
				// 確保したコードが無駄に消費されたままになるのを防ぐ
				if (ticket) await this.releaseRegistrationTicket(ticket);
				throw err;
			}

			reply.code(204);
			return;
		} else {
			if (ticket && !await this.claimRegistrationTicket(ticket)) {
				reply.code(400);
				return;
			}

			try {
				const { account, secret } = await this.signupService.signup({
					username, password, host,
				});

				if (ticket) {
					await this.registrationTicketsRepository.update(ticket.id, {
						usedBy: account,
						usedById: account.id,
					});
				}

				const res = await this.userEntityService.packSelf(account, {
					includeSecrets: true,
				});

				return {
					...res,
					token: secret,
				};
			} catch (err) {
				// 確保したコードが無駄に消費されたままになるのを防ぐ
				// (アカウントと紐付け済みの場合は release 側の条件により戻らない)
				if (ticket) await this.releaseRegistrationTicket(ticket);
				throw new FastifyReplyError(400, typeof err === 'string' ? err : sessionErrorMessage(err));
			}
		}
	}

	/**
	 * 招待コードを使用中として確保する
	 *
	 * @returns 確保できた場合は true、既に他のリクエストが消費していた場合は false
	 */
	@bindThis
	private async claimRegistrationTicket(ticket: MiRegistrationTicket): Promise<boolean> {
		const where: FindOptionsWhere<MiRegistrationTicket>[] = [
			{ id: ticket.id, usedById: IsNull(), usedAt: IsNull() },
		];

		// メアド認証が有効の場合、認証されないままメール送信から30分経過したコードは再び使用できる
		if (this.meta.emailRequiredForSignup) {
			where.push({
				id: ticket.id,
				usedById: IsNull(),
				usedAt: LessThanOrEqual(new Date(Date.now() - invitationCodeMailTimeoutMs)),
				// pendingUser は usedAt より後に作られるので、usedAt 起点だと pendingUser の有効期限内に再使用できてしまう
				pendingUserId: IsNull(),
			});
		}

		const result = await this.registrationTicketsRepository.update(where, {
			usedAt: new Date(),
		});

		if ((result.affected ?? 0) > 0) return true;

		// 期限切れの pendingUser に紐付いたままのコードは、紐付けを解除してから確保し直す
		if (this.meta.emailRequiredForSignup) {
			const stale = await this.registrationTicketsRepository.findOneBy({
				id: ticket.id,
				usedById: IsNull(),
			});
			if (stale?.pendingUserId != null) {
				const pending = await this.userPendingsRepository.findOneBy({ id: stale.pendingUserId });
				const pendingExpired = pending == null
					|| this.idService.parse(pending.id).date.getTime() + invitationCodeMailTimeoutMs < Date.now();
				if (pendingExpired) {
					const detached = await this.registrationTicketsRepository.update({
						id: stale.id,
						pendingUserId: stale.pendingUserId,
						usedById: IsNull(),
					}, { pendingUserId: null });
					if ((detached.affected ?? 0) === 0) return false;
					if (pending != null) await this.userPendingsRepository.delete({ id: pending.id });
					return this.claimRegistrationTicket(ticket);
				}
			}
		}

		return false;
	}

	/**
	 * {@link claimRegistrationTicket} で確保した招待コードを未使用に戻す
	 *
	 * 既にアカウントと紐付いた (= 消費が確定した) コードは戻さない
	 */
	@bindThis
	private async releaseRegistrationTicket(ticket: MiRegistrationTicket): Promise<void> {
		await this.registrationTicketsRepository.update({
			id: ticket.id,
			usedById: IsNull(),
		}, {
			usedAt: null,
			pendingUserId: null,
		});
	}

	@bindThis
	public async signupPending(body: AuthSessionBody, request: AuthSessionRequest, reply: AuthSessionEffects) {
		const code = sessionField(body, 'code');

		try {
			const pendingUser = await this.userPendingsRepository.findOneByOrFail({ code });

			if (this.idService.parse(pendingUser.id).date.getTime() + invitationCodeMailTimeoutMs < Date.now()) {
				throw new FastifyReplyError(400, 'EXPIRED');
			}

			const { account } = await this.signupService.signup({
				username: pendingUser.username,
				passwordHash: pendingUser.password,
			});

			this.userPendingsRepository.delete({
				id: pendingUser.id,
			});

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: account.id });

			await this.userProfilesRepository.update({ userId: profile.userId }, {
				email: pendingUser.email,
				emailVerified: true,
				emailVerifyCode: null,
			});

			const ticket = await this.registrationTicketsRepository.findOneBy({ pendingUserId: pendingUser.id });
			if (ticket) {
				await this.registrationTicketsRepository.update(ticket.id, {
					usedBy: account,
					usedById: account.id,
					pendingUserId: null,
				});
			}

			return this.signinService.signin(request, reply, account);
		} catch (err) {
			throw new FastifyReplyError(400, typeof err === 'string' ? err : sessionErrorMessage(err));
		}
	}
}

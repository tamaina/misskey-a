/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import bcrypt from 'bcryptjs';
import { IsNull, LessThanOrEqual, type FindOptionsWhere } from 'typeorm';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import type { Config } from '@/config.js';
import { sessionField, sessionText, sessionErrorMessage, type AuthSessionContext } from '../session.effects.js';
import { L_CHARS, secureRndstr } from '../utility/secure-rndstr.js';
import type { RegistrationTicketsRepository, UsedUsernamesRepository, UserPendingsRepository, UsersRepository, MiRegistrationTicket, MiMeta } from '@features/persistence/backend/repositories/models.js';
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authSessionsContract } from '../session.contract.js';
import { sessionErrors } from '../session.middleware.js';
import { toPackedUserDetailed } from '../../../users/backend/user.schema.js';
const invitationCodeMailTimeoutMs = 1000 * 60 * 30;
export interface SignupDependencies {
	config: Config;
	meta: MiMeta;
	usersRepository: UsersRepository;
	userPendingsRepository: Omit<UserPendingsRepository, 'findOneByOrFail' | 'insertOne'> & { findOneByOrFail(where: { code: import('@features/users/backend/json-value.schema.js').PackedJsonValue | undefined }): Promise<import('../models/UserPending.js').MiUserPending>; insertOne(entity: import('typeorm').QueryDeepPartialEntity<import('../models/UserPending.js').MiUserPending>): Promise<import('../models/UserPending.js').MiUserPending> };
	usedUsernamesRepository: UsedUsernamesRepository;
	registrationTicketsRepository: RegistrationTicketsRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	captchaService: Pick<CaptchaService, 'verifyHcaptcha' | 'verifyMcaptcha' | 'verifyRecaptcha' | 'verifyTestcaptcha' | 'verifyTurnstile'>;
	signupService: Pick<SignupService, 'signup'>;
	emailService: Pick<EmailService, 'sendEmail' | 'validateEmailForAccount'>;
}
export function createSignupProcedure(deps: SignupDependencies) {
	async function claimRegistrationTicket(ticket: MiRegistrationTicket): Promise<boolean> {
		const where: FindOptionsWhere<MiRegistrationTicket>[] = [
			{ id: ticket.id, usedById: IsNull(), usedAt: IsNull() },
		];
		// メアド認証が有効の場合、認証されないままメール送信から30分経過したコードは再び使用できる
		if (deps.meta.emailRequiredForSignup) {
			where.push({
				id: ticket.id,
				usedById: IsNull(),
				usedAt: LessThanOrEqual(new Date(Date.now() - invitationCodeMailTimeoutMs)),
				// pendingUser は usedAt より後に作られるので、usedAt 起点だと pendingUser の有効期限内に再使用できてしまう
				pendingUserId: IsNull(),
			});
		}
		const result = await deps.registrationTicketsRepository.update(where, {
			usedAt: new Date(),
		});
		if ((result.affected ?? 0) > 0) return true;
		// 期限切れの pendingUser に紐付いたままのコードは、紐付けを解除してから確保し直す
		if (deps.meta.emailRequiredForSignup) {
			const stale = await deps.registrationTicketsRepository.findOneBy({
				id: ticket.id,
				usedById: IsNull(),
			});
			if (stale?.pendingUserId != null) {
				const pending = await deps.userPendingsRepository.findOneBy({ id: stale.pendingUserId });
				const pendingExpired = pending == null
					|| deps.idService.parse(pending.id).date.getTime() + invitationCodeMailTimeoutMs < Date.now();
				if (pendingExpired) {
					const detached = await deps.registrationTicketsRepository.update({
						id: stale.id,
						pendingUserId: stale.pendingUserId,
						usedById: IsNull(),
					}, { pendingUserId: null });
					if ((detached.affected ?? 0) === 0) return false;
					if (pending != null) await deps.userPendingsRepository.delete({ id: pending.id });
					return claimRegistrationTicket(ticket);
				}
			}
		}
		return false;
	}

	async function releaseRegistrationTicket(ticket: MiRegistrationTicket): Promise<void> {
		await deps.registrationTicketsRepository.update({
			id: ticket.id,
			usedById: IsNull(),
		}, {
			usedAt: null,
			pendingUserId: null,
		});
	}

	return implement(authSessionsContract.signup, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AuthSessionContext>().use(sessionErrors()).handler(async ({ input, context }) => {
		const body = input;
		const request = context.request;
		const reply = context.effects;
		const result = await (async () => {
			// Verify *Captcha
			// ただしテスト時はこの機構は障害となるため無効にする
			if (process.env.NODE_ENV !== 'test') {
				if (deps.meta.enableHcaptcha && deps.meta.hcaptchaSecretKey) {
					await deps.captchaService.verifyHcaptcha(deps.meta.hcaptchaSecretKey, sessionField(body, 'hcaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
				if (deps.meta.enableMcaptcha && deps.meta.mcaptchaSecretKey && deps.meta.mcaptchaSitekey && deps.meta.mcaptchaInstanceUrl) {
					await deps.captchaService.verifyMcaptcha(deps.meta.mcaptchaSecretKey, deps.meta.mcaptchaSitekey, deps.meta.mcaptchaInstanceUrl, sessionField(body, 'm-captcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
				if (deps.meta.enableRecaptcha && deps.meta.recaptchaSecretKey) {
					await deps.captchaService.verifyRecaptcha(deps.meta.recaptchaSecretKey, sessionField(body, 'g-recaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
				if (deps.meta.enableTurnstile && deps.meta.turnstileSecretKey) {
					await deps.captchaService.verifyTurnstile(deps.meta.turnstileSecretKey, sessionField(body, 'turnstile-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
				if (deps.meta.enableTestcaptcha) {
					await deps.captchaService.verifyTestcaptcha(sessionField(body, 'testcaptcha-response')).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
			}
			const username = sessionField(body, 'username');
			const password = sessionField(body, 'password');
			const host = process.env.NODE_ENV === 'test' ? (sessionField(body, 'host') ?? null) : null;
			const invitationCode = sessionField(body, 'invitationCode');
			const emailAddress = sessionField(body, 'emailAddress');
			if (deps.meta.emailRequiredForSignup) {
				if (emailAddress == null || typeof emailAddress !== 'string') {
					reply.code(400);
					return;
				}
				const res = await deps.emailService.validateEmailForAccount(emailAddress);
				if (!res.available) {
					reply.code(400);
					return;
				}
			}
			let ticket: MiRegistrationTicket | null = null;
			// テスト時はこの機構は障害となるため無効にする
			if (process.env.NODE_ENV !== 'test' && deps.meta.disableRegistration) {
				if (invitationCode == null || typeof invitationCode !== 'string') {
					reply.code(400);
					return;
				}
				// ここでの検証はあくまで早期リジェクトのための事前チェックで、
				// 実際の使用可否は消費直前の claimRegistrationTicket() が担保する
				ticket = await deps.registrationTicketsRepository.findOneBy({
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
				if (deps.meta.emailRequiredForSignup) {
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
			if (deps.meta.emailRequiredForSignup) {
				if (await deps.usersRepository.exists({ where: { usernameLower: sessionText(username).toLowerCase(), host: IsNull() } })) {
					throw new FastifyReplyError(400, 'DUPLICATED_USERNAME');
				}
				// Check deleted username duplication
				if (await deps.usedUsernamesRepository.exists({ where: { username: sessionText(username).toLowerCase() } })) {
					throw new FastifyReplyError(400, 'USED_USERNAME');
				}
				const isPreserved = deps.meta.preservedUsernames.map(x => x.toLowerCase()).includes(sessionText(username).toLowerCase());
				if (isPreserved) {
					throw new FastifyReplyError(400, 'DENIED_USERNAME');
				}
				const code = secureRndstr(16, { chars: L_CHARS });
				// Generate hash of password
				const salt = await bcrypt.genSalt(8);
				const hash = await bcrypt.hash(sessionText(password), salt);
				if (ticket && !await claimRegistrationTicket(ticket)) {
					reply.code(400);
					return;
				}
				try {
					const pendingUser = await deps.userPendingsRepository.insertOne({
						id: deps.idService.gen(),
						code,
						email: sessionText(emailAddress),
						username: sessionText(username),
						password: hash,
					});
					const link = `${deps.config.url}/signup-complete/${code}`;
					deps.emailService.sendEmail(sessionText(emailAddress), 'Signup',
						`To complete signup, please click this link:<br><a href="${link}">${link}</a>`,
						`To complete signup, please click this link: ${link}`);
					if (ticket) {
						await deps.registrationTicketsRepository.update(ticket.id, {
							pendingUserId: pendingUser.id,
						});
					}
				} catch (err) {
					// 確保したコードが無駄に消費されたままになるのを防ぐ
					if (ticket) await releaseRegistrationTicket(ticket);
					throw err;
				}
				reply.code(204);
				return;
			} else {
				if (ticket && !await claimRegistrationTicket(ticket)) {
					reply.code(400);
					return;
				}
				try {
					const { account, secret } = await deps.signupService.signup({
						username, password, host,
					});
					if (ticket) {
						await deps.registrationTicketsRepository.update(ticket.id, {
							usedBy: account,
							usedById: account.id,
						});
					}
					const res = await deps.userEntityService.packSelf(account, {
						includeSecrets: true,
					});
					return {
						...res,
						token: secret,
					};
				} catch (err) {
					// 確保したコードが無駄に消費されたままになるのを防ぐ
					// (アカウントと紐付け済みの場合は release 側の条件により戻らない)
					if (ticket) await releaseRegistrationTicket(ticket);
					throw new FastifyReplyError(400, typeof err === 'string' ? err : sessionErrorMessage(err));
				}
			}
		})();
		return v.parse(requiredSchema(authSessionsContract.signup['~orpc'].outputSchema), result === undefined ? result : { ...toPackedUserDetailed(result), token: result.token });
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}

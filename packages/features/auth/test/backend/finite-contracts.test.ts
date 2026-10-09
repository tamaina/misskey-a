/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import type { SelectQueryBuilder } from 'typeorm';
import bcrypt from 'bcryptjs';
import { packedAppSchema, packedInviteCodeSchema, packedSigninSchema } from '../../backend/auth.schema.js';
import * as inline from '../../backend/api.contract.js';
import { AdminInviteCreateContract, I2faRemoveKeyContract, I2faUpdateKeyContract, AdminCaptchaCurrentContract, AuthSessionShowContract } from '../../backend/api.contract.js';
import { AppEntityService } from '../../backend/serializers/AppEntityService.js';
import { SigninEntityService } from '../../backend/serializers/SigninEntityService.js';
import { InviteCodeEntityService } from '../../backend/serializers/InviteCodeEntityService.js';
import { AuthSessionEntityService } from '../../backend/serializers/AuthSessionEntityService.js';
import { IAppsOperation as AppsEndpoint } from '../../backend/endpoints/i/apps.js';
import { IAuthorizedAppsOperation as AuthorizedAppsEndpoint } from '../../backend/endpoints/i/authorized-apps.js';
import { I2faUpdateKeyOperation as UpdateKeyEndpoint } from '../../backend/endpoints/i/2fa/update-key.js';
import { I2faRemoveKeyOperation as RemoveKeyEndpoint } from '../../backend/endpoints/i/2fa/remove-key.js';
import type { AccessTokensRepository, AppsRepository, MiAccessToken, MiApp, MiSignin, MiRegistrationTicket, MiUserProfile, MiUserSecurityKey, UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const date = new Date('2026-10-07T00:00:00.000Z');
const app = { id: 'app123', userId: null, user: null, secret: 'secret', name: 'Fixture', description: '', permission: ['read:account'], callbackUrl: null } satisfies MiApp;
const me = mockDeep<MiLocalUser>({ id: 'user123' });

function checkFinite(schema: v.GenericSchema, value: Record<string, unknown>, required: string) {
	expect(v.parse(schema, value)).toEqual(value);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	expect(v.safeParse(schema, { ...value, [required]: Symbol('invalid') }).success).toBe(false);
	expect(v.safeParse(schema, Object.fromEntries(Object.entries(value).filter(([key]) => key !== required))).success).toBe(false);
}

test.each([false, true])('real App serializer preserves viewer and secret visibility: %s', async includeSecret => {
	const tokens = mockDeep<AccessTokensRepository>();
	tokens.countBy.mockResolvedValue(1);
	const serializer = new AppEntityService(mockDeep<AppsRepository>(), tokens);
	for (const viewer of [null, me]) {
		const packed = await serializer.pack(app, viewer, { includeSecret });
		checkFinite(packedAppSchema, packed, 'id');
		expect(Object.hasOwn(packed, 'secret')).toBe(includeSecret);
		expect(Object.hasOwn(packed, 'isAuthorized')).toBe(viewer !== null);
	}
	const session = { id: 'session123', appId: app.id, token: 'token', userId: null, user: null, app: null };
	const apps = mockDeep<AppsRepository>();
	apps.findOneByOrFail.mockResolvedValue(app);
	const sessionSerializer = new AuthSessionEntityService(mockDeep(), new AppEntityService(apps, tokens));
	const packed = await sessionSerializer.pack(session, me);
	checkFinite(requiredSchema(AuthSessionShowContract['~orpc'].outputSchema), packed, 'id');
});

test('real Signin serializer closes its outer shape while retaining arbitrary headers', async () => {
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	const signin = { id: 'signin123', userId: me.id, user: null, ip: '127.0.0.1', headers: { 'user-agent': 'fixture', future: { nested: true } }, success: true } satisfies MiSignin;
	const packed = await new SigninEntityService(ids).pack(signin);
	checkFinite(packedSigninSchema, packed, 'id');
	expect(v.parse(packedSigninSchema, packed).headers).toEqual(signin.headers);
});

test.each([false, true])('real Invite serializer covers used and unused nullable fields: %s', async used => {
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	const ticket = { id: 'invite123', code: 'FIXTURE', expiresAt: used ? date : null, createdBy: null, createdById: null, usedBy: null, usedById: null, usedAt: used ? date : null, pendingUserId: null } satisfies MiRegistrationTicket;
	const packed = await new InviteCodeEntityService(mockDeep(), mockDeep(), ids).pack(ticket);
	checkFinite(packedInviteCodeSchema, packed, 'id');
	expect(packed.used).toBe(used);
	expect(packed.usedAt).toBe(used ? date.toISOString() : null);
});

test('real app handlers retain explicit undefined names/dates and authorized viewer flags', async () => {
	const tokens = mockDeep<AccessTokensRepository>();
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	const query = mockDeep<SelectQueryBuilder<MiAccessToken>>();
	tokens.createQueryBuilder.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.leftJoinAndSelect.mockReturnValue(query);
	query.orderBy.mockReturnValue(query);
	const token = { id: 'token123', lastUsedAt: null, token: 'token', session: null, hash: '', userId: me.id, user: null, appId: null, app: null, name: null, description: null, iconUrl: null, permission: [], fetched: false };
	query.getMany.mockResolvedValue([token, { ...token, appId: app.id, app, lastUsedAt: date }]);
	const packed = await new AppsEndpoint(tokens, ids).execute({}, me);
	expect(v.parse(requiredSchema(inline.IAppsContract['~orpc'].outputSchema), packed)).toEqual(packed);
	expect(packed[0]).toHaveProperty('name', undefined);
	expect(packed[0]).toHaveProperty('lastUsedAt', undefined);
	checkFinite(requiredSchema(inline.IAppsContract['~orpc'].outputSchema).item, packed[1], 'id');
	const apps = mockDeep<AppsRepository>();
	apps.findOneByOrFail.mockResolvedValue(app);
	tokens.find.mockResolvedValue([{ ...token, appId: app.id, app }]);
	tokens.countBy.mockResolvedValue(1);
	const authorized = await new AuthorizedAppsEndpoint(tokens, new AppEntityService(apps, tokens)).execute(v.parse(requiredSchema(inline.IAuthorizedAppsContract['~orpc'].inputSchema), {}), me);
	expect(v.parse(requiredSchema(inline.IAuthorizedAppsContract['~orpc'].outputSchema), authorized)).toEqual(authorized);
	expect(authorized[0]).toHaveProperty('isAuthorized', true);
	expect(authorized[0]).not.toHaveProperty('secret');
});

test('native finite auth inputs/defaults and outputs enforce declared fields', () => {
	expectTypeOf<v.InferOutput<NonNullable<typeof inline.AdminResetPasswordContract['~orpc']['outputSchema']>>>().toEqualTypeOf<{ password: string }>();
	expect(v.parse(requiredSchema(AdminInviteCreateContract['~orpc'].inputSchema), { future: true })).toEqual({ count: 1 });
	expect(v.parse(requiredSchema(inline.IAuthorizedAppsContract['~orpc'].inputSchema), { future: true })).toEqual({ limit: 10, offset: 0, sort: 'desc' });
	expect(v.parse(requiredSchema(inline.I2faRegisterContract['~orpc'].inputSchema), { password: 'fixture', token: null, future: true })).toEqual({ password: 'fixture', token: null });
	for (const value of [{}, { password: 7 }]) expect(v.safeParse(requiredSchema(inline.I2faRegisterContract['~orpc'].inputSchema), value).success).toBe(false);
	for (const [schema, value, required] of [
		[requiredSchema(inline.AdminResetPasswordContract['~orpc'].outputSchema), { password: 'password' }, 'password'],
		[requiredSchema(inline.AuthSessionGenerateContract['~orpc'].outputSchema), { token: 'token', url: 'https://example.com/auth' }, 'token'],
		[requiredSchema(inline.EmailAddressAvailableContract['~orpc'].outputSchema), { available: true, reason: null }, 'available'],
		[requiredSchema(inline.I2faDoneContract['~orpc'].outputSchema), { backupCodes: ['backup'] }, 'backupCodes'],
		[requiredSchema(inline.I2faRegisterContract['~orpc'].outputSchema), { qr: 'qr', url: 'url', secret: 'secret', label: 'label', issuer: 'issuer' }, 'qr'],
		[requiredSchema(inline.InviteLimitContract['~orpc'].outputSchema), { remaining: null }, 'remaining'],
		[requiredSchema(inline.I2faKeyDoneContract['~orpc'].outputSchema), { id: 'key123', name: 'key' }, 'id'],
	] as const) checkFinite(schema, value, required);
	for (const schema of [requiredSchema(I2faRemoveKeyContract['~orpc'].outputSchema), requiredSchema(I2faUpdateKeyContract['~orpc'].outputSchema)]) {
		expect(v.parse(schema, {})).toEqual({});
		expect(v.safeParse(schema, { future: true }).success).toBe(false);
		for (const invalid of [[], null, 'empty']) expect(v.safeParse(schema, invalid).success).toBe(false);
	}
	expect(v.parse(requiredSchema(AdminCaptchaCurrentContract['~orpc'].inputSchema), null)).toBeNull();
	expect(v.safeParse(requiredSchema(inline.I2faRegisterKeyContract['~orpc'].outputSchema), { challenge: 'opaque', rp: { name: 'server' } }).success).toBe(false);
	const captcha = { provider: 'none' as const, hcaptcha: { siteKey: null, secretKey: null }, mcaptcha: { siteKey: null, secretKey: null, instanceUrl: null }, recaptcha: { siteKey: null, secretKey: null }, turnstile: { siteKey: null, secretKey: null } };
	expect(v.parse(requiredSchema(AdminCaptchaCurrentContract['~orpc'].outputSchema), captcha)).toEqual(captcha);
	expect(v.safeParse(requiredSchema(AdminCaptchaCurrentContract['~orpc'].outputSchema), { ...captcha, hcaptcha: { ...captcha.hcaptcha, future: true } }).success).toBe(false);
});

test('real key update/remove handlers return guarded finite empty objects and preserve errors', async () => {
	const keys = mockDeep<UserSecurityKeysRepository>();
	const profiles = mockDeep<UserProfilesRepository>();
	keys.findOneBy.mockResolvedValue(mockDeep<MiUserSecurityKey>({ id: 'key123', userId: me.id }));
	const update = new UpdateKeyEndpoint(keys, mockDeep(), mockDeep());
	const updated = await update.execute({ name: 'Fixture', credentialId: 'key123' }, me);
	expect(v.parse(requiredSchema(I2faUpdateKeyContract['~orpc'].outputSchema), updated)).toEqual({});
	expect(keys.update).toHaveBeenCalledWith('key123', { name: 'Fixture' });
	keys.findOneBy.mockResolvedValue(null);
	await expect(update.execute({ name: 'Fixture', credentialId: 'key123' }, me)).rejects.toMatchObject({ code: 'NO_SUCH_KEY' });
	profiles.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ userId: me.id, password: bcrypt.hashSync('password', 4), twoFactorEnabled: false }));
	keys.count.mockResolvedValue(0);
	const remove = new RemoveKeyEndpoint(keys, profiles, mockDeep(), mockDeep(), mockDeep());
	const removed = await remove.execute({ password: 'password', credentialId: 'key123' }, me);
	expect(v.parse(requiredSchema(I2faRemoveKeyContract['~orpc'].outputSchema), removed)).toEqual({});
	expect(keys.delete).toHaveBeenCalledWith({ userId: me.id, id: 'key123' });
	expect(profiles.update).toHaveBeenCalledWith(me.id, { usePasswordLessLogin: false });
	await expect(remove.execute({ password: 'wrong', credentialId: 'key123' }, me)).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
});

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}

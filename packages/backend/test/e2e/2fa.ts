/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as crypto from 'node:crypto';
import { encode as encodeToCbor } from 'cbor2';
import * as OTPAuth from 'otpauth';
import { loadConfig } from '@/config.js';
import { api, legacySignup, sendEnvUpdateRequest } from '../utils.js';
import type {
	AuthenticationResponseJSON,
	AuthenticatorAssertionResponseJSON,
	AuthenticatorAttestationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type * as misskey from 'misskey-js';
import { describe, afterEach, beforeEach, test } from 'vitest';

describe('2要素認証（旧native credential互換）', () => {
	let alice: misskey.entities.SignupResponse;

	const config = loadConfig();
	const password = 'test';
	let username: string;

	// https://datatracker.ietf.org/doc/html/rfc8152
	// 各値の定義は上記規格に基づく。鍵ペアは適当に生成したやつ
	const coseKtyEc2 = 2;
	const coseKid = 'meriadoc.brandybuck@buckland.example';
	const coseAlgEs256 = -7;
	const coseEc2CrvP256 = 1;
	const coseEc2X = '4932eaacc657565705e4287e7870ce3aad55545d99d35a98a472dc52880cfc8f';
	const coseEc2Y = '5ca68303bf2c0433473e3d5cb8586bc2c8c43a4945a496fce8dbeda8b23ab0b1';

	// private key only for testing
	const pemToSign = '-----BEGIN EC PRIVATE KEY-----\n' +
		'MHcCAQEEIHqe/keuXyolbXzgLOu+YFJjDBGWVgXc3QCXfyqwDPf2oAoGCCqGSM49\n' +
		'AwEHoUQDQgAESTLqrMZXVlcF5Ch+eHDOOq1VVF2Z01qYpHLcUogM/I9cpoMDvywE\n' +
		'M0c+PVy4WGvCyMQ6SUWklvzo2+2osjqwsQ==\n' +
		'-----END EC PRIVATE KEY-----\n';

	const otpToken = (secret: string): string => {
		return OTPAuth.TOTP.generate({
			secret: OTPAuth.Secret.fromBase32(secret),
			digits: 6,
		});
	};

	const rpIdHash = (): Buffer => {
		return crypto.createHash('sha256')
			.update(Buffer.from(config.host, 'utf-8'))
			.digest();
	};

	const keyDoneParam = (param: {
		token: string,
		keyName: string,
		credentialId: Uint8Array,
		creationOptions: PublicKeyCredentialCreationOptionsJSON,
	}): {
		token: string,
		password: string,
		name: string,
		credential: RegistrationResponseJSON,
	} => {
		// A COSE encoded public key
		const credentialPublicKey = encodeToCbor(new Map<number, unknown>([
			[-1, coseEc2CrvP256],
			[-2, Uint8Array.from(Buffer.from(coseEc2X, 'hex'))],
			[-3, Uint8Array.from(Buffer.from(coseEc2Y, 'hex'))],
			[1, coseKtyEc2],
			[2, coseKid],
			[3, coseAlgEs256],
		]));

		// AuthenticatorAssertionResponse.authenticatorData
		// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData
		const credentialIdLength = Buffer.allocUnsafe(2);
		credentialIdLength.writeUInt16BE(param.credentialId.length, 0);
		const authData = Buffer.concat([
			rpIdHash(), // rpIdHash(32)
			new Uint8Array([0x45]), // flags(1)
			new Uint8Array(4), // signCount(4)
			new Uint8Array(16), // AAGUID(16)
			credentialIdLength,
			param.credentialId,
			credentialPublicKey,
		]);

		const credentialIdBase64url = Buffer.from(param.credentialId).toString('base64url');

		return {
			password,
			token: param.token,
			name: param.keyName,
			credential: <RegistrationResponseJSON>{
				id: credentialIdBase64url,
				rawId: credentialIdBase64url,
				response: <AuthenticatorAttestationResponseJSON>{
					clientDataJSON: Buffer.from(JSON.stringify({
						type: 'webauthn.create',
						challenge: param.creationOptions.challenge,
						origin: config.scheme + '://' + config.host,
						androidPackageName: 'org.mozilla.firefox',
					}), 'utf-8').toString('base64url'),
					attestationObject: Buffer.from(encodeToCbor({
						fmt: 'none',
						attStmt: {},
						authData: new Uint8Array(authData),
					})).toString('base64url'),
				},
				clientExtensionResults: {},
				type: 'public-key',
			},
		};
	};

	const signinParam = (): {
		username: string,
		password: string,
		'g-recaptcha-response'?: string | null,
		'hcaptcha-response'?: string | null,
	} => {
		return {
			username,
			password,
			'g-recaptcha-response': null,
			'hcaptcha-response': null,
		};
	};

	const signinWithSecurityKeyParam = (param: {
		keyName: string,
		credentialId: Buffer,
		requestOptions: PublicKeyCredentialRequestOptionsJSON,
	}): misskey.entities.SigninFlowRequest => {
		// AuthenticatorAssertionResponse.authenticatorData
		// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData
		const authenticatorData = Buffer.concat([
			rpIdHash(),
			Buffer.from([0x05]), // flags(1)
			Buffer.from([0x00, 0x00, 0x00, 0x01]), // signCount(4)
		]);
		const clientDataJSONBuffer = Buffer.from(JSON.stringify({
			type: 'webauthn.get',
			challenge: param.requestOptions.challenge,
			origin: config.scheme + '://' + config.host,
			androidPackageName: 'org.mozilla.firefox',
		}), 'utf-8');
		const hashedclientDataJSON = crypto.createHash('sha256')
			.update(clientDataJSONBuffer)
			.digest();
		const privateKey = crypto.createPrivateKey(pemToSign);
		const signature = crypto.createSign('SHA256')
			.update(Buffer.concat([authenticatorData, hashedclientDataJSON]))
			.sign(privateKey);
		return {
			username,
			password,
			credential: <AuthenticationResponseJSON>{
				id: param.credentialId.toString('base64url'),
				rawId: param.credentialId.toString('base64url'),
				response: <AuthenticatorAssertionResponseJSON>{
					clientDataJSON: clientDataJSONBuffer.toString('base64url'),
					authenticatorData: authenticatorData.toString('base64url'),
					signature: signature.toString('base64url'),
				},
				clientExtensionResults: {},
				type: 'public-key',
			},
			'g-recaptcha-response': null,
			'hcaptcha-response': null,
		};
	};

	beforeEach(async () => {
		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '' });
		// A failed assertion must not leave the next case's account enrolled in MFA.
		alice = await legacySignup({ password });
		username = alice.username;
	}, 1000 * 60 * 2);

	afterEach(async () => {
		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '' });
	});

	test('が設定でき、OTPでログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);
		assert.notEqual(registerResponse.body.url, undefined);
		assert.notEqual(registerResponse.body.secret, undefined);
		assert.strictEqual(registerResponse.body.label, username);
		assert.strictEqual(registerResponse.body.issuer, config.host);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);
		assert.strictEqual(doneResponse.body.backupCodes.length, 5);

		const signinWithoutTokenResponse = await api('signin-flow', {
			...signinParam(),
		});
		assert.strictEqual(signinWithoutTokenResponse.status, 200);
		assert.deepStrictEqual(signinWithoutTokenResponse.body, {
			finished: false,
			next: 'totp',
			availableFactors: ['totp', 'recovery'],
		});

		const signinResponse = await api('signin-flow', {
			...signinParam(),
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.finished, true);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、セキュリティキーでログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);
		assert.notEqual(registerKeyResponse.body.rp, undefined);
		assert.notEqual(registerKeyResponse.body.challenge, undefined);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);
		assert.strictEqual(keyDoneResponse.body.id, credentialId.toString('base64url'));
		assert.strictEqual(keyDoneResponse.body.name, keyName);

		// Legacy enrollment retains the key without overriding an explicitly off
		// passkey policy. Reactivation requires the session's fresh sudo grant.
		const beforeEnable = await api('signin-flow', signinParam());
		assert.strictEqual(beforeEnable.status, 200);
		assert.strictEqual(beforeEnable.body.finished, false);
		assert.strictEqual(beforeEnable.body.next, 'totp');
		assert.deepStrictEqual(beforeEnable.body.availableFactors, ['totp', 'recovery']);
		const elevated = await api('i/sudo/start', { password, token: otpToken(registerResponse.body.secret) }, alice);
		assert.strictEqual(elevated.status, 200);
		assert.strictEqual(elevated.body.status, 'elevated');
		assert.ok(typeof elevated.body.token === 'string');
		assert.match(elevated.body.token, /^bs_[A-Za-z0-9_-]{43}$/);
		const session = { token: elevated.body.token };
		const enabled = await api('i/security/passkey/mfa/enable', { acknowledged: true }, session);
		assert.strictEqual(enabled.status, 200);

		const signinResponse = await api('signin-flow', {
			...signinParam(),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.finished, false);
		assert.strictEqual(signinResponse.body.next, 'passkey');
		assert.notEqual(signinResponse.body.authRequest.challenge, undefined);
		assert.notEqual(signinResponse.body.authRequest.allowCredentials, undefined);
		assert.strictEqual(signinResponse.body.authRequest.allowCredentials && signinResponse.body.authRequest.allowCredentials[0]?.id, credentialId.toString('base64url'));

		const signinResponse2 = await api('signin-flow', signinWithSecurityKeyParam({
			keyName,
			credentialId,
			requestOptions: signinResponse.body.authRequest,
		}));
		assert.strictEqual(signinResponse2.status, 200);
		assert.strictEqual(signinResponse2.body.finished, true);
		assert.notEqual(signinResponse2.body.i, undefined);

		// The session management API preserves TOTP while disabling passkey MFA.
		const disabled = await api('i/security/passkey/mfa/disable', { acknowledged: true }, session);
		assert.strictEqual(disabled.status, 204);
		const afterDisable = await api('signin-flow', signinParam());
		assert.strictEqual(afterDisable.status, 200);
		assert.strictEqual(afterDisable.body.finished, false);
		assert.strictEqual(afterDisable.body.next, 'totp');
		assert.deepStrictEqual(afterDisable.body.availableFactors, ['totp', 'recovery']);
	});

	test('が設定でき、セキュリティキーでパスワードレスログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const passwordLessResponse = await api('i/2fa/passkey/password-less', {
			value: true,
		}, alice);
		assert.strictEqual(passwordLessResponse.status, 204);

		const iResponse = await api('i', {}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.strictEqual(iResponse.body.usePasswordLessLogin, true);

		const signinResponse = await api('signin-flow', {
			...signinParam(),
			password: '',
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.finished, false);
		assert.strictEqual(signinResponse.body.next, 'passkey');
		assert.notEqual(signinResponse.body.authRequest.challenge, undefined);
		assert.notEqual(signinResponse.body.authRequest.allowCredentials, undefined);

		const signinResponse2 = await api('signin-flow', {
			...signinWithSecurityKeyParam({
				keyName,
				credentialId,
				requestOptions: signinResponse.body.authRequest,
			} as any),
			password: '',
		});
		assert.strictEqual(signinResponse2.status, 200);
		assert.strictEqual(signinResponse2.body.finished, true);
		assert.notEqual(signinResponse2.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーの名前を変更できる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const renamedKey = 'other-key';
		const updateKeyResponse = await api('i/2fa/passkey/update', {
			name: renamedKey,
			credentialId: credentialId.toString('base64url'),
		}, alice);
		assert.strictEqual(updateKeyResponse.status, 200);

		const iResponse = await api('i', {
		}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.ok(iResponse.body.securityKeysList);
		const securityKeys = iResponse.body.securityKeysList.filter((s: { id: string; }) => s.id === credentialId.toString('base64url'));
		assert.strictEqual(securityKeys.length, 1);
		assert.strictEqual(securityKeys[0].name, renamedKey);
		assert.notEqual(securityKeys[0].lastUsed, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーを削除できる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		// Remove only keys owned by this case's isolated account.
		const beforeIResponse = await api('i', {
		}, alice);
		assert.strictEqual(beforeIResponse.status, 200);
		assert.ok(beforeIResponse.body.securityKeysList);
		for (const key of beforeIResponse.body.securityKeysList) {
			const removeKeyResponse = await api('i/2fa/passkey/remove', {
				token: otpToken(registerResponse.body.secret),
				password,
				credentialId: key.id,
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);
		}

		const afterIResponse = await api('i', {}, alice);
		assert.strictEqual(afterIResponse.status, 200);
		assert.strictEqual(afterIResponse.body.securityKeys, false);

		const signinResponse = await api('signin-flow', {
			...signinParam(),
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.finished, true);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定解除できる。（パスワードのみでログインできる。）', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const iResponse = await api('i', {}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.strictEqual(iResponse.body.twoFactorEnabled, true);

		const unregisterResponse = await api('i/2fa/totp/remove', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(unregisterResponse.status, 204);

		const signinResponse = await api('signin-flow', {
			...signinParam(),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.finished, true);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('のTOTPトークンは一度使うと同じトークンは再利用できない。', async () => {
		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '1' });

		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const sharedOtpToken = otpToken(registerResponse.body.secret);
		const doneResponse = await api('i/2fa/totp/done', {
			token: sharedOtpToken,
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const signinResponse = await api('signin-flow', {
			...signinParam(),
			token: sharedOtpToken,
		});
		assert.strictEqual(signinResponse.status, 403);

		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '' });

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { performance } from 'node:perf_hooks';
import { canonicalWebAuthnPublicKey } from '../webauthn-public-key.js';

import {
	generateAuthenticationOptions,
	generateRegistrationOptions, verifyAuthenticationResponse,
	verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
	AuthenticationResponseJSON,
	CredentialDeviceType,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { AttestationFormat, isoUint8Array } from '@simplewebauthn/server/helpers';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { MiUser } from '@features/persistence/backend/repositories/models.js';
import type { MiMeta, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import type { Config } from '@/config.js';
import { webAuthnRegistrationResponseSchema, webAuthnAuthenticationResponseSchema, webAuthnTransportSchema, nativeRegistrationOptionsSchema, nativeAuthenticationOptionsSchema } from '../webauthn.schema.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type * as Redis from 'ioredis';
import { normalizedPasskeyPublicKey } from '../passkey-public-key.js';
import { SigninPolicyError } from '../signin-assurance.js';
import type { VerifiedSigninKey } from '../signin-assurance.js';
import type { MiUserSecurityKey } from '../models/UserSecurityKey.js';

const claimSigninChallenge = `
local challenge = redis.call('GET', KEYS[1])
if not challenge then return false end
local remaining = redis.call('PTTL', KEYS[1])
redis.call('DEL', KEYS[1])
if remaining <= 0 or remaining > 90000 then return false end
return { challenge, remaining }
`;

export interface SigninKeyProof<Expected> {
	key: VerifiedSigninKey;
	expected: Expected;
}
type SigninKeyIdentity = Readonly<Pick<MiUserSecurityKey, 'id' | 'userId' | 'publicKey'>>;

export class WebAuthnService {
	constructor(
		private config: Config,

		private meta: MiMeta,

		private redisClient: Redis.Redis,

		private userSecurityKeysRepository: Omit<UserSecurityKeysRepository, 'findOneBy' | 'update'> & {
			findOneBy(where: Parameters<UserSecurityKeysRepository['findOneBy']>[0] | { id: PackedJsonValue | undefined; userId?: string }): Promise<import('../models/UserSecurityKey.js').MiUserSecurityKey | null>;
			update(where: Parameters<UserSecurityKeysRepository['update']>[0] | { id: PackedJsonValue | undefined; userId?: string }, update: import('typeorm').QueryDeepPartialEntity<import('../models/UserSecurityKey.js').MiUserSecurityKey>): Promise<unknown>;
		},
	) {
	}

	@bindThis
	public getRelyingParty(): { origin: string; rpId: string; rpName: string; rpIcon?: string; } {
		return {
			origin: this.config.url,
			rpId: this.config.hostname,
			rpName: this.meta.name ?? this.config.host,
			rpIcon: this.meta.iconUrl ?? undefined,
		};
	}

	/** The callback captures credential policy before verification, never after it. */
	@bindThis
	public async verifyAuthenticationWithProof<Expected>(userId: string, response: AuthenticationResponseJSON | PackedJsonValue | undefined, beforeProof: (key: SigninKeyIdentity) => Promise<Expected>, requireUserVerification = true): Promise<SigninKeyProof<Expected> | null> {
		return this.verifySigninKey(`webauthn:authenticationChallenge:${userId}`, userId, response, beforeProof, requireUserVerification);
	}


	@bindThis
	public async verifySignInWithPasskeyWithProof<Expected>(context: string, response: AuthenticationResponseJSON | PackedJsonValue | undefined, beforeProof: (key: SigninKeyIdentity) => Promise<Expected>): Promise<SigninKeyProof<Expected> | null> {
		return this.verifySigninKey(`webauthn:passkeyChallenge:${context}`, undefined, response, beforeProof);
	}

	private async verifySigninKey<Expected>(challengeKey: string, userId: string | undefined, response: AuthenticationResponseJSON | PackedJsonValue | undefined, beforeProof: (key: SigninKeyIdentity) => Promise<Expected>, requireUserVerification = true): Promise<SigninKeyProof<Expected> | null> {
		const started = performance.now();
		const claimed: unknown = await this.redisClient.eval(claimSigninChallenge, 1, challengeKey);
		if (!Array.isArray(claimed) || typeof claimed[0] !== 'string' || typeof claimed[1] !== 'number'
			|| !Number.isSafeInteger(claimed[1]) || claimed[1] <= 0 || claimed[1] > 90_000) throw new SigninPolicyError();
		const deadline = started + claimed[1];
		const checkDeadline = () => { if (performance.now() >= deadline) throw new SigninPolicyError(); };
		checkDeadline();
		const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
		const key = await this.userSecurityKeysRepository.findOneBy({ id: credential.id, ...(userId === undefined ? {} : { userId }) });
		if (!key || (userId !== undefined && key.userId !== userId)) throw new SigninPolicyError();
		// Keep the exact row read for verification/CAS, even while the callback awaits other repositories.
		const original = { id: key.id, userId: key.userId, publicKey: key.publicKey, counter: key.counter };
		// PostgreSQL bigint may be returned as a decimal string despite the entity's number annotation.
		const counter = Number(original.counter);
		if (!Number.isSafeInteger(counter) || counter < 0 || counter > 0xffffffff) throw new SigninPolicyError();
		const publicKey = normalizedPasskeyPublicKey(original.publicKey);
		const transports = key.transports == null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports);
		const expected = await beforeProof(Object.freeze({ id: original.id, userId: original.userId, publicKey }));
		checkDeadline();
		const relyingParty = this.getRelyingParty();
		const verification = await verifyAuthenticationResponse({
			response: credential, expectedChallenge: claimed[0], expectedOrigin: relyingParty.origin, expectedRPID: relyingParty.rpId,
			credential: { id: original.id, publicKey: new Uint8Array(Buffer.from(publicKey, 'base64url')), counter, transports },
			requireUserVerification,
		});
		checkDeadline();
		if (!verification.verified || (requireUserVerification && verification.authenticationInfo.userVerified !== true)) return null;
		const info = verification.authenticationInfo;
		if (!Number.isSafeInteger(info.newCounter) || info.newCounter < 0) throw new SigninPolicyError();
		const updated = await this.userSecurityKeysRepository.update(original, {
			publicKey, counter: info.newCounter, lastUsed: new Date(), credentialDeviceType: info.credentialDeviceType, credentialBackedUp: info.credentialBackedUp,
		});
		if (!updated || typeof updated !== 'object' || !('affected' in updated) || updated.affected !== 1) throw new SigninPolicyError();
		checkDeadline();
		return { key: Object.freeze({ id: original.id, userId: original.userId, publicKey, deadline, userVerified: verification.authenticationInfo.userVerified === true }), expected };
	}

	@bindThis
	public async initiateRegistration(userId: MiUser['id'], userName: string, userDisplayName?: string): Promise<v.InferOutput<typeof nativeRegistrationOptionsSchema>> {
		const relyingParty = this.getRelyingParty();
		const keys = await this.userSecurityKeysRepository.findBy({
			userId: userId,
		});

		const registrationOptions = await generateRegistrationOptions({
			rpName: relyingParty.rpName,
			rpID: relyingParty.rpId,
			userID: isoUint8Array.fromUTF8String(userId),
			userName: userName,
			userDisplayName: userDisplayName,
			excludeCredentials: keys.map(key => ({
				id: key.id,
				transports: key.transports == null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports),
			})),
			authenticatorSelection: {
				residentKey: 'required',
				userVerification: 'required',
			},
		});
		v.assert(nativeRegistrationOptionsSchema, registrationOptions);

		await this.redisClient.setex(`webauthn:registrationChallenge:${userId}`, 90, registrationOptions.challenge);

		return registrationOptions;
	}

	@bindThis
	public async verifyRegistration(userId: MiUser['id'], response: RegistrationResponseJSON | PackedJsonValue): Promise<{
		credentialID: string;
		credentialPublicKey: Uint8Array;
		attestationObject: Uint8Array;
		fmt: AttestationFormat;
		counter: number;
		userVerified: boolean;
		credentialDeviceType: CredentialDeviceType;
		credentialBackedUp: boolean;
		transports?: v.InferOutput<typeof webAuthnTransportSchema>[];
	}> {
		const challenge = await this.redisClient.get(`webauthn:registrationChallenge:${userId}`);

		if (!challenge) {
			throw new IdentifiableError('7dbfb66c-9216-4e2b-9c27-cef2ac8efb84', 'challenge not found');
		}

		await this.redisClient.del(`webauthn:registrationChallenge:${userId}`);

		const relyingParty = this.getRelyingParty();

		let verification;
		try {
			const credential = v.parse(webAuthnRegistrationResponseSchema, response);
			verification = await verifyRegistrationResponse({
				response: credential,
				expectedChallenge: challenge,
				expectedOrigin: relyingParty.origin,
				expectedRPID: relyingParty.rpId,
				requireUserVerification: true,
			});
		} catch (error) {
			console.error(error);
			throw new IdentifiableError('5c1446f8-8ca7-4d31-9f39-656afe9c5d87', 'verification failed');
		}

		const { verified } = verification;

		if (!verified || !verification.registrationInfo) {
			throw new IdentifiableError('bb333667-3832-4a80-8bb5-c505be7d710d', 'verification failed');
		}

		const { registrationInfo } = verification;

		return {
			credentialID: registrationInfo.credential.id,
			credentialPublicKey: registrationInfo.credential.publicKey,
			attestationObject: registrationInfo.attestationObject,
			fmt: registrationInfo.fmt,
			counter: registrationInfo.credential.counter,
			userVerified: registrationInfo.userVerified,
			credentialDeviceType: registrationInfo.credentialDeviceType,
			credentialBackedUp: registrationInfo.credentialBackedUp,
			transports: v.parse(webAuthnRegistrationResponseSchema, response).response.transports,
		};
	}

	@bindThis
	public async initiateAuthentication(userId: MiUser['id'], requireUserVerification = true): Promise<v.InferOutput<typeof nativeAuthenticationOptionsSchema>> {
		const relyingParty = this.getRelyingParty();
		const keys = await this.userSecurityKeysRepository.findBy({
			userId: userId,
		});

		if (keys.length === 0) {
			throw new IdentifiableError('f27fd449-9af4-4841-9249-1f989b9fa4a4', 'no keys found');
		}

		const authenticationOptions = await generateAuthenticationOptions({
			rpID: relyingParty.rpId,
			allowCredentials: keys.map(key => ({
				id: key.id,
				transports: key.transports == null ? undefined : v.parse(v.array(webAuthnTransportSchema), key.transports),
			})),
			userVerification: requireUserVerification ? 'required' : 'preferred',
		});
		v.assert(nativeAuthenticationOptionsSchema, authenticationOptions);

		await this.redisClient.setex(`webauthn:authenticationChallenge:${userId}`, 90, authenticationOptions.challenge);

		return authenticationOptions;
	}

	/**
	 * Initiate Passkey Auth (Without specifying user)
	 * @returns authenticationOptions
	 */
	@bindThis
	public async initiateSignInWithPasskeyAuthentication(context: string): Promise<v.InferOutput<typeof nativeAuthenticationOptionsSchema>> {
		const relyingParty = await this.getRelyingParty();

		const authenticationOptions = await generateAuthenticationOptions({
			rpID: relyingParty.rpId,
			userVerification: 'required',
		});
		v.assert(nativeAuthenticationOptionsSchema, authenticationOptions);

		await this.redisClient.setex(`webauthn:passkeyChallenge:${context}`, 90, authenticationOptions.challenge);

		return authenticationOptions;
	}

	/**
	 * Verify Webauthn AuthenticationCredential
	 * @throws IdentifiableError
	 * @returns If the challenge is successful, return the user ID. Otherwise, return null.
	 */
	@bindThis
	public async verifySignInWithPasskeyAuthentication(context: string, response: AuthenticationResponseJSON | PackedJsonValue | undefined): Promise<MiUser['id'] | null> {
		const challenge = await this.redisClient.getdel(`webauthn:passkeyChallenge:${context}`);

		if (!challenge) {
			throw new IdentifiableError('2d16e51c-007b-4edd-afd2-f7dd02c947f6', `challenge '${context}' not found`);
		}

		const key = await this.userSecurityKeysRepository.findOneBy({
			id: this.authenticationCredentialId(response),
		});

		if (!key) {
			throw new IdentifiableError('36b96a7d-b547-412d-aeed-2d611cdc8cdc', 'Unknown Webauthn key');
		}

		const relyingParty = await this.getRelyingParty();

		let verification;
		try {
			const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
			verification = await verifyAuthenticationResponse({
				response: credential,
				expectedChallenge: challenge,
				expectedOrigin: relyingParty.origin,
				expectedRPID: relyingParty.rpId,
				credential: {
					id: key.id,
					publicKey: Buffer.from(key.publicKey, 'base64url'),
					counter: key.counter,
					transports: key.transports ? v.parse(v.array(webAuthnTransportSchema), key.transports) : undefined,
				},
				requireUserVerification: true,
			});
		} catch (error) {
			throw new IdentifiableError('b18c89a7-5b5e-4cec-bb5b-0419f332d430', `verification failed: ${error}`);
		}

		const { verified, authenticationInfo } = verification;

		if (!verified) {
			return null;
		}

		await this.userSecurityKeysRepository.update({
			id: this.authenticationCredentialId(response),
		}, {
			lastUsed: new Date(),
			counter: authenticationInfo.newCounter,
			credentialDeviceType: authenticationInfo.credentialDeviceType,
			credentialBackedUp: authenticationInfo.credentialBackedUp,
		});

		return key.userId;
	}

	@bindThis
	public async verifyAuthentication(userId: MiUser['id'], response: AuthenticationResponseJSON | PackedJsonValue | undefined): Promise<boolean> {
		const challenge = await this.redisClient.getdel(`webauthn:authenticationChallenge:${userId}`);

		if (!challenge) {
			throw new IdentifiableError('2d16e51c-007b-4edd-afd2-f7dd02c947f6', 'challenge not found');
		}

		const key = await this.userSecurityKeysRepository.findOneBy({
			id: this.authenticationCredentialId(response),
			userId: userId,
		});

		if (!key) {
			throw new IdentifiableError('36b96a7d-b547-412d-aeed-2d611cdc8cdc', 'unknown key');
		}

		// Preserve the existing legacy EC→COSE conversion and its update timing.
		const cborPubKey = canonicalWebAuthnPublicKey(key.publicKey, key.counter);
		if (cborPubKey !== key.publicKey) {
			await this.userSecurityKeysRepository.update({ id: this.authenticationCredentialId(response), userId }, { publicKey: cborPubKey });
			key.publicKey = cborPubKey;
		}

		const relyingParty = this.getRelyingParty();

		let verification;
		try {
			const credential = v.parse(webAuthnAuthenticationResponseSchema, response);
			verification = await verifyAuthenticationResponse({
				response: credential,
				expectedChallenge: challenge,
				expectedOrigin: relyingParty.origin,
				expectedRPID: relyingParty.rpId,
				credential: {
					id: key.id,
					publicKey: Buffer.from(key.publicKey, 'base64url'),
					counter: key.counter,
					transports: key.transports ? v.parse(v.array(webAuthnTransportSchema), key.transports) : undefined,
				},
				requireUserVerification: true,
			});
		} catch (error) {
			console.error(error);
			throw new IdentifiableError('b18c89a7-5b5e-4cec-bb5b-0419f332d430', 'verification failed');
		}

		const { verified, authenticationInfo } = verification;

		if (!verified) {
			return false;
		}

		await this.userSecurityKeysRepository.update({
			id: this.authenticationCredentialId(response),
			userId: userId,
		}, {
			lastUsed: new Date(),
			counter: authenticationInfo.newCounter,
			credentialDeviceType: authenticationInfo.credentialDeviceType,
			credentialBackedUp: authenticationInfo.credentialBackedUp,
		});

		return verified;
	}
	/** Access the protocol id before library verification, preserving legacy challenge/lookup order. */
	private authenticationCredentialId(response: AuthenticationResponseJSON | PackedJsonValue | undefined): PackedJsonValue | undefined {
		if (response === null || response === undefined) throw new TypeError('Cannot read properties of null or undefined');
		if (typeof response === 'object' && !Array.isArray(response) && 'id' in response) return response.id;
		return undefined;
	}
}

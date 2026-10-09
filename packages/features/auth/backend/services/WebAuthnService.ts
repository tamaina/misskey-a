/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

import {
	generateAuthenticationOptions,
	generateRegistrationOptions, verifyAuthenticationResponse,
	verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture,
	CredentialDeviceType,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { AttestationFormat, isoCBOR, isoUint8Array } from '@simplewebauthn/server/helpers';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { MiUser } from '@features/persistence/backend/repositories/models.js';
import type { MiMeta, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import type { Config } from '@/config.js';
import { webAuthnRegistrationResponseSchema, webAuthnAuthenticationResponseSchema, webAuthnTransportSchema } from '../webauthn.schema.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type * as Redis from 'ioredis';

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

	@bindThis
	public async initiateRegistration(userId: MiUser['id'], userName: string, userDisplayName?: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
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
				userVerification: 'preferred',
			},
		});

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
		transports?: AuthenticatorTransportFuture[];
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
	public async initiateAuthentication(userId: MiUser['id']): Promise<PublicKeyCredentialRequestOptionsJSON> {
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
			userVerification: 'preferred',
		});

		await this.redisClient.setex(`webauthn:authenticationChallenge:${userId}`, 90, authenticationOptions.challenge);

		return authenticationOptions;
	}

	/**
	 * Initiate Passkey Auth (Without specifying user)
	 * @returns authenticationOptions
	 */
	@bindThis
	public async initiateSignInWithPasskeyAuthentication(context: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
		const relyingParty = await this.getRelyingParty();

		const authenticationOptions = await generateAuthenticationOptions({
			rpID: relyingParty.rpId,
			userVerification: 'preferred',
		});

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

		// マイグレーション
		if (key.counter === 0 && key.publicKey.length === 87) {
			const cert = new Uint8Array(Buffer.from(key.publicKey, 'base64url'));
			if (cert[0] === 0x04) { // 前の実装ではいつも 0x04 で始まっていた
				const halfLength = (cert.length - 1) / 2;

				const cborMap = new Map<number, number | Uint8Array>();
				cborMap.set(1, 2); // kty, EC2
				cborMap.set(3, -7); // alg, ES256
				cborMap.set(-1, 1); // crv, P256
				cborMap.set(-2, cert.slice(1, halfLength + 1)); // x
				cborMap.set(-3, cert.slice(halfLength + 1)); // y

				const cborPubKey = Buffer.from(isoCBOR.encode(cborMap)).toString('base64url');
				await this.userSecurityKeysRepository.update({
					id: this.authenticationCredentialId(response),
					userId: userId,
				}, {
					publicKey: cborPubKey,
				});
				key.publicKey = cborPubKey;
			}
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

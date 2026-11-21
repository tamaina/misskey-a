/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, GetPublicAccessBlockCommand, GetBucketPolicyStatusCommand, GetBucketAclCommand } from '@aws-sdk/client-s3';
import { readBoundedMailData } from './ingress.js';
import type { PrivateMailStorage } from './store.js';

/** Dedicated private bucket, never Drive URLs or the public media proxy. */
export class S3PrivateMailStorage implements PrivateMailStorage {
	private verified = false;
	constructor(private readonly client: S3Client, private readonly bucket: string, private readonly maxBytes = 25 * 1024 * 1024) {
		if (!bucket || !Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid mail storage configuration');
	}

	/** Fail closed on unsupported privacy checks. Configure a compatible private bucket. */
	async verifyPrivacy(): Promise<void> {
		this.verified = false;
		const [block, policy, acl] = await Promise.all([
			this.client.send(new GetPublicAccessBlockCommand({ Bucket: this.bucket })),
			this.client.send(new GetBucketPolicyStatusCommand({ Bucket: this.bucket })),
			this.client.send(new GetBucketAclCommand({ Bucket: this.bucket })),
		]);
		const b = block.PublicAccessBlockConfiguration;
		if (!b?.BlockPublicAcls || !b.IgnorePublicAcls || !b.BlockPublicPolicy || !b.RestrictPublicBuckets || policy.PolicyStatus?.IsPublic !== false ||
			acl.Grants?.some(grant => grant.Grantee?.URI)) throw new Error('Mail bucket is not verifiably private');
		this.verified = true;
	}

	private check(key: string): void {
		if (!this.verified) throw new Error('Mail bucket privacy has not been verified');
		if (!/^raw\/[a-f0-9-]{36}\.eml$/.test(key)) throw new Error('Invalid mail object key');
	}
	async put(key: string, raw: Uint8Array): Promise<void> {
		this.check(key);
		if (raw.byteLength > this.maxBytes) throw new Error('Mail size out of bounds');
		await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: raw, ContentType: 'message/rfc822' }), { abortSignal: AbortSignal.timeout(60_000) });
	}
	async get(key: string): Promise<Uint8Array> {
		this.check(key);
		const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }), { abortSignal: AbortSignal.timeout(60_000) });
		if (!response.Body || (response.ContentLength ?? Infinity) > this.maxBytes) throw new Error('Mail object unavailable');
		return readBoundedMailData(response.Body as AsyncIterable<Uint8Array>, this.maxBytes);
	}
	async delete(key: string): Promise<void> {
		this.check(key);
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }), { abortSignal: AbortSignal.timeout(60_000) });
	}
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S3PrivateMailStorage } from '../../../backend/built/features/email/backend.js';

const key = 'raw/00000000-0000-0000-0000-000000000001.eml';
function client(overrides = {}) {
	const calls = [];
	return {
		calls,
		async send(command) {
			const name = command.constructor.name;
			calls.push({ name, input: command.input });
			if (overrides[name]) return overrides[name](command.input);
			if (name === 'GetPublicAccessBlockCommand') return { PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true } };
			if (name === 'GetBucketPolicyStatusCommand') return { PolicyStatus: { IsPublic: false } };
			if (name === 'GetBucketAclCommand') return { Grants: [] };
			return {};
		},
	};
}

test('private storage fails closed before verification and on public/unsupported checks', async () => {
	for (const overrides of [{ GetBucketPolicyStatusCommand: () => ({ PolicyStatus: { IsPublic: true } }) }, { GetPublicAccessBlockCommand: () => ({}) }, { GetBucketAclCommand: () => ({ Grants: [{ Grantee: { URI: 'public' } }] }) }, { GetBucketPolicyStatusCommand: () => { throw new Error('unsupported'); } }]) {
		const storage = new S3PrivateMailStorage(client(overrides), 'private-mail');
		await assert.rejects(storage.put(key, Buffer.from('raw')), /not been verified/);
		await assert.rejects(storage.verifyPrivacy());
		await assert.rejects(storage.get(key), /not been verified/);
	}
});

test('private storage restricts object paths, bytes and uses only dedicated bucket', async () => {
	const fake = client();
	const storage = new S3PrivateMailStorage(fake, 'private-mail', 3);
	await storage.verifyPrivacy();
	await assert.rejects(storage.put('../public/file', Buffer.from('raw')), /Invalid mail object key/);
	await assert.rejects(storage.put(key, Buffer.from('over')), /size/);
	await storage.put(key, Buffer.from('raw'));
	await storage.delete(key);
	const put = fake.calls.find(call => call.name === 'PutObjectCommand');
	assert.equal(put.input.Bucket, 'private-mail');
	assert.equal(put.input.ContentType, 'message/rfc822');
	assert.equal(put.input.ACL, undefined, 'bucket owner enforced/private policy, never public-read');
});

test('private storage enforces actual download length even when ContentLength lies', async () => {
	const storage = new S3PrivateMailStorage(client({ GetObjectCommand: () => ({ ContentLength: 1, Body: (async function* () { yield Buffer.from('toolarge'); })() }) }), 'private-mail', 3);
	await storage.verifyPrivacy();
	await assert.rejects(storage.get(key), /TOO_LARGE/);
});

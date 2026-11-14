/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import { ApRequestService, ApRequestCreator } from '@features/federation/backend/services/ApRequestService.js';
import type { Config } from '@/config.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import type { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import type { ChannelFederationService } from '../../backend/services/ChannelFederationService.js';
import type { MiChannel } from '../../backend/models/Channel.js';

afterEach(() => vi.restoreAllMocks());

function fixture() {
	const channels = mockDeep<ChannelsRepository>();
	const keys = mockDeep<UserKeypairService>();
	const http = mockDeep<HttpRequestService>();
	const moduleRef = mockDeep<ModuleRef>();
	const federation = mockDeep<ChannelFederationService>();
	moduleRef.get.mockReturnValue(federation);
	const channel = mockDeep<MiChannel>({ id: 'channel123', host: null, isFederated: true, isFederationFrozen: true, isArchived: false, federationPrivateKey: 'synthetic-key' });
	channels.findOne.mockResolvedValue(channel);
	federation.refreshEligibility.mockImplementation(async value => value);
	vi.spyOn(ApRequestCreator, 'createSignedPost').mockResolvedValue({ request: { url: 'https://remote.test/inbox', method: 'POST', headers: {}, body: '' }, body: '', signingString: '', signature: '', signatureHeader: '' } as never);
	const service = new ApRequestService({ url: 'https://local.test' } as Config, keys, channels, http, mockDeep<LoggerService>(), mockDeep<UtilityService>(), moduleRef);
	return { service, http, keys };
}

test('queued Create publication is discarded when Group was frozen after enqueue', async () => {
	const f = fixture();
	await f.service.signedPost({ id: 'channel123', channelId: 'channel123' }, 'https://remote.test/inbox', { type: 'Announce', object: { type: 'Create' } });
	expect(f.http.send).not.toHaveBeenCalled();
	expect(f.keys.getLocalUserPrivateKey).not.toHaveBeenCalled();
});

test.each([
	{ type: 'Update', object: { type: 'Group' } },
	{ type: 'Announce', object: { type: 'Delete' } },
	{ type: 'Undo', object: { type: 'Follow' } },
])('frozen Group still signs lifecycle activity %j with its Group key', async activity => {
	const f = fixture();
	await f.service.signedPost({ id: 'channel123', channelId: 'channel123' }, 'https://remote.test/inbox', activity);
	expect(f.keys.getLocalUserPrivateKey).toHaveBeenCalledWith({ keyId: 'https://local.test/channels/channel123#main-key', privateKeyPem: 'synthetic-key' });
	expect(f.http.send).toHaveBeenCalledOnce();
});

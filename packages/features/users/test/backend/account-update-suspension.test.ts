/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { AccountUpdateService } from '@features/users/backend/services/AccountUpdateService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { ApDeliverManagerService } from '@features/federation/backend/services/ApDeliverManagerService.js';
import { RelayService } from '@features/federation/backend/services/RelayService.js';

function fixture() {
	const users = mockDeep<UsersRepository>();
	const entity = mockDeep<UserEntityService>();
	const renderer = mockDeep<ApRendererService>();
	const delivery = mockDeep<ApDeliverManagerService>();
	const relay = mockDeep<RelayService>();
	const manager = mockDeep<ReturnType<ApDeliverManagerService['createDeliverManager']>>();
	delivery.createDeliverManager.mockReturnValue(manager);
	const service = new AccountUpdateService(users, entity, renderer, delivery, relay);
	return { users, entity, renderer, delivery, relay, manager, service };
}

function pending() {
	let finish!: () => void;
	const promise = new Promise<void>(resolve => { finish = resolve; });
	return { promise, finish };
}

describe('suspension account Update publication', () => {
	test.each([null, 'deleted', 'remote'] as const)('does not render or dispatch a %s account', async kind => {
		const f = fixture();
		const actor = Object.assign(new MiUser({}), { id: 'actor', host: kind === 'remote' ? 'remote.example' : null, isDeleted: kind === 'deleted' });
		f.users.findOneBy.mockResolvedValue(kind == null ? null : actor);
		f.entity.isLocalUser.mockReturnValue(kind !== 'remote');
		await f.service.publishToFollowersAndSharedInboxAndRelays(actor.id);
		expect(f.renderer.renderPerson).not.toHaveBeenCalled();
		expect(f.delivery.createDeliverManager).not.toHaveBeenCalled();
		expect(f.relay.deliverToRelays).not.toHaveBeenCalled();
	});

	test.each([false, true])('reloads suspended=%s, renders before dispatch and awaits both destinations', async isSuspended => {
		const f = fixture();
		const actor = Object.assign(new MiUser({}), { id: 'actor', host: null, isDeleted: false, isSuspended });
		f.users.findOneBy.mockResolvedValue(actor);
		f.entity.isLocalUser.mockReturnValue(true);
		const rendered = pending();
		f.renderer.renderPerson.mockImplementation(async user => {
			expect(user).toBe(actor);
			await rendered.promise;
			const person = mockDeep<Awaited<ReturnType<ApRendererService['renderPerson']>>>();
			person.type = 'Person';
			person.suspended = user.isSuspended;
			return person;
		});
		f.renderer.renderUpdate.mockImplementation((object, user) => ({ type: 'Update', actor: 'https://local.example/users/' + user.id, object }));
		f.renderer.addContext.mockImplementation(object => ({ ...object, id: 'https://local.example/updates/actor', '@context': [] }));
		const queued = pending();
		const relayed = pending();
		f.manager.execute.mockReturnValue(queued.promise);
		f.relay.deliverToRelays.mockReturnValue(relayed.promise);
		const complete = vi.fn();
		const publication = f.service.publishToFollowersAndSharedInboxAndRelays(actor.id).then(complete);
		await vi.waitFor(() => expect(f.renderer.renderPerson).toHaveBeenCalledOnce());
		expect(f.delivery.createDeliverManager).not.toHaveBeenCalled();
		rendered.finish();
		await vi.waitFor(() => expect(f.manager.execute).toHaveBeenCalledOnce());
		expect(f.users.findOneBy).toHaveBeenCalledWith({ id: actor.id });
		expect(f.manager.addAllKnowingSharedInboxRecipe).toHaveBeenCalledOnce();
		expect(f.manager.addFollowersRecipe).toHaveBeenCalledOnce();
		expect(f.relay.deliverToRelays).toHaveBeenCalledWith(actor, expect.objectContaining({ type: 'Update', object: expect.objectContaining({ suspended: isSuspended }) }));
		queued.finish();
		await Promise.resolve();
		expect(complete).not.toHaveBeenCalled();
		relayed.finish();
		await publication;
		expect(complete).toHaveBeenCalledOnce();
	});

	test('a rejected manager does not abandon waiting for the relay', async () => {
		const f = fixture();
		f.users.findOneBy.mockResolvedValue(Object.assign(new MiUser({}), { id: 'actor', host: null, isDeleted: false }));
		f.entity.isLocalUser.mockReturnValue(true);
		f.renderer.renderPerson.mockResolvedValue(mockDeep<Awaited<ReturnType<ApRendererService['renderPerson']>>>());
		f.renderer.renderUpdate.mockReturnValue({ type: 'Update', actor: 'https://local.example/users/actor', object: { type: 'Person', id: 'https://local.example/users/actor' } });
		f.renderer.addContext.mockReturnValue({ type: 'Update', id: 'update', '@context': [] });
		f.manager.execute.mockRejectedValue(new Error('queue failure'));
		const relayed = pending();
		f.relay.deliverToRelays.mockReturnValue(relayed.promise);
		const complete = vi.fn();
		const publication = f.service.publishToFollowersAndSharedInboxAndRelays('actor').then(complete);
		await vi.waitFor(() => expect(f.relay.deliverToRelays).toHaveBeenCalledOnce());
		expect(complete).not.toHaveBeenCalled();
		relayed.finish();
		await publication;
		expect(complete).toHaveBeenCalledOnce();
	});
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { expect, test, vi } from 'vitest';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { featureServiceGroups } from '@features/index/backend/feature-service-providers.js';
import { ServiceBillingRoleProvider } from '../../backend/service-role.provider.js';

test('native role resolution includes paid terms through the CoreModule provider group, preserves manual roles and removes expired/elevated grants', async () => {
	const paid = { id: 'paid', target: 'manual', isAdministrator: false, isModerator: false, asBadge: true };
	const elevated = { id: 'elevated', target: 'conditional', isAdministrator: true, isModerator: true, asBadge: true, condFormula: { type: 'roleAssignedTo', roleId: 'paid' } };
	const ordinary = { ...elevated, id: 'ordinary', isAdministrator: false, isModerator: false, asBadge: false };
	const manual = { id: 'manual', target: 'manual', isAdministrator: false, isModerator: false, asBadge: false };
	let active = true;
	const query = vi.fn(async () => active ? [{ roleId: 'paid' }] : []);
	const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', RoleService);
	const overrides: { index: number; param: unknown }[] = Reflect.getMetadata('self:paramtypes', RoleService) ?? [];
	const providers: { provide: never; useValue: unknown }[] = [];
	for (const [index, type] of paramTypes.entries()) {
		const token = overrides.find(row => row.index === index)?.param ?? type;
		if (token === ModuleRef || token === ServiceBillingRoleProvider) continue;
		let value: unknown = { on: () => undefined, off: () => undefined, findUserById: async () => ({ id: 'u' }), findOneByOrFail: async () => ({ id: 'u' }) };
		if (token === DI.rolesRepository) value = { findBy: async () => [paid, manual, elevated, ordinary] };
		if (token === DI.roleAssignmentsRepository) value = { findBy: async () => [{ id: 'manual-assignment', roleId: 'manual', userId: 'u', expiresAt: null }] };
		providers.push({ provide: token as never, useValue: value });
	}
	const module = await Test.createTestingModule({ providers: [RoleService, ...featureServiceGroups.billing.providers, ...providers, { provide: DI.db, useValue: { query } }] }).compile();
	try {
		const roles = module.get(RoleService);
		expect((await roles.getUserRoles('u')).map(role => role.id)).toEqual(['paid', 'manual', 'ordinary']);
		expect((await roles.getUserBadgeRoles('u')).map(role => role.id)).toEqual(['paid']);
		active = false;
		expect((await roles.getUserRoles('u')).map(role => role.id)).toEqual(['manual']);
		expect(await roles.getUserBadgeRoles('u')).toEqual([]);
		active = true; paid.isAdministrator = true;
		expect((await roles.getUserRoles('u')).map(role => role.id)).toEqual(['manual']);
	} finally { await module.close(); }
});

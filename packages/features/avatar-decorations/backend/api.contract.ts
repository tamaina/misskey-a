/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../api/backend/transport/errors.schema.js';
import * as s from './api.schema.js';

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const avatarDecorationsContract = {
	create: oc.$meta<{ requestName: 'admin/avatar-decorations/create' }>({ requestName: 'admin/avatar-decorations/create' })
		.route({ method: 'POST', path: '/admin/avatar-decorations/create', operationId: 'post___admin___avatar-decorations___create', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.avatarDecorationCreateInput).output(s.avatarDecorationOutput),
	delete: oc.$meta<{ requestName: 'admin/avatar-decorations/delete' }>({ requestName: 'admin/avatar-decorations/delete' })
		.route({ method: 'POST', path: '/admin/avatar-decorations/delete', operationId: 'post___admin___avatar-decorations___delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.avatarDecorationDeleteInput).output(v.void()),
	list: oc.$meta<{ requestName: 'admin/avatar-decorations/list' }>({ requestName: 'admin/avatar-decorations/list' })
		.route({ method: 'POST', path: '/admin/avatar-decorations/list', operationId: 'post___admin___avatar-decorations___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.avatarDecorationListInput).output(s.avatarDecorationListOutput),
	update: oc.$meta<{ requestName: 'admin/avatar-decorations/update' }>({ requestName: 'admin/avatar-decorations/update' })
		.route({ method: 'POST', path: '/admin/avatar-decorations/update', operationId: 'post___admin___avatar-decorations___update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.avatarDecorationUpdateInput).output(v.void()),
	get: oc.$meta<{ requestName: 'get-avatar-decorations' }>({ requestName: 'get-avatar-decorations' })
		.route({ method: 'POST', path: '/get-avatar-decorations', operationId: 'post___get-avatar-decorations', tags: ['users'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.avatarDecorationsInput).output(s.avatarDecorationsOutput),
};

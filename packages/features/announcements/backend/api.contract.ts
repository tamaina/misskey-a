/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import * as s from './api.schema.js';

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const announcementsContract = {
	create: oc.$meta<{ requestName: 'admin/announcements/create' }>({ requestName: 'admin/announcements/create' })
		.route({ method: 'POST', path: '/admin/announcements/create', operationId: 'post___admin___announcements___create', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.announcementCreateInput).output(s.announcementOutput),
	delete: oc.$meta<{ requestName: 'admin/announcements/delete' }>({ requestName: 'admin/announcements/delete' })
		.route({ method: 'POST', path: '/admin/announcements/delete', operationId: 'post___admin___announcements___delete', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(s.announcementDeleteInput).output(v.void()),
	adminList: oc.$meta<{ requestName: 'admin/announcements/list' }>({ requestName: 'admin/announcements/list' })
		.route({ method: 'POST', path: '/admin/announcements/list', operationId: 'post___admin___announcements___list', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(s.announcementAdminListInput).output(v.array(s.announcementAdminOutput)),
	update: oc.$meta<{ requestName: 'admin/announcements/update' }>({ requestName: 'admin/announcements/update' })
		.route({ method: 'POST', path: '/admin/announcements/update', operationId: 'post___admin___announcements___update', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(s.announcementUpdateInput).output(v.void()),
	list: oc.$meta<{ requestName: 'announcements' }>({ requestName: 'announcements' })
		.route({ method: 'POST', path: '/announcements', operationId: 'post___announcements', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(s.announcementListInput).output(v.array(s.announcementOutput)),
	show: oc.$meta<{ requestName: 'announcements/show' }>({ requestName: 'announcements/show' })
		.route({ method: 'POST', path: '/announcements/show', operationId: 'post___announcements___show', tags: ['meta'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_ANNOUNCEMENT: { status: 400, data: apiErrorData } })
		.input(s.announcementReadInput).output(s.announcementOutput),
	read: oc.$meta<{ requestName: 'i/read-announcement' }>({ requestName: 'i/read-announcement' })
		.route({ method: 'POST', path: '/i/read-announcement', operationId: 'post___i___read-announcement', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors })
		.input(s.announcementReadInput).output(v.void()),
};

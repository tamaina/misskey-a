/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { rolesInputs, rolesOutputs } from './api.schema.js';
const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const rolesContract = {
 adminRolesAssign: oc.$meta<{ requestName: 'admin/roles/assign' }>({ requestName: 'admin/roles/assign' })
 .route({ method: 'POST', path: '/admin/roles/assign', operationId: 'post___admin___roles___assign', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesAssign).output(rolesOutputs.adminRolesAssign),
 adminRolesCreate: oc.$meta<{ requestName: 'admin/roles/create' }>({ requestName: 'admin/roles/create' })
 .route({ method: 'POST', path: '/admin/roles/create', operationId: 'post___admin___roles___create', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(rolesInputs.adminRolesCreate).output(rolesOutputs.adminRolesCreate),
 adminRolesDelete: oc.$meta<{ requestName: 'admin/roles/delete' }>({ requestName: 'admin/roles/delete' })
 .route({ method: 'POST', path: '/admin/roles/delete', operationId: 'post___admin___roles___delete', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesDelete).output(rolesOutputs.adminRolesDelete),
 adminRolesList: oc.$meta<{ requestName: 'admin/roles/list' }>({ requestName: 'admin/roles/list' })
 .route({ method: 'POST', path: '/admin/roles/list', operationId: 'post___admin___roles___list', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(rolesInputs.adminRolesList).output(rolesOutputs.adminRolesList),
 adminRolesShow: oc.$meta<{ requestName: 'admin/roles/show' }>({ requestName: 'admin/roles/show' })
 .route({ method: 'POST', path: '/admin/roles/show', operationId: 'post___admin___roles___show', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesShow).output(rolesOutputs.adminRolesShow),
 adminRolesUnassign: oc.$meta<{ requestName: 'admin/roles/unassign' }>({ requestName: 'admin/roles/unassign' })
 .route({ method: 'POST', path: '/admin/roles/unassign', operationId: 'post___admin___roles___unassign', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, NOT_ASSIGNED: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesUnassign).output(rolesOutputs.adminRolesUnassign),
 adminRolesUpdate: oc.$meta<{ requestName: 'admin/roles/update' }>({ requestName: 'admin/roles/update' })
 .route({ method: 'POST', path: '/admin/roles/update', operationId: 'post___admin___roles___update', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesUpdate).output(rolesOutputs.adminRolesUpdate),
 adminRolesUpdateDefaultPolicies: oc.$meta<{ requestName: 'admin/roles/update-default-policies' }>({ requestName: 'admin/roles/update-default-policies' })
 .route({ method: 'POST', path: '/admin/roles/update-default-policies', operationId: 'post___admin___roles___update-default-policies', tags: ['admin', 'role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
 .errors({ ...commonErrors }).input(rolesInputs.adminRolesUpdateDefaultPolicies).output(rolesOutputs.adminRolesUpdateDefaultPolicies),
 adminRolesUsers: oc.$meta<{ requestName: 'admin/roles/users' }>({ requestName: 'admin/roles/users' })
 .route({ method: 'POST', path: '/admin/roles/users', operationId: 'post___admin___roles___users', tags: ['admin', 'role', 'users'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.adminRolesUsers).output(rolesOutputs.adminRolesUsers),
 rolesList: oc.$meta<{ requestName: 'roles/list' }>({ requestName: 'roles/list' })
 .route({ method: 'POST', path: '/roles/list', operationId: 'post___roles___list', tags: ['role'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors }).input(rolesInputs.rolesList).output(rolesOutputs.rolesList),
 rolesNotes: oc.$meta<{ requestName: 'roles/notes' }>({ requestName: 'roles/notes' })
 .route({ method: 'POST', path: '/roles/notes', operationId: 'post___roles___notes', tags: ['role', 'notes'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.rolesNotes).output(rolesOutputs.rolesNotes),
 rolesShow: oc.$meta<{ requestName: 'roles/show' }>({ requestName: 'roles/show' })
 .route({ method: 'POST', path: '/roles/show', operationId: 'post___roles___show', tags: ['role', 'users'], spec: current => ({ ...current, security: publicSecurity }) })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.rolesShow).output(rolesOutputs.rolesShow),
 rolesUsers: oc.$meta<{ requestName: 'roles/users' }>({ requestName: 'roles/users' })
 .route({ method: 'POST', path: '/roles/users', operationId: 'post___roles___users', tags: ['role', 'users'], spec: current => ({ ...current, security: publicSecurity }) })
 .errors({ ...commonErrors, NO_SUCH_ROLE: { status: 400, data: apiErrorData } }).input(rolesInputs.rolesUsers).output(rolesOutputs.rolesUsers),
};

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type { ContractEndpoints } from '../src/contract.types.js';
import type { Endpoints } from '../src/api.types.js';

type Assert<T extends true> = T;
type RejectPrimitive<T> = 1 extends T ? false : true;
type IInput = Assert<RejectPrimitive<ContractEndpoints['i']['req']>>;
type RolesInput = Assert<RejectPrimitive<ContractEndpoints['roles/list']['req']>>;
type AdminRolesInput = Assert<RejectPrimitive<ContractEndpoints['admin/roles/list']['req']>>;

const i: Endpoints['i']['req'] = {};
const roles: Endpoints['roles/list']['req'] = {};
const adminRoles: Endpoints['admin/roles/list']['req'] = {};
// @ts-expect-error The empty object request remains an object, not a primitive.
const primitiveI: Endpoints['i']['req'] = 1;
// @ts-expect-error The public roles request remains an object, not a primitive.
const primitiveRoles: Endpoints['roles/list']['req'] = 1;
// @ts-expect-error The admin roles request remains an object, not a primitive.
const primitiveAdminRoles: Endpoints['admin/roles/list']['req'] = 1;

type EmptyRequest = Endpoints['i']['req'] | Endpoints['roles/list']['req'] | Endpoints['admin/roles/list']['req'];
type RejectNull = Assert<null extends EmptyRequest ? false : true>;
type RejectUndefined = Assert<undefined extends EmptyRequest ? false : true>;
type NoIndexI = Assert<string extends keyof Endpoints['i']['req'] ? false : true>;
type NoIndexRoles = Assert<string extends keyof Endpoints['roles/list']['req'] ? false : true>;
type NoIndexAdminRoles = Assert<string extends keyof Endpoints['admin/roles/list']['req'] ? false : true>;
export type Cases = [IInput, RolesInput, AdminRolesInput, RejectNull, RejectUndefined, NoIndexI, NoIndexRoles, NoIndexAdminRoles];
void i; void roles; void adminRoles; void primitiveI; void primitiveRoles; void primitiveAdminRoles;

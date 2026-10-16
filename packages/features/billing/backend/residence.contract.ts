/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { declaredResidence, declaredResidenceInput, residenceCountry, peerReceiptSettings } from './residence.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
export const residenceErrors = { BILLING_COUNTRY_UNAVAILABLE: { status: 400, message: 'This operation cannot start under the current country settings.', data: apiErrorData }, RESIDENCE_REQUIRED: { status: 400, message: 'Register your residence in account settings before starting a new financial operation.', data: apiErrorData }, RESIDENCE_CONFLICT: { status: 409, data: apiErrorData } };
const procedure = oc.errors({ ...commonErrors, ...residenceErrors });
export const residenceContract = {
	getPeerReceiptSettings: procedure.$meta({ requestName: 'account/peer-receipt/get', requireCredential: true, kind: 'read:account' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/peer-receipt/get' }).input(v.strictObject({})).output(peerReceiptSettings),
	setPeerReceiptSettings: procedure.$meta({ requestName: 'account/peer-receipt/set', requireCredential: true, secure: true, kind: 'write:account', limit: { duration: 60000, max: 10 } } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/peer-receipt/set' }).input(peerReceiptSettings).output(peerReceiptSettings),
	getResidence: procedure.$meta({ requestName: 'account/residence/get', requireCredential: true, kind: 'read:account' } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/residence/get' }).input(v.strictObject({})).output(v.strictObject({ residence: v.nullable(declaredResidence), requiredSubdivisions: v.array(residenceCountry), isReady: v.boolean() })),
	setResidence: procedure.$meta({ requestName: 'account/residence/set', requireCredential: true, kind: 'write:account', limit: { duration: 60000, max: 10 } } as const satisfies ApiProcedureMetadata).route({ method: 'POST', path: '/account/residence/set' }).input(v.strictObject({ revision: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483646)), residence: declaredResidenceInput })).output(declaredResidence),
};

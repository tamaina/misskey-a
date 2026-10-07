/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import type { MiSignin } from '../../../features/auth/backend/models/Signin.js';
import type { adminShowUserInput, adminShowUserOutput, AdminUserEndpoints } from '../../../features/moderation/contract/admin-user-endpoint-definition.js';
import type { LegacyAdminUserProducerOutput } from '../../../features/moderation/backend/legacy-admin-user-producer-endpoint.js';
import { LegacyAdminUserProducerEndpoint } from '../../../features/moderation/backend/legacy-admin-user-producer-endpoint.js';
type Documented = InferOutput<typeof adminShowUserOutput>;
declare const raw:MiSignin[];
declare const producer:LegacyAdminUserProducerOutput;
// @ts-expect-error Raw entities omit createdAt; the compatibility boundary cannot claim packed output.
const signins:Documented['signins'] = raw;
// @ts-expect-error Actual legacy producer is not the documented native response.
const native:Documented = producer;
const remaining:Omit<Documented, 'signins'> = producer;
declare const documented:Documented;
const nativeToPublic:AdminUserEndpoints['admin/show-user']['res'] = documented;
// @ts-expect-error Exact route boundary does not accept caller-selected schema/producer type parameters.
type GenericEscape = LegacyAdminUserProducerEndpoint<string>;
new LegacyAdminUserProducerEndpoint(async (input, me) => {
 const nativeInput:InferOutput<typeof adminShowUserInput> = input;
 const id:string = me.id;
 return producer;
});

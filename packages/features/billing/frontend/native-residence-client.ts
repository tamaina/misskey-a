/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { ResidenceClient } from './residence-client.js';
export const nativeResidenceClient: ResidenceClient = {
	getResidence: input => misskeyApi('account/residence/get', input),
	setResidence: input => misskeyApi('account/residence/set', input),
};

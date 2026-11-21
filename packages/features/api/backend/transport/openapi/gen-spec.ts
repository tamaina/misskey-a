/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { genPilotOpenapiSpec } from './pilot-spec.js';

/** External specifications are generated from native oRPC contracts only. */
export const genOpenapiSpec = genPilotOpenapiSpec;
export async function genCompatibleOpenapiSpec(config: { version: string; apiUrl: string }, _includeSelfRef = false) {
 return genPilotOpenapiSpec(config);
}

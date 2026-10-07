/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { RemainingInlineEndpoints as PreferencesRemainingInlineEndpoints } from '../../preferences/contract/remaining-inline-endpoint-definitions.js';
import type { RemainingInlineEndpoints as StatisticsRemainingInlineEndpoints } from '../../statistics/contract/remaining-inline-endpoint-definitions.js';
import type { RemainingInlineEndpoints as AuthRemainingInlineEndpoints } from '../../auth/contract/remaining-inline-endpoint-definitions.js';

export type RemainingInlineNativeEndpoints = PreferencesRemainingInlineEndpoints
	& StatisticsRemainingInlineEndpoints
	& AuthRemainingInlineEndpoints;

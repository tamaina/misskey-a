/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SelectorCommonEndpoints as EmojiEndpoints } from '../../emojis/contract/selector-common-endpoint-definitions.js';
import type { SelectorCommonEndpoints as DiscoveryEndpoints } from '../../discovery/contract/selector-common-endpoint-definitions.js';
import type { SelectorCommonEndpoints as RelationshipEndpoints } from '../../relationships/contract/selector-common-endpoint-definitions.js';

export type SelectorCommonNativeEndpoints = EmojiEndpoints & DiscoveryEndpoints & RelationshipEndpoints;

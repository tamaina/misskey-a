/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiFeatures } from './feature-providers.js';

type Handler = { exec: (...args: never[]) => unknown };

/** Bind a handler factory to exactly the feature it consumes. No container access. */
export function defineFeatureEndpoint<K extends keyof ApiFeatures, E extends Handler>(
	feature: K,
	createEndpoint: (api: NoInfer<ApiFeatures[K]>) => E,
) {
	return { feature, createEndpoint };
}

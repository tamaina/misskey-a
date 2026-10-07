/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { perUserFollowingChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'perUserFollowing';

export { perUserFollowingChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = perUserFollowingChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);

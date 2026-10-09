/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../core.js';
import { perUserReactionsChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'perUserReaction';

export { perUserReactionsChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = perUserReactionsChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);

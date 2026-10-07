/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { perUserPvChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'perUserPv';

export { perUserPvChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = perUserPvChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);

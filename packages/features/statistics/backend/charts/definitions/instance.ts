/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../core.js';
import { instanceChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'instance';

export { instanceChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = instanceChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema, true);

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { activeUsersChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'activeUsers';

export { activeUsersChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = activeUsersChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

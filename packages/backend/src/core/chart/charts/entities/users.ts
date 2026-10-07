/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { usersChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'users';

export { usersChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = usersChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { driveChartDescriptor } from '../../../../../../features/statistics/shared/chart-descriptors.js';

export const name = 'drive';

export { driveChartDescriptor as schema } from '../../../../../../features/statistics/shared/chart-descriptors.js';

const schema = driveChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

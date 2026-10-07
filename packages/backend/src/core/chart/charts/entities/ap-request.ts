/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { apRequestChartDescriptor } from '../../../../../../features/statistics/shared/chart-descriptors.js';

export const name = 'apRequest';

export { apRequestChartDescriptor as schema } from '../../../../../../features/statistics/shared/chart-descriptors.js';

const schema = apRequestChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

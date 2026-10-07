/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { federationChartDescriptor } from '../../../../../../features/statistics/shared/chart-descriptors.js';

export const name = 'federation';

export { federationChartDescriptor as schema } from '../../../../../../features/statistics/shared/chart-descriptors.js';

const schema = federationChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

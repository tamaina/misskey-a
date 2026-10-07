/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';
import { notesChartDescriptor } from '@features/statistics/shared/chart-descriptors.js';

export const name = 'notes';

export { notesChartDescriptor as schema } from '@features/statistics/shared/chart-descriptors.js';

const schema = notesChartDescriptor;

export const entity = Chart.schemaToEntity(name, schema);

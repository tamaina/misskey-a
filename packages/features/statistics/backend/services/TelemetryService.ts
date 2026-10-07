/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { captureMessage, startSpan } from '../telemetry/telemetry-registry.js';
import type { TelemetryCaptureMessageOptions } from '../telemetry/adapters/TelemetryAdapter.js';

@Injectable()
export class TelemetryService {
	@bindThis
	public captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
		captureMessage(message, opts);
	}

	@bindThis
	public startSpan<T>(name: string, fn: () => T): T {
		return startSpan(name, fn);
	}
}

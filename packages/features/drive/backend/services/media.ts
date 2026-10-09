/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { ImageProcessingService } from './ImageProcessingService.js';
import { VideoProcessingService } from './VideoProcessingService.js';
import { SensitiveMediaDetectionService } from './SensitiveMediaDetectionService.js';
import { FileInfoService } from './FileInfoService.js';

const image = service(ImageProcessingService, []);
const sensitive = service(SensitiveMediaDetectionService, [ports.meta, ports.httpRequestService, ports.loggerService]);
export const mediaServices = defineServices({
	ImageProcessingService: image,
	VideoProcessingService: service(VideoProcessingService, [ports.config, image]),
	SensitiveMediaDetectionService: sensitive,
	FileInfoService: service(FileInfoService, [sensitive, ports.loggerService]),
});

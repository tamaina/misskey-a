/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { ImageProcessingService } from './services/ImageProcessingService.js';
import { VideoProcessingService } from './services/VideoProcessingService.js';
import { SensitiveMediaDetectionService } from './services/SensitiveMediaDetectionService.js';
import { FileInfoService } from './services/FileInfoService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

const image = service(ImageProcessingService, []);
const sensitive = service(SensitiveMediaDetectionService, [ports.meta, ports.httpRequestService, ports.loggerService]);
export const mediaServices = defineServices({
	ImageProcessingService: image,
	VideoProcessingService: service(VideoProcessingService, [ports.config, image]),
	SensitiveMediaDetectionService: sensitive,
	FileInfoService: service(FileInfoService, [sensitive, ports.loggerService]),
});
export const createMediaServices = mediaServices.create;
export type MediaServicesDependencies = Inputs<typeof mediaServices>;
export type MediaServices = Outputs<typeof mediaServices>;

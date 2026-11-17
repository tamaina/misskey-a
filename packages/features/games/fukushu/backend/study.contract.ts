/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { sourceIdSchema } from '../shared/material.schema.js';
import { studyHistoryItemSchema, studyHistoryPageSchema, studyQueueSchema, studyReviewInputSchema, studyReviewResultSchema } from '../shared/study.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

export const studyErrors = {
	STUDY_CONFLICT: { code: 'STUDY_CONFLICT', message: 'Study state changed. Reload the study queue.', id: 'a2d0200c-de42-4c09-acfc-2fd8bd1d48c8', status: 409 },
	STUDY_LIMIT: { code: 'STUDY_LIMIT', message: 'Study history limit reached.', id: '08fb9aa8-7afc-4b68-a240-f4b201ed62de' },
	STUDY_UNAVAILABLE: { code: 'STUDY_UNAVAILABLE', message: 'This card is not available for review.', id: '146825d0-f30c-49d5-a55e-585205b7dc84', status: 409 },
} as const;
const base = oc.errors({ ...commonErrors,
	NO_SUCH_MATERIAL: { status: 404, data: apiErrorData }, INVALID_MATERIAL: { status: 400, data: apiErrorData },
	CARD_HISTORY_LIMIT: { status: 400, data: apiErrorData }, STUDY_CONFLICT: { status: 409, data: apiErrorData },
	STUDY_LIMIT: { status: 400, data: apiErrorData }, STUDY_UNAVAILABLE: { status: 409, data: apiErrorData },
});
const read = { requireCredential: true, kind: 'read:account', limit: { duration: 60_000, max: 60 } } as const;
const write = { requireCredential: true, kind: 'write:account', limit: { duration: 60_000, max: 60 } } as const;
export const studyContract = {
	studyQueue: base.$meta({ ...read, requestName: 'fukushu/study/queue' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/study/queue', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema })).output(studyQueueSchema),
	studyReview: base.$meta({ ...write, requestName: 'fukushu/study/review' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/study/review', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput(studyReviewInputSchema.entries)).output(studyReviewResultSchema),
	studyHistory: base.$meta({ ...read, requestName: 'fukushu/study/history' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/study/history', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, ...studyHistoryPageSchema.entries }))
		.output(v.pipe(v.array(studyHistoryItemSchema), v.maxLength(20))),
};

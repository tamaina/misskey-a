/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import type { Config } from '@/config.js';
import type { Schema } from '@/misc/json-schema.js';
import frozen from '../../../test/fixtures/source-constant-contract-baseline.json' with { type: 'json' };
import { constantAdminQueueShowJobLogsDefinition, constantAdminQueueShowJobLogsInput, sourceConstantEndpointDefinitions as operationsDefinitions } from '../../../../features/operations/contract/source-constant-endpoint-definitions.js';
import { constantIWebhooksCreateDefinition, constantIWebhooksCreateInput, constantIWebhooksCreateOutput, constantIWebhooksTestDefinition, constantIWebhooksTestInput, sourceConstantEndpointDefinitions as integrationsDefinitions } from '../../../../features/integrations/contract/source-constant-endpoint-definitions.js';
import { constantAdminUpdateMetaDefinition, constantAdminUpdateMetaInput, sourceConstantEndpointDefinitions as instanceDefinitions } from '../../../../features/instance/contract/source-constant-endpoint-definitions.js';
import { constantIClaimAchievementDefinition, constantIClaimAchievementInput, sourceConstantEndpointDefinitions as usersDefinitions } from '../../../../features/users/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as OperationsEndpoints } from '../../../../features/operations/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as IntegrationsEndpoints } from '../../../../features/integrations/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as InstanceEndpoints } from '../../../../features/instance/contract/source-constant-endpoint-definitions.js';
import type { SourceConstantEndpoints as UsersEndpoints } from '../../../../features/users/contract/source-constant-endpoint-definitions.js';
import { QUEUE_TYPES } from '../../../../features/runtime/shared/queue-types.js';
import { webhookEventTypes } from '../../../../features/integrations/contract/index.js';
import { packedAchievementNameSchema } from '../../../../features/users/contract/packed.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { Endpoint } from './endpoint-base.js';
import { ApiError } from './error.js';
import documentedEndpoints from './endpoints.js';
import type { IEndpointMeta } from './endpoints.js';
import { genOpenapiSpec } from './openapi/gen-spec.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';

// Exercise the real writer without importing Nest handlers or unrelated runtime services.
vi.mock('./endpoints.js', () => ({ default: [] }));

const definitions = {
	...operationsDefinitions,
	...integrationsDefinitions,
	...instanceDefinitions,
	...usersDefinitions,
};
type Route = keyof typeof definitions;

// Independently frozen typed schema literals, kept in sync with the JSON provenance fixture.
const frozenInputs = {
	"admin/queue/show-job-logs": {
		"type": "object",
		"properties": {
			"queue": {
				"type": "string",
				"enum": [
					"system",
					"endedPollNotification",
					"postScheduledNote",
					"deliver",
					"inbox",
					"db",
					"relationship",
					"objectStorage",
					"userWebhookDeliver",
					"systemWebhookDeliver"
				]
			},
			"jobId": {
				"type": "string"
			}
		},
		"required": [
			"queue",
			"jobId"
		]
	},
	"admin/update-meta": {
		"type": "object",
		"properties": {
			"disableRegistration": {
				"type": "boolean",
				"nullable": true
			},
			"pinnedUsers": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"hiddenTags": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"blockedHosts": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"sensitiveWords": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"prohibitedWords": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"prohibitedWordsForNameOfUser": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"themeColor": {
				"type": "string",
				"nullable": true,
				"pattern": "^#[0-9a-fA-F]{6}$"
			},
			"mascotImageUrl": {
				"type": "string",
				"nullable": true
			},
			"bannerUrl": {
				"type": "string",
				"nullable": true
			},
			"serverErrorImageUrl": {
				"type": "string",
				"nullable": true
			},
			"infoImageUrl": {
				"type": "string",
				"nullable": true
			},
			"notFoundImageUrl": {
				"type": "string",
				"nullable": true
			},
			"iconUrl": {
				"type": "string",
				"nullable": true
			},
			"app192IconUrl": {
				"type": "string",
				"nullable": true
			},
			"app512IconUrl": {
				"type": "string",
				"nullable": true
			},
			"backgroundImageUrl": {
				"type": "string",
				"nullable": true
			},
			"logoImageUrl": {
				"type": "string",
				"nullable": true
			},
			"name": {
				"type": "string",
				"nullable": true
			},
			"shortName": {
				"type": "string",
				"nullable": true
			},
			"description": {
				"type": "string",
				"nullable": true
			},
			"defaultLightTheme": {
				"type": "string",
				"nullable": true
			},
			"defaultDarkTheme": {
				"type": "string",
				"nullable": true
			},
			"clientOptions": {
				"type": "object",
				"nullable": false,
				"properties": {
					"entrancePageStyle": {
						"type": "string",
						"nullable": false,
						"enum": [
							"classic",
							"simple"
						]
					},
					"showTimelineForVisitor": {
						"type": "boolean",
						"nullable": false
					},
					"showActivitiesForVisitor": {
						"type": "boolean",
						"nullable": false
					}
				}
			},
			"cacheRemoteFiles": {
				"type": "boolean"
			},
			"cacheRemoteSensitiveFiles": {
				"type": "boolean"
			},
			"emailRequiredForSignup": {
				"type": "boolean"
			},
			"enableHcaptcha": {
				"type": "boolean"
			},
			"hcaptchaSiteKey": {
				"type": "string",
				"nullable": true
			},
			"hcaptchaSecretKey": {
				"type": "string",
				"nullable": true
			},
			"enableMcaptcha": {
				"type": "boolean"
			},
			"mcaptchaSiteKey": {
				"type": "string",
				"nullable": true
			},
			"mcaptchaInstanceUrl": {
				"type": "string",
				"nullable": true
			},
			"mcaptchaSecretKey": {
				"type": "string",
				"nullable": true
			},
			"enableRecaptcha": {
				"type": "boolean"
			},
			"recaptchaSiteKey": {
				"type": "string",
				"nullable": true
			},
			"recaptchaSecretKey": {
				"type": "string",
				"nullable": true
			},
			"enableTurnstile": {
				"type": "boolean"
			},
			"turnstileSiteKey": {
				"type": "string",
				"nullable": true
			},
			"turnstileSecretKey": {
				"type": "string",
				"nullable": true
			},
			"enableTestcaptcha": {
				"type": "boolean"
			},
			"googleAnalyticsMeasurementId": {
				"type": "string",
				"nullable": true
			},
			"sensitiveMediaDetection": {
				"type": "string",
				"enum": [
					"none",
					"all",
					"local",
					"remote"
				]
			},
			"sensitiveMediaDetectionSensitivity": {
				"type": "string",
				"enum": [
					"medium",
					"low",
					"high",
					"veryLow",
					"veryHigh"
				]
			},
			"setSensitiveFlagAutomatically": {
				"type": "boolean"
			},
			"enableSensitiveMediaDetectionForVideos": {
				"type": "boolean"
			},
			"sensitiveMediaDetectionApiUrl": {
				"type": "string",
				"nullable": true
			},
			"sensitiveMediaDetectionApiKey": {
				"type": "string",
				"nullable": true
			},
			"sensitiveMediaDetectionTimeout": {
				"type": "integer",
				"minimum": 1
			},
			"sensitiveMediaDetectionMaxImagesPerRequest": {
				"type": "integer",
				"minimum": 1
			},
			"maintainerName": {
				"type": "string",
				"nullable": true
			},
			"maintainerEmail": {
				"type": "string",
				"nullable": true
			},
			"langs": {
				"type": "array",
				"items": {
					"type": "string"
				}
			},
			"deeplAuthKey": {
				"type": "string",
				"nullable": true
			},
			"deeplIsPro": {
				"type": "boolean"
			},
			"enableEmail": {
				"type": "boolean"
			},
			"email": {
				"type": "string",
				"nullable": true
			},
			"smtpSecure": {
				"type": "boolean"
			},
			"smtpHost": {
				"type": "string",
				"nullable": true
			},
			"smtpPort": {
				"type": "integer",
				"nullable": true
			},
			"smtpUser": {
				"type": "string",
				"nullable": true
			},
			"smtpPass": {
				"type": "string",
				"nullable": true
			},
			"enableServiceWorker": {
				"type": "boolean"
			},
			"swPublicKey": {
				"type": "string",
				"nullable": true
			},
			"swPrivateKey": {
				"type": "string",
				"nullable": true
			},
			"tosUrl": {
				"type": "string",
				"nullable": true
			},
			"repositoryUrl": {
				"type": "string",
				"nullable": true
			},
			"feedbackUrl": {
				"type": "string",
				"nullable": true
			},
			"impressumUrl": {
				"type": "string",
				"nullable": true
			},
			"privacyPolicyUrl": {
				"type": "string",
				"nullable": true
			},
			"inquiryUrl": {
				"type": "string",
				"nullable": true
			},
			"useObjectStorage": {
				"type": "boolean"
			},
			"objectStorageBaseUrl": {
				"type": "string",
				"nullable": true
			},
			"objectStorageBucket": {
				"type": "string",
				"nullable": true
			},
			"objectStoragePrefix": {
				"type": "string",
				"pattern": "^[a-zA-Z0-9-._]*$",
				"nullable": true
			},
			"objectStorageEndpoint": {
				"type": "string",
				"nullable": true
			},
			"objectStorageRegion": {
				"type": "string",
				"nullable": true
			},
			"objectStoragePort": {
				"type": "integer",
				"nullable": true
			},
			"objectStorageAccessKey": {
				"type": "string",
				"nullable": true
			},
			"objectStorageSecretKey": {
				"type": "string",
				"nullable": true
			},
			"objectStorageUseSSL": {
				"type": "boolean"
			},
			"objectStorageUseProxy": {
				"type": "boolean"
			},
			"objectStorageSetPublicRead": {
				"type": "boolean"
			},
			"objectStorageS3ForcePathStyle": {
				"type": "boolean"
			},
			"enableIpLogging": {
				"type": "boolean"
			},
			"enableActiveEmailValidation": {
				"type": "boolean"
			},
			"enableVerifymailApi": {
				"type": "boolean"
			},
			"verifymailAuthKey": {
				"type": "string",
				"nullable": true
			},
			"enableTruemailApi": {
				"type": "boolean"
			},
			"truemailInstance": {
				"type": "string",
				"nullable": true
			},
			"truemailAuthKey": {
				"type": "string",
				"nullable": true
			},
			"enableChartsForRemoteUser": {
				"type": "boolean"
			},
			"enableChartsForFederatedInstances": {
				"type": "boolean"
			},
			"enableStatsForFederatedInstances": {
				"type": "boolean"
			},
			"enableServerMachineStats": {
				"type": "boolean"
			},
			"enableIdenticonGeneration": {
				"type": "boolean"
			},
			"serverRules": {
				"type": "array",
				"items": {
					"type": "string"
				}
			},
			"bannedEmailDomains": {
				"type": "array",
				"items": {
					"type": "string"
				}
			},
			"preservedUsernames": {
				"type": "array",
				"items": {
					"type": "string"
				}
			},
			"manifestJsonOverride": {
				"type": "string"
			},
			"enableFanoutTimeline": {
				"type": "boolean"
			},
			"enableFanoutTimelineDbFallback": {
				"type": "boolean"
			},
			"perLocalUserUserTimelineCacheMax": {
				"type": "integer"
			},
			"perRemoteUserUserTimelineCacheMax": {
				"type": "integer"
			},
			"perUserHomeTimelineCacheMax": {
				"type": "integer"
			},
			"perUserListTimelineCacheMax": {
				"type": "integer"
			},
			"enableReactionsBuffering": {
				"type": "boolean"
			},
			"notesPerOneAd": {
				"type": "integer"
			},
			"silencedHosts": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"mediaSilencedHosts": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"summalyProxy": {
				"type": "string",
				"nullable": true,
				"description": "[Deprecated] Use \"urlPreviewSummaryProxyUrl\" instead."
			},
			"urlPreviewEnabled": {
				"type": "boolean"
			},
			"urlPreviewAllowRedirect": {
				"type": "boolean"
			},
			"urlPreviewTimeout": {
				"type": "integer"
			},
			"urlPreviewMaximumContentLength": {
				"type": "integer"
			},
			"urlPreviewRequireContentLength": {
				"type": "boolean"
			},
			"urlPreviewUserAgent": {
				"type": "string",
				"nullable": true
			},
			"urlPreviewSummaryProxyUrl": {
				"type": "string",
				"nullable": true
			},
			"urlPreviewSensitiveList": {
				"type": "array",
				"nullable": true,
				"items": {
					"type": "string"
				}
			},
			"federation": {
				"type": "string",
				"enum": [
					"all",
					"none",
					"specified"
				]
			},
			"federationHosts": {
				"type": "array",
				"items": {
					"type": "string"
				}
			},
			"deliverSuspendedSoftware": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"software": {
							"type": "string"
						},
						"versionRange": {
							"type": "string"
						}
					},
					"required": [
						"software",
						"versionRange"
					]
				}
			},
			"singleUserMode": {
				"type": "boolean"
			},
			"ugcVisibilityForVisitor": {
				"type": "string",
				"enum": [
					"all",
					"local",
					"none"
				]
			},
			"proxyRemoteFiles": {
				"type": "boolean"
			},
			"signToActivityPubGet": {
				"type": "boolean"
			},
			"allowExternalApRedirect": {
				"type": "boolean"
			},
			"enableRemoteNotesCleaning": {
				"type": "boolean"
			},
			"remoteNotesCleaningExpiryDaysForEachNotes": {
				"type": "number"
			},
			"remoteNotesCleaningMaxProcessingDurationInMinutes": {
				"type": "number"
			},
			"showRoleBadgesOfRemoteUsers": {
				"type": "boolean"
			}
		},
		"required": []
	},
	"i/claim-achievement": {
		"type": "object",
		"properties": {
			"name": {
				"type": "string",
				"enum": [
					"notes1",
					"notes10",
					"notes100",
					"notes500",
					"notes1000",
					"notes5000",
					"notes10000",
					"notes20000",
					"notes30000",
					"notes40000",
					"notes50000",
					"notes60000",
					"notes70000",
					"notes80000",
					"notes90000",
					"notes100000",
					"login3",
					"login7",
					"login15",
					"login30",
					"login60",
					"login100",
					"login200",
					"login300",
					"login400",
					"login500",
					"login600",
					"login700",
					"login800",
					"login900",
					"login1000",
					"passedSinceAccountCreated1",
					"passedSinceAccountCreated2",
					"passedSinceAccountCreated3",
					"loggedInOnBirthday",
					"loggedInOnNewYearsDay",
					"noteClipped1",
					"noteFavorited1",
					"myNoteFavorited1",
					"profileFilled",
					"markedAsCat",
					"following1",
					"following10",
					"following50",
					"following100",
					"following300",
					"followers1",
					"followers10",
					"followers50",
					"followers100",
					"followers300",
					"followers500",
					"followers1000",
					"collectAchievements30",
					"viewAchievements3min",
					"iLoveMisskey",
					"foundTreasure",
					"client30min",
					"client60min",
					"noteDeletedWithin1min",
					"postedAtLateNight",
					"postedAt0min0sec",
					"selfQuote",
					"htl20npm",
					"viewInstanceChart",
					"outputHelloWorldOnScratchpad",
					"open3windows",
					"driveFolderCircularReference",
					"reactWithoutRead",
					"clickedClickHere",
					"justPlainLucky",
					"setNameToSyuilo",
					"cookieClicked",
					"brainDiver",
					"smashTestNotificationButton",
					"tutorialCompleted",
					"bubbleGameExplodingHead",
					"bubbleGameDoubleExplodingHead"
				]
			}
		},
		"required": [
			"name"
		]
	},
	"i/webhooks/create": {
		"type": "object",
		"properties": {
			"name": {
				"type": "string",
				"minLength": 1,
				"maxLength": 100
			},
			"url": {
				"type": "string",
				"minLength": 1,
				"maxLength": 1024
			},
			"secret": {
				"type": "string",
				"maxLength": 1024,
				"default": ""
			},
			"on": {
				"type": "array",
				"items": {
					"type": "string",
					"enum": [
						"mention",
						"unfollow",
						"follow",
						"followed",
						"note",
						"reply",
						"renote",
						"reaction"
					]
				}
			}
		},
		"required": [
			"name",
			"url",
			"on"
		]
	},
	"i/webhooks/test": {
		"type": "object",
		"properties": {
			"webhookId": {
				"type": "string",
				"format": "misskey:id"
			},
			"type": {
				"type": "string",
				"enum": [
					"mention",
					"unfollow",
					"follow",
					"followed",
					"note",
					"reply",
					"renote",
					"reaction"
				]
			},
			"override": {
				"type": "object",
				"properties": {
					"url": {
						"type": "string"
					},
					"secret": {
						"type": "string"
					}
				}
			}
		},
		"required": [
			"webhookId",
			"type"
		]
	}
} as const satisfies Record<Route, Schema>;

function baseline(route: Route) {
	const fixture = frozen.routes.find(row => row.route === route);
	if (!fixture) throw new Error('Missing frozen source-constant fixture: ' + route);
	return fixture;
}

function legacyInput(route: Route): Schema {
	expect(frozenInputs[route]).toEqual(baseline(route).input);
	return structuredClone(frozenInputs[route]);
}

function normalizeInput(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalizeInput);
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value)
			.filter(([key, child]) => !(key === 'required' && Array.isArray(child) && child.length === 0)
				&& !(key === 'properties' && child !== null && typeof child === 'object' && Object.keys(child).length === 0))
			.map(([key, child]) => [key, normalizeInput(child)]));
	}
	return value;
}

function validValue(schema: Schema): unknown {
	if (schema.enum) return schema.enum[0];
	switch (schema.type) {
		case 'boolean': return true;
		case 'integer':
		case 'number': return schema.minimum ?? 1;
		case 'array': return [];
		case 'object': return Object.fromEntries((schema.required ?? [])
			.map(key => [key, validValue(schema.properties?.[key] ?? {})]));
		default: return schema.format === 'misskey:id' ? 'id1' : 'value';
	}
}

function fieldSamples(schema: Schema): unknown[] {
	const values: unknown[] = [null, false, true, 0, 1, 1.5, -1, '', 'value', [], {}];
	if (schema.enum) values.push(...schema.enum, 'unrecognized', 'SYSTEM', 'mention\n');
	if (schema.type === 'array') values.push(['value', 'value'], ['😀'], [1], [null]);
	if (schema.type === 'integer' || schema.type === 'number') values.push(
		Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1,
		schema.minimum ?? 0, (schema.minimum ?? 0) - 1, '1', Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY,
	);
	if (schema.type === 'string') values.push('😀', 'é', 'é', 'value\n');
	if (schema.format === 'misskey:id') values.push('ABC123', 'invalid-id', 'id1\n');
	if (schema.minLength !== undefined) values.push('x'.repeat(schema.minLength));
	if (schema.maxLength !== undefined) values.push(
		'x'.repeat(schema.maxLength), 'x'.repeat(schema.maxLength + 1),
		'😀'.repeat(schema.maxLength), '😀'.repeat(schema.maxLength + 1),
	);
	if (schema.pattern) values.push('#00aAfF', '#00aAfF\n', '#12345', '#1234567', 'prefix-._09', 'prefix/invalid', '\n');
	if (schema.type === 'object') {
		const body = validValue(schema);
		if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
			values.push(body, { ...body, future: { retained: true } });
			for (const [key, child] of Object.entries(schema.properties ?? {})) {
				for (const value of fieldSamples(child)) values.push({ ...body, [key]: value });
			}
			for (const key of schema.required ?? []) values.push(Object.fromEntries(Object.entries(body)
				.filter(([name]) => name !== key)));
		}
	}
	return values;
}

function requestSamples(route: Route): unknown[] {
	const schema = legacyInput(route);
	const required = route === 'admin/queue/show-job-logs' ? { queue: 'system', jobId: '' }
		: route === 'i/webhooks/create' ? { name: 'webhook', url: 'plain text is accepted', on: [] }
			: route === 'i/webhooks/test' ? { webhookId: 'id1', type: 'mention' }
				: route === 'i/claim-achievement' ? { name: 'notes1' } : {};
	const samples: unknown[] = [required, { ...required, future: { retained: [null, false, 1] } }, {}, null, [], '', 1];
	for (const [key, child] of Object.entries(schema.properties ?? {})) {
		for (const value of fieldSamples(child)) samples.push({ ...required, [key]: value });
	}
	for (const key of schema.required ?? []) samples.push(Object.fromEntries(Object.entries(required)
		.filter(([name]) => name !== key)));
	if (route === 'i/webhooks/create') samples.push(
		{ ...required, on: ['mention', 'mention'] }, { ...required, on: [...webhookEventTypes] },
		{ ...required, on: ['unrecognized'] }, { ...required, secret: undefined },
	);
	if (route === 'admin/update-meta') samples.push(
		{ deliverSuspendedSoftware: [{ software: '', versionRange: '', future: true }] },
		{ deliverSuspendedSoftware: [{ software: 'value' }] },
		{ deliverSuspendedSoftware: [{ versionRange: 'value' }] },
		{ deliverSuspendedSoftware: [{ software: 1, versionRange: 'value' }] },
		{ deliverSuspendedSoftware: [null] },
		{ clientOptions: { entrancePageStyle: 'classic', future: { retained: true } } },
		{ clientOptions: { entrancePageStyle: 'simple' } },
		{ clientOptions: { entrancePageStyle: 'other' } },
	);
	return samples;
}

type TransportEndpoint = { exec: (params: unknown, user: null, token: null) => Promise<unknown> };

async function outcome(endpoint: TransportEndpoint, params: unknown, response: unknown) {
	try {
		expect(await endpoint.exec(params, null, null)).toBe(response);
		return { valid: true };
	} catch (error) {
		if (!(error instanceof ApiError)) throw error;
		return {
			valid: false, message: error.message, code: error.code, id: error.id,
			kind: error.kind, httpStatusCode: error.httpStatusCode, info: error.info,
		};
	}
}

test('the five named definitions, aggregate maps and source option identities stay intact', () => {
	expect(Object.keys(definitions).sort()).toEqual(frozen.routes.map(row => row.route).sort());
	expect(definitions['admin/queue/show-job-logs']).toBe(constantAdminQueueShowJobLogsDefinition);
	expect(definitions['i/webhooks/create']).toBe(constantIWebhooksCreateDefinition);
	expect(definitions['i/webhooks/test']).toBe(constantIWebhooksTestDefinition);
	expect(definitions['admin/update-meta']).toBe(constantAdminUpdateMetaDefinition);
	expect(definitions['i/claim-achievement']).toBe(constantIClaimAchievementDefinition);
	expect(constantAdminQueueShowJobLogsInput.entries.queue.options).toBe(QUEUE_TYPES);
	expect(QUEUE_TYPES).toEqual(baseline('admin/queue/show-job-logs').input.properties.queue?.enum);
	expect(constantIWebhooksCreateInput.entries.on.item.options).toBe(webhookEventTypes);
	expect(constantIWebhooksCreateOutput.entries.on.item.options).toBe(webhookEventTypes);
	expect(constantIWebhooksTestInput.entries.type.options).toBe(webhookEventTypes);
	expect(webhookEventTypes).toEqual(baseline('i/webhooks/test').input.properties.type?.enum);
	expect(constantIClaimAchievementInput.entries.name).toBe(packedAchievementNameSchema);
	expect(packedAchievementNameSchema.options).toEqual(baseline('i/claim-achievement').input.properties.name?.enum);
	expect(packedAchievementNameSchema.options).toHaveLength(78);
});

for (const route of Object.keys(definitions) as Route[]) {
	test(route + ' preserves projected input and published response documentation', () => {
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
		const fixture = baseline(route);
		expect(normalizeInput(projection.input)).toEqual(normalizeInput(fixture.input));
		const before = fixture.openapi.post.responses['200']?.content['application/json'].schema;
		const after = projection.response === undefined ? undefined : convertSchemaToOpenApiSchema(projection.response, 'res', true);
		expect(after).toEqual(before);
	});

	test(route + ' retains real AJV errors, defaults, mutations, extra fields and callback suppression', async () => {
		const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
		// Widen only schema generics, leaving every request and response uncast and unparsed.
		const response = { deliberatelyUnparsed: [null, 1], future: { retained: true } };
		const oldCalls: unknown[] = [];
		const newCalls: unknown[] = [];
		const legacy = new Endpoint({}, legacyInput(route), async input => { oldCalls.push(input); return response; });
		const current = new ContractEndpoint({}, projection, async input => { newCalls.push(input); return response; });
		for (const sample of requestSamples(route)) {
			oldCalls.length = 0;
			newCalls.length = 0;
			const beforeParams = structuredClone(sample);
			const afterParams = structuredClone(sample);
			const before = await outcome(legacy, beforeParams, response);
			const after = await outcome(current, afterParams, response);
			expect(after, JSON.stringify(sample)).toEqual(before);
			expect(afterParams).toEqual(beforeParams);
			expect(newCalls).toHaveLength(oldCalls.length);
			if (before.valid) {
				expect(oldCalls[0]).toBe(beforeParams);
				expect(newCalls[0]).toBe(afterParams);
			} else {
				expect(newCalls).toHaveLength(0);
				expect(after).toMatchObject({ code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532' });
			}
			const portable = v.safeParse<v.GenericSchema>(definitions[route].input, structuredClone(sample));
			expect(portable.success, JSON.stringify(sample)).toBe(before.valid);
			if (portable.success) expect(portable.output).toEqual(beforeParams);
		}
	});
}

test('every queue, webhook and achievement option parses with exact case and order', () => {
	for (const queue of QUEUE_TYPES) expect(v.parse(constantAdminQueueShowJobLogsInput, { queue, jobId: '' }).queue).toBe(queue);
	for (const type of webhookEventTypes) {
		expect(v.parse(constantIWebhooksCreateInput, { name: 'n', url: 'u', on: [type, type] }).on).toEqual([type, type]);
		expect(v.parse(constantIWebhooksTestInput, { webhookId: 'id1', type }).type).toBe(type);
	}
	for (const name of packedAchievementNameSchema.options) expect(v.parse(constantIClaimAchievementInput, { name }).name).toBe(name);
	for (const name of ['NOTES1', 'notes1\n', '', 'unrecognized']) expect(v.safeParse(constantIClaimAchievementInput, { name }).success).toBe(false);
});

test('webhook Unicode boundaries, default insertion and invalid-request mutation match AJV', async () => {
	const projection = projectEndpointContract(constantIWebhooksCreateDefinition);
	const response = { id: 'id1', userId: 'user1', name: 'n', url: 'u', secret: '', on: [], active: true, latestSentAt: null, latestStatus: null };
	const before = { name: '😀'.repeat(100), url: '😀'.repeat(1024), on: ['mention', 'mention'], future: true };
	const after = structuredClone(before);
	const legacy = new Endpoint({}, legacyInput('i/webhooks/create'), async input => { expect(input).toBe(before); return response; });
	const current = new ContractEndpoint({}, projection, async input => { expect(input).toBe(after); return response; });
	expect(await legacy.exec(before, null, null)).toBe(response);
	expect(await current.exec(after, null, null)).toBe(response);
	expect(after).toEqual({ ...before, secret: '' });
	expect(v.parse(constantIWebhooksCreateInput, { name: '😀'.repeat(100), url: 'plain text', on: [] }).secret).toBe('');
	expect(v.safeParse(constantIWebhooksCreateInput, { name: '😀'.repeat(101), url: 'u', on: [] }).success).toBe(false);
	const oldInvalid = { url: 'u', on: [] };
	const newInvalid = structuredClone(oldInvalid);
	const oldFailure = await outcome(legacy, oldInvalid, response);
	expect(await outcome(current, newInvalid, response)).toEqual(oldFailure);
	expect(newInvalid).toEqual({ url: 'u', on: [], secret: '' });
});

test('nested webhook/admin request objects and opaque response extensions retain identity', async () => {
	const override = { url: '', secret: '', future: { keep: true } };
	const params = { webhookId: 'id1', type: 'mention', override, future: ['kept'] };
	const webhook = new ContractEndpoint({}, projectEndpointContract(constantIWebhooksTestDefinition), async input => {
		expect(input).toBe(params);
		expect(input.override).toBe(override);
	});
	await expect(webhook.exec(params, null, null)).resolves.toBeUndefined();
	const clientOptions = { entrancePageStyle: 'classic', future: { keep: true } };
	const software = [{ software: '', versionRange: '', future: { keep: true } }];
	const adminParams = { clientOptions, deliverSuspendedSoftware: software, future: { keep: true } };
	const admin = new ContractEndpoint({}, projectEndpointContract(constantAdminUpdateMetaDefinition), async input => {
		expect(input).toBe(adminParams);
		expect(input.clientOptions).toBe(clientOptions);
		expect(input.deliverSuspendedSoftware).toBe(software);
	});
	await expect(admin.exec(adminParams, null, null)).resolves.toBeUndefined();
	const response = { id: 'id1', userId: 'user1', name: 'n', url: 'u', secret: '', on: ['mention' as const], active: true, latestSentAt: null, latestStatus: null, future: { keep: true } };
	const create = new ContractEndpoint({}, projectEndpointContract(constantIWebhooksCreateDefinition), async () => response);
	expect(await create.exec({ name: 'n', url: 'u', on: [] }, null, null)).toBe(response);
	expect(v.parse(constantIWebhooksCreateOutput, response)).toEqual(response);
});

test('portable admin schemas keep regex, nullability, loose nested objects and unrestricted numeric ranges', () => {
	for (const objectStoragePrefix of ['', 'prefix-._09', null]) expect(v.safeParse(constantAdminUpdateMetaInput, { objectStoragePrefix }).success).toBe(true);
	for (const objectStoragePrefix of ['prefix/invalid', 'é', '😀']) expect(v.safeParse(constantAdminUpdateMetaInput, { objectStoragePrefix }).success).toBe(false);
	for (const themeColor of ['#00aAfF', null]) expect(v.safeParse(constantAdminUpdateMetaInput, { themeColor }).success).toBe(true);
	for (const themeColor of ['#12345', '#1234567', 'red']) expect(v.safeParse(constantAdminUpdateMetaInput, { themeColor }).success).toBe(false);
	expect(v.parse(constantAdminUpdateMetaInput, { smtpPort: null, objectStoragePort: -1, perUserHomeTimelineCacheMax: Number.MAX_SAFE_INTEGER + 1 }).objectStoragePort).toBe(-1);
	expect(v.safeParse(constantAdminUpdateMetaInput, { sensitiveMediaDetectionTimeout: 0 }).success).toBe(false);
	expect(v.safeParse(constantAdminUpdateMetaInput, { clientOptions: null }).success).toBe(false);
	expect(v.safeParse(constantAdminUpdateMetaInput, { cacheRemoteFiles: null }).success).toBe(false);
	expect(v.parse(constantAdminUpdateMetaInput, { disableRegistration: null, clientOptions: { future: true } })).toEqual({ disableRegistration: null, clientOptions: { future: true } });
});

test('declared finite JSON numbers match rejecting AJV, including exponent overflow', async () => {
	const admin = new ContractEndpoint({}, projectEndpointContract(constantAdminUpdateMetaDefinition), async () => {});
	const webhook = new ContractEndpoint({}, projectEndpointContract(constantIWebhooksTestDefinition), async () => {});
	await expect(admin.exec([], null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/type' } });
	await expect(admin.exec({ clientOptions: [] }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/properties/clientOptions/type' } });
	await expect(webhook.exec({ webhookId: 'id1', type: 'mention', override: [] }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/properties/override/type' } });
	for (const number of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, JSON.parse('1e999'), JSON.parse('-1e999')]) {
		const params = { remoteNotesCleaningExpiryDaysForEachNotes: number, remoteNotesCleaningMaxProcessingDurationInMinutes: number };
		expect(v.safeParse(constantAdminUpdateMetaInput, params).success).toBe(false);
		await expect(admin.exec(params, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/properties/remoteNotesCleaningExpiryDaysForEachNotes/type' } });
	}
	for (const number of [0, -1, 0.5, Number.MAX_VALUE, -Number.MAX_VALUE]) {
		const params = { remoteNotesCleaningExpiryDaysForEachNotes: number, remoteNotesCleaningMaxProcessingDurationInMinutes: number };
		expect(v.parse(constantAdminUpdateMetaInput, params)).toEqual(params);
		await expect(admin.exec(params, null, null)).resolves.toBeUndefined();
	}
});

test('the actual OpenAPI writer preserves all five complete published paths and no-content metadata', () => {
	const saved = documentedEndpoints.slice();
	try {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...Object.entries(definitions).map(([route, definition]) => {
			const fixture = baseline(route as Route);
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
			const { res: _res, ...metadata } = fixture.meta;
			const meta = projection.response === undefined ? metadata : { ...metadata, res: projection.response };
			return { name: route, meta: meta as IEndpointMeta, params: projection.input };
		}));
		// The writer reads only these two configuration fields.
		const config = { version: 'source-constant-test', apiUrl: 'https://source-constant.test/api' } as Config;
		const spec = genOpenapiSpec(config);
		expect(Object.keys(spec.paths).sort()).toEqual(frozen.routes.map(row => '/' + row.route).sort());
		for (const route of Object.keys(definitions) as Route[]) {
			expect(JSON.parse(JSON.stringify(spec.paths['/' + route]))).toEqual(baseline(route).openapi);
			const noContent = baseline(route).output === null;
			const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
			if (noContent) {
				expect(projection.response).toBeUndefined();
				expect(documentedEndpoints.find(endpoint => endpoint.name === route)?.meta).not.toHaveProperty('res');
				expect(spec.paths['/' + route].post.responses).not.toHaveProperty('200');
				expect(spec.paths['/' + route].post.responses['204']).toEqual({ description: 'OK (without any results)' });
				expect(v.safeParse(definitions[route].output, undefined).success).toBe(true);
				expect(v.safeParse(definitions[route].output, null).success).toBe(false);
			}
		}
		expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
	} finally {
		documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
	}
});

test('endpoint-map types preserve narrowed source options and inferred response/void branches', () => {
	expectTypeOf<OperationsEndpoints['admin/queue/show-job-logs']['req']['queue']>().toEqualTypeOf<typeof QUEUE_TYPES[number]>();
	expectTypeOf<OperationsEndpoints['admin/queue/show-job-logs']['res']>().toEqualTypeOf<string[]>();
	expectTypeOf<IntegrationsEndpoints['i/webhooks/create']['req']['on']>().toEqualTypeOf<(typeof webhookEventTypes[number])[]>();
	expectTypeOf<IntegrationsEndpoints['i/webhooks/create']['res']['latestStatus']>().toEqualTypeOf<number | null>();
	expectTypeOf<IntegrationsEndpoints['i/webhooks/test']['res']>().toEqualTypeOf<void>();
	expectTypeOf<InstanceEndpoints['admin/update-meta']['res']>().toEqualTypeOf<void>();
	expectTypeOf<UsersEndpoints['i/claim-achievement']['res']>().toEqualTypeOf<void>();
	expectTypeOf<UsersEndpoints['i/claim-achievement']['req']['name']>().toEqualTypeOf<v.InferOutput<typeof packedAchievementNameSchema>>();
});

// These cases retain the canonical JSON-object parity regression gates.
test.each([
	{ name: 'admin/update-meta root', route: 'admin/update-meta' as const, params: [] },
	{ name: 'admin/update-meta clientOptions', route: 'admin/update-meta' as const, params: { clientOptions: [] } },
	{ name: 'i/webhooks/test override', route: 'i/webhooks/test' as const, params: { webhookId: 'id1', type: 'mention', override: [] } },
])('canonical JSON-object parsing matches rejecting AJV for $name arrays', async ({ route, params }) => {
	const definition = definitions[route];
	const endpoint = new ContractEndpoint({}, projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition), async () => {});
	await expect(endpoint.exec(params, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(v.safeParse(definition.input, params).success).toBe(false);
});

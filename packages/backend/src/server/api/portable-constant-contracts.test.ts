/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import type { Config } from '@/config.js';
import type { Schema } from '@features/api/backend/utility/json-schema.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import { endpoints as documentedEndpoints } from '@features/index/backend/endpoints.js';
import { genOpenapiSpec } from '@features/api/backend/transport/openapi/gen-spec.js';
import * as v from 'valibot';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';
import type { Packed } from '@features/index/contract/packed.js';
import baseline from '../../../test/fixtures/portable-constant-contract-baseline.json' with { type: 'json' };
import { portableConstantEndpointDefinitions as definitions0 } from '@features/auth/contract/portable-constant-endpoint-definitions.js';
import { portableConstantEndpointDefinitions as definitions1 } from '@features/integrations/contract/portable-constant-endpoint-definitions.js';
import { portableConstantEndpointDefinitions as definitions2 } from '@features/users/contract/portable-constant-endpoint-definitions.js';
import { portableConstantEndpointDefinitions as definitions3 } from '@features/notifications/contract/portable-constant-endpoint-definitions.js';
import { portableConstantEndpointDefinitions as definitions4 } from '@features/pages/contract/portable-constant-endpoint-definitions.js';
import { portableConstantEndpointDefinitions as definitions5 } from '@features/emojis/contract/portable-constant-endpoint-definitions.js';

const definitions = { ...definitions0, ...definitions1, ...definitions2, ...definitions3, ...definitions4, ...definitions5 };

type Route = keyof typeof definitions;
const frozenInputs = {
  "admin/captcha/save": {
    "type": "object",
    "properties": {
      "provider": {
        "type": "string",
        "enum": [
          "none",
          "hcaptcha",
          "mcaptcha",
          "recaptcha",
          "turnstile",
          "testcaptcha"
        ]
      },
      "captchaResult": {
        "type": "string",
        "nullable": true
      },
      "sitekey": {
        "type": "string",
        "nullable": true
      },
      "secret": {
        "type": "string",
        "nullable": true
      },
      "instanceUrl": {
        "type": "string",
        "nullable": true
      }
    },
    "required": [
      "provider"
    ]
  },
  "admin/system-webhook/create": {
    "type": "object",
    "properties": {
      "isActive": {
        "type": "boolean"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 255
      },
      "on": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "abuseReport",
            "abuseReportResolved",
            "userCreated",
            "inactiveModeratorsWarning",
            "inactiveModeratorsInvitationOnlyChanged"
          ]
        }
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
      }
    },
    "required": [
      "isActive",
      "name",
      "on",
      "url"
    ]
  },
  "admin/system-webhook/list": {
    "type": "object",
    "properties": {
      "isActive": {
        "type": "boolean"
      },
      "on": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "abuseReport",
            "abuseReportResolved",
            "userCreated",
            "inactiveModeratorsWarning",
            "inactiveModeratorsInvitationOnlyChanged"
          ]
        }
      }
    },
    "required": []
  },
  "admin/system-webhook/test": {
    "type": "object",
    "properties": {
      "webhookId": {
        "type": "string",
        "format": "misskey:id"
      },
      "type": {
        "type": "string",
        "enum": [
          "abuseReport",
          "abuseReportResolved",
          "userCreated",
          "inactiveModeratorsWarning",
          "inactiveModeratorsInvitationOnlyChanged"
        ]
      },
      "override": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "nullable": false
          },
          "secret": {
            "type": "string",
            "nullable": false
          }
        }
      }
    },
    "required": [
      "webhookId",
      "type"
    ]
  },
  "admin/system-webhook/update": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "misskey:id"
      },
      "isActive": {
        "type": "boolean"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 255
      },
      "on": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "abuseReport",
            "abuseReportResolved",
            "userCreated",
            "inactiveModeratorsWarning",
            "inactiveModeratorsInvitationOnlyChanged"
          ]
        }
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
      }
    },
    "required": [
      "id",
      "isActive",
      "name",
      "on",
      "url"
    ]
  },
  "admin/update-proxy-account": {
    "type": "object",
    "properties": {
      "description": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1500,
        "nullable": true
      }
    }
  },
  "i/notifications": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      },
      "sinceId": {
        "type": "string",
        "format": "misskey:id"
      },
      "untilId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceDate": {
        "type": "integer"
      },
      "untilDate": {
        "type": "integer"
      },
      "markAsRead": {
        "type": "boolean",
        "default": true
      },
      "includeTypes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "note",
            "follow",
            "mention",
            "reply",
            "renote",
            "quote",
            "reaction",
            "pollEnded",
            "scheduledNotePosted",
            "scheduledNotePostFailed",
            "receiveFollowRequest",
            "followRequestAccepted",
            "roleAssigned",
            "chatRoomInvitationReceived",
            "achievementEarned",
            "exportCompleted",
            "login",
            "createToken",
            "app",
            "test",
            "pollVote",
            "groupInvited"
          ]
        }
      },
      "excludeTypes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "note",
            "follow",
            "mention",
            "reply",
            "renote",
            "quote",
            "reaction",
            "pollEnded",
            "scheduledNotePosted",
            "scheduledNotePostFailed",
            "receiveFollowRequest",
            "followRequestAccepted",
            "roleAssigned",
            "chatRoomInvitationReceived",
            "achievementEarned",
            "exportCompleted",
            "login",
            "createToken",
            "app",
            "test",
            "pollVote",
            "groupInvited"
          ]
        }
      }
    },
    "required": []
  },
  "i/notifications-grouped": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      },
      "sinceId": {
        "type": "string",
        "format": "misskey:id"
      },
      "untilId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceDate": {
        "type": "integer"
      },
      "untilDate": {
        "type": "integer"
      },
      "markAsRead": {
        "type": "boolean",
        "default": true
      },
      "includeTypes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "note",
            "follow",
            "mention",
            "reply",
            "renote",
            "quote",
            "reaction",
            "pollEnded",
            "scheduledNotePosted",
            "scheduledNotePostFailed",
            "receiveFollowRequest",
            "followRequestAccepted",
            "roleAssigned",
            "chatRoomInvitationReceived",
            "achievementEarned",
            "exportCompleted",
            "login",
            "createToken",
            "app",
            "test",
            "pollVote",
            "groupInvited"
          ]
        }
      },
      "excludeTypes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "note",
            "follow",
            "mention",
            "reply",
            "renote",
            "quote",
            "reaction",
            "pollEnded",
            "scheduledNotePosted",
            "scheduledNotePostFailed",
            "receiveFollowRequest",
            "followRequestAccepted",
            "roleAssigned",
            "chatRoomInvitationReceived",
            "achievementEarned",
            "exportCompleted",
            "login",
            "createToken",
            "app",
            "test",
            "pollVote",
            "groupInvited"
          ]
        }
      }
    },
    "required": []
  },
  "pages/create": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "pattern": "^[^\\s:\\/?#\\[\\]@!$&'()*+,;=\\\\%\\x00-\\x20]{1,256}$",
        "minLength": 1
      },
      "summary": {
        "type": "string",
        "nullable": true
      },
      "content": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "variables": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "script": {
        "type": "string"
      },
      "eyeCatchingImageId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "font": {
        "type": "string",
        "enum": [
          "serif",
          "sans-serif"
        ],
        "default": "sans-serif"
      },
      "alignCenter": {
        "type": "boolean",
        "default": false
      },
      "hideTitleWhenPinned": {
        "type": "boolean",
        "default": false
      }
    },
    "required": [
      "title",
      "name",
      "content",
      "variables",
      "script"
    ]
  },
  "pages/update": {
    "type": "object",
    "properties": {
      "pageId": {
        "type": "string",
        "format": "misskey:id"
      },
      "title": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "pattern": "^[^\\s:\\/?#\\[\\]@!$&'()*+,;=\\\\%\\x00-\\x20]{1,256}$",
        "minLength": 1
      },
      "summary": {
        "type": "string",
        "nullable": true
      },
      "content": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "variables": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "script": {
        "type": "string"
      },
      "eyeCatchingImageId": {
        "type": "string",
        "format": "misskey:id",
        "nullable": true
      },
      "font": {
        "type": "string",
        "enum": [
          "serif",
          "sans-serif"
        ]
      },
      "alignCenter": {
        "type": "boolean"
      },
      "hideTitleWhenPinned": {
        "type": "boolean"
      }
    },
    "required": [
      "pageId"
    ]
  },
  "v2/admin/emoji/list": {
    "type": "object",
    "properties": {
      "query": {
        "type": "object",
        "nullable": true,
        "properties": {
          "updatedAtFrom": {
            "type": "string"
          },
          "updatedAtTo": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "host": {
            "type": "string"
          },
          "uri": {
            "type": "string"
          },
          "publicUrl": {
            "type": "string"
          },
          "originalUrl": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "aliases": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "license": {
            "type": "string"
          },
          "isSensitive": {
            "type": "boolean"
          },
          "localOnly": {
            "type": "boolean"
          },
          "hostType": {
            "type": "string",
            "enum": [
              "local",
              "remote",
              "all"
            ],
            "default": "all"
          },
          "roleIds": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "misskey:id"
            }
          }
        }
      },
      "sinceId": {
        "type": "string",
        "format": "misskey:id"
      },
      "untilId": {
        "type": "string",
        "format": "misskey:id"
      },
      "sinceDate": {
        "type": "integer"
      },
      "untilDate": {
        "type": "integer"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10
      },
      "page": {
        "type": "integer"
      },
      "sortKeys": {
        "type": "array",
        "default": [
          "-id"
        ],
        "items": {
          "type": "string",
          "enum": [
            "+id",
            "-id",
            "+updatedAt",
            "-updatedAt",
            "+name",
            "-name",
            "+host",
            "-host",
            "+uri",
            "-uri",
            "+publicUrl",
            "-publicUrl",
            "+type",
            "-type",
            "+aliases",
            "-aliases",
            "+category",
            "-category",
            "+license",
            "-license",
            "+isSensitive",
            "-isSensitive",
            "+localOnly",
            "-localOnly",
            "+roleIdsThatCanBeUsedThisEmojiAsReaction",
            "-roleIdsThatCanBeUsedThisEmojiAsReaction"
          ]
        }
      }
    },
    "required": []
  }
} as const satisfies Record<Route, Schema>;
const frozenMetas = {
  "admin/captcha/save": {
    "tags": [
      "admin",
      "captcha"
    ],
    "requireCredential": true,
    "requireAdmin": true,
    "kind": "write:admin:meta",
    "errors": {
      "invalidProvider": {
        "message": "Invalid provider.",
        "code": "INVALID_PROVIDER",
        "id": "14bf7ae1-80cc-4363-acb2-4fd61d086af0",
        "httpStatusCode": 400
      },
      "invalidParameters": {
        "message": "Invalid parameters.",
        "code": "INVALID_PARAMETERS",
        "id": "26654194-410e-44e2-b42e-460ff6f92476",
        "httpStatusCode": 400
      },
      "noResponseProvided": {
        "message": "No response provided.",
        "code": "NO_RESPONSE_PROVIDED",
        "id": "40acbba8-0937-41fb-bb3f-474514d40afe",
        "httpStatusCode": 400
      },
      "requestFailed": {
        "message": "Request failed.",
        "code": "REQUEST_FAILED",
        "id": "0f4fe2f1-2c15-4d6e-b714-efbfcde231cd",
        "httpStatusCode": 500
      },
      "verificationFailed": {
        "message": "Verification failed.",
        "code": "VERIFICATION_FAILED",
        "id": "c41c067f-24f3-4150-84b2-b5a3ae8c2214",
        "httpStatusCode": 400
      },
      "unknown": {
        "message": "unknown",
        "code": "UNKNOWN",
        "id": "f868d509-e257-42a9-99c1-42614b031a97",
        "httpStatusCode": 500
      }
    }
  },
  "admin/system-webhook/create": {
    "tags": [
      "admin",
      "system-webhook"
    ],
    "requireCredential": true,
    "requireModerator": true,
    "secure": true,
    "kind": "write:admin:system-webhook",
    "res": {
      "type": "object",
      "ref": "SystemWebhook"
    }
  },
  "admin/system-webhook/list": {
    "tags": [
      "admin",
      "system-webhook"
    ],
    "requireCredential": true,
    "requireModerator": true,
    "secure": true,
    "kind": "write:admin:system-webhook",
    "res": {
      "type": "array",
      "items": {
        "type": "object",
        "ref": "SystemWebhook"
      }
    }
  },
  "admin/system-webhook/test": {
    "tags": [
      "webhooks"
    ],
    "requireCredential": true,
    "requireModerator": true,
    "secure": true,
    "kind": "read:admin:system-webhook",
    "limit": {
      "duration": 900000,
      "max": 60
    },
    "errors": {
      "noSuchWebhook": {
        "message": "No such webhook.",
        "code": "NO_SUCH_WEBHOOK",
        "id": "0c52149c-e913-18f8-5dc7-74870bfe0cf9"
      }
    }
  },
  "admin/system-webhook/update": {
    "tags": [
      "admin",
      "system-webhook"
    ],
    "requireCredential": true,
    "requireModerator": true,
    "secure": true,
    "kind": "write:admin:system-webhook",
    "res": {
      "type": "object",
      "ref": "SystemWebhook"
    }
  },
  "admin/update-proxy-account": {
    "tags": [
      "admin"
    ],
    "requireCredential": true,
    "requireModerator": true,
    "kind": "write:admin:account",
    "res": {
      "type": "object",
      "nullable": false,
      "optional": false,
      "ref": "UserDetailed"
    }
  },
  "i/notifications": {
    "tags": [
      "account",
      "notifications"
    ],
    "requireCredential": true,
    "limit": {
      "duration": 30000,
      "max": 30
    },
    "kind": "read:notifications",
    "res": {
      "type": "array",
      "optional": false,
      "nullable": false,
      "items": {
        "type": "object",
        "optional": false,
        "nullable": false,
        "ref": "Notification"
      }
    }
  },
  "i/notifications-grouped": {
    "tags": [
      "account",
      "notifications"
    ],
    "requireCredential": true,
    "limit": {
      "duration": 30000,
      "max": 30
    },
    "kind": "read:notifications",
    "res": {
      "type": "array",
      "optional": false,
      "nullable": false,
      "items": {
        "type": "object",
        "optional": false,
        "nullable": false,
        "ref": "Notification"
      }
    }
  },
  "pages/create": {
    "tags": [
      "pages"
    ],
    "requireCredential": true,
    "prohibitMoved": true,
    "kind": "write:pages",
    "limit": {
      "duration": 3600000,
      "max": 10
    },
    "res": {
      "type": "object",
      "optional": false,
      "nullable": false,
      "ref": "Page"
    },
    "errors": {
      "noSuchFile": {
        "message": "No such file.",
        "code": "NO_SUCH_FILE",
        "id": "b7b97489-0f66-4b12-a5ff-b21bd63f6e1c"
      },
      "nameAlreadyExists": {
        "message": "Specified name already exists.",
        "code": "NAME_ALREADY_EXISTS",
        "id": "4650348e-301c-499a-83c9-6aa988c66bc1"
      }
    }
  },
  "pages/update": {
    "tags": [
      "pages"
    ],
    "requireCredential": true,
    "prohibitMoved": true,
    "kind": "write:pages",
    "limit": {
      "duration": 3600000,
      "max": 300
    },
    "errors": {
      "noSuchPage": {
        "message": "No such page.",
        "code": "NO_SUCH_PAGE",
        "id": "21149b9e-3616-4778-9592-c4ce89f5a864"
      },
      "accessDenied": {
        "message": "Access denied.",
        "code": "ACCESS_DENIED",
        "id": "3c15cd52-3b4b-4274-967d-6456fc4f792b"
      },
      "noSuchFile": {
        "message": "No such file.",
        "code": "NO_SUCH_FILE",
        "id": "cfc23c7c-3887-490e-af30-0ed576703c82"
      },
      "nameAlreadyExists": {
        "message": "Specified name already exists.",
        "code": "NAME_ALREADY_EXISTS",
        "id": "2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab"
      }
    }
  },
  "v2/admin/emoji/list": {
    "tags": [
      "admin"
    ],
    "requireCredential": true,
    "requiredRolePolicy": "canManageCustomEmojis",
    "kind": "read:admin:emoji",
    "res": {
      "type": "object",
      "properties": {
        "emojis": {
          "type": "array",
          "items": {
            "type": "object",
            "ref": "EmojiDetailedAdmin"
          }
        },
        "count": {
          "type": "integer"
        },
        "allCount": {
          "type": "integer"
        },
        "allPages": {
          "type": "integer"
        }
      }
    }
  }
} as const;

vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));
const transportMeta = { requireCredential: false } as const;

function normalized(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalized);
	if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value)
		.filter(([key, item]) => item !== undefined && !(key === 'required' && Array.isArray(item) && item.length === 0)
			&& !(key === 'properties' && item !== null && typeof item === 'object' && Object.keys(item).length === 0))
		.map(([key, item]) => [key, normalized(item)]));
	return value;
}

for (const route of Object.keys(definitions) as Route[]) {
	const row = baseline.routes.find(item => item.route === route)!;
	const definition = definitions[route as keyof typeof definitions];
	const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definition);
	test(`${route} retains captured input and complete response documentation`, () => {
		expect(normalized(projection.input)).toEqual(normalized(row.input));
		expect(JSON.parse(JSON.stringify(projection.input))).toEqual(row.input);
		expect(frozenInputs[route]).toEqual(row.input);
		const response = projection.response === undefined ? null : convertSchemaToOpenApiSchema(projection.response, 'res', true);
		const expected = row.output === null ? null : row.openapi.post.responses['200'].content['application/json'].schema;
		expect(normalized(response)).toEqual(normalized(expected));
	});
	test(`${route} matches real legacy AJV, defaults and portable object parsing`, async () => {
		for (const sample of baseline.samples[route as keyof typeof baseline.samples]) {
			const before = structuredClone(sample);
			const after = structuredClone(sample);
			const sentinel = { opaque: ['preserve'], unvalidatedResponse: true };
			let oldCalls = 0;
			let newCalls = 0;
			const legacy = new Endpoint(transportMeta, frozenInputs[route], async (input: unknown) => {
				oldCalls++;
				expect(input).toBe(before);
				return sentinel;
			});
			const native = new ContractEndpoint<typeof transportMeta, v.GenericSchema, v.GenericSchema>(transportMeta, projection, async input => {
				newCalls++;
				expect(input).toBe(after);
				return sentinel;
			});
			const outcome = async (endpoint: { exec: (input: unknown, me: null, token: null) => Promise<unknown> }, input: unknown) => {
				try {
					expect(await endpoint.exec(input, null, null)).toBe(sentinel);
					return { valid: true };
				} catch (error) {
					if (error === null || typeof error !== 'object') throw error;
					return { valid: false, ...Object.fromEntries(['code', 'id', 'info'].filter(key => key in error).map(key => [key, Reflect.get(error, key)])) };
				}
			};
			const original = await outcome(legacy, before);
			expect(await outcome(native, after)).toEqual(original);
			expect(after).toEqual(before);
			expect(newCalls).toBe(oldCalls);
			const parsed = v.safeParse(definition.input, structuredClone(sample));
			expect(parsed.success).toBe(original.valid);
			if (parsed.success) expect(parsed.output).toEqual(before);
		}
	});
}

test('v2 emoji defaults only enter a present object query', () => {
	const input = definitions['v2/admin/emoji/list'].input;
	expect(v.parse(input, {})).toEqual({ limit: 10, sortKeys: ['-id'] });
	expect(v.parse(input, { query: null })).toEqual({ query: null, limit: 10, sortKeys: ['-id'] });
	expect(v.parse(input, { query: {} })).toEqual({ query: { hostType: 'all' }, limit: 10, sortKeys: ['-id'] });
});

test('page opaque content preserves object identity and every own special key', () => {
	const opaque = JSON.parse('{"constructor":{"keep":true},"__proto__":{"keep":true},"prototype":{"keep":true}}');
	const parsed = v.parse(definitions['pages/create'].input, { title: '', name: 'valid', content: [opaque], variables: [opaque], script: '' });
	expect(parsed.content[0]).toBe(opaque);
	expect(parsed.variables[0]).toBe(opaque);
	expect(Object.keys(parsed.content[0])).toEqual(['constructor', '__proto__', 'prototype']);
});

test('native outputs remain canonical packed identities and explicit void routes', () => {
	expectTypeOf<v.InferOutput<typeof definitions['pages/create']['output']>>().toEqualTypeOf<Packed<'Page'>>();
	expectTypeOf<v.InferOutput<typeof definitions['admin/update-proxy-account']['output']>>().toEqualTypeOf<Packed<'UserDetailed'>>();
	expectTypeOf<v.InferOutput<typeof definitions['admin/system-webhook/create']['output']>>().toEqualTypeOf<Packed<'SystemWebhook'>>();
	expectTypeOf<v.InferOutput<typeof definitions['admin/system-webhook/list']['output']>>().toEqualTypeOf<Packed<'SystemWebhook'>[]>();
	expectTypeOf<v.InferOutput<typeof definitions['i/notifications']['output']>>().toEqualTypeOf<Packed<'Notification'>[]>();
	expectTypeOf<v.InferOutput<typeof definitions['i/notifications-grouped']['output']>>().toEqualTypeOf<Packed<'Notification'>[]>();
	expectTypeOf<v.InferOutput<typeof definitions['admin/captcha/save']['output']>>().toEqualTypeOf<void>();
	expectTypeOf<v.InferOutput<typeof definitions['admin/system-webhook/test']['output']>>().toEqualTypeOf<void>();
	expectTypeOf<v.InferOutput<typeof definitions['pages/update']['output']>>().toEqualTypeOf<void>();
});

test('the real OpenAPI writer retains all 11 complete paths, auth, errors and statuses', () => {
 const saved = documentedEndpoints.slice();
 try {
  documentedEndpoints.splice(0, documentedEndpoints.length, ...(Object.keys(definitions) as Route[]).map(route => {
   const projection = projectEndpointContract<v.GenericSchema, v.GenericSchema>(definitions[route]);
   const meta: IEndpointMeta = projection.response === undefined ? frozenMetas[route] : { ...frozenMetas[route], res: projection.response };
   return { name: route, meta, params: projection.input };
  }));
  // The OpenAPI writer reads only these two configuration fields.
  const config = { version: 'portable-constant-test', apiUrl: 'https://portable-constant.test/api' } as Config;
  const spec = genOpenapiSpec(config);
  expect(Object.keys(spec.paths).sort()).toEqual(baseline.routes.map(row => '/' + row.route).sort());
  for (const row of baseline.routes) {
   expect(JSON.parse(JSON.stringify(spec.paths['/' + row.route]))).toEqual(row.openapi);
   if (row.output === null) {
    expect(spec.paths['/' + row.route].post.responses).not.toHaveProperty('200');
    expect(spec.paths['/' + row.route].post.responses['204']).toEqual({ description: 'OK (without any results)' });
   }
  }
  expect(genOpenapiSpec(config).paths).toEqual(spec.paths);
 } finally {
  documentedEndpoints.splice(0, documentedEndpoints.length, ...saved);
 }
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { locales } from 'i18n';
import escapes from './shared-global-locale-escapes.json';
import type { RuntimeLocaleDictionary } from 'vite-vue-internationalization/runtime';

// Independently pinned source hashes; translation values remain in locales/*.yml.
export const globalCatalogPilotOwners = [
	{
		"file": "packages/features/announcements/frontend/components/MkAnnouncementDialog.vue",
		"currentSha256": "a49b1b88c6ec7cb5a2ff19b4d7eecba80931d43585c79bf4157b5b68657c44a9",
		"baselineSha256": "39e6076f76e0ce6e7a6b9e6b9b72873a0658112f877ab85a4902fd305f678bc4",
		"keys": [
			"close"
		],
		"order": [
			"close",
			"scrollToClose",
			"readConfirmTitle",
			"readConfirmText"
		],
		"edits": [
			{
				"start": 1210,
				"end": 1246,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1305,
				"end": 1305,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1796,
				"end": 1854,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/announcements/frontend/pages/admin/announcements.vue",
		"currentSha256": "1a8e79446a17395586d6eb21df6187c074f020ea622d0083a4929e8446a3425d",
		"baselineSha256": "8216ce30170a3c8b35764c8415014c1bd47299d42978a107a5a9c5ddb1033f03",
		"keys": [
			"save",
			"delete",
			"title",
			"add",
			"more",
			"filter",
			"deleteAreYouSure",
			"announcements",
			"imageUrl"
		],
		"order": [
			"announcementShouldNotBeUsedToPresentPermanentInfo",
			"announcementTooManyActiveAnnouncementDescription",
			"filter",
			"save",
			"announcementEnd",
			"archive",
			"unarchive",
			"delete",
			"title",
			"text",
			"imageUrl",
			"icon",
			"normal",
			"banner",
			"dialog",
			"display",
			"announcementDialogAnnouncementUxWarn",
			"announcementForExistingUsersDescription",
			"announcementForExistingUsers",
			"announcementSilenceDescription",
			"announcementSilence",
			"announcementNeedConfirmationToReadDescription",
			"announcementNeedConfirmationToRead",
			"nUsersRead",
			"more",
			"active",
			"archived",
			"deleteAreYouSure",
			"add",
			"announcements",
			"autoArchiveAt",
			"autoArchiveAtDescription",
			"autoArchiveAtMustBeInFuture"
		],
		"edits": [
			{
				"start": 5197,
				"end": 5233,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 5292,
				"end": 5292,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 6671,
				"end": 6729,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/announcements/frontend/pages/announcement.vue",
		"currentSha256": "3c31b666fba79fcc5e383c584981167192025991c945fd3a5d86d4d1f159c90f",
		"baselineSha256": "7772f834f22b870fb4462d7d00604869042fc074e01d833ad02cb71b27c61f7c",
		"keys": [
			"gotIt",
			"createdAt",
			"updatedAt",
			"announcements"
		],
		"order": [
			"forYou",
			"createdAt",
			"updatedAt",
			"gotIt",
			"readConfirmTitle",
			"readConfirmText",
			"announcements"
		],
		"edits": [
			{
				"start": 2374,
				"end": 2410,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2469,
				"end": 2469,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3022,
				"end": 3080,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/announcements/frontend/pages/announcements.vue",
		"currentSha256": "029bc857f1291a2c0a1c998e255ba25fc47fce54efa59d3e852df5b8799f40bc",
		"baselineSha256": "4e57ca112c9e1ead4de6afe497f1c9595d45c027fc05ece0ab57c106993c86da",
		"keys": [
			"gotIt",
			"createdAt",
			"updatedAt",
			"announcements"
		],
		"order": [
			"readConfirmTitle",
			"readConfirmText",
			"currentAnnouncements",
			"pastAnnouncements",
			"announcements",
			"youHaveUnreadAnnouncements",
			"forYou",
			"createdAt",
			"updatedAt",
			"gotIt"
		],
		"edits": [
			{
				"start": 2439,
				"end": 2475,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2534,
				"end": 2534,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3340,
				"end": 3398,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/api/frontend/ui/_common_/stream-indicator.vue",
		"currentSha256": "aff67a030c2169baf5c69919689e829a2a43fcf55a882e18676c961c98a94980",
		"baselineSha256": "47259b21d93960db7d5aba4701546f318918b3d607238bc3a85aaa869ade1b67",
		"keys": [
			"reload"
		],
		"order": [
			"disconnectedFromServer",
			"reload",
			"doNothing"
		],
		"edits": [
			{
				"start": 600,
				"end": 636,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 695,
				"end": 695,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1054,
				"end": 1112,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkAuthConfirm.vue",
		"currentSha256": "3122bd5cfcbeb23a9d89f6de8225cbeb378317c95523f6ef6c38b69c9f12aec9",
		"baselineSha256": "d36befd86c58d5f8f193dfba5dc43edaab4138f5dc9a535cfe517b16cc5f8245",
		"keys": [
			"somethingHappened",
			"accept",
			"reject",
			"adminPermission",
			"enableAll",
			"disableAll",
			"enableAllAdmin",
			"disableAllAdmin",
			"continue",
			"permissionsLabels"
		],
		"order": [
			"pleaseSelectAccount",
			"selectAccount",
			"addAccount",
			"continue",
			"authShareAccess",
			"authShareAccessAsk",
			"authPermission",
			"authPermissionAsk",
			"permissionsLabels",
			"authScopeUser",
			"switchAccount",
			"reject",
			"accept",
			"authAccepted",
			"authPleaseGoBack",
			"authDenied",
			"somethingHappened",
			"existingAccount",
			"createAccount",
			"disableAll",
			"enableAll",
			"disableAllAdmin",
			"enableAllAdmin",
			"adminPermission"
		],
		"edits": [
			{
				"start": 3293,
				"end": 3293,
				"current": "",
				"baseline": " :labels=\"copyLocaleDictionary(globalLocale.env._permissions)\"\n\t\t\t\t:disableAllText=\"globalLocale.env.disableAll\" :enableAllText=\"globalLocale.env.enableAll\"\n\t\t\t\t:disableAllAdminText=\"globalLocale.env.disableAllAdmin\" :enableAllAdminText=\"globalLocale.env.enableAllAdmin\" :adminPermissionText=\"globalLocale.env.adminPermission\""
			},
			{
				"start": 5515,
				"end": 5551,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 5610,
				"end": 5610,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 6401,
				"end": 6459,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkInviteCode.vue",
		"currentSha256": "92fc709f5addffc762072e4c5f5d405702686bbddec603217e470529263f36bc",
		"baselineSha256": "bc19a1c54705e39d82f1e975dc8f224ab3c35d26757ae8eaf4ecfe634a47af12",
		"keys": [
			"delete",
			"copy",
			"createdAt"
		],
		"order": [
			"used",
			"expired",
			"unused",
			"copy",
			"delete",
			"invitationCode",
			"inviteCodeCreator",
			"registeredUserUsingInviteCode",
			"unknown",
			"waitingForMailAuth",
			"expirationDate",
			"inviteCodeUsedAt",
			"createdAt"
		],
		"edits": [
			{
				"start": 2508,
				"end": 2544,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2603,
				"end": 2603,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2950,
				"end": 3008,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkPasswordDialog.vue",
		"currentSha256": "02925ecc24e8ad685a2ce41b9d86a02f680e792b0bf6e18f8ec5df88c25274d5",
		"baselineSha256": "5d88f7f78a6b070f88db5c7a4465aae7d8a940e25688d05be7d2621041c314aa",
		"keys": [
			"continue"
		],
		"order": [
			"authentication",
			"authenticationRequiredToContinue",
			"password",
			"token",
			"2fa",
			"useTotp",
			"useBackupCode",
			"continue"
		],
		"edits": [
			{
				"start": 1958,
				"end": 1994,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2053,
				"end": 2053,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2385,
				"end": 2443,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignin.input.vue",
		"currentSha256": "ca0e851be26e8a519324a9454bc94d971754d15f0661f490e1fc16f168ba4b64",
		"baselineSha256": "cc8fc6d7882268e3a8a0b8d704c5f86625bc1c0a318c21651f4bc7c66e1c4464",
		"keys": [
			"continue"
		],
		"order": [
			"inputHostName",
			"invalidValue",
			"tryAgain",
			"continueOnRemote",
			"specifyServerHost",
			"or",
			"username",
			"continue",
			"signinWithPasskey"
		],
		"edits": [
			{
				"start": 1973,
				"end": 2009,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2068,
				"end": 2068,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2640,
				"end": 2698,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignin.passkey.vue",
		"currentSha256": "7e701febddfad910787889844ed315175b634d17c9348088a28a9844605cd3d0",
		"baselineSha256": "f0ac9281aabe608396969de32b234c1fa1d5f57ff4f016a019782c3749ccca37",
		"keys": [
			"retry"
		],
		"order": [
			"useSecurityKey",
			"retry",
			"useTotp"
		],
		"edits": [
			{
				"start": 797,
				"end": 833,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 892,
				"end": 892,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1178,
				"end": 1236,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignin.password.vue",
		"currentSha256": "460a8099586b71fd5fc612d156da8d9fcd08b3c4684d7d3344a38ed03c786e7d",
		"baselineSha256": "deec8dc8ff34adb89d26b6ba8a56cfed188acc0d159000a6cc290020080b085b",
		"keys": [
			"continue"
		],
		"order": [
			"welcomeBackWithName",
			"password",
			"forgotPassword",
			"continue"
		],
		"edits": [
			{
				"start": 2264,
				"end": 2300,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2359,
				"end": 2359,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3086,
				"end": 3144,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignin.totp.vue",
		"currentSha256": "3406115d62d89d041a5035b394d8323051004297cd6f040d4c8c9f71ca13af80",
		"baselineSha256": "6b19cabca936e5980d2807f1f4a6a36df058dfed62803c05f3989aab2f6d86b2",
		"keys": [
			"continue"
		],
		"order": [
			"2fa",
			"token",
			"useTotp",
			"useBackupCode",
			"continue"
		],
		"edits": [
			{
				"start": 1289,
				"end": 1325,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1384,
				"end": 1384,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1549,
				"end": 1607,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignupDialog.form.vue",
		"currentSha256": "0b01d687a5f5315d68e4c114a02fa723589e5e63335f3c0b1b51f264a32eca9b",
		"baselineSha256": "66697782b1d396279dfc7174c47befe85c85301ffd2e20514a39308cfae8b92b",
		"keys": [
			"somethingHappened",
			"error"
		],
		"order": [
			"invitationCode",
			"username",
			"usernameInfo",
			"cannotBeChangedLater",
			"checking",
			"available",
			"unavailable",
			"error",
			"usernameInvalidFormat",
			"tooShort",
			"tooLong",
			"emailAddress",
			"signupEmailAddressInfo",
			"emailUnavailableUsed",
			"emailUnavailableFormat",
			"emailUnavailableDisposable",
			"emailUnavailableBanned",
			"emailUnavailableMx",
			"emailUnavailableSmtp",
			"password",
			"weakPassword",
			"normalPassword",
			"strongPassword",
			"retype",
			"passwordMatched",
			"passwordNotMatched",
			"start",
			"signupAlmostThere",
			"signupEmailSent",
			"somethingHappened"
		],
		"edits": [
			{
				"start": 7344,
				"end": 7380,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 7439,
				"end": 7439,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 8279,
				"end": 8337,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkSignupDialog.rules.vue",
		"currentSha256": "8bb93c3e456f7725362d14f098e274070733191be6bf586475ef336e4385f267",
		"baselineSha256": "cc1386f44e5b9f520032ac0a1762d76a6853f36663e4bf6c4d7579bd771662fc",
		"keys": [
			"cancel",
			"continue",
			"termsOfService",
			"privacyPolicy"
		],
		"order": [
			"invitationRequiredToRegister",
			"federationSpecified",
			"federationDisabled",
			"pleaseConfirmBelowBeforeSignup",
			"beSureToReadThisAsItIsImportant",
			"serverRules",
			"agree",
			"termsOfService",
			"privacyPolicy",
			"basicNotesBeforeCreateAccount",
			"pleaseAgreeAllToContinue",
			"cancel",
			"continue",
			"tosAndPrivacyPolicy",
			"doYouAgree",
			"iHaveReadXCarefullyAndAgree"
		],
		"edits": [
			{
				"start": 3536,
				"end": 3572,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3631,
				"end": 3631,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4169,
				"end": 4227,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/components/MkTokenGenerateWindow.vue",
		"currentSha256": "472304bdee7ade8cfbfa89a4903e9267ba77168e4927d3baaf2c648970224bdc",
		"baselineSha256": "ea0dc9eccc892bbb4e8ad2656cb4b795db0739eb194d3899b17bcd839aa60010",
		"keys": [
			"name",
			"permission",
			"adminPermission",
			"enableAll",
			"disableAll",
			"generateAccessToken",
			"enableAllAdmin",
			"disableAllAdmin",
			"permissionsLabels"
		],
		"order": [
			"generateAccessToken",
			"name",
			"permission",
			"disableAll",
			"enableAll",
			"disableAllAdmin",
			"enableAllAdmin",
			"permissionsLabels",
			"adminPermission"
		],
		"edits": [
			{
				"start": 863,
				"end": 863,
				"current": "",
				"baseline": "\n\t\t\t\t:labels=\"copyLocaleDictionary(globalLocale.env._permissions)\" :disableAllText=\"globalLocale.env.disableAll\" :enableAllText=\"globalLocale.env.enableAll\"\n\t\t\t\t:disableAllAdminText=\"globalLocale.env.disableAllAdmin\" :enableAllAdminText=\"globalLocale.env.enableAllAdmin\" :adminPermissionText=\"globalLocale.env.adminPermission\""
			},
			{
				"start": 945,
				"end": 981,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1040,
				"end": 1040,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1405,
				"end": 1405,
				"current": "",
				"baseline": "copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';\nimport { "
			},
			{
				"start": 1451,
				"end": 1509,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/admin/bot-protection.vue",
		"currentSha256": "85f90d05a79b27eec96e4f9e54d351bd6c553baa492a85f22fca9c6ae683ef84",
		"baselineSha256": "5760426b24bc3d8a0b2a1ea46b7fb49634da82a64deeb074acde35b908fabf6b",
		"keys": [
			"none"
		],
		"order": [
			"botProtection",
			"none",
			"notRecommended",
			"hcaptchaSiteKey",
			"hcaptchaSecretKey",
			"captchaVerify",
			"captchaTestSiteKeyMessage",
			"mcaptchaSiteKey",
			"mcaptchaSecretKey",
			"mcaptchaInstanceUrl",
			"recaptchaSiteKey",
			"recaptchaSecretKey",
			"turnstileSiteKey",
			"turnstileSecretKey",
			"testCaptchaWarning",
			"captchaErrorRequestFailedTitle",
			"captchaErrorRequestFailedText",
			"captchaErrorVerificationFailedTitle",
			"captchaErrorVerificationFailedText",
			"captchaErrorUnknownTitle",
			"captchaErrorUnknownText"
		],
		"edits": [
			{
				"start": 6923,
				"end": 6959,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 7018,
				"end": 7018,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 7896,
				"end": 7954,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/admin/invites.vue",
		"currentSha256": "da3f9cf9f398401392c4b44c0874b3da6c60e1f1370552bf9b1f332cacbcc9cc",
		"baselineSha256": "1032324f77bd3d24f197477828485a4a1f40c36210903fe903a98abf24fefbb1",
		"keys": [
			"all",
			"create",
			"invite",
			"createdAt"
		],
		"order": [
			"all",
			"unused",
			"used",
			"expired",
			"createdAt",
			"ascendingOrder",
			"descendingOrder",
			"usedAt",
			"inviteCodeCreated",
			"invite",
			"createInviteCode",
			"noExpirationDate",
			"expirationDate",
			"createCount",
			"create",
			"state",
			"sort"
		],
		"edits": [
			{
				"start": 1654,
				"end": 1690,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1749,
				"end": 1749,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2703,
				"end": 2761,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/auth.form.vue",
		"currentSha256": "ddb681326b1e2f00d3f5cfcaa638848f0e71915976ce81635ebce1d13227acb4",
		"baselineSha256": "8a39620c5410146d90c720df4518695894cba8dfa2231d4ae61381bb8c12c54c",
		"keys": [
			"cancel",
			"accept",
			"permissionsLabels"
		],
		"order": [
			"authPermission",
			"permissionsLabels",
			"authShareAccess",
			"cancel",
			"accept"
		],
		"edits": [
			{
				"start": 737,
				"end": 773,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 832,
				"end": 832,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1248,
				"end": 1306,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/auth.vue",
		"currentSha256": "e56abe80ecc91bdf3d700b3e9865be1dea20423a7dd5bebef9c9d34e15e829f4",
		"baselineSha256": "beb2072811e658ccade5c93cafa794aab61b1f564d6766443988d3e70b8b63c4",
		"keys": [
			"somethingHappened"
		],
		"order": [
			"somethingHappened",
			"denied",
			"alreadyAuthorized",
			"accepted",
			"callback",
			"pleaseGoBack",
			"pleaseLogin",
			"shareAccessTitle"
		],
		"edits": [
			{
				"start": 1183,
				"end": 1219,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1278,
				"end": 1278,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1757,
				"end": 1815,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/invite.vue",
		"currentSha256": "c457fcf609527805658c3eeae4ec3cc3b6122f45d9547abf12337306d9280560",
		"baselineSha256": "0c7c224e7d671f76ac170d1650eaa76383d458ca26a630668e0a5d5dc4703a84",
		"keys": [
			"invite"
		],
		"order": [
			"minute",
			"hour",
			"day",
			"inviteCodeCreated",
			"invite",
			"inviteLimitResetCycle",
			"createInviteCode",
			"createLimitRemaining"
		],
		"edits": [
			{
				"start": 1246,
				"end": 1282,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1341,
				"end": 1341,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2146,
				"end": 2204,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/reset-password.vue",
		"currentSha256": "6d72fb7439b9f21333e5b05bd7cd08758e5df88535958a9515f073912b8c30d2",
		"baselineSha256": "21c9838538962a0d8035a08362af9d5572b6155a90e18d3f454e0d856527dffd",
		"keys": [
			"save"
		],
		"order": [
			"newPassword",
			"save",
			"resetPassword"
		],
		"edits": [
			{
				"start": 647,
				"end": 683,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 742,
				"end": 742,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1138,
				"end": 1196,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/settings/2fa.qrdialog.vue",
		"currentSha256": "3ab3257bc3853b1f81089e61e052d2b792d4f500f94eadbd4b0a1d924f2e0a6e",
		"baselineSha256": "1fbfe1551acb011d45077e483b5b7980b94b430be924f8c7e27b15e853d3aaab",
		"keys": [
			"cancel",
			"continue",
			"done",
			"download",
			"goBack"
		],
		"order": [
			"setupOf2fa",
			"twoFactorMoreDetailedGuideHere",
			"twoFactorStep1",
			"twoFactorStep2",
			"launchApp",
			"twoFactorStep2Uri",
			"cancel",
			"continue",
			"twoFactorStep3Title",
			"twoFactorStep3",
			"goBack",
			"twoFactorSetupCompleted",
			"twoFactorStep4",
			"twoFactorCheckBackupCodesBeforeCloseThisWizard",
			"twoFactorBackupCodes",
			"twoFactorBackupCodesDescription",
			"download",
			"done"
		],
		"edits": [
			{
				"start": 4520,
				"end": 4556,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 4615,
				"end": 4615,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 5574,
				"end": 5632,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/settings/2fa.vue",
		"currentSha256": "9063cfa38e152ed9fa181f21616961b13ad023612f0053b07adc72995fa112a0",
		"baselineSha256": "27c6f44fce8b2b8e8d05629bb00f8431cab3e7ea3b28d5a8b0cd2c903c24c068",
		"keys": [
			"learnMore",
			"rename"
		],
		"order": [
			"2faBackupCodeUsedWarning",
			"2faBackupCodesExhaustedWarning",
			"totp",
			"totpDescription",
			"2faAlreadyRegistered",
			"2faRenewTOTP",
			"2faWhyTOTPOnlyRenew",
			"unregister",
			"2faRegisterTOTP",
			"learnMore",
			"securityKeyAndPasskey",
			"2faSecurityKeyInfo",
			"2faSecurityKeyNotSupported",
			"2faRegisterTOTPBeforeKey",
			"2faRegisterSecurityKey",
			"lastUsedAt",
			"rename",
			"passwordLessLogin",
			"passwordLessLoginDescription",
			"2faRenewTOTPConfirm",
			"2faRenewTOTPOk",
			"2faRenewTOTPCancel",
			"2faRemoveKey",
			"2faRemoveKeyConfirm",
			"2faSecurityKeyName",
			"2faTapSecurityKey",
			"2fa"
		],
		"edits": [
			{
				"start": 3856,
				"end": 3892,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3951,
				"end": 3951,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4836,
				"end": 4894,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/settings/accounts.vue",
		"currentSha256": "5afb1ff008e96ccb30f58792aea9eb69ec202cf24a80237f6858bb12f4d47c2d",
		"baselineSha256": "b7a1ea8c65613114118ba1baa1182c396b7dd5976dfcbb4f08120ba75935288a",
		"keys": [
			"remove"
		],
		"order": [
			"accounts",
			"addAccount",
			"switch",
			"remove",
			"existingAccount",
			"createAccount"
		],
		"edits": [
			{
				"start": 737,
				"end": 773,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 832,
				"end": 832,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1617,
				"end": 1675,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/settings/apps.vue",
		"currentSha256": "9c034971172eb5ea4ac96fab0464f7cd6a1c4cb4a173521de8157d51613333bd",
		"baselineSha256": "ff21ef25f6d281d99d18339133d080a3f55cddb4e86c9ed5b76aa8f46c0f8664",
		"keys": [
			"delete",
			"none",
			"permission",
			"permissionsLabels"
		],
		"order": [
			"delete",
			"installedDate",
			"lastUsedDate",
			"permission",
			"none",
			"permissionsLabels",
			"installedApps"
		],
		"edits": [
			{
				"start": 1971,
				"end": 2007,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2066,
				"end": 2066,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2751,
				"end": 2809,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/settings/connect.vue",
		"currentSha256": "cb35ffca8efbd36c1a9cda11b1033ceca2d222172dc678e462334a34aee30737",
		"baselineSha256": "d2e031de7854a1707a347f36b5f3b2104c2b8aa6f377f1bf19737e1d988eb3ed",
		"keys": [
			"generateAccessToken"
		],
		"order": [
			"accessToken",
			"serviceConnection",
			"serviceConnectionBanner",
			"api",
			"generateAccessToken",
			"manageAccessTokens",
			"webhook",
			"createWebhook",
			"manage"
		],
		"edits": [
			{
				"start": 2475,
				"end": 2511,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2570,
				"end": 2570,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3355,
				"end": 3413,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/signup-complete.vue",
		"currentSha256": "911d049994ff1f52a66edefa663b1515c4f666b4d92703c2e8f594f23b415a5b",
		"baselineSha256": "8d088996d45d2faab79ccc570a897977fa2cb1fbe8186627358f7a42d02205a8",
		"keys": [
			"somethingHappened",
			"gotIt",
			"processing"
		],
		"order": [
			"somethingHappened",
			"emailVerificationFailedError",
			"clickToFinishEmailVerification",
			"gotIt",
			"processing"
		],
		"edits": [
			{
				"start": 849,
				"end": 885,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 944,
				"end": 944,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1335,
				"end": 1393,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/auth/frontend/pages/verify-email.vue",
		"currentSha256": "26677e6bc91f1c3964565ceea408d9bf4e5f4b31bb72e3f5663cd0d4d1641f26",
		"baselineSha256": "5cb03f5a1d5e0cf28eb1d5203fc68c669b41806cebf2b833dbcf7226fac6e695",
		"keys": [
			"somethingHappened",
			"gotIt",
			"processing"
		],
		"order": [
			"somethingHappened",
			"emailVerificationFailedError",
			"clickToFinishEmailVerification",
			"gotIt",
			"processing",
			"emailVerified",
			"goToMisskey"
		],
		"edits": [
			{
				"start": 1483,
				"end": 1519,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1578,
				"end": 1578,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1908,
				"end": 1966,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/avatar-decorations/frontend/pages/avatar-decoration-edit-dialog.vue",
		"currentSha256": "796fa7f4557653fd75f54c1627e660d777a64d46bebdfdb7328a6c706ce9cbef",
		"baselineSha256": "9320aa48a96c0d534ff36c32bdbe50e65d1fae09f28c181a137eaf5ed7ad7e0f",
		"keys": [
			"delete",
			"name",
			"description",
			"all",
			"add",
			"create",
			"update",
			"removeAreYouSure",
			"imageUrl"
		],
		"order": [
			"removeAreYouSure",
			"name",
			"imageUrl",
			"category",
			"description",
			"availableRoles",
			"all",
			"add",
			"delete",
			"update",
			"create"
		],
		"edits": [
			{
				"start": 2835,
				"end": 2871,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2930,
				"end": 2930,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3894,
				"end": 3952,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/avatar-decorations/frontend/pages/avatar-decorations.vue",
		"currentSha256": "486c783480466d64191224ded9b7cc081276e13b1bab9556debe9496223add73",
		"baselineSha256": "2086989a64273520f4e75134866e708d9564d7856e661cff48913b1aa9576715",
		"keys": [
			"add"
		],
		"order": [
			"other",
			"add",
			"avatarDecorations"
		],
		"edits": [
			{
				"start": 1045,
				"end": 1081,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1140,
				"end": 1140,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1697,
				"end": 1755,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/avatar-decorations/frontend/pages/settings/avatar-decoration.dialog.vue",
		"currentSha256": "c4ef5577b75107d60866b95300659a860b45244b429930120e6cc6ecdf0356d8",
		"baselineSha256": "9045ea39c6917ebf31ebb3f3cb8d964b61f5aae7bc08965642879ea68edbe789",
		"keys": [
			"update"
		],
		"order": [
			"avatarDecorations",
			"angle",
			"position",
			"flip",
			"update",
			"detach",
			"attach"
		],
		"edits": [
			{
				"start": 1938,
				"end": 1974,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2033,
				"end": 2033,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2434,
				"end": 2492,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/avatar-decorations/frontend/pages/settings/avatar-decoration.vue",
		"currentSha256": "dbbfb4f176f619bee3f3a5c87f7bd72c1e945974e0c3e0a2191cd5a1a5d04c2c",
		"baselineSha256": "2b8d8bd653a6587ce15de0903f8149ecde1d9c4c8a205b07c33ce797870575f9",
		"keys": [
			"areYouSure"
		],
		"order": [
			"avatarDecorations",
			"avatarDecorationMax",
			"remainingN",
			"inUse",
			"detachAll",
			"other",
			"areYouSure"
		],
		"edits": [
			{
				"start": 1899,
				"end": 1935,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1994,
				"end": 1994,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2905,
				"end": 2963,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/boot/frontend/components/MkServerSetupWizard.vue",
		"currentSha256": "2d91f7c1ef38a34b116946f023d3c46d2f5015c4044feab13d1062c111de7cbe",
		"baselineSha256": "6a7bfc05835a1e8c432d5eda06fd3e390b40e0768230d49e78fab1e86449b9da",
		"keys": [
			"all",
			"yes",
			"no",
			"learnMore"
		],
		"order": [
			"instanceName",
			"howWillYouUseMisskey",
			"single",
			"single_description",
			"group",
			"group_description",
			"open",
			"open_description",
			"single_youCanCreateMultipleAccounts",
			"advice",
			"openServerAdvice",
			"openServerAntiSpamAdvice",
			"howManyUsersDoYouExpect",
			"small",
			"medium",
			"large",
			"largeScaleServerAdvice",
			"doYouConnectToFediverse",
			"doYouConnectToFediverse_description1",
			"doYouConnectToFediverse_description2",
			"learnMore",
			"yes",
			"no",
			"youCanConfigureMoreFederationSettingsLater",
			"remoteContentsCleaning",
			"remoteContentsCleaning_description",
			"adminInfo",
			"adminInfo_description",
			"adminInfo_mustBeFilled",
			"maintainerName",
			"maintainerEmail",
			"followingSettingsAreRecommended",
			"singleUserMode",
			"openRegistration",
			"emailRequiredForSignup",
			"federation",
			"all",
			"remoteNotesCleaning",
			"fanoutTimelineDbFallback",
			"entrancePageStyle",
			"baseRole",
			"rateLimitFactor",
			"driveCapacity",
			"userListMax",
			"antennaMax",
			"webhookMax",
			"canImportFollowing",
			"canImportMuting",
			"canImportBlocking",
			"canImportUserLists",
			"canImportAntennas",
			"applyTheseSettings"
		],
		"edits": [
			{
				"start": 7570,
				"end": 7606,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 7665,
				"end": 7665,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 8355,
				"end": 8413,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/boot/frontend/components/MkUpdated.vue",
		"currentSha256": "75db506b37ced0fdf4eab0b723a2f1aa795011480062acd8e86a964040ed86fb",
		"baselineSha256": "c7a1599fcc395015d012d5908575e9ab15b64f5878c7836df388e2b6c7e23992",
		"keys": [
			"gotIt"
		],
		"order": [
			"misskeyUpdated",
			"thankYouForTestingBeta",
			"whatIsNew",
			"gotIt"
		],
		"edits": [
			{
				"start": 736,
				"end": 772,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 831,
				"end": 831,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1227,
				"end": 1285,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/boot/frontend/pages/welcome.setup.vue",
		"currentSha256": "5e1be9f2d70d791ecd21720dc71b91feca7deb5ea9127e6658850427b67c4fbc",
		"baselineSha256": "fe0288a83b7d0eb29ee74dbe96b0116a60042bb2601cd154c0dae45932a440d6",
		"keys": [
			"somethingHappened",
			"next",
			"learnMore",
			"processing"
		],
		"order": [
			"somethingHappened",
			"permissionDeniedError",
			"operationForbidden",
			"incorrectPassword",
			"installCompleted",
			"firstCreateAccount",
			"initialPasswordForSetup",
			"initialPasswordForSetupDescription",
			"username",
			"usernameInfo",
			"password",
			"processing",
			"next",
			"accountCreated",
			"serverSetting",
			"youCanEasilyConfigureOptimalServerSettingsWithThisWizard",
			"settingsYouMakeHereCanBeChangedLater",
			"skipSettings",
			"settingsCompleted",
			"settingsCompleted_description",
			"settingsCompleted_description2",
			"donationRequest",
			"text1",
			"text2",
			"text3",
			"learnMore",
			"start"
		],
		"expanded": true,
		"edits": [
			{
				"start": 5621,
				"end": 5621,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 6227,
				"end": 6285,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/boot/frontend/ts-messages.vue",
		"currentSha256": "19860c6222113f5628acde2a6f5eb9debf6eb36f8d5f05b91805b7440b1694f2",
		"baselineSha256": "0558ed96ffe2aad54482c247b8ed6f8c630b115595c9b81526ddd56b4a4ccdf5",
		"keys": [
			"reload"
		],
		"order": [
			"_bootErrors",
			"reload",
			"_selfXssPrevention",
			"accountDeletionInProgress",
			"disconnectedFromServer",
			"reloadConfirm",
			"switchDarkModeManuallyWhenSyncEnabledConfirm",
			"syncDeviceDarkMode"
		],
		"edits": [
			{
				"start": 97,
				"end": 295,
				"current": ">\n\n\n<script setup lang=\"ts\">\nimport type { Locale } from 'i18n';\nimport { useLocale } from 'virtual:vite-vue-internationalization';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n</script",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/boot/frontend/ui/_common_/ReloadSuggestion.vue",
		"currentSha256": "b5734e083340ea9c5df524fe4d49e08e55e9ced0fa9c20189b121e35e9a8c876",
		"baselineSha256": "3b696ffa950dfaadb38f20cd7ee91d575845f6f9b2490627dfc9dee64d28f763",
		"keys": [
			"reload"
		],
		"order": [
			"reloadRequiredToApplySettings",
			"reload",
			"skip"
		],
		"edits": [
			{
				"start": 628,
				"end": 664,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 723,
				"end": 723,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 895,
				"end": 953,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/components/MkChannelFollowButton.vue",
		"currentSha256": "108955085abab9c6a908eb551886d4f43c803f4e1b58dddb2a61e4ca608aa213",
		"baselineSha256": "76c1c808ef2dc710aeafe8a34a90188291b223360f9a85ad7320361b2ef63ddb",
		"keys": [
			"processing",
			"follow"
		],
		"order": [
			"unfollow",
			"follow",
			"processing"
		],
		"edits": [
			{
				"start": 792,
				"end": 828,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 887,
				"end": 887,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1028,
				"end": 1086,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/components/MkChannelPreview.vue",
		"currentSha256": "b445e868ad086e92c475ef94653d6245dd5b1fdb3e163371735c5a17ea3579d8",
		"baselineSha256": "7b2ae479a0b56a22da2f2969265a07707ff03bbd7f7e1279de3f13ecd361a9e5",
		"keys": [
			"sensitive",
			"updatedAt"
		],
		"order": [
			"sensitive",
			"usersCount",
			"notesCount",
			"youAreAdmin",
			"updatedAt"
		],
		"edits": [
			{
				"start": 1789,
				"end": 1825,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1884,
				"end": 1884,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2099,
				"end": 2157,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/pages/channel-editor.vue",
		"currentSha256": "a9d8e2e7d269c1f9d355003e59bb4d4498040f75c55a475d21a1f73fb7ce8bd2",
		"baselineSha256": "492e8cdc1d3a33eade0aa59001dda94ab0f351d27b3190aa2121f5cb298d3d6e",
		"keys": [
			"save",
			"name",
			"description",
			"create",
			"sensitive"
		],
		"order": [
			"name",
			"description",
			"color",
			"sensitive",
			"channelAllowRenoteToExternal",
			"channelSetBanner",
			"channelRemoveBanner",
			"pinnedNotes",
			"save",
			"create",
			"archive",
			"noteIdOrUrl",
			"channelArchiveConfirmTitle",
			"channelArchiveConfirmDescription",
			"channelEdit",
			"channelCreate"
		],
		"edits": [
			{
				"start": 2572,
				"end": 2608,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2667,
				"end": 2667,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3698,
				"end": 3756,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/pages/channel.vue",
		"currentSha256": "2eb2b1cb52f54934d84de12cc7ed8dfe2df47f91786584aae67c5d440cdc880b",
		"baselineSha256": "c081657742fe47caf88fce524c7b3c3fde840df0b2c42f2ad7f230ec85d458d0",
		"keys": [
			"search",
			"edit",
			"share",
			"copyUrl",
			"sensitive",
			"timeline",
			"overview",
			"oneDay",
			"oneHour",
			"oneWeek",
			"indefinitely",
			"favorite",
			"unfavorite",
			"mute",
			"channel"
		],
		"order": [
			"unfavorite",
			"favorite",
			"channelUsersCount",
			"channelNotesCount",
			"youAreAdmin",
			"sensitive",
			"pinnedNotes",
			"thisChannelArchived",
			"search",
			"notesSearchNotAvailable",
			"postToTheChannel",
			"unfavoriteConfirm",
			"mutePeriod",
			"indefinitely",
			"tenMinutes",
			"oneHour",
			"oneDay",
			"oneWeek",
			"copyUrl",
			"share",
			"mute",
			"unmute",
			"edit",
			"overview",
			"timeline",
			"featured",
			"channel"
		],
		"edits": [
			{
				"start": 3874,
				"end": 3910,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3969,
				"end": 3969,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 6014,
				"end": 6072,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/pages/channels.vue",
		"currentSha256": "9605931c0b96ad9241bb9d4903e3a01073698e7a9ac49aae3535cc8770d0b700",
		"baselineSha256": "52c58c290e4b67682b4c3e06ec86b41ec5fc93e9a0aca9a82213cb040791c52a",
		"keys": [
			"search",
			"favorites",
			"createNew",
			"channel"
		],
		"order": [
			"search",
			"featured",
			"favorites",
			"following",
			"owned",
			"channel",
			"nameAndDescription",
			"nameOnly",
			"searchResult",
			"createNew"
		],
		"expanded": true,
		"edits": [
			{
				"start": 2491,
				"end": 2491,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 3370,
				"end": 3428,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/ts-messages.vue",
		"currentSha256": "d8bea47091716227e3dd789f8cd1d5b430aeec04df6f102f569307183dc7c263",
		"baselineSha256": "c5288aee1e22fa264343e1ea84c3af20bfba431e7c25a907fec07885b5ddc681",
		"keys": [
			"follow"
		],
		"order": [
			"follow",
			"unfollow"
		],
		"edits": [
			{
				"start": 97,
				"end": 295,
				"current": ">\n\n\n<script setup lang=\"ts\">\nimport type { Locale } from 'i18n';\nimport { useLocale } from 'virtual:vite-vue-internationalization';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n</script",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/pages/chat/XMessage.vue",
		"currentSha256": "110f539bb610b55d846352ba6589c5c260c8c433690f30407779e7161cc640ee",
		"baselineSha256": "af8c9fbafba7db1791edf98d12aab6998d8971d72be19deed67ae2cc8a034125",
		"keys": [
			"delete"
		],
		"order": [
			"reaction",
			"copyContent",
			"delete",
			"reportAbuse"
		],
		"expanded": true,
		"edits": [
			{
				"start": 2750,
				"end": 2750,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 4245,
				"end": 4303,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/pages/chat/home.home.vue",
		"currentSha256": "033c6f694127c3b6001ee033e0b50be8142f60a2a6dd59579209ae7fe7613515",
		"baselineSha256": "47d17c6d2dfe97c0d7e28ce471ec851c64c52ea307f572900b4c2f92b1aae658",
		"keys": [
			"search",
			"name"
		],
		"order": [
			"individualChat",
			"individualChat_description",
			"roomChat",
			"roomChat_description",
			"createRoom",
			"name",
			"startChat",
			"chatIsReadOnlyForThisAccountOrServer",
			"chatNotAvailableForThisAccountOrServer",
			"searchMessages",
			"search",
			"searchResult",
			"history"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1432,
				"end": 1432,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 2401,
				"end": 2459,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/pages/chat/room.info.vue",
		"currentSha256": "32f0851cd5f403c9fc0300f14aa32295ee752dc7d9631b3741e22c19e87a1a73",
		"baselineSha256": "b187fae03df3db2a372fb484e2ab138f43a85b59390fd609f5497bc14a1a2029",
		"keys": [
			"save",
			"name",
			"description",
			"deleteAreYouSure"
		],
		"order": [
			"name",
			"description",
			"save",
			"deleteRoom",
			"muteThisRoom",
			"deleteAreYouSure"
		],
		"edits": [
			{
				"start": 777,
				"end": 813,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 872,
				"end": 872,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1417,
				"end": 1475,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/pages/chat/room.search.vue",
		"currentSha256": "cc7e4fe05ec107f7c82901527ffa96cdeedb908914d7ec810e56c522023c2752",
		"baselineSha256": "f7b2fd005a99324818397f6b74c78580d29d3f1fe607729c0ca353b12013507c",
		"keys": [
			"search"
		],
		"order": [
			"searchMessages",
			"search",
			"searchResult"
		],
		"edits": [
			{
				"start": 868,
				"end": 904,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 963,
				"end": 963,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1402,
				"end": 1460,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/pages/chat/room.vue",
		"currentSha256": "fecbaababc5ed72ec3c0123bafba62f2646075ae834611df1840182dfee07a3b",
		"baselineSha256": "9693b25b97a6fff6ee8cabfc53e38e312fbfcd0be5e33418e98b6552bbdda003",
		"keys": [
			"search",
			"somethingHappened",
			"areYouSure",
			"info"
		],
		"order": [
			"somethingHappened",
			"youAreNotAMemberOfThisRoomButInvited",
			"doYouAcceptInvitation",
			"areYouSure",
			"inviteUser",
			"leave",
			"messages",
			"members",
			"search",
			"info",
			"directMessage",
			"noMessagesYet",
			"thisUserAllowsChatOnlyFromFollowers",
			"thisUserAllowsChatOnlyFromFollowing",
			"thisUserAllowsChatOnlyFromMutualFollowing",
			"thisUserNotAllowedChatAnyone",
			"inviteUserToChat",
			"loadMore",
			"chatNotAvailableInOtherAccount",
			"chatIsReadOnlyForThisAccountOrServer",
			"chatNotAvailableForThisAccountOrServer",
			"newMessage"
		],
		"expanded": true,
		"edits": [
			{
				"start": 368,
				"end": 434,
				"current": ">\n\n\t\t\t<MkResult v-else-if=\"fetchError != null\" :type=\"fetchError\"/",
				"baseline": ""
			},
			{
				"start": 3890,
				"end": 3890,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 5537,
				"end": 5595,
				"current": "globalLocale = useLocale<Locale>(import.meta.url);\n\nconst ",
				"baseline": ""
			},
			{
				"start": 6038,
				"end": 6097,
				"current": ");\nconst fetchError = ref<'notFound' | 'error' | null>(null",
				"baseline": ""
			},
			{
				"start": 7551,
				"end": 7752,
				"current": "function toFetchError(err: unknown): 'notFound' | 'error' {\n\tconst code = (err as { code?: string } | null)?.code;\n\treturn code === 'NO_SUCH_ROOM' || code === 'NO_SUCH_USER' ? 'notFound' : 'error';\n}\n\n",
				"baseline": ""
			},
			{
				"start": 7892,
				"end": 7918,
				"current": "\tfetchError.value = null;\n",
				"baseline": ""
			},
			{
				"start": 7948,
				"end": 7951,
				"current": "res",
				"baseline": "["
			},
			{
				"start": 7952,
				"end": 7954,
				"current": "lt",
				"baseline": ", m]"
			},
			{
				"start": 8122,
				"end": 8296,
				"current": ".catch(err => {\n\t\t\tfetchError.value = toFetchError(err);\n\t\t\treturn null;\n\t\t});\n\n\t\tif (result == null) {\n\t\t\tinitializing.value = false;\n\t\t\treturn;\n\t\t}\n\n\t\tconst [u, m] = result",
				"baseline": ""
			},
			{
				"start": 8992,
				"end": 8993,
				"current": "f",
				"baseline": "os.al"
			},
			{
				"start": 8994,
				"end": 8994,
				"current": "",
				"baseline": "r"
			},
			{
				"start": 8995,
				"end": 8998,
				"current": "chE",
				"baseline": "({\n\t\t\t\ttype: 'e"
			},
			{
				"start": 9002,
				"end": 9002,
				"current": "",
				"baseline": "',\n\t\t\t\ttext: globalLocale"
			},
			{
				"start": 9008,
				"end": 9012,
				"current": " = t",
				"baseline": ".env.s"
			},
			{
				"start": 9013,
				"end": 9014,
				"current": "F",
				"baseline": "m"
			},
			{
				"start": 9016,
				"end": 9017,
				"current": "c",
				"baseline": ""
			},
			{
				"start": 9018,
				"end": 9026,
				"current": "Error(rR",
				"baseline": "ingHapp"
			},
			{
				"start": 9027,
				"end": 9033,
				"current": "sult.r",
				"baseline": "n"
			},
			{
				"start": 9034,
				"end": 9038,
				"current": "ason",
				"baseline": "d,\n\t\t\t}"
			},
			{
				"start": 9635,
				"end": 9637,
				"current": "//",
				"baseline": "const"
			},
			{
				"start": 9638,
				"end": 9683,
				"current": "ルーム情報は取れても、タイムラインの取得だけ失敗することがある（通信エラーなど）\n\t\tif",
				"baseline": "m"
			},
			{
				"start": 9684,
				"end": 9685,
				"current": "(",
				"baseline": "= "
			},
			{
				"start": 9705,
				"end": 9711,
				"current": "reject",
				"baseline": "fulfill"
			},
			{
				"start": 9714,
				"end": 9715,
				"current": ")",
				"baseline": ""
			},
			{
				"start": 9716,
				"end": 9828,
				"current": "{\n\t\t\tfetchError.value = toFetchError(mResult.reason);\n\t\t\tinitializing.value = false;\n\t\t\treturn;\n\t\t}\n\n\t\tconst m =",
				"baseline": "?"
			},
			{
				"start": 9895,
				"end": 9895,
				"current": "",
				"baseline": " : []"
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/components/MkClipPreview.vue",
		"currentSha256": "519a64d22159c437529b76e4406fa4d44d6686d4c4fc033994478f5f846eb02b",
		"baselineSha256": "8ee65f3ffadce9e4827b01f3c4250479a8edae62fe21ad078cf14fe05b9a5acb",
		"keys": [
			"updatedAt"
		],
		"order": [
			"updatedAt",
			"notesCount",
			"remainingN",
			"unknown"
		],
		"edits": [
			{
				"start": 1000,
				"end": 1036,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1095,
				"end": 1095,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1278,
				"end": 1336,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/embed/pages/clip.vue",
		"currentSha256": "268422e83701ae986b619c002bbab6dcfd76dddded916df852587d3944dc8ec4",
		"baselineSha256": "bef75ab46370764ab708a5d0082349b4e875a0f1139caf92ce0c735dc2c47585",
		"keys": [
			"fromX"
		],
		"order": [
			"fromX"
		],
		"edits": [
			{
				"start": 1135,
				"end": 1171,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1230,
				"end": 1230,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2294,
				"end": 2352,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/clip.vue",
		"currentSha256": "f8f19e459d1f11f8e6d1d2873f7ba0671c2affb459faa06ef5360b20e4f3f9b1",
		"baselineSha256": "0b55e9b6cddb4dca1bc1091919a2d5739d64768c4136fc4688a9814b172b1e4c",
		"keys": [
			"delete",
			"edit",
			"name",
			"description",
			"share",
			"copyUrl",
			"embed",
			"public",
			"clip",
			"deleteAreYouSure",
			"favorite",
			"unfavorite"
		],
		"order": [
			"noDescription",
			"unfavorite",
			"favorite",
			"unfavoriteConfirm",
			"edit",
			"name",
			"description",
			"public",
			"share",
			"copyUrl",
			"embed",
			"delete",
			"deleteAreYouSure",
			"clip"
		],
		"edits": [
			{
				"start": 1314,
				"end": 1350,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1409,
				"end": 1409,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2743,
				"end": 2801,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/favorites.vue",
		"currentSha256": "6c196fdea0631aade683d4ce3eb1199e6171108ba2498a46469f312e2bcb0075",
		"baselineSha256": "ec5861c581eccdc16955237c01c9386b423aa5e9647464a75da40bb98587ba65",
		"keys": [
			"favorites"
		],
		"order": [
			"noNotes",
			"favorites"
		],
		"edits": [
			{
				"start": 535,
				"end": 571,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 630,
				"end": 630,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 947,
				"end": 1005,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/gallery/edit.root.vue",
		"currentSha256": "af6a8393dbe395b6ab3e81b7b63b4ece55c55bd2c91d926fee99340121479ef2",
		"baselineSha256": "53fe5b78ff387ba19e7de58d01e6c3bab36a237b5c7efc260857547b89ddf845",
		"keys": [
			"save",
			"delete",
			"title",
			"description",
			"remove",
			"markAsSensitive"
		],
		"order": [
			"deleteConfirm",
			"title",
			"description",
			"remove",
			"attachFile",
			"markAsSensitive",
			"save",
			"publish",
			"delete"
		],
		"edits": [
			{
				"start": 1627,
				"end": 1627,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 2258,
				"end": 2316,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/gallery/edit.vue",
		"currentSha256": "729ccd6beb61c531df81926c78afed602ced497b4e867fcaee790b862fbace08",
		"baselineSha256": "2fa197c472279f8921fe501428f1ec907aa3603ba87185a3673e3b9309000d12",
		"keys": [
			"edit"
		],
		"order": [
			"edit",
			"postToGallery"
		],
		"edits": [
			{
				"start": 241,
				"end": 277,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 336,
				"end": 336,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 625,
				"end": 683,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/gallery/index.vue",
		"currentSha256": "33af14e01aa54f50af586e9e1f91881cced6808c530b75d3ae774ad7de5984da",
		"baselineSha256": "0d3eb4d4695b59a61ae7cc2d3e01628cc7567b688f70230c716467c330ba70f6",
		"keys": [
			"create"
		],
		"order": [
			"recentPosts",
			"popularPosts",
			"postToGallery",
			"create",
			"gallery",
			"liked",
			"my"
		],
		"edits": [
			{
				"start": 1798,
				"end": 1834,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1893,
				"end": 1893,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2423,
				"end": 2481,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/gallery/post.vue",
		"currentSha256": "64268c6c88ab4851d03215b6cac16e4b3844a4d1bc8c1c754efa36b81ada2b36",
		"baselineSha256": "d103fab6b961758083b7d2977ce5b9884b3111bff0724f8177e20c4bae2d586f",
		"keys": [
			"delete",
			"edit",
			"share"
		],
		"order": [
			"unlikeConfirm",
			"reportAbuse",
			"delete",
			"deleteConfirm",
			"gallery",
			"unlike",
			"like",
			"edit",
			"shareWithNote",
			"copyLink",
			"share",
			"recentPosts"
		],
		"expanded": true,
		"edits": [
			{
				"start": 3370,
				"end": 3370,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 4673,
				"end": 4731,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/my-clips/index.vue",
		"currentSha256": "c1a9a453e3f4195dbafa3f5f39ca1fba3e5634463e40160fd681a10eb445a995",
		"baselineSha256": "470b9ee28d6c483568060a3f6b5b3c42f2cee98f2e2f4c3cd4bc103f6e3807bd",
		"keys": [
			"favorites",
			"name",
			"description",
			"add",
			"public",
			"clip"
		],
		"order": [
			"createNewClip",
			"name",
			"description",
			"public",
			"myClips",
			"favorites",
			"clip",
			"tip",
			"add"
		],
		"edits": [
			{
				"start": 1015,
				"end": 1051,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1110,
				"end": 1110,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1695,
				"end": 1753,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/ui/deck/clip-column.vue",
		"currentSha256": "ddd43bb836c24e5de21a6cbbbaca1ac2c8bdc17c7d71c43bbdf58314b065769c",
		"baselineSha256": "7d3ca912e4566dd45f49696ce37a893a34978a22bd8e121d2f412c170976c51e",
		"keys": [
			"favorites",
			"clips",
			"clip",
			"show"
		],
		"order": [
			"clip",
			"selectClip",
			"clips",
			"favorites",
			"show"
		],
		"edits": [
			{
				"start": 610,
				"end": 646,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 705,
				"end": 705,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1761,
				"end": 1819,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/embed/pages/tag.vue",
		"currentSha256": "b369636d622e360822f972e3326abbd8a3f007922c37e06bff0f276e6f23f078",
		"baselineSha256": "4dff963245be7d7477ffd5b2e4238e7544e393d87a3af5a41e3e8f4956221386",
		"keys": [
			"fromX"
		],
		"order": [
			"fromX"
		],
		"edits": [
			{
				"start": 1119,
				"end": 1155,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1214,
				"end": 1214,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2073,
				"end": 2131,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/explore.featured.vue",
		"currentSha256": "0baa12deb894a2db30f20a817acdfc90a2c8bf40950767be588e16580db6d733",
		"baselineSha256": "24804205cc50fdbde9f7288f3ae63cee7ea9fbfea0f89f7ab5b86d238dd08d75",
		"keys": [
			"notes",
			"poll"
		],
		"order": [
			"notes",
			"poll"
		],
		"edits": [
			{
				"start": 567,
				"end": 603,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 662,
				"end": 662,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 924,
				"end": 982,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/explore.vue",
		"currentSha256": "fbca4e879f26b2d3db6cadc92472f99dadb88a008cdde5180942753a6917553b",
		"baselineSha256": "784146206619f9f127a8db64df6c6684ebdbb4168df2bf82c98241e819ae9629",
		"keys": [
			"users"
		],
		"order": [
			"featured",
			"users",
			"roles",
			"explore"
		],
		"edits": [
			{
				"start": 436,
				"end": 472,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 531,
				"end": 531,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 885,
				"end": 943,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/search.user.vue",
		"currentSha256": "bca7cfa17bc272931d4c43eab86d032f7c5663815470c08d96c40bc22637ef65",
		"baselineSha256": "74355a979c1054c4b433b274248684aed59adc0e64be309f3f756efbcc20ee79",
		"keys": [
			"search",
			"all"
		],
		"order": [
			"lookupConfirm",
			"fetchingAsApObject",
			"openTagPageConfirm",
			"all",
			"local",
			"remote",
			"search",
			"searchResult"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1084,
				"end": 1084,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 1899,
				"end": 1957,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/search.vue",
		"currentSha256": "4f485f18f4cf7d0f30e90deb522cf85da57915a6fed7e6be45d677bfb80d360b",
		"baselineSha256": "ce487aa6c26ce43b65a6fb6c019de2051483b1b3cfbfd233e3b9601c7abde840",
		"keys": [
			"search",
			"notes",
			"users"
		],
		"order": [
			"notesSearchNotAvailable",
			"usersSearchNotAvailable",
			"notes",
			"users",
			"search"
		],
		"edits": [
			{
				"start": 798,
				"end": 834,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 893,
				"end": 893,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1259,
				"end": 1317,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/tag.vue",
		"currentSha256": "c9b8aa42120822c879145ac14ff341dfdfccc1f350ef43e4c533e1802500faa9",
		"baselineSha256": "3a1f2d0bd1457a267fc90d2590d04f15a9eeb4573d4cbd725f060c5af2325cd9",
		"keys": [
			"more",
			"embed"
		],
		"order": [
			"postToHashtag",
			"more",
			"embed"
		],
		"edits": [
			{
				"start": 674,
				"end": 710,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 769,
				"end": 769,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1453,
				"end": 1511,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/ts-messages.vue",
		"currentSha256": "ccd4664d9541dad09dc227d2268eceb053829c79440ad3d268ad00a75d23acc1",
		"baselineSha256": "6b661694590ce365f56408768cde360b938e2b78fb450facf3f3a7d56505c04d",
		"keys": [
			"somethingHappened"
		],
		"order": [
			"lookup",
			"somethingHappened",
			"_remoteLookupErrors",
			"fetchingAsApObject"
		],
		"edits": [
			{
				"start": 97,
				"end": 295,
				"current": ">\n\n\n<script setup lang=\"ts\">\nimport type { Locale } from 'i18n';\nimport { useLocale } from 'virtual:vite-vue-internationalization';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n</script",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkDrive.file.vue",
		"currentSha256": "715ee5514f7a7cf6d70c0292e3f9a8d75b78aa9701634cf11e59119dab934cc2",
		"baselineSha256": "a3757b8af5ab0ac7e4d2e0d03608668357e097d7d4f584d9a6c3d5dffe442383",
		"keys": [
			"sensitive"
		],
		"order": [
			"avatar",
			"banner",
			"sensitive"
		],
		"edits": [
			{
				"start": 1407,
				"end": 1443,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1502,
				"end": 1502,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1998,
				"end": 2056,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkDrive.folder.vue",
		"currentSha256": "5c66acc95863e565c35a4bacc07ed959ab40fe366faf0375c151a8e0e2a87e6e",
		"baselineSha256": "499cf397197d0a3bb34639bbf565c53547b59e10674789246f5e8bff5eb0676b",
		"keys": [
			"delete",
			"somethingHappened",
			"rename"
		],
		"order": [
			"unableToProcess",
			"circularReferenceFolder",
			"somethingHappened",
			"renameFolder",
			"inputNewFolderName",
			"unableToDelete",
			"hasChildFilesOrFolders",
			"openInWindow",
			"rename",
			"move",
			"delete",
			"copyFolderId",
			"uploadFolder"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1516,
				"end": 1516,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 2309,
				"end": 2367,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkDrive.navFolder.vue",
		"currentSha256": "24106a20e42ad8be6f309c0eb4d8a718b424992a11510f36c395ed37d9ffcbf1",
		"baselineSha256": "3b3e9ee89ab2b443bd15ca69396e7f3d9c3fba67ab5771044960e0ca4a9e4c84",
		"keys": [
			"drive"
		],
		"order": [
			"drive"
		],
		"edits": [
			{
				"start": 491,
				"end": 527,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 586,
				"end": 586,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 885,
				"end": 943,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkDrive.vue",
		"currentSha256": "bbc82f02a8a50f7f5951a04d5a77bd4a44a307a35684efaf04400b5a8b3e105b",
		"baselineSha256": "768f5a8ad56451dc23e3cae9630c3de472f345f2d3f1841bb9a500cfb78c8934",
		"keys": [
			"somethingHappened",
			"edit",
			"upload",
			"name",
			"drive"
		],
		"order": [
			"unableToProcess",
			"circularReferenceFolder",
			"somethingHappened",
			"uploadFromUrl",
			"uploadFromUrlDescription",
			"uploadFromUrlRequested",
			"uploadFromUrlMayTakeTime",
			"createFolder",
			"folderName",
			"renameFolder",
			"inputNewFolderName",
			"unableToDelete",
			"hasChildFilesOrFolders",
			"addFile",
			"upload",
			"fromUrl",
			"drive",
			"sort",
			"registeredDate",
			"descendingOrder",
			"ascendingOrder",
			"size",
			"name",
			"deleteFolder",
			"edit",
			"selectFolder",
			"unselectFolder",
			"driveAboutTip",
			"loadMore",
			"dropHereToUpload",
			"emptyDrive",
			"emptyFolder",
			"move"
		],
		"expanded": true,
		"edits": [
			{
				"start": 4071,
				"end": 4129,
				"current": ":isDisabled=\"excludeSensitive && file.isSensitive\"\n\t\t\t\t\t\t\t",
				"baseline": ""
			},
			{
				"start": 5014,
				"end": 5070,
				"current": "\"\n\t\t\t\t\t:isDisabled=\"excludeSensitive && file.isSensitive",
				"baseline": ""
			},
			{
				"start": 6340,
				"end": 6340,
				"current": "",
				"baseline": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 7892,
				"end": 7950,
				"current": "globalLocale = useLocale<Locale>(import.meta.url);\n\nconst ",
				"baseline": ""
			},
			{
				"start": 8114,
				"end": 8143,
				"current": "excludeSensitive?: boolean;\n\t",
				"baseline": ""
			},
			{
				"start": 8255,
				"end": 8281,
				"current": "e: false,\n\texcludeSensitiv",
				"baseline": ""
			},
			{
				"start": 16605,
				"end": 16663,
				"current": "\n\tif (props.excludeSensitive && file.isSensitive) return;\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkDriveWindow.vue",
		"currentSha256": "f9f22e43760d1c8284d33765ca7616fa0305b76e12cbf0841e35698bc33e561c",
		"baselineSha256": "fd9e29b10790f0338013871db2991ea823b862c848827ddc3d616c36bd5cd5df",
		"keys": [
			"drive"
		],
		"order": [
			"drive"
		],
		"edits": [
			{
				"start": 346,
				"end": 382,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 441,
				"end": 441,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 643,
				"end": 701,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkFileListForAdmin.vue",
		"currentSha256": "9c721ee721988fe5ce697ad2d0100b4c76d6ebf6cc29699806fecb9c1f8df8ad",
		"baselineSha256": "a835f007d9f397c6cce7f98d4e88e1f69664c78fc3d3f893aa3ad096d48b8c07",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"system",
			"registeredDate"
		],
		"edits": [
			{
				"start": 1435,
				"end": 1471,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1530,
				"end": 1530,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1948,
				"end": 2006,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkImageEffectorDialog.vue",
		"currentSha256": "8bd3ecf846cac31f1a835cffc63215bc68b16bd7f3d11f67309c08f7d5c58508",
		"baselineSha256": "71943a90d8e68418e0782f70179f94d1ac4507463fad09cb02d73225e29a7417",
		"keys": [
			"preview"
		],
		"order": [
			"discardChangesConfirm",
			"failedToLoadImage",
			"fill",
			"blur",
			"pixelate",
			"title",
			"preview",
			"addEffect"
		],
		"edits": [
			{
				"start": 1791,
				"end": 1827,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1886,
				"end": 1886,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2720,
				"end": 2778,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkImageFrameEditorDialog.vue",
		"currentSha256": "469d0124627ad43db29d0d29fdd65756e590e9c2213b4f5e7e2454db4fc89474",
		"baselineSha256": "af5f8588b01ecfc3ab5ab8099f504706c9fd0b6a6c0ec18f507da6f687809b19",
		"keys": [
			"preview",
			"name",
			"show"
		],
		"order": [
			"quitWithoutSaveConfirm",
			"failedToLoadImage",
			"name",
			"title",
			"preview",
			"borderThickness",
			"backgroundColor",
			"textColor",
			"fontSansSerif",
			"fontSerif",
			"font",
			"header",
			"show",
			"labelThickness",
			"labelScale",
			"centered",
			"captionMain",
			"captionSub",
			"withQrCode",
			"footer",
			"availableVariables",
			"filename",
			"filename_without_ext",
			"caption",
			"year",
			"month",
			"day",
			"hour",
			"minute",
			"second",
			"zeroPadding",
			"camera_model",
			"camera_lens_model",
			"camera_mm",
			"camera_mm_35",
			"camera_f",
			"camera_s",
			"camera_iso",
			"gps_lat",
			"gps_long"
		],
		"edits": [
			{
				"start": 7236,
				"end": 7272,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 7331,
				"end": 7331,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 8673,
				"end": 8731,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkLightbox.item.fileinfo.vue",
		"currentSha256": "1e6eb34b275863598c1b19042656e81d9936f571798c22cde5f47fcd4ccd9941",
		"baselineSha256": "cad17f0c197d073e6622b3a1d965f8f9a550ec601043132e230c31c30890c7c9",
		"keys": [
			"description",
			"none"
		],
		"order": [
			"fileName",
			"description",
			"none"
		],
		"edits": [
			{
				"start": 656,
				"end": 692,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 751,
				"end": 751,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 912,
				"end": 970,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkLightbox.item.vue",
		"currentSha256": "1f0b4c420bcf8a2a56a58dc071f4bbf9eb3060ea32ae343269bb36af1c388732",
		"baselineSha256": "6b146954369cf3a0c5cdeaae585a3726df73907f986df01e548c1e4e18366e5f",
		"keys": [
			"sensitive"
		],
		"order": [
			"image",
			"video",
			"audio",
			"pixelatedZoom",
			"hide",
			"sensitive",
			"clickToShow"
		],
		"edits": [
			{
				"start": 5383,
				"end": 5419,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 5478,
				"end": 5478,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 6834,
				"end": 6892,
				"current": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n",
				"baseline": ""
			},
			{
				"start": 8074,
				"end": 8075,
				"current": "\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkMediaAudio.vue",
		"currentSha256": "049ce46d7b04db3ac75bcc519ac8567e2fa29b5ffebdd1343e520c7c7756f7dd",
		"baselineSha256": "46f8d4f3201acc3048ca2360f2c0a2a85ffb933f14780647fbe138b121c1d579",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"audio",
			"clickToShow"
		],
		"edits": [
			{
				"start": 5653,
				"end": 5689,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 5748,
				"end": 5748,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 6186,
				"end": 6244,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkMediaBanner.vue",
		"currentSha256": "c0343b80aaae9c443affb47c1886d91fc5c1ec9ff809f382d21ed6071a0a2a07",
		"baselineSha256": "2eed2197c0c5fd4f476ace9d5830e314cc0062d355fbefd7eae119cda171bb45",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"clickToShow"
		],
		"edits": [
			{
				"start": 636,
				"end": 672,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 731,
				"end": 731,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 905,
				"end": 963,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkMediaImage.vue",
		"currentSha256": "7dbe330fc7ff55d104d5154ac53f01fc6db55f7bf0245e22654d18eacc30e772",
		"baselineSha256": "edcd4771eb6876a5d8a7bfc3606636fbd4d4963a1cd328dc28e91c4b9e47ab98",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"image",
			"clickToShow"
		],
		"edits": [
			{
				"start": 2824,
				"end": 2860,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2919,
				"end": 2919,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3646,
				"end": 3704,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkMediaVideo.vue",
		"currentSha256": "b5f3f8d86531a1b65b23594d8cd1db1e3c0c4f3837fa553359dbc389dc7e1738",
		"baselineSha256": "0c146d9e615895a22f3e0c93fde45003cf0d557918eb634d818149b918cc9a2c",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"video",
			"clickToShow"
		],
		"edits": [
			{
				"start": 1769,
				"end": 1805,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1864,
				"end": 1864,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2398,
				"end": 2456,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkUploaderDialog.vue",
		"currentSha256": "4027c7a71b6642daf9dc95a679fd1868e4c5a7c1499759b1c142734e124d1ab2",
		"baselineSha256": "b6b3d095096b4ad99bfb1d075367d3511973ce103304615dd20f09cb44c0d6bd",
		"keys": [
			"upload",
			"yes",
			"no",
			"done",
			"retry"
		],
		"order": [
			"uploadNFiles",
			"uploaderTip",
			"uploaderMaxFileSizeIsX",
			"uploaderAllowedTypes",
			"abort",
			"upload",
			"retry",
			"done",
			"uploaderAbortConfirm",
			"yes",
			"no",
			"uploaderDoneConfirm"
		],
		"edits": [
			{
				"start": 2152,
				"end": 2188,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2247,
				"end": 2247,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3004,
				"end": 3062,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkWatermarkEditorDialog.vue",
		"currentSha256": "5ad008fdf20ce7b34a6821b262d1de4e28ad6c6413f28a22e19f2ac974d38060",
		"baselineSha256": "0df6796d3dc80307bab41dc42865553667f3338c348034858e49757c5864f5ae",
		"keys": [
			"preview",
			"name"
		],
		"order": [
			"quitWithoutSaveConfirm",
			"failedToLoadImage",
			"name",
			"text",
			"image",
			"qr",
			"stripe",
			"polkadot",
			"checker",
			"title",
			"preview"
		],
		"edits": [
			{
				"start": 2602,
				"end": 2638,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2697,
				"end": 2697,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3898,
				"end": 3956,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/embed/components/EmMediaImage.vue",
		"currentSha256": "fd6a132af2aa7c674473eaef29e5031a6caa0fe3cf0f9b4b540fcea4f765ac16",
		"baselineSha256": "7e24f51a89f99ea8870c2d7b6f0e052270df9c468764f0e9ca459692766a2016",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"image",
			"clickToShow"
		],
		"edits": [
			{
				"start": 1601,
				"end": 1637,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1696,
				"end": 1696,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1868,
				"end": 1926,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/admin-file.root.vue",
		"currentSha256": "87689969a5c2c37197edbff1bbaf990b5aab539ccac036d13941433c532e3ed7",
		"baselineSha256": "03160cd7181452854f9409780eb6eee13ebff524b6478a7352413b35f948a0c2",
		"keys": [
			"delete",
			"sensitive",
			"overview",
			"createdAt",
			"removeAreYouSure"
		],
		"order": [
			"removeAreYouSure",
			"unmarkAsSensitiveConfirm",
			"markAsSensitiveConfirm",
			"openInNewTab",
			"overview",
			"usage",
			"createdAt",
			"sensitive",
			"delete",
			"requireAdminForView"
		],
		"edits": [
			{
				"start": 3141,
				"end": 3177,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3236,
				"end": 3236,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4305,
				"end": 4363,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/admin/files.vue",
		"currentSha256": "bfc751c292b833f3021d0b0ba71daa8a219dd3e5b4261292317c0979da6f8cc3",
		"baselineSha256": "5ea2078767b78f4cf9ca5e51d3d1023a9b9ba065d0f54855fe1b9a8a23f052f5",
		"keys": [
			"all"
		],
		"order": [
			"all",
			"local",
			"remote",
			"clearCachedFilesConfirm",
			"lookup",
			"clearCachedFiles",
			"files",
			"instance",
			"host"
		],
		"edits": [
			{
				"start": 1266,
				"end": 1302,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1361,
				"end": 1361,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2032,
				"end": 2090,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/drive.file.info.vue",
		"currentSha256": "616102942faa7cc5828f1cb4a6de7ddd1386f3609421ad407b4328c35408f344",
		"baselineSha256": "db9985b735a088f46889e26f6ecf3fd338776ca3d7802efee9c6de67435aed3f",
		"keys": [
			"delete",
			"description",
			"none",
			"error",
			"download",
			"markAsSensitive",
			"unmarkAsSensitive",
			"drive",
			"driveFileDeleteConfirm"
		],
		"order": [
			"fileViewerThisPageCanBeSeenFromTheAuthor",
			"createNoteFromTheFile",
			"unmarkAsSensitive",
			"markAsSensitive",
			"download",
			"delete",
			"folder",
			"description",
			"none",
			"fileViewerUploadedAt",
			"fileViewerType",
			"fileViewerSize",
			"drive",
			"error",
			"renameFile",
			"inputNewFileName",
			"driveFileDeleteConfirm"
		],
		"edits": [
			{
				"start": 3279,
				"end": 3315,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3374,
				"end": 3374,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4212,
				"end": 4270,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/drive.file.vue",
		"currentSha256": "8e95f2b1df3f4bedda8915dfaaab1d71547dfca46a275b98770313707cdf8e74",
		"baselineSha256": "1a3ec9ad6a834881926bb7fba878ac82e08d2523a40b107853f9d7051aa7950d",
		"keys": [
			"info"
		],
		"order": [
			"info",
			"attachedNotes",
			"title"
		],
		"edits": [
			{
				"start": 613,
				"end": 649,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 708,
				"end": 708,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 904,
				"end": 962,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/drive.vue",
		"currentSha256": "d9e22a1e470ecb075349ecb6a778e595e51477a6e90ff07dfd4dbc5de67d982b",
		"baselineSha256": "af416f1f769d6ab1d185c2a41c0e1e8619bdfaedac8ddf5a65b58d28fdff4eb3",
		"keys": [
			"drive"
		],
		"order": [
			"drive"
		],
		"edits": [
			{
				"start": 249,
				"end": 285,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 344,
				"end": 344,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 681,
				"end": 739,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive-cleaner.vue",
		"currentSha256": "f99a878f0360e6128847c7e919b9f3739f64b2082b1cff89eb3354186a75d577",
		"baselineSha256": "0e292f56304f7486b094c14a780adef1bde502bc6628cc8119c7c251f20e4e6a",
		"keys": [
			"sensitive"
		],
		"order": [
			"sort",
			"sensitive",
			"registeredDate",
			"orderBySizeDesc",
			"orderByCreatedAtAsc",
			"drivecleaner"
		],
		"edits": [
			{
				"start": 1486,
				"end": 1522,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1581,
				"end": 1581,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2563,
				"end": 2621,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive.ImageFrameItem.vue",
		"currentSha256": "14bd5b57c0280da7ed22ecd66b1b13f02af6b41c4ff0bf128e41ff811ef47152",
		"baselineSha256": "c22b0807ccfa8206d132247b896ee86179df2e5521e43a0c462e4d26afeeb30b",
		"keys": [
			"delete",
			"edit",
			"noName"
		],
		"order": [
			"preset",
			"noName",
			"edit",
			"delete"
		],
		"edits": [
			{
				"start": 757,
				"end": 793,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 852,
				"end": 852,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1442,
				"end": 1500,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive.WatermarkItem.vue",
		"currentSha256": "5f99993a86655e659d596d4582c719d9ad53f9ffb4c89f6829e8cee8546569ce",
		"baselineSha256": "a8749b9ba075a16c55a6a9eb33ea874bf1ea75b4bda325fc6e1262d9d9515693",
		"keys": [
			"delete",
			"edit",
			"noName"
		],
		"order": [
			"preset",
			"noName",
			"edit",
			"delete"
		],
		"edits": [
			{
				"start": 757,
				"end": 793,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 852,
				"end": 852,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1416,
				"end": 1474,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive.vue",
		"currentSha256": "03be7e9f6d52b77304d7925e33bb7802813990ad22ffad739b633a111be44661",
		"baselineSha256": "47d8ea90036533baf3110ed304fecebe2d681a8eaf099ac56d47ba9f14b36f85",
		"keys": [
			"none",
			"error",
			"drive",
			"noName",
			"high",
			"medium",
			"low"
		],
		"order": [
			"drive",
			"settingsDriveBanner",
			"usageAmount",
			"capacity",
			"inUse",
			"statistics",
			"general",
			"uploadFolder",
			"drivecleaner",
			"keepOriginalFilename",
			"keepOriginalFilenameDescription",
			"alwaysMarkSensitive",
			"enableAutoSensitive",
			"beta",
			"enableAutoSensitiveDescription",
			"image",
			"watermark",
			"watermarkEditorTip",
			"syncBetweenDevices",
			"none",
			"noName",
			"defaultPreset",
			"frame",
			"imageFrameEditorTip",
			"low",
			"compressionQualityHigh",
			"compressionSizeLarge",
			"medium",
			"compressionQualityMedium",
			"compressionSizeMedium",
			"high",
			"compressionQualityLow",
			"compressionSizeSmall",
			"defaultCompressionLevel",
			"defaultCompressionLevel_description",
			"video",
			"error"
		],
		"edits": [
			{
				"start": 8851,
				"end": 8887,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 8946,
				"end": 8946,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 10864,
				"end": 10922,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/ts-messages.vue",
		"currentSha256": "298c4f95846ab1cb99f4123521f5ddb5bcc5f124c40b1d1d2fe7d07af8f99fd2",
		"baselineSha256": "60b93be53a51f7654a1b3070157ce364516d313bbb274b7b40f854a7df2c6fcf",
		"keys": [
			"delete",
			"edit",
			"upload",
			"preview",
			"none",
			"error",
			"remove",
			"download",
			"rename",
			"copyUrl",
			"fromDrive",
			"sensitive",
			"markAsSensitive",
			"unmarkAsSensitive",
			"driveFileDeleteConfirm",
			"high",
			"medium",
			"low"
		],
		"order": [
			"rename",
			"sensitive",
			"describeFile",
			"preview",
			"_uploader",
			"cropImage",
			"_imageEffector",
			"watermark",
			"custom",
			"edit",
			"remove",
			"presets",
			"frame",
			"compress",
			"none",
			"low",
			"medium",
			"high",
			"upload",
			"abort",
			"failedToUpload",
			"cannotUploadBecauseExceedsFileSizeLimit",
			"cannotUploadBecauseInappropriate",
			"cannotUploadBecauseNoFreeSpace",
			"cannotUploadBecauseUnallowedFileType",
			"uploadFromUrl",
			"uploadFromUrlDescription",
			"uploadFromUrlRequested",
			"uploadFromUrlMayTakeTime",
			"fromDrive",
			"fromUrl",
			"renameFile",
			"inputNewFileName",
			"error",
			"driveFileDeleteConfirm",
			"_fileViewer",
			"move",
			"unmarkAsSensitive",
			"markAsSensitive",
			"createNoteFromTheFile",
			"copyUrl",
			"download",
			"delete",
			"copyFileId",
			"hide",
			"unmarkAsSensitiveConfirm",
			"markAsSensitiveConfirm",
			"moderation",
			"sensitiveMediaRevealConfirm"
		],
		"edits": [
			{
				"start": 97,
				"end": 295,
				"current": ">\n\n\n<script setup lang=\"ts\">\nimport type { Locale } from 'i18n';\nimport { useLocale } from 'virtual:vite-vue-internationalization';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n</script",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/EmojiCatalog.vue",
		"currentSha256": "2c42152c29c1f4234c059778c96fc5a49b403352e4e529e7ca6f276d0490aeaf",
		"baselineSha256": "0e7575cf6e0fa1d988436d84566d0c478d4ac41ddbc3273b61c534e6b4de6181",
		"keys": [
			"search"
		],
		"order": [
			"manageCustomEmojis",
			"search",
			"searchResult",
			"other"
		],
		"edits": [
			{
				"start": 1185,
				"end": 1221,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1280,
				"end": 1280,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1858,
				"end": 1916,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/EmojiCatalogItem.vue",
		"currentSha256": "93bff5d5a5d8a2fe1902cfb367eddbfd84390074c6acd841cbde1654143cace1",
		"baselineSha256": "43fbf198094e13f3734a3b5b0920589fbec565e5e7410c29caad7dec99f32497",
		"keys": [
			"edit",
			"copy",
			"info"
		],
		"order": [
			"copy",
			"info",
			"edit"
		],
		"edits": [
			{
				"start": 456,
				"end": 492,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 551,
				"end": 551,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1071,
				"end": 1129,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue",
		"currentSha256": "9db8e9cf1d0fc76b4d57ebe0e043ea5249c39330070eee9fd346497f695b9368",
		"baselineSha256": "9566024d1dd6bca764563ba5f5ffaddd757403ce0b927c95948a1f3c3aa288c0",
		"keys": [
			"name",
			"none",
			"yes",
			"no",
			"sensitive",
			"localOnly"
		],
		"order": [
			"name",
			"tags",
			"none",
			"category",
			"sensitive",
			"yes",
			"no",
			"localOnly",
			"license",
			"emojiUrl"
		],
		"edits": [
			{
				"start": 2132,
				"end": 2168,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2227,
				"end": 2227,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2531,
				"end": 2589,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/components/MkEmojiPicker.vue",
		"currentSha256": "95794d62ca6405d29e0e95295cf7bbf98782b7ca298c1f4f161be26173f267a1",
		"baselineSha256": "7569d2a5e32386460ff776b5473a8f1d8034a5ba2c41d0ee2b0ec6f2bcbe0333",
		"keys": [
			"search",
			"customEmojis",
			"settings"
		],
		"order": [
			"search",
			"settings",
			"recentUsed",
			"customEmojis",
			"other",
			"emoji"
		],
		"edits": [
			{
				"start": 4439,
				"end": 4475,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 4534,
				"end": 4534,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 5837,
				"end": 5895,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/components/MkRemoteEmojiEditDialog.vue",
		"currentSha256": "b09ab6ae5c5c3d65747c2624a889373c6dd437b0ad56df348cecccfff0750df9",
		"baselineSha256": "450f99dff42dd91874bd1a645fd08853391a691a6c5be25481525be491283356",
		"keys": [
			"name"
		],
		"order": [
			"name",
			"host",
			"license",
			"import"
		],
		"edits": [
			{
				"start": 1774,
				"end": 1810,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1869,
				"end": 1869,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2328,
				"end": 2386,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/components/global/MkCustomEmoji.vue",
		"currentSha256": "b6498511be207b535867d5939c6361d57635c544b0c9d01d66d79f3fd3207afd",
		"baselineSha256": "3cb344259782727298bf6468cd56d0051bdf5c9c26f9ee87bc876e556461fb81",
		"keys": [
			"edit",
			"copy",
			"info"
		],
		"order": [
			"copy",
			"doReaction",
			"info",
			"emojiUnmute",
			"emojiMute",
			"addToEmojiPalette",
			"edit",
			"muteX",
			"unmuteX"
		],
		"edits": [
			{
				"start": 905,
				"end": 941,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1000,
				"end": 1000,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2338,
				"end": 2396,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/components/global/MkEmoji.vue",
		"currentSha256": "839a7d0c64805f27786110b084b21698ade49c0bb65d69c2a54386d2c393bf76",
		"baselineSha256": "96de49a152abb9384ff712b38ba7d712b7031811d8cd50a6601f4f3b126067fe",
		"keys": [
			"copy"
		],
		"order": [
			"muteX",
			"unmuteX",
			"copy",
			"doReaction",
			"emojiUnmute",
			"emojiMute",
			"addToEmojiPalette"
		],
		"edits": [
			{
				"start": 581,
				"end": 617,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 676,
				"end": 676,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1484,
				"end": 1542,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.search.vue",
		"currentSha256": "efb7fdb24ed2fe5b84565aef347de277cb340d3d300b5655669b034c68f7580b",
		"baselineSha256": "5766cad7f6b06244e2156d72fceb0c3230536d786fcfa97d63bb04f3eb7244e0",
		"keys": [
			"search",
			"reset"
		],
		"order": [
			"search",
			"sortOrder",
			"reset",
			"dialogSelectRoleTitle"
		],
		"edits": [
			{
				"start": 3025,
				"end": 3061,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3120,
				"end": 3120,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4098,
				"end": 4156,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.vue",
		"currentSha256": "f497af6cd1cbc4ff42c3db8d3f5030a898cf9d513f42f52e3d9e0c5d2c93ed64",
		"baselineSha256": "b1d9978a444479b4cc37bdb1d5b6d854f7e9da158d1a2fc2beffa4a5561e395c",
		"keys": [
			"search",
			"delete",
			"somethingHappened",
			"reset",
			"update",
			"resetAreYouSure"
		],
		"order": [
			"customEmojisManagerLocalListEmojisNothing",
			"delete",
			"update",
			"reset",
			"customEmojisManagerGridCommonCopySelectionRows",
			"customEmojisManagerLocalListMarkAsDeleteTargetRows",
			"rolesThatCanBeUsedThisEmojiAsReaction",
			"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription",
			"customEmojisManagerGridCommonCopySelectionRanges",
			"customEmojisManagerGridCommonDeleteSelectionRanges",
			"customEmojisManagerLocalListMarkAsDeleteTargetRanges",
			"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription",
			"customEmojisManagerLocalListConfirmUpdateEmojisDescription",
			"somethingHappened",
			"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription",
			"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription",
			"customEmojisManagerLocalListConfirmDeleteEmojisDescription",
			"resetAreYouSure",
			"customEmojisManagerLocalListConfirmResetDescription",
			"customEmojisManagerLocalListConfirmMovePage",
			"customEmojisManagerLocalListConfirmMovePageDesciption",
			"customEmojisManagerLocalTabTitleList",
			"search",
			"customEmojisManagerGridCommonSearchLimit",
			"customEmojisManagerLocalListConfirmChangeView",
			"customEmojisManagerGridCommonRegistrationLogs"
		],
		"edits": [
			{
				"start": 1648,
				"end": 1684,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1743,
				"end": 1743,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2453,
				"end": 2511,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			},
			{
				"start": 3933,
				"end": 3934,
				"current": "\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager.register.vue",
		"currentSha256": "f1e64b7dfac56e83049bc6044debf13a2208751055a39c84a7d551dd61b9dd93",
		"baselineSha256": "736a230f70fa598365d7911455182af972417f6260ba7c2566994494d8ec13e3",
		"keys": [
			"somethingHappened",
			"upload",
			"fromDrive"
		],
		"order": [
			"customEmojisManagerLocalRegisterUploadSettingTitle",
			"customEmojisManagerLocalRegisterUploadSettingDescription",
			"uploadFolder",
			"customEmojisManagerLocalRegisterDirectoryToCategoryLabel",
			"customEmojisManagerLocalRegisterDirectoryToCategoryCaption",
			"customEmojisManagerGridCommonRegistrationLogs",
			"customEmojisManagerGridCommonRegistrationLogsCaption",
			"upload",
			"fromDrive",
			"registration",
			"clear",
			"customEmojisManagerGridCommonCopySelectionRows",
			"customEmojisManagerGridCommonDeleteSelectionRows",
			"rolesThatCanBeUsedThisEmojiAsReaction",
			"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription",
			"customEmojisManagerGridCommonCopySelectionRanges",
			"customEmojisManagerGridCommonDeleteSelectionRanges",
			"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription",
			"somethingHappened",
			"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription",
			"customEmojisManagerLocalRegisterConfirmClearEmojisDescription"
		],
		"edits": [
			{
				"start": 2116,
				"end": 2116,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2193,
				"end": 2193,
				"current": "",
				"baseline": "';\nimport type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';\nimport type { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';\nimport type { DroppedFile } from '@features/drive/frontend/utility/file-drop.js';\nimport type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';\nimport type { GridRow } from '@features/ui/frontend/components/grid/row.js"
			},
			{
				"start": 3566,
				"end": 4145,
				"current": ";\nimport type { GridRow } from '@features/ui/frontend/components/grid/row.js';\nimport type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';\nimport type { DroppedFile } from '@features/drive/frontend/utility/file-drop.js';\nimport type { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';\nimport type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager.remote.vue",
		"currentSha256": "36bee63e9092234ab04c4150834146511cb97e90355cfec147820e77d78c099d",
		"baselineSha256": "d84c6e28be02413b8cfc8aba7210850b733f52c998715cef81b0052ce8b81c31",
		"keys": [
			"search",
			"somethingHappened",
			"reset"
		],
		"order": [
			"customEmojisManagerGridCommonSearchSettings",
			"customEmojisManagerGridCommonSearchSettingCaption",
			"customEmojisManagerGridCommonSortOrder",
			"customEmojisManagerGridCommonSearchLimit",
			"search",
			"reset",
			"customEmojisManagerGridCommonRegistrationLogs",
			"customEmojisManagerGridCommonRegistrationLogsCaption",
			"customEmojisManagerLocalListEmojisNothing",
			"customEmojisManagerRemoteImportEmojisButton",
			"customEmojisManagerRemoteImportSelectionRows",
			"customEmojisManagerRemoteSelectionRowDetail",
			"customEmojisManagerRemoteImportSelectionRangesRows",
			"customEmojisManagerRemoteConfirmImportEmojisTitle",
			"customEmojisManagerRemoteConfirmImportEmojisDescription",
			"somethingHappened",
			"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription"
		],
		"edits": [
			{
				"start": 4160,
				"end": 4160,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4235,
				"end": 4235,
				"current": "",
				"baseline": "js';\nimport type { GridSortOrderKey, RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';\nimport type { GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';\nimport type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';\nimport type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define."
			},
			{
				"start": 5414,
				"end": 5931,
				"current": ";\nimport type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define.js';\nimport type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';\nimport type { GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';\nimport type { GridSortOrderKey, RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager2.vue",
		"currentSha256": "b8484faa0c791ac4579997e179dd1400fccb5433f322a415e3b987f39051707d",
		"baselineSha256": "fdbf5393f8bdac1c4e72430ade1d24cad7cabc95e53655f144a7e3722a55c018",
		"keys": [
			"customEmojis"
		],
		"order": [
			"local",
			"remote",
			"tabTitleRegister",
			"customEmojis"
		],
		"edits": [
			{
				"start": 507,
				"end": 507,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 927,
				"end": 1021,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/custom-emojis-manager.vue",
		"currentSha256": "c915b074ebb34b00e3709569435f5437193d2a54df14bbe6ae8e17c8d8454b56",
		"baselineSha256": "938869ff161f2a9cdc5343d92b2066a9ede499b862dbbd8ff6e25f62ffa4f246",
		"keys": [
			"search",
			"customEmojis",
			"more"
		],
		"order": [
			"details",
			"import",
			"export",
			"exportRequested",
			"importRequested",
			"deleteConfirm",
			"addEmoji",
			"more",
			"local",
			"remote",
			"customEmojis",
			"search",
			"noCustomEmojis",
			"host"
		],
		"expanded": true,
		"edits": [
			{
				"start": 3106,
				"end": 3106,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4127,
				"end": 4221,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/emoji-edit-dialog.vue",
		"currentSha256": "de809d989c4c260b3713d2dd6bd5a430355410602151c6aa1b426dea090d273f",
		"baselineSha256": "3a2a60b8f7816d9980d3bc464c43a226f4724d760103fc8ce205ceb058820bb9",
		"keys": [
			"delete",
			"name",
			"all",
			"add",
			"create",
			"update",
			"sensitive",
			"removeAreYouSure",
			"localOnly"
		],
		"order": [
			"selectFile",
			"name",
			"category",
			"tags",
			"theKeywordWhenSearchingForCustomEmoji",
			"setMultipleBySeparatingWithSpace",
			"license",
			"rolesThatCanBeUsedThisEmojiAsReaction",
			"all",
			"add",
			"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription",
			"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn",
			"sensitive",
			"localOnly",
			"delete",
			"update",
			"create",
			"removeAreYouSure"
		],
		"edits": [
			{
				"start": 3728,
				"end": 3728,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4705,
				"end": 4799,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/ts-messages.vue",
		"currentSha256": "d6ce9eedb4ced2a0dd98a4ed57787206f6e8a5415bb4568fa9036749b2416f64",
		"baselineSha256": "8195e95596974c759531dfa06fadb7dfcbb023b92643266eac82f458616ed803",
		"keys": [
			"noName"
		],
		"order": [
			"recentUsed",
			"chooseEmojiPalette",
			"_emojiPalette",
			"noName",
			"emojiPaletteAlreadyAddedConfirm",
			"prepend",
			"append",
			"doNothing"
		],
		"edits": [
			{
				"start": 97,
				"end": 294,
				"current": ">\n\n<script setup lang=\"ts\">\nimport { useLocale } from 'virtual:vite-vue-internationalization';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n</script",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/admin/federation.vue",
		"currentSha256": "9c3a8cb156d4a18c950d13f9a8fa84369c281930c3f74663ed345ee5855db2c9",
		"baselineSha256": "c681e7bdc6f2ac79efc7aa98935627a50d1095ee1d778ec4f04782b1a0128898",
		"keys": [
			"notes",
			"following",
			"all",
			"users",
			"followers"
		],
		"order": [
			"all",
			"federating",
			"subscribing",
			"publishing",
			"suspended",
			"blocked",
			"silence",
			"notResponding",
			"pubSub",
			"descendingOrder",
			"ascendingOrder",
			"notes",
			"users",
			"following",
			"followers",
			"registeredAt",
			"federation",
			"host",
			"state",
			"sort"
		],
		"edits": [
			{
				"start": 1296,
				"end": 1296,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1980,
				"end": 2074,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/admin/relays.vue",
		"currentSha256": "b2607c3e21397ab9ba638804b1f068be66ad835f95609c5b3a2c4fc40ac5c1b9",
		"baselineSha256": "5088a68a496fc31da7d7ce7a211f9b994edd73ab1bfadafb36db6d3965829d80",
		"keys": [
			"remove"
		],
		"order": [
			"relays",
			"relayStatusLabels",
			"remove",
			"addRelay",
			"inboxUrl"
		],
		"edits": [
			{
				"start": 1270,
				"end": 1270,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1695,
				"end": 1789,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/instance-info.vue",
		"currentSha256": "49419d8dc51fe0505bd9b4028f7eecd270f7d56c07d4f059baeace7affbfda28",
		"baselineSha256": "64a8501c6b35bd413fdcb0a29822eb55551958fe30a208966e51867cf378ef74",
		"keys": [
			"description",
			"users",
			"overview",
			"updatedAt",
			"administrator",
			"charts"
		],
		"order": [
			"unknown",
			"software",
			"administrator",
			"description",
			"deliveryStatus",
			"deliveryTypeLabels",
			"deliveryStop",
			"deliveryResume",
			"blockThisInstance",
			"silenceThisInstance",
			"mediaSilenceThisInstance",
			"moderationNote",
			"moderationNoteDescription",
			"registeredAt",
			"updatedAt",
			"latestRequestReceivedAt",
			"recentNHours",
			"recentNDays",
			"instanceChartsRequests",
			"instanceChartsUsers",
			"instanceChartsUsersTotal",
			"instanceChartsNotes",
			"instanceChartsNotesTotal",
			"instanceChartsFf",
			"instanceChartsFfTotal",
			"instanceChartsCacheSize",
			"instanceChartsCacheSizeTotal",
			"instanceChartsFiles",
			"instanceChartsFilesTotal",
			"overview",
			"charts",
			"users"
		],
		"edits": [
			{
				"start": 6256,
				"end": 6256,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 6338,
				"end": 6338,
				"current": "",
				"baseline": "';\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue"
			},
			{
				"start": 8079,
				"end": 8259,
				"current": ";\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/lookup.vue",
		"currentSha256": "06bc1932d7942c37183bff8ed82f2469da2bc41cb8210e944905ccedaa4a1a3c",
		"baselineSha256": "481b50b4cb1e6f31df52a235cd0472500427b192be62cd2db2205ccc9ef775b0",
		"keys": [
			"close"
		],
		"order": [
			"close",
			"goToMisskey",
			"fetchingAsApObject",
			"lookup"
		],
		"edits": [
			{
				"start": 668,
				"end": 668,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 1077,
				"end": 1135,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/games/frontend/pages/drop-and-fusion.game.vue",
		"currentSha256": "90c67bfe8cb4b3c0d7f76f337e2e94c02c307abe0b0565c3710dfe6886bb22d9",
		"baselineSha256": "63de8fb5dc1136e056aed7810c19b01d66b17bb3cc9ed852b34d50e12075abe5",
		"keys": [
			"areYouSure",
			"share"
		],
		"order": [
			"loading",
			"bubbleGame",
			"bubbleGameHold",
			"bubbleGameScoreScore",
			"bubbleGameScoreMaxChain",
			"bubbleGameScoreScoreYen",
			"bubbleGameScoreYen",
			"bubbleGameScoreScoreSweets",
			"bubbleGameScoreEstimatedQty",
			"replaying",
			"endReplay",
			"backToTitle",
			"showReplay",
			"share",
			"copyReplayData",
			"bubbleGameScoreHighScore",
			"volume",
			"sfx",
			"surrender",
			"gameRetry",
			"areYouSure",
			"cannotLoad"
		],
		"edits": [
			{
				"start": 9678,
				"end": 9678,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 10055,
				"end": 10055,
				"current": "",
				"baseline": "';\nimport type { Mono } from 'misskey-bubble-game"
			},
			{
				"start": 11058,
				"end": 11201,
				"current": ";\nimport type { Mono } from 'misskey-bubble-game';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/games/frontend/pages/drop-and-fusion.vue",
		"currentSha256": "93e52d9216c5789f32b867951d3094e9bb959d9dddf7d75da924a1c9e6ca47aa",
		"baselineSha256": "5052e29eed186284c15ff6a20d8a1f159271e1697cca2d7d354cc7397ed8d091",
		"keys": [
			"mute"
		],
		"order": [
			"bubbleGame",
			"start",
			"soundWillBePlayed",
			"mute",
			"lastNDays",
			"ranking",
			"loading",
			"howToPlay",
			"section1",
			"section2",
			"section3"
		],
		"edits": [
			{
				"start": 3136,
				"end": 3136,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3832,
				"end": 3926,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/games/frontend/pages/reversi/game.board.vue",
		"currentSha256": "2368069b5e2053731d52c9e2682a05883dfcdd7fa4bfc2208d0aa9bb352e76eb",
		"baselineSha256": "0e2b6ce27589f6d3dee1a75115e6094a9be049293fe30b2659a61278d3884509",
		"keys": [
			"areYouSure",
			"share"
		],
		"order": [
			"reversiBlack",
			"reversiWhite",
			"reversiTurnOf",
			"reversiPastTurnOf",
			"reversiOpponentTurn",
			"remainingN",
			"reversiMyTurn",
			"reversiWon",
			"reversiSurrendered",
			"reversiTimeout",
			"reversiDrawn",
			"reversiTurnCount",
			"reversiTotal",
			"reversiIsLlotheo",
			"reversiLoopedMap",
			"reversiCanPutEverywhere",
			"options",
			"reversiShowBoardLabels",
			"reversiUseAvatarAsStone",
			"reversiSurrender",
			"share",
			"areYouSure"
		],
		"edits": [
			{
				"start": 7700,
				"end": 7700,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8880,
				"end": 8974,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/games/frontend/pages/reversi/game.setting.vue",
		"currentSha256": "41926f8958e661df93c183c15835c921fbc7e4ad74d63706789bbed11f88e125",
		"baselineSha256": "35fdacf60dc929274358141904d5ba32623828fa80cfdcfa8b246dbfa1f6fe63",
		"keys": [
			"cancel",
			"areYouSure"
		],
		"order": [
			"reversiGameSettings",
			"reversiDisallowIrregularRules",
			"reversiChooseBoard",
			"reversiBlackOrWhite",
			"random",
			"reversiBlackIs",
			"reversiTimeLimitForEachTurn",
			"timeSecond",
			"reversiRules",
			"reversiIsLlotheo",
			"reversiLoopedMap",
			"reversiCanPutEverywhere",
			"reversiOpponentHasSettingsChanged",
			"reversiThisGameIsStartedSoon",
			"reversiWaitingForOther",
			"reversiWaitingForMe",
			"reversiWaitingBoth",
			"cancel",
			"reversiReady",
			"reversiCancelReady",
			"reversiShareToTlTheGameWhenStart",
			"areYouSure"
		],
		"edits": [
			{
				"start": 4853,
				"end": 4853,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4983,
				"end": 4983,
				"current": "",
				"baseline": "';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js"
			},
			{
				"start": 5448,
				"end": 5517,
				"current": "{ useRouter } from '@features/navigation/frontend/router.js';\nimport ",
				"baseline": ""
			},
			{
				"start": 5602,
				"end": 5607,
				"current": "type ",
				"baseline": ""
			},
			{
				"start": 5609,
				"end": 5610,
				"current": "M",
				"baseline": "us"
			},
			{
				"start": 5611,
				"end": 5612,
				"current": "n",
				"baseline": "Ro"
			},
			{
				"start": 5613,
				"end": 5614,
				"current": "I",
				"baseline": ""
			},
			{
				"start": 5616,
				"end": 5617,
				"current": "m",
				"baseline": "r"
			},
			{
				"start": 5656,
				"end": 5656,
				"current": "",
				"baseline": "rou"
			},
			{
				"start": 5657,
				"end": 5659,
				"current": "yp",
				"baseline": ""
			},
			{
				"start": 5660,
				"end": 5666,
				"current": "s/menu",
				"baseline": "r"
			},
			{
				"start": 5670,
				"end": 5764,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/games/frontend/pages/reversi/index.vue",
		"currentSha256": "a62609a4c23aace4563411f326dfd0a6d04200ce68e850b39cb43650fce3c2ef",
		"baselineSha256": "bd8239ba57f55c964c40bfb9ffcd6e14f79eb0c38d8c5237877e8f591ce60823",
		"keys": [
			"cancel",
			"invite"
		],
		"order": [
			"reversiFreeMatch",
			"invite",
			"soundWillBePlayed",
			"invitations",
			"reversiMyGames",
			"reversiPlaying",
			"reversiEnded",
			"reversiAllGames",
			"waitingFor",
			"reversiLookingForPlayer",
			"cancel",
			"reversiAllowIrregularRules",
			"reversiDisallowIrregularRules"
		],
		"edits": [
			{
				"start": 5664,
				"end": 5664,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 6665,
				"end": 6759,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/about.federation.vue",
		"currentSha256": "ef417cffe518c2fb8870dcc0ba2953f1e355d1e279a83597eae2f218d920a655",
		"baselineSha256": "1da40245eaf3f1c6a008ebc4c29fe93a793d927dbeab3749542b1bd874b55d2a",
		"keys": [
			"notes",
			"following",
			"all",
			"users",
			"followers"
		],
		"order": [
			"all",
			"federating",
			"subscribing",
			"publishing",
			"suspended",
			"silence",
			"blocked",
			"notResponding",
			"pubSub",
			"descendingOrder",
			"ascendingOrder",
			"notes",
			"users",
			"following",
			"followers",
			"registeredAt",
			"host",
			"state",
			"sort"
		],
		"edits": [
			{
				"start": 1118,
				"end": 1118,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1734,
				"end": 1828,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/about.overview.vue",
		"currentSha256": "bb024b56c646c4fa0d19b56ec3dd58a703b8b8f8150350572cc9792d59a4d927",
		"baselineSha256": "341b892892dfb3d820b76cd08b68ff460bee36927c29909fc74f376f68389815",
		"keys": [
			"notes",
			"description",
			"none",
			"users",
			"administrator",
			"termsOfService",
			"privacyPolicy"
		],
		"order": [
			"description",
			"poweredByMisskeyDescription",
			"aboutMisskey",
			"sourceCode",
			"sourceCodeIsNotYetProvided",
			"administrator",
			"none",
			"contact",
			"inquiry",
			"impressum",
			"serverRules",
			"termsOfService",
			"privacyPolicy",
			"feedback",
			"statistics",
			"users",
			"notes"
		],
		"edits": [
			{
				"start": 5083,
				"end": 5083,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 5979,
				"end": 6073,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/about.vue",
		"currentSha256": "48e9810a8f16f45cdaae03366fc370f5b00d8fa77810ea9003b3078e7712b70c",
		"baselineSha256": "b4830187a7a9b316a15642a61475ae1884fca1fbbac732c5f1f99a3d83835a56",
		"keys": [
			"customEmojis",
			"overview",
			"charts"
		],
		"order": [
			"overview",
			"customEmojis",
			"federation",
			"charts",
			"instanceInfo"
		],
		"edits": [
			{
				"start": 893,
				"end": 893,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1232,
				"end": 1326,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/ads.vue",
		"currentSha256": "b170de1d0a925ba604e6aeeb54778456907991d0389187b43c13c5bc29bc845d",
		"baselineSha256": "936172127647fee1aef9e46cdbeac73e6418b2cae2e0afe05efe5d139cb17603",
		"keys": [
			"save",
			"all",
			"add",
			"remove",
			"more",
			"sensitive",
			"memo",
			"removeAreYouSure",
			"imageUrl"
		],
		"order": [
			"state",
			"imageUrl",
			"ratio",
			"startingperiod",
			"expiration",
			"sensitive",
			"advancedSettings",
			"adTimezoneinfo",
			"memo",
			"save",
			"remove",
			"more",
			"weekdaySunday",
			"weekdayMonday",
			"weekdayTuesday",
			"weekdayWednesday",
			"weekdayThursday",
			"weekdayFriday",
			"weekdaySaturday",
			"all",
			"publishing",
			"expired",
			"removeAreYouSure",
			"saved",
			"add",
			"ads"
		],
		"edits": [
			{
				"start": 2728,
				"end": 2728,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3743,
				"end": 3837,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/branding.vue",
		"currentSha256": "6f903a667a7a69f1aa9544615c5fd8dbce8df0c6211cd6ed2355f9493467c6f0",
		"baselineSha256": "84bc7c7995b932c35612119a6d79dfd5abeb1076148d26ece47dd1b06e4c4791",
		"keys": [
			"save",
			"somethingHappened"
		],
		"order": [
			"branding",
			"serverSettingsEntrancePageStyle",
			"serverSettingsShowTimelineForVisitor",
			"serverSettingsShowActivitiesForVisitor",
			"serverSettingsIconUrl",
			"serverSettingsAppIconDescription",
			"serverSettingsAppIconUsageExample",
			"serverSettingsAppIconStyleRecommendation",
			"serverSettingsAppIconResolutionMustBe",
			"bannerUrl",
			"backgroundImageUrl",
			"notFoundDescription",
			"nothing",
			"somethingHappened",
			"themeColor",
			"instanceDefaultLightTheme",
			"instanceDefaultThemeDescription",
			"instanceDefaultDarkTheme",
			"repositoryUrl",
			"feedbackUrl",
			"serverSettingsManifestJsonOverride",
			"save"
		],
		"edits": [
			{
				"start": 6701,
				"end": 6701,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 7675,
				"end": 7769,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/security.vue",
		"currentSha256": "105443024ed90c0e45df385b52c1709e4e4f96acd7def65c9b3b95a79e49ea18",
		"baselineSha256": "6c289f8c81e3c7aa894475961ff881783738eb1867b0b201ada7f7ea6bd02642",
		"keys": [
			"none",
			"all",
			"localOnly"
		],
		"order": [
			"security",
			"sensitiveMediaDetection",
			"all",
			"localOnly",
			"remoteOnly",
			"none",
			"description",
			"externalServiceInfo",
			"apiUrl",
			"apiUrlDescription",
			"apiKey",
			"apiKeyDescription",
			"timeout",
			"timeoutDescription",
			"maxImagesPerRequest",
			"maxImagesPerRequestDescription",
			"sensitivity",
			"sensitivityDescription",
			"analyzeVideos",
			"beta",
			"analyzeVideosDescription",
			"setSensitiveFlagAutomatically",
			"notRecommended",
			"setSensitiveFlagAutomaticallyDescription",
			"activeEmailValidationDescription"
		],
		"edits": [
			{
				"start": 9322,
				"end": 9322,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 10340,
				"end": 10434,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/server-rules.vue",
		"currentSha256": "af19a8bf726e7185a9d0e6b35f268441986165ee684d58c1410ab70728e4fec5",
		"baselineSha256": "4fbb3d09d0712cc7fbd0273def590c8917e7a0f5d3ffc354d08c3b99e30d2d95",
		"keys": [
			"save",
			"add"
		],
		"order": [
			"serverRules",
			"description",
			"add",
			"save"
		],
		"edits": [
			{
				"start": 1535,
				"end": 1535,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1971,
				"end": 2065,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/settings.vue",
		"currentSha256": "ff60c1c9230fee8123f48c5b0cae24ca6eb00503585bd5f75cec4986ed8ef7eb",
		"baselineSha256": "41cc31a894e477568d421faf897294021637bbeffa1cbb6fedc0047865676ee3",
		"keys": [
			"none",
			"all",
			"add",
			"info"
		],
		"order": [
			"restartServerSetupWizardConfirm_title",
			"restartServerSetupWizardConfirm_text",
			"general",
			"info",
			"instanceName",
			"modified",
			"shortName",
			"optional",
			"shortNameDescription",
			"instanceDescription",
			"maintainerName",
			"maintainerEmail",
			"tosUrl",
			"privacyPolicyUrl",
			"inquiryUrl",
			"inquiryUrlDescription",
			"repositoryUrl",
			"repositoryUrlDescription",
			"repositoryUrlOrTarballRequired",
			"impressumUrl",
			"impressumDescription",
			"pinnedUsers",
			"pinnedUsersDescription",
			"enableServiceworker",
			"serviceworkerInfo",
			"adsSettings",
			"notesPerOneAd",
			"setZeroToDisable",
			"adsTooClose",
			"title",
			"enable",
			"allowRedirect",
			"allowRedirectDescription",
			"requireContentLength",
			"requireContentLengthDescription",
			"maximumContentLength",
			"maximumContentLengthDescription",
			"timeout",
			"timeoutDescription",
			"userAgent",
			"userAgentDescription",
			"summaryProxy",
			"notUsePleaseLeaveBlank",
			"summaryProxyDescription",
			"summaryProxyDescription2",
			"urlPreviewSensitiveList",
			"urlPreviewSensitiveListDescription",
			"federation",
			"all",
			"specifyHost",
			"none",
			"behavior",
			"federationAllowedHosts",
			"federationAllowedHostsDescription",
			"deliverSuspendedSoftware",
			"add",
			"deliverSuspendedSoftwareDescription",
			"softwareName",
			"version",
			"signToActivityPubGet",
			"signToActivityPubGet_description",
			"proxyRemoteFiles",
			"proxyRemoteFiles_description",
			"allowExternalApRedirect",
			"allowExternalApRedirect_description",
			"needToRestartServerToApply",
			"cacheRemoteFiles",
			"cacheRemoteFilesDescription",
			"youCanCleanRemoteFilesCache",
			"cacheRemoteSensitiveFiles",
			"cacheRemoteSensitiveFilesDescription",
			"proxyAccount",
			"proxyAccountDescription",
			"description",
			"youCanIncludeHashtags"
		],
		"edits": [
			{
				"start": 21505,
				"end": 21505,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 22518,
				"end": 22612,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/contact.vue",
		"currentSha256": "18a259c2232cba20dceefa999880f79347d88d7b156e4b763fa910de2e02a1ae",
		"baselineSha256": "d71090303726f4a95b938d534565a98d150650789d985f0a37f28d99997c3fa0",
		"keys": [
			"none",
			"administrator"
		],
		"order": [
			"administrator",
			"none",
			"contact",
			"inquiry",
			"deviceInfo",
			"deviceInfoDescription"
		],
		"edits": [
			{
				"start": 1510,
				"end": 1510,
				"current": "",
				"baseline": " "
			},
			{
				"start": 1792,
				"end": 1792,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1960,
				"end": 1960,
				"current": "",
				"baseline": "UserEnvironment } from '@features/users/frontend/utility/get-user-environment.js';\nimport type { "
			},
			{
				"start": 2329,
				"end": 2520,
				"current": ";\nimport type { UserEnvironment } from '@features/users/frontend/utility/get-user-environment.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/components/MkExtensionInstaller.vue",
		"currentSha256": "23f3e1969cd52aad9f2602c57b6e55a7fbf1ab38e764f66b6c9709e6ed9648a3",
		"baselineSha256": "0abb18582c2717f2b38df025b123dc59a5f0c51474f45e778089693b496874b7",
		"keys": [
			"cancel",
			"name",
			"description",
			"none",
			"permission",
			"install",
			"permissionsLabels"
		],
		"order": [
			"externalResourceInstallerPluginTitle",
			"externalResourceInstallerThemeTitle",
			"externalResourceInstallerCheckVendorBeforeInstall",
			"metadata",
			"name",
			"author",
			"description",
			"none",
			"version",
			"permission",
			"permissionsLabels",
			"pluginViewSource",
			"externalResourceInstallerMetaBase",
			"light",
			"dark",
			"themeCode",
			"cancel",
			"install"
		],
		"edits": [
			{
				"start": 1947,
				"end": 1948,
				"current": "(",
				"baseline": ""
			},
			{
				"start": 1998,
				"end": 2025,
				"current": ") as Record<string, string>",
				"baseline": ""
			},
			{
				"start": 3879,
				"end": 3915,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3974,
				"end": 3974,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 4401,
				"end": 4459,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/components/MkSystemWebhookEditor.vue",
		"currentSha256": "2e6f9560480ca52a665f94e080cfd4c8b31122929b83c68f35f15a5a9cac4aec",
		"baselineSha256": "cb666e648f680d96f51dec09d90ab84f08f26d904728e8c5b9d4dfc09f21d014",
		"keys": [
			"cancel",
			"ok",
			"error"
		],
		"order": [
			"internalServerErrorDescription",
			"error",
			"createWebhook",
			"modifyWebhook",
			"name",
			"secret",
			"trigger",
			"abuseReport",
			"abuseReportResolved",
			"userCreated",
			"inactiveModeratorsWarning",
			"inactiveModeratorsInvitationOnlyChanged",
			"testRemarks",
			"enable",
			"ok",
			"cancel"
		],
		"expanded": true,
		"edits": [
			{
				"start": 4271,
				"end": 4271,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 4999,
				"end": 5057,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/admin/system-webhook.item.vue",
		"currentSha256": "b729b783bc997889573702a629f55fc4a5de1863757f728d8252b25a88ae620f",
		"baselineSha256": "01f84b3db05c32ddb9420f277ab8a9c45f637f00102aeb19a7d443936a849d9f",
		"keys": [
			"delete",
			"edit"
		],
		"order": [
			"edit",
			"delete"
		],
		"edits": [
			{
				"start": 1421,
				"end": 1421,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1695,
				"end": 1789,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/install-extensions.vue",
		"currentSha256": "7c5af69a263f56aad9068891f230df2bde09236339cfd3d3dcf8ed98e2d4e1c3",
		"baselineSha256": "9f42b461036871c6646447b1e6d540052cd5c890e9a9123b09ec516685832a3a",
		"keys": [
			"close"
		],
		"order": [
			"externalResourceInstallerVendorInfoEndpoint",
			"externalResourceInstallerVendorInfoHashVerify",
			"close",
			"externalResourceInstallerErrorsInvalidParamsTitle",
			"externalResourceInstallerErrorsInvalidParamsDescription",
			"externalResourceInstallerErrorsFailedToFetchTitle",
			"externalResourceInstallerErrorsFailedToFetchParseErrorDescription",
			"externalResourceInstallerErrorsHashUnmatchedTitle",
			"externalResourceInstallerErrorsHashUnmatchedDescription",
			"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription",
			"externalResourceInstallerErrorsPluginParseFailedTitle",
			"externalResourceInstallerErrorsPluginParseFailedDescription",
			"externalResourceInstallerErrorsThemeParseFailedTitle",
			"themeAlreadyInstalled",
			"externalResourceInstallerErrorsThemeParseFailedDescription",
			"externalResourceInstallerErrorsResourceTypeNotSupportedTitle",
			"externalResourceInstallerErrorsResourceTypeNotSupportedDescription",
			"externalResourceInstallerErrorsPluginInstallFailedTitle",
			"externalResourceInstallerErrorsPluginInstallFailedDescription",
			"externalResourceInstallerTitle"
		],
		"edits": [
			{
				"start": 1656,
				"end": 1656,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1693,
				"end": 1693,
				"current": "",
				"baseline": "';\nimport type { Extension } from '@features/integrations/frontend/components/MkExtensionInstaller.vue';\nimport type { AiScriptPluginMeta } from '@features/integrations/frontend/plugin.js"
			},
			{
				"start": 2702,
				"end": 2983,
				"current": ";\nimport type { AiScriptPluginMeta } from '@features/integrations/frontend/plugin.js';\nimport type { Extension } from '@features/integrations/frontend/components/MkExtensionInstaller.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/settings/plugin.install.vue",
		"currentSha256": "b6636373643602810d3d7e87579d2f0457433358ecbeb726512484efe5e3e180",
		"baselineSha256": "d6dd6ea07bb6194e982a63c266c423107287185722efc8e9c8ad9218cf0c656e",
		"keys": [
			"install"
		],
		"order": [
			"pluginInstallWarn",
			"code",
			"install",
			"pluginInstall"
		],
		"edits": [
			{
				"start": 604,
				"end": 604,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1125,
				"end": 1219,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/settings/plugin.vue",
		"currentSha256": "32ba421fce924e9cfdafe8ecf908b0344f1064dc0dd4fb98ecc48ab1a3f6b328",
		"baselineSha256": "835c50fcac3d3da01faef11ffd9d0eb432e2461ba5fbebace5fced96640a721e",
		"keys": [
			"reload",
			"description",
			"none",
			"permission",
			"settings",
			"removeAreYouSure",
			"permissionsLabels"
		],
		"order": [
			"plugins",
			"settingsPluginBanner",
			"pluginsAreDisabledBecauseSafeMode",
			"pluginInstall",
			"manage",
			"reload",
			"uninstall",
			"settings",
			"makeActive",
			"author",
			"description",
			"permission",
			"permissionsLabels",
			"none",
			"logs",
			"pluginViewSource",
			"removeAreYouSure"
		],
		"edits": [
			{
				"start": 2698,
				"end": 2699,
				"current": "(",
				"baseline": ""
			},
			{
				"start": 2749,
				"end": 2776,
				"current": ") as Record<string, string>",
				"baseline": ""
			},
			{
				"start": 3935,
				"end": 3935,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4040,
				"end": 4040,
				"current": "",
				"baseline": ".js';\nimport type { Plugin } from '@features/integrations/frontend/plugin"
			},
			{
				"start": 5225,
				"end": 5392,
				"current": ";\nimport type { Plugin } from '@features/integrations/frontend/plugin.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/settings/webhook.edit.vue",
		"currentSha256": "df927e78fe08752be2f506235ac7d017da9eacf917893e2a737422c4d86f365f",
		"baselineSha256": "41871180faccef3deb3339bfc23ae87fdba7436d5599cea4b1ae326f1a3906c7",
		"keys": [
			"save",
			"delete",
			"deleteAreYouSure"
		],
		"order": [
			"webhookSettingsName",
			"webhookSettingsSecret",
			"webhookSettingsTrigger",
			"webhookSettingsEventsFollow",
			"webhookSettingsEventsFollowed",
			"webhookSettingsEventsNote",
			"webhookSettingsEventsReply",
			"webhookSettingsEventsRenote",
			"webhookSettingsEventsReaction",
			"webhookSettingsEventsMention",
			"webhookSettingsTestRemarks",
			"webhookSettingsActive",
			"save",
			"delete",
			"deleteAreYouSure",
			"eventsDescription",
			"unfollow",
			"subscribedNote",
			"quote",
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
			"chatMessage"
		],
		"edits": [
			{
				"start": 3604,
				"end": 3604,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3678,
				"end": 3678,
				"current": "",
				"baseline": "js';\nimport { webhookEventTypes } from '../../../backend/webhook-events.schema."
			},
			{
				"start": 4337,
				"end": 4510,
				"current": ";\nimport { webhookEventTypes } from '../../../backend/webhook-events.schema.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/settings/webhook.new.vue",
		"currentSha256": "74a7b38c4c30307510bc92ff6ca7a4527437acf77dca39fb2a619d9737545f5e",
		"baselineSha256": "ffe8a8c0aac09bc56006796169f105458f52163356875fcb08b66b8a1293f3a2",
		"keys": [
			"create"
		],
		"order": [
			"name",
			"secret",
			"trigger",
			"follow",
			"followed",
			"note",
			"reply",
			"renote",
			"reaction",
			"mention",
			"create",
			"eventsDescription",
			"unfollow",
			"subscribedNote",
			"quote",
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
			"chatMessage"
		],
		"edits": [
			{
				"start": 1675,
				"end": 1675,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1749,
				"end": 1749,
				"current": "",
				"baseline": "js';\nimport { webhookEventTypes } from '../../../backend/webhook-events.schema."
			},
			{
				"start": 2156,
				"end": 2329,
				"current": ";\nimport { webhookEventTypes } from '../../../backend/webhook-events.schema.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/markup/frontend/components/MkCodeEditor.vue",
		"currentSha256": "8a3b72927b5eb0fb9026b1b3401d54b0cf1710f071bff75aaab62c0c96f7c8b5",
		"baselineSha256": "8fc376c1bede030cdd7ce4c95a9fc7753df254b238019104811b6583bd0065a5",
		"keys": [
			"save"
		],
		"order": [
			"save"
		],
		"edits": [
			{
				"start": 1101,
				"end": 1101,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1350,
				"end": 1444,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/markup/frontend/components/MkUrlPreview.vue",
		"currentSha256": "7ba71838337fb1fe11ab93e3c67b00d2a08328c15ccea1f61062010f380cad9b",
		"baselineSha256": "7e04cff4305ae0b40dc1948f47d40e5b30b2bfef432512bccb3477068e21cc9d",
		"keys": [
			"close"
		],
		"order": [
			"disablePlayer",
			"close",
			"failedToPreviewUrl",
			"expandTweet",
			"enablePlayer",
			"openInWindow"
		],
		"edits": [
			{
				"start": 3956,
				"end": 3956,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4182,
				"end": 4182,
				"current": "",
				"baseline": "';\nimport type { SummalyResult } from '@misskey-dev/summaly"
			},
			{
				"start": 4677,
				"end": 4830,
				"current": ";\nimport type { SummalyResult } from '@misskey-dev/summaly';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/components/MkAbuseReport.vue",
		"currentSha256": "ae9b8ec69b43c4655b371cab0796212296406f6846b9311a12484435f55393a6",
		"baselineSha256": "decd6cd648647e2c8fa1ee2d45570374538795b5ef11ed9610f5808e17b17ee2",
		"keys": [
			"none",
			"moderator"
		],
		"order": [
			"resolve",
			"accept",
			"reject",
			"other",
			"forward",
			"forwardDescription",
			"target",
			"details",
			"reporter",
			"moderationNote",
			"none",
			"moderationNoteDescription",
			"moderator"
		],
		"edits": [
			{
				"start": 3686,
				"end": 3686,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3894,
				"end": 3894,
				"current": "",
				"baseline": ".vue';\nimport MkKeyValue from '@features/ui/frontend/components/MkKeyValue"
			},
			{
				"start": 4409,
				"end": 4503,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin-user.vue",
		"currentSha256": "36b1d5d5f165a987161b823f7a647dd74a8fab0872240b67431317ac48f51b98",
		"baselineSha256": "0ad6550df9a130897f4edffec30afde01df2461f829d05c1921226a75c21d9c0",
		"keys": [
			"notes",
			"createNew",
			"filter",
			"drive",
			"overview",
			"oneDay",
			"oneHour",
			"oneMonth",
			"oneWeek",
			"indefinitely",
			"period",
			"createdAt",
			"updatedAt",
			"announcements",
			"charts"
		],
		"order": [
			"remoteSuspended",
			"isSystemAccount",
			"instanceInfo",
			"createdAt",
			"lastActiveDate",
			"email",
			"moderationNote",
			"moderationNoteDescription",
			"updatedAt",
			"updateRemoteUser",
			"suspend",
			"resetPassword",
			"unsetMfa",
			"rolePolicies",
			"requireAdminForView",
			"unsetUserAvatar",
			"unsetUserBanner",
			"deleteAccount",
			"assign",
			"indefinitely",
			"createNew",
			"filter",
			"messageRead",
			"recentNHours",
			"recentNDays",
			"notes",
			"active",
			"archived",
			"resetPasswordConfirm",
			"newPasswordIs",
			"unsetMfaConfirm",
			"suspendConfirm",
			"unsuspendConfirm",
			"unsetUserAvatarConfirm",
			"unsetUserBannerConfirm",
			"deleteAllFilesConfirm",
			"deleteAccountConfirm",
			"typeToConfirm",
			"roleChooseRoleToAssign",
			"period",
			"oneHour",
			"oneDay",
			"oneWeek",
			"oneMonth",
			"unassign",
			"overview",
			"roles",
			"announcements",
			"drive",
			"charts",
			"userInfo"
		],
		"edits": [
			{
				"start": 9747,
				"end": 9747,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 10008,
				"end": 10008,
				"current": "",
				"baseline": "';\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue"
			},
			{
				"start": 11663,
				"end": 11843,
				"current": ";\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/abuse-report/notification-recipient.editor.vue",
		"currentSha256": "75d5ae87f8c144daaf6f206075f5067ccbe4496fc2d10a5771aa190e5e5221a2",
		"baselineSha256": "f92a6c69519b96084a34576d76cfd20f114b078673bc62f8dfdcc9f2c71d9f32",
		"keys": [
			"ok",
			"cancel",
			"title",
			"error",
			"createNew"
		],
		"order": [
			"abuseReportNotificationRecipientCreateRecipient",
			"abuseReportNotificationRecipientModifyRecipient",
			"title",
			"abuseReportNotificationRecipientRecipientType",
			"abuseReportNotificationRecipientNotifiedUser",
			"abuseReportNotificationRecipientNotifiedWebhook",
			"enable",
			"ok",
			"cancel",
			"abuseReportNotificationRecipientRecipientTypeMail",
			"abuseReportNotificationRecipientRecipientTypeWebhook",
			"abuseReportNotificationRecipientRecipientTypeCaptionsMail",
			"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook",
			"internalServerErrorDescription",
			"error",
			"createNew"
		],
		"edits": [
			{
				"start": 2477,
				"end": 2477,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2576,
				"end": 2576,
				"current": "",
				"baseline": "js';\nimport type { MkSystemWebhookResult } from '@features/integrations/frontend/components/MkSystemWebhookEditor.impl."
			},
			{
				"start": 3339,
				"end": 3552,
				"current": ";\nimport type { MkSystemWebhookResult } from '@features/integrations/frontend/components/MkSystemWebhookEditor.impl.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/abuse-report/notification-recipient.vue",
		"currentSha256": "da3b01bd0c412c7b0b5cb9cc32342162f6d8a9c8c262468f3e28af71f2e7b568",
		"baselineSha256": "01f037227367eac19ba540ccc4f02132d472e960e8f800064b080cda05301c19",
		"keys": [
			"all"
		],
		"order": [
			"createRecipient",
			"recipientType",
			"keywords",
			"all",
			"mail",
			"webhook",
			"deleteConfirm"
		],
		"edits": [
			{
				"start": 1205,
				"end": 1205,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1906,
				"end": 2000,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/abuses.vue",
		"currentSha256": "e5eedca14cdc14dcd644ddc292513560b0a24ba440eddfd3063728ed5c88f19a",
		"baselineSha256": "aa4a3543d5b24fa3ed7e6fa6d2d3dd464bf454f1adafc1fb655efb37c5718f2f",
		"keys": [
			"all"
		],
		"order": [
			"all",
			"unresolved",
			"resolved",
			"local",
			"remote",
			"abuseReports",
			"notificationSetting",
			"resolveTutorial",
			"state",
			"reporteeOrigin",
			"reporterOrigin"
		],
		"edits": [
			{
				"start": 1923,
				"end": 1923,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2551,
				"end": 2645,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/moderation.vue",
		"currentSha256": "3ff49394ac5af53555a1b943582ef54e85a7b55cb55e7efeb0706f12013e27f2",
		"baselineSha256": "7c95232a27f9ff2423a0e61c5a063a7afd30cc8df201a4d1cd4367870c5bd58b",
		"keys": [
			"save"
		],
		"order": [
			"all",
			"localOnly",
			"none",
			"acknowledgeNotesAndEnable",
			"moderation",
			"openRegistration",
			"thisSettingWillAutomaticallyOffWhenModeratorsInactive",
			"openRegistrationWarning",
			"emailRequiredForSignup",
			"recommended",
			"userGeneratedContentsVisibilityForVisitor",
			"userGeneratedContentsVisibilityForVisitor_description",
			"userGeneratedContentsVisibilityForVisitor_description2",
			"preservedUsernames",
			"preservedUsernamesDescription",
			"save",
			"sensitiveWords",
			"sensitiveWordsDescription",
			"sensitiveWordsDescription2",
			"prohibitedWords",
			"prohibitedWordsDescription",
			"prohibitedWordsDescription2",
			"prohibitedWordsForNameOfUser",
			"prohibitedWordsForNameOfUserDescription",
			"hiddenTags",
			"hiddenTagsDescription",
			"silencedInstances",
			"silencedInstancesDescription",
			"mediaSilencedInstances",
			"mediaSilencedInstancesDescription",
			"blockedInstances",
			"blockedInstancesDescription"
		],
		"expanded": true,
		"edits": [
			{
				"start": 7142,
				"end": 7142,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 7359,
				"end": 7359,
				"current": "",
				"baseline": ".vue';\nimport MkInput from '@features/ui/frontend/components/MkInput"
			},
			{
				"start": 8068,
				"end": 8162,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/modlog.ModLog.vue",
		"currentSha256": "83cae314d2b9fe42c14b9faabc4b0bb3b4ba71370f57a2ca497cfe4e9e1f9ee1",
		"baselineSha256": "75993c4492a85141edfca95d542b20f2f73fb617704ea7539b64b7a94d831a2b",
		"keys": [
			"moderator",
			"user"
		],
		"order": [
			"moderationLogTypesLabels",
			"moderator",
			"dateAndTime",
			"user",
			"role",
			"emoji"
		],
		"edits": [
			{
				"start": 14206,
				"end": 14206,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 14504,
				"end": 14598,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/moderation/frontend/pages/admin/modlog.vue",
		"currentSha256": "e3e4133e9a4bd6d3a1258331e83ffa5645349a7c4cb520ed3b1dae22d8929684",
		"baselineSha256": "586abf3922f71bf750bd0d7cb24c4ef856755d4acbac7ce7c01732c104a48b97",
		"keys": [
			"all",
			"moderator"
		],
		"order": [
			"type",
			"moderator",
			"loadMore",
			"all",
			"moderationLogTypesLabels",
			"moderationLogs"
		],
		"edits": [
			{
				"start": 1518,
				"end": 1518,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2520,
				"end": 2614,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/components/MkSuperMenu.vue",
		"currentSha256": "6eb287eddb49f135dfbfa37299272c88f2fca2332aba6bc52a866431306291cf",
		"baselineSha256": "a7f6806b9be47afac699ef03f0feef325af937e3c4ca57d044c736e26d574067",
		"keys": [
			"search"
		],
		"order": [
			"search"
		],
		"edits": [
			{
				"start": 2377,
				"end": 2413,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 2470,
				"end": 2470,
				"current": "",
				"baseline": "';\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport type { Awaitable } from '@features/ui/frontend/types/misc.js"
			},
			{
				"start": 2956,
				"end": 3014,
				"current": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n",
				"baseline": ""
			},
			{
				"start": 3214,
				"end": 3214,
				"current": "",
				"baseline": ".js';\nimport type { SearchIndexItem } from '@features/discovery/frontend/utility/inapp-search"
			},
			{
				"start": 3454,
				"end": 3617,
				"current": ".js';\nimport type { SearchIndexItem } from '@features/discovery/frontend/utility/inapp-search.js';\nimport type { Awaitable } from '@features/ui/frontend/types/misc",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/components/MkTutorialDialog.vue",
		"currentSha256": "5e00f091000c0afe667fefae5b4962843f241f8c487c0377306731a5e24750ef",
		"baselineSha256": "7f65a32fd00dacd1aad8c4510350c05468072b6573946e66cff985ede1ccef3a",
		"keys": [
			"close",
			"continue",
			"goBack"
		],
		"order": [
			"initialTutorialNoteTitle",
			"initialTutorialReactionTitle",
			"initialTutorialTimelineTitle",
			"initialTutorialPostNoteTitle",
			"initialTutorialHowToMakeAttachmentsSensitiveTitle",
			"initialTutorialTitle",
			"initialTutorialLandingTitle",
			"initialTutorialLandingDescription",
			"initialTutorialLaunchTutorial",
			"close",
			"goBack",
			"continue",
			"initialTutorialReactionReactToContinue",
			"initialTutorialHowToMakeAttachmentsSensitiveDoItToContinue",
			"initialTutorialDoneTitle",
			"initialTutorialDoneDescription",
			"help",
			"initialAccountSettingHaveFun",
			"initialTutorialSkipAreYouSure"
		],
		"edits": [
			{
				"start": 7485,
				"end": 7485,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8485,
				"end": 8579,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/navbar-messages.vue",
		"currentSha256": "6f83f64129ff81648c0e7e745dce272a1ae5cf40a2940bbb0f434a963b3cacad",
		"baselineSha256": "02369c6c5a500efaad1b2033bbb54f6bc7febef88439754e1ab3f5ca6932d168",
		"keys": [
			"search",
			"favorites",
			"lists",
			"reload",
			"antennas",
			"default",
			"drive",
			"clip",
			"announcements",
			"channel",
			"notifications"
		],
		"order": [
			"about",
			"achievements",
			"announcements",
			"antennas",
			"channel",
			"clearCache",
			"clip",
			"deck",
			"default",
			"directMessage_short",
			"drive",
			"explore",
			"favorites",
			"followRequests",
			"gallery",
			"lists",
			"lookup",
			"notifications",
			"pages",
			"profile",
			"qr",
			"reload",
			"search",
			"switchUi",
			"tools"
		]
	},
	{
		"file": "packages/features/navigation/frontend/pages/admin/index.vue",
		"currentSha256": "c54d57322a1b97798c9ebffac42824d969a94954428e6142d929a79ed7372371",
		"baselineSha256": "3ab426cb4b30b81518fbdfb2bd55f6f879d00acd957da2e88d1d6b9d55713623",
		"keys": [
			"customEmojis",
			"users",
			"settings",
			"info",
			"invite",
			"announcements",
			"user"
		],
		"order": [
			"controlPanel",
			"quickAction",
			"lookup",
			"createInviteCode",
			"administration",
			"dashboard",
			"users",
			"invite",
			"roles",
			"customEmojis",
			"avatarDecorations",
			"federation",
			"federationJobs",
			"jobQueue",
			"files",
			"announcements",
			"ads",
			"abuseReports",
			"moderationLogs",
			"settings",
			"general",
			"branding",
			"moderation",
			"emailServer",
			"objectStorage",
			"security",
			"relays",
			"externalServices",
			"performance",
			"info",
			"database",
			"user",
			"email",
			"file",
			"thereIsUnresolvedAbuseReportWarning",
			"check",
			"noMaintainerInformationWarning",
			"configure",
			"noInquiryUrlWarning",
			"noBotProtectionWarning",
			"noEmailServerWarning"
		],
		"edits": [
			{
				"start": 1728,
				"end": 1728,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1808,
				"end": 1808,
				"current": "",
				"baseline": "';\nimport type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu.vue';\nimport type { PageMetadata } from '@features/navigation/frontend/page.js"
			},
			{
				"start": 2618,
				"end": 2881,
				"current": ";\nimport type { PageMetadata } from '@features/navigation/frontend/page.js';\nimport type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/pages/settings/index.vue",
		"currentSha256": "71aaf8a10d4f40f98f0d0635883d38742b05f0776d7645305a6c62d6f655c1cb",
		"baselineSha256": "f3a3a1144c39efdf9b163598e748d694ea9576e8392d500d1cf799b162e39227",
		"keys": [
			"settings",
			"drive",
			"notifications"
		],
		"order": [
			"settings",
			"profile",
			"privacy",
			"notifications",
			"email",
			"security",
			"preferences",
			"theme",
			"emojiPalette",
			"sounds",
			"plugins",
			"drive",
			"muteAndBlock",
			"serviceConnection",
			"accountData",
			"other",
			"preferencesProfile",
			"clearCache",
			"logout",
			"logoutConfirm",
			"logoutWillClearClientData",
			"emailNotConfiguredWarning",
			"configure",
			"settingsPersistence_description1",
			"settingsPersistence_description2",
			"enable",
			"skip",
			"autoPreferencesBackupIsNotEnabledForThisDevice"
		],
		"edits": [
			{
				"start": 2009,
				"end": 2009,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2093,
				"end": 2093,
				"current": "",
				"baseline": "vue';\nimport type { PageMetadata } from '@features/navigation/frontend/page.js';\nimport type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu."
			},
			{
				"start": 3186,
				"end": 3449,
				"current": ";\nimport type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu.vue';\nimport type { PageMetadata } from '@features/navigation/frontend/page.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ts-messages.vue",
		"currentSha256": "4f6b4dd2c715ea8597723a05129654337816700b41beeda0c1871bec2b104b6a",
		"baselineSha256": "caa4bc84a4091195877101923f984ce5bbf4039cfe4bf0339d74cd7bd47dbaa7",
		"keys": [
			"customEmojis",
			"invite",
			"charts",
			"termsOfService",
			"privacyPolicy"
		],
		"order": [
			"scratchpad",
			"manageCustomEmojis",
			"manageAvatarDecorations",
			"instanceInfo",
			"customEmojis",
			"federation",
			"charts",
			"ads",
			"invite",
			"tools",
			"inquiry",
			"impressum",
			"termsOfService",
			"privacyPolicy",
			"document",
			"_initialTutorial",
			"aboutMisskey"
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/_common_/navbar-h.vue",
		"currentSha256": "ab293987edee2658f666685796568bf6fb4893730866af4600e12be7f9a67fec",
		"baselineSha256": "53b6142d79d9057e3ec04be6b2ce9ea9bc24486fc110aee63e470afd8a13995e",
		"keys": [
			"settings",
			"timeline"
		],
		"order": [
			"timeline",
			"controlPanel",
			"settings"
		],
		"edits": [
			{
				"start": 2776,
				"end": 2776,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3474,
				"end": 3568,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/_common_/navbar.vue",
		"currentSha256": "29369d40d2ba521d646a052e7eaabccdb0fab0e0456c701eea7986cc1a4d9236",
		"baselineSha256": "e35b64ec20fcd122c2b26fa100025aea40f0eafb89fc3e2ce5e306a4f5d1a9c5",
		"keys": [
			"settings",
			"more",
			"timeline"
		],
		"order": [
			"realtimeMode",
			"turnItOff",
			"turnItOn",
			"instance",
			"widgets",
			"timeline",
			"controlPanel",
			"more",
			"settings",
			"note",
			"account"
		],
		"edits": [
			{
				"start": 7267,
				"end": 7267,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8025,
				"end": 8119,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/deck.vue",
		"currentSha256": "19c11c581def4819b467ab1cb7d1b896971fd6a37bce2fb8e1b1918a07fe3c01",
		"baselineSha256": "49d17eff41a3d99e90c53600a8fec778ccd4444a3dd166e7ee76e2df7e6d7949",
		"keys": [
			"settings",
			"deleteAreYouSure",
			"deckColumnsLabels"
		],
		"order": [
			"deckIntroduction",
			"deckIntroduction2",
			"deckShowHowToUse",
			"deckProfile",
			"deckDeleteProfile",
			"deckAddColumn",
			"settings",
			"deckColumnsLabels",
			"deleteAreYouSure",
			"deckHowToUseAddColumn_title",
			"deckHowToUseAddColumn_description",
			"deckHowToUseSettings_title",
			"deckHowToUseSettings_description",
			"deckHowToUseSwitchProfile_title",
			"deckHowToUseSwitchProfile_description"
		],
		"edits": [
			{
				"start": 5061,
				"end": 5061,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 5113,
				"end": 5113,
				"current": "",
				"baseline": "vue';\nimport XCommon from './_common_/common."
			},
			{
				"start": 8064,
				"end": 8203,
				"current": ";\nimport XCommon from './_common_/common.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/deck/column.vue",
		"currentSha256": "65fac0e034b4dfda827e70340807494308d35da772efb191fbbfcbeeb3fbcd82",
		"baselineSha256": "d6de9766bff07a065f80cb323e11c468de17b0d3180df05cc97e8b5c154fd14b",
		"keys": [
			"reload",
			"name",
			"remove",
			"settings",
			"deckColumnsLabels"
		],
		"order": [
			"settings",
			"reload",
			"deckConfigureColumn",
			"deckColumnsLabels",
			"name",
			"width",
			"deckUsedAsMinWidthWhenFlexible",
			"deckFlexible",
			"deckSwapLeft",
			"deckSwapRight",
			"deckSwapUp",
			"deckSwapDown",
			"move",
			"deckStackLeft",
			"deckPopRight",
			"remove"
		],
		"edits": [
			{
				"start": 2065,
				"end": 2065,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2152,
				"end": 2152,
				"current": "",
				"baseline": "';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js"
			},
			{
				"start": 2682,
				"end": 2923,
				"current": ";\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/deck/widgets-column.vue",
		"currentSha256": "ba6300225f2f48469d6145ddc08cb844f370484fb6b56f29dfc1170ff0ae8d5f",
		"baselineSha256": "f9d7c5a2f7d026c655547496bbc2fc7cfc5c6cd757ab16763a3e8ba8eaf6e710",
		"keys": [
			"deckColumnsLabels"
		],
		"order": [
			"deckColumnsLabels",
			"deckWidgetsIntroduction",
			"editWidgets"
		],
		"edits": [
			{
				"start": 857,
				"end": 857,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 871,
				"end": 871,
				"current": "",
				"baseline": "vue';\nimport XColumn from './column.vue';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { Widget } from '@features/ui/frontend/components/MkWidgets."
			},
			{
				"start": 1171,
				"end": 1449,
				"current": ";\nimport XColumn from './column.vue';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { Widget } from '@features/ui/frontend/components/MkWidgets.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/note-search/frontend/pages/search.note.vue",
		"currentSha256": "dd48754152401497621f681f8593d68c7df6a4185e8a92f6e0d73b90d3f1a2f0",
		"baselineSha256": "bd432936dd611d7a5d20e7c212b0fcd61b431dd6b7902c8ea7721f843a10fb62",
		"keys": [
			"search"
		],
		"order": [
			"searchScopeAll",
			"searchScopeLocal",
			"searchScopeServer",
			"searchScopeUser",
			"lookupConfirm",
			"openTagPageConfirm",
			"options",
			"postFrom",
			"postTo",
			"serverHostPlaceholder",
			"pleaseEnterServerHost",
			"pleaseSelectUser",
			"selectSelf",
			"selectUser",
			"search",
			"searchResult"
		],
		"expanded": true,
		"edits": [
			{
				"start": 3341,
				"end": 3341,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 4554,
				"end": 4612,
				"current": "globalLocale = useLocale<Locale>(import.meta.url);\n\nconst ",
				"baseline": ""
			},
			{
				"start": 5166,
				"end": 5167,
				"current": "L",
				"baseline": "Deta"
			},
			{
				"start": 5168,
				"end": 5169,
				"current": "t",
				"baseline": "l"
			},
			{
				"start": 5170,
				"end": 5170,
				"current": "",
				"baseline": "d"
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkCwButton.vue",
		"currentSha256": "8ff5a8abfdcdabf21e56b743d958dd0905ae43e54e15bb0a59672ad3b386739c",
		"baselineSha256": "236efc0c0a4263e34e159071e5a42bc59119b25a8b9aa5c2164ff52235028a96",
		"keys": [
			"poll",
			"quote"
		],
		"order": [
			"chars",
			"quote",
			"files",
			"poll",
			"hide",
			"show"
		],
		"edits": [
			{
				"start": 406,
				"end": 406,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 467,
				"end": 467,
				"current": "",
				"baseline": "';\nimport type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue"
			},
			{
				"start": 715,
				"end": 907,
				"current": ";\nimport type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNote.vue",
		"currentSha256": "9515f011ff59a48c11a6a9dedeb614833b3a883ead7d6c90ef44cb2040c99703",
		"baselineSha256": "3597d07b43a0da15864b7b5bd8d7c7f81ccdc5692f661cc8c5f3097979ba2a22",
		"keys": [
			"more",
			"showMore",
			"showLess",
			"private",
			"deletedNote",
			"userSaysSomething",
			"visibilityLabels"
		],
		"order": [
			"pinnedNote",
			"renotedBy",
			"visibilityLabels",
			"deletedNote",
			"private",
			"translatedFrom",
			"showMore",
			"showLess",
			"more",
			"userSaysSomethingSensitive",
			"userSaysSomething",
			"userSaysSomethingAbout"
		],
		"edits": [
			{
				"start": 9832,
				"end": 9832,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 9880,
				"end": 9880,
				"current": "",
				"baseline": " } from 'vue';\nimport type { Ref"
			},
			{
				"start": 10716,
				"end": 10716,
				"current": "",
				"baseline": "import type { Keymap } from '@features/ui/frontend/utility/hotkey.js';\n"
			},
			{
				"start": 11462,
				"end": 11659,
				"current": ";\nimport type { Keymap } from '@features/ui/frontend/utility/hotkey.js';\nimport type { Ref } from 'vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteDetailed.vue",
		"currentSha256": "e406eb732306740cda5dce6b208a80e5961fe6e48968f4efad7447efb95e5b23",
		"baselineSha256": "3d8df1af3644c30406bff95d30f51e371f0a5d71f2b0478e462833d4319d7052",
		"keys": [
			"private",
			"deletedNote",
			"userSaysSomething",
			"visibilityLabels"
		],
		"order": [
			"loadConversation",
			"renotedBy",
			"visibilityLabels",
			"deletedNote",
			"private",
			"translatedFrom",
			"replies",
			"renotes",
			"reactions",
			"loadReplies",
			"userSaysSomething"
		],
		"edits": [
			{
				"start": 12230,
				"end": 12230,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 13167,
				"end": 13167,
				"current": "",
				"baseline": ".js';\nimport type { Keymap } from '@features/ui/frontend/utility/hotkey"
			},
			{
				"start": 14156,
				"end": 14321,
				"current": ";\nimport type { Keymap } from '@features/ui/frontend/utility/hotkey.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteDraftsDialog.vue",
		"currentSha256": "8f6a47eefc2526698879aec79b1dec610de5d2ea6c1e8601fe38d81e90579681",
		"baselineSha256": "50d443bf032924e0814e04f47c2760ed44a602680fb1a022112056882224c3bc",
		"keys": [
			"deletedNote",
			"visibilityLabels"
		],
		"order": [
			"draftsAndScheduledNotes",
			"drafts",
			"scheduled",
			"draftsNoDrafts",
			"scheduledToPostOnX",
			"draftsReplyTo",
			"deletedNote",
			"draftsQuoteOf",
			"draftsPostTo",
			"visibilityLabels",
			"draftsCancelSchedule",
			"draftsRestore",
			"draftsDelete",
			"draftsDeleteAreYouSure"
		],
		"edits": [
			{
				"start": 5617,
				"end": 5617,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 6589,
				"end": 6683,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteHeader.vue",
		"currentSha256": "54b888712eaa6093aefeeffdff395197cc82cb0d66aa62e0a0a77dd36f2eeef3",
		"baselineSha256": "171b0662cf42a36318df164ca7f294790495e7c55124e88319ee49fb527782c9",
		"keys": [
			"visibilityLabels"
		],
		"order": [
			"visibilityLabels"
		],
		"edits": [
			{
				"start": 1690,
				"end": 1690,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2029,
				"end": 2123,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteMediaGrid.vue",
		"currentSha256": "e61e21d792d66072ef5683355ad12c620483d717a370aafc62f22c42ef55d048",
		"baselineSha256": "3a3b184442f07a3bbab3b20136175456ed8a68e73641e2ccadf5805f968250b4",
		"keys": [
			"sensitive"
		],
		"order": [
			"sensitive",
			"image",
			"clickToShow"
		],
		"edits": [
			{
				"start": 1371,
				"end": 1371,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1835,
				"end": 1929,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteSimple.vue",
		"currentSha256": "0a765aecbd63e55e20c8d7ae17455dfe699002cf9bfd50e9ef686baee5a51d9a",
		"baselineSha256": "ec5e9119b9f58a11cf28866abfc23793ba619d72a5265f02d4369df8627fb72f",
		"keys": [
			"deletedNote"
		],
		"order": [
			"deletedNote"
		],
		"edits": [
			{
				"start": 999,
				"end": 999,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1375,
				"end": 1469,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkNoteSub.vue",
		"currentSha256": "491dae9988714dfb73da4a7ba30c09aba2fd34f116183f7224ec723311824837",
		"baselineSha256": "3bc1872e2fa388c129541f151e5bf58ad911106c7dfc76a72a88dc84a1375d47",
		"keys": [
			"deletedNote",
			"userSaysSomething"
		],
		"order": [
			"deletedNote",
			"continueThread",
			"userSaysSomething"
		],
		"edits": [
			{
				"start": 1743,
				"end": 1743,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2403,
				"end": 2497,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkPollEditor.vue",
		"currentSha256": "44e2e80b15625919057e121af4fba7f72979289b07aa47c192723600f1a231aa",
		"baselineSha256": "836da7444d8989cb4ebfb3cd81ff608ae136aeed5c8dc7df583908fa61eb8c7e",
		"keys": [
			"add"
		],
		"order": [
			"pollNoOnlyOneChoice",
			"pollChoiceN",
			"add",
			"pollNoMore",
			"pollCanMultipleVote",
			"pollExpiration",
			"pollDeadlineDate",
			"pollDeadlineTime",
			"pollDuration",
			"pollInfinite",
			"pollAt",
			"pollAfter",
			"timeSecond",
			"timeMinute",
			"timeHour",
			"timeDay"
		],
		"edits": [
			{
				"start": 1795,
				"end": 1795,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2443,
				"end": 2537,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkPostForm.vue",
		"currentSha256": "934a67f3125f5bf6e031aca8c96fc8e2c127e385bc3dac6ced9c5aa326c80f0b",
		"baselineSha256": "3091bfb061e2e184481826df10ee9e70be8db06a7342dcdf6bb0d771bb171123",
		"keys": [
			"cancel",
			"upload",
			"preview",
			"reset",
			"all",
			"add",
			"yes",
			"no",
			"fromDrive",
			"visibility",
			"poll",
			"visibilityDisableFederation",
			"resetAreYouSure",
			"quote",
			"reply",
			"visibilityLabels"
		],
		"order": [
			"account",
			"visibility",
			"visibilityLabels",
			"visibilityDisableFederation",
			"other",
			"quoteAttached",
			"recipient",
			"postFormShowHowToUse",
			"scheduleToPostOnX",
			"cancel",
			"notSpecifiedMentionWarning",
			"add",
			"annotation",
			"hashtags",
			"postFormUploaderTip",
			"attachFile",
			"upload",
			"fromDrive",
			"poll",
			"useCw",
			"mention",
			"addMfmFunction",
			"plugins",
			"emoji",
			"postFormQuotePlaceholder",
			"postFormReplyPlaceholder",
			"postFormChannelPlaceholder",
			"postFormPlaceholdersA",
			"postFormPlaceholdersB",
			"postFormPlaceholdersC",
			"postFormPlaceholdersD",
			"postFormPlaceholdersE",
			"postFormPlaceholdersF",
			"schedule",
			"quote",
			"reply",
			"note",
			"disableFederationConfirm",
			"disableFederationConfirmWarn",
			"disableFederationOk",
			"neverShow",
			"reactionAcceptance",
			"all",
			"likeOnlyForRemote",
			"nonSensitiveOnly",
			"nonSensitiveOnlyForLocalLikeOnlyForRemote",
			"likeOnly",
			"draftsSaveToDraft",
			"draftsCannotCreateDraft",
			"schedulePost",
			"preview",
			"reset",
			"resetAreYouSure",
			"quoteQuestion",
			"attachAsFileQuestion",
			"thisPostMayBeAnnoying",
			"thisPostMayBeAnnoyingHome",
			"thisPostMayBeAnnoyingCancel",
			"thisPostMayBeAnnoyingIgnore",
			"draftsListDrafts",
			"draftsListScheduledNotes",
			"postFormHowToUseContent_title",
			"postFormHowToUseContent_description",
			"postFormHowToUseToolbar_title",
			"postFormHowToUseToolbar_description",
			"postFormHowToUseAccount_title",
			"postFormHowToUseAccount_description",
			"postFormHowToUseVisibility_title",
			"postFormHowToUseVisibility_description",
			"postFormHowToUseMenu_title",
			"postFormHowToUseMenu_description",
			"postFormHowToUseSubmit_title",
			"postFormHowToUseSubmit_description",
			"postFormQuitInspiteOfThereAreUnuploadedFilesConfirm",
			"yes",
			"no"
		],
		"edits": [
			{
				"start": 8483,
				"end": 8483,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8949,
				"end": 8949,
				"current": "",
				"baseline": "';\nimport type { ShallowRef } from 'vue';\nimport type { PostFormProps } from '../types/post-form.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';\nimport type { UploaderItem } from '@features/drive/frontend/composables/use-uploader.js"
			},
			{
				"start": 11458,
				"end": 11916,
				"current": ";\nimport type { UploaderItem } from '@features/drive/frontend/composables/use-uploader.js';\nimport type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { PostFormProps } from '../types/post-form.js';\nimport type { ShallowRef } from 'vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkPostFormAttaches.vue",
		"currentSha256": "a081496e01815789f9af4f1a48c8bc05e1fd766d0d8437bb7fcbdcb3d199c399",
		"baselineSha256": "fc921da54d2363be68f4de16fd2f4773d03210f4c7e24ec0fb9033b5a0da3983",
		"keys": [
			"preview",
			"markAsSensitive",
			"unmarkAsSensitive",
			"driveFileDeleteConfirm"
		],
		"order": [
			"driveFileDeleteConfirm",
			"enterFileName",
			"renameFile",
			"unmarkAsSensitive",
			"markAsSensitive",
			"describeFile",
			"preview",
			"attachCancel",
			"deleteFile",
			"copyFileId"
		],
		"edits": [
			{
				"start": 1259,
				"end": 1259,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1318,
				"end": 1318,
				"current": "",
				"baseline": "';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu"
			},
			{
				"start": 2012,
				"end": 2099,
				"current": "{ isPreviewable, getType } from '@features/drive/frontend/utility/lightbox.js';\nimport ",
				"baseline": ""
			},
			{
				"start": 2187,
				"end": 2187,
				"current": "",
				"baseline": "{ isPreviewable, ge"
			},
			{
				"start": 2188,
				"end": 2188,
				"current": "",
				"baseline": "T"
			},
			{
				"start": 2191,
				"end": 2202,
				"current": " { MenuItem",
				"baseline": ""
			},
			{
				"start": 2221,
				"end": 2223,
				"current": "na",
				"baseline": "dri"
			},
			{
				"start": 2224,
				"end": 2231,
				"current": "igation",
				"baseline": "e"
			},
			{
				"start": 2241,
				"end": 2241,
				"current": "",
				"baseline": "utili"
			},
			{
				"start": 2243,
				"end": 2245,
				"current": "pe",
				"baseline": "/lightbox.j"
			},
			{
				"start": 2246,
				"end": 2251,
				"current": "/menu",
				"baseline": ""
			},
			{
				"start": 2252,
				"end": 2346,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkReactionsViewer.reaction.vue",
		"currentSha256": "3617acc9be57b2de8e9b9d689a3759b4c5fd689904f403b5ba068bb418a9a88f",
		"baselineSha256": "1b345ae5a35422750fee48d03a8ce0eaf1ac930d713f5a268e818170ee722485",
		"keys": [
			"info"
		],
		"order": [
			"changeReactionConfirm",
			"cancelReactionConfirm",
			"reactAreYouSure",
			"info",
			"emojiUnmute",
			"unmuteX",
			"emojiMute",
			"muteX",
			"addToEmojiPalette"
		],
		"edits": [
			{
				"start": 798,
				"end": 798,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1219,
				"end": 1219,
				"current": "",
				"baseline": "';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu"
			},
			{
				"start": 2601,
				"end": 2769,
				"current": ";\nimport type { MenuItem } from '@features/navigation/frontend/types/menu';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkSubNoteContent.vue",
		"currentSha256": "abf544c9aba6c90a82930b8a49f2d69d0a6e972a069084a47d27db88e28e9783",
		"baselineSha256": "f1cd2226286118852ac5aa0636bee47f03b654ea2a27e79cf7bcac51ff1686e3",
		"keys": [
			"showMore",
			"showLess",
			"private",
			"deletedNote",
			"poll",
			"withNFiles"
		],
		"order": [
			"private",
			"deletedNote",
			"withNFiles",
			"poll",
			"showMore",
			"showLess"
		],
		"edits": [
			{
				"start": 1825,
				"end": 1825,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2217,
				"end": 2311,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkTutorialDialog.Note.vue",
		"currentSha256": "7aa1d846917b3e56ffc53cb65ddd7d84d031e130f157ad89fb8b1d52d82fc9bf",
		"baselineSha256": "4cf12563beae1532b5353c287bf39785ab89e1bc60f11d030ad4dbded45480cd",
		"keys": [
			"reply",
			"renote"
		],
		"order": [
			"initialTutorialNoteDescription",
			"reply",
			"initialTutorialNoteReply",
			"renote",
			"initialTutorialNoteRenote",
			"reaction",
			"initialTutorialNoteReaction",
			"menu",
			"initialTutorialNoteMenu",
			"initialTutorialReactionDescription",
			"initialTutorialReactionLetsTryReacting",
			"initialTutorialWellDone",
			"initialTutorialReactionReactNotification",
			"initialTutorialReactionReactDone"
		],
		"edits": [
			{
				"start": 1647,
				"end": 1647,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1969,
				"end": 2063,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkTutorialDialog.PostNote.vue",
		"currentSha256": "a7c418151134f385908fb955911a7cfe266fb98cc6cdcbda74834694ea942cc7",
		"baselineSha256": "17f155259c4987f70a8aab8589261b611b158d23312ed36bd9dd68465a17373f",
		"keys": [
			"visibility",
			"visibilityDisableFederation"
		],
		"order": [
			"initialTutorialPostNoteDescription1",
			"visibility",
			"initialTutorialPostNoteVisibilityDescription",
			"visibilityPublic",
			"initialTutorialPostNoteVisibilityPublic",
			"visibilityHome",
			"initialTutorialPostNoteVisibilityHome",
			"visibilityFollowers",
			"initialTutorialPostNoteVisibilityFollowers",
			"visibilitySpecified",
			"initialTutorialPostNoteVisibilityDirect",
			"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1",
			"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2",
			"visibilityDisableFederation",
			"initialTutorialPostNoteVisibilityLocalOnly",
			"initialTutorialPostNoteCwTitle",
			"initialTutorialPostNoteCwDescription",
			"initialTutorialPostNoteCwUseCases",
			"initialTutorialPostNoteCwExampleNoteNote",
			"initialTutorialPostNoteCwExampleNoteCw"
		],
		"edits": [
			{
				"start": 1997,
				"end": 1997,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2350,
				"end": 2444,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/components/MkVisibilityPicker.vue",
		"currentSha256": "693cebcfc8b2c7ad7461de7b96d4d0d0d1c61e69993b45ac9a0e56a7c2e6094e",
		"baselineSha256": "3751be50ceb65b97456a6b5f921124fd4eed08c566a03c1876795ebc4fba51ee",
		"keys": [
			"visibility"
		],
		"order": [
			"visibility",
			"public",
			"publicDescription",
			"home",
			"homeDescription",
			"followers",
			"followersDescription",
			"specified",
			"specifiedDescription"
		],
		"edits": [
			{
				"start": 2372,
				"end": 2372,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2523,
				"end": 2617,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/embed/components/EmNote.vue",
		"currentSha256": "6b07cf0e69565e9ff8c86466edf8fb29aef07729fb780d7cfa002e44b19d69b3",
		"baselineSha256": "32e6abb203fb351465a5ad5fa664ea970fd99488e05fec5a46b4d2be045f9f95",
		"keys": [
			"more",
			"showMore",
			"showLess",
			"private",
			"visibilityLabels",
			"cwHide",
			"cwShow"
		],
		"order": [
			"pinnedNote",
			"renotedBy",
			"visibilityLabels",
			"cwHide",
			"cwShow",
			"private",
			"showMore",
			"showLess",
			"more"
		],
		"edits": [
			{
				"start": 6100,
				"end": 6100,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 7589,
				"end": 7683,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/embed/components/EmNoteDetailed.vue",
		"currentSha256": "51718f6ade2f6b76081c7238cbdeecbcb02152108b67daded0021dec7116c8e1",
		"baselineSha256": "c3bfe34d9e8e77975562aa35705d44d1dd47bcacb84eb021c6546bf299058cca",
		"keys": [
			"more",
			"showMore",
			"showLess",
			"private",
			"visibilityLabels",
			"cwHide",
			"cwShow"
		],
		"order": [
			"renotedBy",
			"visibilityLabels",
			"cwHide",
			"cwShow",
			"private",
			"showMore",
			"showLess",
			"more"
		],
		"edits": [
			{
				"start": 6986,
				"end": 6986,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8577,
				"end": 8671,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/embed/components/EmNoteSimple.vue",
		"currentSha256": "966002a8dc2d4c52d367c7262568270f797ff28aed7d3b672ca6c100b5fe454c",
		"baselineSha256": "42c0488d1d4377c70e6c182938c69a63562eb3cedd1aab56fd39941bf2a80c2d",
		"keys": [
			"cwHide",
			"cwShow"
		],
		"order": [
			"cwHide",
			"cwShow"
		],
		"edits": [
			{
				"start": 963,
				"end": 963,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1354,
				"end": 1448,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/embed/components/EmNoteSub.vue",
		"currentSha256": "7f3b3fe1b83e6082c76b1478bdfe53460f7d290be594ddc1744156f6c5959d8a",
		"baselineSha256": "8a72368d210b931a37aa311415338db6f70bd546f6aa4c5cc574650939b46486",
		"keys": [
			"cwHide",
			"cwShow"
		],
		"order": [
			"cwHide",
			"cwShow",
			"continueThread"
		],
		"edits": [
			{
				"start": 1461,
				"end": 1461,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2068,
				"end": 2162,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/embed/components/EmSubNoteContent.vue",
		"currentSha256": "3f4784093160fc218a1b4d5e247452564f0b1a9091e196d1aa6dcafda50e6d79",
		"baselineSha256": "a760537050f1bb244dac7ba5a8e2e51e3797d3d1909773731fde589a4482d95a",
		"keys": [
			"showMore",
			"showLess",
			"private",
			"deletedNote",
			"poll",
			"withNFiles"
		],
		"order": [
			"private",
			"deletedNote",
			"withNFiles",
			"poll",
			"showMore",
			"showLess"
		],
		"edits": [
			{
				"start": 1606,
				"end": 1606,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2221,
				"end": 2315,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/pages/note.vue",
		"currentSha256": "b995ac40a062131d686b43ee3a187717dc087a64e80e0d3263e125e12851d24a",
		"baselineSha256": "1bc3bcade1e6cdbb61a4e5b7b48af875d03bbb12e273e49aa380bb7bc8793373",
		"keys": [
			"clip",
			"noteOf"
		],
		"order": [
			"thisContentsAreMarkedAsSigninRequiredByAuthor",
			"signinOrContinueOnRemote",
			"note",
			"noteOf",
			"clip"
		],
		"edits": [
			{
				"start": 575,
				"end": 575,
				"current": "",
				"baseline": " "
			},
			{
				"start": 2423,
				"end": 2423,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3775,
				"end": 3869,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/pages/user/index.files.vue",
		"currentSha256": "6bc2be61614c99ffa3ebd3ffd9c4e750af22ebe139c7cf2935d65d184a40683e",
		"baselineSha256": "cb7da4c1101a48d00c49b245fa345830a410c7c0664895f4c2e80bf6935b4159",
		"keys": [
			"showMore"
		],
		"order": [
			"files",
			"showMore",
			"nothing"
		],
		"edits": [
			{
				"start": 801,
				"end": 801,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1178,
				"end": 1272,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/pages/user/notes.vue",
		"currentSha256": "523090bbfe29d0e1a4178b62919bab4cf90aaf6394f2117adef6a3a8c0937186",
		"baselineSha256": "e16ec45a6932a2c3b55aa2695bf5a255944fe7d7a4b8389beb70f4fdcbf1e373",
		"keys": [
			"notes",
			"all"
		],
		"order": [
			"featured",
			"notes",
			"all",
			"withFiles"
		],
		"edits": [
			{
				"start": 893,
				"end": 893,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1196,
				"end": 1290,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notes/frontend/ts-messages.vue",
		"currentSha256": "005cfda90478f0f75a3708d5a036056b5ef01c6009be04a2f143e8a9db2bbf8e",
		"baselineSha256": "2e2f6ab78666277940fdca6b3a2cde6c64fbb452b91703e9baeba443923cb650",
		"keys": [
			"cancel",
			"delete",
			"name",
			"description",
			"none",
			"continue",
			"createNew",
			"share",
			"embed",
			"public",
			"deletedNote",
			"poll",
			"clip",
			"favorite",
			"unfavorite",
			"channel",
			"user",
			"noteOf",
			"withNFiles",
			"quote",
			"renote"
		],
		"order": [
			"_cw",
			"reactAreYouSure",
			"unrenote",
			"renoteDetails",
			"viewRenotedChannel",
			"copyLinkRenote",
			"reportAbuseRenote",
			"none",
			"_soundSettings",
			"sound",
			"file",
			"continue",
			"cancel",
			"volume",
			"listen",
			"confirmToUnclipAlreadyClippedNote",
			"clipNoteLimitExceeded",
			"createNew",
			"createNewClip",
			"name",
			"description",
			"public",
			"noteDeleteConfirm",
			"deleteAndEditConfirm",
			"pinLimitExceeded",
			"removeNoteFromAntennaConfirm",
			"numberOfDays",
			"noteOf",
			"unclip",
			"details",
			"copyContent",
			"copyLink",
			"copyRemoteLink",
			"showOnRemote",
			"embed",
			"share",
			"translate",
			"unfavorite",
			"favorite",
			"clip",
			"unmuteThread",
			"muteThread",
			"unpin",
			"pin",
			"user",
			"reportAbuse",
			"channel",
			"deleteAndEdit",
			"removeFromAntenna",
			"delete",
			"copyNoteId",
			"inChannelRenote",
			"renoted",
			"inChannelQuote",
			"renote",
			"quote",
			"renoteToOtherChannel",
			"renoteToChannel",
			"renotedToX",
			"deletedNote",
			"invisibleNote",
			"withNFiles",
			"poll"
		]
	},
	{
		"file": "packages/features/notifications/frontend/components/MkNotification.vue",
		"currentSha256": "7b77d03b660aa58084fd40d8a93f5060beded5959c526e13ea51bd3f765961a4",
		"baselineSha256": "3ec05f2de99a4e5e50f12711f19e90e3457913568130f20874305842c9a92c61",
		"keys": [
			"favorites",
			"lists",
			"notes",
			"following",
			"customEmojis",
			"mutedUsers",
			"blockedUsers",
			"accept",
			"reject",
			"antennas",
			"clips"
		],
		"order": [
			"notificationPollEnded",
			"notificationScheduledNotePosted",
			"notificationScheduledNotePostFailed",
			"notificationNewNote",
			"notificationRoleAssigned",
			"notificationChatRoomInvitationReceived",
			"notificationAchievementEarned",
			"notificationLogin",
			"notificationCreateToken",
			"notificationTestNotification",
			"notificationExportOfXCompleted",
			"notificationLikedBySomeUsers",
			"notificationReactedBySomeUsers",
			"notificationRenotedBySomeUsers",
			"achievementsTypesLabels",
			"showFile",
			"notificationCreateTokenDescription",
			"manageAccessTokens",
			"youGotNewFollower",
			"followRequestAccepted",
			"receiveFollowRequest",
			"accept",
			"reject",
			"notificationNotificationWillBeDisplayedLikeThis",
			"antennas",
			"blockedUsers",
			"clips",
			"customEmojis",
			"favorites",
			"following",
			"mutedUsers",
			"notes",
			"lists"
		],
		"edits": [
			{
				"start": 13265,
				"end": 13265,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 14037,
				"end": 14131,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/components/MkNotificationSelectWindow.vue",
		"currentSha256": "8a5ea3391a72c15bd8f3a2cc0cca61f9d47d716130881807e1d262ae5f61b930",
		"baselineSha256": "6a3a9464709b2e84b93d08f1a8e41fc181398df91b4e6dd36e4308637f4eb88b",
		"keys": [
			"enableAll",
			"disableAll",
			"notificationTypesLabels"
		],
		"order": [
			"notificationSetting",
			"notificationSettingDesc",
			"disableAll",
			"enableAll",
			"notificationTypesLabels"
		],
		"edits": [
			{
				"start": 1045,
				"end": 1045,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1342,
				"end": 1342,
				"current": "",
				"baseline": "type { Ref } from 'vue';\nimport "
			},
			{
				"start": 1506,
				"end": 1632,
				"current": ";\nimport type { Ref } from 'vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/pages/notifications.vue",
		"currentSha256": "d025d8760102e59f11fc6ad7eeaeb3044744c1ea0f67a59b7c8336835f80913e",
		"baselineSha256": "6796fd12a7b447a03ca3440d98dc764558eeb1e81e26cd84e8efa6c0b5566628",
		"keys": [
			"markAllAsRead",
			"all",
			"filter",
			"notifications",
			"notificationTypesLabels"
		],
		"order": [
			"notificationTypesLabels",
			"clear",
			"filter",
			"markAllAsRead",
			"all",
			"mentions",
			"directNotes",
			"notifications"
		],
		"edits": [
			{
				"start": 742,
				"end": 742,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 824,
				"end": 824,
				"current": "",
				"baseline": "js';\nimport type { PageHeaderItem } from '@features/navigation/frontend/types/page-header."
			},
			{
				"start": 1331,
				"end": 1515,
				"current": ";\nimport type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/pages/settings/notifications.notification-config.vue",
		"currentSha256": "8835829c8c3c86c54e2c672fd2b7ea5bdfb6ee4b9eb2035ce394e9713a182ad0",
		"baselineSha256": "17e3110fbd3866c59c8cfa03a24d7d14d1c6cea4cc2e6b29b8311834cfb5bf25",
		"keys": [
			"save",
			"none",
			"all",
			"following",
			"followers"
		],
		"order": [
			"all",
			"following",
			"followers",
			"mutualFollow",
			"followingOrFollower",
			"userList",
			"none",
			"save"
		],
		"expanded": true,
		"edits": [
			{
				"start": 680,
				"end": 680,
				"current": "",
				"baseline": "globalLocale = useLocale<Locale>(import.meta.url);\n\nconst "
			},
			{
				"start": 801,
				"end": 802,
				"current": ",",
				"baseline": ""
			},
			{
				"start": 995,
				"end": 1053,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/pages/settings/notifications.vue",
		"currentSha256": "375013b98b05786f47ea555ae36dbb1d7f65177e63943c451b4a5cb7fbedba19",
		"baselineSha256": "91206c1c60857fb1cb4d982f5dc589098d66a2299216f0bd9cf634daa6876afc",
		"keys": [
			"following",
			"none",
			"all",
			"resetAreYouSure",
			"followers",
			"notifications",
			"notificationTypesLabels"
		],
		"order": [
			"notifications",
			"settingsNotificationsBanner",
			"notificationRecieveConfig",
			"notificationTypesLabels",
			"none",
			"following",
			"followers",
			"mutualFollow",
			"followingOrFollower",
			"userList",
			"all",
			"notifyUsers",
			"notificationSoundSettings",
			"markAsReadAllNotifications",
			"notificationSendTestNotification",
			"notificationFlushNotification",
			"pushNotification",
			"sendPushNotificationReadMessage",
			"sendPushNotificationReadMessageCaption",
			"unnotifyNotes",
			"notifyNotes",
			"resetAreYouSure"
		],
		"edits": [
			{
				"start": 4000,
				"end": 4000,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4168,
				"end": 4168,
				"current": "",
				"baseline": " from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';\nimport type { NotificationConfig }"
			},
			{
				"start": 5479,
				"end": 5702,
				"current": ";\nimport type { NotificationConfig } from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/widgets/WidgetNotifications.vue",
		"currentSha256": "9fa79fc04cb84ca4b2264783114fd5c27567987e85f053088a45adfa03dbeb1d",
		"baselineSha256": "c831f6da2fd37385ab44e56fecf1d16f6f214f242be6c81ce0069982e75058f0",
		"keys": [
			"notifications"
		],
		"order": [
			"notifications",
			"showHeader",
			"height"
		],
		"edits": [
			{
				"start": 801,
				"end": 801,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 835,
				"end": 1091,
				"current": "';\nimport MkContainer from '@features/ui/frontend/components/MkContainer.vue';\nimport MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';\nimport * as os from '@features/ui/frontend/os.js",
				"baseline": ""
			},
			{
				"start": 1499,
				"end": 1499,
				"current": "",
				"baseline": "MkCon"
			},
			{
				"start": 1500,
				"end": 1502,
				"current": "yp",
				"baseline": "ain"
			},
			{
				"start": 1503,
				"end": 1514,
				"current": " { Locale }",
				"baseline": "r"
			},
			{
				"start": 1521,
				"end": 1521,
				"current": "",
				"baseline": "@features/u"
			},
			{
				"start": 1522,
				"end": 1524,
				"current": "18",
				"baseline": "/fro"
			},
			{
				"start": 1525,
				"end": 1525,
				"current": "",
				"baseline": "tend/components/MkContainer.vue"
			},
			{
				"start": 1528,
				"end": 1568,
				"current": "\nconst globalLocale = useLocale<Locale>(",
				"baseline": ""
			},
			{
				"start": 1574,
				"end": 1575,
				"current": ".",
				"baseline": " MkStreamingNotificationsTi"
			},
			{
				"start": 1577,
				"end": 1577,
				"current": "",
				"baseline": "line from '@fea"
			},
			{
				"start": 1578,
				"end": 1580,
				"current": "a.",
				"baseline": ""
			},
			{
				"start": 1582,
				"end": 1582,
				"current": "",
				"baseline": "es/notifications/frontend/components/MkStreamingNotificationsTime"
			},
			{
				"start": 1583,
				"end": 1584,
				"current": ")",
				"baseline": "ine.vue';\nimport * as os from '@features/ui/frontend/os.js'"
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/pages/admin/job-queue.job.vue",
		"currentSha256": "9cf735c64137020bd10ddafe3a524c0ff8f34539521053e38fb7e7e3d5fdde57",
		"baselineSha256": "496dfdd78b3143a968b9549b8e19e89542589d17bfc24e10848886c2f43ce380",
		"keys": [
			"areYouSure"
		],
		"order": [
			"areYouSure"
		],
		"edits": [
			{
				"start": 6875,
				"end": 6875,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 6968,
				"end": 6968,
				"current": "",
				"baseline": "';\nimport type { TlEvent } from '@features/ui/frontend/components/MkTl.vue"
			},
			{
				"start": 7600,
				"end": 7768,
				"current": ";\nimport type { TlEvent } from '@features/ui/frontend/components/MkTl.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/pages/admin/job-queue.vue",
		"currentSha256": "fb87f2298da9e5fe779a23b718ee8137d62df8a8f2adb6d09be6c8a69aa5a3cd",
		"baselineSha256": "a2e7042cf917df73108af755711b204cb3ba9311bb1aa80f07c906c93210ef06",
		"keys": [
			"search",
			"areYouSure"
		],
		"order": [
			"search",
			"areYouSure",
			"jobQueue"
		],
		"edits": [
			{
				"start": 6345,
				"end": 6345,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 7426,
				"end": 7520,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/pages/admin/object-storage.vue",
		"currentSha256": "f9ca9d232631e20c0ee23cab1039d68c8d0199ac71f7906807ba1d269c5377e2",
		"baselineSha256": "4222b25b3dcd055fc97eaa7fc3aeee0b698935813d1cb6909b49217f2e54a3e2",
		"keys": [
			"save"
		],
		"order": [
			"objectStorage",
			"useObjectStorage",
			"objectStorageBaseUrl",
			"objectStorageBaseUrlDesc",
			"objectStorageBucket",
			"objectStorageBucketDesc",
			"objectStoragePrefix",
			"objectStoragePrefixDesc",
			"objectStorageEndpoint",
			"objectStorageEndpointDesc",
			"objectStorageRegion",
			"objectStorageRegionDesc",
			"objectStorageUseSSL",
			"objectStorageUseSSLDesc",
			"objectStorageUseProxy",
			"objectStorageUseProxyDesc",
			"objectStorageSetPublicRead",
			"s3ForcePathStyleDesc",
			"save"
		],
		"expanded": true,
		"edits": [
			{
				"start": 4515,
				"end": 4515,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 5099,
				"end": 5157,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/pages/frontend/components/MkPageWindow.vue",
		"currentSha256": "88361b48d07c9c6dfa61c6f28ccf2cc57edaa6cd0293112804d00733caba0eec",
		"baselineSha256": "5763d37ded9045bcefbc216de57bf901e24edddd89ca8d4fa19cd7f2c9ac747d",
		"keys": [
			"reload",
			"goBack"
		],
		"order": [
			"goBack",
			"reload",
			"showInPage",
			"popout",
			"openInNewTab",
			"copyLink"
		],
		"edits": [
			{
				"start": 928,
				"end": 928,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1075,
				"end": 1075,
				"current": "",
				"baseline": ".js';\nimport type { PageMetadata } from '@features/navigation/frontend/page"
			},
			{
				"start": 1937,
				"end": 2106,
				"current": ";\nimport type { PageMetadata } from '@features/navigation/frontend/page.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/pages/frontend/pages/page-editor/page-editor.vue",
		"currentSha256": "16111a26e47b9587d1e40fc06d06ad995fc2575ecb95792449e414f1a985491b",
		"baselineSha256": "c84f3458697255cbc9dc3e57b83ba6a8f890a9bff8f09c72d794b6023ccff6b2",
		"keys": [
			"save",
			"delete",
			"somethingHappened",
			"removeAreYouSure"
		],
		"order": [
			"pagesViewPage",
			"save",
			"duplicate",
			"delete",
			"pagesTitle",
			"pagesSummary",
			"pagesUrl",
			"pagesAlignCenter",
			"pagesFont",
			"pagesHideTitleWhenPinned",
			"pagesEyeCatchingImageSet",
			"pagesEyeCatchingImageRemove",
			"pagesFontSansSerif",
			"pagesFontSerif",
			"somethingHappened",
			"pagesNameAlreadyExists",
			"removeAreYouSure",
			"pagesChooseBlock",
			"pagesPageSetting",
			"pagesContents",
			"pagesEditPage",
			"pagesReadPage",
			"pagesNewPage"
		],
		"edits": [
			{
				"start": 2618,
				"end": 2618,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3863,
				"end": 3957,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/pages/frontend/pages/page.vue",
		"currentSha256": "376e5151f1a520a173239a70e53be7b0192e07862e4f5e3a13187012672dfd78",
		"baselineSha256": "921cfa9a66c7404f4e0d148b913fc17fb885a1cffb038411c3b4bad21d772ca0",
		"keys": [
			"delete",
			"edit",
			"share",
			"createdAt",
			"updatedAt"
		],
		"order": [
			"shareWithNote",
			"share",
			"unlikeConfirm",
			"edit",
			"unpin",
			"pin",
			"reportAbuse",
			"delete",
			"deleteConfirm",
			"pages",
			"editThisPage",
			"unlike",
			"like",
			"copyLink",
			"createdAt",
			"updatedAt",
			"recentPosts"
		],
		"expanded": true,
		"edits": [
			{
				"start": 5255,
				"end": 5255,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 5420,
				"end": 5420,
				"current": "",
				"baseline": ".js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu"
			},
			{
				"start": 7002,
				"end": 7173,
				"current": ";\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/pages/frontend/pages/pages.vue",
		"currentSha256": "b74645c05a3de4a222a73658b13a5a7ebda22664e42cfb2d726d93a907154725",
		"baselineSha256": "53e1279b5fccb038c126fe629ea2cca94745cd09ddf7766616248c1fd5c2438e",
		"keys": [
			"create"
		],
		"order": [
			"create",
			"featured",
			"my",
			"liked",
			"pages"
		],
		"edits": [
			{
				"start": 1217,
				"end": 1217,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1694,
				"end": 1788,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/play/frontend/pages/flash/flash-edit.vue",
		"currentSha256": "4c7ca5df606271446256111d6d07c4b0d6fd8758ab5d2b837b353422c1735a85",
		"baselineSha256": "1a22d76ec0fe5dd485bae849f972308d0c26d823b2505a79b4278d0b690d8a69",
		"keys": [
			"save",
			"delete",
			"visibility",
			"public",
			"private",
			"deleteAreYouSure",
			"show"
		],
		"order": [
			"public",
			"private",
			"deleteAreYouSure",
			"edit",
			"new",
			"title",
			"visibility",
			"visibilityDescription",
			"summary",
			"selectFromPresets",
			"script",
			"save",
			"show",
			"delete"
		],
		"edits": [
			{
				"start": 1564,
				"end": 1564,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2500,
				"end": 2594,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/play/frontend/pages/flash/flash-index.vue",
		"currentSha256": "91dc6858cd470c3ef04ca4adbdcc4867b3d9b6d9bbc883ffebab6b1b50b598a6",
		"baselineSha256": "56524e3d850bd901da8d59a3a38cf88c1966e8bc290de8a1f483ac675584d5ac",
		"keys": [
			"search",
			"create"
		],
		"order": [
			"search",
			"create",
			"featured",
			"my",
			"liked"
		],
		"edits": [
			{
				"start": 1894,
				"end": 1894,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1942,
				"end": 1942,
				"current": "",
				"baseline": "';\nimport type { IPaginator } from '@features/ui/frontend/utility/paginator.js"
			},
			{
				"start": 2452,
				"end": 2624,
				"current": ";\nimport type { IPaginator } from '@features/ui/frontend/utility/paginator.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/play/frontend/pages/flash/flash.vue",
		"currentSha256": "f70fad90397bf4633f638162592cc1294e831da31f46b615f0cea48406dc33dd",
		"baselineSha256": "e31fd49ae514819d19409e18ac88de62e91a93b8e5e2866235a158736d3953a6",
		"keys": [
			"delete",
			"reload",
			"share",
			"createdAt",
			"updatedAt"
		],
		"order": [
			"shareWithNote",
			"share",
			"unlikeConfirm",
			"reportAbuse",
			"delete",
			"deleteConfirm",
			"reload",
			"unlike",
			"like",
			"copyLink",
			"numberOfLikes",
			"viewSource",
			"updatedAt",
			"createdAt",
			"editThisPage"
		],
		"expanded": true,
		"edits": [
			{
				"start": 3399,
				"end": 3399,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3692,
				"end": 3692,
				"current": "",
				"baseline": "';\nimport type { Ref } from 'vue';\nimport type { AsUiComponent, AsUiRoot } from '@features/play/frontend/services/aiscript/ui.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Interpreter } from '@syuilo/aiscript"
			},
			{
				"start": 4726,
				"end": 5078,
				"current": ";\nimport type { Interpreter } from '@syuilo/aiscript';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { AsUiComponent, AsUiRoot } from '@features/play/frontend/services/aiscript/ui.js';\nimport type { Ref } from 'vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/portability/frontend/pages/settings/account-data.vue",
		"currentSha256": "2e8f6272870b570363112c76b39ac9f47a6637dafe29a5f3eab8fc4240606d99",
		"baselineSha256": "9e8d6a5f5dd2069d527e8c7b91156b0f6212f4ce95f0f5d82e3ac959dc0d2357",
		"keys": [
			"antennas"
		],
		"order": [
			"exportRequested",
			"importRequested",
			"accountData",
			"accountDataBanner",
			"allNotes",
			"export",
			"favoritedNotes",
			"clips",
			"followingList",
			"excludeMutingUsers",
			"excludeInactiveUsers",
			"import",
			"withReplies",
			"userLists",
			"muteList",
			"blockingList",
			"antennas"
		],
		"edits": [
			{
				"start": 7708,
				"end": 7708,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8421,
				"end": 8515,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/registry.value.vue",
		"currentSha256": "25a045970138eb6d05d5632af9a8e8fd09e8f9eef64dfa152ea530b15ecdb215",
		"baselineSha256": "f55eb9544c1a7871ed41c73bee6c2c6309f53fdeb2ff30004d93dfc8e52edacb",
		"keys": [
			"save",
			"delete",
			"updatedAt"
		],
		"order": [
			"invalidValue",
			"saveConfirm",
			"deleteConfirm",
			"registry",
			"editTheseSettingsMayBreakAccount",
			"domain",
			"system",
			"scope",
			"key",
			"value",
			"save",
			"updatedAt",
			"delete"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1603,
				"end": 1603,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1694,
				"end": 1694,
				"current": "",
				"baseline": "';\nimport { packedJsonValueSchema } from '../../../users/backend/json-value.schema.js"
			},
			{
				"start": 2257,
				"end": 2436,
				"current": ";\nimport { packedJsonValueSchema } from '../../../users/backend/json-value.schema.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/emoji-palette.palette.vue",
		"currentSha256": "25e9daa0ccd8393a2d26d6bf9ef35a41c7e70116fc3e63bd36ef7b0f542b72c9",
		"baselineSha256": "693eda58e2c1b71a8fbed4d63aed76e226198b2b94d074cd9ad8bbc19606a3c8",
		"keys": [
			"delete",
			"copy",
			"remove",
			"rename",
			"noName"
		],
		"order": [
			"noName",
			"rename",
			"copy",
			"paste",
			"reactionSettingDescription2",
			"remove",
			"delete"
		],
		"edits": [
			{
				"start": 1916,
				"end": 1916,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2537,
				"end": 2631,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/emoji-palette.vue",
		"currentSha256": "e1f2f18aa752900773a6e6a063e2d23c9f3663b638a2011710debf17c4ef93ea",
		"baselineSha256": "179cdcd9fa46b3aed13b8d3b535e5d15ec9adf5dcc63e6c36966e75559d6a6f9",
		"keys": [
			"preview",
			"noName",
			"medium"
		],
		"order": [
			"auto",
			"noName",
			"small",
			"medium",
			"large",
			"emojiPalette",
			"emojiPaletteBanner",
			"palettes",
			"enableSyncBetweenDevicesForPalettes",
			"paletteForMain",
			"paletteForReaction",
			"emojiPickerDisplay",
			"size",
			"numberOfColumn",
			"height",
			"popup",
			"drawer",
			"style",
			"needReloadToApply",
			"preview"
		],
		"edits": [
			{
				"start": 4395,
				"end": 4395,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4521,
				"end": 4521,
				"current": "",
				"baseline": ".vue';\nimport type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios"
			},
			{
				"start": 5481,
				"end": 5743,
				"current": ";\nimport type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios.vue';\nimport type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/navbar.vue",
		"currentSha256": "cd06f4f487a02dc9a8704283c79f337ceddc67184349dd5190f6be8a558ef556",
		"baselineSha256": "723ca0afdea1eadf070f9599e7ed0a64a00775e0022d6f3b6912b45646a9036d",
		"keys": [
			"save",
			"default"
		],
		"order": [
			"addItem",
			"divider",
			"navbar",
			"default",
			"save",
			"sideFull",
			"sideIcon",
			"display",
			"showNavbarSubButtons"
		],
		"expanded": true,
		"edits": [
			{
				"start": 2259,
				"end": 2259,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 3314,
				"end": 3372,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/preferences.vue",
		"currentSha256": "72b7587528753682d1808b0d615e7729c088c71d2a5abb210f6b6a82e7605bf0",
		"baselineSha256": "b4f0d6f5bd2b505080654a35748b3c440c48306461bbb002f05767ab893a6b17",
		"keys": [
			"default",
			"enableAll",
			"disableAll",
			"add",
			"remove",
			"visibilityDisableFederation",
			"notifications",
			"high",
			"medium",
			"low"
		],
		"order": [
			"autoplayEmbededPlayerOfUrlPreview",
			"preferences",
			"settingsPreferencesBanner",
			"general",
			"uiLanguage",
			"i18nInfo",
			"auto",
			"smartphone",
			"tablet",
			"desktop",
			"overridedDeviceKind",
			"realtimeMode",
			"settingsRealtimeMode_description",
			"low",
			"middle",
			"high",
			"settingsContentsUpdateFrequency",
			"settingsContentsUpdateFrequency_description",
			"settingsContentsUpdateFrequency_description2",
			"showTitlebar",
			"showAvatarDecorations",
			"alwaysConfirmFollow",
			"highlightSensitiveMedia",
			"confirmWhenRevealingSensitiveMedia",
			"enableAdvancedMfm",
			"enableInfiniteScroll",
			"native",
			"emojiStyle",
			"settingsTimelineAndNote",
			"showFixedPostForm",
			"showFixedPostFormInChannel",
			"collapseRenotes",
			"collapseRenotesDescription",
			"pinnedList",
			"add",
			"remove",
			"showNoteActionsOnlyHover",
			"showClipButtonInNoteFooter",
			"showReactionsCount",
			"confirmOnReact",
			"loadRawImages",
			"useReactionPickerForContextMenu",
			"settingsShowAvailableReactionsFirstInNote",
			"small",
			"medium",
			"large",
			"reactionsDisplaySize",
			"limitWidthOfReaction",
			"default",
			"limitTo",
			"mediaListWithOneImageAppearance",
			"showMediaListByGridInWideArea",
			"instanceTickerNone",
			"instanceTickerRemote",
			"instanceTickerAlways",
			"instanceTicker",
			"displayOfSensitiveMediaRespect",
			"displayOfSensitiveMediaIgnore",
			"displayOfSensitiveMediaForce",
			"displayOfSensitiveMedia",
			"postForm",
			"keepCw",
			"rememberNoteVisibility",
			"enableQuickAddMfmFunction",
			"defaultNoteVisibility",
			"visibilityPublic",
			"visibilityHome",
			"visibilityFollowers",
			"visibilitySpecified",
			"visibilityDisableFederation",
			"notifications",
			"useGroupedNotifications",
			"leftTop",
			"rightTop",
			"leftBottom",
			"rightBottom",
			"position",
			"vertical",
			"horizontal",
			"stackAxis",
			"notificationCheckNotificationBehavior",
			"directMessage",
			"settingsChatShowSenderName",
			"settingsChatSendOnEnter",
			"settingsIfOn",
			"chatSend",
			"chatNewline",
			"settingsIfOff",
			"accessibility",
			"settingsAccessibilityBanner",
			"reduceUiAnimation",
			"disableShowingAnimatedImages",
			"disableShowingAnimatedImages_caption",
			"enableAnimatedMfm",
			"settingsShowPageTabBarBottom",
			"enableHorizontalSwipe",
			"settingsEnablePullToRefresh",
			"settingsEnablePullToRefresh_description",
			"keepScreenOn",
			"useNativeUIForVideoAudioPlayer",
			"settingsMakeEveryTextElementsSelectable",
			"settingsMakeEveryTextElementsSelectable_description",
			"popup",
			"drawer",
			"menuStyle",
			"contextMenuApp",
			"contextMenuAppWithShift",
			"contextMenuNative",
			"contextMenuTitle",
			"fontSize",
			"useSystemFont",
			"performance",
			"settingsUiAnimations",
			"turnOffToImprovePerformance",
			"settingsEnableAnimatedImages",
			"useBlurEffect",
			"useBlurEffectForModal",
			"settingsEnableHighQualityImagePlaceholders",
			"settingsUseStickyIcons",
			"clientPerformanceIssueTipTitle",
			"clientPerformanceIssueTipMakeSureDisabledAdBlocker",
			"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description",
			"clientPerformanceIssueTipMakeSureDisabledCustomCss",
			"clientPerformanceIssueTipMakeSureDisabledCustomCss_description",
			"clientPerformanceIssueTipMakeSureDisabledAddons",
			"clientPerformanceIssueTipMakeSureDisabledAddons_description",
			"dataSaver",
			"reloadRequiredToApplySettings",
			"enableAll",
			"disableAll",
			"dataSaverMediaTitle",
			"dataSaverMediaDescription",
			"dataSaverAvatarTitle",
			"dataSaverAvatarDescription",
			"dataSaverDisableUrlPreviewTitle",
			"dataSaverDisableUrlPreviewDescription",
			"dataSaverUrlPreviewThumbnailTitle",
			"dataSaverUrlPreviewThumbnailDescription",
			"dataSaverCodeTitle",
			"dataSaverCodeDescription",
			"other",
			"squareAvatars",
			"seasonalScreenEffect",
			"openImageInNewTab",
			"withRepliesByDefaultForNewlyFollowed",
			"serverDisconnectedBehaviorReload",
			"serverDisconnectedBehaviorDialog",
			"serverDisconnectedBehaviorQuiet",
			"whenServerDisconnected",
			"numberOfPageCache",
			"numberOfPageCacheDescription",
			"forceShowAds",
			"hemisphereN",
			"hemisphereS",
			"hemisphere",
			"hemisphereCaption",
			"additionalEmojiDictionary",
			"installed",
			"navbar",
			"statusbar",
			"deck",
			"customCss",
			"selectList"
		],
		"edits": [
			{
				"start": 40331,
				"end": 40331,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 42329,
				"end": 42423,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/sounds.sound.vue",
		"currentSha256": "73ef393128a3243c5f431b6d134f5aa83f149c57be7dcb2328b02250703052e4",
		"baselineSha256": "12fe9cf0b438c3e59346640c32d2f5ca3bf94d52435630d4ab6970a3e31d18f1",
		"keys": [
			"save",
			"cancel",
			"none",
			"continue"
		],
		"order": [
			"none",
			"driveFile",
			"driveFileWarn",
			"driveFileTypeWarn",
			"driveFileTypeWarnDescription",
			"driveFileDurationWarn",
			"driveFileDurationWarnDescription",
			"continue",
			"cancel",
			"sound",
			"selectFile",
			"driveFileError",
			"volume",
			"listen",
			"save"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1488,
				"end": 1488,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1522,
				"end": 1522,
				"current": "",
				"baseline": "';\nimport type { SoundType } from '@features/preferences/frontend/utility/sound.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js"
			},
			{
				"start": 2128,
				"end": 2383,
				"current": ";\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js';\nimport type { SoundType } from '@features/preferences/frontend/utility/sound.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/sounds.vue",
		"currentSha256": "3fd173445c4da67ea203b980d339da2f2027e8c3240f372041f05486e9d98c32",
		"baselineSha256": "edc60fb609395d6e330b10bbd8a6fc5afe299f8f21401225134520f47e68db97",
		"keys": [
			"none",
			"default"
		],
		"order": [
			"sounds",
			"settingsSoundsBanner",
			"notUseSound",
			"useSoundOnlyWhenActive",
			"masterVolume",
			"sfxLabels",
			"default",
			"none",
			"soundSettingsDriveFile"
		],
		"edits": [
			{
				"start": 2191,
				"end": 2191,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2303,
				"end": 2303,
				"current": "",
				"baseline": "';\nimport type { Ref } from 'vue';\nimport type { SoundType, OperationType } from '@features/preferences/frontend/utility/sound.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js"
			},
			{
				"start": 3323,
				"end": 3625,
				"current": ";\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js';\nimport type { SoundType, OperationType } from '@features/preferences/frontend/utility/sound.js';\nimport type { Ref } from 'vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/statusbar.statusbar.vue",
		"currentSha256": "e0ddd3586c221f5a6904d668c6a8cd8fb402b95fcf4fdf95c70ab10ed069fdf3",
		"baselineSha256": "6b663d4e61fc50078d59fa20837fc8057886f99f9f6fa3883cb4746461c30794",
		"keys": [
			"remove",
			"medium"
		],
		"order": [
			"userList",
			"type",
			"label",
			"small",
			"medium",
			"large",
			"size",
			"shuffle",
			"refreshInterval",
			"speed",
			"fast",
			"slow",
			"reverse",
			"colored",
			"remove"
		],
		"edits": [
			{
				"start": 3391,
				"end": 3391,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 4115,
				"end": 4151,
				"current": "Locale } from 'i18n';\nimport type { ",
				"baseline": ""
			},
			{
				"start": 4301,
				"end": 4359,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/statusbar.vue",
		"currentSha256": "75cd146f50e226aa26e7f402f9fe7cc275bbbac3291f63bd0d71b2e363826bc1",
		"baselineSha256": "475bc3712f5206501843a83e253393b0415f9e80f5afd4f9560587b5f8a662ba",
		"keys": [
			"add"
		],
		"order": [
			"notSet",
			"add",
			"statusbar"
		],
		"edits": [
			{
				"start": 535,
				"end": 535,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1139,
				"end": 1233,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/theme.install.vue",
		"currentSha256": "cad1ab8d062b748d9ccf4e5d31d0f81b4c6c87542aa6819d0f38a60080da5302",
		"baselineSha256": "c9d95db59800ad1955fecf6e28c17e2e677b02887fdfb60f612d4cbabcae19ef",
		"keys": [
			"preview",
			"install"
		],
		"order": [
			"themeCode",
			"preview",
			"install",
			"themeInvalid",
			"themeInstalled",
			"themeInstall"
		],
		"edits": [
			{
				"start": 831,
				"end": 831,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1503,
				"end": 1597,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/theme.manage.vue",
		"currentSha256": "614e85f595d3876aa2c3bcc89411bcae788a957a3b1fad9d81e9f1df552c3e6b",
		"baselineSha256": "0d9cda002930465caaf37ab5f793fa3fce2c85a2a9c72a8847f98b9e807657b8",
		"keys": [
			"copy",
			"description"
		],
		"order": [
			"installedThemes",
			"builtinThemes",
			"manage",
			"theme",
			"author",
			"description",
			"code",
			"copy",
			"uninstall"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1178,
				"end": 1178,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 2191,
				"end": 2249,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/theme.vue",
		"currentSha256": "d761734670e743f4f97f43523b96aaf63bd656fa2da8d7c2f37dcfcd0bced048",
		"baselineSha256": "34802db1b032af2adcf10276cababe15a6345eb137f0c3e69a127f1a2666e2a5",
		"keys": [
			"delete"
		],
		"order": [
			"theme",
			"light",
			"dark",
			"syncDeviceDarkMode",
			"themeIsDefaultBecauseSafeMode",
			"themeForLightMode",
			"themeInstanceTheme",
			"themeInstalledThemes",
			"themeBuiltinThemes",
			"themeForDarkMode",
			"settingsEnableSyncThemesBetweenDevices",
			"themeManage",
			"themeExplore",
			"themeInstall",
			"themeMake",
			"switchDarkModeManuallyWhenSyncEnabledConfirm",
			"themeCopyThemeCode",
			"delete"
		],
		"edits": [
			{
				"start": 9360,
				"end": 9360,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 9663,
				"end": 9663,
				"current": "",
				"baseline": ".js';\nimport type { Theme } from '@features/preferences/frontend/shared/theme"
			},
			{
				"start": 11120,
				"end": 11291,
				"current": ";\nimport type { Theme } from '@features/preferences/frontend/shared/theme.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/theme-editor.vue",
		"currentSha256": "926117d208aa44d90f32047f941f72dc8e7fd130600e07ff203073ad219391bd",
		"baselineSha256": "af6423eb16604002a6b366363256bb6b0ad886e213162cec3a9f3f5ac15ec6de",
		"keys": [
			"preview",
			"name"
		],
		"order": [
			"backgroundColor",
			"accentColor",
			"textColor",
			"editCode",
			"themeCode",
			"apply",
			"addDescription",
			"themeDescription",
			"themeInvalid",
			"name",
			"themeInstalled",
			"preview",
			"saveAs",
			"themeEditor"
		],
		"edits": [
			{
				"start": 2887,
				"end": 2887,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3239,
				"end": 3239,
				"current": "",
				"baseline": ".js';\nimport type { Theme } from '@features/preferences/frontend/shared/theme"
			},
			{
				"start": 4278,
				"end": 4449,
				"current": ";\nimport type { Theme } from '@features/preferences/frontend/shared/theme.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/ts-messages.vue",
		"currentSha256": "78df1ff5fbb7fd6fd29637d8c0a8ce1c3df6e4c2408af08b76101f27ce92a08a",
		"baselineSha256": "d94c592d43a78c43f1d8a2b0a1c65ddbd19c960efd15cdbf97675f3ffb048860",
		"keys": [
			"somethingHappened",
			"rename",
			"noName"
		],
		"order": [
			"preferenceSyncConflictTitle",
			"preferenceSyncConflictText",
			"preferenceSyncConflictChoiceMerge",
			"preferenceSyncConflictChoiceServer",
			"preferenceSyncConflictChoiceDevice",
			"preferenceSyncConflictChoiceCancel",
			"somethingHappened",
			"copyPreferenceId",
			"resetToDefaultValue",
			"overrideByAccount",
			"syncBetweenDevices",
			"_preferencesBackup",
			"noName",
			"rename",
			"export",
			"import",
			"_preferencesProfile",
			"_deck",
			"_theme"
		]
	},
	{
		"file": "packages/features/preferences/frontend/ui/_common_/ThemePreviewing.vue",
		"currentSha256": "b6adcc8571b089ede86ea34a5bf9f1e10fc386ab7db5a940a4ec782ebeaba661",
		"baselineSha256": "7e35f5ea7cfaae3b74627049567df00d55a19d13b849c8e38fb4451ab05d2022",
		"keys": [
			"settings"
		],
		"order": [
			"previewingTheme",
			"previewingThemeRestore",
			"settings"
		],
		"edits": [
			{
				"start": 703,
				"end": 703,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 766,
				"end": 860,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/widgets/WidgetMemo.vue",
		"currentSha256": "6474a2783e9551760dbd163b4907271b3866bbc0e3b260edd7f9f0de5b7c17ec",
		"baselineSha256": "d0316731932b77f3f8dd5910a3e1da8cea7375e269482687df9e9abb85587ca1",
		"keys": [
			"save",
			"memo"
		],
		"order": [
			"widgetsMemo",
			"memo",
			"save",
			"widgetOptionsShowHeader",
			"height"
		],
		"edits": [
			{
				"start": 774,
				"end": 774,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 798,
				"end": 939,
				"current": "';\nimport MkContainer from '@features/ui/frontend/components/MkContainer.vue';\nimport { store } from '@features/preferences/frontend/store.js",
				"baseline": ""
			},
			{
				"start": 1255,
				"end": 1255,
				"current": "",
				"baseline": "MkCon"
			},
			{
				"start": 1256,
				"end": 1257,
				"current": "y",
				"baseline": "ainer from '@features/ui/frontend/com"
			},
			{
				"start": 1258,
				"end": 1258,
				"current": "",
				"baseline": "on"
			},
			{
				"start": 1259,
				"end": 1259,
				"current": "",
				"baseline": "nts/MkContainer.vue';\nimport"
			},
			{
				"start": 1262,
				"end": 1263,
				"current": "L",
				"baseline": "st"
			},
			{
				"start": 1264,
				"end": 1267,
				"current": "cal",
				"baseline": "r"
			},
			{
				"start": 1277,
				"end": 1280,
				"current": "i18",
				"baseline": "@features/prefere"
			},
			{
				"start": 1281,
				"end": 1285,
				"current": "';\n\n",
				"baseline": ""
			},
			{
				"start": 1286,
				"end": 1286,
				"current": "",
				"baseline": "es/fr"
			},
			{
				"start": 1288,
				"end": 1288,
				"current": "",
				"baseline": "tend/"
			},
			{
				"start": 1290,
				"end": 1327,
				"current": " globalLocale = useLocale<Locale>(imp",
				"baseline": ""
			},
			{
				"start": 1329,
				"end": 1330,
				"current": "t",
				"baseline": "e"
			},
			{
				"start": 1331,
				"end": 1340,
				"current": "meta.url)",
				"baseline": "js'"
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/components/MkFollowButton.vue",
		"currentSha256": "d3f2b2cdb84bf41224cb57b490dd14cc3f77a1da5d336a3882c4bac3005e4413",
		"baselineSha256": "ed247e110c4a01978d338f3cc47b814ce0c978d1d72a7f83caeebf72c7ffdc79",
		"keys": [
			"processing",
			"follow"
		],
		"order": [
			"yes",
			"no",
			"unfollowConfirm",
			"cancelFollowRequestConfirm",
			"followConfirm",
			"followRequestPending",
			"processing",
			"youFollowing",
			"followRequest",
			"follow"
		],
		"edits": [
			{
				"start": 1600,
				"end": 1600,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2399,
				"end": 2493,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/follow-requests.vue",
		"currentSha256": "339142d86c7a9cfb8385f9a65a86574970cabbe8aa2983110ba35f94c654903e",
		"baselineSha256": "d42ef8251d1fc95c012180ceb45f08ff9f7ef37aa0892c82de9de687fd249f9b",
		"keys": [
			"cancel",
			"accept",
			"reject"
		],
		"order": [
			"yes",
			"no",
			"rejectFollowRequestConfirm",
			"cancelFollowRequestConfirm",
			"recieved",
			"sent",
			"followRequests",
			"noFollowRequests",
			"accept",
			"reject",
			"cancel"
		],
		"edits": [
			{
				"start": 1664,
				"end": 1664,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2318,
				"end": 2412,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/list.vue",
		"currentSha256": "9d3f6adbe8302e30edf6ce11bd234caf4e9ce82f3696ee25b8635b6b0ce60c7c",
		"baselineSha256": "96acece8a30a3dcaa04a15a4ff4192de8ef82b6676de9276f9ec7712abe9a9e6",
		"keys": [
			"lists"
		],
		"order": [
			"members",
			"unlike",
			"like",
			"import",
			"enterListName",
			"lists"
		],
		"edits": [
			{
				"start": 1456,
				"end": 1456,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1948,
				"end": 2042,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/my-lists/index.vue",
		"currentSha256": "ef78235d5c98a40e65b34f51202f011971a189f0b1c189043d853a418cb1ffd8",
		"baselineSha256": "4e893012c0e5a72dfacf1042e237e019b2114014b8d50e959d5a83cc877b9afc",
		"keys": [
			"reload"
		],
		"order": [
			"enterListName",
			"reload",
			"manageLists",
			"tip",
			"createList",
			"nUsers"
		],
		"edits": [
			{
				"start": 1117,
				"end": 1117,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1655,
				"end": 1749,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/my-lists/list.vue",
		"currentSha256": "0cd11ff4fce0cbeedfa841d448b86215d13fecae1bdf24d672c995f2e7e40013",
		"baselineSha256": "982c554e198302b6d8942ad03438abbf13ab8a79c41ececaa92e50525fa89743",
		"keys": [
			"save",
			"delete",
			"lists",
			"name",
			"remove",
			"settings",
			"public",
			"timeline",
			"showRepliesToOthersInTimeline",
			"removeAreYouSure"
		],
		"order": [
			"remove",
			"showRepliesToOthersInTimeline",
			"removeAreYouSure",
			"timeline",
			"lists",
			"settings",
			"name",
			"public",
			"save",
			"delete",
			"members",
			"nUsers",
			"addUser"
		],
		"edits": [
			{
				"start": 2078,
				"end": 2078,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3244,
				"end": 3338,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/settings/mute-block.emoji-mute.vue",
		"currentSha256": "df061e0d5cfc3940c6d339ee9cb4ca963d47908afd9558198cd1ac9719516c41",
		"baselineSha256": "71b0f5cf1f3b3860c20cdba5bc66a4c4e7f9638ad12111bb92fe157f1fedd01e",
		"keys": [
			"add"
		],
		"order": [
			"add",
			"syncBetweenDevices",
			"emojiUnmute",
			"unmuteX"
		],
		"edits": [
			{
				"start": 1154,
				"end": 1154,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1171,
				"end": 1171,
				"current": "",
				"baseline": "';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu"
			},
			{
				"start": 1634,
				"end": 1802,
				"current": ";\nimport type { MenuItem } from '@features/navigation/frontend/types/menu';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/settings/mute-block.instance-mute.vue",
		"currentSha256": "fc48ba8499c28bdeda8b374e40001a4bd2da1d77168e1dc7f8736f6f1abd26ae",
		"baselineSha256": "f7a0a038abdb6b3206116dbb5a24e69e1d359b4df4ec68907d63609deb1fc44e",
		"keys": [
			"save"
		],
		"order": [
			"title",
			"heading",
			"instanceMuteDescription",
			"instanceMuteDescription2",
			"save"
		],
		"edits": [
			{
				"start": 654,
				"end": 654,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1026,
				"end": 1120,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/settings/mute-block.vue",
		"currentSha256": "ee30314f3c1b69326319f8a6f6ffe134e02f92b8001dedcb8a2c0dd82b9a6594",
		"baselineSha256": "97febbee03406b296bf5593e5ef41357f9b79212153cd93e66646825ace46340",
		"keys": [
			"mutedUsers",
			"blockedUsers",
			"indefinitely",
			"renote"
		],
		"order": [
			"renoteUnmute",
			"unmute",
			"unblock",
			"muteAndBlock",
			"muteAndBlockBanner",
			"wordMute",
			"wordMuteDescription",
			"showMutedWord",
			"hardWordMute",
			"hardWordMuteDescription",
			"emojiMute",
			"instanceMute",
			"mutedUsers",
			"renote",
			"noUsers",
			"indefinitely",
			"blockedUsers"
		],
		"edits": [
			{
				"start": 6807,
				"end": 6807,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8191,
				"end": 8285,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/settings/mute-block.word-mute.vue",
		"currentSha256": "549b7bee12200022282ee306b527ad150263056f43a42c8eb80ce4904687f44a",
		"baselineSha256": "58de79071940e66054e3418a28a084e40e31d31fc7d712b5c892903b12d1d393",
		"keys": [
			"save"
		],
		"order": [
			"muteWords",
			"muteWordsDescription",
			"muteWordsDescription2",
			"save",
			"regexpError",
			"regexpErrorDescription"
		],
		"edits": [
			{
				"start": 616,
				"end": 616,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 836,
				"end": 930,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/user-list-timeline.vue",
		"currentSha256": "169ad74065cb582b854addf9be07fe022e5414754f2b87ab52e1ce784c2ad9ca",
		"baselineSha256": "4dab6652495cad73ef382299667a3da8f8e48ed5a1ea18e03dcf149237f28112",
		"keys": [
			"lists",
			"settings"
		],
		"order": [
			"settings",
			"lists"
		],
		"edits": [
			{
				"start": 515,
				"end": 515,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 929,
				"end": 1023,
				"current": "import type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			},
			{
				"start": 1410,
				"end": 1411,
				"current": ",",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/user/followers.vue",
		"currentSha256": "9eef272734c5b0d614b40486c8d107f03f07e32a8510fbefa6c4030803074bba",
		"baselineSha256": "29e0bff25348670228d72273f3bd0c698b7ca44cb2e43a4004a8d30c15aaac27",
		"keys": [
			"followers",
			"user"
		],
		"order": [
			"user",
			"followers"
		],
		"edits": [
			{
				"start": 577,
				"end": 577,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 882,
				"end": 976,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/pages/user/following.vue",
		"currentSha256": "df5c9ceee3b981a29061bb728f3891ab530f433c7901a6b3f6468b7410b0836d",
		"baselineSha256": "97f5044c188e74f15bfb930ba22c47c5cc28fe3cbcbe4555af216e06a97ca02c",
		"keys": [
			"following",
			"user"
		],
		"order": [
			"user",
			"following"
		],
		"edits": [
			{
				"start": 577,
				"end": 577,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 882,
				"end": 976,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/ui/deck/list-column.vue",
		"currentSha256": "1ced89a0a4212aad9a02ac0472319f5b171c04f897bb82ededd827300cf70592",
		"baselineSha256": "55e8f6fc26f9ef4b7a2e36ae510aeaa29b2b9ce2c25da0ecf4be3944422141e8",
		"keys": [
			"createNew"
		],
		"order": [
			"selectList",
			"createNew",
			"createdLists",
			"enterListName",
			"editList",
			"showRenotes",
			"newNoteNotificationSettings",
			"list"
		],
		"edits": [
			{
				"start": 651,
				"end": 651,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 702,
				"end": 702,
				"current": "",
				"baseline": "';\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type { entities as MisskeyEntities } from 'misskey-js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js"
			},
			{
				"start": 1176,
				"end": 1633,
				"current": ";\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { entities as MisskeyEntities } from 'misskey-js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/relationships/frontend/widgets/WidgetBirthdayFollowings.vue",
		"currentSha256": "e05dcfbc1884ef9c02041949fc65245c4ea4c8904d1dadc5bae531856a20ec21",
		"baselineSha256": "ca5f9d7dffa4fa6e35efbd7e6d6978fd44a75514f734061bff2f60e36d491dd6",
		"keys": [
			"oneMonth",
			"oneWeek"
		],
		"order": [
			"widgetsBirthdayFollowings",
			"widgetOptionsShowHeader",
			"widgetOptionsHeight",
			"widgetOptionsBirthdayFollowingsPeriod",
			"today",
			"dayX",
			"oneWeek",
			"oneMonth"
		],
		"edits": [
			{
				"start": 1278,
				"end": 1278,
				"current": "",
				"baseline": " "
			},
			{
				"start": 1343,
				"end": 1343,
				"current": "",
				"baseline": " "
			},
			{
				"start": 1506,
				"end": 1506,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1766,
				"end": 1766,
				"current": "",
				"baseline": "{ useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';\nimport "
			},
			{
				"start": 1906,
				"end": 1906,
				"current": "",
				"baseline": ".vue';\nimport XUser from './WidgetBirthdayFollowings.user"
			},
			{
				"start": 2090,
				"end": 2547,
				"current": ";\nimport { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';\nimport XUser from './WidgetBirthdayFollowings.user.vue';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/components/MkRoleSelectDialog.vue",
		"currentSha256": "d8567edb1e30dad0682a3bc7f79ecdbe62c6d1870c69237982aa1bcc74957f06",
		"baselineSha256": "cf5890987e3d0c0e964d19504f9a359cee815f39b3bc2bffe2280a0c01c1c927",
		"keys": [
			"ok",
			"cancel",
			"add"
		],
		"order": [
			"add",
			"notSelected",
			"ok",
			"cancel"
		],
		"edits": [
			{
				"start": 1591,
				"end": 1591,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2187,
				"end": 2281,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/RolesEditorFormula.vue",
		"currentSha256": "ecd9ab22b609e21cd353a87f2a29ff7b9a8c980995bdf1d346729e47fc18d6ca",
		"baselineSha256": "2360ce7ee41c506baf5d89545bca0637a869ba6736fd8b6bb6a43f9fb3d39cda",
		"keys": [
			"add"
		],
		"order": [
			"isLocal",
			"isRemote",
			"isSuspended",
			"isLocked",
			"isBot",
			"isCat",
			"isExplorable",
			"roleAssignedTo",
			"createdLessThan",
			"createdMoreThan",
			"followersLessThanOrEq",
			"followersMoreThanOrEq",
			"followingLessThanOrEq",
			"followingMoreThanOrEq",
			"notesLessThanOrEq",
			"notesMoreThanOrEq",
			"and",
			"or",
			"not",
			"add"
		],
		"edits": [
			{
				"start": 2052,
				"end": 2052,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2125,
				"end": 2125,
				"current": "",
				"baseline": "';\nimport type { GetMkSelectValueTypesFromDef, MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue"
			},
			{
				"start": 2487,
				"end": 2553,
				"current": "rolesCache } from '@features/runtime/frontend/cache.js';\nimport { ",
				"baseline": ""
			},
			{
				"start": 2686,
				"end": 2691,
				"current": "type ",
				"baseline": ""
			},
			{
				"start": 2693,
				"end": 2700,
				"current": "GetMkSe",
				"baseline": "ro"
			},
			{
				"start": 2702,
				"end": 2702,
				"current": "",
				"baseline": "sCa"
			},
			{
				"start": 2703,
				"end": 2708,
				"current": "tValu",
				"baseline": "h"
			},
			{
				"start": 2709,
				"end": 2735,
				"current": "TypesFromDef, MkSelectItem",
				"baseline": ""
			},
			{
				"start": 2754,
				"end": 2754,
				"current": "",
				"baseline": "r"
			},
			{
				"start": 2755,
				"end": 2755,
				"current": "",
				"baseline": "nt"
			},
			{
				"start": 2756,
				"end": 2756,
				"current": "",
				"baseline": "me"
			},
			{
				"start": 2767,
				"end": 2772,
				"current": "ompon",
				"baseline": "ach"
			},
			{
				"start": 2773,
				"end": 2775,
				"current": "nt",
				"baseline": ".j"
			},
			{
				"start": 2776,
				"end": 2789,
				"current": "/MkSelect.vue",
				"baseline": ""
			},
			{
				"start": 2790,
				"end": 2884,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/roles.edit.vue",
		"currentSha256": "5db4455ca96904230d849d39acf6fda25f34dfb60b401240946a323d6361a382",
		"baselineSha256": "27b5f652876b1721cfb8385e86b13fb306b9413b6088f2eb3125480f751e97c7",
		"keys": [
			"save"
		],
		"order": [
			"edit",
			"new",
			"save"
		],
		"expanded": true,
		"edits": [
			{
				"start": 748,
				"end": 748,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 1365,
				"end": 1423,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/roles.editor.vue",
		"currentSha256": "09d08cd2323b2f472e234242a8cf09c84d5685beb12d3e5ba1b5438768587726",
		"baselineSha256": "ff49149aa84b20cb90b1c5659d7c4e0b1c065b9783bca6a3ec46c83109d91270",
		"keys": [
			"administrator",
			"moderator"
		],
		"order": [
			"roleName",
			"roleDescription",
			"color",
			"roleIconUrl",
			"roleDisplayOrder",
			"roleDescriptionOfDisplayOrder",
			"rolePermission",
			"roleDescriptionOfPermission",
			"roleManual",
			"roleConditional",
			"roleAssignTarget",
			"roleDescriptionOfAssignTarget",
			"roleCondition",
			"rolePreserveAssignmentOnMoveAccount",
			"rolePreserveAssignmentOnMoveAccount_description",
			"roleCanEditMembersByModerator",
			"roleDescriptionOfCanEditMembersByModerator",
			"roleIsPublic",
			"roleDescriptionOfIsPublic",
			"roleAsBadge",
			"roleDescriptionOfAsBadge",
			"roleIsExplorable",
			"roleDescriptionOfIsExplorable",
			"rolePolicies",
			"normalUser",
			"moderator",
			"administrator"
		],
		"edits": [
			{
				"start": 3634,
				"end": 3634,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3843,
				"end": 3843,
				"current": "",
				"baseline": ".vue';\nimport type { MkSelectItem, GetMkSelectValueTypesFromDef } from '@features/ui/frontend/components/MkSelect"
			},
			{
				"start": 4596,
				"end": 4745,
				"current": "MkSelectItem, GetMkSelectValueTypesFromDef } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { Locale } from 'i18n';\nimport type { ",
				"baseline": ""
			},
			{
				"start": 4825,
				"end": 4883,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/roles.policy-editor.vue",
		"currentSha256": "3bfa19c99bd7bb8ce720952c07a7bbf7f0c23268caef10cde90fd92c5509693d",
		"baselineSha256": "671e99e15eb3258afb4c78a4d3b09aa88d968e751fa5a16b0d036d43041ffd76",
		"keys": [
			"yes",
			"no"
		],
		"order": [
			"roleOptionsRateLimitFactor",
			"roleOptionsDescriptionOfRateLimitFactor",
			"roleOptionsGtlAvailable",
			"yes",
			"no",
			"enable",
			"roleOptionsLtlAvailable",
			"roleOptionsCanPublicNote",
			"roleOptionsChatAvailability",
			"readonly",
			"enabled",
			"disabled",
			"roleOptionsMentionMax",
			"roleOptionsCanInvite",
			"roleOptionsInviteLimit",
			"roleOptionsInviteLimitCycle",
			"timeMinute",
			"roleOptionsInviteExpirationTime",
			"roleOptionsCanManageAvatarDecorations",
			"roleOptionsCanManageCustomEmojis",
			"roleOptionsCanSearchNotes",
			"roleOptionsCanSearchUsers",
			"roleOptionsCanUseTranslator",
			"roleOptionsCanCreateChannel",
			"roleOptionsDriveCapacity",
			"roleOptionsMaxFileSize",
			"roleOptionsMaxFileSize_caption2",
			"roleOptionsMaxFileSize_caption",
			"roleOptionsUploadableFileTypes",
			"roleOptionsUploadableFileTypes_caption",
			"roleOptionsUploadableFileTypes_caption2",
			"roleOptionsAlwaysMarkNsfw",
			"roleOptionsCanUpdateBioMedia",
			"roleOptionsPinMax",
			"roleOptionsAntennaMax",
			"roleOptionsWordMuteMax",
			"roleOptionsWebhookMax",
			"roleOptionsClipMax",
			"roleOptionsNoteEachClipsMax",
			"roleOptionsUserListMax",
			"roleOptionsUserEachUserListsMax",
			"roleOptionsCanHideAds",
			"roleOptionsAvatarDecorationLimit",
			"roleOptionsCanImportAntennas",
			"roleOptionsCanImportBlocking",
			"roleOptionsCanImportFollowing",
			"roleOptionsCanImportMuting",
			"roleOptionsCanImportUserLists",
			"roleOptionsNoteDraftLimit",
			"roleOptionsScheduledNoteLimit",
			"roleOptionsWatermarkAvailable"
		],
		"edits": [
			{
				"start": 111,
				"end": 111,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 133,
				"end": 133,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 324,
				"end": 324,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 397,
				"end": 397,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 486,
				"end": 486,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 521,
				"end": 521,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 679,
				"end": 679,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 770,
				"end": 770,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 781,
				"end": 781,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 796,
				"end": 796,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 808,
				"end": 808,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 990,
				"end": 990,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1060,
				"end": 1060,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1172,
				"end": 1172,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1207,
				"end": 1207,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1281,
				"end": 1281,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1337,
				"end": 1337,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1349,
				"end": 1349,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1364,
				"end": 1364,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1376,
				"end": 1376,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1558,
				"end": 1558,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1628,
				"end": 1628,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1740,
				"end": 1740,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1775,
				"end": 1775,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1849,
				"end": 1849,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1905,
				"end": 1905,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1917,
				"end": 1917,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1932,
				"end": 1932,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 1944,
				"end": 1944,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2129,
				"end": 2129,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2200,
				"end": 2200,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2313,
				"end": 2313,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2348,
				"end": 2348,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2423,
				"end": 2423,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2479,
				"end": 2479,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2491,
				"end": 2491,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2506,
				"end": 2506,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2518,
				"end": 2518,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2712,
				"end": 2712,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2786,
				"end": 2786,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 2987,
				"end": 2987,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3025,
				"end": 3025,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3035,
				"end": 3035,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3082,
				"end": 3082,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3107,
				"end": 3107,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3117,
				"end": 3117,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3179,
				"end": 3179,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3231,
				"end": 3231,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3295,
				"end": 3295,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3301,
				"end": 3301,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3303,
				"end": 3303,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3363,
				"end": 3363,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3375,
				"end": 3375,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3390,
				"end": 3390,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3402,
				"end": 3402,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3582,
				"end": 3582,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3652,
				"end": 3652,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3717,
				"end": 3717,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3752,
				"end": 3752,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3838,
				"end": 3838,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3849,
				"end": 3849,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3864,
				"end": 3864,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 3876,
				"end": 3876,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4049,
				"end": 4049,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4116,
				"end": 4116,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4225,
				"end": 4225,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4260,
				"end": 4260,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4331,
				"end": 4331,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4387,
				"end": 4387,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4399,
				"end": 4399,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4414,
				"end": 4414,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4426,
				"end": 4426,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4605,
				"end": 4605,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4676,
				"end": 4676,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4740,
				"end": 4740,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4775,
				"end": 4775,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4860,
				"end": 4860,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4871,
				"end": 4871,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4886,
				"end": 4886,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 4898,
				"end": 4898,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5092,
				"end": 5092,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5166,
				"end": 5166,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5262,
				"end": 5262,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5297,
				"end": 5297,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5388,
				"end": 5388,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5449,
				"end": 5449,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5460,
				"end": 5460,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5475,
				"end": 5475,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5487,
				"end": 5487,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5693,
				"end": 5693,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5771,
				"end": 5771,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5871,
				"end": 5871,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 5906,
				"end": 5906,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6001,
				"end": 6001,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6062,
				"end": 6062,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6073,
				"end": 6073,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6088,
				"end": 6088,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6100,
				"end": 6100,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6324,
				"end": 6324,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6408,
				"end": 6408,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6534,
				"end": 6534,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6569,
				"end": 6569,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6657,
				"end": 6657,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6713,
				"end": 6713,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6725,
				"end": 6725,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6740,
				"end": 6740,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6752,
				"end": 6752,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 6961,
				"end": 6961,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7040,
				"end": 7040,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7161,
				"end": 7161,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7196,
				"end": 7196,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7279,
				"end": 7279,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7335,
				"end": 7335,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7347,
				"end": 7347,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7362,
				"end": 7362,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7374,
				"end": 7374,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7562,
				"end": 7562,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7634,
				"end": 7634,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7748,
				"end": 7748,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7783,
				"end": 7783,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7859,
				"end": 7859,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7915,
				"end": 7915,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7927,
				"end": 7927,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7942,
				"end": 7942,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 7954,
				"end": 7954,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8142,
				"end": 8142,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8214,
				"end": 8214,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8328,
				"end": 8328,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8363,
				"end": 8363,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8439,
				"end": 8439,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8495,
				"end": 8495,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8507,
				"end": 8507,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8522,
				"end": 8522,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8534,
				"end": 8534,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8728,
				"end": 8728,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8802,
				"end": 8802,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8918,
				"end": 8918,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 8953,
				"end": 8953,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9031,
				"end": 9031,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9087,
				"end": 9087,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9099,
				"end": 9099,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9114,
				"end": 9114,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9126,
				"end": 9126,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9320,
				"end": 9320,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9394,
				"end": 9394,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9510,
				"end": 9510,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9545,
				"end": 9545,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9623,
				"end": 9623,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9679,
				"end": 9679,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9691,
				"end": 9691,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9706,
				"end": 9706,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9718,
				"end": 9718,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9907,
				"end": 9907,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 9980,
				"end": 9980,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10050,
				"end": 10050,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10085,
				"end": 10085,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10175,
				"end": 10175,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10210,
				"end": 10210,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10221,
				"end": 10221,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10236,
				"end": 10236,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10248,
				"end": 10248,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10431,
				"end": 10431,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10502,
				"end": 10502,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10570,
				"end": 10570,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10605,
				"end": 10605,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10693,
				"end": 10693,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10729,
				"end": 10729,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10749,
				"end": 10749,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 10915,
				"end": 10915,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11053,
				"end": 11053,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11065,
				"end": 11065,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11081,
				"end": 11081,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11094,
				"end": 11094,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11106,
				"end": 11106,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11309,
				"end": 11309,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11388,
				"end": 11388,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11426,
				"end": 11426,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11461,
				"end": 11461,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11633,
				"end": 11633,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11653,
				"end": 11653,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11726,
				"end": 11726,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11942,
				"end": 11942,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11954,
				"end": 11954,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11973,
				"end": 11973,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11986,
				"end": 11986,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 11998,
				"end": 11998,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12186,
				"end": 12186,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12258,
				"end": 12258,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12372,
				"end": 12372,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12407,
				"end": 12407,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12483,
				"end": 12483,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12539,
				"end": 12539,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12551,
				"end": 12551,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12566,
				"end": 12566,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12578,
				"end": 12578,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12775,
				"end": 12775,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12850,
				"end": 12850,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12967,
				"end": 12967,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13002,
				"end": 13002,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13081,
				"end": 13081,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13137,
				"end": 13137,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13149,
				"end": 13149,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13164,
				"end": 13164,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13176,
				"end": 13176,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13344,
				"end": 13344,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13410,
				"end": 13410,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13471,
				"end": 13471,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13506,
				"end": 13506,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13588,
				"end": 13588,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13599,
				"end": 13599,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13614,
				"end": 13614,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13626,
				"end": 13626,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13806,
				"end": 13806,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13876,
				"end": 13876,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13941,
				"end": 13941,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13976,
				"end": 13976,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14062,
				"end": 14062,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14073,
				"end": 14073,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14088,
				"end": 14088,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14100,
				"end": 14100,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14283,
				"end": 14283,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14354,
				"end": 14354,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14420,
				"end": 14420,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14455,
				"end": 14455,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14543,
				"end": 14543,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14581,
				"end": 14581,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14592,
				"end": 14592,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14607,
				"end": 14607,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14619,
				"end": 14619,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14799,
				"end": 14799,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14869,
				"end": 14869,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14934,
				"end": 14934,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14969,
				"end": 14969,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15055,
				"end": 15055,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15066,
				"end": 15066,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15081,
				"end": 15081,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15093,
				"end": 15093,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15264,
				"end": 15264,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15331,
				"end": 15331,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15393,
				"end": 15393,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15428,
				"end": 15428,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15511,
				"end": 15511,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15522,
				"end": 15522,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15537,
				"end": 15537,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15549,
				"end": 15549,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15747,
				"end": 15747,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15823,
				"end": 15823,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15894,
				"end": 15894,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15929,
				"end": 15929,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16021,
				"end": 16021,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16032,
				"end": 16032,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16047,
				"end": 16047,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16059,
				"end": 16059,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16242,
				"end": 16242,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16313,
				"end": 16313,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16379,
				"end": 16379,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16414,
				"end": 16414,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16501,
				"end": 16501,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16512,
				"end": 16512,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16527,
				"end": 16527,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16539,
				"end": 16539,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16749,
				"end": 16749,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16829,
				"end": 16829,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16904,
				"end": 16904,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 16939,
				"end": 16939,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17035,
				"end": 17035,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17046,
				"end": 17046,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17061,
				"end": 17061,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17073,
				"end": 17073,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17249,
				"end": 17249,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17317,
				"end": 17317,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17427,
				"end": 17427,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17462,
				"end": 17462,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17534,
				"end": 17534,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17590,
				"end": 17590,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17602,
				"end": 17602,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17617,
				"end": 17617,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17629,
				"end": 17629,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17838,
				"end": 17838,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17919,
				"end": 17919,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 17993,
				"end": 17993,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18028,
				"end": 18028,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18179,
				"end": 18179,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18190,
				"end": 18190,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18205,
				"end": 18205,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18217,
				"end": 18217,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18414,
				"end": 18414,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18489,
				"end": 18489,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18606,
				"end": 18606,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18641,
				"end": 18641,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18720,
				"end": 18720,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18776,
				"end": 18776,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18788,
				"end": 18788,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18803,
				"end": 18803,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 18815,
				"end": 18815,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19012,
				"end": 19012,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19087,
				"end": 19087,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19204,
				"end": 19204,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19239,
				"end": 19239,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19318,
				"end": 19318,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19374,
				"end": 19374,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19386,
				"end": 19386,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19401,
				"end": 19401,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19413,
				"end": 19413,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19613,
				"end": 19613,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19689,
				"end": 19689,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19807,
				"end": 19807,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19842,
				"end": 19842,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19922,
				"end": 19922,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19978,
				"end": 19978,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 19990,
				"end": 19990,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20005,
				"end": 20005,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20017,
				"end": 20017,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20208,
				"end": 20208,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20281,
				"end": 20281,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20396,
				"end": 20396,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20431,
				"end": 20431,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20508,
				"end": 20508,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20564,
				"end": 20564,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20576,
				"end": 20576,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20591,
				"end": 20591,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20603,
				"end": 20603,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20802,
				"end": 20802,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20878,
				"end": 20878,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 20996,
				"end": 20996,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21031,
				"end": 21031,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21111,
				"end": 21111,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21167,
				"end": 21167,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21179,
				"end": 21179,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21194,
				"end": 21194,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21206,
				"end": 21206,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21394,
				"end": 21394,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21468,
				"end": 21468,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21535,
				"end": 21535,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21570,
				"end": 21570,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21667,
				"end": 21667,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21678,
				"end": 21678,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21693,
				"end": 21693,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21705,
				"end": 21705,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21905,
				"end": 21905,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 21983,
				"end": 21983,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22054,
				"end": 22054,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22089,
				"end": 22089,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22190,
				"end": 22190,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22201,
				"end": 22201,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22216,
				"end": 22216,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22228,
				"end": 22228,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22428,
				"end": 22428,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22504,
				"end": 22504,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22622,
				"end": 22622,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22657,
				"end": 22657,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22737,
				"end": 22737,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22793,
				"end": 22793,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22805,
				"end": 22805,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22820,
				"end": 22820,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22831,
				"end": 22831,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 22869,
				"end": 22905,
				"current": "\nimport type { Locale } from 'i18n';",
				"baseline": ""
			},
			{
				"start": 22972,
				"end": 22972,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 23274,
				"end": 23332,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/roles.role.vue",
		"currentSha256": "b0eb890c83685778f422578d5fab1bb48016640584dfc66ff498883db7d9f351",
		"baselineSha256": "ac9fea05b438269ed0ef94cdab8620a1a2a974783a0aba1a08e4ec6bc8988298",
		"keys": [
			"delete",
			"edit",
			"users",
			"info",
			"oneDay",
			"oneHour",
			"oneMonth",
			"oneWeek",
			"indefinitely",
			"period",
			"deleteAreYouSure"
		],
		"order": [
			"edit",
			"delete",
			"info",
			"users",
			"assign",
			"noUsers",
			"indefinitely",
			"roleIsConditionalRole",
			"deleteAreYouSure",
			"period",
			"oneHour",
			"oneDay",
			"oneWeek",
			"oneMonth",
			"unassign",
			"role"
		],
		"edits": [
			{
				"start": 2577,
				"end": 2577,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3552,
				"end": 3646,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/admin/roles.vue",
		"currentSha256": "057d9e1c85ec3dabc30cfaed5c1a2730a9442793bfa80d002473275800355626",
		"baselineSha256": "91cf46bb9b9a2b0c10bd1bed35fe5842a99a54d9ec04fb18a5945433a0ebd7b2",
		"keys": [
			"save"
		],
		"order": [
			"baseRole",
			"save",
			"new",
			"manualRoles",
			"conditionalRoles",
			"roles"
		],
		"edits": [
			{
				"start": 1616,
				"end": 1616,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2543,
				"end": 2637,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/pages/role.vue",
		"currentSha256": "4220570c6d97d7ca175eff0984759177eff6214ca890b91ea610fbba8d2bcc75",
		"baselineSha256": "708406d10959bb39b6e74ffa6533f48700db2664338eda742882813f4d553b67",
		"keys": [
			"somethingHappened",
			"users",
			"timeline"
		],
		"order": [
			"nothing",
			"noRole",
			"somethingHappened",
			"users",
			"timeline",
			"role"
		],
		"edits": [
			{
				"start": 1021,
				"end": 1021,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1514,
				"end": 1608,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/runtime/frontend/ts-messages.vue",
		"currentSha256": "01f728931420938748c3ef609f47a8a37674fbe0091f2da91022e964bb1b743f",
		"baselineSha256": "95a72edaddff27351368bcf347390d8b8e4b9b4d540b37415865c75d4a86a79a",
		"keys": [
			"somethingHappened"
		],
		"order": [
			"somethingHappened"
		]
	},
	{
		"file": "packages/features/share/frontend/pages/qr.read.vue",
		"currentSha256": "eed885f67573fb707ee09a8c86989ca49fc7ec63566e2075a7b2062edac1ee57",
		"baselineSha256": "be7711791f878156b75789ccb2c7fb2dae670c29f5c25fa295138516767b554e",
		"keys": [
			"notes",
			"somethingHappened",
			"all",
			"users"
		],
		"order": [
			"noQrCodeFound",
			"chooseCamera",
			"somethingHappened",
			"scanFile",
			"stopQr",
			"startQr",
			"cannotToggleFlash",
			"turnOnFlash",
			"turnOffFlash",
			"users",
			"notes",
			"all"
		],
		"edits": [
			{
				"start": 2755,
				"end": 2755,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3008,
				"end": 3008,
				"current": "",
				"baseline": ".js';\nimport type { ApShowResponse } from 'misskey-js/entities"
			},
			{
				"start": 3506,
				"end": 3662,
				"current": ";\nimport type { ApShowResponse } from 'misskey-js/entities.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/share/frontend/pages/share.vue",
		"currentSha256": "f9909e204ae8add1a407b878a6523dd74c3328d3f47de9481ff026ec35396ecf",
		"baselineSha256": "350c2ed8a74341bcdd830276fe977d5f1a59a77f0d1bc05aca51ff81e6a0d2b9",
		"keys": [
			"close",
			"share"
		],
		"order": [
			"close",
			"menu",
			"error",
			"goToMisskey",
			"share"
		],
		"edits": [
			{
				"start": 929,
				"end": 929,
				"current": "",
				"baseline": "import type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 1676,
				"end": 1770,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/components/MkInstanceStats.vue",
		"currentSha256": "f9cb67c2778e89675e978a7e22ee52f42854733eb6526e52f963f540c8e60eaf",
		"baselineSha256": "73695cdcd69644885926c1c0a0d64a49c9dcb08c53558bf9d0e4f5cc9ff52676",
		"keys": [
			"notes",
			"users",
			"drive"
		],
		"order": [
			"perHour",
			"perDay",
			"federation",
			"chartsFederation",
			"chartsApRequest",
			"users",
			"chartsUsersIncDec",
			"chartsUsersTotal",
			"chartsActiveUsers",
			"chartsNotesIncDec",
			"chartsLocalNotesIncDec",
			"chartsRemoteNotesIncDec",
			"chartsNotesTotal",
			"notes",
			"drive",
			"chartsFilesIncDec",
			"chartsStorageUsageIncDec"
		],
		"edits": [
			{
				"start": 1773,
				"end": 1773,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1869,
				"end": 1869,
				"current": "",
				"baseline": "';\nimport type { MkSelectItem, ItemOption } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue"
			},
			{
				"start": 2965,
				"end": 3240,
				"current": ";\nimport type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';\nimport type { MkSelectItem, ItemOption } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/components/MkVisitorDashboard.vue",
		"currentSha256": "29257cc9f2a93df21a7279b03137556b5b0099845f57091efe1f6c570a065be7",
		"baselineSha256": "1cea7765e0439a5ffaf2923d955a7e40c99f9367f5526694ce74673383a44802",
		"keys": [
			"notes",
			"users"
		],
		"order": [
			"headlineMisskey",
			"invitationRequiredToRegister",
			"federationSpecified",
			"federationDisabled",
			"joinThisServer",
			"exploreOtherServers",
			"login",
			"users",
			"notes",
			"letsLookAtTimeline"
		],
		"edits": [
			{
				"start": 2989,
				"end": 2989,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3739,
				"end": 3833,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/pages/user/index.activity.vue",
		"currentSha256": "66a0a71e8ed44d27d6dd2d4baa291f28b2f32254c97ad923cbdb6192bc4abdfa",
		"baselineSha256": "be521bfb9efdf11ff8d012f5e7c5541da437444ab3e681dfc8f47db7dea9d4c6",
		"keys": [
			"notes",
			"following",
			"followers"
		],
		"order": [
			"activity",
			"notes",
			"numberOfProfileView",
			"following",
			"followers"
		],
		"edits": [
			{
				"start": 728,
				"end": 728,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 988,
				"end": 1082,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/components/MkAntennaEditor.vue",
		"currentSha256": "879fdc462f0bc83a23970af8776210d27c8ddc583fd449a0dee76dcf03f819d3",
		"baselineSha256": "066854366235268030daf7138d2346d4526bd9f947d63a2934085781ece62e32",
		"keys": [
			"save",
			"delete",
			"name",
			"users",
			"removeAreYouSure",
			"localOnly"
		],
		"order": [
			"name",
			"antennaSource",
			"userList",
			"users",
			"antennaUsersDescription",
			"addUser",
			"antennaExcludeBots",
			"withReplies",
			"antennaKeywords",
			"antennaKeywordsDescription",
			"antennaExcludeKeywords",
			"localOnly",
			"caseSensitive",
			"withFileAntenna",
			"excludeNotesInSensitiveChannel",
			"save",
			"delete",
			"antennaSourcesAll",
			"antennaSourcesHomeTimeline",
			"antennaSourcesUsers",
			"antennaSourcesUserList",
			"antennaSourcesUserBlacklist",
			"removeAreYouSure"
		],
		"edits": [
			{
				"start": 2328,
				"end": 2328,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2399,
				"end": 2399,
				"current": "",
				"baseline": "js';\nimport type { DeepPartial } from '@features/runtime/frontend/utility/merge."
			},
			{
				"start": 3142,
				"end": 3316,
				"current": ";\nimport type { DeepPartial } from '@features/runtime/frontend/utility/merge.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/components/MkTutorialDialog.Timeline.vue",
		"currentSha256": "f96867001df677b355835afe9b084fb34222110980cccbc26058d8eff1977a36",
		"baselineSha256": "c6542ea8af2721ecb3387ed8f5c1321daf1bd692cdb9a4b2a424afd5ca2648f1",
		"keys": [
			"timelinesLabels"
		],
		"order": [
			"initialTutorialTimelineDescription1",
			"timelinesLabels",
			"initialTutorialTimelineLabels",
			"initialTutorialTimelineDescription2",
			"initialTutorialTimelineDescription3",
			"help"
		],
		"edits": [
			{
				"start": 1113,
				"end": 1113,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1301,
				"end": 1395,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/antenna-timeline.vue",
		"currentSha256": "c01fc8c7293a352873939bcc43aedc93d98b263cddbc62caa88e01a401a32dab",
		"baselineSha256": "105855c1a5fd86dc64f67c61d3043456d357f2b5e8ff71596ea978cc406562dc",
		"keys": [
			"antennas",
			"settings"
		],
		"order": [
			"settings",
			"antennas"
		],
		"edits": [
			{
				"start": 527,
				"end": 527,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 999,
				"end": 1093,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/my-antennas/edit.vue",
		"currentSha256": "f9c31294cc2b0e025e819f80169b89c48fad608a347f2fa6e77d8e617b07c727",
		"baselineSha256": "a284d4de8eb00ac392f7db108031620478cb5a7c232960f5f93ceccfb470183f",
		"keys": [
			"timeline"
		],
		"order": [
			"timeline",
			"editAntenna"
		],
		"edits": [
			{
				"start": 376,
				"end": 376,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 824,
				"end": 918,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/my-antennas/index.vue",
		"currentSha256": "df1db2c2e5d0b2953c3d6aff30f90fd94b85264634196dd28369202a1a0e56e9",
		"baselineSha256": "61609a42db4a9ad06e4c62cd0d2839c59e671f3474e4bb82dd989d8e26729553",
		"keys": [
			"reload",
			"add"
		],
		"order": [
			"add",
			"reload",
			"manageAntennas"
		],
		"edits": [
			{
				"start": 827,
				"end": 827,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1070,
				"end": 1164,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/timeline.vue",
		"currentSha256": "de13469d998748018498e0bcbb73c78c0d4fd3dc5a514ec7281773b66c527805",
		"baselineSha256": "f19c304505f10b523e86420b229ae8dc4a02a3f22fd53726f0cb126e7a68bc46",
		"keys": [
			"lists",
			"reload",
			"antennas",
			"createNew",
			"timeline",
			"showRepliesToOthersInTimeline",
			"channel",
			"timelinesLabels"
		],
		"order": [
			"timelineDescriptionLabels",
			"createNew",
			"options",
			"showRenotes",
			"showRepliesToOthersInTimeline",
			"withSensitive",
			"fileAttachedOnly",
			"showFixedPostForm",
			"reload",
			"timelinesLabels",
			"lists",
			"antennas",
			"channel",
			"timeline"
		],
		"edits": [
			{
				"start": 1171,
				"end": 1171,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1254,
				"end": 1254,
				"current": "",
				"baseline": "';\nimport type { Tab } from '@features/navigation/frontend/components/global/MkPageHeader.tabs.vue';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { BasicTimelineType } from '@features/timelines/frontend/timelines.js';\nimport type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js"
			},
			{
				"start": 2348,
				"end": 2791,
				"current": ";\nimport type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';\nimport type { BasicTimelineType } from '@features/timelines/frontend/timelines.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Tab } from '@features/navigation/frontend/components/global/MkPageHeader.tabs.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/user/index.timeline.vue",
		"currentSha256": "e7195450f481d23474f7ece7976ba16a004e18ed7783a4f95bad739ba4160869",
		"baselineSha256": "61706ce41ffcf17ae5ba6560ed07fe7f51ebcbe6e5796d010c831c0905b68022",
		"keys": [
			"notes",
			"all"
		],
		"order": [
			"featured",
			"notes",
			"all",
			"withFiles"
		],
		"edits": [
			{
				"start": 831,
				"end": 831,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1134,
				"end": 1228,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/ui/deck/antenna-column.vue",
		"currentSha256": "44f678633e88710bf9e98f305531792f06b62c4ca69561dd43736065260aaf93",
		"baselineSha256": "6ddc687eb210e70b8fdd21dd4c535fc8261b2a1910f5e93f201f754eb05bfda6",
		"keys": [
			"createNew"
		],
		"order": [
			"antenna",
			"selectAntenna",
			"createNew",
			"createdAntennas",
			"editAntenna",
			"newNoteNotificationSettings"
		],
		"edits": [
			{
				"start": 642,
				"end": 642,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 724,
				"end": 724,
				"current": "",
				"baseline": "';\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type * as Misskey from 'misskey-js';\nimport type { entities as MisskeyEntities } from 'misskey-js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js"
			},
			{
				"start": 1197,
				"end": 1698,
				"current": ";\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type * as Misskey from 'misskey-js';\nimport type { entities as MisskeyEntities } from 'misskey-js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/ui/deck/tl-column.vue",
		"currentSha256": "f9992a00803dc35d0f85ad631eaed149aeec96cc064f4c53d4d55d2f0a3ffba1",
		"baselineSha256": "e22dfcc08ecd16dccfc33e7fae0a3b9209ddcb2e03f70ba8e95db2179636f1e2",
		"keys": [
			"timeline",
			"showRepliesToOthersInTimeline",
			"timelinesLabels"
		],
		"order": [
			"timelinesLabels",
			"deckColumnsTl",
			"disabledTimelineTitle",
			"disabledTimelineDescription",
			"timeline",
			"timelinesHome",
			"timelinesLocal",
			"timelinesSocial",
			"timelinesGlobal",
			"deckNewNoteNotificationSettings",
			"showRenotes",
			"showRepliesToOthersInTimeline",
			"fileAttachedOnly",
			"withSensitive"
		],
		"edits": [
			{
				"start": 1255,
				"end": 1255,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1316,
				"end": 1316,
				"current": "",
				"baseline": "';\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js"
			},
			{
				"start": 1877,
				"end": 2271,
				"current": ";\nimport XColumn from '../../../../navigation/frontend/ui/deck/column.vue';\nimport type { SoundStore } from '@features/preferences/frontend/state/def.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { Column } from '@features/preferences/frontend/deck.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/widgets/WidgetTimeline.vue",
		"currentSha256": "6c0dd05106045d36d7209af7b4734343de8d8b64d09998c829ecaed98de0d93c",
		"baselineSha256": "5aedf9991803d300b04f82fd4bae67d63272324abca92f5864f0b96ee4cff360",
		"keys": [
			"timelinesLabels"
		],
		"order": [
			"disabledTimelineTitle",
			"disabledTimelineDescription",
			"timelinesLabels"
		],
		"edits": [
			{
				"start": 1603,
				"end": 1603,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1667,
				"end": 1667,
				"current": "",
				"baseline": "js';\nimport { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu."
			},
			{
				"start": 2247,
				"end": 2724,
				"current": ";\nimport { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';\nimport type { MenuItem } from '@features/navigation/frontend/types/menu.js';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkContainer.vue",
		"currentSha256": "4fb5634ffd1247386dee8880ea89def374c158ce5375c9f37a368fa7401286e6",
		"baselineSha256": "3e749723748b35623674093195b40011ce25506ac0ed1473652582da30c29a49",
		"keys": [
			"showMore"
		],
		"order": [
			"showMore"
		],
		"edits": [
			{
				"start": 1700,
				"end": 1700,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1837,
				"end": 1931,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkDialog.vue",
		"currentSha256": "346d2275f3f8416df674bda5016d5f07af31650b889a77d7a97a5f620aceacbf",
		"baselineSha256": "8fe1f6218e425fc9c6aab5a43bd213c697db1805463f6a081c2c4c359c600193",
		"keys": [
			"ok",
			"cancel",
			"gotIt"
		],
		"order": [
			"charactersExceeded",
			"charactersBelow",
			"ok",
			"gotIt",
			"cancel"
		],
		"edits": [
			{
				"start": 2976,
				"end": 3012,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 3071,
				"end": 3071,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 3276,
				"end": 3334,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			},
			{
				"start": 3671,
				"end": 3671,
				"current": "",
				"baseline": "type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { OptionValue } from '@features/ui/frontend/types/option-value.js';\nimport "
			},
			{
				"start": 3849,
				"end": 4012,
				"current": "';\nimport type { OptionValue } from '@features/ui/frontend/types/option-value.js';\nimport type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkFormFooter.vue",
		"currentSha256": "881b8325195adf3ca51fd2deec2fd0ba60d712bbc1912ee4f2dcfbe2dcbb16d9",
		"baselineSha256": "b69d164dad83ba3499a8832c1c0132a224160e2160afb87448b69bbc8cbcd758",
		"keys": [
			"save"
		],
		"order": [
			"thereAreNChanges",
			"discard",
			"save"
		],
		"edits": [
			{
				"start": 619,
				"end": 655,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 714,
				"end": 714,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 884,
				"end": 942,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkInput.vue",
		"currentSha256": "c5503a08daabf904bf685d3b77f89b967d7b3c2bc90a92ae084e199900baddc1",
		"baselineSha256": "55773dedf102145685dab3f2e0c21f4dfd062a728cb47781edf525f75c47da00",
		"keys": [
			"save"
		],
		"order": [
			"save"
		],
		"edits": [
			{
				"start": 1405,
				"end": 1441,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1500,
				"end": 1500,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1932,
				"end": 1990,
				"current": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n",
				"baseline": ""
			},
			{
				"start": 2145,
				"end": 2145,
				"current": "",
				"baseline": "';\nimport type { InputHTMLAttributes } from 'vue';\nimport type { SuggestionType } from '@features/discovery/frontend/utility/autocomplete.js"
			},
			{
				"start": 2366,
				"end": 2506,
				"current": "';\nimport type { SuggestionType } from '@features/discovery/frontend/utility/autocomplete.js';\nimport type { InputHTMLAttributes } from 'vue",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkKeyValue.vue",
		"currentSha256": "f503aa2fd7658895a89613347fda8162def7e7a4abe4f7d4ef4be26fc4431a50",
		"baselineSha256": "ed299662ea442ea69d8e72bdd11ab252f2740f71fc86dd408b37dd7fd54aa635",
		"keys": [
			"copy"
		],
		"order": [
			"copy"
		],
		"edits": [
			{
				"start": 526,
				"end": 562,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 621,
				"end": 621,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 780,
				"end": 838,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkMenu.vue",
		"currentSha256": "58fc8fc0cbd4e6be9c4ad4e7a5e5b283049e6e17c4f0ee7cb25c1626e47a4033",
		"baselineSha256": "01fc0c2cea76127c28557f2943206706f63c3c1308c64051fae02bc794e2b6db",
		"keys": [
			"none"
		],
		"order": [
			"none"
		],
		"edits": [
			{
				"start": 9132,
				"end": 9132,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 9286,
				"end": 9286,
				"current": "",
				"baseline": "';\nimport type { MenuItem, InnerMenuItem, MenuPending, MenuAction, MenuSwitch, MenuRadio, MenuRadioOption, MenuParent } from '@features/navigation/frontend/types/menu.js';\nimport type { Keymap } from '@features/ui/frontend/utility/hotkey.js"
			},
			{
				"start": 9651,
				"end": 9927,
				"current": "import type { Keymap } from '@features/ui/frontend/utility/hotkey.js';\nimport type { MenuItem, InnerMenuItem, MenuPending, MenuAction, MenuSwitch, MenuRadio, MenuRadioOption, MenuParent } from '@features/navigation/frontend/types/menu.js';\nimport type { Locale } from 'i18n';\n",
				"baseline": ""
			},
			{
				"start": 10024,
				"end": 10082,
				"current": "\nconst globalLocale = useLocale<Locale>(import.meta.url);\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkModalWindow.vue",
		"currentSha256": "97059a7da2bcee685a4349f522b04922b42374f64f12ddee4c60ed5717bb48c5",
		"baselineSha256": "80199c9ca22f0dab36550fb5214675f558a039f2a9dd389b3530eb50cf8fbb6d",
		"keys": [
			"done"
		],
		"order": [
			"done"
		],
		"edits": [
			{
				"start": 1290,
				"end": 1290,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1561,
				"end": 1655,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkOmit.vue",
		"currentSha256": "acb9f7f94f23f936c1ac10cc251da4cb36268e32e237427c854e0c0af7fc21f7",
		"baselineSha256": "7791a6765ad3e3c34e0bbc269462dc7534531fd49cd769847e541704887f8ea1",
		"keys": [
			"showMore"
		],
		"order": [
			"showMore"
		],
		"edits": [
			{
				"start": 523,
				"end": 523,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 581,
				"end": 675,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkPagination.vue",
		"currentSha256": "ee2766ab106e0cd120ea5fabace836fbb62860fc6e1c3d02ff96b82ee98a9129",
		"baselineSha256": "962781234f622f91d3e811be111c2a93006d1e6e367ece0281cd5de17b28870f",
		"keys": [
			"reload"
		],
		"order": [
			"reload",
			"loadMore"
		],
		"expanded": true,
		"edits": [
			{
				"start": 2178,
				"end": 2178,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 3170,
				"end": 3228,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkPaginationControl.vue",
		"currentSha256": "e846328b09ee5897724c5303df7b23de5117eedcd1c758358f4f2a587089b28c",
		"baselineSha256": "32072d72829e6167545daa02f53bfdd665c084c0d716d4eae47c91f58860d8dc",
		"keys": [
			"search",
			"reload",
			"filter"
		],
		"order": [
			"search",
			"filter",
			"dateAndTime",
			"reload",
			"newest",
			"oldest"
		],
		"edits": [
			{
				"start": 1650,
				"end": 1650,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1674,
				"end": 1674,
				"current": "",
				"baseline": "';\nimport type { IPaginator } from '@features/ui/frontend/utility/paginator.js"
			},
			{
				"start": 2056,
				"end": 2228,
				"current": ";\nimport type { IPaginator } from '@features/ui/frontend/utility/paginator.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkSpot.vue",
		"currentSha256": "da31108b7cfee430fe3cbb04c5dca8b4bb5e4175d957e8b43022d9cb74962dd4",
		"baselineSha256": "afe7d166f40057d0abf287c62474fa91b954c5222e75eca841985a55da0a16cc",
		"keys": [
			"next",
			"done",
			"goBack"
		],
		"order": [
			"goBack",
			"next",
			"done"
		],
		"edits": [
			{
				"start": 946,
				"end": 946,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1220,
				"end": 1314,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkTextarea.vue",
		"currentSha256": "db19a1966f164f18c2e2e8f9340e59024ccdc0658f7430bf9690feb538a8513e",
		"baselineSha256": "d828ec631166ae7169ef3eb14711f7e12281a9add730865a7e0cecb13c9e9052",
		"keys": [
			"save",
			"preview"
		],
		"order": [
			"preview",
			"save"
		],
		"edits": [
			{
				"start": 1392,
				"end": 1392,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1530,
				"end": 1530,
				"current": "",
				"baseline": "';\nimport type { SuggestionType } from '@features/discovery/frontend/utility/autocomplete.js"
			},
			{
				"start": 1686,
				"end": 1872,
				"current": ";\nimport type { SuggestionType } from '@features/discovery/frontend/utility/autocomplete.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkWidgetSettingsDialog.vue",
		"currentSha256": "53dd943645678c9a3f6d9f9c8452f7cb2dddc6c60eb4c87813c5f0f765214547",
		"baselineSha256": "e34ccd3e95f104b259354e95bff4340b040bbc58e2677d4324869eca0bd522f4",
		"keys": [
			"preview"
		],
		"order": [
			"widgetsLabels",
			"preview"
		],
		"edits": [
			{
				"start": 1319,
				"end": 1319,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1490,
				"end": 1490,
				"current": "",
				"baseline": "';\nimport type { Form } from '@features/ui/frontend/utility/form.js';\nimport type { WidgetName } from '@features/index/frontend/widgets.js"
			},
			{
				"start": 1803,
				"end": 2035,
				"current": ";\nimport type { WidgetName } from '@features/index/frontend/widgets.js';\nimport type { Form } from '@features/ui/frontend/utility/form.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkWidgets.vue",
		"currentSha256": "5be94e377c021055922abda1933ad09658019840353d72be2e5dbbfe610fbf39",
		"baselineSha256": "4e88902f8293886a2609351dc1305097e273b2edc2bc194d6f9e26fa63342ca8",
		"keys": [
			"close",
			"none",
			"add",
			"settings"
		],
		"order": [
			"selectWidget",
			"add",
			"close",
			"none",
			"widgetsLabels",
			"settings"
		],
		"edits": [
			{
				"start": 1878,
				"end": 1914,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1973,
				"end": 1973,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 2163,
				"end": 2221,
				"current": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n",
				"baseline": ""
			},
			{
				"start": 2316,
				"end": 2316,
				"current": "",
				"baseline": "';\nimport type { Component } from 'vue"
			},
			{
				"start": 2987,
				"end": 3025,
				"current": "';\nimport type { Component } from 'vue",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkWindow.vue",
		"currentSha256": "8b79ea75214325a89ddbb2db5cc4d054cfb56a41a4e21760f9ef702b5a85cf63",
		"baselineSha256": "8751a56c744171748ecf6e98432db7383e20ed5d500de7401aa406a2c67ef172",
		"keys": [
			"close"
		],
		"order": [
			"windowRestore",
			"windowMinimize",
			"windowMaximize",
			"close"
		],
		"edits": [
			{
				"start": 3565,
				"end": 3565,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 3928,
				"end": 3986,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/global/MkError.vue",
		"currentSha256": "041ab20c447e6372649ac9f9bc5a08e61f68e82c6ba98a73465e6a5dd0b4d665",
		"baselineSha256": "57a6d846b0d9b3cba2e702095f605681cdddbb04a3a29dc06402019514080e52",
		"keys": [
			"retry"
		],
		"order": [
			"retry"
		],
		"edits": [
			{
				"start": 370,
				"end": 370,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 431,
				"end": 525,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/global/MkResult.vue",
		"currentSha256": "659157d1f4ea86384cea789aa5bbf37ef6126e86126ed26040ebb2c73925689c",
		"baselineSha256": "167a66f74ca72a46f12429aeee64569e5a9f372bcbee6f1ef89d7d72ed1c24dd",
		"keys": [
			"somethingHappened"
		],
		"order": [
			"nothing",
			"notFound",
			"somethingHappened"
		],
		"edits": [
			{
				"start": 1162,
				"end": 1198,
				"current": "type { Locale } from 'i18n';\nimport ",
				"baseline": ""
			},
			{
				"start": 1257,
				"end": 1257,
				"current": "",
				"baseline": "\nimport type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n"
			},
			{
				"start": 1418,
				"end": 1476,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/global/MkSuspense.vue",
		"currentSha256": "0b36a9b35f8fce3c1c5417d8957cecd81780ebc6954286f6314974f2bceebcf4",
		"baselineSha256": "63eb762e829b7b8ae9350ad08b8bead2574555f6e870bce943ca3cb4aba90796",
		"keys": [
			"somethingHappened",
			"retry"
		],
		"order": [
			"somethingHappened",
			"retry"
		],
		"edits": [
			{
				"start": 745,
				"end": 745,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 840,
				"end": 934,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/global/MkTip.vue",
		"currentSha256": "21942d7ed6e445a9f6d577239d43c0d18e299096dd0dd7a86d420361404acbc5",
		"baselineSha256": "a19ef399e643f9998f30dfa584988dc2c427ec2f6d2ff0e9b1b255cbb76fd55d",
		"keys": [
			"gotIt"
		],
		"order": [
			"tip",
			"gotIt",
			"hideAllTips"
		],
		"edits": [
			{
				"start": 728,
				"end": 728,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 983,
				"end": 1077,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/embed/components/EmError.vue",
		"currentSha256": "393c2d136301ec72f2fd29d337cc2e9b9408e701b2dbb54096dd21097cc55b2b",
		"baselineSha256": "e6a4c9558382f425545166ac7af1fadf35876d8ca4420f9e9642be0c0f6e09c2",
		"keys": [
			"somethingHappened",
			"retry"
		],
		"order": [
			"somethingHappened",
			"retry"
		],
		"edits": [
			{
				"start": 527,
				"end": 528,
				"current": "\n",
				"baseline": ""
			},
			{
				"start": 584,
				"end": 584,
				"current": "",
				"baseline": "\n"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/pages/preview.vue",
		"currentSha256": "a8202b23e96412a5e9825f37938a9a2e5e3f48e009e7a6c16f1ac487e06cded6",
		"baselineSha256": "e12869342aebbbf59edf9e334d378e2e26ae81b828473f1a29bb39a334ae46e5",
		"keys": [
			"preview"
		],
		"order": [
			"preview"
		],
		"edits": [
			{
				"start": 249,
				"end": 249,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 415,
				"end": 509,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/ts-messages.vue",
		"currentSha256": "5054e725d09140c42770e57c2117c14c50e2bae32caa4ee69c6bcb8ad06cc413",
		"baselineSha256": "c15858d7a5f690f55d4646bc29350b3379a12d9addceaa8dbc7498e412a08446",
		"keys": [
			"ok",
			"somethingHappened",
			"error",
			"areYouSure",
			"yes",
			"no",
			"gotIt",
			"resetAreYouSure"
		],
		"order": [
			"areYouSure",
			"yes",
			"no",
			"resetAreYouSure",
			"inputMessageHere",
			"_dialog",
			"ok",
			"_ago",
			"_timeIn",
			"_gridComponent",
			"_time",
			"copiedToClipboard",
			"internalServerError",
			"internalServerErrorDescription",
			"gotIt",
			"copyErrorInfo",
			"cannotPerformTemporary",
			"cannotPerformTemporaryDescription",
			"invalidParamError",
			"invalidParamErrorDescription",
			"permissionDeniedError",
			"permissionDeniedErrorDescription",
			"youCannotCreateAnymore",
			"error",
			"gotInvalidResponseError",
			"gotInvalidResponseErrorDescription",
			"somethingHappened"
		]
	},
	{
		"file": "packages/features/ui/frontend/widgets/WidgetClock.vue",
		"currentSha256": "fccaf5f3fcfda7aeb9ec558239f16b3ac696feed3099bf113e4d863758f87744",
		"baselineSha256": "531d05d6d5f0b6e98a4b218eef758a989fcc12a38b8994b9af075c8734be827c",
		"keys": [
			"none",
			"medium"
		],
		"order": [
			"transparent",
			"size",
			"small",
			"medium",
			"large",
			"thickness",
			"thicknessThin",
			"thicknessMedium",
			"thicknessThick",
			"graduations",
			"none",
			"graduationDots",
			"graduationArabic",
			"fadeGraduations",
			"sAnimation",
			"sAnimationElastic",
			"sAnimationEaseOut",
			"twentyFour",
			"label",
			"labelTime",
			"labelTz",
			"labelTimeAndTz",
			"timezone",
			"auto"
		],
		"edits": [
			{
				"start": 1295,
				"end": 1295,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1317,
				"end": 1317,
				"current": "",
				"baseline": "';\nimport { useWidgetPropsManager } from './widget.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js"
			},
			{
				"start": 1628,
				"end": 1974,
				"current": ";\nimport { useWidgetPropsManager } from './widget.js';\nimport type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';\nimport type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/components/MkUserAnnouncementEditDialog.vue",
		"currentSha256": "446d3a454e29b293afcf1470ac7d97f42c45f0362e6e20f3306c001e5765b004",
		"baselineSha256": "9e97c5068db3ef2526025e634f98ce8de572b6e47daa427d258dcea00903ba25",
		"keys": [
			"delete",
			"title",
			"create",
			"update",
			"removeAreYouSure"
		],
		"order": [
			"removeAreYouSure",
			"title",
			"text",
			"icon",
			"normal",
			"banner",
			"dialog",
			"display",
			"needConfirmationToRead",
			"needConfirmationToReadDescription",
			"delete",
			"update",
			"create",
			"autoArchiveAt",
			"autoArchiveAtDescription",
			"autoArchiveAtMustBeInFuture"
		],
		"edits": [
			{
				"start": 2366,
				"end": 2366,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2436,
				"end": 2436,
				"current": "",
				"baseline": "js';\nimport type { ApiWithDialogCustomErrors } from '@features/ui/frontend/os."
			},
			{
				"start": 3317,
				"end": 3489,
				"current": ";\nimport type { ApiWithDialogCustomErrors } from '@features/ui/frontend/os.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/components/MkUserInfo.vue",
		"currentSha256": "ec2206d7d82df69ffab5a09d73d016110289d08276adddd1c069007fd910e91b",
		"baselineSha256": "e342c178ca1bbb4286d582703985395553016726ae9bfb93727ce3c871f13538",
		"keys": [
			"notes",
			"following",
			"followers"
		],
		"order": [
			"followsYou",
			"noAccountDescription",
			"notes",
			"following",
			"followers"
		],
		"edits": [
			{
				"start": 1982,
				"end": 1982,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2572,
				"end": 2666,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/components/MkUserPopup.vue",
		"currentSha256": "2c99d46fe11b5166f750e2b14683142729cf4211e3fb717d8d138248658e18e5",
		"baselineSha256": "d961e03b90bfcdfa259f3f1d1e4d6466031946a7af4e48ebff456586cac365b0",
		"keys": [
			"notes",
			"following",
			"followers"
		],
		"order": [
			"followsYou",
			"noAccountDescription",
			"notes",
			"following",
			"followers"
		],
		"edits": [
			{
				"start": 3085,
				"end": 3085,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3921,
				"end": 4015,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/components/MkUserSetupDialog.User.vue",
		"currentSha256": "f550f4c5b529c37e6fdc8d6535da878eb397149ff619b4fdaf481ba85384e4c0",
		"baselineSha256": "ee4adc6b70dc41b8fcf5f5e8fb105b0028af17f111a92929cc0cc194224ce458",
		"keys": [
			"follow"
		],
		"order": [
			"noAccountDescription",
			"follow",
			"youFollowing"
		],
		"edits": [
			{
				"start": 1177,
				"end": 1177,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1380,
				"end": 1474,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/components/MkUserSetupDialog.vue",
		"currentSha256": "8cbfbcf19689193ac162ba0d482ed99cd7cb7762b394475d4d43175546769e3e",
		"baselineSha256": "95d6e0998304a89efda9f7c747304bfcf1db0f9e35f68512055a87a0be6498ab",
		"keys": [
			"close",
			"continue",
			"done",
			"goBack",
			"follow"
		],
		"order": [
			"initialAccountSettingProfileSetting",
			"initialAccountSettingPrivacySetting",
			"follow",
			"pushNotification",
			"done",
			"initialAccountSetting",
			"initialAccountSettingAccountCreated",
			"initialAccountSettingLetsStartAccountSetup",
			"later",
			"goBack",
			"continue",
			"initialAccountSettingPushNotificationDescription",
			"initialAccountSettingInitialAccountSettingCompleted",
			"initialAccountSettingYouCanContinueTutorial",
			"initialAccountSettingStartTutorial",
			"close",
			"initialAccountSettingSkipAreYouSure",
			"initialAccountSettingLaterAreYouSure"
		],
		"edits": [
			{
				"start": 7026,
				"end": 7026,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8067,
				"end": 8161,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/embed/pages/user-timeline.vue",
		"currentSha256": "1174bc74482147ae1fed68e3528c7317b316d5153e5b67e871e50f11db82325f",
		"baselineSha256": "9990766229179581a39c06b5308784bc30b8f57f2e5b34d65b797ae6647e04b6",
		"keys": [
			"fromX",
			"user",
			"noteOf"
		],
		"order": [
			"noteOf",
			"user",
			"fromX"
		],
		"edits": [
			{
				"start": 1505,
				"end": 1505,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1891,
				"end": 1891,
				"current": "",
				"baseline": "';\nimport type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue"
			},
			{
				"start": 2709,
				"end": 2890,
				"current": ";\nimport type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/admin/users.vue",
		"currentSha256": "9f4243c832585c1b47bb764e015050d8aba2d4db616cad5051b1d31528949987",
		"baselineSha256": "52c0ad7178105965a2d7d6270fffd075551c38c3b3ed99a67a024f2ea177cd7a",
		"keys": [
			"search",
			"reset",
			"all",
			"users",
			"administrator",
			"moderator"
		],
		"order": [
			"registeredDate",
			"ascendingOrder",
			"descendingOrder",
			"lastUsed",
			"all",
			"normal",
			"administrator",
			"moderator",
			"suspend",
			"local",
			"remote",
			"username",
			"password",
			"search",
			"addUser",
			"lookup",
			"users",
			"reset",
			"sort",
			"state",
			"instance",
			"host"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1853,
				"end": 1853,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 2823,
				"end": 2917,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			},
			{
				"start": 5565,
				"end": 5566,
				"current": "L",
				"baseline": "Deta"
			},
			{
				"start": 5567,
				"end": 5568,
				"current": "t",
				"baseline": "l"
			},
			{
				"start": 5569,
				"end": 5569,
				"current": "",
				"baseline": "d"
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/settings/migration.vue",
		"currentSha256": "6ea587b2257c514546f158e0355f68bce2fab17dbc025aaa6d85c970a600047a",
		"baselineSha256": "bb627cf4b50d75ed70c53fff5ac770bd62af9138961abcc5e9f75521077ebf54",
		"keys": [
			"save",
			"add"
		],
		"order": [
			"accountMigrationMoveFrom",
			"accountMigrationMoveFromSub",
			"accountMigrationMoveFromDescription",
			"add",
			"save",
			"accountMigrationMoveFromLabel",
			"accountMigrationMoveTo",
			"accountMigrationMoveAccountDescription",
			"accountMigrationMoveAccountHowTo",
			"accountMigrationMoveCannotBeUndone",
			"accountMigrationMoveToLabel",
			"accountMigrationStartMigration",
			"accountMigrationPostMigrationNote",
			"accountMigrationMovedAndCannotBeUndone",
			"accountMigrationMovedTo",
			"accountMigrationMigrationConfirm"
		],
		"edits": [
			{
				"start": 2477,
				"end": 2477,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 3266,
				"end": 3360,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/settings/privacy.vue",
		"currentSha256": "ed01ca09d1566fe98a0ba0ec489b95c81760e4c4d506a3da2141af73e71a9b3f",
		"baselineSha256": "4e61ff74d6f15460a7a6105b40c521c4dff3e22c86c2364b686c6a312af16fd2",
		"keys": [
			"none",
			"error",
			"public",
			"private",
			"oneDay",
			"oneHour",
			"oneMonth",
			"oneWeek",
			"followers"
		],
		"order": [
			"privacy",
			"settingsPrivacyBanner",
			"makeFollowManuallyApprove",
			"lockedAccountInfo",
			"autoAcceptFollowed",
			"makeReactionsPublic",
			"makeReactionsPublicDescription",
			"followingVisibility",
			"followersVisibility",
			"hideOnlineStatus",
			"hideOnlineStatusDescription",
			"noCrawle",
			"noCrawleDescription",
			"preventAiLearning",
			"preventAiLearningDescription",
			"makeExplorable",
			"makeExplorableDescription",
			"directMessage",
			"chatChatNotAvailableForThisAccountOrServer",
			"chatChatAllowedUsers",
			"chatChatAllowedUsers_note",
			"lockdown",
			"accountSettingsRequireSigninToViewContents",
			"accountSettingsRequireSigninToViewContentsDescription1",
			"accountSettingsRequireSigninToViewContentsDescription2",
			"accountSettingsMakeNotesFollowersOnlyBefore",
			"none",
			"accountSettingsNotesHavePassedSpecifiedPeriod",
			"accountSettingsNotesOlderThanSpecifiedDateAndTime",
			"custom",
			"timeMonth",
			"accountSettingsMakeNotesFollowersOnlyBeforeDescription",
			"accountSettingsMakeNotesHiddenBefore",
			"accountSettingsMakeNotesHiddenBeforeDescription",
			"accountSettingsMayNotEffectSomeSituations",
			"public",
			"followers",
			"private",
			"chatChatAllowedUsersEveryone",
			"chatChatAllowedUsersFollowers",
			"chatChatAllowedUsersFollowing",
			"chatChatAllowedUsersMutual",
			"chatChatAllowedUsersNone",
			"oneHour",
			"oneDay",
			"threeDays",
			"oneWeek",
			"oneMonth",
			"threeMonths",
			"oneYear",
			"acknowledgeNotesAndEnable",
			"followApprovalGroupTitle",
			"followApprovalInactiveDescription",
			"followApprovalTitle",
			"followApprovalAutoAcceptDescription",
			"followApprovalDescription",
			"followApprovalLocal",
			"followApprovalLocalDescription",
			"followApprovalRemote",
			"followApprovalRemoteDescription",
			"followApprovalUseDefault",
			"followApprovalCustom",
			"followApprovalPeriod",
			"followApprovalUnit",
			"followApprovalInvalidPeriod",
			"disabled",
			"timeHour",
			"timeDay",
			"error",
			"cannotPerformTemporaryDescription"
		],
		"edits": [
			{
				"start": 11117,
				"end": 11117,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 11168,
				"end": 11168,
				"current": "",
				"baseline": "';\nimport type { FollowApprovalPeriodUnit } from '@features/users/frontend/utility/follow-approval.js"
			},
			{
				"start": 11361,
				"end": 11361,
				"current": "",
				"baseline": "';\nimport type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue"
			},
			{
				"start": 12452,
				"end": 12730,
				"current": ";\nimport type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';\nimport type { FollowApprovalPeriodUnit } from '@features/users/frontend/utility/follow-approval.js';\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/settings/profile.vue",
		"currentSha256": "72f1483f238092b2dba001a007660840e822f21123e6b8f5915516a4a5fe98a1",
		"baselineSha256": "322bc325b91ef157eff996bf12152990e90705ec2e37c9de3141ee578baea8ad",
		"keys": [
			"save",
			"delete",
			"upload",
			"all",
			"add",
			"fromDrive"
		],
		"order": [
			"yourNameContainsProhibitedWords",
			"yourNameContainsProhibitedWordsDescription",
			"avatar",
			"upload",
			"cropImageAsk",
			"cropYes",
			"cropNo",
			"fromDrive",
			"banner",
			"profile",
			"changeBanner",
			"changeAvatar",
			"decorate",
			"name",
			"description",
			"youCanIncludeHashtags",
			"location",
			"birthday",
			"language",
			"metadataEdit",
			"save",
			"add",
			"delete",
			"rearrange",
			"verifiedLinkDescription",
			"metadataLabel",
			"metadataContent",
			"metadataDescription",
			"followedMessage",
			"followedMessageDescription",
			"followedMessageDescriptionForLockedAccount",
			"all",
			"likeOnlyForRemote",
			"nonSensitiveOnly",
			"nonSensitiveOnlyForLocalLikeOnlyForRemote",
			"likeOnly",
			"reactionAcceptance",
			"advancedSettings",
			"flagAsCat",
			"flagAsCatDescription",
			"flagAsBot",
			"flagAsBotDescription",
			"qr",
			"detach",
			"cannotSelectSensitiveMedia",
			"cannotSelectSensitiveMediaDescription"
		],
		"edits": [
			{
				"start": 6996,
				"end": 6996,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8506,
				"end": 8600,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			},
			{
				"start": 12622,
				"end": 12622,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12654,
				"end": 12654,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12656,
				"end": 12656,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12684,
				"end": 12684,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12722,
				"end": 12722,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12749,
				"end": 12749,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12765,
				"end": 12765,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12805,
				"end": 12805,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12821,
				"end": 12821,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12844,
				"end": 12844,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12885,
				"end": 12885,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12909,
				"end": 12909,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12941,
				"end": 12941,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12988,
				"end": 12988,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 12992,
				"end": 12992,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13013,
				"end": 13013,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13056,
				"end": 13056,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 13059,
				"end": 13059,
				"current": "",
				"baseline": "\n\t\t\t\t},"
			},
			{
				"start": 13067,
				"end": 13071,
				"current": "\t},\n",
				"baseline": ""
			},
			{
				"start": 14605,
				"end": 14605,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14637,
				"end": 14637,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14639,
				"end": 14639,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14667,
				"end": 14667,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14705,
				"end": 14705,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14732,
				"end": 14732,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14748,
				"end": 14748,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14788,
				"end": 14788,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14804,
				"end": 14804,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14827,
				"end": 14827,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14868,
				"end": 14868,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14892,
				"end": 14892,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14929,
				"end": 14929,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14933,
				"end": 14933,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14954,
				"end": 14954,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 14997,
				"end": 14997,
				"current": "",
				"baseline": "\t"
			},
			{
				"start": 15000,
				"end": 15000,
				"current": "",
				"baseline": "\n\t\t\t\t},"
			},
			{
				"start": 15008,
				"end": 15012,
				"current": "\t},\n",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/settings/profiles.vue",
		"currentSha256": "27e518fc73f7ce31c904f93b93bd51f435f5641e55867e2746df5c358cff817e",
		"baselineSha256": "975910ca5a116b79b8c3e47a23fc41ca8f7f4d5a70a81d88e9ed14980867cf44",
		"keys": [
			"delete"
		],
		"order": [
			"manageProfiles",
			"delete"
		],
		"edits": [
			{
				"start": 616,
				"end": 616,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 950,
				"end": 1044,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/user/home.vue",
		"currentSha256": "1ba0d697154b0a60896948f9d086b1a61153e3648087eaa9e05bef00f79eb239",
		"baselineSha256": "37493bb264cbc63cb26c042c581812634d75e2ba9945dd2e67e5269ce7810e3f",
		"keys": [
			"notes",
			"following",
			"memo",
			"followers"
		],
		"order": [
			"userSuspended",
			"userSilenced",
			"isSystemAccount",
			"addMemo",
			"followsYou",
			"messageToFollower",
			"moderationNote",
			"moderationNoteDescription",
			"addModerationNote",
			"memo",
			"noAccountDescription",
			"location",
			"birthday",
			"yearsOld",
			"registeredDate",
			"verifiedLink",
			"notes",
			"following",
			"followers",
			"userPagePinTip"
		],
		"edits": [
			{
				"start": 7689,
				"end": 7689,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 9882,
				"end": 9918,
				"current": "{ Locale } from 'i18n';\nimport type ",
				"baseline": ""
			},
			{
				"start": 10011,
				"end": 10069,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/user/index.vue",
		"currentSha256": "a7c0edcc2c52d24916b94cbbe66aec33dba3c019282f0ae0e7d4283b06cf87ef",
		"baselineSha256": "9c7ff9abe752ed35852d7dca13e2c393e122601723350f271ce57aa6d7f3999c",
		"keys": [
			"lists",
			"notes",
			"clips",
			"overview",
			"user"
		],
		"order": [
			"overview",
			"notes",
			"files",
			"activity",
			"achievements",
			"reaction",
			"clips",
			"lists",
			"pages",
			"gallery",
			"user"
		],
		"edits": [
			{
				"start": 1164,
				"end": 1164,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1629,
				"end": 1723,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/user/raw.vue",
		"currentSha256": "7de44c242decfff1117af5ee8b7c24adb23a161b0fc8b8888002db2713915442",
		"baselineSha256": "45e36bb3054d5e39c2a0e36289578bafab7091d7c77adb80d5f2b124b836b7b3",
		"keys": [
			"createdAt"
		],
		"order": [
			"createdAt"
		],
		"edits": [
			{
				"start": 1609,
				"end": 1609,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 1964,
				"end": 2058,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/users/frontend/ts-messages.vue",
		"currentSha256": "0751b601c040bb39c1fd3515f471b7444f822cb73cee91b03260ea2b60309edd",
		"baselineSha256": "1633f09d0973c6ac3f1c08548e6614e71553d7b6f6d75fa87a2f7863306d7d21",
		"keys": [
			"embed",
			"memo",
			"oneDay",
			"oneHour",
			"oneMonth",
			"oneWeek",
			"indefinitely",
			"period",
			"showRepliesToOthersInTimeline",
			"mute"
		],
		"order": [
			"mutePeriod",
			"indefinitely",
			"tenMinutes",
			"oneHour",
			"oneDay",
			"oneWeek",
			"unblockConfirm",
			"blockConfirm",
			"breakFollowConfirm",
			"editMemo",
			"memo",
			"moderation",
			"copyUsername",
			"copyProfileUrl",
			"copyRSS",
			"showOnRemote",
			"embed",
			"noteOfThisUser",
			"qr",
			"searchThisUsersNotes",
			"addToList",
			"addToAntenna",
			"roles",
			"period",
			"oneMonth",
			"showRepliesToOthersInTimeline",
			"notifyNotes",
			"unnotifyNotes",
			"createUserSpecifiedNote",
			"_chat",
			"unmute",
			"mute",
			"renoteUnmute",
			"renoteMute",
			"unblock",
			"block",
			"breakFollow",
			"reportAbuse",
			"updateRemoteUser",
			"copyUserId",
			"editProfile",
			"accountMovedShort",
			"operationForbidden"
		]
	},
	{
		"file": "packages/features/web/frontend/components/MkEmbedCodeGenDialog.vue",
		"currentSha256": "0242fc6bb9e1d7bad3075d91961ba656bcd78f35c036327c1dc33478738e5880",
		"baselineSha256": "afa4e4abfbcb45d211457f93ad62e326a7b1926196d6b808588e2c43b8e401b4",
		"keys": [
			"close",
			"copy",
			"preview"
		],
		"order": [
			"syncDeviceDarkMode",
			"light",
			"dark",
			"title",
			"preview",
			"maxHeight",
			"maxHeightDescription",
			"theme",
			"header",
			"rounded",
			"border",
			"maxHeightWarn",
			"previewIsNotActual",
			"applyToPreview",
			"generateCode",
			"codeGenerated",
			"codeGeneratedDescription",
			"copy",
			"close"
		],
		"expanded": true,
		"edits": [
			{
				"start": 3842,
				"end": 3842,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 5055,
				"end": 5113,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/web/frontend/pages/_error_.vue",
		"currentSha256": "cea807950601a45580119a52c60e998d6034d166a2abb6d0e5e84d4af18d8f21",
		"baselineSha256": "0268cfb79c93aa4eda6b857807f1dc06f5b87757bec08c7383e7990db58848c3",
		"keys": [
			"reload",
			"error"
		],
		"order": [
			"error",
			"pageLoadError",
			"pageLoadErrorDescription",
			"serverIsDead",
			"newVersionOfClientAvailable",
			"youShouldUpgradeClient",
			"reload",
			"troubleshooting"
		],
		"expanded": true,
		"edits": [
			{
				"start": 1299,
				"end": 1299,
				"current": "",
				"baseline": "const globalLocale = useLocale<Locale>(import.meta.url);\n\n"
			},
			{
				"start": 2035,
				"end": 2093,
				"current": ";\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	},
	{
		"file": "packages/features/web/frontend/pages/about-misskey.vue",
		"currentSha256": "4e2877efc2e1be88a49da2f537a608db45e46811fa25b682509ef7cb382243a5",
		"baselineSha256": "a7da624478011cac555f6e3b8dcdca978b9deac727f00ca3c032d6bccc24902a",
		"keys": [
			"learnMore"
		],
		"order": [
			"aboutMisskeyAbout",
			"learnMore",
			"aboutMisskeySource",
			"aboutMisskeyOriginal",
			"aboutMisskeyTranslation",
			"aboutMisskeyDonate",
			"aboutMisskeyThisIsModifiedVersion",
			"sourceCodeIsNotYetProvided",
			"aboutMisskeyProjectMembers",
			"aboutMisskeyPatrons",
			"aboutMisskeyMorePatrons",
			"aboutMisskey"
		],
		"edits": [
			{
				"start": 7843,
				"end": 7843,
				"current": "",
				"baseline": "type { Locale } from 'i18n';\nconst globalLocale = useLocale<Locale>(import.meta.url);\n\nimport "
			},
			{
				"start": 8964,
				"end": 9058,
				"current": ";\nimport type { Locale } from 'i18n';\n\nconst globalLocale = useLocale<Locale>(import.meta.url)",
				"baseline": ""
			}
		]
	}
] as const;
const lexicalEscapes: Record<string, Record<string, string[]>> = escapes;
const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

const promotedGroups: Record<string, string> = {
	"permissionsLabels": "_permissions",
	"visibilityLabels": "_visibility",
	"timelinesLabels": "_timelines",
	"notificationTypesLabels": "_notification._types",
	"deckColumnsLabels": "_deck._columns",
	"cwHide": "_cw.hide",
	"cwShow": "_cw.show"
};
const globalPath = (key: string): string => promotedGroups[key] ?? key;
const globalValue = (dictionary: unknown, key: string): unknown => {
	for (const part of globalPath(key).split('.')) dictionary = dictionary && typeof dictionary === 'object' ? Reflect.get(dictionary, part) : undefined;
	return dictionary;
};

/** Replay the pre-pilot source only after verifying both complete source boundaries. */
export function restoreGlobalCatalogPilotSource(file: string, source: string): string {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner || sha256(source) === owner.baselineSha256) return source;
	if (sha256(source) !== owner.currentSha256) throw new Error(`Global catalog pilot source differs: ${file}`);
	// Reverse exact reviewed upstream follow-up edits made after the pilot before replaying it.
	if ('edits' in owner) {
		for (const edit of [...owner.edits].reverse()) {
			if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Global catalog pilot follow-up boundary differs: ${file}`);
			source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
		}
	}
	source = source
		.replace("import { useLocale } from 'virtual:vite-vue-internationalization';\n", '')
		.replace("import type { Locale } from 'i18n';\n", '')
		.replace('const globalLocale = useLocale<Locale>(import.meta.url);\n\n', '')
		.replace('\nconst globalLocale = useLocale<Locale>(import.meta.url);\n', '');
	for (const key of owner.keys) source = source.replaceAll(`globalLocale.value.env.${globalPath(key)}`, `$locale.value.sfc.${key}`).replaceAll(`globalLocale.env.${globalPath(key)}`, `$locale.sfc.${key}`);
	source = source.replace(/(<locale[^>]*locale="([^"]+)"[^>]*>)([\s\S]*?)<\/locale>/g, (_block, start: string, language: string, content: string) => {
		const current = JSON.parse(content) as Record<string, string>;
		const messages = locales[language];
		if (!messages) throw new Error(`Unexpected global catalog pilot language: ${language}`);
		const original = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(current, key) ? current[key] : globalValue(messages, key)]));
		const indent = content.match(/\n([ \t]+)"/)?.[1] ?? '\t';
		if (!indent) throw new Error(`Missing global catalog pilot dictionary indent: ${file}`);
		let json = JSON.stringify(original, null, indent);
		for (const escape of lexicalEscapes[file]?.[language] ?? []) json = json.replaceAll(String.fromCharCode(Number.parseInt(escape.slice(2), 16)), escape);
		return `${start}\n${json}\n</locale>`;
	});
	if (sha256(source) !== owner.baselineSha256) throw new Error(`Global catalog pilot baseline differs: ${file}`);
	return source;
}

/** Verify live owner and global scopes before replaying the existing raw-owner oracle. */
export function restoreGlobalCatalogPilotDictionary(file: string, language: string, dictionary: RuntimeLocaleDictionary, global: RuntimeLocaleDictionary): RuntimeLocaleDictionary {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner) return dictionary;
	const source = readFileSync(resolve(root, file), 'utf8');
	const baseline = restoreGlobalCatalogPilotSource(file, source);
	const collect = (text: string): Record<string, string> => {
		const block = parse(text).descriptor.customBlocks.find(block => block.type === 'locale' && block.attrs.locale === language);
		if (!block) throw new Error(`Missing global catalog pilot language: ${file}:${language}`);
		return JSON.parse(block.content) as Record<string, string>;
	};
	if (JSON.stringify(Object.fromEntries(Object.entries(dictionary))) !== JSON.stringify(collect(source))) throw new Error(`Global catalog pilot loader differs: ${file}:${language}`);
	for (const key of owner.keys) {
		if (JSON.stringify(globalValue(global, key)) !== JSON.stringify(globalValue(locales[language], key))) throw new Error(`Global catalog pilot shared label differs: ${language}:${key}`);
	}
	const restored = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(dictionary, key) ? dictionary[key] : globalValue(global, key)]));
	if (JSON.stringify(restored) !== JSON.stringify(collect(baseline))) throw new Error(`Global catalog pilot historical dictionary differs: ${file}:${language}`);
	return restored;
}

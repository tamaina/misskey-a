/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const moderationErrors = {
 adminAbuseReportNotificationRecipientCreate: {
		correlationCheckEmail: {
			message: 'If "method" is email, "userId" must be set.',
			code: 'CORRELATION_CHECK_EMAIL',
			id: '348bb8ae-575a-6fe9-4327-5811999def8f',
			status: 400,
		},
		correlationCheckWebhook: {
			message: 'If "method" is webhook, "systemWebhookId" must be set.',
			code: 'CORRELATION_CHECK_WEBHOOK',
			id: 'b0c15051-de2d-29ef-260c-9585cddd701a',
			status: 400,
		},
		emailAddressNotSet: {
			message: 'Email address is not set.',
			code: 'EMAIL_ADDRESS_NOT_SET',
			id: '7cc1d85e-2f58-fc31-b644-3de8d0d3421f',
			status: 400,
		},
	},
 adminAbuseReportNotificationRecipientDelete: {},
 adminAbuseReportNotificationRecipientList: {},
 adminAbuseReportNotificationRecipientShow: {
		noSuchRecipient: {
			message: 'No such recipient.',
			code: 'NO_SUCH_RECIPIENT',
			id: '013de6a8-f757-04cb-4d73-cc2a7e3368e4',
			kind: 'server',
			status: 404,
		},
	},
 adminAbuseReportNotificationRecipientUpdate: {
		correlationCheckEmail: {
			message: 'If "method" is email, "userId" must be set.',
			code: 'CORRELATION_CHECK_EMAIL',
			id: '348bb8ae-575a-6fe9-4327-5811999def8f',
			status: 400,
		},
		correlationCheckWebhook: {
			message: 'If "method" is webhook, "systemWebhookId" must be set.',
			code: 'CORRELATION_CHECK_WEBHOOK',
			id: 'b0c15051-de2d-29ef-260c-9585cddd701a',
			status: 400,
		},
		emailAddressNotSet: {
			message: 'Email address is not set.',
			code: 'EMAIL_ADDRESS_NOT_SET',
			id: '7cc1d85e-2f58-fc31-b644-3de8d0d3421f',
			status: 400,
		},
	},
 adminAbuseUserReports: {},
 adminForwardAbuseUserReport: {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: '8763e21b-d9bc-40be-acf6-54c1a6986493',
			kind: 'server',
			status: 404,
		},
	},
 adminGetUserIps: {},
 adminResolveAbuseUserReport: {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: 'ac3794dd-2ce4-d878-e546-73c60c06b398',
			kind: 'server',
			status: 404,
		},
	},
 adminShowModerationLogs: {},
 adminShowUser: {},
 adminShowUsers: {},
 adminSuspendUser: {},
 adminUnsetUserAvatar: {},
 adminUnsetUserBanner: {},
 adminUnsuspendUser: {},
 adminUpdateAbuseUserReport: {
		noSuchAbuseReport: {
			message: 'No such abuse report.',
			code: 'NO_SUCH_ABUSE_REPORT',
			id: '15f51cf5-46d1-4b1d-a618-b35bcbed0662',
			kind: 'server',
			status: 404,
		},
	},
 adminUpdateUserNote: {},
 usersReportAbuse: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '1acefcb5-0959-43fd-9685-b48305736cb5',
		},

		cannotReportYourself: {
			message: 'Cannot report yourself.',
			code: 'CANNOT_REPORT_YOURSELF',
			id: '1e13149e-b1e8-43cf-902e-c01dbfcb202f',
		},

		cannotReportAdmin: {
			message: 'Cannot report the admin.',
			code: 'CANNOT_REPORT_THE_ADMIN',
			id: '35e166f5-05fb-4f87-a2d5-adb42676d48f',
		},
	},
} as const;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { listContract } from './i/notifications.contract.js';
import { groupedContract } from './i/notifications-grouped.contract.js';
import { createContract } from './notifications/create.contract.js';
import { flushContract } from './notifications/flush.contract.js';
import { markAllAsReadContract } from './notifications/mark-all-as-read.contract.js';
import { testNotificationContract } from './notifications/test-notification.contract.js';
import { registerContract } from './sw/register.contract.js';
import { showRegistrationContract } from './sw/show-registration.contract.js';
import { unregisterContract } from './sw/unregister.contract.js';
import { updateRegistrationContract } from './sw/update-registration.contract.js';

export const notificationsContract = {
	list: listContract,
	grouped: groupedContract,
	create: createContract,
	flush: flushContract,
	markAllAsRead: markAllAsReadContract,
	testNotification: testNotificationContract,
	register: registerContract,
	showRegistration: showRegistrationContract,
	unregister: unregisterContract,
	updateRegistration: updateRegistrationContract,
};

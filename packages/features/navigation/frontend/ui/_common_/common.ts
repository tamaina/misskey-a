/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { host } from '@features/boot/frontend/shared/config.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import * as os from '@features/ui/frontend/os.js';
import { instance } from '@features/instance/frontend/instance.js';
import FeatureLocaleMessages from '@features/navigation/frontend/ts-messages.vue';
import { $i } from '@features/auth/frontend/i.js';

function toolsMenuItems(): MenuItem[] {
	const items: MenuItem[] = [{
		type: 'link',
		to: '/scratchpad',
		text: FeatureLocaleMessages.$locale.scratchpad,
		icon: 'ti ti-terminal-2',
	}, {
		type: 'link',
		to: '/api-console',
		text: 'API Console',
		icon: 'ti ti-terminal-2',
	}, {
		type: 'link',
		to: '/clicker',
		text: '🍪👈',
		icon: 'ti ti-cookie',
	}];

	if ($i && ($i.isAdmin || $i.policies.canManageCustomEmojis)) {
		items.push({
			type: 'link',
			to: '/custom-emojis-manager',
			text: FeatureLocaleMessages.$locale.manageCustomEmojis,
			icon: 'ti ti-icons',
		});
	}

	if ($i && ($i.isAdmin || $i.policies.canManageAvatarDecorations)) {
		items.push({
			type: 'link' as const,
			to: '/avatar-decorations',
			text: FeatureLocaleMessages.$locale.manageAvatarDecorations,
			icon: 'ti ti-sparkles',
		});
	}

	return items;
}

export function openInstanceMenu(ev: PointerEvent) {
	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: instance.name ?? host,
		type: 'label',
	}, {
		type: 'link',
		text: FeatureLocaleMessages.$locale.instanceInfo,
		icon: 'ti ti-info-circle',
		to: '/about',
	}, {
		type: 'link',
		text: FeatureLocaleMessages.$locale.customEmojis,
		icon: 'ti ti-icons',
		to: '/about#emojis',
	});

	if (instance.federation !== 'none') {
		menuItems.push({
			type: 'link',
			text: FeatureLocaleMessages.$locale.federation,
			icon: 'ti ti-whirl',
			to: '/about#federation',
		});
	}

	menuItems.push({
		type: 'link',
		text: FeatureLocaleMessages.$locale.charts,
		icon: 'ti ti-chart-line',
		to: '/about#charts',
	}, { type: 'divider' }, {
		type: 'link',
		text: FeatureLocaleMessages.$locale.ads,
		icon: 'ti ti-ad',
		to: '/ads',
	});

	if ($i && ($i.isAdmin || $i.policies.canInvite) && instance.disableRegistration) {
		menuItems.push({
			type: 'link',
			to: '/invite',
			text: FeatureLocaleMessages.$locale.invite,
			icon: 'ti ti-user-plus',
		});
	}

	menuItems.push({
		type: 'parent',
		text: FeatureLocaleMessages.$locale.tools,
		icon: 'ti ti-tool',
		children: toolsMenuItems(),
	}, { type: 'divider' }, {
		type: 'link',
		text: FeatureLocaleMessages.$locale.inquiry,
		icon: 'ti ti-help-circle',
		to: '/contact',
	});

	if (instance.impressumUrl) {
		menuItems.push({
			type: 'a',
			text: FeatureLocaleMessages.$locale.impressum,
			icon: 'ti ti-file-invoice',
			href: instance.impressumUrl,
			target: '_blank',
		});
	}

	if (instance.tosUrl) {
		menuItems.push({
			type: 'a',
			text: FeatureLocaleMessages.$locale.termsOfService,
			icon: 'ti ti-notebook',
			href: instance.tosUrl,
			target: '_blank',
		});
	}

	if (instance.privacyPolicyUrl) {
		menuItems.push({
			type: 'a',
			text: FeatureLocaleMessages.$locale.privacyPolicy,
			icon: 'ti ti-shield-lock',
			href: instance.privacyPolicyUrl,
			target: '_blank',
		});
	}

	if (instance.impressumUrl != null || instance.tosUrl != null || instance.privacyPolicyUrl != null) {
		menuItems.push({ type: 'divider' });
	}

	menuItems.push({
		type: 'a',
		text: FeatureLocaleMessages.$locale.document,
		icon: 'ti ti-bulb',
		href: 'https://misskey-hub.net/docs/for-users/',
		target: '_blank',
	});

	if ($i) {
		menuItems.push({
			text: FeatureLocaleMessages.$locale._initialTutorial.launchTutorial,
			icon: 'ti ti-presentation',
			action: async () => {
				const { dispose } = await os.popupAsyncWithDialog(import('@features/navigation/frontend/components/MkTutorialDialog.vue').then(x => x.default), {}, {
					closed: () => dispose(),
				});
			},
		});
	}

	menuItems.push({
		type: 'link',
		text: FeatureLocaleMessages.$locale.aboutMisskey,
		to: '/about-misskey',
	});

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}

export function openToolsMenu(ev: PointerEvent) {
	os.popupMenu(toolsMenuItems(), ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}

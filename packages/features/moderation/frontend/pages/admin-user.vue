<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div v-if="tab === 'overview'" class="_gaps_m">
			<div class="aeakzknw">
				<MkAvatar class="avatar" :user="user" indicator link preview/>
				<div class="body">
					<span class="name"><MkUserName class="name" :user="user"/></span>
					<span class="sub"><span class="acct _monospace">@{{ acct(user) }}</span></span>
					<span class="state">
						<span v-if="suspended" class="suspended">Suspended</span>
						<span v-if="remoteSuspended" class="suspended">{{ copyLocaleDictionary($locale.sfc).remoteSuspended ?? $locale.sfc.suspend }}</span>
						<span v-if="silenced" class="silenced">Silenced</span>
						<span v-if="moderator" class="moderator">Moderator</span>
					</span>
				</div>
			</div>

			<MkInfo v-if="isSystem">{{ $locale.sfc.isSystemAccount }}</MkInfo>

			<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ $locale.sfc.instanceInfo }}</FormLink>

			<div style="display: flex; flex-direction: column; gap: 1em;">
				<MkKeyValue :copy="user.id" oneline>
					<template #key>ID</template>
					<template #value><span class="_monospace">{{ user.id }}</span></template>
				</MkKeyValue>
				<!-- 要る？
					<MkKeyValue v-if="ips.length > 0" :copy="user.id" oneline>
						<template #key>IP (recent)</template>
						<template #value><span class="_monospace">{{ ips[0].ip }}</span></template>
					</MkKeyValue>
					-->
				<template v-if="!isSystem">
					<MkKeyValue oneline>
						<template #key>{{ globalLocale.env.createdAt }}</template>
						<template #value><span class="_monospace"><MkTime :time="user.createdAt" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ $locale.sfc.lastActiveDate }}</template>
						<template #value><span class="_monospace"><MkTime :time="info.lastActiveDate" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ $locale.sfc.email }}</template>
						<template #value><span class="_monospace">{{ info.email }}</span></template>
					</MkKeyValue>
				</template>
			</div>

			<MkTextarea v-if="!isSystem" v-model="moderationNote" manualSave>
				<template #label>{{ $locale.sfc.moderationNote }}</template>
				<template #caption>{{ $locale.sfc.moderationNoteDescription }}</template>
			</MkTextarea>

			<!--
				<FormSection>
					<template #label>ActivityPub</template>

					<div class="_gaps_m">
						<div style="display: flex; flex-direction: column; gap: 1em;">
							<MkKeyValue v-if="user.host" oneline>
								<template #key>{{ $locale.sfc.instanceInfo }}</template>
								<template #value><MkA :to="`/instance-info/${user.host}`" class="_link">{{ user.host }} <i class="ti ti-chevron-right"></i></MkA></template>
							</MkKeyValue>
							<MkKeyValue v-else oneline>
								<template #key>{{ $locale.sfc.instanceInfo }}</template>
								<template #value>(Local user)</template>
							</MkKeyValue>
							<MkKeyValue oneline>
								<template #key>{{ globalLocale.env.updatedAt }}</template>
								<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
							</MkKeyValue>
							<MkKeyValue v-if="ap" oneline>
								<template #key>Type</template>
								<template #value><span class="_monospace">{{ ap.type }}</span></template>
							</MkKeyValue>
						</div>

						<MkButton v-if="user.host != null" @click="updateRemoteUser"><i class="ti ti-refresh"></i> {{ $locale.sfc.updateRemoteUser }}</MkButton>

						<MkFolder>
							<template #label>Raw</template>

							<MkObjectView v-if="ap" tall :value="ap">
							</MkObjectView>
						</MkFolder>
					</div>
				</FormSection>
			-->

			<FormSection v-if="!isSystem">
				<div class="_gaps">
					<MkSwitch v-model="suspended" @update:modelValue="toggleSuspend">{{ $locale.sfc.suspend }}</MkSwitch>

					<div>
						<MkButton v-if="user.host == null" inline style="margin-right: 8px;" @click="resetPassword"><i class="ti ti-key"></i> {{ $locale.sfc.resetPassword }}</MkButton>
						<MkButton v-if="user.host == null" inline @click="unsetMfa"><i class="ti ti-shield"></i> {{ $locale.sfc.unsetMfa }}</MkButton>
					</div>

					<MkFolder>
						<template #icon><i class="ti ti-license"></i></template>
						<template #label>{{ $locale.sfc.rolePolicies }}</template>
						<div class="_gaps">
							<div v-for="policy in Object.keys(info.policies)" :key="policy">
								{{ policy }} ... {{ info.policies[policy as keyof typeof info.policies] }}
							</div>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-password"></i></template>
						<template #label>IP</template>
						<MkInfo v-if="!iAmAdmin" warn>{{ $locale.sfc.requireAdminForView }}</MkInfo>
						<MkInfo v-else>The date is the IP address was first acknowledged.</MkInfo>
						<template v-if="iAmAdmin && ips">
							<div v-for="record in ips" :key="record.id" class="_monospace" :class="$style.ip" style="margin: 1em 0;">
								<span class="date">{{ $locale.sfc.ipFirstSeen }} {{ record.createdAt }}</span>
								<span class="date">{{ $locale.sfc.ipLastSeen }} {{ record.lastSeenAt }}</span>
								<span class="ip">{{ record.ip }}</span>
							</div>
						</template>
					</MkFolder>

					<div>
						<MkButton v-if="iAmModerator" inline danger style="margin-right: 8px;" @click="unsetUserAvatar"><i class="ti ti-user-circle"></i> {{ $locale.sfc.unsetUserAvatar }}</MkButton>
						<MkButton v-if="iAmModerator" inline danger @click="unsetUserBanner"><i class="ti ti-photo"></i> {{ $locale.sfc.unsetUserBanner }}</MkButton>
					</div>
					<MkButton v-if="$i.isAdmin" inline danger @click="deleteAccount">{{ $locale.sfc.deleteAccount }}</MkButton>
				</div>
			</FormSection>
		</div>

		<div v-else-if="tab === 'roles'" class="_gaps">
			<MkButton v-if="user.host == null" primary rounded @click="assignRole"><i class="ti ti-plus"></i> {{ $locale.sfc.assign }}</MkButton>

			<div v-for="role in info.roles" :key="role.id">
				<div :class="$style.roleItemMain">
					<MkRolePreview :class="$style.role" :role="role" :forModeration="true"/>
					<button class="_button" @click="toggleRoleItem(role)"><i class="ti ti-chevron-down"></i></button>
					<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="unassignRole(role, $event)"><i class="ti ti-x"></i></button>
					<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
				</div>
				<div v-if="expandedRoleIds.includes(role.id)" :class="$style.roleItemSub">
					<div>Assigned: <MkTime :time="info.roleAssigns.find(a => a.roleId === role.id)!.createdAt" mode="detail"/></div>
					<div v-if="info.roleAssigns.find(a => a.roleId === role.id)!.expiresAt">Period: {{ new Date(info.roleAssigns.find(a => a.roleId === role.id)!.expiresAt!).toLocaleString() }}</div>
					<div v-else>Period: {{ globalLocale.env.indefinitely }}</div>
				</div>
			</div>
		</div>

		<div v-else-if="tab === 'announcements'" class="_gaps">
			<MkButton primary rounded @click="createAnnouncement"><i class="ti ti-plus"></i> {{ globalLocale.env.createNew }}</MkButton>

			<MkSelect v-model="announcementsStatus" :items="announcementsStatusDef">
				<template #label>{{ globalLocale.env.filter }}</template>
			</MkSelect>

			<MkPagination :paginator="announcementsPaginator">
				<template #default="{ items }">
					<div class="_gaps_s">
						<div v-for="announcement in items" :key="announcement.id" v-panel :class="$style.announcementItem" @click="editAnnouncement(announcement)">
							<span v-if="'icon' in announcement" style="margin-right: 0.5em;">
								<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
								<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
								<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
								<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
							</span>
							<span>{{ announcement.title }}</span>
							<span v-if="announcement.reads > 0" style="margin-left: auto; opacity: 0.7;">{{ $locale.sfc.messageRead }}</span>
						</div>
					</div>
				</template>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'drive'" class="_gaps">
			<MkFileListForAdmin :paginator="filesPaginator" viewMode="grid"/>
		</div>

		<div v-else-if="tab === 'chart'" class="_gaps_m">
			<div class="cmhjzshm">
				<div class="selects">
					<MkSelect v-model="chartSrc" :items="chartSrcDef" style="margin: 0 10px 0 0; flex: 1;">
					</MkSelect>
				</div>
				<div class="charts">
					<div class="label">{{ interpolateLocaleParameters($locale.sfc.recentNHours, { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
					<div class="label">{{ interpolateLocaleParameters($locale.sfc.recentNDays, { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
				</div>
			</div>
		</div>

		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView v-if="info && $i.isAdmin" tall :value="info">
			</MkObjectView>

			<MkObjectView tall :value="user">
			</MkObjectView>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { computed, defineAsyncComponent, watch, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import MkObjectView from '@features/ui/frontend/components/MkObjectView.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkFileListForAdmin from '@features/drive/frontend/components/MkFileListForAdmin.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { acct } from '@features/users/frontend/shared/user.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { ensureSignin, iAmAdmin, iAmModerator } from '@features/auth/frontend/i.js';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const $i = ensureSignin();

const props = withDefaults(defineProps<{
	userId: string;
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

const result = await _fetch_();

const tab = ref(props.initialTab);
const {
	model: chartSrc,
	def: chartSrcDef,
} = useMkSelect({
	items: [
		{ label: globalLocale.value.env.notes, value: 'per-user-notes' },
	],
	initialValue: 'per-user-notes',
});
const user = ref(result.user);
const info = ref(result.info);
const ips = ref(result.ips);
const ap = ref<Misskey.Endpoints['ap/get']['res'] | null>(null);
const moderator = ref(info.value.isModerator);
const silenced = ref(info.value.isSilenced);
const suspended = ref(info.value.isSuspended);
const remoteSuspended = ref(info.value.isRemoteSuspended);
const isSystem = ref(user.value.host == null && user.value.username.includes('.'));
const moderationNote = ref(info.value.moderationNote);
const filesPaginator = markRaw(new Paginator('admin/drive/files', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.userId,
	})),
}));

const {
	model: announcementsStatus,
	def: announcementsStatusDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.active, value: 'active' },
		{ label: $locale.value.sfc.archived, value: 'archived' },
	],
	initialValue: 'active',
});

const announcementsPaginator = markRaw(new Paginator('admin/announcements/list', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.userId,
		status: announcementsStatus.value,
	})),
}));
const expandedRoleIds = ref<(typeof info.value.roles[number]['id'])[]>([]);

function _fetch_() {
	return Promise.all([misskeyApi('users/show', {
		userId: props.userId,
	}), misskeyApi('admin/show-user', {
		userId: props.userId,
	}), iAmAdmin ? misskeyApi('admin/get-user-ips', {
		userId: props.userId,
	}) : Promise.resolve(null)]).then(([_user, _info, _ips]) => ({
		user: _user,
		info: _info,
		ips: _ips,
	}));
}

watch(moderationNote, async () => {
	await misskeyApi('admin/update-user-note', { userId: user.value.id, text: moderationNote.value });
	await refreshUser();
});

async function refreshUser() {
	const result = await _fetch_();
	user.value = result.user;
	info.value = result.info;
	ips.value = result.ips;
	moderator.value = info.value.isModerator;
	silenced.value = info.value.isSilenced;
	suspended.value = info.value.isSuspended;
	remoteSuspended.value = info.value.isRemoteSuspended;
	isSystem.value = user.value.host == null && user.value.username.includes('.');
	moderationNote.value = info.value.moderationNote;
}

async function updateRemoteUser() {
	await os.apiWithDialog('federation/update-remote-user', { userId: user.value.id });
	refreshUser();
}

async function resetPassword() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.resetPasswordConfirm,
	});
	if (confirm.canceled) {
		return;
	} else {
		const { password } = await os.apiWithDialog('admin/reset-password', {
			userId: user.value.id,
		});
		os.alert({
			type: 'success',
			text: interpolateLocaleParameters($locale.value.sfc.newPasswordIs, { password }),
		});
	}
}

async function unsetMfa() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unsetMfaConfirm,
	});
	if (confirm.canceled) {
		return;
	} else {
		await os.apiWithDialog('admin/unset-mfa', {
			userId: user.value.id,
		});
	}
}

async function toggleSuspend(v: boolean) {
	const confirm = await os.confirm({
		type: 'warning',
		text: v ? $locale.value.sfc.suspendConfirm : $locale.value.sfc.unsuspendConfirm,
	});
	if (confirm.canceled) {
		suspended.value = !v;
	} else {
		await misskeyApi(v ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: user.value.id });
		await refreshUser();
	}
}

async function unsetUserAvatar() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unsetUserAvatarConfirm,
	});
	if (confirm.canceled) return;
	const process = async () => {
		await misskeyApi('admin/unset-user-avatar', { userId: user.value.id });
		os.success();
	};
	await process().catch(err => {
		os.alert({
			type: 'error',
			text: err.toString(),
		});
	});
	refreshUser();
}

async function unsetUserBanner() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unsetUserBannerConfirm,
	});
	if (confirm.canceled) return;
	const process = async () => {
		await misskeyApi('admin/unset-user-banner', { userId: user.value.id });
		os.success();
	};
	await process().catch(err => {
		os.alert({
			type: 'error',
			text: err.toString(),
		});
	});
	refreshUser();
}

async function deleteAllFiles() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.deleteAllFilesConfirm,
	});
	if (confirm.canceled) return;
	const process = async () => {
		await misskeyApi('admin/delete-all-files-of-a-user', { userId: user.value.id });
		os.success();
	};
	await process().catch(err => {
		os.alert({
			type: 'error',
			text: err.toString(),
		});
	});
	await refreshUser();
}

async function deleteAccount() {
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.deleteAccountConfirm,
	});
	if (confirm.canceled) return;

	const typed = await os.inputText({
		text: interpolateLocaleParameters($locale.value.sfc.typeToConfirm, { x: user.value?.username }),
	});
	if (typed.canceled) return;

	if (typed.result === user.value?.username) {
		await os.apiWithDialog('admin/delete-account', {
			userId: user.value.id,
		});
	} else {
		os.alert({
			type: 'error',
			text: 'input not match',
		});
	}
}

async function assignRole() {
	const roles = await misskeyApi('admin/roles/list').then(it => it.filter(r => r.target === 'manual'));

	const { canceled, result: roleId } = await os.select({
		title: $locale.value.sfc.roleChooseRoleToAssign,
		items: roles.map(r => ({ label: r.name, value: r.id })),
	});
	if (canceled || roleId == null) return;

	const { canceled: canceled2, result: period } = await os.select({
		title: globalLocale.value.env.period + ': ' + roles.find(r => r.id === roleId)!.name,
		items: [{
			value: 'indefinitely', label: globalLocale.value.env.indefinitely,
		}, {
			value: 'oneHour', label: globalLocale.value.env.oneHour,
		}, {
			value: 'oneDay', label: globalLocale.value.env.oneDay,
		}, {
			value: 'oneWeek', label: globalLocale.value.env.oneWeek,
		}, {
			value: 'oneMonth', label: globalLocale.value.env.oneMonth,
		}],
		default: 'indefinitely',
	});
	if (canceled2) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
		: null;

	await os.apiWithDialog('admin/roles/assign', { roleId, userId: user.value.id, expiresAt });
	refreshUser();
}

async function unassignRole(role: typeof info.value.roles[number], ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', { roleId: role.id, userId: user.value.id });
			refreshUser();
		},
	}], ev.currentTarget ?? ev.target);
}

function toggleRoleItem(role: typeof info.value.roles[number]) {
	if (expandedRoleIds.value.includes(role.id)) {
		expandedRoleIds.value = expandedRoleIds.value.filter(x => x !== role.id);
	} else {
		expandedRoleIds.value.push(role.id);
	}
}

async function createAnnouncement() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/users/frontend/components/MkUserAnnouncementEditDialog.vue').then(x => x.default), {
		user: user.value,
	}, {
		closed: () => dispose(),
	});
}

async function editAnnouncement(announcement: Misskey.entities.AdminAnnouncementsListResponse[number]) {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/users/frontend/components/MkUserAnnouncementEditDialog.vue').then(x => x.default), {
		user: user.value,
		announcement,
	}, {
		closed: () => dispose(),
	});
}

watch(user, () => {
	misskeyApi('ap/get', {
		uri: user.value.uri ?? `${url}/users/${user.value.id}`,
	}).then(res => {
		ap.value = res;
	});
}, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => isSystem.value ? [{
	key: 'overview',
	title: globalLocale.value.env.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}] : [{
	key: 'overview',
	title: globalLocale.value.env.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'roles',
	title: $locale.value.sfc.roles,
	icon: 'ti ti-badges',
}, {
	key: 'announcements',
	title: globalLocale.value.env.announcements,
	icon: 'ti ti-speakerphone',
}, {
	key: 'drive',
	title: globalLocale.value.env.drive,
	icon: 'ti ti-cloud',
}, {
	key: 'chart',
	title: globalLocale.value.env.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}]);

definePage(() => ({
	title: user.value ? acct(user.value) : $locale.value.sfc.userInfo,
	icon: 'ti ti-user-exclamation',
}));
</script>

<style lang="scss" scoped>
.aeakzknw {
	display: flex;
	align-items: center;

	> .avatar {
		display: block;
		width: 64px;
		height: 64px;
		margin-right: 16px;
	}

	> .body {
		flex: 1;
		overflow: hidden;

		> .name {
			display: block;
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .sub {
			display: block;
			width: 100%;
			font-size: 85%;
			opacity: 0.7;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .state {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			margin-top: 4px;

			&:empty {
				display: none;
			}

			> .suspended, > .silenced, > .moderator {
				display: inline-block;
				border: solid 1px;
				border-radius: 6px;
				padding: 2px 6px;
				font-size: 85%;
			}

			> .suspended {
				color: var(--MI_THEME-error);
				border-color: var(--MI_THEME-error);
			}

			> .silenced {
				color: var(--MI_THEME-warn);
				border-color: var(--MI_THEME-warn);
			}

			> .moderator {
				color: var(--MI_THEME-success);
				border-color: var(--MI_THEME-success);
			}
		}
	}
}

.cmhjzshm {
	> .selects {
		display: flex;
		margin: 0 0 16px 0;
	}

	> .charts {
		> .label {
			margin-bottom: 12px;
			font-weight: bold;
		}
	}
}
</style>

<style lang="scss" module>
.ip {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5em;
	word-break: break-all;

	> :global(.date) {
		opacity: 0.7;
	}

	> :global(.ip) {
		margin-left: auto;
	}
}

.roleItemMain {
	display: flex;
}

.role {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}

.roleItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}

.announcementItem {
	display: flex;
	padding: 8px 12px;
	border-radius: 6px;
	cursor: pointer;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"isSystemAccount": "حساب أنشأه النظام ويُدار من قِبله.",
	"instanceInfo": "معلومات مثيل الخادم",
	"lastActiveDate": "آخر استخدام",
	"email": "البريد الإلكتروني ",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "تحديث المعلومات عن المستخدم البعيد",
	"suspend": "علِق",
	"resetPassword": "أعد تعيين كلمتك السرية",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "السياسة العامة",
	"requireAdminForView": "لاستعراض هذه الصفحة وجب عليك الولوج كمدير.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "احذف الحساب",
	"assign": "أسند",
	"messageRead": "مقروءة",
	"recentNHours": "آخر {n} ساعة",
	"recentNDays": "آخر {n} أيام",
	"active": "نشط",
	"archived": "Archived",
	"resetPasswordConfirm": "هل تريد إعادة تعيين كلمة السر؟",
	"newPasswordIs": "كلمتك السرية الجديدة هي {password}",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "أمتأكد من تعليق الحساب؟",
	"unsuspendConfirm": "أمتأكد من إلغاء تعليق؟",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "أتريد حذف كل الملفات؟",
	"deleteAccountConfirm": "سيحذف حسابك نهائيًا، أتريد المتابعة؟",
	"typeToConfirm": "أدخل {x} للتأكيد",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "ألغ الإسناد",
	"roles": "الأدوار",
	"userInfo": "معلومات المستخدم"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"isSystemAccount": "Un compte creat i operat automàticament pel sistema.",
	"instanceInfo": "Informació del fitxer d'instal·lació",
	"lastActiveDate": "Fet servir per última vegada",
	"email": "Correu electrònic",
	"moderationNote": "Nota de moderació ",
	"moderationNoteDescription": "Pots escriure notes que es compartiran entre els moderadors.",
	"updateRemoteUser": "Actualitzar la informació de l'usuari remot",
	"suspend": "Suspèn",
	"resetPassword": "Restableix la contrasenya",
	"unsetMfa": "Desactiva l'autenticació de dos factors",
	"rolePolicies": "Polítiques",
	"requireAdminForView": "Has de ser administrador per poder veure això.",
	"unsetUserAvatar": "Desactiva l'avatar ",
	"unsetUserBanner": "Desactiva el bàner ",
	"deleteAccount": "Esborrar el compte",
	"assign": "Assignar ",
	"messageRead": "Vist",
	"recentNHours": "Últimes {n} hores",
	"recentNDays": "Últims {n} dies",
	"active": "Actiu",
	"archived": "Arxivat",
	"resetPasswordConfirm": "Vols canviar la teva contrasenya?",
	"newPasswordIs": "La contrasenya nova és «{password}»",
	"unsetMfaConfirm": "Voldries desactivar l'autenticació de dos factors?",
	"suspendConfirm": "Estàs segur que vols suspendre aquest compte?",
	"unsuspendConfirm": "Estàs segur que vols treure la suspensió d'aquest compte?",
	"unsetUserAvatarConfirm": "Segur que vols desactivar l'avatar?",
	"unsetUserBannerConfirm": "Segur que vols desactivar el bàner?",
	"deleteAllFilesConfirm": "Segur que vols esborrar tots els arxius?",
	"deleteAccountConfirm": "Això eliminarà el teu compte irreversiblement. Procedir?",
	"typeToConfirm": "Si us plau, escriu {x} per confirmar",
	"roleChooseRoleToAssign": "Selecciona els rols a assignar",
	"unassign": "Treure",
	"roles": "Rols",
	"userInfo": "Informació de l'usuari"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"isSystemAccount": "Účet automaticky vytvořený a ovládaný serverem.",
	"instanceInfo": "Informace o instanci",
	"lastActiveDate": "Naposledy použito",
	"email": "Email",
	"moderationNote": "Poznámka moderátora",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Aktualizovat informace o vzdáleném účtu",
	"suspend": "Zmrazit",
	"resetPassword": "Resetovat heslo",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Zásady",
	"requireAdminForView": "Pro zobrazení se musíte přihlásit administrátorským účtem.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Odstranit účet",
	"assign": "Přiřadit",
	"messageRead": "Přečtené",
	"recentNHours": "Posledních {n} hodin",
	"recentNDays": "Posledních {n} dnů",
	"active": "Aktivní",
	"archived": "Archivované",
	"resetPasswordConfirm": "Opravdu chcete resetovat heslo?",
	"newPasswordIs": "Nové heslo je \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Jste si jistí že chcete suspendovat tenhle účet?",
	"unsuspendConfirm": "Jste si jistí že chcete obnovit tenhle účet?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Jste si jistí že chcete smazat všechny soubory?",
	"deleteAccountConfirm": "Tohle nenávratně smaže váš účet, chcete pokračovat?",
	"typeToConfirm": "Prosíme zadejte {x} pro potvrzení",
	"roleChooseRoleToAssign": "Vyberte roli, kterou chcete přiřadit",
	"unassign": "Zrušit přirazení",
	"roles": "Role",
	"userInfo": "Informace o uživateli"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Instance Information",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspend",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Read",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "The new password is \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Are you sure that you want to suspend this account?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Are you sure that you want to delete all files?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"isSystemAccount": "Ein Benutzerkonto, das durch das System erstellt und automatisch verwaltet wird.",
	"instanceInfo": "Instanzinformationen",
	"lastActiveDate": "Zuletzt verwendet am",
	"email": "Email",
	"moderationNote": "Moderationsnotiz",
	"moderationNoteDescription": "Trage hier Notizen ein. Diese sind nur für die Moderatoren sichtbar.",
	"updateRemoteUser": "Benutzerinformationen aktualisieren",
	"suspend": "Sperren",
	"resetPassword": "Passwort zurücksetzen",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Richtlinien",
	"requireAdminForView": "Melde dich mit einem Administratorkonto an, um dies einzusehen.",
	"unsetUserAvatar": "Entferne Profilbild",
	"unsetUserBanner": "Entferne Profilbanner",
	"deleteAccount": "Benutzerkonto löschen",
	"assign": "Zuweisen",
	"messageRead": "Gelesen",
	"recentNHours": "Letzte {n} Stunden",
	"recentNDays": "Letzte {n} Tage",
	"active": "Aktiv",
	"archived": "Archiviert",
	"resetPasswordConfirm": "Wirklich Passwort zurücksetzen?",
	"newPasswordIs": "Das neue Passwort ist „{password}“",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Möchtest du diesen Benutzer wirklich sperren?",
	"unsuspendConfirm": "Möchtest du diesen Benutzer wirklich entsperren?",
	"unsetUserAvatarConfirm": "Möchtest du dein Profilbild entfernen?",
	"unsetUserBannerConfirm": "Möchtest du dein Profilbanner entfernen?",
	"deleteAllFilesConfirm": "Möchtest du wirklich alle Dateien löschen?",
	"deleteAccountConfirm": "Dein Benutzerkonto wird unwiderruflich gelöscht. Trotzdem fortfahren?",
	"typeToConfirm": "Bitte gib zur Bestätigung {x} ein",
	"roleChooseRoleToAssign": "Zuzuweisende Rolle auswählen",
	"unassign": "Entfernen",
	"roles": "Rollen",
	"userInfo": "Benutzerinformation"
}
</locale>

<locale lang="json" locale="en-US">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Instance Information",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspend",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Read",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "The new password is \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Are you sure that you want to suspend this account?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Are you sure that you want to delete all files?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"isSystemAccount": "Cuenta creada y operada automáticamente por el sistema",
	"instanceInfo": "Información de la instancia",
	"lastActiveDate": "Utilizado por última vez el",
	"email": "Correo",
	"moderationNote": "Nota de moderación",
	"moderationNoteDescription": "Puedes rellenar notas que solo se comparten entre moderadores.",
	"updateRemoteUser": "Actualizar información de usuario remoto",
	"suspend": "Suspender",
	"resetPassword": "Resetear contraseña",
	"unsetMfa": "Desactivar la autenticación de dos factores",
	"rolePolicies": "Política",
	"requireAdminForView": "Necesitas iniciar sesión como administrador para ver esto.",
	"unsetUserAvatar": "Quitar avatar",
	"unsetUserBanner": "Quitar banner",
	"deleteAccount": "Borrar cuenta",
	"assign": "Asignar",
	"messageRead": "Ya leído",
	"recentNHours": "Últimas {n} horas",
	"recentNDays": "Últimos {n} días",
	"active": "Activo",
	"archived": "Archivado",
	"resetPasswordConfirm": "¿Realmente quieres cambiar la contraseña?",
	"newPasswordIs": "La nueva contraseña es \"{password}\"",
	"unsetMfaConfirm": "¿Desea desactivar la autenticación de dos factores?",
	"suspendConfirm": "¿Quieres suspender esta cuenta?",
	"unsuspendConfirm": "¿Quieres dejar de suspender esta cuenta?",
	"unsetUserAvatarConfirm": "¿Confirmas que quieres quitar tu avatar?",
	"unsetUserBannerConfirm": "¿Confirmas que quieres quitar tu banner?",
	"deleteAllFilesConfirm": "¿Desea borrar todos los archivos?",
	"deleteAccountConfirm": "La cuenta será borrada. ¿Está seguro?",
	"typeToConfirm": "Ingrese {x} para confirmar",
	"roleChooseRoleToAssign": "Selecciona el rol para asignar",
	"unassign": "Quitar",
	"roles": "Roles",
	"userInfo": "Información del usuario"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"isSystemAccount": "Ces comptes sont automatiquement créés et gérés par le système.",
	"instanceInfo": "Informations sur l’instance",
	"lastActiveDate": "Dernière utilisation",
	"email": "E-mail ",
	"moderationNote": "Note de modération",
	"moderationNoteDescription": "Vous pouvez remplir des notes qui seront partagés seulement entre modérateurs.",
	"updateRemoteUser": "Mettre à jour les informations de l’utilisateur·rice distant·e",
	"suspend": "Suspendre",
	"resetPassword": "Réinitialiser le mot de passe",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Stratégies",
	"requireAdminForView": "Vous devez être connecté avec un compte administrateur pour les visualiser.",
	"unsetUserAvatar": "Supprimer l’avatar",
	"unsetUserBanner": "Supprimer la bannière",
	"deleteAccount": "Supprimer le compte",
	"assign": "Attribuer",
	"messageRead": "Lu",
	"recentNHours": "Dernières {n} heures",
	"recentNDays": "Derniers {n} jours",
	"active": "Actif·ve",
	"archived": "Archivé",
	"resetPasswordConfirm": "Souhaitez-vous réinitialiser votre mot de passe\u00a0?",
	"newPasswordIs": "Votre nouveau mot de passe est \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Êtes-vous sûr·e de vouloir suspendre ce compte ?",
	"unsuspendConfirm": "Êtes-vous sûr·e de vouloir annuler la suspension de ce compte ?",
	"unsetUserAvatarConfirm": "Êtes-vous sûr·e de vouloir supprimer l'avatar ?",
	"unsetUserBannerConfirm": "Êtes-vous sûr·e de vouloir supprimer la bannière ?",
	"deleteAllFilesConfirm": "Êtes-vous sûr·e de vouloir supprimer tous les fichiers ?",
	"deleteAccountConfirm": "Votre compte sera supprimé. Êtes vous certain ?",
	"typeToConfirm": "Pour effectuer cette opération, tapez {x}",
	"roleChooseRoleToAssign": "Sélectionner le rôle à assigner",
	"unassign": "Retirer",
	"roles": "Rôles",
	"userInfo": "Informations sur l'utilisateur·rice"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"isSystemAccount": "Akun yang dibuat dan otomatis dioperasikan oleh sistem.",
	"instanceInfo": "Informasi Instansi",
	"lastActiveDate": "Terakhir digunakan",
	"email": "Surel",
	"moderationNote": "Catatan moderasi",
	"moderationNoteDescription": "Anda dapat mengisi note yang hanya akan dibagikan diantara moderator.",
	"updateRemoteUser": "Perbaharui informasi pengguna instansi luar",
	"suspend": "Tangguhkan",
	"resetPassword": "Atur ulang kata sandi",
	"unsetMfa": "Cabut autentikasi dua faktor",
	"rolePolicies": "Kebijakan",
	"requireAdminForView": "Kamu harus login dengan akun administrator untuk melihat ini.",
	"unsetUserAvatar": "Hapus avatar",
	"unsetUserBanner": "Hapus banner",
	"deleteAccount": "Hapus Akun",
	"assign": "Tetapkan\n",
	"messageRead": "Telah dibaca",
	"recentNHours": "{n} jam terakhir",
	"recentNDays": "{n} hari terakhir",
	"active": "Aktif",
	"archived": "Diarsipkan",
	"resetPasswordConfirm": "Yakin untuk mereset kata sandimu?",
	"newPasswordIs": "Kata sandi baru adalah \"{password}\"",
	"unsetMfaConfirm": "Ingin mencabut autentikasi dua faktor? ",
	"suspendConfirm": "Apakah kamu yakin ingin menangguhkan akun ini?",
	"unsuspendConfirm": "Apakah kamu yakin ingin membatalkan penangguhan akun ini?",
	"unsetUserAvatarConfirm": "Apakah kamu yakin ingin menghapus avatar?",
	"unsetUserBannerConfirm": "Apakah kamu yakin ingin menghapus banner?",
	"deleteAllFilesConfirm": "Apakah kamu yakin ingin menghapus semua berkas?",
	"deleteAccountConfirm": "Akun akan dihapus. Apakah kamu yakin?",
	"typeToConfirm": "Mohon masukkan {x} untuk mengonfirmasi",
	"roleChooseRoleToAssign": "Pilih peran yang ditugaskan",
	"unassign": "Batalkan penetapan",
	"roles": "Peran",
	"userInfo": "Informasi pengguna"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"isSystemAccount": "Si tratta di un profilo creato e gestito automaticamente dal sistema.",
	"instanceInfo": "Informazioni sul server",
	"lastActiveDate": "Data dell'ultimo utilizzo",
	"email": "Email",
	"moderationNote": "Promemoria di moderazione",
	"moderationNoteDescription": "Puoi scrivere promemoria condivisi solo tra moderatori.",
	"updateRemoteUser": "Aggiorna dati dal profilo remoto",
	"suspend": "Sospensione",
	"resetPassword": "Ripristina la password",
	"unsetMfa": "Rimuovere l'autenticazione a due fattori (2FA/MFA)",
	"rolePolicies": "Policy",
	"requireAdminForView": "Per visualizzarli, è necessario aver effettuato l'accesso con un profilo amministratore.",
	"unsetUserAvatar": "Rimozione foto profilo",
	"unsetUserBanner": "Rimuovi intestazione profilo",
	"deleteAccount": "Eliminazione profilo",
	"assign": "Assegna",
	"messageRead": "Visualizzato",
	"recentNHours": "Ultime {n} ore",
	"recentNDays": "Ultimi {n} giorni",
	"active": "Attivo",
	"archived": "Archiviato",
	"resetPasswordConfirm": "Vuoi davvero ripristinare la password?",
	"newPasswordIs": "La tua nuova password è「{password}」",
	"unsetMfaConfirm": "Vuoi davvero rimuovere l'autenticazione a due fattori?",
	"suspendConfirm": "Vuoi davvero sospendere questo profilo?",
	"unsuspendConfirm": "Vuoi revocare la sospensione si questo profilo?",
	"unsetUserAvatarConfirm": "Vuoi davvero rimuovere la foto profilo?",
	"unsetUserBannerConfirm": "Vuoi davvero rimuovere l'intestazione dal profilo?",
	"deleteAllFilesConfirm": "Vuoi davvero eliminare tutti i file?",
	"deleteAccountConfirm": "Così verrà eliminato il profilo. Vuoi procedere?",
	"typeToConfirm": "Digita {x} per continuare",
	"roleChooseRoleToAssign": "Seleziona il ruolo da assegnare",
	"unassign": "Disassegna",
	"roles": "Ruoli",
	"userInfo": "Informazioni sul profilo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"ipFirstSeen": "初回確認:",
	"ipLastSeen": "最終確認:",
	"remoteSuspended": "リモートで凍結済み",
	"isSystemAccount": "システムにより自動で作成・管理されているアカウントです。",
	"instanceInfo": "サーバー情報",
	"lastActiveDate": "最終利用日時",
	"email": "メール",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーター間でだけ共有されるメモを記入することができます。",
	"updateRemoteUser": "リモートユーザー情報の更新",
	"suspend": "凍結",
	"resetPassword": "パスワードをリセット",
	"unsetMfa": "二要素認証を解除",
	"rolePolicies": "ポリシー",
	"requireAdminForView": "閲覧するには管理者アカウントでログインしている必要があります。",
	"unsetUserAvatar": "アイコンを解除",
	"unsetUserBanner": "バナーを解除",
	"deleteAccount": "アカウント削除",
	"assign": "アサイン",
	"messageRead": "既読",
	"recentNHours": "直近{n}時間",
	"recentNDays": "直近{n}日",
	"active": "アクティブ",
	"archived": "アーカイブ済み",
	"resetPasswordConfirm": "パスワードリセットしますか？",
	"newPasswordIs": "新しいパスワードは「{password}」です",
	"unsetMfaConfirm": "二要素認証を解除しますか？",
	"suspendConfirm": "凍結しますか？",
	"unsuspendConfirm": "解凍しますか？",
	"unsetUserAvatarConfirm": "アイコンを解除しますか？",
	"unsetUserBannerConfirm": "バナーを解除しますか？",
	"deleteAllFilesConfirm": "すべてのファイルを削除しますか？",
	"deleteAccountConfirm": "アカウントが削除されます。よろしいですか？",
	"typeToConfirm": "この操作を行うには {x} と入力してください",
	"roleChooseRoleToAssign": "アサインするロールを選択",
	"unassign": "アサインを解除",
	"roles": "ロール",
	"userInfo": "ユーザー情報"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"isSystemAccount": "システムが自動で作成・管理しとるアカウントやで。",
	"instanceInfo": "サーバー情報",
	"lastActiveDate": "最後に使った日時",
	"email": "メール",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーターの中だけで共有するメモを入れれるで。",
	"updateRemoteUser": "リモートユーザー情報の更新してくれん？",
	"suspend": "凍結",
	"resetPassword": "パスワードをリセット",
	"unsetMfa": "二要素認証を解除",
	"rolePolicies": "ポリシー",
	"requireAdminForView": "これ見たいんなら管理者じゃないとアカンわ。",
	"unsetUserAvatar": "アイコン戻す",
	"unsetUserBanner": "バナー戻す",
	"deleteAccount": "アカウント削除するで",
	"assign": "アサイン",
	"messageRead": "もう読んだ",
	"recentNHours": "直近{n}時間",
	"recentNDays": "直近{n}日",
	"active": "アクティブ",
	"archived": "アーカイブ済み",
	"resetPasswordConfirm": "パスワード作り直すんでええな？",
	"newPasswordIs": "今度のパスワードは「{password}」や",
	"unsetMfaConfirm": "二要素認証を解除しますか？",
	"suspendConfirm": "凍結してしもうてええか？",
	"unsuspendConfirm": "溶かしたるけどええか？",
	"unsetUserAvatarConfirm": "アイコンを元に戻すで？",
	"unsetUserBannerConfirm": "バナー元に戻すで？",
	"deleteAllFilesConfirm": "ホンマにファイル全部ほかすんか？消したもんはもう戻ってこんのやで？",
	"deleteAccountConfirm": "アカウントを消すで？ええんか？",
	"typeToConfirm": "これやるんなら {x} って入力してなー",
	"roleChooseRoleToAssign": "アサインするロール選ぶ",
	"unassign": "アサインやめる",
	"roles": "ロール",
	"userInfo": "ユーザー情報やで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Instance Information",
	"lastActiveDate": "Last used at",
	"email": "Imayl",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspend",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Read",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "The new password is \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Are you sure that you want to suspend this account?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Are you sure that you want to delete all files?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Instance Information",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspend",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Read",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "The new password is \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Are you sure that you want to suspend this account?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Are you sure that you want to delete all files?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"isSystemAccount": "시스템에 의해 자동으로 생성되어 관리되는 계정입니다.",
	"instanceInfo": "서버 정보",
	"lastActiveDate": "마지막 이용",
	"email": "이메일",
	"moderationNote": "조정 기록",
	"moderationNoteDescription": "모더레이터 역할을 가진 유저만 보이는 메모를 적을 수 있습니다.",
	"updateRemoteUser": "리모트 유저 정보 갱신",
	"suspend": "정지",
	"resetPassword": "비밀번호 재설정",
	"unsetMfa": "2단계 인증 해제",
	"rolePolicies": "정책",
	"requireAdminForView": "열람하려면 관리자 계정으로 로그인해야 합니다.",
	"unsetUserAvatar": "아바타 제거",
	"unsetUserBanner": "배너 제거",
	"deleteAccount": "계정 삭제",
	"assign": "할당",
	"messageRead": "읽음",
	"recentNHours": "최근 {n}시간",
	"recentNDays": "최근 {n}일",
	"active": "최근에 활동함",
	"archived": "아카이브 됨",
	"resetPasswordConfirm": "비밀번호를 재설정하시겠습니까?",
	"newPasswordIs": "새로운 비밀번호는 \"{password}\" 입니다",
	"unsetMfaConfirm": "2단계 인증을 해제하시겠습니까?",
	"suspendConfirm": "이 계정을 정지하시겠습니까?",
	"unsuspendConfirm": "이 계정의 정지를 해제하시겠습니까?",
	"unsetUserAvatarConfirm": "아바타를 제거할까요?",
	"unsetUserBannerConfirm": "배너를 제거할까요?",
	"deleteAllFilesConfirm": "모든 파일을 삭제하시겠습니까?",
	"deleteAccountConfirm": "계정이 삭제되고 되돌릴 수 없게 됩니다. 계속하시겠습니까? ",
	"typeToConfirm": "계속하시려면 {x} 을 입력하세요",
	"roleChooseRoleToAssign": "할당할 역할 선택",
	"unassign": "할당 취소",
	"roles": "역할",
	"userInfo": "유저 정보"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Serverinformatie",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderatienotitie",
	"moderationNoteDescription": "Voer hier notities in. Deze zijn alleen zichtbaar voor de moderators.",
	"updateRemoteUser": "Gebruikersinformatie bijwerken",
	"suspend": "Opschorten",
	"resetPassword": "Wachtwoord terugzetten",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Avatar verwijderen",
	"unsetUserBanner": "Banner verwijderen",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Lezen",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Actief",
	"archived": "Gearchiveerd",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "Het nieuwe wachtwoord is „{password}”.",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Ben je zeker dat je deze account wil suspenderen?",
	"unsuspendConfirm": "Ben je zeker dat je deze account wil opnieuw aanstellen?",
	"unsetUserAvatarConfirm": "Weet je zeker dat je je avatar wil verwijderen?",
	"unsetUserBannerConfirm": "Weet je zeker dat je je banner wil verwijderen?",
	"deleteAllFilesConfirm": "Wil je echt alle bestanden verwijderen?",
	"deleteAccountConfirm": "Je gebruikersaccount wordt onherroepelijk verwijderd. Wil je nog steeds doorgaan?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "Gebruikersinformatie"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Serverinformasjon",
	"lastActiveDate": "Last used at",
	"email": "E-post",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspender",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Slett konto",
	"assign": "Assign",
	"messageRead": "Lest",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "Det nye passordet er \"{password}\".",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Er du sikker på at du vil suspendere denne kontoen?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Er du sikker på at du vil slette alle filer?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roller",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"isSystemAccount": "To jest konto stworzone i zarządzane przez system",
	"instanceInfo": "Informacje o instancji",
	"lastActiveDate": "Ostatnio użyte w",
	"email": "Adres e-mail",
	"moderationNote": "Notka moderacyjna",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Aktualizuj zdalne dane o użytkowniku",
	"suspend": "Zawieś",
	"resetPassword": "Zresetuj hasło",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "Aby to zobaczyć, musisz być administratorem",
	"unsetUserAvatar": "Usuń awatar",
	"unsetUserBanner": "Usuń baner",
	"deleteAccount": "Usuń konto",
	"assign": "Przydziel",
	"messageRead": "Przeczytano",
	"recentNHours": "W ciągu ostatnich {n} godzin",
	"recentNDays": "W ciągu ostatnich {n} dni",
	"active": "Aktywny",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "Nowe hasło to „{password}”",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Czy na pewno chcesz zawiesić to konto?",
	"unsuspendConfirm": "Czy na pewno chcesz cofnąć zawieszenie tego konta?",
	"unsetUserAvatarConfirm": "Czy na pewno chcesz usunąć awatar tego użytkownika?",
	"unsetUserBannerConfirm": "Czy na pewno chcesz usunąć baner?",
	"deleteAllFilesConfirm": "Czy na pewno chcesz usunąć wszystkie pliki?",
	"deleteAccountConfirm": "Spowoduje to nieodwracalne usunięcie Twojego konta. Kontynuować?",
	"typeToConfirm": "Wprowadź {x}, aby potwierdzić",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Cofnij przydzielenie",
	"roles": "Role",
	"userInfo": "Informacje o użykowniku"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"isSystemAccount": "É uma conta criada e gerenciada automaticamente pelo sistema.",
	"instanceInfo": "Informações da instância",
	"lastActiveDate": "Última data de uso",
	"email": "E-mail",
	"moderationNote": "Nota de moderação",
	"moderationNoteDescription": "Você pode preencher notas que serão compartilhadas apenas com moderadores.",
	"updateRemoteUser": "Atualizar informações do usuário remoto",
	"suspend": "Suspender",
	"resetPassword": "Redefinir senha",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Políticas",
	"requireAdminForView": "Para visualizar, é necessário acessar com uma conta de administrador.",
	"unsetUserAvatar": "Remover avatar",
	"unsetUserBanner": "Remover banner",
	"deleteAccount": "Excluir conta",
	"assign": "Atribuir",
	"messageRead": "Lida",
	"recentNHours": "Últimas {n} horas",
	"recentNDays": "Últimos {n} dias",
	"active": "Ativo",
	"archived": "Arquivado",
	"resetPasswordConfirm": "Deseja realmente mudar a sua senha?",
	"newPasswordIs": "A nova senha é \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Tem certeza que gostaria de suspender esta conta?",
	"unsuspendConfirm": "Tem certeza que gostaria de cancelar a suspensão desta conta?",
	"unsetUserAvatarConfirm": "Você tem certeza de que deseja remover o avatar?",
	"unsetUserBannerConfirm": "Você tem certeza de que deseja remover o banner?",
	"deleteAllFilesConfirm": "Deseja excluir todos os arquivos?",
	"deleteAccountConfirm": "Deseja realmente excluir a conta?",
	"typeToConfirm": "Para realizar essa operação, digite {x}.",
	"roleChooseRoleToAssign": "Selecionar o cargo a ser atribuído",
	"unassign": "Remover",
	"roles": "Cargos",
	"userInfo": "Informações do Usuário"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"isSystemAccount": "Данная учётная запись создана автоматически и управляется системой",
	"instanceInfo": "Информация об инстансе",
	"lastActiveDate": "Последняя дата использования",
	"email": "Электронная почта",
	"moderationNote": "Примечания модератора",
	"moderationNoteDescription": "Вы можете заполнять заметки, которые будут доступны только модераторам.",
	"updateRemoteUser": "Обновить данные пользователя с его сервера",
	"suspend": "Заморозить",
	"resetPassword": "Сброс пароля:",
	"unsetMfa": "Сбросить МФА",
	"rolePolicies": "Политики",
	"requireAdminForView": "Для просмотра необходимо иметь аккаунт администратора",
	"unsetUserAvatar": "Убрать аватар",
	"unsetUserBanner": "Убрать баннер",
	"deleteAccount": "Удаление учётной записи",
	"assign": "Назначить",
	"messageRead": "Прочитали",
	"recentNHours": "Последние {n} ч",
	"recentNDays": "Последние {n} сут",
	"active": "Действует",
	"archived": "Архивировано",
	"resetPasswordConfirm": "Сбросить пароль?",
	"newPasswordIs": "Новый пароль — «{password}».",
	"unsetMfaConfirm": "Вы точно хотите сбросить МФА?",
	"suspendConfirm": "Заморозить этот аккаунт?",
	"unsuspendConfirm": "Разморозить этот аккаунт?",
	"unsetUserAvatarConfirm": "Вы точно хотите убрать аватар?",
	"unsetUserBannerConfirm": "Вы точно хотите убрать баннер?",
	"deleteAllFilesConfirm": "Вы хотите удалить все файлы?",
	"deleteAccountConfirm": "Учётная запись будет безвозвратно удалена. Подтверждаете?",
	"typeToConfirm": "Введите {x} для продолжения",
	"roleChooseRoleToAssign": "Выберите роль, которую хотите выдать",
	"unassign": "Отменить назначение",
	"roles": "Роли",
	"userInfo": "Сведения о пользователе"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"isSystemAccount": "Tieto účty automaticky vytvoril a spravuje systém.",
	"instanceInfo": "Informácie o serveri",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Aktualizovať informácie o vzdialenom účte",
	"suspend": "Zmraziť",
	"resetPassword": "Resetovať heslo",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "Na zobrazenie sa musíte prihlásiť pod administrátorským účtom.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Vymazať účet",
	"assign": "Assign",
	"messageRead": "Prečítané",
	"recentNHours": "Posledných {n} hodín",
	"recentNDays": "Posledných {n} dní",
	"active": "Aktívny",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "Nové heslo je \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Naozaj chcete zmraziť tento účet?",
	"unsuspendConfirm": "Naozaj chcete odmraziť tento účet?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Naozaj chcete odstrániť všetky súbory",
	"deleteAccountConfirm": "Toto nezvrátiteľne vymaže váš účet. Pokračovať?",
	"typeToConfirm": "Ak chcete vykonať túto operáciu, napíšte {x}",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "Informácie o používateľovi"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"isSystemAccount": "บัญชีที่ถูกสร้างมานั้น และถูกดำเนินการโดยอัตโนมัติด้วยระบบ",
	"instanceInfo": "ข้อมูลเซิร์ฟเวอร์",
	"lastActiveDate": "ใช้งานล่าสุดเมื่อ",
	"email": "อีเมล",
	"moderationNote": "โน้ตการกลั่นกรอง",
	"moderationNoteDescription": "สามารถจดเมโมที่จะแบ่งปันเฉพาะระหว่างผู้ควบคุมได้",
	"updateRemoteUser": "อัปเดตข้อมูลผู้ใช้ระยะไกล",
	"suspend": "ระงับ",
	"resetPassword": "รีเซ็ตรหัสผ่าน",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "นโยบาย",
	"requireAdminForView": "คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าดูสิ่งนี้",
	"unsetUserAvatar": "เลิกตั้งไอคอน",
	"unsetUserBanner": "เลิกตั้งแบนเนอร์",
	"deleteAccount": "ลบบัญชี",
	"assign": "มอบหมาย",
	"messageRead": "อ่านแล้ว",
	"recentNHours": "ล่าสุด {n} ชั่วโมงที่แล้ว",
	"recentNDays": "ล่าสุด {n} วันที่แล้ว",
	"active": "ใช้งานอยู่",
	"archived": "เก็บถาวรแล้ว",
	"resetPasswordConfirm": "ต้องการรีเซ็ตรหัสผ่านใช่ไหม?",
	"newPasswordIs": "รหัสผ่านใหม่คือ “{password}”",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "ต้องการระงับบัญชีนี้ใช่ไหม?",
	"unsuspendConfirm": "ต้องการยกเลิกการระงับบัญชีนี้ใช่ไหม?",
	"unsetUserAvatarConfirm": "ต้องการเลิกตั้งไอคอนประจำตัวหรือไม่?",
	"unsetUserBannerConfirm": "ต้องการเลิกตั้งแบนเนอร์?",
	"deleteAllFilesConfirm": "ต้องการลบไฟล์ทั้งหมดใช่ไหม?",
	"deleteAccountConfirm": "บัญชีจะถูกลบ ดำเนินการต่อใช่ไหม?",
	"typeToConfirm": "โปรดป้อน {x} เพื่อยืนยัน",
	"roleChooseRoleToAssign": "เลือกบทบาทที่ต้องการกำหนด",
	"unassign": "เลิกมอบหมาย",
	"roles": "บทบาท",
	"userInfo": "ข้อมูลผู้ใช้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"isSystemAccount": "Sistem tarafından oluşturulan ve otomatik olarak işletilen bir hesap.",
	"instanceInfo": "Sunucu Bilgisi",
	"lastActiveDate": "Son kullanımı",
	"email": "E-Posta",
	"moderationNote": "Moderasyon notu",
	"moderationNoteDescription": "Moderatörler arasında paylaşılacak notları girebilirsin.",
	"updateRemoteUser": "Uzak kullanıcı bilgilerini güncelle",
	"suspend": "askıya al",
	"resetPassword": "Şifreyi sıfırla",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Politikalar",
	"requireAdminForView": "Bunu görüntülemek için yönetici hesabıyla oturum açmanız gerekir.",
	"unsetUserAvatar": "Avatar'ı kaldır",
	"unsetUserBanner": "Banner'ı kaldır",
	"deleteAccount": "Hesabı sil",
	"assign": "Atama",
	"messageRead": "Oku",
	"recentNHours": "Son {n} saat",
	"recentNDays": "Son {n} gün",
	"active": "Aktif",
	"archived": "Arşivle",
	"resetPasswordConfirm": "Şifreni gerçekten sıfırlamak istiyor musun?",
	"newPasswordIs": "Yeni şifre \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Hesap askıya alınsın mı?",
	"unsuspendConfirm": "Hesap askıdan kaldırılsın mı?",
	"unsetUserAvatarConfirm": "Avatarı silmek istediğinden emin misin?",
	"unsetUserBannerConfirm": "Banner'ı kaldırmak istediğinden emin misin?",
	"deleteAllFilesConfirm": "Tüm dosyaları silmek istediğinden emin misin?",
	"deleteAccountConfirm": "Bu, hesabını geri dönüşü olmayan bir şekilde silecek. Devam etmek istiyor musun?",
	"typeToConfirm": "Onaylamak için lütfen {x} girin.",
	"roleChooseRoleToAssign": "Atamak istediğin rolü seç",
	"unassign": "Atamayı kaldır",
	"roles": "Roller",
	"userInfo": "Kullanıcı hakkında"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"isSystemAccount": "An account created and automatically operated by the system.",
	"instanceInfo": "Instance Information",
	"lastActiveDate": "Last used at",
	"email": "Email",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"updateRemoteUser": "Update remote user information",
	"suspend": "Suspend",
	"resetPassword": "Reset password",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "You must log in with an administrator account to view this.",
	"unsetUserAvatar": "Unset avatar",
	"unsetUserBanner": "Unset banner",
	"deleteAccount": "Delete account",
	"assign": "Assign",
	"messageRead": "Read",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"active": "Active",
	"archived": "Archived",
	"resetPasswordConfirm": "Really reset your password?",
	"newPasswordIs": "The new password is \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Are you sure that you want to suspend this account?",
	"unsuspendConfirm": "Are you sure that you want to unsuspend this account?",
	"unsetUserAvatarConfirm": "Are you sure you want to unset the avatar?",
	"unsetUserBannerConfirm": "Are you sure you want to unset the banner?",
	"deleteAllFilesConfirm": "Are you sure that you want to delete all files?",
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"typeToConfirm": "Please enter {x} to confirm",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Unassign",
	"roles": "Roles",
	"userInfo": "User information"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"isSystemAccount": "Акаунт, створений і автоматично керований системою.",
	"instanceInfo": "Про цей інстанс",
	"lastActiveDate": "Останнє використання",
	"email": "E-mail",
	"moderationNote": "Модераторська нотатка",
	"moderationNoteDescription": "Ви можете додати нотатки, які будуть доступні лише модераторам.\n",
	"updateRemoteUser": "Оновити інформацію про віддаленого користувача",
	"suspend": "Призупинити",
	"resetPassword": "Скинути пароль",
	"unsetMfa": "Скинути двофакторну аутентифікацію",
	"rolePolicies": "Policies",
	"requireAdminForView": "Для перегляду ви повинні увійти в акаунт адміністратора.",
	"unsetUserAvatar": "Деактивувати піктограму.",
	"unsetUserBanner": "Випустити прапор.",
	"deleteAccount": "Видалення акаунту",
	"assign": "Призначити",
	"messageRead": "Прочитано",
	"recentNHours": "Останні {n} годин",
	"recentNDays": "Останні {n} днів",
	"active": "Активовано",
	"archived": "Заархівовано",
	"resetPasswordConfirm": "Справді скинути пароль?",
	"newPasswordIs": "Новий пароль: {password}",
	"unsetMfaConfirm": "Ви впевнені, що бажаєте скинути двофакторну аутентифікацію?",
	"suspendConfirm": "Ви впевнені, що хочете призупинити цей акаунт?",
	"unsuspendConfirm": "Ви впевнені, що хочете відновити цей акаунт?",
	"unsetUserAvatarConfirm": " Ви впевнені, що хочете прибрати аватар?",
	"unsetUserBannerConfirm": "Ви впевнені, що хочете прибрати банер?",
	"deleteAllFilesConfirm": "Ви дійсно хочете видалити всі файли?",
	"deleteAccountConfirm": "Це незворотно видалить ваш акаунт. Продовжити?",
	"typeToConfirm": "Введіть {x} для підтвердження",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Скасувати призначення",
	"roles": "Ролі",
	"userInfo": "Інформація про користувача"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"isSystemAccount": "Đã tạo một tài khoản và tự động vận hành bởi hệ thống.",
	"instanceInfo": "Thông tin máy chủ",
	"lastActiveDate": "Lần cuối vào",
	"email": "Email",
	"moderationNote": "Ghi chú kiểm duyệt",
	"moderationNoteDescription": "Bạn có thể điền vào những ghi chú chỉ được chia sẻ giữa những người kiểm duyệt.",
	"updateRemoteUser": "Cập nhật thông tin người dùng ở máy chủ khác",
	"suspend": "Vô hiệu hóa",
	"resetPassword": "Đặt lại mật khẩu",
	"unsetMfa": "Reset two-factor authentication",
	"rolePolicies": "Policies",
	"requireAdminForView": "Bạn phải đăng nhập như là quản trị viên mới xem được.",
	"unsetUserAvatar": "Gỡ ảnh đại diện",
	"unsetUserBanner": "Gỡ ảnh bìa",
	"deleteAccount": "Xóa tài khoản",
	"assign": "Phân công",
	"messageRead": "Đã đọc",
	"recentNHours": "{n}h trước",
	"recentNDays": "{n} ngày trước",
	"active": "Hoạt động",
	"archived": "Archived",
	"resetPasswordConfirm": "Bạn thực sự muốn đặt lại mật khẩu?",
	"newPasswordIs": "Mật khẩu mới là \"{password}\"",
	"unsetMfaConfirm": "Are you sure you want to reset two-factor authentication?",
	"suspendConfirm": "Bạn có chắc muốn vô hiệu hóa người này?",
	"unsuspendConfirm": "Bạn có chắc muốn bỏ vô hiệu hóa người này?",
	"unsetUserAvatarConfirm": "Bạn có chắc muốn gỡ ảnh đại diện?",
	"unsetUserBannerConfirm": "Bạn có chắc muốn gỡ ảnh bìa?",
	"deleteAllFilesConfirm": "Bạn có chắc xóa toàn bộ tập tin?",
	"deleteAccountConfirm": "Điều này sẽ khiến tài khoản bị xóa vĩnh viễn. Vẫn tiếp tục?",
	"typeToConfirm": "Nhấn {x} để xác nhận",
	"roleChooseRoleToAssign": "Select the role to assign",
	"unassign": "Hủy phân công",
	"roles": "Vai trò",
	"userInfo": "Thông tin người dùng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"isSystemAccount": "该账号由系统自动创建和管理。",
	"instanceInfo": "服务器信息",
	"lastActiveDate": "最后活跃时间",
	"email": "邮箱",
	"moderationNote": "管理笔记",
	"moderationNoteDescription": "可以用来记录仅在管理员之间共享的笔记。",
	"updateRemoteUser": "更新远程用户信息",
	"suspend": "冻结",
	"resetPassword": "重置密码",
	"unsetMfa": "解除双重认证",
	"rolePolicies": "策略",
	"requireAdminForView": "需要使用管理员账户登录才能查看。",
	"unsetUserAvatar": "清除头像",
	"unsetUserBanner": "清除横幅",
	"deleteAccount": "删除账户",
	"assign": "分配",
	"messageRead": "已读",
	"recentNHours": "最近{n}小时",
	"recentNDays": "最近{n}天",
	"active": "活动",
	"archived": "已归档",
	"resetPasswordConfirm": "确定重置密码？",
	"newPasswordIs": "新的密码是「{password}」",
	"unsetMfaConfirm": "确认解除双重认证吗？",
	"suspendConfirm": "要冻结吗？",
	"unsuspendConfirm": "要解除冻结吗？",
	"unsetUserAvatarConfirm": "要清除头像吗？",
	"unsetUserBannerConfirm": "要清除横幅吗？",
	"deleteAllFilesConfirm": "要删除所有文件吗？",
	"deleteAccountConfirm": "将要删除账户。是否确认？",
	"typeToConfirm": "输入 {x} 以确认操作。",
	"roleChooseRoleToAssign": "选择要分配的角色",
	"unassign": "取消分配",
	"roles": "角色",
	"userInfo": "用户信息"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"isSystemAccount": "由系統自動建立與管理的帳戶。",
	"instanceInfo": "伺服器資訊",
	"lastActiveDate": "上次使用日期及時間",
	"email": "電子郵件",
	"moderationNote": "管理筆記",
	"moderationNoteDescription": "您可以編寫僅在審查員之間共用的註解。",
	"updateRemoteUser": "更新遠端使用者資訊",
	"suspend": "凍結",
	"resetPassword": "重設密碼",
	"unsetMfa": "解除雙重驗證",
	"rolePolicies": "政策",
	"requireAdminForView": "必須以管理員帳戶登入才可以檢視。",
	"unsetUserAvatar": "移除使用者的大頭貼",
	"unsetUserBanner": "移除使用者的橫幅圖像",
	"deleteAccount": "刪除帳戶",
	"assign": "指派",
	"messageRead": "已讀",
	"recentNHours": "過去 {n} 小時",
	"recentNDays": "過去 {n} 天",
	"active": "最近活躍",
	"archived": "已封存",
	"resetPasswordConfirm": "重設密碼？",
	"newPasswordIs": "新密碼為「{password}」",
	"unsetMfaConfirm": "要解除雙重驗證嗎？",
	"suspendConfirm": "確定凍結此使用者？",
	"unsuspendConfirm": "確定解凍此使用者？",
	"unsetUserAvatarConfirm": "確定要移除使用者的大頭貼嗎？",
	"unsetUserBannerConfirm": "確定要移除使用者的橫幅圖像嗎？",
	"deleteAllFilesConfirm": "要刪除所有檔案嗎？",
	"deleteAccountConfirm": "將要刪除帳戶。是否確定？",
	"typeToConfirm": "要執行這項操作，請輸入 {x} ",
	"roleChooseRoleToAssign": "選擇要指派的角色",
	"unassign": "取消指派",
	"roles": "角色",
	"userInfo": "使用者資訊"
}
</locale>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/privacy" :label="$locale.sfc.privacy" :keywords="['privacy']" icon="ti ti-lock-open">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f513.png" color="#aeff00">
			<SearchText>{{ $locale.sfc.settingsPrivacyBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label><SearchLabel>{{ $locale.sfc.followApprovalGroupTitle }}</SearchLabel></template>
			<div class="_gaps_m">
				<SearchMarker :keywords="['follow', 'lock']">
					<MkSwitch v-model="isLocked" @update:modelValue="save()">
						<template #label><SearchLabel>{{ $locale.sfc.makeFollowManuallyApprove }}</SearchLabel></template>
						<template #caption><SearchText>{{ $locale.sfc.lockedAccountInfo }}</SearchText></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['follow', 'request', 'approval', 'age']">
					<FormSlot>
						<template #label><SearchLabel>{{ $locale.sfc.followApprovalTitle }}</SearchLabel></template>
						<div class="_gaps_m">
							<div><SearchText>{{ $locale.sfc.followApprovalDescription }}</SearchText></div>
							<MkInfo v-if="isLocked"><SearchText>{{ $locale.sfc.followApprovalInactiveDescription }}</SearchText></MkInfo>
							<MkDisableSection :disabled="isLocked">
								<div class="_gaps_m">
									<div v-for="setting in followApprovalSettings" :key="setting.key" class="_gaps_s">
										<MkSelect v-model="setting.mode" :items="followApprovalModes" @update:modelValue="saveFollowApproval(setting)">
											<template #label><SearchLabel>{{ setting.label }}</SearchLabel></template>
											<template #caption><SearchText>{{ setting.caption }}</SearchText></template>
										</MkSelect>
										<MkInput v-if="setting.mode === 'custom'" v-model="setting.amount" type="number" :min="1 / FOLLOW_APPROVAL_UNIT_SECONDS[setting.unit]" :max="FOLLOW_APPROVAL_MAX_SECONDS / FOLLOW_APPROVAL_UNIT_SECONDS[setting.unit]" step="any" @update:modelValue="scheduleFollowApprovalSave(setting)">
											<template #label>{{ $locale.sfc.followApprovalPeriod }}</template>
											<template #suffix>{{ setting.unit === 'day' ? $locale.sfc.timeDay : $locale.sfc.timeHour }}</template>
											<template v-if="followApprovalPeriodToSeconds(setting.amount, setting.unit) == null" #caption>{{ $locale.sfc.followApprovalInvalidPeriod }}</template>
										</MkInput>
										<MkSelect v-if="setting.mode === 'custom'" v-model="setting.unit" :items="followApprovalUnits" @update:modelValue="saveFollowApproval(setting)">
											<template #label>{{ $locale.sfc.followApprovalUnit }}</template>
										</MkSelect>
									</div>
								</div>
							</MkDisableSection>
						</div>
					</FormSlot>
				</SearchMarker>

				<SearchMarker :keywords="['follow', 'auto', 'accept']">
					<MkSwitch v-model="autoAcceptFollowed" @update:modelValue="save()">
						<template #label><SearchLabel>{{ $locale.sfc.autoAcceptFollowed }}</SearchLabel></template>
						<template #caption><SearchText>{{ $locale.sfc.followApprovalAutoAcceptDescription }}</SearchText></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['reaction', 'public']">
			<MkSwitch v-model="publicReactions" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.makeReactionsPublic }}</SearchLabel></template>
				<template #caption><SearchText>{{ $locale.sfc.makeReactionsPublicDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['following', 'visibility']">
			<MkSelect v-model="followingVisibility" :items="followingVisibilityDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.followingVisibility }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['follower', 'visibility']">
			<MkSelect v-model="followersVisibility" :items="followersVisibilityDef" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.followersVisibility }}</SearchLabel></template>
			</MkSelect>
		</SearchMarker>

		<SearchMarker :keywords="['online', 'status']">
			<MkSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.hideOnlineStatus }}</SearchLabel></template>
				<template #caption><SearchText>{{ $locale.sfc.hideOnlineStatusDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['crawle', 'index', 'search']">
			<MkSwitch v-model="noCrawle" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.noCrawle }}</SearchLabel></template>
				<template #caption><SearchText>{{ $locale.sfc.noCrawleDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['crawle', 'ai']">
			<MkSwitch v-model="preventAiLearning" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.preventAiLearning }}</SearchLabel></template>
				<template #caption><SearchText>{{ $locale.sfc.preventAiLearningDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['explore']">
			<MkSwitch v-model="isExplorable" @update:modelValue="save()">
				<template #label><SearchLabel>{{ $locale.sfc.makeExplorable }}</SearchLabel></template>
				<template #caption><SearchText>{{ $locale.sfc.makeExplorableDescription }}</SearchText></template>
			</MkSwitch>
		</SearchMarker>

		<SearchMarker :keywords="['chat']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.directMessage }}</SearchLabel></template>

				<div class="_gaps_m">
					<MkInfo v-if="$i.policies.chatAvailability === 'unavailable'">{{ $locale.sfc.chatChatNotAvailableForThisAccountOrServer }}</MkInfo>
					<SearchMarker :keywords="['chat']">
						<MkSelect v-model="chatScope" :items="chatScopeDef" @update:modelValue="save()">
							<template #label><SearchLabel>{{ $locale.sfc.chatChatAllowedUsers }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.chatChatAllowedUsers_note }}</template>
						</MkSelect>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['lockdown']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.lockdown }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['login', 'signin']">
						<MkSwitch :modelValue="requireSigninToViewContents" @update:modelValue="update_requireSigninToViewContents">
							<template #label><SearchLabel>{{ $locale.sfc.accountSettingsRequireSigninToViewContents }}</SearchLabel></template>
							<template #caption>
								<div>{{ $locale.sfc.accountSettingsRequireSigninToViewContentsDescription1 }}</div>
								<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ $locale.sfc.accountSettingsRequireSigninToViewContentsDescription2 }}</div>
							</template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['follower']">
						<FormSlot>
							<template #label><SearchLabel>{{ $locale.sfc.accountSettingsMakeNotesFollowersOnlyBefore }}</SearchLabel></template>

							<div class="_gaps_s">
								<MkSelect
									v-model="makeNotesFollowersOnlyBefore_type"
									:items="[
										{ label: $locale.sfc.none, value: null },
										{ label: $locale.sfc.accountSettingsNotesHavePassedSpecifiedPeriod, value: 'relative' },
										{ label: $locale.sfc.accountSettingsNotesOlderThanSpecifiedDateAndTime, value: 'absolute' },
									]"
								>
								</MkSelect>

								<MkSelect
									v-if="makeNotesFollowersOnlyBefore_type === 'relative'"
									v-model="makeNotesFollowersOnlyBefore_selection"
									:items="[
										...makeNotesFollowersOnlyBefore_presets,
										{ label: $locale.sfc.custom, value: 'custom' },
									]"
								>
								</MkSelect>

								<MkInput
									v-if="makeNotesFollowersOnlyBefore_type === 'relative' && makeNotesFollowersOnlyBefore_isCustomMode"
									v-model="makeNotesFollowersOnlyBefore_customMonths"
									type="number"
									:min="1"
								>
									<template #suffix>{{ $locale.sfc.timeMonth }}</template>
								</MkInput>

								<MkInput
									v-if="makeNotesFollowersOnlyBefore_type === 'absolute' && makeNotesFollowersOnlyBefore != null"
									:modelValue="formatDateTimeString(new Date(makeNotesFollowersOnlyBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesFollowersOnlyBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchText>{{ $locale.sfc.accountSettingsMakeNotesFollowersOnlyBeforeDescription }}</SearchText></div>
							</template>
						</FormSlot>
					</SearchMarker>

					<SearchMarker :keywords="['hidden']">
						<FormSlot>
							<template #label><SearchLabel>{{ $locale.sfc.accountSettingsMakeNotesHiddenBefore }}</SearchLabel></template>

							<div class="_gaps_s">
								<MkSelect
									v-model="makeNotesHiddenBefore_type"
									:items="[
										{ label: $locale.sfc.none, value: null },
										{ label: $locale.sfc.accountSettingsNotesHavePassedSpecifiedPeriod, value: 'relative' },
										{ label: $locale.sfc.accountSettingsNotesOlderThanSpecifiedDateAndTime, value: 'absolute' },
									]"
								>
								</MkSelect>

								<MkSelect
									v-if="makeNotesHiddenBefore_type === 'relative'"
									v-model="makeNotesHiddenBefore_selection"
									:items="[
										...makeNotesHiddenBefore_presets,
										{ label: $locale.sfc.custom, value: 'custom' },
									]"
								>
								</MkSelect>

								<MkInput
									v-if="makeNotesHiddenBefore_type === 'relative' && makeNotesHiddenBefore_isCustomMode"
									v-model="makeNotesHiddenBefore_customMonths"
									type="number"
									:min="1"
								>
									<template #suffix>{{ $locale.sfc.timeMonth }}</template>
								</MkInput>

								<MkInput
									v-if="makeNotesHiddenBefore_type === 'absolute' && makeNotesHiddenBefore != null"
									:modelValue="formatDateTimeString(new Date(makeNotesHiddenBefore * 1000), 'yyyy-MM-dd')"
									type="date"
									:manualSave="true"
									@update:modelValue="makeNotesHiddenBefore = Math.floor(new Date($event).getTime() / 1000)"
								>
								</MkInput>
							</div>

							<template #caption>
								<div><SearchText>{{ $locale.sfc.accountSettingsMakeNotesHiddenBeforeDescription }}</SearchText></div>
							</template>
						</FormSlot>
					</SearchMarker>

					<MkInfo warn>{{ $locale.sfc.accountSettingsMayNotEffectSomeSituations }}</MkInfo>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import type { FollowApprovalPeriodUnit } from '@features/users/frontend/utility/follow-approval.js';
import { FOLLOW_APPROVAL_MAX_SECONDS, FOLLOW_APPROVAL_UNIT_SECONDS, followApprovalPeriodFromSeconds, followApprovalPeriodToSeconds } from '@features/users/frontend/utility/follow-approval.js';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { instance } from '@features/instance/frontend/instance.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import { formatDateTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import MkDisableSection from '@features/ui/frontend/components/MkDisableSection.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';

const $i = ensureSignin();

const isLocked = ref($i.isLocked);
const autoAcceptFollowed = ref($i.autoAcceptFollowed);

type FollowApprovalSetting = {
	key: 'followApprovalLocalSeconds' | 'followApprovalRemoteSeconds';
	mode: 'default' | 'disabled' | 'custom';
	amount: number | null;
	unit: FollowApprovalPeriodUnit;
	label: string;
	caption: string;
};

const followApprovalSettings = ref<FollowApprovalSetting[]>([
	{
		key: 'followApprovalLocalSeconds',
		mode: $i.followApprovalLocalSeconds == null ? 'default' : $i.followApprovalLocalSeconds === 0 ? 'disabled' : 'custom',
		...followApprovalPeriodFromSeconds($i.followApprovalLocalSeconds || 7 * 86400),
		get label() { return $locale.value.sfc.followApprovalLocal; },
		get caption() { return $locale.value.sfc.followApprovalLocalDescription; },
	},
	{
		key: 'followApprovalRemoteSeconds',
		mode: $i.followApprovalRemoteSeconds == null ? 'default' : $i.followApprovalRemoteSeconds === 0 ? 'disabled' : 'custom',
		...followApprovalPeriodFromSeconds($i.followApprovalRemoteSeconds || 7 * 86400),
		get label() { return $locale.value.sfc.followApprovalRemote; },
		get caption() { return $locale.value.sfc.followApprovalRemoteDescription; },
	},
]);

const followApprovalModes = computed(() => [
	{ label: $locale.value.sfc.followApprovalUseDefault, value: 'default' },
	{ label: $locale.value.sfc.disabled, value: 'disabled' },
	{ label: $locale.value.sfc.followApprovalCustom, value: 'custom' },
]);

const followApprovalUnits = computed(() => [
	{ label: $locale.value.sfc.timeHour, value: 'hour' },
	{ label: $locale.value.sfc.timeDay, value: 'day' },
]);

const followApprovalSaveTimers = new Map<FollowApprovalSetting['key'], number>();

function scheduleFollowApprovalSave(setting: FollowApprovalSetting) {
	window.clearTimeout(followApprovalSaveTimers.get(setting.key));
	followApprovalSaveTimers.set(setting.key, window.setTimeout(() => saveFollowApproval(setting), 1000));
}

onBeforeUnmount(() => {
	for (const setting of followApprovalSettings.value) {
		if (followApprovalSaveTimers.has(setting.key)) saveFollowApproval(setting);
	}
});

function saveFollowApproval(setting: FollowApprovalSetting) {
	window.clearTimeout(followApprovalSaveTimers.get(setting.key));
	followApprovalSaveTimers.delete(setting.key);
	const seconds = followApprovalPeriodToSeconds(setting.amount, setting.unit);
	if (setting.mode === 'custom' && seconds == null) {
		return;
	}
	misskeyApi('i/update', {
		[setting.key]: setting.mode === 'default' ? null : setting.mode === 'disabled' ? 0 : seconds,
	}).catch(err => {
		os.alert({
			type: 'error',
			title: $locale.value.sfc.error,
			text: err.code === 'RATE_LIMIT_EXCEEDED' ? $locale.value.sfc.cannotPerformTemporaryDescription : err.message,
		});
	});
}

const noCrawle = ref($i.noCrawle);
const preventAiLearning = ref($i.preventAiLearning);
const isExplorable = ref($i.isExplorable);
const requireSigninToViewContents = ref($i.requireSigninToViewContents ?? false);
const makeNotesFollowersOnlyBefore = ref($i.makeNotesFollowersOnlyBefore ?? null);
const makeNotesHiddenBefore = ref($i.makeNotesHiddenBefore ?? null);
const hideOnlineStatus = ref($i.hideOnlineStatus);
const publicReactions = ref($i.publicReactions);
const {
	model: followingVisibility,
	def: followingVisibilityDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.public, value: 'public' },
		{ label: $locale.value.sfc.followers, value: 'followers' },
		{ label: $locale.value.sfc.private, value: 'private' },
	],
	initialValue: $i.followingVisibility,
});
const {
	model: followersVisibility,
	def: followersVisibilityDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.public, value: 'public' },
		{ label: $locale.value.sfc.followers, value: 'followers' },
		{ label: $locale.value.sfc.private, value: 'private' },
	],
	initialValue: $i.followersVisibility,
});
const {
	model: chatScope,
	def: chatScopeDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.chatChatAllowedUsersEveryone, value: 'everyone' },
		{ label: $locale.value.sfc.chatChatAllowedUsersFollowers, value: 'followers' },
		{ label: $locale.value.sfc.chatChatAllowedUsersFollowing, value: 'following' },
		{ label: $locale.value.sfc.chatChatAllowedUsersMutual, value: 'mutual' },
		{ label: $locale.value.sfc.chatChatAllowedUsersNone, value: 'none' },
	],
	initialValue: $i.chatScope,
});

const makeNotesFollowersOnlyBefore_type = computed({
	get: () => {
		if (makeNotesFollowersOnlyBefore.value == null) {
			return null;
		} else if (makeNotesFollowersOnlyBefore.value >= 0) {
			return 'absolute';
		} else {
			return 'relative';
		}
	},
	set(value) {
		if (value === 'relative') {
			makeNotesFollowersOnlyBefore.value = -604800;
		} else if (value === 'absolute') {
			makeNotesFollowersOnlyBefore.value = Math.floor(Date.now() / 1000);
		} else {
			makeNotesFollowersOnlyBefore.value = null;
		}
	},
});

const makeNotesFollowersOnlyBefore_presets = [
	{ label: $locale.value.sfc.oneHour, value: -3600 },
	{ label: $locale.value.sfc.oneDay, value: -86400 },
	{ label: $locale.value.sfc.threeDays, value: -259200 },
	{ label: $locale.value.sfc.oneWeek, value: -604800 },
	{ label: $locale.value.sfc.oneMonth, value: -2592000 },
	{ label: $locale.value.sfc.threeMonths, value: -7776000 },
	{ label: $locale.value.sfc.oneYear, value: -31104000 },
] satisfies MkSelectItem[];

const makeNotesFollowersOnlyBefore_isCustomMode = ref(
	makeNotesFollowersOnlyBefore.value != null &&
	makeNotesFollowersOnlyBefore.value < 0 &&
	!makeNotesFollowersOnlyBefore_presets.some((preset) => preset.value === makeNotesFollowersOnlyBefore.value),
);

const makeNotesFollowersOnlyBefore_selection = computed({
	get: () => makeNotesFollowersOnlyBefore_isCustomMode.value ? 'custom' : makeNotesFollowersOnlyBefore.value,
	set(value) {
		makeNotesFollowersOnlyBefore_isCustomMode.value = value === 'custom';
		if (value !== 'custom') makeNotesFollowersOnlyBefore.value = value;
	},
});

const makeNotesFollowersOnlyBefore_customMonths = computed({
	get: () => makeNotesFollowersOnlyBefore.value ? Math.abs(makeNotesFollowersOnlyBefore.value) / (30 * 24 * 60 * 60) : null,
	set(value) {
		if (value != null && value > 0) makeNotesFollowersOnlyBefore.value = -Math.abs(Math.floor(Number(value))) * 30 * 24 * 60 * 60;
	},
});

const makeNotesHiddenBefore_type = computed({
	get: () => {
		if (makeNotesHiddenBefore.value == null) {
			return null;
		} else if (makeNotesHiddenBefore.value >= 0) {
			return 'absolute';
		} else {
			return 'relative';
		}
	},
	set(value) {
		if (value === 'relative') {
			makeNotesHiddenBefore.value = -604800;
		} else if (value === 'absolute') {
			makeNotesHiddenBefore.value = Math.floor(Date.now() / 1000);
		} else {
			makeNotesHiddenBefore.value = null;
		}
	},
});

const makeNotesHiddenBefore_presets = [
	{ label: $locale.value.sfc.oneHour, value: -3600 },
	{ label: $locale.value.sfc.oneDay, value: -86400 },
	{ label: $locale.value.sfc.threeDays, value: -259200 },
	{ label: $locale.value.sfc.oneWeek, value: -604800 },
	{ label: $locale.value.sfc.oneMonth, value: -2592000 },
	{ label: $locale.value.sfc.threeMonths, value: -7776000 },
	{ label: $locale.value.sfc.oneYear, value: -31104000 },
] satisfies MkSelectItem[];

const makeNotesHiddenBefore_isCustomMode = ref(
	makeNotesHiddenBefore.value != null &&
	makeNotesHiddenBefore.value < 0 &&
	!makeNotesHiddenBefore_presets.some((preset) => preset.value === makeNotesHiddenBefore.value),
);

const makeNotesHiddenBefore_selection = computed({
	get: () => makeNotesHiddenBefore_isCustomMode.value ? 'custom' : makeNotesHiddenBefore.value,
	set(value) {
		makeNotesHiddenBefore_isCustomMode.value = value === 'custom';
		if (value !== 'custom') makeNotesHiddenBefore.value = value;
	},
});

const makeNotesHiddenBefore_customMonths = computed({
	get: () => makeNotesHiddenBefore.value ? Math.abs(makeNotesHiddenBefore.value) / (30 * 24 * 60 * 60) : null,
	set(value) {
		if (value != null && value > 0) makeNotesHiddenBefore.value = -Math.abs(Math.floor(Number(value))) * 30 * 24 * 60 * 60;
	},
});

watch([makeNotesFollowersOnlyBefore, makeNotesHiddenBefore], () => {
	save();
});

async function update_requireSigninToViewContents(value: boolean) {
	if (value === true && instance.federation !== 'none') {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.acknowledgeNotesAndEnable,
		});
		if (canceled) return;
	}

	requireSigninToViewContents.value = value;
	save();
}

function save() {
	misskeyApi('i/update', {
		isLocked: !!isLocked.value,
		autoAcceptFollowed: !!autoAcceptFollowed.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
		isExplorable: !!isExplorable.value,
		requireSigninToViewContents: !!requireSigninToViewContents.value,
		makeNotesFollowersOnlyBefore: makeNotesFollowersOnlyBefore.value,
		makeNotesHiddenBefore: makeNotesHiddenBefore.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		publicReactions: !!publicReactions.value,
		followingVisibility: followingVisibility.value,
		followersVisibility: followersVisibility.value,
		chatScope: chatScope.value,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.privacy,
	icon: 'ti ti-lock-open',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"privacy": "الخصوصية",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "قبول طلبات الإشتراك يدويا",
	"lockedAccountInfo": "ستكون هذه الملاحظة مرئية للجميع مالم تحدد مرئتيها إلى \"للمتابعين فقط\"",
	"autoAcceptFollowed": "اقبل طلبات المتابعة تلقائيا من الحسابات المتابَعة",
	"makeReactionsPublic": "اجعل سجل التفاعلات علنيًا",
	"makeReactionsPublicDescription": "هذا سيجعل قائمة تفاعلاتك مرئية للعلن.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "اخف الحالة",
	"hideOnlineStatusDescription": "قد يؤدي جعل اخفاء حالتك إلى تعطيل أداء بعض الميزات ، مثل البحث.",
	"noCrawle": "ارفض فهرسة زاحف الويب",
	"noCrawleDescription": "يطلب من محركات البحث ألّا يُفهرسوا ملفك الشخصي وملاحظات وصفحاتك وما شابه.",
	"preventAiLearning": "منع استخدام البيانات في تعليم الآلة",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "أظهر الحساب في صفحة \"استكشاف\"",
	"makeExplorableDescription": "بتعطيل هذا الخيار لن يظهر حسابك في صفحة \"استكشاف\"",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "لا شيء",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "علني",
	"followers": "المتابِعون",
	"private": "خاص",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "ساعة",
	"oneDay": "يوم",
	"threeDays": "3 days",
	"oneWeek": "أسبوع",
	"oneMonth": "شهر",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "معطّل",
	"timeHour": "سا",
	"timeDay": "ي",
	"error": "خطأ",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"privacy": "Privadesa",
	"settingsPrivacyBanner": "Pots establir la configuració de privacitat del compte, com el grau de visibilitat del teu contingut, la facilitat per trobar-ho i si es pot aprovar els seguidors.",
	"makeFollowManuallyApprove": "Les sol·licituds de seguiment requereixen aprovació",
	"lockedAccountInfo": "Tret que establiu la visibilitat de la nota a \"Només seguidors\", les vostres notes seran visibles per qualsevol persona, fins i tot si heu d'aprovar els seguidors manualment",
	"autoAcceptFollowed": "Aprova automàticament les sol·licituds de seguiment dels usuaris que segueixes",
	"makeReactionsPublic": "Reaccions públiques ",
	"makeReactionsPublicDescription": "Això fa que totes les teves reaccions siguin visibles públicament ",
	"followingVisibility": "Visibilitat dels seguiments",
	"followersVisibility": "Visibilitat dels seguidors",
	"hideOnlineStatus": "Ocultar l'estat de connexió",
	"hideOnlineStatusDescription": "Ocultant el teu estat de connexió redueix les funcionalitats d'algunes funcions com la cerca.",
	"noCrawle": "Rebutjar la indexació dels buscadors",
	"noCrawleDescription": "No permetis que els buscadors indexin el teu perfil, notes, pàgines, etc.",
	"preventAiLearning": "Descartar l'ús d'aprenentatge automàtic (IA Generativa)",
	"preventAiLearningDescription": "Demanar els indexadors no fer servir els texts, imatges, etc. en cap conjunt de dades per alimentar l'aprenentatge automàtic (IA Predictiva/ Generativa). Això s'aconsegueix afegint la etiqueta \"noai\" com a resposta HTML al contingut corresponent. Prevenir aquest ús totalment pot ser que no sigui aconseguit, ja que molts indexadors poden obviar aquesta etiqueta.",
	"makeExplorable": "Fes que el compte sigui visible a la secció \"Explorar\"",
	"makeExplorableDescription": "Si desactives aquesta opció, el teu compte no sortirà a la secció \"Explorar\"",
	"directMessage": "Xateja amb aquest usuari",
	"chatChatNotAvailableForThisAccountOrServer": "El xat no està disponible per aquest servidor o aquest compte.",
	"chatChatAllowedUsers": "Usuaris que poden xatejar",
	"chatChatAllowedUsers_note": "Pots xatejar amb qualsevol usuari a qui hagis enviat un missatge de xat, independentment d'aquesta configuració.",
	"lockdown": "Bloquejat",
	"accountSettingsRequireSigninToViewContents": "És obligatori l'inici de sessió per poder veure el contingut",
	"accountSettingsRequireSigninToViewContentsDescription1": "Es requereix l'inici de sessió per poder veure totes les notes i el contingut que has creat. Amb això esperem evitar que els rastrejadors recopilin informació.",
	"accountSettingsRequireSigninToViewContentsDescription2": "També es desactivaran les vistes prèvies d'URLS (OGP), la incrustació a pàgines web i la visualització des de servidors que no admetin la citació de notes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Permetre que les notes antigues només es mostrin als seguidors.",
	"none": "Res",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes publicades durant un període de temps especificat.",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes més antigues de la data i temps especificat ",
	"custom": "Personalitzat",
	"timeMonth": "Mes(os)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Mentre aquesta funció estigui activada, les notes que hagin passat la data i hora fixada o hagi passat els temps establert seran visibles només per als teus seguidors. Quan es desactivi, també es restableix l'estat públic de la nota.",
	"accountSettingsMakeNotesHiddenBefore": "Fes que les notes antigues siguin privades",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Mentres aquesta funció estigui activada les notes que hagin superat una data i hora fixada o hagi passat el temps establert només seran visibles per a tu. Si la desactives es restablirà també l'estat públic de les notes.",
	"accountSettingsMayNotEffectSomeSituations": "Aquestes restriccions són simplificades. Pot ser que no s'apliquin en determinades situacions, com quan es modera o visualitza un servidor remot.",
	"public": "Públic ",
	"followers": "Seguidors",
	"private": "Privat",
	"chatChatAllowedUsersEveryone": "Tothom",
	"chatChatAllowedUsersFollowers": "Només els teus seguidors",
	"chatChatAllowedUsersFollowing": "Només usuaris als que segueixes",
	"chatChatAllowedUsersMutual": "Només seguidors mutus",
	"chatChatAllowedUsersNone": "Ningú ",
	"oneHour": "1 hora",
	"oneDay": "Un dia",
	"threeDays": "3 dies",
	"oneWeek": "Una setmana",
	"oneMonth": "Un mes",
	"threeMonths": "3 mesos",
	"oneYear": "1 any",
	"acknowledgeNotesAndEnable": "Activa'l després de comprendre els possibles perills.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Desactivat",
	"timeHour": "Hor(a)(es)",
	"timeDay": "Di(a)(es)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "Aquesta acció no es pot dur a terme temporalment per arribar al seu límit d'execució. Pots esperar una mica i tornar-ho a intentar."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"privacy": "Soukromí",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Žádosti o sledování vyžadují potvrzení",
	"lockedAccountInfo": "Pokud nenastavíte viditelnost poznámek na \"Pouze pro sledující\", budou poznámky viditelné všem i přesto že vyžadujete manuální potvrzení pro sledování.",
	"autoAcceptFollowed": "Automaticky akceptovat následování od účtů které sledujete",
	"makeReactionsPublic": "Nastavit historii reakcí jako veřejnou",
	"makeReactionsPublicDescription": "Tohle zviditelný seznam vašich předchozích reakcí veřejně.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Skrýt Váš online status",
	"hideOnlineStatusDescription": "Skrytí vašeho online stavu může snížit funkcionalitu některých funkcí, například vyhledávání.",
	"noCrawle": "Odmítat indexování crawleru",
	"noCrawleDescription": "Požádat vyhledávače aby neindexovali váš profil, poznámky, stránky, atd.",
	"preventAiLearning": "Odmítnout použití v strojovém učení (Generative AI)",
	"preventAiLearningDescription": "Požaduje, aby prohlížeče nepoužívaly zveřejněný textový nebo obrazový materiál atd. v datových sadách pro strojové učení (prediktivní / generativní umělá inteligence). Toho se dosáhne přidáním příznaku \"noai\" HTML-Response k příslušnému obsahu. Úplné prevence však tímto příznakem nelze dosáhnout, protože může být jednoduše ignorován.",
	"makeExplorable": "Udělat účet viditelný v \"Objevit\"",
	"makeExplorableDescription": "Pokud tohle vypnete, tak se účet přestane zobrazovat v sekci \"Objevit\".",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Žádný",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Veřejný",
	"followers": "Sledující",
	"private": "Soukromý",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 hodina",
	"oneDay": "1 den",
	"threeDays": "3 dny",
	"oneWeek": "1 týden",
	"oneMonth": "1 měsíc",
	"threeMonths": "3 měsíce",
	"oneYear": "1 rok",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Vypnuto",
	"timeHour": "Hodin",
	"timeDay": "Dnů",
	"error": "Chyba",
	"cannotPerformTemporaryDescription": "Tuto akci nelze dočasně provést z důvodu překročení limitu provedení. Chvíli počkejte a zkuste to znovu."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Make account visible in \"Explore\"",
	"makeExplorableDescription": "If you turn this off, your account will not show up in the \"Explore\" section.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "None",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Followers",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 days",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"privacy": "Privatsphäre",
	"settingsPrivacyBanner": "Du kannst Einstellungen für die Privatsphäre deines Kontos vornehmen, z. B. inwieweit Inhalte veröffentlicht werden, wie leicht sie zu finden sind und ob Follower genehmigt werden müssen.",
	"makeFollowManuallyApprove": "Follow-Anfragen benötigen Bestätigung",
	"lockedAccountInfo": "Auch wenn du Follow-Anfragen auf manuelle Bestätigung setzt, wird jede deiner Notizen öffentlich sichtbar sein, sofern du ihre Notizsichtbarkeit nicht auf \"Nur Follower\" setzt.",
	"autoAcceptFollowed": "Follow-Anfragen von Benutzern, denen du folgst, automatisch akzeptieren",
	"makeReactionsPublic": "Reaktionsverlauf veröffentlichen",
	"makeReactionsPublicDescription": "Jeder wird die Liste deiner gesendeten Reaktionen einsehen können.",
	"followingVisibility": "Sichtbarkeit der Gefolgten",
	"followersVisibility": "Sichtbarkeit der Folgenden",
	"hideOnlineStatus": "Onlinestatus verbergen",
	"hideOnlineStatusDescription": "Das Verbergen deines Onlinestatuses reduziert die Nützlichkeit von Funktionen wie der Suche.",
	"noCrawle": "Crawler-Indexierung ablehnen",
	"noCrawleDescription": "Suchmaschinen bitten, die eigene Profilseite, Notizen, Seiten usw. nicht zu indexieren.",
	"preventAiLearning": "Verwendung in machinellem Lernen (Generative bzw. Prediktive AI/KI) ablehnen",
	"preventAiLearningDescription": "Fordert Crawler auf, gepostetes Text- oder Bildmaterial usw. nicht in Datensätzen für maschinelles Lernen (Generative bzw. Prediktive AI/KI) zu verwenden. Dies wird durch das Hinzufügen einer \"noai\"-Flag in der HTML-Antwort des jeweiligen Inhalts erreicht. Da diese Flag jedoch ignoriert werden kann, ist eine vollständige Verhinderung hierdurch nicht möglich.",
	"makeExplorable": "Benutzerkonto in „Erkunden“ sichtbar machen",
	"makeExplorableDescription": "Wenn diese Option deaktiviert ist, ist dein Benutzerkonto nicht im „Erkunden“-Bereich sichtbar.",
	"directMessage": "Mit dem Benutzer chatten",
	"chatChatNotAvailableForThisAccountOrServer": "Der Chat ist auf diesem Server oder für dieses Konto nicht aktiviert.",
	"chatChatAllowedUsers": "Wem das Chatten erlaubt werden soll",
	"chatChatAllowedUsers_note": "Du kannst unabhängig von dieser Einstellung mit allen Personen chatten, denen du eine Chat-Nachricht gesendet hast.",
	"lockdown": "Sperren",
	"accountSettingsRequireSigninToViewContents": "Anmeldung erfordern, um Inhalte anzuzeigen",
	"accountSettingsRequireSigninToViewContentsDescription1": "Erfordere eine Anmeldung, um alle Notizen und andere Inhalte anzuzeigen, die du erstellt hast. Dadurch wird verhindert, dass Crawler deine Informationen sammeln.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Der Inhalt wird nicht in URL-Vorschauen (OGP), eingebettet in Webseiten oder auf Servern, die keine Zitate unterstützen, angezeigt.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Macht frühere Notizen nur für Follower sichtbar",
	"none": "Nichts",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notizen die nach der folgenden Zeit veröffentlicht worden",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notizen vor einem bestimmtem Datum und Uhrzeit",
	"custom": "Benutzerdefiniert",
	"timeMonth": "Monat(e)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Solange diese Funktion aktiviert ist, sind Notizen, die nach dem eingestellten Datum und der eingestellten Zeit liegen oder die eingestellte Zeit abgelaufen ist, nur für Follower sichtbar. Bei Deaktivierung wird auch der öffentliche Status der Notiz wiederhergestellt.",
	"accountSettingsMakeNotesHiddenBefore": "Frühere Notizen privat machen",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "Diese Einschränkungen sind vereinfacht. Sie gelten möglicherweise nicht in allen Situationen, z. B. bei der Anzeige auf einem fremden Server oder während der Moderation.",
	"public": "Öffentlich",
	"followers": "Gefolgt von",
	"private": "Privat",
	"chatChatAllowedUsersEveryone": "Jeder",
	"chatChatAllowedUsersFollowers": "Nur deine Follower",
	"chatChatAllowedUsersFollowing": "Nur Benutzer, denen du folgst",
	"chatChatAllowedUsersMutual": "Nur Benutzer, die sich gegenseitig folgen",
	"chatChatAllowedUsersNone": "Niemand",
	"oneHour": "Eine Stunde",
	"oneDay": "Einen Tag",
	"threeDays": "3 Tage",
	"oneWeek": "Eine Woche",
	"oneMonth": "1 Monat",
	"threeMonths": "3 Monate",
	"oneYear": "1 Jahr",
	"acknowledgeNotesAndEnable": "Schalten Sie dies erst ein, wenn Sie die Vorsichtsmaßnahmen verstanden haben.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Deaktiviert",
	"timeHour": "Stunde(n)",
	"timeDay": "Tag(en)",
	"error": "Fehler",
	"cannotPerformTemporaryDescription": "Diese Aktion ist wegen des Überschreitenes des Ausführungslimits temporär nicht verfügbar. Bitte versuche es nach einiger Zeit erneut."
}
</locale>

<locale lang="json" locale="en-US">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Make account visible in \"Explore\"",
	"makeExplorableDescription": "If you turn this off, your account will not show up in the \"Explore\" section.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "None",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Followers",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 days",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"privacy": "Privacidad",
	"settingsPrivacyBanner": "Puedes configurar opciones relacionadas con la privacidad de la cuenta, como la visibilidad del contenido, la posibilidad de descubrir la cuenta y la aprobación de seguimiento.",
	"makeFollowManuallyApprove": "Aprobar manualmente las solicitudes de seguimiento",
	"lockedAccountInfo": "A menos que configures la visibilidad de tus notas como \"Sólo seguidores\", tus notas serán visibles para cualquiera, incluso si requieres que los seguidores sean aprobados manualmente.",
	"autoAcceptFollowed": "Aceptar automáticamente las solicitudes de seguimiento de los usuarios que sigues",
	"makeReactionsPublic": "Hacer el historial de reacciones público",
	"makeReactionsPublicDescription": "Todas las reacciones que hayas hecho serán públicamente visibles.",
	"followingVisibility": "Visibilidad de seguidos",
	"followersVisibility": "Visibilidad de seguidores",
	"hideOnlineStatus": "Mostrarse como desconectado",
	"hideOnlineStatusDescription": "Ocultar su estado en línea puede reducir la eficacia de algunas funciones, como la búsqueda",
	"noCrawle": "Rechazar indexación del crawler",
	"noCrawleDescription": "Pedir a los motores de búsqueda que no indexen tu perfil, notas, páginas, etc.",
	"preventAiLearning": "Rechazar el uso en el Aprendizaje de Máquinas. (IA Generativa)",
	"preventAiLearningDescription": "Pedirle a las arañas (crawlers) no usar los textos publicados o imágenes en el aprendizaje automático (IA Predictiva / Generativa). Ésto se logra añadiendo una marca respuesta HTML con la cadena \"noai\" al cantenido. Una prevención total no podría lograrse sólo usando ésta marca, ya que puede ser simplemente ignorada.",
	"makeExplorable": "Hacer visible la cuenta en \"Explorar\"",
	"makeExplorableDescription": "Si desactiva esta opción, su cuenta no aparecerá en la sección \"Explorar\".",
	"directMessage": "Chatear",
	"chatChatNotAvailableForThisAccountOrServer": "El chat no está habilitado en este servidor ni para esta cuenta.",
	"chatChatAllowedUsers": "A quién permitir chatear.",
	"chatChatAllowedUsers_note": "Puedes chatear con cualquier persona a la que hayas enviado un mensaje de chat, independientemente de esta configuración.",
	"lockdown": "Bloqueo",
	"accountSettingsRequireSigninToViewContents": "Se requiere iniciar sesión para ver el contenido",
	"accountSettingsRequireSigninToViewContentsDescription1": "Requiere iniciar sesión para ver todas las notas y otros contenidos que hayas creado. Se espera que esto evite que los rastreadores recopilen información.",
	"accountSettingsRequireSigninToViewContentsDescription2": "El contenido no se mostrará en vistas previas de URL (OGP), incrustado en páginas web o en servidores que no admitan citas de notas.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Hacer que las notas antiguas sólo se muestren a los seguidores",
	"none": "Ninguna",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notas publicadas durante el siguiente tiempo específico",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notas antes de la fecha y hora especificadas",
	"custom": "Personalizado",
	"timeMonth": "Mes(es)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Mientras esta función esté activada, sólo los seguidores podrán ver las notas que hayan superado la fecha y hora establecidas o que hayan estado visibles durante un tiempo determinado. Cuando se desactive, también se restablecerá el estado de publicación de la nota.",
	"accountSettingsMakeNotesHiddenBefore": "Hacer privadas las notas antiguas ",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Mientras esta función esté activada, las notas que hayan pasado la fecha y hora fijadas o hayan transcurrido el tiempo establecido sólo serán visibles para ti (se harán privadas). Si la desactivas, también se restablecerá el estado público de las notas.",
	"accountSettingsMayNotEffectSomeSituations": "Estas restricciones son simplificadas. Pueden no aplicarse en algunas situaciones, como cuando se visualiza en un servidor remoto o durante la moderación.",
	"public": "Público",
	"followers": "Seguidores",
	"private": "Privado",
	"chatChatAllowedUsersEveryone": "Todos",
	"chatChatAllowedUsersFollowers": "Sólo sus propios seguidores.",
	"chatChatAllowedUsersFollowing": "Solo usuarios que sigues",
	"chatChatAllowedUsersMutual": "Solo seguidores mutuos",
	"chatChatAllowedUsersNone": "Nadie",
	"oneHour": "1 hora",
	"oneDay": "1 día",
	"threeDays": "Tres días",
	"oneWeek": "1 semana",
	"oneMonth": "1 mes",
	"threeMonths": "Tres meses",
	"oneYear": "Un año",
	"acknowledgeNotesAndEnable": "Activar después de comprender las precauciones",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Desactivado",
	"timeHour": "Horas",
	"timeDay": "Días",
	"error": "Error",
	"cannotPerformTemporaryDescription": "Esta acción no se puede realizar porque se excedió el límite de ejecución. Espera un poco y prueba de nuevo."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"privacy": "Confidentialité",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Accepter manuellement les demandes d’abonnement",
	"lockedAccountInfo": "À moins que vous ne définissiez la visibilité de votre note sur \"Abonné-e-s\", vos notes sont visibles par tous, même si vous exigez que les demandes d'abonnement soient approuvées manuellement.",
	"autoAcceptFollowed": "Accepter automatiquement les demandes d’abonnement venant d’utilisateur·rice·s que vous suivez",
	"makeReactionsPublic": "Rendre les réactions publiques",
	"makeReactionsPublicDescription": "Ceci rendra la liste de toutes vos réactions données publique.",
	"followingVisibility": "Visibilité des abonnements",
	"followersVisibility": "Visibilité des abonnés",
	"hideOnlineStatus": "Se rendre invisible",
	"hideOnlineStatusDescription": "Rendre votre statut invisible peut diminuer les performances de certaines fonctionnalités, telles que la Recherche.",
	"noCrawle": "Refuser l'indexation par les robots",
	"noCrawleDescription": "Demandez aux moteurs de recherche de ne pas indexer votre page de profil, vos notes, vos pages, etc.",
	"preventAiLearning": "Refuser l'usage dans l'apprentissage automatique d'IA générative",
	"preventAiLearningDescription": "Demander aux robots d'indexation de ne pas utiliser le contenu publié, tel que les notes et les images, dans l'apprentissage automatique d'IA générative. Cela est réalisé en incluant le drapeau « noai » dans la réponse HTML. Une prévention complète n'est toutefois pas possible, car il est au robot d'indexation de respecter cette demande.",
	"makeExplorable": "Rendre le compte visible sur la page \"Découvrir\".",
	"makeExplorableDescription": "Si vous désactivez cette option, votre compte n'apparaîtra pas sur la page \"Découvrir\".",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Verrouiller",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Rien",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Abonné·e·s",
	"private": "Privé",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 heure",
	"oneDay": "1 jour",
	"threeDays": "3 jours",
	"oneWeek": "1 semaine",
	"oneMonth": "Un mois",
	"threeMonths": "3 mois",
	"oneYear": "1 an",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Désactivé",
	"timeHour": "h",
	"timeDay": "j",
	"error": "Erreur",
	"cannotPerformTemporaryDescription": "Temporairement indisponible puisque le nombre d'opérations dépasse la limite. Veuillez patienter un peu, puis réessayer."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"privacy": "Privasi",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Permintaan mengikuti butuh persetujuan",
	"lockedAccountInfo": "Kecuali kamu menyetel visibilitas catatan milikmu ke \"Hanya pengikut\", catatan milikmu akan dapat dilihat oleh siapa saja, bahkan jika kamu memerlukan pengikut untuk disetujui secara manual.",
	"autoAcceptFollowed": "Setujui otomatis permintaan mengikuti dari pengguna yang anda ikuti",
	"makeReactionsPublic": "Tampilkan riwayat reaksi ke publik",
	"makeReactionsPublicDescription": "Pengaturan ini akan membuat daftar dari semua reaksi masa lalu kamu ditampilkan secara publik.",
	"followingVisibility": "Visibilitas mengikuti",
	"followersVisibility": "Visibilitas pengikut",
	"hideOnlineStatus": "Sembunyikan status daring",
	"hideOnlineStatusDescription": "Menyembunyikan status daring kamu akan mengurangi kenyamanan untuk beberapa fungsi, seperti contohnya pencarian.",
	"noCrawle": "Tolak pengindeksan perayap web",
	"noCrawleDescription": "Meminta mesin pencari untuk tidak mengindeks halaman profil kamu, catatan, Halaman, dll.",
	"preventAiLearning": "Tolak penggunaan Pembelajaran Mesin (AI Generatif)",
	"preventAiLearningDescription": "Minta perayap web untuk tidak menggunakan materi teks atau gambar yang telah diposting ke dalam set data Pembelajaran Mesin (Prediktif / Generatif). Hal ini dicapai dengan menambahkan flag HTML-Response \"noai\" ke masing-masing konten. Pencegahan penuh mungkin tidak dapat dicapai dengan flag ini, karena juga dapat diabaikan begitu saja.",
	"makeExplorable": "Buat akun tampil di \"Jelajahi\"",
	"makeExplorableDescription": "Jika kamu mematikan ini, akun kamu tidak akan muncul di menu \"Jelajahi\"",
	"directMessage": "Obrolan pengguna",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Kuncitara",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Tidak ada",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Penyesuaian",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Ketika fitur ini diaktifkan, hanya pengikut yang dapat melihat note sebelum tanggal dan waktu yang ditentukan atau telah terlihat untuk waktu tertentu. Setelah dinonaktifkan, status publikasi note juga akan dikembalikan seperti semula.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Saat fitur ini diaktifkan, note sebelum tanggal dan waktu tertentu hanya akan terlihat oleh anda. Setelah dinonaktifkan, status publikasi note juga akan dikembalikan seperti semula.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Publik",
	"followers": "Pengikut",
	"private": "Tersembunyi",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 Jam",
	"oneDay": "1 Hari",
	"threeDays": "3 hari",
	"oneWeek": "1 Bulan",
	"oneMonth": "satu bulan",
	"threeMonths": "3 bulan",
	"oneYear": "1 tahun",
	"acknowledgeNotesAndEnable": "Aktifkan setelah memahami catatan penting.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Nonaktif",
	"timeHour": "jam",
	"timeDay": "hari",
	"error": "Galat",
	"cannotPerformTemporaryDescription": "Aksi ini tidak dapat dilakukan sementara karena melewati batas eksekusi. Mohon tunggu sejenak dan coba lagi."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "Puoi configurare la privacy del tuo profilo, come la visibilità delle Note, la visibilità del profilo nelle ricerche e l'approvazione delle relazioni tra profili.",
	"makeFollowManuallyApprove": "Approva i follower manualmente",
	"lockedAccountInfo": "A meno che non imposti la visibilità delle tue note su \"Solo ai follower\", le tue note sono visibili da tutti, anche se hai configurato l'account per confermare manualmente le richieste di follow.",
	"autoAcceptFollowed": "Accetta automaticamente le richieste di follow da profili che già segui",
	"makeReactionsPublic": "Pubblicare la lista delle reazioni.",
	"makeReactionsPublicDescription": "La lista delle reazioni che avete fatto è a disposizione di tutti.",
	"followingVisibility": "Visibilità dei Following",
	"followersVisibility": "Visibilità dei profili che ti seguono",
	"hideOnlineStatus": "Modalità invisibile",
	"hideOnlineStatusDescription": "Attivando questa opzione potresti ridurre l'usabilità di alcune funzioni, come la ricerca.",
	"noCrawle": "Rifiuta l'indicizzazione dai robot.",
	"noCrawleDescription": "Richiedi che i motori di ricerca non indicizzino la tua pagina di profilo, le tue note, pagine, ecc.",
	"preventAiLearning": "Impedisci l'apprendimento della IA",
	"preventAiLearningDescription": "Aggiungendo il campo \"noai\" alla risposta HTML, si indica ai Robot esterni di non usare testi e allegati per addestrare sistemi di Machine Learning (IA predittiva/generativa). Anche se è impossibile sapere se la richiesta venga onorata o semplicemente ignorata.",
	"makeExplorable": "Profilo visibile pubblicamente nella pagina \"Esplora\"",
	"makeExplorableDescription": "Disabilitando questa opzione, il tuo profilo non verrà elencato nella pagina \"Esplora\".",
	"directMessage": "Chattare insieme",
	"chatChatNotAvailableForThisAccountOrServer": "Questo server, o questo profilo ha disabilitato la chat.",
	"chatChatAllowedUsers": "Persone ammesse alla chat",
	"chatChatAllowedUsers_note": "Puoi chattare con le persone a cui hai già inviato un messaggio, indipendentemente da questa impostazione.",
	"lockdown": "Isolamento",
	"accountSettingsRequireSigninToViewContents": "Per vedere il contenuto, è necessaria l'iscrizione",
	"accountSettingsRequireSigninToViewContentsDescription1": "Richiedere l'iscrizione per visualizzare tutte le Note e gli altri contenuti che hai creato. Probabilmente l'effetto è impedire la raccolta di informazioni da parte dei bot crawler.",
	"accountSettingsRequireSigninToViewContentsDescription2": "La visualizzazione verrà disabilitata a server che non supportano l'anteprima URL (OGP), all'incorporamento nelle pagine Web e alla citazione delle Note.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Rendi visibili solo ai Follower le Note pubblicate in precedenza",
	"none": "Nessuna",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Note antecedenti al periodo specificato",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Note antecedenti al momento specificato",
	"custom": "Personalizzato",
	"timeMonth": "Mese",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Mentre questa funzione è abilitata, le Note antecedenti al momento impostato, saranno visibili solo ai profili Follower. Disabilitandola nuovamente, verrà ripristinata anche la visibilità pubblica della Nota.",
	"accountSettingsMakeNotesHiddenBefore": "Nascondi le Note pubblicate in precedenza",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Mentre questa funzione è abilitata, le Note antecedenti al momento impostato, saranno visibili soltanto a te (private). Disabilitandola nuovamente, verrà ripristinata anche la visibilità pubblica della Nota.",
	"accountSettingsMayNotEffectSomeSituations": "Queste restrizioni sono semplificate. In alcuni casi, potrebbero anche non avvenire. Ad esempio visionando un server remoto o durante la moderazione.",
	"public": "Pubblica",
	"followers": "Follower",
	"private": "Privato",
	"chatChatAllowedUsersEveryone": "Chiunque",
	"chatChatAllowedUsersFollowers": "Solo i tuoi Follower",
	"chatChatAllowedUsersFollowing": "Solo i tuoi Follow",
	"chatChatAllowedUsersMutual": "Solo relazioni reciproche",
	"chatChatAllowedUsersNone": "Nessuno",
	"oneHour": "1 ora",
	"oneDay": "1 giorno",
	"threeDays": "3 giorni",
	"oneWeek": "1 settimana",
	"oneMonth": "Un mese",
	"threeMonths": "3 mesi",
	"oneYear": "1 anno",
	"acknowledgeNotesAndEnable": "Attivare dopo averne compreso il comportamento.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Inattivo",
	"timeHour": "ore",
	"timeDay": "giorni",
	"error": "Errore",
	"cannotPerformTemporaryDescription": "L'attività non può essere svolta, poiché si è raggiunto il limite di esecuzioni possibili. Per favore, riprova più tardi."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"privacy": "プライバシー",
	"settingsPrivacyBanner": "コンテンツの公開範囲、見つけやすさ、フォローの承認制などアカウントのプライバシーに関する設定を行えます。",
	"makeFollowManuallyApprove": "フォローを承認制にする",
	"lockedAccountInfo": "フォローを承認制にしても、ノートの公開範囲を「フォロワー」にしない限り、誰でもあなたのノートを見ることができます。",
	"autoAcceptFollowed": "フォロー中ユーザーからのフォロー申請を自動承認",
	"makeReactionsPublic": "リアクション一覧を公開する",
	"makeReactionsPublicDescription": "あなたがしたリアクション一覧を誰でも見れるようにします。",
	"followingVisibility": "フォローの公開範囲",
	"followersVisibility": "フォロワーの公開範囲",
	"hideOnlineStatus": "オンライン状態を隠す",
	"hideOnlineStatusDescription": "オンライン状態を隠すと、検索などの一部機能において利便性が低下することがあります。",
	"noCrawle": "クローラーによるインデックスを拒否",
	"noCrawleDescription": "外部の検索エンジンにあなたのユーザーページ、ノート、Pagesなどのコンテンツを登録(インデックス)しないよう要求します。",
	"preventAiLearning": "生成AIによる学習を拒否",
	"preventAiLearningDescription": "外部の文章生成AIや画像生成AIに対して、投稿したノートや画像などのコンテンツを学習の対象にしないように要求します。これはnoaiフラグをHTMLレスポンスに含めることによって実現されますが、この要求に従うかはそのAI次第であるため、学習を完全に防止するものではありません。",
	"makeExplorable": "アカウントを見つけやすくする",
	"makeExplorableDescription": "オフにすると、「みつける」にアカウントが載らなくなります。",
	"directMessage": "ダイレクトメッセージ",
	"chatChatNotAvailableForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは有効化されていません。",
	"chatChatAllowedUsers": "メッセージを許可する相手",
	"chatChatAllowedUsers_note": "自分からメッセージを送った相手とはこの設定に関わらずメッセージの送受信が可能です。",
	"lockdown": "ロックダウン",
	"accountSettingsRequireSigninToViewContents": "コンテンツの表示にログインを必須にする",
	"accountSettingsRequireSigninToViewContentsDescription1": "あなたが作成した全てのノートなどのコンテンツを表示するのにログインを必須にします。クローラーに情報が収集されるのを防ぐ効果が期待できます。",
	"accountSettingsRequireSigninToViewContentsDescription2": "URLプレビュー(OGP)、Webページへの埋め込み、ノートの引用に対応していないサーバーからの表示も不可になります。",
	"accountSettingsMakeNotesFollowersOnlyBefore": "過去のノートをフォロワーのみ表示可能にする",
	"none": "なし",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "指定した時間を経過しているノート",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "指定した日時より前のノート",
	"custom": "カスタム",
	"timeMonth": "ヶ月",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "この機能が有効になっている間、設定された日時より過去、または設定された時間を経過しているノートがフォロワーのみ表示可能になります。無効に戻すと、ノートの公開状態も元に戻ります。",
	"accountSettingsMakeNotesHiddenBefore": "過去のノートを非公開化する",
	"accountSettingsMakeNotesHiddenBeforeDescription": "この機能が有効になっている間、設定された日時より過去、または設定された時間を経過しているノートが自分のみ表示可能(非公開化)になります。無効に戻すと、ノートの公開状態も元に戻ります。",
	"accountSettingsMayNotEffectSomeSituations": "これらの制限は簡易的なものです。リモートサーバーでの閲覧やモデレーション時など、一部のシチュエーションでは適用されない場合があります。",
	"public": "パブリック",
	"followers": "フォロワー",
	"private": "非公開",
	"chatChatAllowedUsersEveryone": "誰でも",
	"chatChatAllowedUsersFollowers": "自分のフォロワーのみ",
	"chatChatAllowedUsersFollowing": "自分がフォローしているユーザーのみ",
	"chatChatAllowedUsersMutual": "相互フォローのユーザーのみ",
	"chatChatAllowedUsersNone": "誰も許可しない",
	"oneHour": "1時間",
	"oneDay": "1日",
	"threeDays": "3日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月",
	"threeMonths": "3ヶ月",
	"oneYear": "1年",
	"acknowledgeNotesAndEnable": "注意事項を理解した上でオンにします。",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "無効",
	"timeHour": "時間",
	"timeDay": "日",
	"error": "エラー",
	"cannotPerformTemporaryDescription": "操作回数が制限を超過するため一時的に利用できません。しばらく時間を置いてから再度お試しください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"privacy": "プライバシー",
	"settingsPrivacyBanner": "コンテンツの公開範囲、見つけやすさ、フォローの承認制とかアカウントのプライバシーに関わる設定ができるで。",
	"makeFollowManuallyApprove": "ええって言わなフォローできへんようにする",
	"lockedAccountInfo": "フォローを承認制にしとっても、ノートの公開範囲を「フォロワー」にせぇへん限り、誰でもあんたのノートを見れるで。",
	"autoAcceptFollowed": "フォローしとるユーザーからのフォローリクエストを勝手に許可しとく",
	"makeReactionsPublic": "ツッコミ一覧を公開するで",
	"makeReactionsPublicDescription": "あんたがしたツッコミ一覧を誰でも見れるようにするで。",
	"followingVisibility": "フォローの公開範囲",
	"followersVisibility": "フォロワーの公開範囲",
	"hideOnlineStatus": "オンライン状態を隠すで",
	"hideOnlineStatusDescription": "オンライン状態を隠すと、検索とかの一部の機能で使いにくくなるかもしれんよ。",
	"noCrawle": "クローラーによるインデックスを拒否するで",
	"noCrawleDescription": "検索エンジンにあんたのユーザーページ、ノート、Pagesとかのコンテンツを登録(インデックス)せんように頼むで。邪魔すんねんやったら帰って〜。",
	"preventAiLearning": "生成AIの学習に使わんといて",
	"preventAiLearningDescription": "他の文章生成AIとか画像生成AIに、投稿したノートとか画像なんかを勝手に使わんように頼むで。具体的にはnoaiフラグをHTMLレスポンスに含めるんやけど、これ聞いてくれるんはAIの気分次第やから、使われる可能性もちょっとはあるな。",
	"makeExplorable": "アカウントを見つけやすくするで",
	"makeExplorableDescription": "オフにすると、「みつける」にアカウントが載らんくなるで。",
	"directMessage": "チャットしよか",
	"chatChatNotAvailableForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが有効にされてへんで。",
	"chatChatAllowedUsers": "チャットしてもええ相手",
	"chatChatAllowedUsers_note": "自分からチャットメッセージを送った相手やったらこの設定に関わらずチャットできるで。",
	"lockdown": "ロックダウン",
	"accountSettingsRequireSigninToViewContents": "ログインしてもらってからコンテンツ見てもらう",
	"accountSettingsRequireSigninToViewContentsDescription1": "あなたが作成した全部のノートとかのコンテンツを見れるようにするのにログインがいるようにするで。クローラーにいろいろ収集されるんを防げるかもしれん。",
	"accountSettingsRequireSigninToViewContentsDescription2": "URLプレビュー(OGP)、Webページへの埋め込み、ノートの引用に対応してないサーバーからの表示ができんくなるで。",
	"accountSettingsMakeNotesFollowersOnlyBefore": "昔のノートをフォロワーだけに見てもらう",
	"none": "なし",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "決めた時間が経ったノート",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "決めた日時より前のノート",
	"custom": "カスタム",
	"timeMonth": "ヶ月",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "この機能が有効になってる間は、設定された日時より前、それか設定された時間が経ったノートがフォロワーのみ見れるようになるで。無効に戻すと、ノートの公開状態も戻るで。",
	"accountSettingsMakeNotesHiddenBefore": "昔のノートを見れんようにする",
	"accountSettingsMakeNotesHiddenBeforeDescription": "この機能が有効になってる間は、設定された日時より前、それか設定された時間が経ったノートがあんただけ見れるようになるで。無効に戻すと、ノートの公開状態も戻るで。",
	"accountSettingsMayNotEffectSomeSituations": "これらの制限は簡易的なものやで。リモートサーバーでの閲覧とかモデレーション時とか、一部のシチュエーションでは適用されへんかもしれん。",
	"public": "パブリック",
	"followers": "フォロワー",
	"private": "非公開",
	"chatChatAllowedUsersEveryone": "誰でも",
	"chatChatAllowedUsersFollowers": "自分のフォロワーだけ",
	"chatChatAllowedUsersFollowing": "自分がフォローしとるユーザーだけ",
	"chatChatAllowedUsersMutual": "相互フォローのユーザーだけ",
	"chatChatAllowedUsersNone": "誰もかもあかん",
	"oneHour": "1時間",
	"oneDay": "1日",
	"threeDays": "3日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月",
	"threeMonths": "3ヶ月",
	"oneYear": "1年",
	"acknowledgeNotesAndEnable": "注意事項をわかった上でオンにする。",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "無効",
	"timeHour": "時間",
	"timeDay": "日",
	"error": "おかしなったで",
	"cannotPerformTemporaryDescription": "操作し過ぎてちょっと今は使えへんくしとるで。ちょっと待ってからもっかいやってや。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"privacy": "Tabaḍnit",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Make account visible in \"Explore\"",
	"makeExplorableDescription": "If you turn this off, your account will not show up in the \"Explore\" section.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "None",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Imeḍfaṛen",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 days",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Make account visible in \"Explore\"",
	"makeExplorableDescription": "If you turn this off, your account will not show up in the \"Explore\" section.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "None",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Followers",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 days",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"privacy": "프라이버시",
	"settingsPrivacyBanner": "컨텐츠, 계정의 발견 범위, 팔로우 승인제 등의 계정의 프라이버시에 관한 설정을 합니다.",
	"makeFollowManuallyApprove": "팔로우를 수동으로 승인",
	"lockedAccountInfo": "팔로우를 승인으로 승인받더라도 노트의 공개 범위를 '팔로워'로 하지 않는 한 누구나 당신의 노트를 볼 수 있습니다.",
	"autoAcceptFollowed": "팔로우 중인 유저로부터의 팔로우 요청을 자동 수락",
	"makeReactionsPublic": "리액션 목록을 공개하기",
	"makeReactionsPublicDescription": "나의 리액션을 누구나 볼 수 있게 합니다.",
	"followingVisibility": "팔로우의 공개 범위",
	"followersVisibility": "팔로워의 공개 범위",
	"hideOnlineStatus": "온라인 상태 숨기기",
	"hideOnlineStatusDescription": "온라인 상태를 숨기면, 검색과 같은 일부 기능에 영향을 미칠 수 있습니다.",
	"noCrawle": "검색엔진의 인덱싱 거부",
	"noCrawleDescription": "검색엔진에 유저 페이지, 노트, 페이지 등의 콘텐츠를 인덱싱되지 않게 합니다.",
	"preventAiLearning": "기계학습(생성형 AI)으로의 사용을 거부",
	"preventAiLearningDescription": "외부의 문장 생성 AI나 이미지 생성 AI에 대해 제출한 노트나 이미지 등의 콘텐츠를 학습의 대상으로 사용하지 않도록 요구합니다. 다만, 이 요구사항을 지킬 의무는 없기 때문에 학습을 완전히 방지하는 것은 아닙니다.",
	"makeExplorable": "계정을 쉽게 발견하도록 하기",
	"makeExplorableDescription": "비활성화하면 \"발견하기\"에 나의 계정을 표시하지 않습니다.",
	"directMessage": "채팅하기",
	"chatChatNotAvailableForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅이 활성화되어 있지 않습니다.",
	"chatChatAllowedUsers": "채팅을 허용한 상대",
	"chatChatAllowedUsers_note": "내가 채팅 메시지를 보낸 상대와는 이 설정과 상관없이 채팅이 가능합니다.",
	"lockdown": "잠금",
	"accountSettingsRequireSigninToViewContents": "콘텐츠 열람을 위해 로그인을 필수로 설정하기",
	"accountSettingsRequireSigninToViewContentsDescription1": "자신이 작성한 모든 노트 등의 콘텐츠를 보기 위해 로그인을 필수로 설정합니다. 크롤러가 정보 수집하는 것을 방지하는 효과를 기대할 수 있습니다.",
	"accountSettingsRequireSigninToViewContentsDescription2": "URL 미리보기(OGP), 웹페이지에 삽입, 노트 인용을 지원하지 않는 서버에서 볼 수 없게 됩니다.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "과거 노트는 팔로워만 볼 수 있도록 설정하기",
	"none": "없음",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "지정한 시간이 경과된 노트",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "지정된 날짜 및 시간 이전의 노트",
	"custom": "커스텀",
	"timeMonth": "개월",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "이 기능이 활성화되어 있는 동안, 설정된 날짜 및 시간보다 과거 또는 설정된 시간이 지난 노트는 팔로워만 볼 수 있게 됩니다. 비활성화하면 노트의 공개 상태도 원래대로 돌아갑니다.",
	"accountSettingsMakeNotesHiddenBefore": "과거 노트 비공개로 전환하기",
	"accountSettingsMakeNotesHiddenBeforeDescription": "이 기능이 활성화되어 있는 동안 설정한 날짜 및 시간보다 과거 또는 설정한 시간이 지난 노트는 본인만 볼 수 있게(비공개로 전환) 됩니다. 비활성화하면 노트의 공개 상태도 원래대로 돌아갑니다.",
	"accountSettingsMayNotEffectSomeSituations": "여기서 설정하는 제한은 모더레이션이나 리모트 서버에서 볼 때 등 일부 환경에서는 적용되지 않을 수도 있습니다.",
	"public": "공개",
	"followers": "팔로워",
	"private": "비공개",
	"chatChatAllowedUsersEveryone": "누구나",
	"chatChatAllowedUsersFollowers": "자신의 팔로워만",
	"chatChatAllowedUsersFollowing": "자신이 팔로우한 유저만",
	"chatChatAllowedUsersMutual": "상호 팔로우한 유저만",
	"chatChatAllowedUsersNone": "아무도 허락하지 않기",
	"oneHour": "1시간",
	"oneDay": "1일",
	"threeDays": "3일",
	"oneWeek": "일주일",
	"oneMonth": "1개월",
	"threeMonths": "3개월",
	"oneYear": "1년",
	"acknowledgeNotesAndEnable": "활성화 하기 전에 주의 사항을 확인했습니다.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "비활성화",
	"timeHour": "시간",
	"timeDay": "일",
	"error": "오류",
	"cannotPerformTemporaryDescription": "조작 횟수 제한을 초과하여 일시적으로 사용이 불가합니다. 잠시 후 다시 시도해 주세요."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Volgverzoeken vergen een goedkeuring",
	"lockedAccountInfo": "Tenzij je de zichtbaarheid van je notities instelt op “Alleen volgers”, zijn je notities zichtbaar voor iedereen, zelfs als je vereist dat volgers handmatig worden goedgekeurd.",
	"autoAcceptFollowed": "Accepteer verzoeken om jezelf te volgen vanzelf als je de verzoeker al volgt.",
	"makeReactionsPublic": "Reactiegeschiedenis publiceren",
	"makeReactionsPublicDescription": "Hierdoor wordt de lijst met al je eerdere reacties openbaar.",
	"followingVisibility": "Zichtbaarheid van gevolgden",
	"followersVisibility": "Zichtbaarheid van volgers",
	"hideOnlineStatus": "Online status verbergen",
	"hideOnlineStatusDescription": "Het verbergen van je online status vermindert het nut van functies zoals zoeken.",
	"noCrawle": "Crawler-indexering verwerpen",
	"noCrawleDescription": "Vraag zoekmachines om je eigen profielpagina, notities, pagina's, enz. niet te indexeren.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Gebruikersaccount zichtbaar maken in “Verkennen”",
	"makeExplorableDescription": "Als deze optie is uitgeschakeld, is uw gebruikersaccount niet zichtbaar in het gedeelte “Verkennen”.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Niets",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Openbare",
	"followers": "Volgers",
	"private": "Privé",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 dagen",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 maanden",
	"oneYear": "1 jaar",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Uitgeschakeld",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Fout",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"privacy": "Personvern",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Gjør konto synlig i \"Utforsk\"",
	"makeExplorableDescription": "Hvis du slår av dette, vises ikke kontoen din i \"Utforsk\" delen.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Ingen",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Følgere",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 time",
	"oneDay": "1 dag",
	"threeDays": "3 days",
	"oneWeek": "1 uke",
	"oneMonth": "1 måned",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Timer",
	"timeDay": "Dager",
	"error": "Feil",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"privacy": "Prywatność",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Prośby o możliwość obserwacji wymagają zatwierdzenia",
	"lockedAccountInfo": "Dopóki nie ustawisz widoczności wpisu na \"Obserwujący\", twoje wpisy będą mogli widzieć wszyscy, nawet jeśli ustawisz manualne zatwierdzanie obserwujących.",
	"autoAcceptFollowed": "Automatycznie przyjmuj prośby o możliwość obserwacji od użytkowników, których obserwujesz",
	"makeReactionsPublic": "Ustawić historię reakcji jako publiczną",
	"makeReactionsPublicDescription": "To spowoduje, że lista wszystkich Twoich dotychczasowych reakcji będzie publicznie widoczna.",
	"followingVisibility": "Widoczność obserwacji",
	"followersVisibility": "Widoczność obserwujących",
	"hideOnlineStatus": "Ukryj status online",
	"hideOnlineStatusDescription": "Ukrywanie statusu online ogranicza wygody niektórych funkcji, tj. wyszukiwanie",
	"noCrawle": "Odrzuć indeksowanie przez crawlery",
	"noCrawleDescription": "Proś wyszukiwarki internetowe, aby nie indeksowały Twojego profilu, wpisów, stron itd.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Pokazuj konto na stronie „Eksploruj”",
	"makeExplorableDescription": "Jeżeli wyłączysz tę opcję, Twoje konto nie będzie wyświetlać się w sekcji „Eksploruj”.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Brak",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Publiczny",
	"followers": "Obserwujący",
	"private": "Prywatne",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 godzina",
	"oneDay": "1 dzień",
	"threeDays": "3 dni",
	"oneWeek": "1 tydzień",
	"oneMonth": "jeden miesiąc",
	"threeMonths": "3 miesiące",
	"oneYear": "Rok",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Wyłączono",
	"timeHour": "godz.",
	"timeDay": "dzień",
	"error": "Błąd",
	"cannotPerformTemporaryDescription": "Ta akcja nie może zostać wykonana, z powodu przekroczenia limitu wykonań. Prosimy poczekać chwilę i spróbować ponownie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"privacy": "Privacidade",
	"settingsPrivacyBanner": "Você pode configurar a privacidade da conta por meio da visibilidade do conteúdo, capacidade de descoberta e aprovação manual de seguidores.",
	"makeFollowManuallyApprove": "Pedidos de seguidores precisam ser aprovados",
	"lockedAccountInfo": "Mesmo que você defina a aprovação para seguir, a menos que você defina o alcance da nota para 'Apenas seguidores', qualquer pessoa poderá ver suas notas.",
	"autoAcceptFollowed": "Aprove automaticamente os seguidores dos seguintes utilizadores",
	"makeReactionsPublic": "Deixar o histórico de reações em Público",
	"makeReactionsPublicDescription": "Isto vai deixar o histórico de todas as suas reações visíveis para qualquer um ver.",
	"followingVisibility": "Visibilidade dos usuários seguidos",
	"followersVisibility": "Visibilidade dos seguidores",
	"hideOnlineStatus": "Ocultar o status on-line.",
	"hideOnlineStatusDescription": "Esconder que está Ativo reduzirá a utilidade de certas funções (como, por exemplo, a Pesquisa).",
	"noCrawle": "Recusar indexação por crawler",
	"noCrawleDescription": "Solicitar que os mecanismos de pesquisa externos não indexem o conteúdo de suas páginas de usuário, notas, páginas etc.",
	"preventAiLearning": "Rejeitar uso de Aprendizado de Máquina (IA Generativa)",
	"preventAiLearningDescription": "Solicita-se que o conteúdo de notas e imagens enviadas não seja usado como objeto de aprendizado por sistemas externos de geração de texto ou imagens. Isso é alcançado incluindo a flag 'noai' na resposta HTML. No entanto, o cumprimento dessa solicitação depende do próprio sistema de IA, portanto, não é garantia total de prevenção de aprendizado.",
	"makeExplorable": "Deixe a sua conta encontrável em \"Explorar\".",
	"makeExplorableDescription": "Se você desativá-lo, outros usuários não poderão encontrar a sua conta na aba Descoberta.",
	"directMessage": "Conversar com usuário",
	"chatChatNotAvailableForThisAccountOrServer": "Conversas não estão habilitadas nesse servidor ou para essa conta.",
	"chatChatAllowedUsers": "Com quem permitir conversas",
	"chatChatAllowedUsers_note": "Você pode conversar com qualquer um com quem tenha iniciado uma conversa independente dessa configuração.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Exigir cadastro para ver o conteúdo",
	"accountSettingsRequireSigninToViewContentsDescription1": "Exigir cadastro para ver todas as notas e outro conteúdo que você criou. Isso previne 'crawlers' de coletar os seus dados.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Conteúdo não será exibido nas prévias de URL (OGP), incorporado em outras páginas web ou em servidores que não têm suporte a citações.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Tornar notas passadas visíveis apenas para seguidores.",
	"none": "Nenhum",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notas que duraram um tempo específico.",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notas antes do tempo específico.",
	"custom": "Personalizado",
	"timeMonth": "Mês(es)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Com essa função ativada, apenas seguidores podem ver as notas anteriores à data e hora marcadas. Se isso for desativado, o status de publicação da nota será reestabelecido.",
	"accountSettingsMakeNotesHiddenBefore": "Tornar notas passadas privadas",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Com essa função ativada, apenas você poderá ver as notas anteriores à data e hora marcadas. Se isso for desativado, o status de publicação da nota será reestabelecido.",
	"accountSettingsMayNotEffectSomeSituations": "Essas restrições são simplificadas. Elas podem não ser aplicadas em algumas situações, como ao visualizar num servidor remoto ou durante a moderação.",
	"public": "Público",
	"followers": "Seguidores",
	"private": "Privado",
	"chatChatAllowedUsersEveryone": "Todos",
	"chatChatAllowedUsersFollowers": "Seus seguidores",
	"chatChatAllowedUsersFollowing": "Quem você segue",
	"chatChatAllowedUsersMutual": "Seguidores mútuos",
	"chatChatAllowedUsersNone": "Ninguém",
	"oneHour": "1 hora",
	"oneDay": "1 dia",
	"threeDays": "3 dias",
	"oneWeek": "1 semana",
	"oneMonth": "1 mês",
	"threeMonths": "3 meses",
	"oneYear": "1 ano",
	"acknowledgeNotesAndEnable": "Ative após compreender as precauções.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Desativado",
	"timeHour": "Hora(s)",
	"timeDay": "Dia(s)",
	"error": "Erro",
	"cannotPerformTemporaryDescription": "Esta ação não pôde ser concluída devido ao excesso de pedidos em sucessão. Tente novamente em alguns momentos."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"privacy": "Конфиденциальность",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Принимать подписчиков вручную",
	"lockedAccountInfo": "Даже если вы вручную подтверждаете подписки, кто угодно может читать ваши заметки, если вы не отмечаете их «для подписчиков».",
	"autoAcceptFollowed": "Принимать подписчиков автоматически",
	"makeReactionsPublic": "Опубликовать список реакций",
	"makeReactionsPublicDescription": "Список сделанных вами реакций доступен для просмотра всем желающим.",
	"followingVisibility": "Видимость подписок",
	"followersVisibility": "Видимость подписчиков",
	"hideOnlineStatus": "Скрыть присутствие",
	"hideOnlineStatusDescription": "Сокрытие присутствия делает некоторые функции, такие как поиск, менее удобными.",
	"noCrawle": "Запретить паукам индексировать сайт",
	"noCrawleDescription": "Просьба поисковым системам не ходить по вашему профилю, по заметкам, страницам и не индексировать их.",
	"preventAiLearning": "Отказаться от использования в машинном обучении (Генеративный ИИ)",
	"preventAiLearningDescription": "Запросить краулеров не использовать опубликованный текст или изображения и т.д. для машинного обучения (Прогнозирующий / Генеративный ИИ) датасетов. Это достигается путём добавления \"noai\" HTTP-заголовка в ответ на соответствующий контент. Полного предотвращения через этот заголовок не избежать, так как он может быть просто проигнорирован.",
	"makeExplorable": "Опубликовать профиль в «Обзоре».",
	"makeExplorableDescription": "Если выключить, ваш профиль не будет показан в разделе «Обзор».",
	"directMessage": "Личные сообщения",
	"chatChatNotAvailableForThisAccountOrServer": "Личные сообщения выключены для этого аккаунта или на этом сервере.",
	"chatChatAllowedUsers": "Кому разрешить присылать личные сообщения",
	"chatChatAllowedUsers_note": "Вы можете общаться с теми кому вы уже отправили хоть одно сообщение вне зависимости от этой настройки.",
	"lockdown": "Доступ ограничен",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Требовать входа в аккаунт для просмотра заметок и прочего вашего контента. Это не позволит ботам сканировать вашу информацию.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Ничего",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Заметки после указанной даты",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Заметки до указанной даты",
	"custom": "Пользовательские",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Общедоступно",
	"followers": "Подписчики",
	"private": "Личное",
	"chatChatAllowedUsersEveryone": "Всем",
	"chatChatAllowedUsersFollowers": "Только подписчикам",
	"chatChatAllowedUsersFollowing": "Только тем на кого вы подписаны",
	"chatChatAllowedUsersMutual": "Только взаимным подписчикам",
	"chatChatAllowedUsersNone": "Никому",
	"oneHour": "1 час",
	"oneDay": "1 день",
	"threeDays": "3 дня",
	"oneWeek": "1 неделя",
	"oneMonth": "1 месяц",
	"threeMonths": "3 месяца",
	"oneYear": "1 год",
	"acknowledgeNotesAndEnable": "Включайте только после понимания мер предосторожности",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Откл.",
	"timeHour": "ч",
	"timeDay": "сут",
	"error": "Ошибка",
	"cannotPerformTemporaryDescription": "Это действие временно невозможно выполнить из-за превышения лимита выполнения."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"privacy": "Súkromie",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Žiadosti o sledovanie treba schváliť",
	"lockedAccountInfo": "Pokým nenastavíte viditeľnosť poznámok na \"Len pre sledujúcich\", vaše príspevky bude vidieť hocikto, aj keď vyžadujete manuálne potvrdenie sledovania.",
	"autoAcceptFollowed": "Automaticky prijať sledovanie od účtov, ktoré sledujete",
	"makeReactionsPublic": "Reakcie sú verejné",
	"makeReactionsPublicDescription": "Toto spraví všetky vaše minulé reakcie viditeľné verejnosti.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Skryť online status",
	"hideOnlineStatusDescription": "Skrytie vášho online statusu zníži pohodlnosť niektorých funkcií ako napríklad vyhľadávanie.",
	"noCrawle": "Odmietať indexovanie crawlerov",
	"noCrawleDescription": "Požiadať vyhľadávače, aby neindexovali váš profil, poznámky, stránky, atď.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Spraviť účet viditeľný v \"Objavovať\"",
	"makeExplorableDescription": "Ak toto vypnete, váš účet sa nezobrazí v sekcii \"Objavovat\".",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Žiadne",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Verejné",
	"followers": "Sledujúci",
	"private": "Súkromné",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 hodina",
	"oneDay": "1 deň",
	"threeDays": "3 days",
	"oneWeek": "1 týždeň",
	"oneMonth": "1 mesiac",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Vypnuté",
	"timeHour": "hod",
	"timeDay": "dní",
	"error": "Chyba",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"privacy": "ความเป็นส่วนตัว",
	"settingsPrivacyBanner": "สามารถตั้งค่าความเป็นส่วนตัวของบัญชี เช่น ขอบเขตการเผยแพร่เนื้อหา ความสามารถในการค้นหา และการอนุมัติผู้ติดตาม",
	"makeFollowManuallyApprove": "อนุมัติคำขอติดตามด้วยตนเอง",
	"lockedAccountInfo": "แม้ว่าการอนุมัติการติดตามถูกเปิดใช้งานอยู่ทุกคนก็ยังคงสามารถเห็นโน้ตของคุณได้ เว้นแต่ว่าคุณจะเปลี่ยนการเปิดเผยโน้ตของคุณเป็น  “เฉพาะผู้ติดตาม”",
	"autoAcceptFollowed": "อนุมัติคำขอติดตามจากผู้ใช้ที่คุณติดตามอยู่โดยอัตโนมัติ",
	"makeReactionsPublic": "ตั้งค่าประวัติการรีแอคชั่นเป็นสาธารณะ",
	"makeReactionsPublicDescription": "การทำเช่นนี้จะทำให้รายการรีแอคชั่นของคุณที่ผ่านมาทั้งหมดปรากฏต่อสาธารณะ",
	"followingVisibility": "การมองเห็นที่เรากำลังติดตาม",
	"followersVisibility": "การมองเห็นผู้ที่กำลังติดตามเรา",
	"hideOnlineStatus": "ซ่อนสถานะออนไลน์",
	"hideOnlineStatusDescription": "การซ่อนสถานะออนไลน์อาจทำให้ฟังก์ชันบางอย่าง เช่น การค้นหา สะดวกน้อยลง",
	"noCrawle": "ปฏิเสธการจัดทำดัชนีของ Crawler (โปรแกรมรวบรวมข้อมูล)",
	"noCrawleDescription": "ขอให้เครื่องมือค้นหาไม่จัดทำดัชนีหน้าโปรไฟล์ โน้ต หน้าเพจ ฯลฯ",
	"preventAiLearning": "ปฏิเสธการเรียนรู้ด้วย generative AI",
	"preventAiLearningDescription": "ส่งคำร้องขอไม่ให้ใช้ ข้อความในโน้ตที่โพสต์, หรือเนื้อหารูปภาพ ฯลฯ ในการเรียนรู้ของเครื่อง(machine learning) / Predictive AI / Generative AI โดยการเพิ่มแฟล็ก “noai” ลง HTML-Response ให้กับเนื้อหาที่เกี่ยวข้อง แต่ทั้งนี้ ไม่ได้ป้องกัน AI จากการเรียนรู้ได้อย่างสมบูรณ์ เนื่องจากมี AI บางตัวเท่านั้นที่จะเคารพคำขอดังกล่าว",
	"makeExplorable": "ทำให้บัญชีมองเห็นใน “สำรวจ”",
	"makeExplorableDescription": "ถ้าหากคุณปิดการทำงานนี้ บัญชีของคุณนั้นจะไม่แสดงในส่วน “สำรวจ”",
	"directMessage": "แชตเลย",
	"chatChatNotAvailableForThisAccountOrServer": "แชตไม่ได้เปิดใช้งานบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้",
	"chatChatAllowedUsers": "ผู้ที่อนุญาตให้แชตด้วย",
	"chatChatAllowedUsers_note": "ไม่ว่าจะตั้งค่ายังไง คุณยังสามารถแชตกับคนที่คุณส่งข้อความไปหาได้",
	"lockdown": "ล็อกดาวน์",
	"accountSettingsRequireSigninToViewContents": "ต้องเข้าสู่ระบบเพื่อดูเนื้อหา",
	"accountSettingsRequireSigninToViewContentsDescription1": "กำหนดให้ต้องเข้าสู่ระบบก่อนจึงจะสามารถดูโน้ตหรือเนื้อหาทั้งหมดที่สร้างไว้ได้ ซึ่งช่วยป้องกันไม่ให้ข้อมูลถูกเก็บโดยบอตหรือ Crawler (โปรแกรมรวบรวมข้อมูล)",
	"accountSettingsRequireSigninToViewContentsDescription2": "จะไม่สามารถแสดงผลจากเซิร์ฟเวอร์ที่ไม่รองรับการแสดงตัวอย่าง URL (OGP), การฝังในหน้าเว็บ, หรือการอ้างอิงโน้ตได้",
	"accountSettingsMakeNotesFollowersOnlyBefore": "แสดงโน้ตเก่าเฉพาะกับผู้ติดตามเท่านั้น",
	"none": "ไม่มี",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "โน้ตที่เลยเวลาที่กำหนดไว้แล้ว",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "โน้ตก่อนเวลาที่กำหนดไว้",
	"custom": "แบบกำหนดเอง",
	"timeMonth": "เดือน",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "ขณะที่เปิดฟังก์ชันนี้ โน้ตที่เก่ากว่าหรือเลยเวลาที่กำหนดจะแสดงเฉพาะกับผู้ติดตามเท่านั้น หากปิดใช้งาน สถานะการเปิดเผยจะกลับไปเป็นแบบเดิม",
	"accountSettingsMakeNotesHiddenBefore": "ทำให้โน้ตเก่าทั้งหมดเป็นแบบส่วนตัว",
	"accountSettingsMakeNotesHiddenBeforeDescription": "ขณะที่เปิดฟังก์ชันนี้ โน้ตที่เก่ากว่าหรือเลยเวลาที่กำหนดจะแสดงเฉพาะกับตนเอง (กลายเป็นแบบส่วนตัว) หากปิดใช้งาน สถานะการเปิดเผยจะกลับไปเป็นแบบเดิม",
	"accountSettingsMayNotEffectSomeSituations": "ข้อจำกัดเหล่านี้เป็นเพียงการกรองเบื้องต้น ในบางกรณี เช่น การดูจากเซิร์ฟเวอร์อื่นหรือในระหว่างการตรวจสอบโดยผู้ดูแล อาจไม่สามารถใช้งานได้",
	"public": "สาธารณะ",
	"followers": "ผู้ติดตาม",
	"private": "ส่วนตัว",
	"chatChatAllowedUsersEveryone": "ใครก็ได้หมด",
	"chatChatAllowedUsersFollowers": "เฉพาะผู้ติดตามเท่านั้น",
	"chatChatAllowedUsersFollowing": "เฉพาะผู้ที่ตัวเองติดตามเท่านั้น",
	"chatChatAllowedUsersMutual": "เฉพาะผู้ใช้ที่ติดตามซึ่งกันและกันทั้งสองฝ่ายเท่านั้น",
	"chatChatAllowedUsersNone": "ไม่อนุญาตให้ใครเลย",
	"oneHour": "1 ชั่วโมง",
	"oneDay": "1 วัน",
	"threeDays": "3 วัน",
	"oneWeek": "1 สัปดาห์",
	"oneMonth": "หนึ่งเดือน",
	"threeMonths": "3 เดือน",
	"oneYear": "1 ปี",
	"acknowledgeNotesAndEnable": "เปิดใช้งานหลังจากที่เข้าใจข้อควรระวังแล้ว",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "ปิดการใช้งาน",
	"timeHour": "ชั่วโมง",
	"timeDay": "วัน",
	"error": "ผิดพลาด!",
	"cannotPerformTemporaryDescription": "ไม่สามารถดําเนินการได้ชั่วคราว เนื่องจากเกินขีดจํากัดการดําเนินการ กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"privacy": "Gizlilik",
	"settingsPrivacyBanner": "Hesap gizliliği ile ilgili ayarları, örneğin içerik görünürlüğü, bulunabilirlik ve takip onayı gibi ayarları yapılandırabilirsin.",
	"makeFollowManuallyApprove": "Takip istekleri onay gerektirir",
	"lockedAccountInfo": "Notunuzun görünürlüğünü “Yalnızca takipçiler” olarak ayarlamadığınız sürece, takipçilerin manuel olarak onaylanmasını gerektirse bile notlarınız herkes tarafından görülebilir.",
	"autoAcceptFollowed": "Takip edilen hesapların takip isteklerini kabul et",
	"makeReactionsPublic": "Tepki geçmişini herkese açık olarak ayarla",
	"makeReactionsPublicDescription": "Bu, geçmişteki tüm tepkilerinin listesini herkese açık hale getirecek.",
	"followingVisibility": "Takip edilenlerin görünürlüğü",
	"followersVisibility": "Takipçilerin görünürlüğü",
	"hideOnlineStatus": "Çevrimiçi durumunu gizle",
	"hideOnlineStatusDescription": "Çevrimiçi durumunuzu gizlemek, arama gibi bazı özelliklerin kullanışlılığını azaltır.",
	"noCrawle": "Tarayıcı indekslemesini reddet",
	"noCrawleDescription": "Arama motorlarından profilinde, notlarında, sayfalarında  vb. dolaşılmamasını ve dizine eklememesini talep et.",
	"preventAiLearning": "Makine Öğreniminde (Üretken Ai) kullanımını reddet",
	"preventAiLearningDescription": "Tarayıcılardan, makine öğrenimi (Tahminsel / Üretken Ai) veri kümelerinde yayınlanan metin veya görsel materyalleri vb. kullanmamalarını talep eder. Bu, ilgili içeriğe “noai” HTML-Response bayrağı eklenerek gerçekleştirilir. Ancak, bu bayrakla tam bir önleme sağlanamaz, çünkü bu bayrak basitçe göz ardı edilebilir.",
	"makeExplorable": "Hesabı “Keşfet” bölümünde görünür hale getir",
	"makeExplorableDescription": "Bunu kapatırsanız, hesabınız “Keşfet” bölümünde görünmez.",
	"directMessage": "Kullanıcıyla sohbet et",
	"chatChatNotAvailableForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet özelliği etkin değildir.",
	"chatChatAllowedUsers": "Sohbet etmesine izin verilecek kişiler",
	"chatChatAllowedUsers_note": "Bu ayardan bağımsız olarak, sohbet mesajı gönderdiğin herkesle sohbet edebilirsin.",
	"lockdown": "Karantina",
	"accountSettingsRequireSigninToViewContents": "İçeriği görüntülemek için oturum açmanız gerekir.",
	"accountSettingsRequireSigninToViewContentsDescription1": "Oluşturduğun tüm notları ve diğer içeriği görüntülemek için oturum açman gerekir. Bu, tarayıcıların bilgilerini toplamasına engel olacaktır.",
	"accountSettingsRequireSigninToViewContentsDescription2": "İçerik, URL önizlemelerinde (OGP), web sayfalarına gömülü olarak veya not alıntıları desteklemeyen sunucularda görüntülenmeyecek.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Geçmiş notların yalnızca takipçilere gösterilmesini sağlayın",
	"none": "Hiçbiri",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Belirtilen sürenin geçtiğini unutmayın.",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Belirtilen tarih ve saatten önceki notlar",
	"custom": "Özel",
	"timeMonth": "Ay",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Bu özellik etkinleştirildiğinde, yalnızca takipçiler belirlenen tarih ve saatten sonra veya belirlenen süre boyunca görünür olan notları görebilir. Bu özellik devre dışı bırakıldığında, notun yayın durumu da geri yüklenir.",
	"accountSettingsMakeNotesHiddenBefore": "Geçmiş notları gizli yap",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Bu özellik etkinleştirildiğinde, belirlenen tarih ve saatten geçmiş olan veya yalnızca sizin görebildiğiniz notlar. Bu özellik devre dışı bırakıldığında, notun yayın durumu da geri yüklenecek.",
	"accountSettingsMayNotEffectSomeSituations": "Bu kısıtlamalar basitleştirilmiştir. Uzaktaki bir sunucuda görüntüleme veya moderasyon sırasında gibi bazı durumlarda geçerli olmayabilir.",
	"public": "Herkese açık",
	"followers": "Takipçi",
	"private": "Özel",
	"chatChatAllowedUsersEveryone": "Herkes",
	"chatChatAllowedUsersFollowers": "Sadece takipçilerin",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Sadece takiplerin",
	"chatChatAllowedUsersNone": "Kimse",
	"oneHour": "1 saat",
	"oneDay": "1 gün",
	"threeDays": "3 gün",
	"oneWeek": "1 hafta",
	"oneMonth": "1 ay",
	"threeMonths": "3 ay",
	"oneYear": "1 yıl",
	"acknowledgeNotesAndEnable": "Önlemleri anladıktan sonra açın.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Devre Dışı",
	"timeHour": "Saat(ler)",
	"timeDay": "Gün(ler)",
	"error": "Hata",
	"cannotPerformTemporaryDescription": "Bu işlem, yürütme sınırını aştığı için geçici olarak gerçekleştirilememekte. Lütfen bir süre bekle ve tekrar dene."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"privacy": "Privacy",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Follow requests require approval",
	"lockedAccountInfo": "Unless you set your note visiblity to \"Followers only\", your notes will be visible to anyone, even if you require followers to be manually approved.",
	"autoAcceptFollowed": "Automatically approve follow requests from users you're following",
	"makeReactionsPublic": "Set reaction history to public",
	"makeReactionsPublicDescription": "This will make the list of all your past reactions publicly visible.",
	"followingVisibility": "Visibility of follows",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Hide online status",
	"hideOnlineStatusDescription": "Hiding your online status reduces the convenience of some features such as the search.",
	"noCrawle": "Reject crawler indexing",
	"noCrawleDescription": "Ask search engines to not index your profile page, notes, Pages, etc.",
	"preventAiLearning": "Reject usage in Machine Learning (Generative AI)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Make account visible in \"Explore\"",
	"makeExplorableDescription": "If you turn this off, your account will not show up in the \"Explore\" section.",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Require sign-in to view contents",
	"accountSettingsRequireSigninToViewContentsDescription1": "Require login to view all notes and other content you have created. This will have the effect of preventing crawlers from collecting your information.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "None",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Public",
	"followers": "Followers",
	"private": "Private",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "One hour",
	"oneDay": "One day",
	"threeDays": "3 days",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"threeMonths": "3 months",
	"oneYear": "1 year",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Disabled",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)",
	"error": "Error",
	"cannotPerformTemporaryDescription": "This action cannot be performed temporarily due to exceeding the execution limit. Please wait for a while and then try again."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"privacy": "Конфіденційність",
	"settingsPrivacyBanner": "Ви можете змінювати налаштування, пов'язані з конфіденційністю облікового запису, такі як видимість змісту, виявність, та підтвердження підписок.",
	"makeFollowManuallyApprove": "Підтверджувати підписників уручну",
	"lockedAccountInfo": "Якщо видимість вашого запису не встановлена як \"Тільки підписники\", то кожен зможе побачити ваш запис, навіть якщо ви вимагаєте підтвердження підписок вручну.",
	"autoAcceptFollowed": "Автоматично приймати запити на підписку від користувачів, на яких ви підписані",
	"makeReactionsPublic": "Зробити історію реакцій публічною",
	"makeReactionsPublicDescription": "Це зробить список усіх ваших попередніх реакцій загальнодоступним.",
	"followingVisibility": "Видимість підписок",
	"followersVisibility": "Visibility of followers",
	"hideOnlineStatus": "Приховати онлайн статус.",
	"hideOnlineStatusDescription": "Приховування вашого онлайн-статусу може обмежити зручність деяких функцій, зокрема пошуку.",
	"noCrawle": "Заборонити індексацію",
	"noCrawleDescription": "Просити пошукові системи не індексувати ваш профіль, нотатки, сторінки тощо.",
	"preventAiLearning": "Відхилити використання в машинному навчанні (генеративному ШІ)",
	"preventAiLearningDescription": "Запит до пошукових роботів не використовувати опубліковані тексти, зображення тощо в наборах даних для машинного навчання (прогнозного / генеративного ШІ). Це досягається додаванням HTML-прапорця відповіді «noai» до відповідного вмісту. Однак повного запобігання за допомогою цього прапорця досягти неможливо, оскільки його можуть просто ігнорувати.",
	"makeExplorable": "Зробіть обліковий запис видимим у розділі \"Огляд\"",
	"makeExplorableDescription": "Вимкніть, щоб обліковий запис не показувався у розділі \"Огляд\".",
	"directMessage": "Чат із користувачем",
	"chatChatNotAvailableForThisAccountOrServer": "Чат не увімкнено на цьому сервері або для цього облікового запису.",
	"chatChatAllowedUsers": "З ким дозволити переписуватися",
	"chatChatAllowedUsers_note": "Ви можете переписуватися з людьми, яким ви відправили повідомлення, не зважаючи на це налаштування.",
	"lockdown": "Доступ обмежений",
	"accountSettingsRequireSigninToViewContents": "Вимога входу для перегляду контенту",
	"accountSettingsRequireSigninToViewContentsDescription1": "Вимагатиму входження для перегляду усіх нотаток й іншого створеного вами контенту. Це матиме ефект на запобігання збирачів збирати вашу інформацію.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Контент не буде показуватися у попередніх переглядах посилань (OGP), в інтеграціях у вебсторінки, або на серверах, які не підтримують цитати у нотатках.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Показувати минулі нотатки лише для підписників",
	"none": "Відсутній",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Нотатки, які знаходяться в обраному періоді",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Нотатки, які були створені до обраної дати та часу",
	"custom": "Користувацькі",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "Поки ця функція ввімкнена, тільки підписники можуть бачити нотатки створенні до обраної дати та часу або були видимі протягом зазначеного часу. У разі вимкнення, статус публікації нотаток також буде відновлено. ",
	"accountSettingsMakeNotesHiddenBefore": "Зробити минулі нотатки приватними",
	"accountSettingsMakeNotesHiddenBeforeDescription": "Поки ця функція ввімкнена, тільки ви можете бачити нотатки створенні до обраної дати та часу або були видимі протягом зазначеного часу. У разі вимкнення, статус публікації нотаток також буде відновлено. ",
	"accountSettingsMayNotEffectSomeSituations": "Ці обмеження спрощенні. Вони можуть бути не застосовуваними у деяких випадках, таких як перегляд на видаленому сервері під час модерації. ",
	"public": "Публічний",
	"followers": "Підписники",
	"private": "Приватне",
	"chatChatAllowedUsersEveryone": "Усі",
	"chatChatAllowedUsersFollowers": "Тільки ваши підписники",
	"chatChatAllowedUsersFollowing": "Тільки користувачі, за якими ви слідкуєте",
	"chatChatAllowedUsersMutual": "Тільки підписники, за якими ви слідкуєте",
	"chatChatAllowedUsersNone": "Ніхто",
	"oneHour": "1 година",
	"oneDay": "1 день",
	"threeDays": "3 дні",
	"oneWeek": "1 тиждень",
	"oneMonth": "1 місяць",
	"threeMonths": "3 months",
	"oneYear": "1 рік",
	"acknowledgeNotesAndEnable": "Ввімкніть після зрозуміння попереджень.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Вимкнено",
	"timeHour": "г",
	"timeDay": "д",
	"error": "Помилка",
	"cannotPerformTemporaryDescription": "Цю дію тимчасово неможливо виконати через перевищення ліміту виконання. Будь ласка, зачекайте трохи й спробуйте ще раз."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"privacy": "Riêng tư",
	"settingsPrivacyBanner": "You can configure settings related to account privacy, such as content visibility, discoverability, and follow approval.",
	"makeFollowManuallyApprove": "Yêu cầu theo dõi cần được duyệt",
	"lockedAccountInfo": "Ghi chú của bạn sẽ hiển thị với bất kỳ ai, trừ khi bạn đặt chế độ hiển thị tút của mình thành \"Chỉ người theo dõi\".",
	"autoAcceptFollowed": "Tự động phê duyệt theo dõi từ những người mà bạn đang theo dõi",
	"makeReactionsPublic": "Đặt lịch sử biểu cảm công khai",
	"makeReactionsPublicDescription": "Điều này sẽ hiển thị công khai danh sách tất cả các biểu cảm trước đây của bạn.",
	"followingVisibility": "Hiển thị lượt theo dõi",
	"followersVisibility": "Hiển thị người theo dõi",
	"hideOnlineStatus": "Ẩn trạng thái online",
	"hideOnlineStatusDescription": "Ẩn trạng thái online của bạn làm giảm sự tiện lợi của một số tính năng như tìm kiếm.",
	"noCrawle": "Từ chối lập chỉ mục",
	"noCrawleDescription": "Không cho công cụ tìm kiếm lập chỉ mục trang hồ sơ, tút, Trang, etc.",
	"preventAiLearning": "Từ chối sử dụng công nghệ Máy Học (AI Sáng Tạo)",
	"preventAiLearningDescription": "Requests crawlers to not use posted text or image material etc. in machine learning (Predictive / Generative AI) data sets. This is achieved by adding a \"noai\" HTML-Response flag to the respective content. A complete prevention can however not be achieved through this flag, as it may simply be ignored.",
	"makeExplorable": "Không hiện tôi trong \"Khám phá\"",
	"makeExplorableDescription": "Nếu bạn tắt, tài khoản của bạn sẽ không hiện trong mục \"Khám phá\".",
	"directMessage": "Chat with user",
	"chatChatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"chatChatAllowedUsers": "Who to allow chatting with",
	"chatChatAllowedUsers_note": "You can chat with anyone to whom you have sent a chat message regardless of this setting.",
	"lockdown": "Lockdown",
	"accountSettingsRequireSigninToViewContents": "Yêu cầu đăng nhập để xem nội dung",
	"accountSettingsRequireSigninToViewContentsDescription1": "Yêu cầu đăng nhập để xem tất cả ghi chú và nội dung khác mà bạn tạo. Điều này được kỳ vọng sẽ có hiệu quả trong việc ngăn chặn thông tin bị thu thập bởi các trình thu thập thông tin.",
	"accountSettingsRequireSigninToViewContentsDescription2": "Content will not be displayed in URL previews (OGP), embedded in web pages, or on servers that don't support note quotes.",
	"accountSettingsMakeNotesFollowersOnlyBefore": "Make past notes to be displayed only to followers",
	"none": "Không",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "Notes after the specified date and time",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "Notes before the specified date and time",
	"custom": "Custom",
	"timeMonth": "Month(s)",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "While this feature is enabled, only followers can see notes past the set date and time or have been visible for a set time. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMakeNotesHiddenBefore": "Make past notes private",
	"accountSettingsMakeNotesHiddenBeforeDescription": "While this feature is enabled, notes that are past the set date and time or have been visible only to you. When it is deactivated, the note publication status will also be restored.",
	"accountSettingsMayNotEffectSomeSituations": "These restrictions are simplified. They may not apply in some situations, such as when viewing on a remote server or during moderation.",
	"public": "Công khai",
	"followers": "Người theo dõi",
	"private": "Riêng tư",
	"chatChatAllowedUsersEveryone": "Everyone",
	"chatChatAllowedUsersFollowers": "Only your followers",
	"chatChatAllowedUsersFollowing": "Only users you are following",
	"chatChatAllowedUsersMutual": "Mutual followers only",
	"chatChatAllowedUsersNone": "Nobody",
	"oneHour": "1 giờ",
	"oneDay": "1 ngày",
	"threeDays": "3 ngày ",
	"oneWeek": "1 tuần",
	"oneMonth": "1 tháng",
	"threeMonths": "3 tháng",
	"oneYear": "1 năm",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "Đã tắt",
	"timeHour": "giờ",
	"timeDay": "ngày",
	"error": "Lỗi",
	"cannotPerformTemporaryDescription": "Tạm thời không sử dụng được vì lần số điều kiện quá giới hạn. Thử lại sau mọt lát nữa."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"privacy": "隐私",
	"settingsPrivacyBanner": "可在此设置如内容可见性、可发现性、批准关注请求等账户隐私设置。",
	"makeFollowManuallyApprove": "关注请求需要批准",
	"lockedAccountInfo": "即使启用该功能，只要帖子可见范围不是 “仅关注者”，任何人都可以看到您的帖子。",
	"autoAcceptFollowed": "自动允许我关注的人的关注请求",
	"makeReactionsPublic": "将回应设置为公开",
	"makeReactionsPublicDescription": "将您发表过的回应设置成公开可见。",
	"followingVisibility": "关注的人的公开范围",
	"followersVisibility": "关注者的公开范围",
	"hideOnlineStatus": "隐藏在线状态",
	"hideOnlineStatusDescription": "隐藏在线状态后，可能会降低搜索等功能的便利性。",
	"noCrawle": "拒绝搜索引擎的索引",
	"noCrawleDescription": "拒绝搜索引擎收录（索引）您的个人资料，帖子，页面等。",
	"preventAiLearning": "拒绝用于训练生成式 AI",
	"preventAiLearningDescription": "要求文章生成 AI 或图像生成 AI 不能够以发布的帖子和图像等内容作为学习对象。这是通过在 HTML 响应中包含 noai 标志来实现的，这不能完全阻止 AI 学习你的发布内容，并不是所有 AI 都会遵守这类请求。",
	"makeExplorable": "使账号可见。",
	"makeExplorableDescription": "关闭时，账号不会显示在\"发现\"中。",
	"directMessage": "私信",
	"chatChatNotAvailableForThisAccountOrServer": "此服务器或者账户还未开启聊天功能。",
	"chatChatAllowedUsers": "谁可以发起聊天",
	"chatChatAllowedUsers_note": "主动发起聊天时，对方将不受此设置限制。",
	"lockdown": "锁定",
	"accountSettingsRequireSigninToViewContents": "需要登录才能显示内容",
	"accountSettingsRequireSigninToViewContentsDescription1": "您发布的所有帖子将变成需要登入后才会显示。有望防止爬虫收集各种信息。",
	"accountSettingsRequireSigninToViewContentsDescription2": "没有 URL 预览（OGP）、内嵌网页、引用帖子的功能的服务器也将无法显示。",
	"accountSettingsMakeNotesFollowersOnlyBefore": "可将过去的帖子设为仅关注者可见",
	"none": "无",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "超过指定时间的帖子",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "指定日期前的帖子",
	"custom": "自定义",
	"timeMonth": "个月",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "开启此设定时，超过设定的时间或日期后，帖子将变为仅关注者可见。关闭后帖子的公开状态将恢复成原本的设定。",
	"accountSettingsMakeNotesHiddenBefore": "将过去的帖子设为私密",
	"accountSettingsMakeNotesHiddenBeforeDescription": "开启此设定时，超过设定的时间或日期后，帖子将变为仅自己可见。关闭后帖子的公开状态将恢复成原本的设定。",
	"accountSettingsMayNotEffectSomeSituations": "此限制功能非常简单，在与远程服务器联合等情形时可能不适用。",
	"public": "公开",
	"followers": "关注者",
	"private": "私密",
	"chatChatAllowedUsersEveryone": "任何人",
	"chatChatAllowedUsersFollowers": "仅关注者",
	"chatChatAllowedUsersFollowing": "仅关注的人",
	"chatChatAllowedUsersMutual": "仅相互关注",
	"chatChatAllowedUsersNone": "没有人",
	"oneHour": "1 小时",
	"oneDay": "1天",
	"threeDays": "3天",
	"oneWeek": "1 周",
	"oneMonth": "1个月",
	"threeMonths": "3个月",
	"oneYear": "1 年",
	"acknowledgeNotesAndEnable": "理解注意事项后再开启。",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "已禁用 ",
	"timeHour": "小时",
	"timeDay": "天",
	"error": "错误",
	"cannotPerformTemporaryDescription": "因操作过于频繁，暂时不可用，请稍后再试。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"privacy": "隱私",
	"settingsPrivacyBanner": "您可以調整帳戶的隱私設定，例如內容的可見性、尋找內容的容易程度，以及追隨是否需要核准。",
	"makeFollowManuallyApprove": "追隨需要核准",
	"lockedAccountInfo": "即使追隨需要核准，除非你將貼文的可見性設定為 「追隨者」，否則任何人都能看見你的貼文。",
	"autoAcceptFollowed": "自動允許來自追隨中使用者的追隨請求",
	"makeReactionsPublic": "將反應設為公開",
	"makeReactionsPublicDescription": "將您做過的反應設為公開可見。",
	"followingVisibility": "追隨中的可見性",
	"followersVisibility": "追隨者的可見性",
	"hideOnlineStatus": "隱藏上線狀態",
	"hideOnlineStatusDescription": "隱藏上線狀態後，可能會降低搜尋等功能的便利性。",
	"noCrawle": "拒絕搜尋引擎索引",
	"noCrawleDescription": "要求網路搜尋引擎不要索引你的個人資料頁、貼文及頁面等。",
	"preventAiLearning": "拒絕接受生成式AI的訓練",
	"preventAiLearningDescription": "要求站外生成式 AI 不使用您發佈的內容訓練模型。此功能會使伺服器於 HTML 回應新增「noai」標籤，而因為要視乎 AI 會否遵守該標籤，所以此功能無法完全阻止所有 AI 使用您的內容。",
	"makeExplorable": "使自己的帳戶更容易被找到",
	"makeExplorableDescription": "如果關閉，帳戶將不會被顯示在「探索」頁面中。",
	"directMessage": "直接訊息",
	"chatChatNotAvailableForThisAccountOrServer": "這個伺服器或這個帳號的聊天功能尚未啟用。",
	"chatChatAllowedUsers": "允許聊天的對象",
	"chatChatAllowedUsers_note": "無論此設定為何，您仍可與自己曾發送過聊天訊息的對象進行聊天。",
	"lockdown": "鎖定",
	"accountSettingsRequireSigninToViewContents": "須登入以顯示內容",
	"accountSettingsRequireSigninToViewContentsDescription1": "必須登入才會顯示您建立的貼文等內容。可望有效防止資訊被爬蟲蒐集。",
	"accountSettingsRequireSigninToViewContentsDescription2": "針對您貼文的 URL 預覽 (OGP) 與網頁嵌入功能將會無法使用。而不支援引用貼文的伺服器，也將停止顯示。",
	"accountSettingsMakeNotesFollowersOnlyBefore": "讓過去的貼文僅對追隨者顯示",
	"none": "無",
	"accountSettingsNotesHavePassedSpecifiedPeriod": "早於指定時間的貼文",
	"accountSettingsNotesOlderThanSpecifiedDateAndTime": "指定時間和日期之前的貼文",
	"custom": "自訂",
	"timeMonth": "個月",
	"accountSettingsMakeNotesFollowersOnlyBeforeDescription": "啟用此功能後，超過設定的日期和時間或超過設定時間的貼文將僅對追隨者顯示。 如果您再次停用它，貼文的公開狀態也會恢復原狀。",
	"accountSettingsMakeNotesHiddenBefore": "隱藏過去的貼文",
	"accountSettingsMakeNotesHiddenBeforeDescription": "啟用此功能後，超過設定的日期和時間或超過設定時間的貼文將僅對自己顯示（私密化）。 如果您再次停用它，貼文的公開狀態也會恢復原狀。",
	"accountSettingsMayNotEffectSomeSituations": "這些限制僅是簡化版本。在某些情況下，例如在遠端伺服器上瀏覽或進行審核時，可能不會套用這些限制。",
	"public": "公開",
	"followers": "追隨者",
	"private": "私密",
	"chatChatAllowedUsersEveryone": "任何人",
	"chatChatAllowedUsersFollowers": "追隨自己的使用者",
	"chatChatAllowedUsersFollowing": "只有您追隨的使用者",
	"chatChatAllowedUsersMutual": "互相追隨",
	"chatChatAllowedUsersNone": "無",
	"oneHour": "一小時",
	"oneDay": "一天",
	"threeDays": "3 日",
	"oneWeek": "一週",
	"oneMonth": "一個月",
	"threeMonths": "3 個月",
	"oneYear": "1 年",
	"acknowledgeNotesAndEnable": "了解注意事項後再開啟。",
	"followApprovalGroupTitle": "フォロー承認",
	"followApprovalInactiveDescription": "すべてのフォローが承認制になるため、期間による設定は適用されません。フォローの承認制を解除すると、以下の設定が再び適用されます。",
	"followApprovalTitle": "新しいアカウントからのフォローを承認制にする",
	"followApprovalAutoAcceptDescription": "フォローを承認制にしている場合や、新しいアカウントからのフォローを保留する場合にも、あなたがフォローしている相手は自動承認します。",
	"followApprovalDescription": "指定した期間が経過していない相手からのフォローを、フォローリクエストとして保留します。既存のフォロワーには影響しません。フォローしている相手の自動承認が有効な場合、その相手は自動承認されます。",
	"followApprovalLocal": "ローカルユーザーからのフォロー",
	"followApprovalLocalDescription": "このサーバーでのアカウント作成からの期間で判定します。",
	"followApprovalRemote": "リモートユーザーからのフォロー",
	"followApprovalRemoteDescription": "相手のサーバーでの作成日時ではなく、このサーバーが初めてそのアカウントを認識してからの期間で判定します。",
	"followApprovalUseDefault": "既定値を使う（現在は無効）",
	"followApprovalCustom": "期間を指定する",
	"followApprovalPeriod": "承認が必要な期間",
	"followApprovalUnit": "単位",
	"followApprovalInvalidPeriod": "期間が正しくありません。1秒以上の期間を、指定できる範囲内で入力してください。",
	"disabled": "已停用",
	"timeHour": "小時",
	"timeDay": "日",
	"error": "錯誤",
	"cannotPerformTemporaryDescription": "由於超過操作次數限制，因此暫時無法進行。請稍後再嘗試。"
}
</locale>

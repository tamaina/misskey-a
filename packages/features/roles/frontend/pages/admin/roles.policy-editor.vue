<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div class="_gaps_s">
		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsRateLimitFactor, 'rateLimitFactor'])" v-model:policyMeta="policyMetaModel.rateLimitFactor" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsRateLimitFactor }}</template>
			<template #valueText>{{ Math.floor(valuesModel.rateLimitFactor * 100) }}%</template>
			<template #default="{ disabled }">
				<MkRange v-model="valuesModel.rateLimitFactor" :disabled="disabled" :min="0.3" :max="3" :step="0.1" :textConverter="(v) => `${Math.round(v * 100)}%`">
					<template #caption>{{ $locale.sfc.roleOptionsDescriptionOfRateLimitFactor }}</template>
				</MkRange>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsGtlAvailable, 'gtlAvailable'])" v-model:policyMeta="policyMetaModel.gtlAvailable" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsGtlAvailable }}</template>
			<template #valueText>{{ valuesModel.gtlAvailable ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.gtlAvailable" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsLtlAvailable, 'ltlAvailable'])" v-model:policyMeta="policyMetaModel.ltlAvailable" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsLtlAvailable }}</template>
			<template #valueText>{{ valuesModel.ltlAvailable ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.ltlAvailable" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanPublicNote, 'canPublicNote'])" v-model:policyMeta="policyMetaModel.canPublicNote" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanPublicNote }}</template>
			<template #valueText>{{ valuesModel.canPublicNote ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canPublicNote" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsChatAvailability, 'chatAvailability'])" v-model:policyMeta="policyMetaModel.chatAvailability" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsChatAvailability }}</template>
			<template #valueText>{{ valuesModel.chatAvailability === 'available' ? $locale.sfc.yes : valuesModel.chatAvailability === 'readonly' ? $locale.sfc.readonly : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSelect
					v-model="valuesModel.chatAvailability"
					:disabled="disabled"
					:items="[
						{ label: $locale.sfc.enabled, value: 'available' },
						{ label: $locale.sfc.readonly, value: 'readonly' },
						{ label: $locale.sfc.disabled, value: 'unavailable' },
					]"
				>
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSelect>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsMentionMax, 'mentionLimit'])" v-model:policyMeta="policyMetaModel.mentionLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsMentionMax }}</template>
			<template #valueText>{{ valuesModel.mentionLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.mentionLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanInvite, 'canInvite'])" v-model:policyMeta="policyMetaModel.canInvite" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanInvite }}</template>
			<template #valueText>{{ valuesModel.canInvite ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canInvite" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsInviteLimit, 'inviteLimit'])" v-model:policyMeta="policyMetaModel.inviteLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsInviteLimit }}</template>
			<template #valueText>{{ valuesModel.inviteLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.inviteLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsInviteLimitCycle, 'inviteLimitCycle'])" v-model:policyMeta="policyMetaModel.inviteLimitCycle" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsInviteLimitCycle }}</template>
			<template #valueText>{{ valuesModel.inviteLimitCycle + $locale.sfc.timeMinute }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.inviteLimitCycle" type="number" :disabled="disabled">
					<template #suffix>{{ $locale.sfc.timeMinute }}</template>
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsInviteExpirationTime, 'inviteExpirationTime'])" v-model:policyMeta="policyMetaModel.inviteExpirationTime" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsInviteExpirationTime }}</template>
			<template #valueText>{{ valuesModel.inviteExpirationTime + $locale.sfc.timeMinute }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.inviteExpirationTime" type="number" :disabled="disabled">
					<template #suffix>{{ $locale.sfc.timeMinute }}</template>
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanManageAvatarDecorations, 'canManageAvatarDecorations'])" v-model:policyMeta="policyMetaModel.canManageAvatarDecorations" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanManageAvatarDecorations }}</template>
			<template #valueText>{{ valuesModel.canManageAvatarDecorations ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canManageAvatarDecorations" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanManageCustomEmojis, 'canManageCustomEmojis'])" v-model:policyMeta="policyMetaModel.canManageCustomEmojis" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanManageCustomEmojis }}</template>
			<template #valueText>{{ valuesModel.canManageCustomEmojis ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canManageCustomEmojis" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanSearchNotes, 'canSearchNotes'])" v-model:policyMeta="policyMetaModel.canSearchNotes" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanSearchNotes }}</template>
			<template #valueText>{{ valuesModel.canSearchNotes ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canSearchNotes" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanSearchUsers, 'canSearchUsers'])" v-model:policyMeta="policyMetaModel.canSearchUsers" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanSearchUsers }}</template>
			<template #valueText>{{ valuesModel.canSearchUsers ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canSearchUsers" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanUseTranslator, 'canUseTranslator'])" v-model:policyMeta="policyMetaModel.canUseTranslator" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanUseTranslator }}</template>
			<template #valueText>{{ valuesModel.canUseTranslator ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canUseTranslator" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanCreateChannel, 'canCreateChannel'])" v-model:policyMeta="policyMetaModel.canCreateChannel" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanCreateChannel }}</template>
			<template #valueText>{{ valuesModel.canCreateChannel ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canCreateChannel" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsDriveCapacity, 'driveCapacityMb'])" v-model:policyMeta="policyMetaModel.driveCapacityMb" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsDriveCapacity }}</template>
			<template #valueText>{{ valuesModel.driveCapacityMb }}MB</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.driveCapacityMb" type="number" :disabled="disabled">
					<template #suffix>MB</template>
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsMaxFileSize, 'maxFileSizeMb'])" v-model:policyMeta="policyMetaModel.maxFileSizeMb" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsMaxFileSize }}</template>
			<template #valueText>{{ valuesModel.maxFileSizeMb }}MB</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.maxFileSizeMb" type="number" :disabled="disabled">
					<template #suffix>MB</template>
					<template #caption>
						<div>{{ interpolateLocaleParameters($locale.sfc.roleOptionsMaxFileSize_caption2, { max: `${Math.floor(instance.maxFileSize / (1024 * 1024))}MB` }) }}</div>
						<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ $locale.sfc.roleOptionsMaxFileSize_caption }}</div>
					</template>
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsUploadableFileTypes, 'uploadableFileTypes'])" v-model:policyMeta="policyMetaModel.uploadableFileTypes" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsUploadableFileTypes }}</template>
			<template #valueText>...</template>
			<template #default="{ disabled }">
				<MkTextarea :modelValue="valuesModel.uploadableFileTypes.join('\n')" :disabled="disabled" @update:modelValue="v => valuesModel.uploadableFileTypes = v.split('\n')">
					<template #caption>
						<div>{{ $locale.sfc.roleOptionsUploadableFileTypes_caption }}</div>
						<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ interpolateLocaleParameters($locale.sfc.roleOptionsUploadableFileTypes_caption2, { x: 'application/octet-stream' }) }}</div>
					</template>
				</MkTextarea>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsAlwaysMarkNsfw, 'alwaysMarkNsfw'])" v-model:policyMeta="policyMetaModel.alwaysMarkNsfw" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsAlwaysMarkNsfw }}</template>
			<template #valueText>{{ valuesModel.alwaysMarkNsfw ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.alwaysMarkNsfw" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanUpdateBioMedia, 'canUpdateBioMedia'])" v-model:policyMeta="policyMetaModel.canUpdateBioMedia" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanUpdateBioMedia }}</template>
			<template #valueText>{{ valuesModel.canUpdateBioMedia ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canUpdateBioMedia" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsPinMax, 'pinLimit'])" v-model:policyMeta="policyMetaModel.pinLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsPinMax }}</template>
			<template #valueText>{{ valuesModel.pinLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.pinLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsAntennaMax, 'antennaLimit'])" v-model:policyMeta="policyMetaModel.antennaLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsAntennaMax }}</template>
			<template #valueText>{{ valuesModel.antennaLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.antennaLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsWordMuteMax, 'wordMuteLimit'])" v-model:policyMeta="policyMetaModel.wordMuteLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsWordMuteMax }}</template>
			<template #valueText>{{ valuesModel.wordMuteLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.wordMuteLimit" type="number" :disabled="disabled">
					<template #suffix>chars</template>
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsWebhookMax, 'webhookLimit'])" v-model:policyMeta="policyMetaModel.webhookLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsWebhookMax }}</template>
			<template #valueText>{{ valuesModel.webhookLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.webhookLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsClipMax, 'clipLimit'])" v-model:policyMeta="policyMetaModel.clipLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsClipMax }}</template>
			<template #valueText>{{ valuesModel.clipLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.clipLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsNoteEachClipsMax, 'noteEachClipsLimit'])" v-model:policyMeta="policyMetaModel.noteEachClipsLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsNoteEachClipsMax }}</template>
			<template #valueText>{{ valuesModel.noteEachClipsLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.noteEachClipsLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsUserListMax, 'userListLimit'])" v-model:policyMeta="policyMetaModel.userListLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsUserListMax }}</template>
			<template #valueText>{{ valuesModel.userListLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.userListLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsUserEachUserListsMax, 'userEachUserListsLimit'])" v-model:policyMeta="policyMetaModel.userEachUserListsLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsUserEachUserListsMax }}</template>
			<template #valueText>{{ valuesModel.userEachUserListsLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.userEachUserListsLimit" type="number" :disabled="disabled">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanHideAds, 'canHideAds'])" v-model:policyMeta="policyMetaModel.canHideAds" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanHideAds }}</template>
			<template #valueText>{{ valuesModel.canHideAds ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canHideAds" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsAvatarDecorationLimit, 'avatarDecorationLimit'])" v-model:policyMeta="policyMetaModel.avatarDecorationLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsAvatarDecorationLimit }}</template>
			<template #valueText>{{ valuesModel.avatarDecorationLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="avatarDecorationLimit" type="number" :disabled="disabled" :min="0" :max="16" @update:modelValue="updateAvatarDecorationLimit">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanImportAntennas, 'canImportAntennas'])" v-model:policyMeta="policyMetaModel.canImportAntennas" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanImportAntennas }}</template>
			<template #valueText>{{ valuesModel.canImportAntennas ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canImportAntennas" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanImportBlocking, 'canImportBlocking'])" v-model:policyMeta="policyMetaModel.canImportBlocking" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanImportBlocking }}</template>
			<template #valueText>{{ valuesModel.canImportBlocking ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canImportBlocking" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanImportFollowing, 'canImportFollowing'])" v-model:policyMeta="policyMetaModel.canImportFollowing" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanImportFollowing }}</template>
			<template #valueText>{{ valuesModel.canImportFollowing ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canImportFollowing" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanImportMuting, 'canImportMuting'])" v-model:policyMeta="policyMetaModel.canImportMuting" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanImportMuting }}</template>
			<template #valueText>{{ valuesModel.canImportMuting ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canImportMuting" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsCanImportUserLists, 'canImportUserList'])" v-model:policyMeta="policyMetaModel.canImportUserLists" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsCanImportUserLists }}</template>
			<template #valueText>{{ valuesModel.canImportUserLists ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.canImportUserLists" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsNoteDraftLimit, 'noteDraftLimit'])" v-model:policyMeta="policyMetaModel.noteDraftLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsNoteDraftLimit }}</template>
			<template #valueText>{{ valuesModel.noteDraftLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.noteDraftLimit" type="number" :disabled="disabled" :min="0">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsScheduledNoteLimit, 'scheduledNoteLimit'])" v-model:policyMeta="policyMetaModel.scheduledNoteLimit" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsScheduledNoteLimit }}</template>
			<template #valueText>{{ valuesModel.scheduledNoteLimit }}</template>
			<template #default="{ disabled }">
				<MkInput v-model="valuesModel.scheduledNoteLimit" type="number" :disabled="disabled" :min="0">
				</MkInput>
			</template>
		</XFolder>

		<XFolder v-if="matchQuery([$locale.sfc.roleOptionsWatermarkAvailable, 'watermarkAvailable'])" v-model:policyMeta="policyMetaModel.watermarkAvailable" :isBaseRole="isBaseRole" :readonly="readonly">
			<template #label>{{ $locale.sfc.roleOptionsWatermarkAvailable }}</template>
			<template #valueText>{{ valuesModel.watermarkAvailable ? $locale.sfc.yes : $locale.sfc.no }}</template>
			<template #default="{ disabled }">
				<MkSwitch v-model="valuesModel.watermarkAvailable" :disabled="disabled">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</template>
		</XFolder>
	</div>
</template>

<script lang="ts">
import * as Misskey from 'misskey-js';
import { instance } from '@features/instance/frontend/instance.js';

export type PolicyMeta = {
	useDefault: boolean;
	priority: number;
};

type PolicyMetaRecord = {
	[K in keyof Misskey.entities.RolePolicies]: PolicyMeta;
};
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import XFolder from '@features/roles/frontend/pages/admin/roles.policy-editor.folder.vue';

import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';

const props = defineProps<{
	isBaseRole: boolean;
	rolePolicies: Misskey.entities.RolePolicies;
	policiesMeta?: PolicyMetaRecord;
	roleQuery?: string;
	readonly?: boolean;
}>();

const emit = defineEmits<{
	(event: 'update:rolePolicies', value: Misskey.entities.RolePolicies): void;
	(event: 'update:policiesMeta', value: PolicyMetaRecord): void;
}>();

const valuesModel = ref(props.rolePolicies);
watch(valuesModel, (newVal) => {
	emit('update:rolePolicies', newVal);
}, { deep: true });
watch(() => props.rolePolicies, () => {
	valuesModel.value = props.rolePolicies;
}, { deep: true });

function setPolicyMeta(incoming: Partial<PolicyMetaRecord> | undefined): PolicyMetaRecord {
	const meta: PolicyMetaRecord = {} as PolicyMetaRecord;
	for (const ROLE_POLICY of Misskey.rolePolicies) {
		meta[ROLE_POLICY] = incoming?.[ROLE_POLICY] ?? {
			useDefault: true,
			priority: 0,
		};
	}
	return meta;
}

const policyMetaModel = ref(setPolicyMeta(props.policiesMeta));
watch(policyMetaModel, (newVal) => {
	emit('update:policiesMeta', newVal);
}, { deep: true });
watch(() => props.policiesMeta, () => {
	policyMetaModel.value = setPolicyMeta(props.policiesMeta);
}, { deep: true });

function matchQuery(keywords: string[]): boolean {
	if (props.roleQuery == null || props.roleQuery.trim().length === 0) return true;
	return keywords.some(keyword => keyword.toLowerCase().includes(props.roleQuery!.toLowerCase()));
}

const avatarDecorationLimit = computed({
	get: () => Math.min(16, Math.max(0, Number(valuesModel.value.avatarDecorationLimit ?? 0))),
	set: (value) => {
		valuesModel.value.avatarDecorationLimit = Math.min(Number(value), 16);
	},
});

function updateAvatarDecorationLimit(value: string | number) {
	avatarDecorationLimit.value = Number(value);
}
</script>

<locale lang="json" locale="ar-SA">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "نعم",
	"no": "لا",
	"enable": "تشغيل",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "مفعّل",
	"disabled": "معطّل",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "د",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "إدارة الإيموجي المخصصة",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "حد عدد الملاحظات المثبتة",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"roleOptionsRateLimitFactor": "Limitador",
	"roleOptionsDescriptionOfRateLimitFactor": "Límits baixos són menys restrictius, límits alts són més restrictius.",
	"roleOptionsGtlAvailable": "Pot veure la línia de temps global",
	"yes": "Sí ",
	"no": "No",
	"enable": "Habilita",
	"roleOptionsLtlAvailable": "Pot veure la línia de temps local",
	"roleOptionsCanPublicNote": "Pot enviar notes públiques",
	"roleOptionsChatAvailability": "Es permet xatejar",
	"readonly": "Només lectura",
	"enabled": "Activat",
	"disabled": "Desactivat",
	"roleOptionsMentionMax": "Nombre màxim de mencions a una nota",
	"roleOptionsCanInvite": "Pot crear invitacions a la instància ",
	"roleOptionsInviteLimit": "Límit d'invitacions ",
	"roleOptionsInviteLimitCycle": "Temps de refresc de les invitacions",
	"timeMinute": "Minut(s)",
	"roleOptionsInviteExpirationTime": "Interval de caducitat de les invitacions",
	"roleOptionsCanManageAvatarDecorations": "Gestiona les decoracions dels avatars ",
	"roleOptionsCanManageCustomEmojis": "Gestiona els emojis personalitzats",
	"roleOptionsCanSearchNotes": "Pot cercar notes",
	"roleOptionsCanSearchUsers": "Pot cercar usuaris",
	"roleOptionsCanUseTranslator": "Pot fer servir el traductor",
	"roleOptionsCanCreateChannel": "Previsualitzant el tema",
	"roleOptionsDriveCapacity": "Capacitat del disc",
	"roleOptionsMaxFileSize": "Mida màxima de l'arxiu que es pot carregar",
	"roleOptionsMaxFileSize_caption2": "La configuració de la mida màxima de fitxer per a tot el servidor és {max}. Per permetre la pujada de fitxers més grans, si us plau, canvieu aquesta opció al fitxer de configuració de Misskey.",
	"roleOptionsMaxFileSize_caption": "Pot haver-hi la possibilitat que existeixin altres opcions de configuració de l'etapa anterior, com podria ser el proxy invers i la CDN.",
	"roleOptionsUploadableFileTypes": "Tipus de fitxers que en podeu pujar",
	"roleOptionsUploadableFileTypes_caption": "Especifica el tipus MIME. Es poden especificar diferents tipus MIME separats amb una nova línia, i es poden especificar comodins amb asteriscs (*). (Per exemple: image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Pot que no sigui possible determinar el tipus MIME d'alguns arxius. Per permetre aquests tipus d'arxius afegeix {x} a les especificacions.",
	"roleOptionsAlwaysMarkNsfw": "Marca sempre els fitxers com a sensibles",
	"roleOptionsCanUpdateBioMedia": "Permet l'edició d'una icona o un bàner",
	"roleOptionsPinMax": "Nombre màxim de notes fixades",
	"roleOptionsAntennaMax": "Nombre màxim d'antenes",
	"roleOptionsWordMuteMax": "Nombre màxim de caràcters permesos a les paraules silenciades",
	"roleOptionsWebhookMax": "Nombre màxim de Webhooks",
	"roleOptionsClipMax": "Nombre màxim de clips",
	"roleOptionsNoteEachClipsMax": "Nombre màxim de notes dintre d'un clip",
	"roleOptionsUserListMax": "Nombre màxim de llistes d'usuaris ",
	"roleOptionsUserEachUserListsMax": "Nombre màxim d'usuaris dintre d'una llista d'usuaris ",
	"roleOptionsCanHideAds": "Pot amagar la publicitat",
	"roleOptionsAvatarDecorationLimit": "Nombre màxim de decoracions que es poden aplicar els avatars",
	"roleOptionsCanImportAntennas": "Autoritza la importació d'antenes ",
	"roleOptionsCanImportBlocking": "Autoritza la importació de bloquejats",
	"roleOptionsCanImportFollowing": "Autoritza la importació de seguidors",
	"roleOptionsCanImportMuting": "Autoritza la importació de silenciats",
	"roleOptionsCanImportUserLists": "Autoritza la importació de llistes d'usuaris ",
	"roleOptionsNoteDraftLimit": "Nombre possible d'esborranys de notes al servidor",
	"roleOptionsScheduledNoteLimit": "Màxim nombre de notes programades que es poden crear simultàniament",
	"roleOptionsWatermarkAvailable": "Pots fer servir la marca d'aigua"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"roleOptionsRateLimitFactor": "Limit rychlosti",
	"roleOptionsDescriptionOfRateLimitFactor": "Nižší limity rychlosti jsou méně omezující, vyšší více omezující. ",
	"roleOptionsGtlAvailable": "Může zobrazit globální časovou osu",
	"yes": "Ano",
	"no": "Ne",
	"enable": "Povolit",
	"roleOptionsLtlAvailable": "Může zobrazit místní časovou osu",
	"roleOptionsCanPublicNote": "Může posílat veřejné poznámky",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Zapnuto",
	"disabled": "Vypnuto",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Může vytvářet kódy pozvánek instance",
	"roleOptionsInviteLimit": "Limit pozvánek",
	"roleOptionsInviteLimitCycle": "Limit mezi pozvánkama",
	"timeMinute": "Minut",
	"roleOptionsInviteExpirationTime": "Interval vypršení platnosti pozvánky",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Spravovat vlastní emoji",
	"roleOptionsCanSearchNotes": "Použití vyhledávání poznámek",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Velikost disku",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Vždy označovat soubory jako NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximální počet připnutých poznámek",
	"roleOptionsAntennaMax": "Maximální počet antén",
	"roleOptionsWordMuteMax": "Maximální počet znaků povolených v ztlumených slovech",
	"roleOptionsWebhookMax": "Maximální počet Webhooků",
	"roleOptionsClipMax": "Maximální počet připnutí",
	"roleOptionsNoteEachClipsMax": "Maximální počet poznámek v připnutí",
	"roleOptionsUserListMax": "Maximální počet seznamů uživatelů",
	"roleOptionsUserEachUserListsMax": "Maximální počet uživatelů v seznamu uživatelů",
	"roleOptionsCanHideAds": "Může schovat reklamy",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Yes",
	"no": "No",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"roleOptionsRateLimitFactor": "Versuchsanzahl",
	"roleOptionsDescriptionOfRateLimitFactor": "Je niedriger desto weniger restriktiv, je höher destro restriktiver.",
	"roleOptionsGtlAvailable": "Kann auf die globale Chronik zugreifen",
	"yes": "Ja",
	"no": "Nein",
	"enable": "Aktivieren",
	"roleOptionsLtlAvailable": "Kann auf die lokale Chronik zugreifen",
	"roleOptionsCanPublicNote": "Kann öffentliche Notizen erstellen",
	"roleOptionsChatAvailability": "Chatten erlauben",
	"readonly": "Nur Lesezugriff",
	"enabled": "Aktiviert",
	"disabled": "Deaktiviert",
	"roleOptionsMentionMax": "Maximale Anzahl von Erwähnungen in einer Notiz",
	"roleOptionsCanInvite": "Erstellung von Einladungscodes für diese Instanz",
	"roleOptionsInviteLimit": "Maximalanzahl an Einladungen",
	"roleOptionsInviteLimitCycle": "Zyklus des Einladungslimits",
	"timeMinute": "Minute(n)",
	"roleOptionsInviteExpirationTime": "Gültigkeitsdauer von Einladungen",
	"roleOptionsCanManageAvatarDecorations": "Profilbilddekorationen verwalten",
	"roleOptionsCanManageCustomEmojis": "Benutzerdefinierte Emojis verwalten",
	"roleOptionsCanSearchNotes": "Nutzung der Notizsuchfunktion",
	"roleOptionsCanSearchUsers": "Nutzung der Benutzersuche",
	"roleOptionsCanUseTranslator": "Verwendung des Übersetzers",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive-Kapazität",
	"roleOptionsMaxFileSize": "Maximale Dateigröße, die hochgeladen werden kann",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Bei einem Reverse Proxy oder einem CDN können andere vorgelagerte Konfigurationswerte vorhanden sein.",
	"roleOptionsUploadableFileTypes": "Hochladbare Dateitypen",
	"roleOptionsUploadableFileTypes_caption": "Gibt die zulässigen MIME-/Dateitypen an. Mehrere MIME-Typen können durch einen Zeilenumbruch getrennt angegeben werden, und Platzhalter können mit einem Sternchen (*) angegeben werden. (z. B. image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Bei manchen Dateien ist es nicht möglich, den Typ zu bestimmen. Um solche Dateien zuzulassen, füge {x} der Spezifikation hinzu.",
	"roleOptionsAlwaysMarkNsfw": "Dateien immer als NSFW markieren",
	"roleOptionsCanUpdateBioMedia": "Kann ein Profil- oder ein Bannerbild bearbeiten",
	"roleOptionsPinMax": "Maximale Anzahl an angehefteten Notizen",
	"roleOptionsAntennaMax": "Maximale Anzahl an Antennen",
	"roleOptionsWordMuteMax": "Maximale Zeichenlänge für Wortstummschaltungen",
	"roleOptionsWebhookMax": "Maximale Anzahl an Webhooks",
	"roleOptionsClipMax": "Maximale Anzahl an Clips",
	"roleOptionsNoteEachClipsMax": "Maximale Anzahl an Notizen innerhalb eines Clips",
	"roleOptionsUserListMax": "Maximale Anzahl an Benutzerlisten",
	"roleOptionsUserEachUserListsMax": "Maximale Anzahl an Benutzern in einer Benutzerliste",
	"roleOptionsCanHideAds": "Kann Werbung ausblenden",
	"roleOptionsAvatarDecorationLimit": "Maximale Anzahl an Profilbilddekorationen, die angebracht werden können",
	"roleOptionsCanImportAntennas": "Importieren von Antennen erlauben",
	"roleOptionsCanImportBlocking": "Importieren von Blockierungen zulassen",
	"roleOptionsCanImportFollowing": "Importieren von Gefolgten zulassen",
	"roleOptionsCanImportMuting": "Importieren von Stummgeschalteten zulassen",
	"roleOptionsCanImportUserLists": "Importieren von Listen erlauben",
	"roleOptionsNoteDraftLimit": "Anzahl der möglichen Entwürfe für serverseitige Notizen",
	"roleOptionsScheduledNoteLimit": "Maximale Anzahl gleichzeitig erstellbarer geplanter Beiträge",
	"roleOptionsWatermarkAvailable": "Kann die Wasserzeichenfunktion verwenden"
}
</locale>

<locale lang="json" locale="en-US">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Yes",
	"no": "No",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"roleOptionsRateLimitFactor": "Limitador",
	"roleOptionsDescriptionOfRateLimitFactor": "Límites más bajos son menos restrictivos, más altos menos restrictivos",
	"roleOptionsGtlAvailable": "Explorar la línea de tiempo global",
	"yes": "Si",
	"no": "No",
	"enable": "Activar",
	"roleOptionsLtlAvailable": "Explorar la línea de tiempo local",
	"roleOptionsCanPublicNote": "Permitir la publicación",
	"roleOptionsChatAvailability": "Permitir Chats",
	"readonly": "Solo Lectura",
	"enabled": "Activado",
	"disabled": "Desactivado",
	"roleOptionsMentionMax": "Número máximo de menciones en una nota",
	"roleOptionsCanInvite": "Puede crear códigos de invitación",
	"roleOptionsInviteLimit": "Límite de invitaciones",
	"roleOptionsInviteLimitCycle": "Enfriamiento del límite de invitaciones",
	"timeMinute": "Minutos",
	"roleOptionsInviteExpirationTime": "Intervalo de caducidad de invitaciones",
	"roleOptionsCanManageAvatarDecorations": "Administrar decoraciones de avatar",
	"roleOptionsCanManageCustomEmojis": "Administrar emojis personalizados",
	"roleOptionsCanSearchNotes": "Uso de la búsqueda de notas",
	"roleOptionsCanSearchUsers": "Uso de la búsqueda de usuarios",
	"roleOptionsCanUseTranslator": "Uso de traductor",
	"roleOptionsCanCreateChannel": "Puede crear canales",
	"roleOptionsDriveCapacity": "Capacidad del drive",
	"roleOptionsMaxFileSize": "Tamaño máximo de archivo que se puede cargar.",
	"roleOptionsMaxFileSize_caption2": "El tamaño máximo de archivo para todo el servidor está fijado en {max}. Para poder subir archivos de mayor tamaño, modifica este valor en el archivo de configuración de Misskey.",
	"roleOptionsMaxFileSize_caption": "Los proxies inversos o las CDN pueden tener diferentes valores de configuración aguas arriba.",
	"roleOptionsUploadableFileTypes": "Tipos de archivos que se pueden cargar.",
	"roleOptionsUploadableFileTypes_caption": "Especifica los tipos MIME/archivos permitidos. Se pueden especificar varios tipos MIME separándolos con una nueva línea, y se pueden especificar comodines con un asterisco (*). (por ejemplo, image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Es posible que no se detecten algunos tipos de archivos. Para permitir estos archivos, añade {x} a la especificación.",
	"roleOptionsAlwaysMarkNsfw": "Siempre marcar archivos como NSFW",
	"roleOptionsCanUpdateBioMedia": "Puede editar un icono o una imagen de fondo (banner)",
	"roleOptionsPinMax": "Máximo de notas fijadas",
	"roleOptionsAntennaMax": "Máximo de antenas",
	"roleOptionsWordMuteMax": "Máximo de caracteres en palabras silenciadas",
	"roleOptionsWebhookMax": "Máximo de Webhooks",
	"roleOptionsClipMax": "Máximo de clips",
	"roleOptionsNoteEachClipsMax": "Máximo de notas con clip",
	"roleOptionsUserListMax": "Máximo de listas de usuarios",
	"roleOptionsUserEachUserListsMax": "Máximo de usuarios en una lista",
	"roleOptionsCanHideAds": "Puede ocultar anuncios",
	"roleOptionsAvatarDecorationLimit": "Número máximo de decoraciones de avatar",
	"roleOptionsCanImportAntennas": "Permitir la importación de antenas",
	"roleOptionsCanImportBlocking": "Permitir la importación de bloqueos",
	"roleOptionsCanImportFollowing": "Permitir la importación de seguidos",
	"roleOptionsCanImportMuting": "Permitir la importación de silenciados",
	"roleOptionsCanImportUserLists": "Permitir la importación de listas",
	"roleOptionsNoteDraftLimit": "Número de posibles borradores de notas del servidor",
	"roleOptionsScheduledNoteLimit": "Máximo número de notas programadas que se pueden crear simultáneamente.",
	"roleOptionsWatermarkAvailable": "Disponibilidad de la función de marca de agua"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Oui",
	"no": "Non",
	"enable": "Activer",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Activé",
	"disabled": "Désactivé",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "min",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Gestion des décorations d'avatar",
	"roleOptionsCanManageCustomEmojis": "Gestion des émojis personnalisés",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Usage de la fonctionnalité de traduction",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Capacité de stockage du Disque",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Nombre maximum d'antennes",
	"roleOptionsWordMuteMax": "Nombre maximal de caractères dans le filtre de mots",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Nombre maximal de décorations d'avatar",
	"roleOptionsCanImportAntennas": "Autoriser l'importation d'antennes",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"roleOptionsRateLimitFactor": "Batas kecepatan",
	"roleOptionsDescriptionOfRateLimitFactor": "Batas kecepatan yang rendah tidak begitu membatasi, batas kecepatan tinggi lebih membatasi. ",
	"roleOptionsGtlAvailable": "Dapat melihat lini masa global",
	"yes": "Iya",
	"no": "Tidak",
	"enable": "Aktifkan",
	"roleOptionsLtlAvailable": "Dapat melihat lini masa lokal",
	"roleOptionsCanPublicNote": "Dapat mengirim catatan publik",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Aktif",
	"disabled": "Nonaktif",
	"roleOptionsMentionMax": "Jumlah maksimum sebutan dalam sebuah catatan",
	"roleOptionsCanInvite": "Dapat membuat kode undangan instansi",
	"roleOptionsInviteLimit": "Batas jumlah undangan",
	"roleOptionsInviteLimitCycle": "Interval Penerbitan Kode Undangan",
	"timeMinute": "menit",
	"roleOptionsInviteExpirationTime": "Interval kedaluwarsa undangan",
	"roleOptionsCanManageAvatarDecorations": "Kelola dekorasi avatar",
	"roleOptionsCanManageCustomEmojis": "Dapat mengelola Emoji kustom",
	"roleOptionsCanSearchNotes": "Penggunaan pencarian catatan",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Penggunaan penerjemah",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Kapasitas Drive",
	"roleOptionsMaxFileSize": "Ukuran berkas maksimal yang dapat diunggah",
	"roleOptionsMaxFileSize_caption2": "Ukuran berkas maksimal di keseluruhan peladen adalah {max}. Untuk memperbolehkan unggahan berkas yang lebih besar dari ini, silahkan mengubah pengaturan ini di dalam berkas pengaturan Misskey.",
	"roleOptionsMaxFileSize_caption": "Proksi terbalik, CDN, dan komponen antarmuka-depan bisa memiliki pengaturan tersendiri.",
	"roleOptionsUploadableFileTypes": "Jenis berkas yang dapat diunggah",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Selalu tandai berkas sebagai NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Jumlah maksimal catatan yang disematkan",
	"roleOptionsAntennaMax": "Jumlah maksimum antena",
	"roleOptionsWordMuteMax": "Jumlah maksimum karakter yang diperbolehkan dalam membisukan kata",
	"roleOptionsWebhookMax": "Jumlah maksimum Webhook",
	"roleOptionsClipMax": "Jumlah maksimum Klip",
	"roleOptionsNoteEachClipsMax": "Jumlah maksimum catatan di dalam Klip",
	"roleOptionsUserListMax": "Jumlah maksimum daftar pengguna",
	"roleOptionsUserEachUserListsMax": "Jumlah maksimum pengguna dalam dsftar pengguna",
	"roleOptionsCanHideAds": "Dapat menyembunyikan iklan",
	"roleOptionsAvatarDecorationLimit": "Jumlah maksimum dekorasi avatar yang dapat diterapkan",
	"roleOptionsCanImportAntennas": "Izinkan mengimpor antena",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Izinkan mengimpor senarai",
	"roleOptionsNoteDraftLimit": "Jumlah dari draf yang dapat dibuat dari sisi peladen",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"roleOptionsRateLimitFactor": "Limite del rapporto",
	"roleOptionsDescriptionOfRateLimitFactor": "I rapporti più bassi sono meno restrittivi, quelli più alti lo sono di più.",
	"roleOptionsGtlAvailable": "Disponibilità della Timeline Federata",
	"yes": "Sì",
	"no": "No",
	"enable": "Abilita",
	"roleOptionsLtlAvailable": "Disponibilità della Timeline Locale",
	"roleOptionsCanPublicNote": "Scrivere Note con Visibilità Pubblica",
	"roleOptionsChatAvailability": "Chat consentita",
	"readonly": "Sola lettura",
	"enabled": "Attivo",
	"disabled": "Inattivo",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Generare codici di invito all'istanza",
	"roleOptionsInviteLimit": "Limite di codici invito",
	"roleOptionsInviteLimitCycle": "Intervallo di emissione del codice di invito",
	"timeMinute": "min",
	"roleOptionsInviteExpirationTime": "Scadenza del codice di invito",
	"roleOptionsCanManageAvatarDecorations": "Gestisce le decorazioni di immagini del profilo",
	"roleOptionsCanManageCustomEmojis": "Gestire le emoji personalizzate",
	"roleOptionsCanSearchNotes": "Ricercare nelle Note",
	"roleOptionsCanSearchUsers": "Può cercare profili",
	"roleOptionsCanUseTranslator": "Tradurre le Note",
	"roleOptionsCanCreateChannel": "Può creare canali",
	"roleOptionsDriveCapacity": "Capienza del Drive",
	"roleOptionsMaxFileSize": "Dimensione massima del file caricabile",
	"roleOptionsMaxFileSize_caption2": "La dimensione massima dei file caricabili sul server è {max}. Per consentire il caricamento di file più grandi, aumenta la dimensione nel file di configurazione Misskey.",
	"roleOptionsMaxFileSize_caption": "Potrebbero esserci altre impostazioni nella fase precedente, come reverse proxy o CDN.",
	"roleOptionsUploadableFileTypes": "Tipi di file caricabili",
	"roleOptionsUploadableFileTypes_caption": "Specifica il tipo MIME. Puoi specificare più valori separandoli andando a capo, oppure indicare caratteri jolly con un asterisco (*). Ad esempio: image/*",
	"roleOptionsUploadableFileTypes_caption2": "A seconda del file, il tipo potrebbe non essere determinato. Se si desidera consentire tali file, aggiungere {x} alla specifica.",
	"roleOptionsAlwaysMarkNsfw": "Impostare sempre come esplicito (NSFW)",
	"roleOptionsCanUpdateBioMedia": "Può aggiornare foto profilo e di testata",
	"roleOptionsPinMax": "Quantità massima di Note in primo piano",
	"roleOptionsAntennaMax": "Quantità massima di Antenne",
	"roleOptionsWordMuteMax": "Lunghezza massima del filtro parole",
	"roleOptionsWebhookMax": "Quantità massima di Webhook",
	"roleOptionsClipMax": "Quantità massima di Clip",
	"roleOptionsNoteEachClipsMax": "Quantità massima di Note nella Clip",
	"roleOptionsUserListMax": "Quantità massima di liste",
	"roleOptionsUserEachUserListsMax": "Quantità massima di profili per lista",
	"roleOptionsCanHideAds": "Nascondere i banner",
	"roleOptionsAvatarDecorationLimit": "Numero massimo di decorazioni foto profilo installabili",
	"roleOptionsCanImportAntennas": "Può importare Antenne",
	"roleOptionsCanImportBlocking": "Può importare Blocchi",
	"roleOptionsCanImportFollowing": "Può importare Following",
	"roleOptionsCanImportMuting": "Può importare Silenziati",
	"roleOptionsCanImportUserLists": "Può importare liste di Profili",
	"roleOptionsNoteDraftLimit": "Numero massimo di Note in bozza, lato server",
	"roleOptionsScheduledNoteLimit": "Quantità di Note pianificabili contemporaneamente",
	"roleOptionsWatermarkAvailable": "Disponibilità della funzione filigrana"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"roleOptionsRateLimitFactor": "レートリミット",
	"roleOptionsDescriptionOfRateLimitFactor": "小さいほど制限が緩和され、大きいほど制限が強化されます。",
	"roleOptionsGtlAvailable": "グローバルタイムラインの閲覧",
	"yes": "はい",
	"no": "いいえ",
	"enable": "有効にする",
	"roleOptionsLtlAvailable": "ローカルタイムラインの閲覧",
	"roleOptionsCanPublicNote": "パブリック投稿の許可",
	"roleOptionsChatAvailability": "ダイレクトメッセージを許可",
	"readonly": "読み取り専用",
	"enabled": "有効",
	"disabled": "無効",
	"roleOptionsMentionMax": "ノート内の最大メンション数",
	"roleOptionsCanInvite": "サーバー招待コードの発行",
	"roleOptionsInviteLimit": "招待コードの作成可能数",
	"roleOptionsInviteLimitCycle": "招待コードの発行間隔",
	"timeMinute": "分",
	"roleOptionsInviteExpirationTime": "招待コードの有効期限",
	"roleOptionsCanManageAvatarDecorations": "アバターデコレーションの管理",
	"roleOptionsCanManageCustomEmojis": "カスタム絵文字の管理",
	"roleOptionsCanSearchNotes": "ノート検索の利用",
	"roleOptionsCanSearchUsers": "ユーザー検索の利用",
	"roleOptionsCanUseTranslator": "翻訳機能の利用",
	"roleOptionsCanCreateChannel": "チャンネルの作成",
	"roleOptionsDriveCapacity": "ドライブ容量",
	"roleOptionsMaxFileSize": "アップロード可能な最大ファイルサイズ",
	"roleOptionsMaxFileSize_caption2": "サーバー全体の最大ファイルサイズ設定は {max} です。これより大きいファイルをアップロードできるようにするには、Misskeyの設定ファイルからこの設定を緩和してください。",
	"roleOptionsMaxFileSize_caption": "リバースプロキシやCDNなど、前段で別の設定値が存在する場合があります。",
	"roleOptionsUploadableFileTypes": "アップロード可能なファイル種別",
	"roleOptionsUploadableFileTypes_caption": "MIMEタイプを指定します。改行で区切って複数指定できるほか、アスタリスク(*)でワイルドカード指定できます。(例: image/*)",
	"roleOptionsUploadableFileTypes_caption2": "ファイルによっては種別を判定できないことがあります。そのようなファイルを許可する場合は {x} を指定に追加してください。",
	"roleOptionsAlwaysMarkNsfw": "ファイルにNSFWを常に付与",
	"roleOptionsCanUpdateBioMedia": "アイコンとバナーの更新を許可",
	"roleOptionsPinMax": "ノートのピン留めの最大数",
	"roleOptionsAntennaMax": "アンテナの作成可能数",
	"roleOptionsWordMuteMax": "ワードミュートの最大文字数",
	"roleOptionsWebhookMax": "Webhookの作成可能数",
	"roleOptionsClipMax": "クリップの作成可能数",
	"roleOptionsNoteEachClipsMax": "クリップ内のノートの最大数",
	"roleOptionsUserListMax": "ユーザーリストの作成可能数",
	"roleOptionsUserEachUserListsMax": "ユーザーリスト内のユーザーの最大数",
	"roleOptionsCanHideAds": "広告の非表示",
	"roleOptionsAvatarDecorationLimit": "アイコンデコレーションの最大取付個数",
	"roleOptionsCanImportAntennas": "アンテナのインポートを許可",
	"roleOptionsCanImportBlocking": "ブロックのインポートを許可",
	"roleOptionsCanImportFollowing": "フォローのインポートを許可",
	"roleOptionsCanImportMuting": "ミュートのインポートを許可",
	"roleOptionsCanImportUserLists": "リストのインポートを許可",
	"roleOptionsNoteDraftLimit": "サーバーサイドのノートの下書きの作成可能数",
	"roleOptionsScheduledNoteLimit": "予約投稿の同時作成可能数",
	"roleOptionsWatermarkAvailable": "ウォーターマーク機能の使用可否"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"roleOptionsRateLimitFactor": "レートリミット",
	"roleOptionsDescriptionOfRateLimitFactor": "ちっちゃいほど制限が緩なって、大きいほど制限されるで。",
	"roleOptionsGtlAvailable": "グローバルタイムライン見る",
	"yes": "ええで",
	"no": "あかん",
	"enable": "有効にするで",
	"roleOptionsLtlAvailable": "ローカルタイムライン見る",
	"roleOptionsCanPublicNote": "パブリック投稿できるか",
	"roleOptionsChatAvailability": "ダイレクトメッセージを許可",
	"readonly": "読み取り専用",
	"enabled": "有効",
	"disabled": "無効",
	"roleOptionsMentionMax": "ノート内の最大メンション数",
	"roleOptionsCanInvite": "サーバー招待コード作る",
	"roleOptionsInviteLimit": "招待コード作れる数",
	"roleOptionsInviteLimitCycle": "招待コードの作れる間隔",
	"timeMinute": "分",
	"roleOptionsInviteExpirationTime": "招待コードの期限",
	"roleOptionsCanManageAvatarDecorations": "アバターを飾るモンの管理",
	"roleOptionsCanManageCustomEmojis": "カスタム絵文字の管理",
	"roleOptionsCanSearchNotes": "ノート探せるかどうか",
	"roleOptionsCanSearchUsers": "ユーザー検索の利用",
	"roleOptionsCanUseTranslator": "翻訳使えるかどうか",
	"roleOptionsCanCreateChannel": "チャンネルの作成",
	"roleOptionsDriveCapacity": "ドライブ容量",
	"roleOptionsMaxFileSize": "アップロード可能な最大ファイルサイズ",
	"roleOptionsMaxFileSize_caption2": "サーバー全体の最大ファイルサイズ設定は {max} です。これより大きいファイルをアップロードできるようにするには、Misskeyの設定ファイルからこの設定を緩和してください。",
	"roleOptionsMaxFileSize_caption": "リバースプロキシやCDNなど、前段で別の設定値が存在する場合があります。",
	"roleOptionsUploadableFileTypes": "アップロード可能なファイル種別",
	"roleOptionsUploadableFileTypes_caption": "MIMEタイプを指定してや。改行で区切って複数指定もできるし、アスタリスク(*)でワイルドカード指定もできるで。(例: image/*)",
	"roleOptionsUploadableFileTypes_caption2": "ファイルによっては種別がわからんこともあるで。そないなファイルを許可するんやったら {x} を指定に追加してな。",
	"roleOptionsAlwaysMarkNsfw": "勝手にファイルにNSFWをくっつける",
	"roleOptionsCanUpdateBioMedia": "アイコンとバナーの更新を許可",
	"roleOptionsPinMax": "ノートピン留めできる数",
	"roleOptionsAntennaMax": "アンテナ作れる数",
	"roleOptionsWordMuteMax": "ワードミュートの最大文字数",
	"roleOptionsWebhookMax": "Webhook作れる数",
	"roleOptionsClipMax": "クリップ作れる数",
	"roleOptionsNoteEachClipsMax": "クリップの中にノート作れる数",
	"roleOptionsUserListMax": "ユーザーリスト作れる数",
	"roleOptionsUserEachUserListsMax": "ユーザーリスト内のユーザーの最大数",
	"roleOptionsCanHideAds": "広告映さへん",
	"roleOptionsAvatarDecorationLimit": "アイコンデコのいっちばんつけれる数",
	"roleOptionsCanImportAntennas": "アンテナのインポートを許す",
	"roleOptionsCanImportBlocking": "ブロックのインポートを許す",
	"roleOptionsCanImportFollowing": "フォローのインポートを許す",
	"roleOptionsCanImportMuting": "ミュートのインポートを許す",
	"roleOptionsCanImportUserLists": "リストのインポートを許す",
	"roleOptionsNoteDraftLimit": "サーバーサイドのノートの下書きの作成可能数",
	"roleOptionsScheduledNoteLimit": "予約投稿の同時作成可能数",
	"roleOptionsWatermarkAvailable": "ウォーターマーク機能の使用可否"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Yes",
	"no": "No",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Yes",
	"no": "No",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"roleOptionsRateLimitFactor": "요청 빈도 제한",
	"roleOptionsDescriptionOfRateLimitFactor": "작을수록 제한이 완화되고, 클수록 제한이 강화됩니다.",
	"roleOptionsGtlAvailable": "글로벌 타임라인 보이기",
	"yes": "예",
	"no": "아니오",
	"enable": "사용",
	"roleOptionsLtlAvailable": "로컬 타임라인 보이기",
	"roleOptionsCanPublicNote": "공개 노트 허용",
	"roleOptionsChatAvailability": "채팅을 허락",
	"readonly": "읽기 전용",
	"enabled": "활성화",
	"disabled": "비활성화",
	"roleOptionsMentionMax": "노트에 넣을 수 있는 멘션 수",
	"roleOptionsCanInvite": "서버 초대 코드 발행",
	"roleOptionsInviteLimit": "초대 한도",
	"roleOptionsInviteLimitCycle": "초대 발급 간격",
	"timeMinute": "분",
	"roleOptionsInviteExpirationTime": "초대 만료 기간",
	"roleOptionsCanManageAvatarDecorations": "아바타 꾸미기 관리",
	"roleOptionsCanManageCustomEmojis": "커스텀 이모지 관리",
	"roleOptionsCanSearchNotes": "노트 검색 이용 가능 여부",
	"roleOptionsCanSearchUsers": "유저 검색 이용",
	"roleOptionsCanUseTranslator": "번역 기능의 사용",
	"roleOptionsCanCreateChannel": "패널 생성",
	"roleOptionsDriveCapacity": "드라이브 용량",
	"roleOptionsMaxFileSize": "업로드 가능한 최대 파일 크기",
	"roleOptionsMaxFileSize_caption2": "서버 전체의 최대 파일 크기 설정은 {max}입니다. 이보다 큰 파일을 업로드하려면 Misskey 설정 파일에서 이 설정을 늘려주십시오.",
	"roleOptionsMaxFileSize_caption": "리버스 프록시나 CDN 등 전단에서 다른 설정값이 존재하는 경우가 있습니다.",
	"roleOptionsUploadableFileTypes": "업로드 가능한 파일 유형",
	"roleOptionsUploadableFileTypes_caption": "MIME 유형을 ",
	"roleOptionsUploadableFileTypes_caption2": "파일에 따라서는 유형을 검사하지 못하는 경우가 있습니다. 그러한 파일을 허가하는 경우에는 {x}를 지정으로 추가해주십시오.",
	"roleOptionsAlwaysMarkNsfw": "파일을 항상 NSFW로 지정",
	"roleOptionsCanUpdateBioMedia": "아바타 및 배너 이미지 변경 허용",
	"roleOptionsPinMax": "고정할 수 있는 노트 수",
	"roleOptionsAntennaMax": "만들 수 있는 안테나 수",
	"roleOptionsWordMuteMax": "단어 뮤트할 수 있는 문자 수",
	"roleOptionsWebhookMax": "만들 수 있는 Webhook 수",
	"roleOptionsClipMax": "만들 수 있는 클립 수",
	"roleOptionsNoteEachClipsMax": "클립에 넣을 수 있는 노트 수",
	"roleOptionsUserListMax": "만들 수 있는 유저 리스트 수",
	"roleOptionsUserEachUserListsMax": "유저 리스트에 넣을 수 있는 유저 수",
	"roleOptionsCanHideAds": "광고 숨기기",
	"roleOptionsAvatarDecorationLimit": "아바타 장식의 최대 붙임 개수",
	"roleOptionsCanImportAntennas": "안테나 가져오기 허용",
	"roleOptionsCanImportBlocking": "차단 목록 가져오기 허용",
	"roleOptionsCanImportFollowing": "팔로우 가져오기 허용",
	"roleOptionsCanImportMuting": "뮤트 목록 가져오기 허용",
	"roleOptionsCanImportUserLists": "리스트 목록 가져오기 허용",
	"roleOptionsNoteDraftLimit": "서버측 노트 초안 작성 가능 수",
	"roleOptionsScheduledNoteLimit": "예약 게시물의 동시 작성 가능 수",
	"roleOptionsWatermarkAvailable": "워터마크 기능의 사용 여부"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Ja",
	"no": "Nee",
	"enable": "Inschakelen",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Ingeschakeld",
	"disabled": "Uitgeschakeld",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Ja",
	"no": "Nei",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minutter",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Tak",
	"no": "Nie",
	"enable": "Włącz",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Właczono",
	"disabled": "Wyłączono",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "minuta",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Zarządzaj dekoracjami awatara",
	"roleOptionsCanManageCustomEmojis": "Zarządzaj niestandardowymi Emoji",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"roleOptionsRateLimitFactor": "Taxa de limitação",
	"roleOptionsDescriptionOfRateLimitFactor": "Valores menores são menos restritivos, valores maiores são mais restritivos.",
	"roleOptionsGtlAvailable": "Visualizar Linha do Tempo Global",
	"yes": "Sim",
	"no": "Não",
	"enable": "Habilitar",
	"roleOptionsLtlAvailable": "Visualizar Linha do Tempo Local",
	"roleOptionsCanPublicNote": "Permitir postagem pública",
	"roleOptionsChatAvailability": "Permitir Conversas",
	"readonly": "Ler apenas",
	"enabled": "Ativado",
	"disabled": "Desativado",
	"roleOptionsMentionMax": "Número máximo de menções em uma nota",
	"roleOptionsCanInvite": "Permitir a criação de códigos de convites para a instância",
	"roleOptionsInviteLimit": "Limite de códigos de convite",
	"roleOptionsInviteLimitCycle": "Intervalo de emissão do código de convite",
	"timeMinute": "Minuto(s)",
	"roleOptionsInviteExpirationTime": "Prazo de validade do código de convite",
	"roleOptionsCanManageAvatarDecorations": "Gerenciar decorações de avatar",
	"roleOptionsCanManageCustomEmojis": "Permitir gerenciar emojis personalizados",
	"roleOptionsCanSearchNotes": "Permitir a busca de notas",
	"roleOptionsCanSearchUsers": "Busca de usuário",
	"roleOptionsCanUseTranslator": "Uso do tradutor",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Capacidade do drive",
	"roleOptionsMaxFileSize": "Tamanho máximo de envio de arquivos",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Tipos de arquivo enviáveis",
	"roleOptionsUploadableFileTypes_caption": "Especifica tipos MIME permitidos. Múltiplos tipos MIME podem ser especificados separando-os por linha. Curingas podem ser especificados com um asterisco (*). (exemplo, image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Alguns tipos de arquivos podem não ser detectados. Para permiti-los, adicione {x} à especificação.",
	"roleOptionsAlwaysMarkNsfw": "Sempre marcar arquivos como NSFW",
	"roleOptionsCanUpdateBioMedia": "Permitir a edição de ícone ou imagem do banner.",
	"roleOptionsPinMax": "Número máximo de notas fixadas",
	"roleOptionsAntennaMax": "Número máximo de antenas",
	"roleOptionsWordMuteMax": "Número máximo de caracteres nas palavras silenciadas",
	"roleOptionsWebhookMax": "Número máximo de webhooks",
	"roleOptionsClipMax": "Número máximo de clipes",
	"roleOptionsNoteEachClipsMax": "Número máximo de notas em um clipe",
	"roleOptionsUserListMax": "Número máximo de listas de usuários",
	"roleOptionsUserEachUserListsMax": "Número máximo de usuários em uma lista",
	"roleOptionsCanHideAds": "Permitir ocultar anúncios",
	"roleOptionsAvatarDecorationLimit": "Número máximo de decorações de avatar que podem ser aplicadas",
	"roleOptionsCanImportAntennas": "Permitir importação de antenas",
	"roleOptionsCanImportBlocking": "Permitir importação de bloqueios",
	"roleOptionsCanImportFollowing": "Permitir importação de usuários seguidos",
	"roleOptionsCanImportMuting": "Permitir importação de silenciamentos",
	"roleOptionsCanImportUserLists": "Permitir importação de listas",
	"roleOptionsNoteDraftLimit": "Limite de rascunhos possíveis",
	"roleOptionsScheduledNoteLimit": "Número máximo de notas agendadas simultâneas",
	"roleOptionsWatermarkAvailable": "Disponibilidade da função de marca d'água"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"roleOptionsRateLimitFactor": "Ограничение активности",
	"roleOptionsDescriptionOfRateLimitFactor": "Меньшее значение — слабые ограничения, большее — сильные",
	"roleOptionsGtlAvailable": "Может просматривать глобальную ленту",
	"yes": "Да",
	"no": "Нет",
	"enable": "Включить",
	"roleOptionsLtlAvailable": "Может просматривать местную ленту",
	"roleOptionsCanPublicNote": "Может публиковать общедоступные заметки",
	"roleOptionsChatAvailability": "Чаты",
	"readonly": "Только для чтения",
	"enabled": "Вкл.",
	"disabled": "Откл.",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Может создавать пригласительные коды",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "мин",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Управление украшениями аватара",
	"roleOptionsCanManageCustomEmojis": "Управлять пользовательскими эмодзи",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Доступное пространство на «диске»",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Всегда отмечать файлы как «не для всех»",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Доступное количество закреплённых заметок",
	"roleOptionsAntennaMax": "Доступное количество антенн",
	"roleOptionsWordMuteMax": "Доступное количество знаков в списке скрытия слов",
	"roleOptionsWebhookMax": "Максимум web-хуков",
	"roleOptionsClipMax": "Максимальное количество подборок",
	"roleOptionsNoteEachClipsMax": "Максимальное количество заметок в подборке",
	"roleOptionsUserListMax": "Максимальное количество списков аккаунтов",
	"roleOptionsUserEachUserListsMax": "Максимальное количество аккаунтов в списке",
	"roleOptionsCanHideAds": "Может скрыть рекламу",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Можно импортировать подписчиков",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Áno",
	"no": "Nie",
	"enable": "Povoliť",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Zapnuté",
	"disabled": "Vypnuté",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "min",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"roleOptionsRateLimitFactor": "อัตราการจำกัด",
	"roleOptionsDescriptionOfRateLimitFactor": "ยิ่งตัวเลขน้อยก็ยิ่งจำกัดน้อย ยิ่งมากก็ยิ่งเข้มงวดมากขึ้น",
	"roleOptionsGtlAvailable": "สามารถดูไทม์ไลน์ทั่วโลกได้",
	"yes": "ใช่",
	"no": "ไม่",
	"enable": "เปิดใช้งาน",
	"roleOptionsLtlAvailable": "สามารถดูไทม์ไลน์ท้องถิ่นได้",
	"roleOptionsCanPublicNote": "สามารถโพสต์แบบสาธารณะ",
	"roleOptionsChatAvailability": "อนุญาตให้แชต",
	"readonly": "อ่านได้อย่างเดียว",
	"enabled": "เปิดใช้งาน",
	"disabled": "ปิดการใช้งาน",
	"roleOptionsMentionMax": "จำนวนการกล่าวถึงสูงสุดต่อโน้ต",
	"roleOptionsCanInvite": "สร้างรหัสเชิญเข้าเซิร์ฟเวอร์",
	"roleOptionsInviteLimit": "จำกัดการเชิญ",
	"roleOptionsInviteLimitCycle": "คูลดาวน์ในการเชิญ",
	"timeMinute": "นาที",
	"roleOptionsInviteExpirationTime": "วันหมดอายุของรหัสการเชิญ",
	"roleOptionsCanManageAvatarDecorations": "จัดการตกแต่งอวตาร",
	"roleOptionsCanManageCustomEmojis": "จัดการเอโมจิที่กำหนดเอง",
	"roleOptionsCanSearchNotes": "การใช้การค้นหาโน้ต",
	"roleOptionsCanSearchUsers": "ค้นหาผู้ใช้",
	"roleOptionsCanUseTranslator": "การใช้งานแปล",
	"roleOptionsCanCreateChannel": "สร้างช่องใหม่",
	"roleOptionsDriveCapacity": "ความจุของไดรฟ์",
	"roleOptionsMaxFileSize": "ขนาดไฟล์สูงสุดที่สามารถอัปโหลดได้",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "รีเวิร์สพร็อกซี, CDN และคอมโพเนนต์หน้าบ้านอื่นๆ อาจมีค่าการตั้งค่าของตนเอง",
	"roleOptionsUploadableFileTypes": "ประเภทไฟล์ที่สามารถอัปโหลดได้",
	"roleOptionsUploadableFileTypes_caption": "สามารถระบุ MIME type ได้ โดยใช้การขึ้นบรรทัดใหม่เพื่อแยกหลายรายการ และสามารถใช้ดอกจัน (*) เพื่อระบุแบบไวลด์การ์ดได้ (เช่น: image/*)",
	"roleOptionsUploadableFileTypes_caption2": "ไฟล์บางประเภทอาจไม่สามารถระบุชนิดได้ หากต้องการอนุญาตไฟล์ลักษณะนั้น กรุณาเพิ่ม {x} ลงในรายการที่อนุญาต",
	"roleOptionsAlwaysMarkNsfw": "ทำเครื่องหมายไฟล์ว่าเป็น NSFW เสมอ",
	"roleOptionsCanUpdateBioMedia": "อนุญาตให้เปลี่ยนไอคอนประจำตัวและแบนเนอร์",
	"roleOptionsPinMax": "จํานวนสูงสุดของโน้ตที่ปักหมุดไว้",
	"roleOptionsAntennaMax": "จำนวนสูงสุดของเสาอากาศ",
	"roleOptionsWordMuteMax": "จำนวนอักขระสูงสุดที่อนุญาตในการปิดเสียงคำ",
	"roleOptionsWebhookMax": "จำนวนเว็บฮุคสูงสุด",
	"roleOptionsClipMax": "จำนวนคลิปสูงสุด",
	"roleOptionsNoteEachClipsMax": "จำนวนโน้ตสูงสุดภายในคลิป",
	"roleOptionsUserListMax": "จำนวนรายชื่อผู้ใช้สูงสุด",
	"roleOptionsUserEachUserListsMax": "จำนวนผู้ใช้สูงสุดภายในรายการผู้ใช้",
	"roleOptionsCanHideAds": "ซ่อนโฆษณา",
	"roleOptionsAvatarDecorationLimit": "จำนวนของตกแต่งไอคอนสูงสุดที่สามารถติดตั้งได้",
	"roleOptionsCanImportAntennas": "อนุญาตให้นำเข้าเสาอากาศ",
	"roleOptionsCanImportBlocking": "อนุญาตให้นำเข้าการบล็อก",
	"roleOptionsCanImportFollowing": "อนุญาตให้นำเข้ารายการต่อไปนี้",
	"roleOptionsCanImportMuting": "อนุญาตให้นำเข้าการปิดเสียง",
	"roleOptionsCanImportUserLists": "อนุญาตให้นำเข้ารายการ",
	"roleOptionsNoteDraftLimit": "จำนวนโน้ตฉบับร่างที่สามารถสร้างได้บนฝั่งเซิร์ฟเวอร์",
	"roleOptionsScheduledNoteLimit": "จำนวนโพสต์กำหนดเวลาที่สร้างพร้อมกันได้",
	"roleOptionsWatermarkAvailable": "มีฟังก์ชั่นลายน้ำให้เลือกใช้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"roleOptionsRateLimitFactor": "Hız Sınırı",
	"roleOptionsDescriptionOfRateLimitFactor": "Daha düşük oran sınırları daha az kısıtlayıcıdır, daha yüksek olanlar ise daha kısıtlayıcıdır.",
	"roleOptionsGtlAvailable": "Global Pano'yu görüntüleyebilir",
	"yes": "Evet",
	"no": "Hayır",
	"enable": "Etkin",
	"roleOptionsLtlAvailable": "Yerel panoyu görüntüleyebilir",
	"roleOptionsCanPublicNote": "Halka açık notlar gönderebilir",
	"roleOptionsChatAvailability": "Sohbeti İzin Ver",
	"readonly": "Sadece okuma",
	"enabled": "Aktif",
	"disabled": "Devre Dışı",
	"roleOptionsMentionMax": "Bir notta maksimum bahsetme sayısı",
	"roleOptionsCanInvite": "Sunucu davet kodları oluşturabilir",
	"roleOptionsInviteLimit": "Davet sınırı",
	"roleOptionsInviteLimitCycle": "Davet sınırı bekleme süresi",
	"timeMinute": "Dakika(lar)",
	"roleOptionsInviteExpirationTime": "Davet süresi dolma aralığı",
	"roleOptionsCanManageAvatarDecorations": "Avatar süslerini yönet",
	"roleOptionsCanManageCustomEmojis": "Özel emojileri yönetebilir",
	"roleOptionsCanSearchNotes": "Not arama kullanımı",
	"roleOptionsCanSearchUsers": "Kullanıcı arama",
	"roleOptionsCanUseTranslator": "Çevirmen kullanımı",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive kapasitesi",
	"roleOptionsMaxFileSize": "Yükleyebileceğin maksimum dosya boyutu",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Önceki aşamada ters proxy veya CDN gibi başka yapılandırma ayarları da olabilir.",
	"roleOptionsUploadableFileTypes": "Yüklenebilir dosya türleri",
	"roleOptionsUploadableFileTypes_caption": "İzin verilen MIME/dosya türlerini belirtir. Birden fazla MIME türü, yeni bir satırla ayırarak belirtilebilir ve joker karakterler yıldız işareti (*) ile belirtilebilir. (örneğin, image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Bazı dosya türleri algılanamayabilir. Bu tür dosyalara izin vermek için, spesifikasyona {x} ekle.",
	"roleOptionsAlwaysMarkNsfw": "Dosyaları her zaman NSFW olarak işaretle",
	"roleOptionsCanUpdateBioMedia": "Bir simge veya banner görüntüsünü düzenleyebilir",
	"roleOptionsPinMax": "Sabitlenmiş notların maksimum sayısı",
	"roleOptionsAntennaMax": "Maksimum anten sayısı",
	"roleOptionsWordMuteMax": "Kelime sessizlerinde izin verilen maksimum karakter sayısı",
	"roleOptionsWebhookMax": "Maksimum Webhook sayısı",
	"roleOptionsClipMax": "Maksimum klip sayısı",
	"roleOptionsNoteEachClipsMax": "Bir klip içindeki maksimum not sayısı",
	"roleOptionsUserListMax": "Maksimum kullanıcı listesi sayısı",
	"roleOptionsUserEachUserListsMax": "Kullanıcı listesindeki maksimum kullanıcı sayısı",
	"roleOptionsCanHideAds": "Reklamları gizleyebilir",
	"roleOptionsAvatarDecorationLimit": "Maksimum avatar süsü sayısı",
	"roleOptionsCanImportAntennas": "Antenlerin içe aktarılmasına izin ver",
	"roleOptionsCanImportBlocking": "Engellemeyi içe aktarmaya izin ver",
	"roleOptionsCanImportFollowing": "Aşağıdakilerin içe aktarılmasına izin ver",
	"roleOptionsCanImportMuting": "Sessize alma özelliğini içe aktarmaya izin ver",
	"roleOptionsCanImportUserLists": "Listelerin içe aktarılmasına izin ver",
	"roleOptionsNoteDraftLimit": "Sunucu notlarının olası taslak sayısı",
	"roleOptionsScheduledNoteLimit": "Aynı anda oluşturulabilecek planlanmış gönderi sayısı",
	"roleOptionsWatermarkAvailable": "Filigran işlevinin kullanılabilirliği"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Yes",
	"no": "No",
	"enable": "Enable",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Enabled",
	"disabled": "Disabled",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "Minute(s)",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Manage avatar decorations",
	"roleOptionsCanManageCustomEmojis": "Can manage custom emojis",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Can view the global timeline",
	"yes": "Так",
	"no": "Ні",
	"enable": "Увімкнути",
	"roleOptionsLtlAvailable": "Can view the local timeline",
	"roleOptionsCanPublicNote": "Can send public notes",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Лише для читання",
	"enabled": "Увімкнено",
	"disabled": "Вимкнено",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "х",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Керувати прикрасами аватара",
	"roleOptionsCanManageCustomEmojis": "Керування користувацькими емодзі",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Drive capacity",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Maximum number of pinned notes",
	"roleOptionsAntennaMax": "Maximum number of antennas",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Can hide ads",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"roleOptionsRateLimitFactor": "Rate limit",
	"roleOptionsDescriptionOfRateLimitFactor": "Lower rate limits are less restrictive, higher ones more restrictive. ",
	"roleOptionsGtlAvailable": "Xem Timeline xã hội",
	"yes": "Đồng ý",
	"no": "Từ chối",
	"enable": "Bật",
	"roleOptionsLtlAvailable": "Xem Timeline trong máy chủ này",
	"roleOptionsCanPublicNote": "Cho phép đăng bài công khai",
	"roleOptionsChatAvailability": "Chat",
	"readonly": "Read only",
	"enabled": "Đã bật",
	"disabled": "Đã tắt",
	"roleOptionsMentionMax": "Maximum number of mentions in a note",
	"roleOptionsCanInvite": "Can create instance invite codes",
	"roleOptionsInviteLimit": "Invite limit",
	"roleOptionsInviteLimitCycle": "Invite limit cooldown",
	"timeMinute": "phút",
	"roleOptionsInviteExpirationTime": "Invite expiration interval",
	"roleOptionsCanManageAvatarDecorations": "Quản lý trang trí ảnh đại diện",
	"roleOptionsCanManageCustomEmojis": "Quản lý CustomEmoji",
	"roleOptionsCanSearchNotes": "Usage of note search",
	"roleOptionsCanSearchUsers": "User search",
	"roleOptionsCanUseTranslator": "Translator usage",
	"roleOptionsCanCreateChannel": "Allow creating channels",
	"roleOptionsDriveCapacity": "Dữ liệu Drive",
	"roleOptionsMaxFileSize": "Upload-able max file size",
	"roleOptionsMaxFileSize_caption2": "The maximum file size setting for the entire server is {max}. To allow uploading files larger than this, please adjust this setting in the Misskey configuration file.",
	"roleOptionsMaxFileSize_caption": "Reverse proxies, CDNs, and other front-end components may have their own configuration settings.",
	"roleOptionsUploadableFileTypes": "Uploadable file types",
	"roleOptionsUploadableFileTypes_caption": "Specifies the allowed MIME/file types. Multiple MIME types can be specified by separating them with a new line, and wildcards can be specified with an asterisk (*). (e.g., image/*)",
	"roleOptionsUploadableFileTypes_caption2": "Some files types might fail to be detected. To allow such files, add {x} to the specification.",
	"roleOptionsAlwaysMarkNsfw": "Always mark files as NSFW",
	"roleOptionsCanUpdateBioMedia": "Can edit an icon or a banner image",
	"roleOptionsPinMax": "Giới hạn ghim bài viết",
	"roleOptionsAntennaMax": "Giới hạn tạo ăng ten",
	"roleOptionsWordMuteMax": "Maximum number of characters allowed in word mutes",
	"roleOptionsWebhookMax": "Maximum number of Webhooks",
	"roleOptionsClipMax": "Maximum number of Clips",
	"roleOptionsNoteEachClipsMax": "Maximum number of notes within a clip",
	"roleOptionsUserListMax": "Maximum number of user lists",
	"roleOptionsUserEachUserListsMax": "Maximum number of users within a user list",
	"roleOptionsCanHideAds": "Tắt quảng cáo",
	"roleOptionsAvatarDecorationLimit": "Maximum number of avatar decorations",
	"roleOptionsCanImportAntennas": "Can import antennas",
	"roleOptionsCanImportBlocking": "Can import blocking",
	"roleOptionsCanImportFollowing": "Can import following",
	"roleOptionsCanImportMuting": "Can import muting",
	"roleOptionsCanImportUserLists": "Can import lists",
	"roleOptionsNoteDraftLimit": "Number of possible drafts of server notes",
	"roleOptionsScheduledNoteLimit": "Maximum number of simultaneous scheduled notes",
	"roleOptionsWatermarkAvailable": "Watermark function"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"roleOptionsRateLimitFactor": "速率限制",
	"roleOptionsDescriptionOfRateLimitFactor": "值越小限制越少，值越大限制越多。",
	"roleOptionsGtlAvailable": "查看全局时间线",
	"yes": "是",
	"no": "否",
	"enable": "启用",
	"roleOptionsLtlAvailable": "查看本地时间线",
	"roleOptionsCanPublicNote": "允许公开发帖",
	"roleOptionsChatAvailability": "允许私信",
	"readonly": "只读",
	"enabled": "已启用",
	"disabled": "已禁用 ",
	"roleOptionsMentionMax": "帖子内最多提及数",
	"roleOptionsCanInvite": "发放服务器邀请码",
	"roleOptionsInviteLimit": "可生成邀请码的数量",
	"roleOptionsInviteLimitCycle": "邀请码的发行间隔",
	"timeMinute": "分钟",
	"roleOptionsInviteExpirationTime": "邀请码的有效日期",
	"roleOptionsCanManageAvatarDecorations": "管理头像挂件",
	"roleOptionsCanManageCustomEmojis": "管理自定义表情符号",
	"roleOptionsCanSearchNotes": "是否可以搜索帖子",
	"roleOptionsCanSearchUsers": "使用用户检索",
	"roleOptionsCanUseTranslator": "使用翻译功能",
	"roleOptionsCanCreateChannel": "创建频道",
	"roleOptionsDriveCapacity": "网盘容量",
	"roleOptionsMaxFileSize": "可上传的最大文件大小",
	"roleOptionsMaxFileSize_caption2": "服务器整体的最大文件大小限制为 {max}。若要允许上传大于此限制的文件，请在 Misskey 配置文件中放宽此设置。",
	"roleOptionsMaxFileSize_caption": "可能在反向代理或 CDN 等前端存在其它设定值。",
	"roleOptionsUploadableFileTypes": "可上传的文件类型",
	"roleOptionsUploadableFileTypes_caption": "指定 MIME 类型。可用换行指定多个类型，也可以用星号（*）作为通配符。（如 image/*）",
	"roleOptionsUploadableFileTypes_caption2": "文件根据文件的不同，可能无法判断其类型。若要允许此类文件，请在指定中添加 {x}。",
	"roleOptionsAlwaysMarkNsfw": "总是将文件标记为 NSFW",
	"roleOptionsCanUpdateBioMedia": "允许更新头像和横幅",
	"roleOptionsPinMax": "帖子置顶数量限制",
	"roleOptionsAntennaMax": "可创建的天线数量",
	"roleOptionsWordMuteMax": "折叠词的字数限制",
	"roleOptionsWebhookMax": "可创建的 Webhook 的数量",
	"roleOptionsClipMax": "可创建的便签数量",
	"roleOptionsNoteEachClipsMax": "便签内贴文的最大数量",
	"roleOptionsUserListMax": "可创建的用户列表数量",
	"roleOptionsUserEachUserListsMax": "单个用户列表内用户数量限制",
	"roleOptionsCanHideAds": "可以隐藏广告",
	"roleOptionsAvatarDecorationLimit": "可添加头像挂件的最大个数",
	"roleOptionsCanImportAntennas": "允许导入天线",
	"roleOptionsCanImportBlocking": "允许导入屏蔽列表",
	"roleOptionsCanImportFollowing": "允许导入关注列表",
	"roleOptionsCanImportMuting": "允许导入隐藏列表",
	"roleOptionsCanImportUserLists": "允许导入用户列表",
	"roleOptionsNoteDraftLimit": "可在服务器上创建的草稿数量",
	"roleOptionsScheduledNoteLimit": "可同时创建的定时帖子数量",
	"roleOptionsWatermarkAvailable": "能否使用水印功能"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"roleOptionsRateLimitFactor": "速率限制",
	"roleOptionsDescriptionOfRateLimitFactor": "值越小限制越少，值越大限制越多。",
	"roleOptionsGtlAvailable": "瀏覽全域時間軸",
	"yes": "是",
	"no": "否",
	"enable": "啟用",
	"roleOptionsLtlAvailable": "瀏覽本地時間軸",
	"roleOptionsCanPublicNote": "允許公開貼文",
	"roleOptionsChatAvailability": "允許聊天",
	"readonly": "唯讀",
	"enabled": "已啟用",
	"disabled": "已停用",
	"roleOptionsMentionMax": "貼文內的最大提及數",
	"roleOptionsCanInvite": "發行伺服器邀請碼",
	"roleOptionsInviteLimit": "可建立邀請碼的數量",
	"roleOptionsInviteLimitCycle": "邀請碼的發放間隔",
	"timeMinute": "分鐘",
	"roleOptionsInviteExpirationTime": "邀請碼的有效日期",
	"roleOptionsCanManageAvatarDecorations": "管理頭像裝飾",
	"roleOptionsCanManageCustomEmojis": "管理自訂表情符號",
	"roleOptionsCanSearchNotes": "可否搜尋貼文",
	"roleOptionsCanSearchUsers": "可使用使用者搜尋功能",
	"roleOptionsCanUseTranslator": "使用翻譯功能",
	"roleOptionsCanCreateChannel": "建立頻道",
	"roleOptionsDriveCapacity": "雲端硬碟容量",
	"roleOptionsMaxFileSize": "可上傳的最大檔案大小",
	"roleOptionsMaxFileSize_caption2": "伺服器整體的最大檔案大小設定為 {max}。若要允許上傳更大的檔案，請在 Misskey 設定檔中放寬此設定。",
	"roleOptionsMaxFileSize_caption": "前端可能還有其他設定值，例如反向代理或 CDN。",
	"roleOptionsUploadableFileTypes": "可上傳的檔案類型",
	"roleOptionsUploadableFileTypes_caption": "請指定 MIME 類型。可以用換行區隔多個類型，也可以使用星號（*）作為萬用字元進行指定。（例如：image/*）\n",
	"roleOptionsUploadableFileTypes_caption2": "有些檔案可能無法判斷其類型。若要允許這類檔案，請在指定中加入 {x}。",
	"roleOptionsAlwaysMarkNsfw": "總是將檔案標記為NSFW",
	"roleOptionsCanUpdateBioMedia": "允許更新大頭貼和橫幅",
	"roleOptionsPinMax": "置頂貼文的最大數量",
	"roleOptionsAntennaMax": "可建立的天線數量",
	"roleOptionsWordMuteMax": "靜音文字的最大字數",
	"roleOptionsWebhookMax": "可建立的 Webhook 數量",
	"roleOptionsClipMax": "可建立的摘錄數量",
	"roleOptionsNoteEachClipsMax": "摘錄內貼文的最大數量",
	"roleOptionsUserListMax": "可建立的使用者清單數量",
	"roleOptionsUserEachUserListsMax": "使用者清單內使用者的最大數量",
	"roleOptionsCanHideAds": "不顯示廣告",
	"roleOptionsAvatarDecorationLimit": "頭像可掛上的最大裝飾數量",
	"roleOptionsCanImportAntennas": "允許匯入天線",
	"roleOptionsCanImportBlocking": "允許匯入封鎖名單",
	"roleOptionsCanImportFollowing": "允許匯入追隨名單",
	"roleOptionsCanImportMuting": "允許匯入靜音名單",
	"roleOptionsCanImportUserLists": "允許匯入清單",
	"roleOptionsNoteDraftLimit": "伺服器端可建立的貼文草稿數量上限\n",
	"roleOptionsScheduledNoteLimit": "同時建立的排定發布數量",
	"roleOptionsWatermarkAvailable": "浮水印功能是否可用"
}
</locale>

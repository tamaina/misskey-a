<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" mode="out-in">
		<MkLoading v-if="fetching"/>
		<div v-else-if="stats != null" :class="$style.root">
			<div class="item _panel users">
				<div class="icon"><i class="ti ti-users"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.originalUsersCount" style="margin-right: 0.5em;"/>
						<MkNumberDiff v-if="usersComparedToThePrevDay != null" v-tooltip="$locale.sfc.dayOverDayChanges" class="diff" :value="usersComparedToThePrevDay"></MkNumberDiff>
					</div>
					<div class="label">Users</div>
				</div>
			</div>
			<div class="item _panel notes">
				<div class="icon"><i class="ti ti-pencil"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.originalNotesCount" style="margin-right: 0.5em;"/>
						<MkNumberDiff v-if="notesComparedToThePrevDay != null" v-tooltip="$locale.sfc.dayOverDayChanges" class="diff" :value="notesComparedToThePrevDay"></MkNumberDiff>
					</div>
					<div class="label">Notes</div>
				</div>
			</div>
			<div class="item _panel instances">
				<div class="icon"><i class="ti ti-planet"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="stats.instances" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Instances</div>
				</div>
			</div>
			<div class="item _panel emojis">
				<div class="icon"><i class="ti ti-icons"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="customEmojis.length" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Custom emojis</div>
				</div>
			</div>
			<div class="item _panel online">
				<div class="icon"><i class="ti ti-access-point"></i></div>
				<div class="body">
					<div class="value">
						<MkNumber :value="onlineUsersCount" style="margin-right: 0.5em;"/>
					</div>
					<div class="label">Online</div>
				</div>
			</div>
		</div>
		<MkError v-else/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi, misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import MkNumberDiff from '@features/ui/frontend/components/MkNumberDiff.vue';
import MkNumber from '@features/ui/frontend/components/MkNumber.vue';
import { customEmojis } from '@features/emojis/frontend/custom-emojis.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const stats = ref<Misskey.entities.StatsResponse | null>(null);
const usersComparedToThePrevDay = ref<number | null>(null);
const notesComparedToThePrevDay = ref<number | null>(null);
const onlineUsersCount = ref(0);
const fetching = ref(true);

onMounted(async () => {
	const [_stats, _onlineUsersCount] = await Promise.all([
		misskeyApi('stats', {}),
		misskeyApiGet('get-online-users-count').then(res => res.count),
	]);
	stats.value = _stats;
	onlineUsersCount.value = _onlineUsersCount;

	misskeyApiGet('charts/users', { limit: 2, span: 'day' }).then(chart => {
		usersComparedToThePrevDay.value = _stats.originalUsersCount - chart.local.total[1];
	});

	misskeyApiGet('charts/notes', { limit: 2, span: 'day' }).then(chart => {
		notesComparedToThePrevDay.value = _stats.originalNotesCount - chart.local.total[1];
	});

	fetching.value = false;
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;

	&:global {
		> .item {
			display: flex;
			box-sizing: border-box;
			padding: 12px;

			> .icon {
				display: grid;
				place-items: center;
				height: 100%;
				aspect-ratio: 1;
				margin-right: 12px;
				background: var(--MI_THEME-accentedBg);
				color: var(--MI_THEME-accent);
				border-radius: 10px;
			}

			&.users {
				> .icon {
					background: #0088d726;
					color: #3d96c1;
				}
			}

			&.notes {
				> .icon {
					background: #86b30026;
					color: #86b300;
				}
			}

			&.instances {
				> .icon {
					background: #e96b0026;
					color: #d76d00;
				}
			}

			&.emojis {
				> .icon {
					background: #d5ba0026;
						color: #dfc300;
				}
			}

			&.online {
				> .icon {
					background: #8a00d126;
					color: #c01ac3;
				}
			}

			> .body {
				padding: 2px 0;

				> .value {
					font-size: 1.2em;
					font-weight: bold;

					> .diff {
						font-size: 0.65em;
						font-weight: normal;
					}
				}

				> .label {
					font-size: 0.8em;
					opacity: 0.5;
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "dayOverDayChanges": "يوميا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "dayOverDayChanges": "Canvis ahir"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "dayOverDayChanges": "Denně"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "dayOverDayChanges": "Veränderung zu Gestern"
}
</locale>

<locale locale="en-US" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "dayOverDayChanges": "Dif diaria"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "dayOverDayChanges": "Journalier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "dayOverDayChanges": "Harian"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "dayOverDayChanges": "Giornaliero"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "dayOverDayChanges": "前日比"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "dayOverDayChanges": "前日比"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "dayOverDayChanges": "어제보다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "dayOverDayChanges": "Dagelijkse wijzigingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "dayOverDayChanges": "Codziennie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "dayOverDayChanges": "Dia anterior"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "dayOverDayChanges": "За день"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "dayOverDayChanges": "Medzidenné zmeny"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "dayOverDayChanges": "เทียบกับเมื่อวาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "dayOverDayChanges": "Dünkü değişiklikler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "dayOverDayChanges": "Доба"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "dayOverDayChanges": "Thay đổi hôm qua"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "dayOverDayChanges": "与前一日相比"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "dayOverDayChanges": "與昨日相比"
}
</locale>

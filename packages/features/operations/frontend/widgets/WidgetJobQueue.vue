<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-testid="mkw-jobQueue" class="mkw-jobQueue _monospace" :class="{ _panel: !widgetProps.transparent }">
	<div class="inbox">
		<div class="label">Inbox queue<i v-if="current.inbox.waiting > 0" class="ti ti-alert-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.inbox.activeSincePrevTick > prev.inbox.activeSincePrevTick, dec: current.inbox.activeSincePrevTick < prev.inbox.activeSincePrevTick }" :title="`${current.inbox.activeSincePrevTick}`">{{ kmg(current.inbox.activeSincePrevTick, 2) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.inbox.active > prev.inbox.active, dec: current.inbox.active < prev.inbox.active }" :title="`${current.inbox.active}`">{{ kmg(current.inbox.active, 2) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.inbox.delayed > prev.inbox.delayed, dec: current.inbox.delayed < prev.inbox.delayed }" :title="`${current.inbox.delayed}`">{{ kmg(current.inbox.delayed, 2) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.inbox.waiting > prev.inbox.waiting, dec: current.inbox.waiting < prev.inbox.waiting }" :title="`${current.inbox.waiting}`">{{ kmg(current.inbox.waiting, 2) }}</div>
			</div>
		</div>
	</div>
	<div class="deliver">
		<div class="label">Deliver queue<i v-if="current.deliver.waiting > 0" class="ti ti-alert-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.deliver.activeSincePrevTick > prev.deliver.activeSincePrevTick, dec: current.deliver.activeSincePrevTick < prev.deliver.activeSincePrevTick }" :title="`${current.deliver.activeSincePrevTick}`">{{ kmg(current.deliver.activeSincePrevTick, 2) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.deliver.active > prev.deliver.active, dec: current.deliver.active < prev.deliver.active }" :title="`${current.deliver.active}`">{{ kmg(current.deliver.active, 2) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.deliver.delayed > prev.deliver.delayed, dec: current.deliver.delayed < prev.deliver.delayed }" :title="`${current.deliver.delayed}`">{{ kmg(current.deliver.delayed, 2) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.deliver.waiting > prev.deliver.waiting, dec: current.deliver.waiting < prev.deliver.waiting }" :title="`${current.deliver.waiting}`">{{ kmg(current.deliver.waiting, 2) }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, reactive, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { useStream } from '@features/api/frontend/stream.js';
import kmg from '@features/ui/frontend/filters/kmg.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { genId } from '@features/runtime/frontend/utility/id.js';

const name = 'jobQueue';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
	sound: {
		type: 'boolean',
		label: $locale.value.sfc.sound,
		default: false,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const connection = useStream().useChannel('queueStats');
const current = reactive({
	inbox: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
	deliver: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
});
const prev = reactive({} as typeof current);
const jammedAudioBuffer = ref<AudioBuffer | null>(null);
const jammedSoundNodePlaying = ref<boolean>(false);

if (prefer.s['sound.masterVolume']) {
	sound.loadAudio('/client-assets/sounds/syuilo/queue-jammed.mp3').then(buf => {
		if (!buf) throw new Error('[WidgetJobQueue] Failed to initialize AudioBuffer');
		jammedAudioBuffer.value = buf;
	});
}

for (const domain of ['inbox', 'deliver']) {
	const d = domain as 'inbox' | 'deliver';
	prev[d] = deepClone(current[d]);
}

const onStats = (stats: Misskey.entities.QueueStats) => {
	for (const domain of ['inbox', 'deliver']) {
		const d = domain as 'inbox' | 'deliver';
		prev[d] = deepClone(current[d]);
		current[d].activeSincePrevTick = stats[d].activeSincePrevTick;
		current[d].active = stats[d].active;
		current[d].waiting = stats[d].waiting;
		current[d].delayed = stats[d].delayed;

		if (current[d].waiting > 0 && widgetProps.sound && jammedAudioBuffer.value && !jammedSoundNodePlaying.value) {
			const soundNode = sound.createSourceNode(jammedAudioBuffer.value, {}).soundSource;
			if (soundNode != null) {
				jammedSoundNodePlaying.value = true;
				soundNode.onended = () => jammedSoundNodePlaying.value = false;
				soundNode.start();
			}
		}
	}
};

const onStatsLog = (statsLog: Misskey.entities.QueueStatsLog) => {
	for (const stats of [...statsLog].reverse()) {
		onStats(stats);
	}
};

connection.on('stats', onStats);
connection.on('statsLog', onStatsLog);

connection.send('requestLog', {
	id: genId(),
	length: 1,
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
@keyframes warnBlink {
	0% { opacity: 1; }
	50% { opacity: 0; }
}

.mkw-jobQueue {
	font-size: 0.9em;

	> div {
		padding: 16px;

		&:not(:first-child) {
			border-top: solid 0.5px var(--MI_THEME-divider);
		}

		> .label {
			display: flex;

			> .icon {
				color: var(--MI_THEME-warn);
				margin-left: auto;
				animation: warnBlink 1s infinite;
			}
		}

		> .values {
			display: flex;

			> div {
				flex: 1;

				> div:first-child {
					opacity: 0.7;
				}

				> div:last-child {
					&.inc {
						color: var(--MI_THEME-warn);
					}

					&.dec {
						color: var(--MI_THEME-success);
					}
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"transparent": "Fons transparent",
	"sound": "Reprodueix so"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"transparent": "Hintergrund transparent machen",
	"sound": "Ton abspielen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"transparent": "Hacer fondo transparente",
	"sound": "Reproducir sonido"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"transparent": "Sfondo trasparente",
	"sound": "Emetti un suono"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"transparent": "背景を透明にする",
	"sound": "音を鳴らす"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"transparent": "背景を透明にする",
	"sound": "音を鳴らす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"transparent": "배경을 투명하게 설정",
	"sound": "소리 재생"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"transparent": "ทำพื้นหลังโปรงใส",
	"sound": "เล่นเสียง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"transparent": "Arka planı şeffaf yapın",
	"sound": "Sesleri Çal"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"transparent": "Make background transparent",
	"sound": "Play Sounds"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"transparent": "使背景透明",
	"sound": "播放音效"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"transparent": "使背景透明",
	"sound": "播放音效"
}
</locale>

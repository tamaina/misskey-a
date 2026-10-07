<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="false"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-code"></i> {{ $locale.sfc.title }}</template>

	<div :class="$style.embedCodeGenRoot">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<MkPreviewWithControls v-if="phase === 'input'" key="input" :previewLoading="iframeLoading">
				<template #preview>
					<div :class="$style.embedCodeGenPreviewWrapper">
						<div class="_acrylic" :class="$style.embedCodeGenPreviewTitle">{{ $locale.sfc.preview }}</div>
						<div ref="resizerRootEl" :class="$style.embedCodeGenPreviewResizerRoot" inert>
							<div
								:class="$style.embedCodeGenPreviewResizer"
								:style="{ transform: iframeStyle }"
							>
								<iframe
									ref="iframeEl"
									:src="embedPreviewUrl"
									:class="$style.embedCodeGenPreviewIframe"
									:style="{ height: `${iframeHeight}px` }"
									@load="iframeOnLoad"
								></iframe>
							</div>
						</div>
					</div>
				</template>
				<template #controls>
					<div class="_spacer _gaps">
						<MkInput v-if="isEmbedWithScrollbar" v-model="maxHeight" type="number" :min="0">
							<template #label>{{ $locale.sfc.maxHeight }}</template>
							<template #suffix>px</template>
							<template #caption>{{ $locale.sfc.maxHeightDescription }}</template>
						</MkInput>
						<MkSelect v-model="colorMode" :items="colorModeDef">
							<template #label>{{ $locale.sfc.theme }}</template>
						</MkSelect>
						<MkSwitch v-if="isEmbedWithScrollbar" v-model="header">{{ $locale.sfc.header }}</MkSwitch>
						<MkSwitch v-model="rounded">{{ $locale.sfc.rounded }}</MkSwitch>
						<MkSwitch v-model="border">{{ $locale.sfc.border }}</MkSwitch>
						<MkInfo v-if="isEmbedWithScrollbar && (!maxHeight || maxHeight <= 0)" warn>{{ $locale.sfc.maxHeightWarn }}</MkInfo>
						<MkInfo v-if="typeof maxHeight === 'number' && (maxHeight <= 0 || maxHeight > 700)">{{ $locale.sfc.previewIsNotActual }}</MkInfo>
						<div class="_buttons">
							<MkButton :disabled="iframeLoading" @click="applyToPreview">{{ $locale.sfc.applyToPreview }}</MkButton>
							<MkButton :disabled="iframeLoading" primary @click="generate">{{ $locale.sfc.generateCode }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</div>
				</template>
			</MkPreviewWithControls>
			<div v-else-if="phase === 'result'" key="result" :class="$style.embedCodeGenResultRoot">
				<div :class="$style.embedCodeGenResultWrapper" class="_gaps">
					<div class="_gaps_s">
						<div :class="$style.embedCodeGenResultHeadingIcon"><i class="ti ti-check"></i></div>
						<div :class="$style.embedCodeGenResultHeading">{{ $locale.sfc.codeGenerated }}</div>
						<div :class="$style.embedCodeGenResultDescription">{{ $locale.sfc.codeGeneratedDescription }}</div>
					</div>
					<div class="_gaps_s">
						<MkCode :code="result" lang="html" :forceShow="true" :copyButton="false" :class="$style.embedCodeGenResultCode"/>
						<MkButton :class="$style.embedCodeGenResultButtons" rounded primary @click="doCopy"><i class="ti ti-copy"></i> {{ $locale.sfc.copy }}</MkButton>
					</div>
					<MkButton :class="$style.embedCodeGenResultButtons" rounded transparent @click="close">{{ $locale.sfc.close }}</MkButton>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, computed, nextTick, onMounted, onDeactivated, onUnmounted } from 'vue';
import { url } from '@features/boot/frontend/shared/config.js';
import { embedRouteWithScrollbar } from '@features/web/frontend/shared/embed-page.js';
import type { EmbeddableEntity, EmbedParams } from '@features/web/frontend/shared/embed-page.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkPreviewWithControls from '@features/markup/frontend/components/MkPreviewWithControls.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { normalizeEmbedParams, getEmbedCode } from '@features/web/frontend/utility/get-embed-code.js';

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	entity: EmbeddableEntity;
	id: string;
	params?: EmbedParams;
}>();

//#region Modalの制御
const dialogEl = useTemplateRef('dialogEl');

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function close() {
	dialogEl.value?.close();
}

const phase = ref<'input' | 'result'>('input');
//#endregion

//#region 埋め込みURL生成・カスタマイズ

// 本URL生成用params
const paramsForUrl = computed<EmbedParams>(() => ({
	header: header.value,
	maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
	colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
	rounded: rounded.value,
	border: border.value,
}));

// プレビュー用params（手動で更新を掛けるのでref）
const paramsForPreview = ref<EmbedParams>(props.params ?? {});

const embedPreviewUrl = computed(() => {
	const paramClass = new URLSearchParams(normalizeEmbedParams(paramsForPreview.value));
	if (paramClass.has('maxHeight')) {
		const maxHeight = parseInt(paramClass.get('maxHeight')!);
		paramClass.set('maxHeight', maxHeight === 0 ? '500' : Math.min(maxHeight, 700).toString()); // プレビューであまりにも縮小されると見づらいため、700pxまでに制限
	}
	return `${url}/embed/${props.entity}/${props.id}${paramClass.toString() ? '?' + paramClass.toString() : ''}`;
});

const isEmbedWithScrollbar = computed(() => embedRouteWithScrollbar.includes(props.entity));
const header = ref(props.params?.header ?? true);
const maxHeight = ref(props.params?.maxHeight !== 0 ? props.params?.maxHeight ?? null : 500);

const {
	model: colorMode,
	def: colorModeDef,
} = useMkSelect({
	items: [
		{ value: 'auto', label: $locale.value.sfc.syncDeviceDarkMode },
		{ value: 'light', label: $locale.value.sfc.light },
		{ value: 'dark', label: $locale.value.sfc.dark },
	],
	initialValue: props.params?.colorMode ?? 'auto',
});

const rounded = ref(props.params?.rounded ?? true);
const border = ref(props.params?.border ?? true);

function applyToPreview() {
	const currentPreviewUrl = embedPreviewUrl.value;

	paramsForPreview.value = {
		header: header.value,
		maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
		colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
		rounded: rounded.value,
		border: border.value,
	};

	nextTick(() => {
		if (currentPreviewUrl === embedPreviewUrl.value) {
			// URLが変わらなくてもリロード
			iframeEl.value?.contentWindow?.window.location.reload();
		}
	});
}

const result = ref('');

function generate() {
	result.value = getEmbedCode(`/embed/${props.entity}/${props.id}`, paramsForUrl.value);
	phase.value = 'result';
}

function doCopy() {
	copyToClipboard(result.value);
}
//#endregion

//#region プレビューのリサイズ
const resizerRootEl = useTemplateRef('resizerRootEl');
const iframeLoading = ref(true);
const iframeEl = useTemplateRef('iframeEl');
const iframeHeight = ref(0);
const iframeScale = ref(1);
const iframeStyle = computed(() => {
	return `translate(-50%, -50%) scale(${iframeScale.value})`;
});
const resizeObserver = new ResizeObserver(() => {
	calcScale();
});

function iframeOnLoad() {
	iframeEl.value?.contentWindow?.addEventListener('beforeunload', () => {
		iframeLoading.value = true;
		nextTick(() => {
			iframeHeight.value = 0;
			iframeScale.value = 1;
		});
	});
}

function windowEventHandler(event: MessageEvent) {
	if (event.source !== iframeEl.value?.contentWindow) {
		return;
	}
	if (event.data.type === 'misskey:embed:ready') {
		iframeEl.value!.contentWindow?.postMessage({
			type: 'misskey:embedParent:registerIframeId',
			payload: {
				iframeId: 'embedCodeGen', // 同じタイミングで複数のembed iframeがある際の区別用なのでここではなんでもいい
			},
		});
	}
	if (event.data.type === 'misskey:embed:changeHeight') {
		iframeHeight.value = event.data.payload.height;
		nextTick(() => {
			calcScale();
			iframeLoading.value = false; // 初回の高さ変更まで待つ
		});
	}
}

function calcScale() {
	if (!resizerRootEl.value) return;
	const previewWidth = resizerRootEl.value.clientWidth - 40; // 左右の余白 20pxずつ
	const previewHeight = resizerRootEl.value.clientHeight - 40; // 上下の余白 20pxずつ
	const iframeWidth = 500;
	const scale = Math.min(previewWidth / iframeWidth, previewHeight / iframeHeight.value, 1); // 拡大はしないので1を上限に
	iframeScale.value = scale;
}

onMounted(() => {
	window.addEventListener('message', windowEventHandler);
	if (!resizerRootEl.value) return;
	resizeObserver.observe(resizerRootEl.value);
});

function reset() {
	window.removeEventListener('message', windowEventHandler);
	resizeObserver.disconnect();

	// プレビューのリセット
	iframeHeight.value = 0;
	iframeScale.value = 1;
	iframeLoading.value = true;
	result.value = '';
	phase.value = 'input';
}

onDeactivated(() => {
	reset();
});

onUnmounted(() => {
	reset();
});
//#endregion
</script>

<style module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.embedCodeGenRoot {
	container-type: inline-size;
	height: 100%;
}

.embedCodeGenPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.embedCodeGenPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewResizerRoot {
	position: relative;
	flex: 1 0;
}

.embedCodeGenPreviewResizer {
	position: absolute;
	top: 50%;
	left: 50%;
}

.embedCodeGenPreviewIframe {
	display: block;
	border: none;
	width: 500px;
	color-scheme: light dark;
}

.embedCodeGenResultRoot {
	box-sizing: border-box;
	padding: 24px;
	height: 100%;
	max-width: 700px;
	margin: 0 auto;
	display: flex;
	align-items: center;
}

.embedCodeGenResultHeading {
	text-align: center;
	font-size: 1.2em;
}

.embedCodeGenResultHeadingIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.embedCodeGenResultDescription {
	text-align: center;
	white-space: pre-wrap;
}

.embedCodeGenResultWrapper,
.embedCodeGenResultCode {
	width: 100%;
}

.embedCodeGenResultButtons {
	margin: 0 auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"syncDeviceDarkMode": "مطابقة الوضع المضلمومع اعدادات الجهاز",
	"light": "فاتح",
	"dark": "داكن",
	"title": "Customize embed code",
	"preview": "معاينة",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "المظهر",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "نسخ",
	"close": "اغلق"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"syncDeviceDarkMode": "Sincronitza el mode fosc amb la configuració del dispositiu",
	"light": "Clar",
	"dark": "Fosc",
	"title": "Personalitza el codi per incrustar",
	"preview": "Vista prèvia",
	"maxHeight": "Alçada màxima",
	"maxHeightDescription": "0 anul·la la configuració màxima. Per evitar que continuï creixent verticalment, especifiqui qualsevol valor.",
	"theme": "Tema",
	"header": "Mostrar la capçalera",
	"rounded": "Angle recte",
	"border": "Afegeix un marc al contenidor",
	"maxHeightWarn": "El límit màxim d'alçada és nul (0). Si això no és un canvi previst, estableix el màxim d'alçada a un cert valor.",
	"previewIsNotActual": "La visualització és diferent de la que es mostra quan s'implanta.",
	"applyToPreview": "Aplica a la vista prèvia",
	"generateCode": "Crea el codi per incrustar",
	"codeGenerated": "Codi generat",
	"codeGeneratedDescription": "Si us plau, enganxeu el codi generat al lloc web.",
	"copy": "Copiar",
	"close": "Tanca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"syncDeviceDarkMode": "Synchronizovat tmavý vzhled s nastavením Vašeho systému",
	"light": "Světlý",
	"dark": "Tmavý",
	"title": "Customize embed code",
	"preview": "Náhled",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Vzhled",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Kopírovat",
	"close": "Zavřít"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"light": "Light",
	"dark": "Dark",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Themes",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copy",
	"close": "Close"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"syncDeviceDarkMode": "Einstellung deines Geräts übernehmen",
	"light": "Hell",
	"dark": "Dunkel",
	"title": "Einbettungscode anpassen",
	"preview": "Vorschau",
	"maxHeight": "Maximale Höhe",
	"maxHeightDescription": "Der Wert 0 deaktiviert die Einstellung der maximalen Höhe. Gib einen Wert an, um zu verhindern, dass das Widget weiterhin vertikal vergrößert wird.",
	"theme": "Farbschema",
	"header": "Kopfzeile anzeigen",
	"rounded": "Ecken abrunden",
	"border": "Dem äußeren Rand einen Rahmen hinzufügen",
	"maxHeightWarn": "Die Begrenzung der maximalen Höhe ist deaktiviert (0). Wenn dies nicht beabsichtigt war, setze die maximale Höhe auf einen Wert fest.",
	"previewIsNotActual": "Die Anzeige weicht von der tatsächlichen Einbettung ab, da sie den auf dem Vorschaufenster angezeigten Bereich überschreitet.",
	"applyToPreview": "Auf die Vorschau anwenden",
	"generateCode": "Einbettungscode generieren",
	"codeGenerated": "Der Code wurde generiert",
	"codeGeneratedDescription": "Füge den generierten Code in deine Website ein, um den Inhalt einzubetten.",
	"copy": "Kopieren",
	"close": "Schließen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"light": "Light",
	"dark": "Dark",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Themes",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copy",
	"close": "Close"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"syncDeviceDarkMode": "Sincronice el Modo Oscuro con la configuración de su dispositivo",
	"light": "Claro",
	"dark": "Oscuro",
	"title": "Personalizar el código de incrustación",
	"preview": "Vista previa",
	"maxHeight": "Altura máxima",
	"maxHeightDescription": "0 desactiva el ajuste del valor máximo. Para evitar que el widget siga creciendo verticalmente, especifica algún valor.",
	"theme": "Tema",
	"header": "Mostrar encabezados",
	"rounded": "Bordes Redondeados",
	"border": "Añadir un borde al marco exterior",
	"maxHeightWarn": "El límite de altura máxima está desactivado (0). Si esto no estaba previsto, establece la altura máxima en algún valor.",
	"previewIsNotActual": "La visualización difiere de la incrustación real porque excede el rango mostrado en la pantalla de vista previa.",
	"applyToPreview": "Aplicar a la vista previa",
	"generateCode": "Crear el código para incrustar",
	"codeGenerated": "El código ha sido generado",
	"codeGeneratedDescription": "Pegue el código generado en su sitio web para incrustar el contenido.",
	"copy": "Copiar",
	"close": "Cerrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"syncDeviceDarkMode": "Utiliser le mode sombre de votre appareil",
	"light": "Clair",
	"dark": "Sombre",
	"title": "Personnaliser le code d'intégration",
	"preview": "Aperçu",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Thème",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Générer le code d'intégration",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copier",
	"close": "Fermer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"syncDeviceDarkMode": "Sinkronkan mode gelap dengan pengaturan perangkat",
	"light": "Terang",
	"dark": "Gelap",
	"title": "Customize embed code",
	"preview": "Pratinjau",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Tema",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Salin",
	"close": "Tutup"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"syncDeviceDarkMode": "Sincronizza il tema scuro con le impostazioni del dispositivo",
	"light": "Chiaro",
	"dark": "Scuro",
	"title": "Personalizza il codice per incorporare",
	"preview": "Anteprima",
	"maxHeight": "Altezza massima",
	"maxHeightDescription": "Specifica un valore per evitare che continui a crescere verticalmente. Il valore 0 disabilita il limite d'altezza.",
	"theme": "Tema",
	"header": "Mostra la testata",
	"rounded": "Bordo arrotondato",
	"border": "Aggiungi un bordo al contenitore",
	"maxHeightWarn": "L'altezza massima è disabilitata (0). Se l'effetto è indesiderato, prova a impostare l'altezza massima a un valore specifico.",
	"previewIsNotActual": "Poiché supera l'intervallo che può essere visualizzato in anteprima, la visualizzazione vera e propria sarà diversa quando effettivamente incorporata.",
	"applyToPreview": "Aggiorna l'anteprima",
	"generateCode": "Crea il codice per incorporare",
	"codeGenerated": "Codice generato",
	"codeGeneratedDescription": "Incolla il codice appena generato sul tuo sito web.",
	"copy": "Copia",
	"close": "Chiudi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"syncDeviceDarkMode": "デバイスのダークモードと同期する",
	"light": "ライト",
	"dark": "ダーク",
	"title": "埋め込みコードをカスタマイズ",
	"preview": "プレビュー",
	"maxHeight": "高さの最大値",
	"maxHeightDescription": "0で最大値の設定が無効になります。ウィジェットが縦に伸び続けるのを防ぐために、何らかの値に指定してください。",
	"theme": "テーマ",
	"header": "ヘッダーを表示",
	"rounded": "角丸にする",
	"border": "外枠に枠線をつける",
	"maxHeightWarn": "高さの最大値制限が無効（0）になっています。これが意図した変更ではない場合は、高さの最大値を何らかの値に設定してください。",
	"previewIsNotActual": "プレビュー画面で表示可能な範囲を超えたため、実際に埋め込んだ際とは表示が異なります。",
	"applyToPreview": "プレビューに反映",
	"generateCode": "埋め込みコードを作成",
	"codeGenerated": "コードが生成されました",
	"codeGeneratedDescription": "生成されたコードをウェブサイトに貼り付けてご利用ください。",
	"copy": "コピー",
	"close": "閉じる"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"syncDeviceDarkMode": "デバイスのダークモードと一緒にする",
	"light": "ライト",
	"dark": "ダーク",
	"title": "埋め込みコードをカスタム",
	"preview": "プレビュー",
	"maxHeight": "高さの最大値",
	"maxHeightDescription": "0は最大値を指定せえへんけど、ウィジェットが伸び続けるから絶対1以上にしといてや。",
	"theme": "テーマ",
	"header": "ヘッダー出す",
	"rounded": "角丸める",
	"border": "外枠に枠線つける",
	"maxHeightWarn": "高さの最大値が無効になっとるで。意図してへん変更なら、普通の値に戻してや。",
	"previewIsNotActual": "プレビュー画面で出せる範囲をはみ出したから、ホンマの表示とはちゃうとおもうで。",
	"applyToPreview": "プレビューに反映",
	"generateCode": "埋め込みコード作る",
	"codeGenerated": "コード作ったで",
	"codeGeneratedDescription": "作ったコードはウェブサイトに貼っつけて使ってや。",
	"copy": "コピー",
	"close": "さいなら"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"light": "Light",
	"dark": "Dark",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Themes",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copy",
	"close": "Close"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"light": "Light",
	"dark": "Dark",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Themes",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copy",
	"close": "Close"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"syncDeviceDarkMode": "디바이스의 다크 모드 설정과 동기화",
	"light": "라이트",
	"dark": "다크",
	"title": "임베디드 코드를 커스터마이즈",
	"preview": "미리보기",
	"maxHeight": "최대 높이",
	"maxHeightDescription": "최대 값을 무시하려면 0을 입력하세요. 위젯이 상하로 길어지는 것을 방지하려면, 임의의 값을 입력해 주세요.",
	"theme": "테마",
	"header": "해더를 표시",
	"rounded": "외곽선을 둥글게 하기",
	"border": "외곽선에 테두리를 씌우기",
	"maxHeightWarn": "높이 최대 값이 설정되어져 있지 않습니다(0). 의도적으로 설정 하지 않았다면 임의의 값을 설정해주세요.",
	"previewIsNotActual": "미리보기로 표시할 수 있는 크기보다 큽니다. 실제로 넣은 코드의 표시가 다른 경우가 있습니다.",
	"applyToPreview": "미리보기에 반영",
	"generateCode": "임베디드 코드를 만들기",
	"codeGenerated": "코드를 만들었습니다.",
	"codeGeneratedDescription": "만들어진 코드를 웹 사이트에 붙여서 사용하세요.",
	"copy": "복사",
	"close": "닫기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"syncDeviceDarkMode": "Synchroniseer donkere modus met je apparaatinstellingen",
	"light": "Licht",
	"dark": "Donker",
	"title": "Customize embed code",
	"preview": "Voorbeeld",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Thema's",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Kopiëren",
	"close": "Sluiten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"syncDeviceDarkMode": "Synkroniser mørkmodus med enhetens innstillinger",
	"light": "Lys",
	"dark": "Mørk",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Temaer",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Kopier",
	"close": "Lukk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"syncDeviceDarkMode": "Synchronizuj ciemny motyw z ustawieniami urządzenia",
	"light": "Jasny",
	"dark": "Ciemny",
	"title": "Customize embed code",
	"preview": "Podgląd",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Motywy",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Kopiuj",
	"close": "Zamknij"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"syncDeviceDarkMode": "Sincronize com o modo escuro do dispositivo",
	"light": "Claro",
	"dark": "Escuro",
	"title": "Personalizar código do embed",
	"preview": "Pré-visualizar",
	"maxHeight": "Altura máxima",
	"maxHeightDescription": "Colocar em 0 desabilita a altura máxima. Especifique um valor para prevenir uma expansão vertical contínua.",
	"theme": "Tema",
	"header": "Exibir cabeçalho",
	"rounded": "Tornar arredondado",
	"border": "Adicionar uma borda ao quadro externo",
	"maxHeightWarn": "O limite de altura máxima está desabilitado (0). Se isso não for intencional, insira um valor para a altura máxima.",
	"previewIsNotActual": "A exibição difere do embed original porque ela excede o tamanho da tela de prévia.",
	"applyToPreview": "Aplicar para a prévia",
	"generateCode": "Gerar código de embed",
	"codeGenerated": "O código foi gerado",
	"codeGeneratedDescription": "Coloque o código no seu website para incorporar o conteúdo.",
	"copy": "Copiar",
	"close": "Fechar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"syncDeviceDarkMode": "Синхронизировать с тёмной темой системы",
	"light": "Светлый",
	"dark": "Тёмный",
	"title": "Customize embed code",
	"preview": "Предпросмотр",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Тема",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Копировать",
	"close": "Закрыть"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"syncDeviceDarkMode": "Synchronizovať tmavú tému s nastavení vášho systému",
	"light": "Svetlá",
	"dark": "Tmavá",
	"title": "Customize embed code",
	"preview": "Náhľad",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Téma",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Kopírovať",
	"close": "Zavrieť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"syncDeviceDarkMode": "ซิงค์โหมดมืดกับการตั้งค่าอุปกรณ์ของคุณ",
	"light": "สว่าง",
	"dark": "มืด",
	"title": "ปรับแต่งโค้ดฝัง",
	"preview": "แสดงตัวอย่าง",
	"maxHeight": "ความสูงสุด",
	"maxHeightDescription": "หากถ้าตั้งค่าเป็น 0 จะทำให้ไม่มีการจำกัดความสูงของวิดเจ็ต แต่ควรตั้งค่าเป็นตัวเลขอื่นๆ เพื่อไม่ให้วิดเจ็ตยืดตัวลงไปเรื่อยๆ",
	"theme": "ธีม",
	"header": "แสดงส่วนหัว",
	"rounded": "ทำให้มันกลม",
	"border": "เพิ่มขอบให้กับกรอบด้านนอก",
	"maxHeightWarn": "การจำกัดความสูงสูงสุดถูกปิดใช้งาน (0) หากไม่ได้ตั้งใจให้เป็นเช่นนี้ โปรดตั้งค่าความสูงสูงสุดให้เป็นค่าอื่นๆแทน",
	"previewIsNotActual": "การแสดงผลนั้นต่างจากการฝังจริงเพราะเกินขอบเขตที่แสดงบนหน้าจอตัวอย่างนะ",
	"applyToPreview": "นำไปใช้กับการแสดงตัวอย่าง",
	"generateCode": "สร้างโค้ดสำหรับการฝัง",
	"codeGenerated": "รหัสถูกสร้างขึ้นแล้ว",
	"codeGeneratedDescription": "นำโค้ดที่สร้างแล้วไปวางในเว็บไซต์ของคุณเพื่อฝังเนื้อหา",
	"copy": "คัดลอก",
	"close": "ปิด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"syncDeviceDarkMode": "Karanlık Modu cihaz ayarlarınızla senkronize et",
	"light": "Aydınlık",
	"dark": "Karanlık",
	"title": "Gömme kodunu özelleştir",
	"preview": "Önizleme",
	"maxHeight": "Maksimum yükseklik",
	"maxHeightDescription": "0 olarak ayarlandığında maksimum yükseklik ayarı devre dışı bırakılır. Widget'ın dikey olarak genişlemeye devam etmesini önlemek için bir değer belirt.",
	"theme": "Tema",
	"header": "Başlığı göster",
	"rounded": "Yuvarlak hale getir",
	"border": "Dış çerçeveye kenarlık ekle",
	"maxHeightWarn": "Maksimum yükseklik sınırı devre dışıdır (0). Bu istenmeyen bir durumsa, maksimum yüksekliği bir değer olarak ayarla.",
	"previewIsNotActual": "Ekran, önizleme ekranında görüntülenen aralığı aştığı için gerçek gömme işleminden farklıdır.",
	"applyToPreview": "Önizlemeye başvur",
	"generateCode": "Gömme kodu oluştur",
	"codeGenerated": "Kod oluşturuldu",
	"codeGeneratedDescription": "Oluşturulan kodu web sitene yapıştırarak içeriği göm.",
	"copy": "Kopyala",
	"close": "Kapat"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"light": "Light",
	"dark": "Dark",
	"title": "Customize embed code",
	"preview": "Preview",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Themes",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Copy",
	"close": "Close"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"syncDeviceDarkMode": "Синхронізувати темний режим із налаштуваннями вашого пристрою",
	"light": "Світла",
	"dark": "Темна",
	"title": "Customize embed code",
	"preview": "Попередній перегляд",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Тема",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Скопіювати",
	"close": "Закрити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"syncDeviceDarkMode": "Đồng bộ với thiết bị",
	"light": "Sáng",
	"dark": "Tối",
	"title": "Customize embed code",
	"preview": "Xem trước",
	"maxHeight": "Max height",
	"maxHeightDescription": "Setting it to 0 disables the max height setting. Specify some value to prevent the widget from continuing to expand vertically.",
	"theme": "Chủ đề",
	"header": "Show header",
	"rounded": "Make it rounded",
	"border": "Add a border to the outer frame",
	"maxHeightWarn": "The max height limit is disabled (0). If this was not intended, set the max height to some value.",
	"previewIsNotActual": "The display differs from the actual embedding because it exceeds the range displayed on the preview screen.",
	"applyToPreview": "Apply to the preview",
	"generateCode": "Generate embed code",
	"codeGenerated": "The code has been generated",
	"codeGeneratedDescription": "Paste the generated code into your website to embed the content.",
	"copy": "Sao chép",
	"close": "Đóng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"syncDeviceDarkMode": "将深色模式与设备设置同步",
	"light": "浅色",
	"dark": "深色",
	"title": "自定义嵌入代码",
	"preview": "预览",
	"maxHeight": "最大高度",
	"maxHeightDescription": "若将最大值设为 0 则不限制最大高度。为防止小工具无限增高，建议设置一下。",
	"theme": "主题",
	"header": "显示标题",
	"rounded": "圆角",
	"border": "外边框",
	"maxHeightWarn": "最大高度限制已禁用（0）。若这不是您想要的效果，请将最大高度设一个值。",
	"previewIsNotActual": "由于超出了预览画面可显示的范围，因此显示内容会与实际嵌入时有所不同。",
	"applyToPreview": "应用预览",
	"generateCode": "生成嵌入代码",
	"codeGenerated": "已生成代码",
	"codeGeneratedDescription": "将生成的代码贴到网站上来使用。",
	"copy": "复制",
	"close": "关闭"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"syncDeviceDarkMode": "與裝置的深色模式同步",
	"light": "淺色",
	"dark": "深色",
	"title": "自訂嵌入程式碼",
	"preview": "預覽",
	"maxHeight": "最大高度",
	"maxHeightDescription": "設定為 0 時代表沒有最大值。請指定某個值以避免小工具持續在縱向延伸。",
	"theme": "佈景主題",
	"header": "檢視標頭 ",
	"rounded": "圓角",
	"border": "給外框加上邊框",
	"maxHeightWarn": "最大高度限制已停用（0）。如果這個變更不是您想要的，請將最大高度設定為某個值。",
	"previewIsNotActual": "由於超出了預覽畫面可顯示的範圍，因此顯示內容會與實際嵌入時有所不同。",
	"applyToPreview": "反映在預覽中",
	"generateCode": "建立嵌入程式碼",
	"codeGenerated": "已產生程式碼",
	"codeGeneratedDescription": "請將產生的程式碼貼到您的網站上。",
	"copy": "複製",
	"close": "關閉"
}
</locale>

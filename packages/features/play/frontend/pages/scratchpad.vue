<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div class="_gaps_s">
				<div :class="$style.editor" class="_panel">
					<MkCodeEditor v-model="code" lang="aiscript"/>
				</div>
				<MkButton primary @click="run()"><i class="ti ti-player-play"></i></MkButton>
			</div>

			<MkContainer v-if="root && components.length > 1" :key="uiKey" :foldable="true">
				<template #header>UI</template>
				<div :class="$style.ui">
					<MkAsUi :component="root" :components="components" size="small"/>
				</div>
			</MkContainer>

			<MkContainer :foldable="true" class="">
				<template #header>{{ $locale.sfc.output }}</template>
				<div :class="$style.logs">
					<div v-for="log in logs" :key="log.id" class="log" :class="log.type">{{ log.text }}</div>
				</div>
			</MkContainer>

			<MkContainer :foldable="true" :expanded="false">
				<template #header>{{ $locale.sfc.uiInspector }}</template>
				<div :class="$style.uiInspector">
					<div v-for="c in components" :key="c.value.id" :class="{ [$style.uiInspectorUnShown]: !showns.has(c.value.id) }">
						<div :class="$style.uiInspectorType">{{ c.value.type }}</div>
						<div :class="$style.uiInspectorId">{{ c.value.id }}</div>
						<button :class="$style.uiInspectorPropsToggle" @click="() => uiInspectorOpenedComponents.set(c, !uiInspectorOpenedComponents.get(c))">
							<i v-if="uiInspectorOpenedComponents.get(c)" class="ti ti-chevron-up icon"></i>
							<i v-else class="ti ti-chevron-down icon"></i>
						</button>
						<div v-if="uiInspectorOpenedComponents.get(c)">
							<MkTextarea :modelValue="stringifyUiProps(c.value)" code readonly></MkTextarea>
						</div>
					</div>
					<div :class="$style.uiInspectorDescription">{{ $locale.sfc.uiInspectorDescription }}</div>
				</div>
			</MkContainer>

			<div class="">
				{{ $locale.sfc.scratchpadDescription }}
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onDeactivated, onUnmounted, ref, watch, computed } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import type { Ref } from 'vue';
import type { AsUiComponent } from '@features/play/frontend/services/aiscript/ui.js';
import type { AsUiRoot } from '@features/play/frontend/services/aiscript/ui.js';
import type { Value } from '@syuilo/aiscript/interpreter/value.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import { aiScriptReadline, createAiScriptEnv } from '@features/play/frontend/services/aiscript/api.js';
import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { registerAsUiLib } from '@features/play/frontend/services/aiscript/ui.js';
import MkAsUi from '@features/play/frontend/components/MkAsUi.vue';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';

const parser = new Parser();
let aiscript: Interpreter;
const code = ref('');
const logs = ref<{
	id: number;
	text: string;
	type: 'print' | 'end' | 'error';
}[]>([]);
const root = ref<AsUiRoot | undefined>();
const components = ref<Ref<AsUiComponent>[]>([]);
const uiKey = ref(0);
const uiInspectorOpenedComponents = ref(new WeakMap<AsUiComponent | Ref<AsUiComponent>, boolean>);

const saved = miLocalStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

function pushLog(type: 'print' | 'end' | 'error', text: string): void {
	logs.value.push({ id: Math.random(), text, type });
}

function processError(title: string, err: unknown): void {
	const text = String(err);
	pushLog('error', text);
	os.alert({ type: 'error', title, text });
}

watch(code, () => {
	miLocalStorage.setItem('scratchpad', code.value);
});

function stringifyUiProps(uiProps: AsUiComponent) {
	return JSON.stringify(
		{ ...uiProps, type: undefined, id: undefined },
		(k, v) => typeof v === 'function' ? '<function>' : v,
		2,
	);
}

async function run() {
	if (aiscript) aiscript.abort();
	root.value = undefined;
	components.value = [];
	uiKey.value++;
	logs.value = [];

	aiscript = new Interpreter(({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
	}), {
		in: aiScriptReadline,
		out: (value) => {
			if (value.type === 'str' && value.value.toLowerCase().replace(',', '').includes('hello world')) {
				claimAchievement('outputHelloWorldOnScratchpad');
			}
			pushLog('print', value.type === 'str' ? value.value : utils.valToString(value));
		},
		err: (err) => {
			processError('AiScript Error', err);
		},
		log: (type, params) => {
			switch (type) {
				case 'end': {
					pushLog('end', utils.valToString(params.val as Value, true));
					break;
				}
				default: break;
			}
		},
	});

	let ast;
	try {
		ast = parser.parse(code.value);
	} catch (err: any) {
		processError('Syntax Error', err);
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err: any) {
		// in case AiScript Interpreter has some bug
		processError('AiScript Internal Error', err);
	}
}

onDeactivated(() => {
	if (aiscript) aiscript.abort();
});

onUnmounted(() => {
	if (aiscript) aiscript.abort();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

const showns = computed(() => {
	if (root.value == null) return new Set<string>();
	const result = new Set<string>();
	(function addChildrenToResult(c: AsUiComponent) {
		result.add(c.id);
		const children = c.children;
		if (children) {
			const childComponents = components.value.filter(v => children.includes(v.value.id));
			for (const child of childComponents) {
				addChildrenToResult(child.value);
			}
		}
	})(root.value);
	return result;
});

definePage(() => ({
	title: $locale.value.sfc.scratchpad,
	icon: 'ti ti-terminal-2',
}));
</script>

<style lang="scss" module>
.root {
}

.editor {
	position: relative;
}

.code {
	background: #2d2d2d;
	color: #ccc;
	font-size: 14px;
	line-height: 1.5;
	padding: 5px;
}

.ui {
	padding: 32px;
}

.logs {
	padding: 16px;

	&:global {
		> .log.print {
		}
		> .log.end {
			opacity: 0.7;
		}
		> .log.error {
			color: var(--MI_THEME-error);
		}
	}
}

.uiInspector {
	display: grid;
	gap: 8px;
	padding: 16px;
}

.uiInspectorUnShown {
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
}

.uiInspectorType {
	display: inline-block;
	border: hidden;
	border-radius: 10px;
	background-color: var(--MI_THEME-panelHighlight);
	padding: 2px 8px;
	font-size: 12px;
}

.uiInspectorId {
	display: inline-block;
	padding-left: 8px;
}

.uiInspectorDescription {
	display: block;
	font-size: 12px;
	padding-top: 16px;
}

.uiInspectorPropsToggle {
	background: none;
	border: none;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"output": "الخارجة",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"output": "Sortida",
	"uiInspector": "Inspector de la interfície",
	"uiInspectorDescription": "Podeu visualitzar una llista d'elements UI presents en la memòria. Els components de la interfície d'usuari són generats per les funcions Ui:C:.",
	"scratchpadDescription": "El bloc de proves proporciona un entorn experimental per AiScript. Pot escriure i verificar els resultats que interactuen amb Misskey.",
	"scratchpad": "Bloc de proves"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"output": "Výstup",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "Scratchpad poskytuje rozhraní pro AiScript experimenty. Můžete psát, spustit či zkontrolovat výsledky jeho interakce s Misskey.",
	"scratchpad": "Zápisník"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"output": "Ausgabe",
	"uiInspector": "UI-Inspektor",
	"uiInspectorDescription": "Die Liste der UI-Komponenten-Server können im Zwischenspeicher angesehen werden. Die UI-Komponente wird von der Funktion Ui:C: generiert.",
	"scratchpadDescription": "Die Testumgebung bietet einen Bereich für AiScript-Experimente. Dort kannst du AiScript schreiben, ausführen sowie dessen Auswirkungen auf Misskey überprüfen.",
	"scratchpad": "Testumgebung"
}
</locale>

<locale locale="en-US" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"output": "Salida",
	"uiInspector": "Inspector de UI",
	"uiInspectorDescription": "Puedes visualizar una lista de elementos UI presentes en la memoria. Los componentes de la interfaz de usuario son generados por las funciones UI:C:",
	"scratchpadDescription": "Scratchpad proporciona un entorno experimental para AiScript. Puede escribir, ejecutar y verificar los resultados que interactúan con Misskey.",
	"scratchpad": "Scratch pad"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"output": "Sortie",
	"uiInspector": "Inspecteur UI",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "ScratchPad fournit un environnement expérimental pour AiScript. Vous pouvez vérifier la rédaction de votre code, sa bonne exécution et le résultat de son interaction avec Misskey.",
	"scratchpad": "ScratchPad"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"output": "Keluaran",
	"uiInspector": "Inspektor UI",
	"uiInspectorDescription": "Anda dapat melihat peladen komponen UI di memori. Komponen UI akan dibuat oleh fungsi UI:C.",
	"scratchpadDescription": "Scratchpad menyediakan lingkungan eksperimen untuk AiScript. Kamu  bisa menulis, mengeksuksi, serta mengecek hasil yang berinteraksi dengan Misskey.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"output": "Output",
	"uiInspector": "UI Inspector",
	"uiInspectorDescription": "Puoi visualizzare un elenco di elementi grafici presenti in memoria. I componenti dell'interfaccia grafica vengono generati dalle funzioni Ui:C:.",
	"scratchpadDescription": "Lo Scratchpad offre un ambiente per esperimenti di AiScript. È possibile scrivere, eseguire e confermare i risultati dell'interazione del codice con Misskey.",
	"scratchpad": "ScratchPad"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"output": "出力",
	"uiInspector": "UIインスペクター",
	"uiInspectorDescription": "メモリ上に存在しているUIコンポーネントのインスタンスの一覧を見ることができます。UIコンポーネントはUi:C:系関数により生成されます。",
	"scratchpadDescription": "スクラッチパッドは、AiScriptの実験環境を提供します。Misskeyと対話するコードの記述、実行、結果の確認ができます。",
	"scratchpad": "スクラッチパッド"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"output": "出力",
	"uiInspector": "UIインスペクター",
	"uiInspectorDescription": "メモリ上にあるUIコンポーネントのインスタンス一覧を見れるで。UIコンポーネントはUi:C:系関数で生成されるで。",
	"scratchpadDescription": "スクラッチパッドではAiScriptを色々試すことができるんや。Misskeyに対して色々できるコードを書いて動かしてみたり、結果を見たりできるで。",
	"scratchpad": "スクラッチパッド"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"output": "출력",
	"uiInspector": "UI 인스펙터",
	"uiInspectorDescription": "메모리에 있는 UI 컴포넌트의 인스턴트 목록을 볼 수 있습니다. UI 컴포넌트는 Ui:C: 계열 함수로 만들어집니다.",
	"scratchpadDescription": "스크래치 패드는 AiScript 의 테스트 환경을 제공합니다. Misskey 와 상호 작용하는 코드를 작성, 실행 및 결과를 확인할 수 있습니다.",
	"scratchpad": "스크래치 패드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"output": "Uitvoer",
	"uiInspector": "UI-inspecteur",
	"uiInspectorDescription": "De lijst met servers van UI-componenten kan worden bekeken in de cache. De UI-component wordt gegenereerd door de functie Ui:C:",
	"scratchpadDescription": "De testomgeving biedt een gebied voor AiScript experimenten. Daar kunt u AiScript schrijven en uitvoeren en de effecten ervan op Misskey controleren.",
	"scratchpad": "Testomgeving"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"output": "Wyjście",
	"uiInspector": "Inspektor UI",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "Brudnopis zawiera eksperymentalne środowisko dla AiScript. Możesz pisać, wykonywać i sprawdzać wyniki w interakcji z Misskey.",
	"scratchpad": "Brudnopis"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"output": "Resultado",
	"uiInspector": "Inspecionador de interface",
	"uiInspectorDescription": "Você pode ver a lista de servidores de componentes de interface na memória. Componentes da interface serão gerados pela função Ui:C:.",
	"scratchpadDescription": "O Bloco de rascunho fornece um ambiente experimental para AiScript. Permite escrever, executar e verificar os resultados do código para interagir com o Misskey.",
	"scratchpad": "Bloco de rascunho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"output": "Выходы",
	"uiInspector": "Средство проверки пользовательского интерфейса",
	"uiInspectorDescription": "Вы можете просмотреть список экземпляров компонентов пользовательского интерфейса, существующих в памяти.  Элементы пользовательского интерфейса генерируются с помощью серии функций Ui:C:.",
	"scratchpadDescription": "«Когтеточка» — это место для опытов с AiScript. Здесь можно писать программы, взаимодействующие с Misskey, запускать и смотреть что из этого получается.",
	"scratchpad": "Когтеточка"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"output": "Výstup",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "Zápisník poskytuje prostredia pre experimenty s AiScriptom. Môžete písať, spúšťať a skúšať vysledky pri interakcii s Misskey.",
	"scratchpad": "Zápisník"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"output": "เอาท์พุต",
	"uiInspector": "ตัวตรวจสอบ UI",
	"uiInspectorDescription": "คุณสามารถตรวจสอบรายชื่อเซิร์ฟเวอร์ที่เกี่ยวข้องกับส่วนประกอบอินเตอร์เฟซผู้ใช้ (UI) บนหน่วยความจำของระบบ ส่วนประกอบ UI เหล่านี้จะถูกสร้างขึ้นโดยฟังก์ชัน Ui:C:",
	"scratchpadDescription": "Scratchpad ให้สภาพแวดล้อมสำหรับการทดลอง AiScript คุณสามารถเขียนโค้ด/สั่งดำเนินการ/ตรวจสอบผลลัพธ์ ของการโต้ตอบกับ Misskey ได้",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"output": "Çıktı",
	"uiInspector": "UI denetçisi",
	"uiInspectorDescription": "Bellekteki UI bileşeni sunucu listesini görebilirsin. UI bileşeni, Ui:C: işlevi tarafından oluşturulacak.",
	"scratchpadDescription": "Scratchpad, AiScript deneyleri için bir ortam sağlar. Misskey ile etkileşim halindeyken yazabilir, çalıştırabilir ve sonuçlarını kontrol edebilirsin.",
	"scratchpad": "Not defteri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"output": "Output",
	"uiInspector": "UI inspector",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "The Scratchpad provides an environment for AiScript experiments. You can write, execute, and check the results of it interacting with Misskey in it.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"output": "Вихід",
	"uiInspector": "Інспектор UI",
	"uiInspectorDescription": "Ви можете переглянути список серверних компонентів інтерфейсу в памʼяті. Компонент інтерфейсу буде згенеровано функцією Ui:C:.",
	"scratchpadDescription": "Scratchpad надає середовище для експериментів з AiScript. Ви можете писати, виконувати його і тестувати взаємодію з Misskey.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"output": "Nguồn ra",
	"uiInspector": "Trình kiểm tra UI",
	"uiInspectorDescription": "You can see the UI component server list on memory. UI component will be generated by Ui:C: function.",
	"scratchpadDescription": "Scratchpad cung cấp môi trường cho các thử nghiệm AiScript. Bạn có thể viết, thực thi và kiểm tra kết quả tương tác với Misskey trong đó.",
	"scratchpad": "Scratchpad"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"output": "输出",
	"uiInspector": "UI 检查器",
	"uiInspectorDescription": "查看内存中所有由 UI 组件生成出的实例。UI 组件由 UI:C 系列函数所生成。",
	"scratchpadDescription": "AiScript 控制台为 AiScript 提供了实验环境。您可以编写代码与 Misskey 交互，运行并查看结果。",
	"scratchpad": "AiScript 控制台"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"output": "輸出",
	"uiInspector": "UI 檢查",
	"uiInspectorDescription": "您可以看到記憶體中存在的 UI 元件實例的清單。  UI 元件由 Ui:C: 系列函數產生。",
	"scratchpadDescription": "AiScript 控制臺為 AiScript 的實驗環境。您可以在此編寫、執行和確認程式碼與 Misskey 互動的結果。",
	"scratchpad": "暫存記憶體"
}
</locale>

<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/theme" :label="$locale.sfc.theme" :keywords="['theme']" icon="ti ti-palette">
	<div
		class="_gaps_m"
		@dragover.prevent.stop="onDragover"
		@drop.prevent.stop="onDrop"
	>
		<div v-adaptive-border class="rfqxtzch _panel">
			<div class="toggle">
				<div class="toggleWrapper">
					<div class="toggle" :class="store.r.darkMode.value ? 'checked' : null" @click="toggleDarkMode()">
						<span class="before">{{ $locale.sfc.light }}</span>
						<span class="after">{{ $locale.sfc.dark }}</span>
						<span class="toggle__handler">
							<span class="crater crater--1"></span>
							<span class="crater crater--2"></span>
							<span class="crater crater--3"></span>
						</span>
						<span class="star star--1"></span>
						<span class="star star--2"></span>
						<span class="star star--3"></span>
						<span class="star star--4"></span>
						<span class="star star--5"></span>
						<span class="star star--6"></span>
					</div>
				</div>
			</div>
			<div class="sync">
				<SearchMarker :keywords="['sync', 'device', 'dark', 'light', 'mode']">
					<MkSwitch v-model="syncDeviceDarkMode">
						<template #label><SearchLabel>{{ $locale.sfc.syncDeviceDarkMode }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</div>

		<MkInfo v-if="isSafeMode" warn>{{ $locale.sfc.themeIsDefaultBecauseSafeMode }}</MkInfo>

		<div v-else class="_gaps">
			<template v-if="!store.r.darkMode.value">
				<SearchMarker :keywords="['light', 'theme']">
					<MkFolder :defaultOpen="true" :max-height="500">
						<template #icon><i class="ti ti-sun"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.themeForLightMode }}</SearchLabel></template>
						<template #caption>{{ lightThemeName }}</template>

						<div class="_gaps_m">
							<FormSection v-if="instanceLightTheme != null" first>
								<template #label>{{ $locale.sfc.themeInstanceTheme }}</template>
								<div :class="$style.themeSelect">
									<div :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${instanceLightTheme.id}`"
											v-model="lightThemeId"
											type="radio"
											name="lightTheme"
											:class="$style.themeRadio"
											:value="instanceLightTheme.id"
										/>
										<label :for="`themeRadio_${instanceLightTheme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, instanceLightTheme)" @contextmenu.prevent.stop="onThemeContextmenu(instanceLightTheme, $event)">
											<MkThemePreview :theme="instanceLightTheme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ instanceLightTheme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>

							<FormSection v-if="installedLightThemes.length > 0" :first="instanceLightTheme == null">
								<template #label>{{ $locale.sfc.themeInstalledThemes }}</template>
								<div :class="$style.themeSelect">
									<div v-for="theme in installedLightThemes" :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${theme.id}`"
											v-model="lightThemeId"
											type="radio"
											name="lightTheme"
											:class="$style.themeRadio"
											:value="theme.id"
										/>
										<label :for="`themeRadio_${theme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, theme)" @contextmenu.prevent.stop="onThemeContextmenu(theme, $event)">
											<MkThemePreview :theme="theme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ theme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>

							<FormSection :first="installedLightThemes.length === 0 && instanceLightTheme == null">
								<template #label>{{ $locale.sfc.themeBuiltinThemes }}</template>
								<div :class="$style.themeSelect">
									<div v-for="theme in builtinLightThemes" :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${theme.id}`"
											v-model="lightThemeId"
											type="radio"
											name="lightTheme"
											:class="$style.themeRadio"
											:value="theme.id"
										/>
										<label :for="`themeRadio_${theme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, theme)" @contextmenu.prevent.stop="onThemeContextmenu(theme, $event)">
											<MkThemePreview :theme="theme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ theme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>
						</div>
					</MkFolder>
				</SearchMarker>
			</template>
			<template v-else>
				<SearchMarker :keywords="['dark', 'theme']">
					<MkFolder :defaultOpen="true" :max-height="500">
						<template #icon><i class="ti ti-moon"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.themeForDarkMode }}</SearchLabel></template>
						<template #caption>{{ darkThemeName }}</template>

						<div class="_gaps_m">
							<FormSection v-if="instanceDarkTheme != null" first>
								<template #label>{{ $locale.sfc.themeInstanceTheme }}</template>
								<div :class="$style.themeSelect">
									<div :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${instanceDarkTheme.id}`"
											v-model="darkThemeId"
											type="radio"
											name="darkTheme"
											:class="$style.themeRadio"
											:value="instanceDarkTheme.id"
										/>
										<label :for="`themeRadio_${instanceDarkTheme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, instanceDarkTheme)" @contextmenu.prevent.stop="onThemeContextmenu(instanceDarkTheme, $event)">
											<MkThemePreview :theme="instanceDarkTheme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ instanceDarkTheme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>

							<FormSection v-if="installedDarkThemes.length > 0" :first="instanceDarkTheme == null">
								<template #label>{{ $locale.sfc.themeInstalledThemes }}</template>
								<div :class="$style.themeSelect">
									<div v-for="theme in installedDarkThemes" :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${theme.id}`"
											v-model="darkThemeId"
											type="radio"
											name="darkTheme"
											:class="$style.themeRadio"
											:value="theme.id"
										/>
										<label :for="`themeRadio_${theme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, theme)" @contextmenu.prevent.stop="onThemeContextmenu(theme, $event)">
											<MkThemePreview :theme="theme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ theme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>

							<FormSection :first="installedDarkThemes.length === 0 && instanceDarkTheme == null">
								<template #label>{{ $locale.sfc.themeBuiltinThemes }}</template>
								<div :class="$style.themeSelect">
									<div v-for="theme in builtinDarkThemes" :class="$style.themeItemOuter">
										<input
											:id="`themeRadio_${theme.id}`"
											v-model="darkThemeId"
											type="radio"
											name="darkTheme"
											:class="$style.themeRadio"
											:value="theme.id"
										/>
										<label :for="`themeRadio_${theme.id}`" :class="$style.themeItemRoot" class="_button" draggable="true" @dragstart="onThemeDragstart($event, theme)" @contextmenu.prevent.stop="onThemeContextmenu(theme, $event)">
											<MkThemePreview :theme="theme" :class="$style.themeItemPreview"/>
											<div :class="$style.themeItemCaption">{{ theme.name }}</div>
										</label>
									</div>
								</div>
							</FormSection>
						</div>
					</MkFolder>
				</SearchMarker>
			</template>
		</div>

		<SearchMarker :keywords="['sync', 'themes', 'devices']">
			<MkSwitch :modelValue="themesSyncEnabled" @update:modelValue="changeThemesSyncEnabled">
				<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.settingsEnableSyncThemesBetweenDevices }}</SearchLabel></template>
			</MkSwitch>
		</SearchMarker>

		<FormSection>
			<div class="_formLinksGrid">
				<FormLink to="/settings/theme/manage"><template #icon><i class="ti ti-tool"></i></template>{{ $locale.sfc.themeManage }}<template #suffix>{{ themesCount }}</template></FormLink>
				<FormLink to="https://assets.misskey.io/theme/list" external><template #icon><i class="ti ti-world"></i></template>{{ $locale.sfc.themeExplore }}</FormLink>
				<FormLink to="/settings/theme/install"><template #icon><i class="ti ti-download"></i></template>{{ $locale.sfc.themeInstall }}</FormLink>
				<FormLink to="/theme-editor"><template #icon><i class="ti ti-paint"></i></template>{{ $locale.sfc.themeMake }}</FormLink>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import JSON5 from 'json5';
import defaultLightTheme from '@@/themes/l-light.json5';
import defaultDarkTheme from '@@/themes/d-green-lime.json5';
import { isSafeMode } from '@@/js/config.js';
import type { Theme } from '@@/js/theme.js';
import * as os from '@features/ui/frontend/os.js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkThemePreview from '@features/preferences/frontend/components/MkThemePreview.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { handleThemeInstallError, installTheme, removeTheme } from '@features/preferences/frontend/theme.js';
import { getBuiltinThemes } from '@@/js/theme.js';
import { isDeviceDarkmode } from '@features/ui/frontend/utility/is-device-darkmode.js';
import { store } from '@features/preferences/frontend/store.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { instance } from '@features/instance/frontend/instance.js';
import { uniqueBy } from '@features/runtime/frontend/utility/array.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { checkDragDataType, getDragData, getPlainDragData, setDragData, setPlainDragData } from '@features/ui/frontend/drag-and-drop.js';

const installedThemes = prefer.r.themes;
const builtinThemes = ref<Theme[]>([]);
getBuiltinThemes().then(themes => {
	builtinThemes.value = themes;
});

const instanceDarkTheme = computed<Theme | null>(() => instance.defaultDarkTheme ? JSON5.parse(instance.defaultDarkTheme) : null);
const installedDarkThemes = computed(() => installedThemes.value.filter(t => t.base === 'dark' || t.kind === 'dark'));
const builtinDarkThemes = computed(() => builtinThemes.value.filter(t => t.base === 'dark' || t.kind === 'dark'));
const instanceLightTheme = computed<Theme | null>(() => instance.defaultLightTheme ? JSON5.parse(instance.defaultLightTheme) : null);
const installedLightThemes = computed(() => installedThemes.value.filter(t => t.base === 'light' || t.kind === 'light'));
const builtinLightThemes = computed(() => builtinThemes.value.filter(t => t.base === 'light' || t.kind === 'light'));
const themes = computed(() => uniqueBy([instanceDarkTheme.value, instanceLightTheme.value, ...builtinThemes.value, ...installedThemes.value].filter(x => x != null), theme => theme.id));

const darkTheme = prefer.r.darkTheme;
const darkThemeName = computed(() => darkTheme.value?.name ?? defaultDarkTheme.name);
const darkThemeId = computed({
	get() {
		return darkTheme.value ? darkTheme.value.id : defaultDarkTheme.id;
	},
	set(id) {
		const t = themes.value.find(x => x.id === id);
		if (t) { // テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			prefer.commit('darkTheme', t);
		}
	},
});
const lightTheme = prefer.r.lightTheme;
const lightThemeName = computed(() => lightTheme.value?.name ?? defaultLightTheme.name);
const lightThemeId = computed({
	get() {
		return lightTheme.value ? lightTheme.value.id : defaultLightTheme.id;
	},
	set(id) {
		const t = themes.value.find(x => x.id === id);
		if (t) { // テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			prefer.commit('lightTheme', t);
		}
	},
});

const syncDeviceDarkMode = prefer.model('syncDeviceDarkMode');
const themesCount = installedThemes.value.length;

watch(syncDeviceDarkMode, () => {
	if (syncDeviceDarkMode.value) {
		store.set('darkMode', isDeviceDarkmode());
	}
});

async function toggleDarkMode() {
	const value = !store.r.darkMode.value;
	if (syncDeviceDarkMode.value) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: interpolateLocaleParameters($locale.value.sfc.switchDarkModeManuallyWhenSyncEnabledConfirm, { x: $locale.value.sfc.syncDeviceDarkMode }),
		});
		if (canceled) return;

		syncDeviceDarkMode.value = false;
		store.set('darkMode', value);
	} else {
		store.set('darkMode', value);
	}
}

const themesSyncEnabled = ref(prefer.isSyncEnabled('themes'));

function changeThemesSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('themes').then((res) => {
			if (res == null) return;
			if (res.enabled) themesSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('themes');
		themesSyncEnabled.value = false;
	}
}

function onThemeContextmenu(theme: Theme, ev: PointerEvent) {
	os.contextMenu([{
		type: 'label',
		text: theme.name,
	}, {
		icon: 'ti ti-clipboard',
		text: $locale.value.sfc.themeCopyThemeCode,
		action: () => {
			copyToClipboard(JSON5.stringify(theme, null, '\t'));
		},
	}, {
		icon: 'ti ti-trash',
		text: $locale.value.sfc.delete,
		danger: true,
		action: () => {
			removeTheme(theme);
		},
	}], ev);
}

function onThemeDragstart(ev: DragEvent, theme: Theme) {
	if (!ev.dataTransfer) return;

	ev.dataTransfer.effectAllowed = 'copy';
	setPlainDragData(ev, JSON5.stringify(theme, null, '\t'));
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	if (ev.dataTransfer.types[0] === 'text/plain') {
		ev.dataTransfer.dropEffect = 'copy';
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}

	return false;
}

async function onDrop(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const code = getPlainDragData(ev);
	if (code != null) {
		try {
			await installTheme(code);
		} catch (err) {
			handleThemeInstallError(err);
		}
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.theme,
	icon: 'ti ti-palette',
}));
</script>

<style module>
.themeSelect {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: var(--MI-margin);
}

.themeItemOuter {
	position: relative;
}

.themeRadio {
	position: absolute;
	clip: rect(0, 0, 0, 0);
	pointer-events: none;
}

.themeItemRoot {
	position: relative;
	display: block;
	overflow: clip;
	box-sizing: border-box;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
}

.themeRadio:focus-visible + .themeItemRoot {
	outline: 2px solid var(--MI_THEME-focus);
	outline-offset: 2px;
}

.themeRadio:checked + .themeItemRoot {
	border-color: var(--MI_THEME-accent);
}

.themeItemPreview {
	display: block;
	width: calc(100% + 2px);
	height: auto;
	margin-left: -1px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.themeItemCaption {
	box-sizing: border-box;
	padding: 8px 12px;
	text-align: center;
	font-size: 80%;
}
</style>

<style lang="scss" scoped>
.rfqxtzch {
	border-radius: 6px;

	> .toggle {
		position: relative;
		padding: 26px 0;
		text-align: center;

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}

		> .toggleWrapper {
			display: inline-block;
			text-align: left;
			overflow: clip;
			padding: 0 100px;
			vertical-align: bottom;
		}

		.toggle {
			cursor: pointer;
			display: inline-block;
			position: relative;
			width: 90px;
			height: 50px;
			margin: 4px; // focus用のアウトライン
			background-color: #83D8FF;
			border-radius: 90px - 6;
			transition: background-color 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;

			> .before, > .after {
				position: absolute;
				top: 15px;
				transition: color 1s ease;
			}

			> .before {
				left: -70px;
				color: var(--MI_THEME-accent);
			}

			> .after {
				right: -68px;
				color: var(--MI_THEME-fg);
			}

			&.checked {
				background-color: #749DD6;

				> .before {
					color: var(--MI_THEME-fg);
				}

				> .after {
					color: var(--MI_THEME-accent);
				}

				.toggle__handler {
					background-color: #FFE5B5;
					transform: translate3d(40px, 0, 0) rotate(0);

					.crater { opacity: 1; }
				}

				.star--1 {
					width: 2px;
					height: 2px;
				}

				.star--2 {
					width: 4px;
					height: 4px;
					transform: translate3d(-5px, 0, 0);
				}

				.star--3 {
					width: 2px;
					height: 2px;
					transform: translate3d(-7px, 0, 0);
				}

				.star--4,
				.star--5,
				.star--6 {
					opacity: 1;
					transform: translate3d(0,0,0);
				}

				.star--4 {
					transition: all 300ms 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--5 {
					transition: all 300ms 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--6 {
					transition: all 300ms 400ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}
			}
		}

		.toggle__handler {
			display: inline-block;
			position: relative;
			z-index: 1;
			top: 3px;
			left: 3px;
			width: 50px - 6;
			height: 50px - 6;
			background-color: #FFCF96;
			border-radius: 50px;
			box-shadow: 0 2px 6px rgba(0,0,0,.3);
			transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
			transform:  rotate(-45deg);

			.crater {
				position: absolute;
				background-color: #E8CDA5;
				opacity: 0;
				transition: opacity 200ms ease-in-out !important;
				border-radius: 100%;
			}

			.crater--1 {
				top: 18px;
				left: 10px;
				width: 4px;
				height: 4px;
			}

			.crater--2 {
				top: 28px;
				left: 22px;
				width: 6px;
				height: 6px;
			}

			.crater--3 {
				top: 10px;
				left: 25px;
				width: 8px;
				height: 8px;
			}
		}

		.star {
			position: absolute;
			background-color: #ffffff;
			transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
			border-radius: 50%;
		}

		.star--1 {
			top: 10px;
			left: 35px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--2 {
			top: 18px;
			left: 28px;
			z-index: 1;
			width: 30px;
			height: 3px;
		}

		.star--3 {
			top: 27px;
			left: 40px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--4,
		.star--5,
		.star--6 {
			opacity: 0;
			transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
		}

		.star--4 {
			top: 16px;
			left: 11px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}

		.star--5 {
			top: 32px;
			left: 17px;
			z-index: 0;
			width: 3px;
			height: 3px;
			transform: translate3d(3px,0,0);
		}

		.star--6 {
			top: 36px;
			left: 28px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}
	}

	> .sync {
		padding: 14px 16px;
		border-top: solid 0.5px var(--MI_THEME-divider);
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"theme": "المظهر",
	"light": "فاتح",
	"dark": "داكن",
	"syncDeviceDarkMode": "مطابقة الوضع المضلمومع اعدادات الجهاز",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "الحلة في الوضع الفاتح",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "السمات المثبتة",
	"themeBuiltinThemes": "السمات المدمجة",
	"themeForDarkMode": "الحلة في الوضع الداكن",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "إدارة القوالب",
	"themeExplore": "استكشف قوالب المظهر",
	"themeInstall": "تنصيب قالب",
	"themeMake": "إنشاء قالب",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "حذف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"theme": "Tema",
	"light": "Clar",
	"dark": "Fosc",
	"syncDeviceDarkMode": "Sincronitza el mode fosc amb la configuració del dispositiu",
	"themeIsDefaultBecauseSafeMode": "El tema predeterminat es farà servir mentre el mode segur estigui activat. Una vegada es desactivi el mode segur es restablirà el tema escollit.",
	"themeForLightMode": "Tema del mode clar",
	"themeInstanceTheme": "Tema de la instància ",
	"themeInstalledThemes": "Temes instal·lats ",
	"themeBuiltinThemes": "Temes integrats",
	"themeForDarkMode": "Tema del mode fosc",
	"settingsEnableSyncThemesBetweenDevices": "Sincronitzar els temes instal·lats entre dispositius",
	"themeManage": "Gestionar els temes ",
	"themeExplore": "Explorar els temes ",
	"themeInstall": "Instal·lar un tema",
	"themeMake": "Crear un tema",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" es troba activat. Vols desactivar la sincronització i canviar de mode manualment?",
	"themeCopyThemeCode": "Copiar el codi del tema",
	"delete": "Elimina"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"theme": "Vzhled",
	"light": "Světlý",
	"dark": "Tmavý",
	"syncDeviceDarkMode": "Synchronizovat tmavý vzhled s nastavením Vašeho systému",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Vzhled pro použití ve světlém režimu",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Nainstalované vzhledy",
	"themeBuiltinThemes": "Vestavěné temáta",
	"themeForDarkMode": "Vzhled k použití v tmavém režimu",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Správa vzhledů",
	"themeExplore": "Objevit témata",
	"themeInstall": "Nainstalovat vzhled",
	"themeMake": "Vytvořit téma",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Smazat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"theme": "Themes",
	"light": "Light",
	"dark": "Dark",
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Delete"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"theme": "Farbschema",
	"light": "Hell",
	"dark": "Dunkel",
	"syncDeviceDarkMode": "Einstellung deines Geräts übernehmen",
	"themeIsDefaultBecauseSafeMode": "Solange der abgesicherte Modus aktiviert ist, wird das Standard-Theme verwendet. Wenn Sie den abgesicherten Modus deaktivieren, wird es wieder zurückgesetzt.",
	"themeForLightMode": "Helles Farbschema",
	"themeInstanceTheme": "Server-Thema",
	"themeInstalledThemes": "Installierte Farbschemata",
	"themeBuiltinThemes": "Eingebaute Farbschemata",
	"themeForDarkMode": "Dunkles Farbschema",
	"settingsEnableSyncThemesBetweenDevices": "Synchronisierung von installierten Themen auf verschiedenen Endgeräten",
	"themeManage": "Farbschemaverwaltung",
	"themeExplore": "Farbschemata erforschen",
	"themeInstall": "Farbschemata installieren",
	"themeMake": "Farbschema erstellen",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" ist eingeschaltet. Möchtest du die Synchronisation ausschalten und den Modus manuell wechseln?",
	"themeCopyThemeCode": "Farbschemencode kopieren",
	"delete": "Löschen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"theme": "Themes",
	"light": "Light",
	"dark": "Dark",
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Delete"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"theme": "Tema",
	"light": "Claro",
	"dark": "Oscuro",
	"syncDeviceDarkMode": "Sincronice el Modo Oscuro con la configuración de su dispositivo",
	"themeIsDefaultBecauseSafeMode": "Mientras el modo seguro esté activado, se utilizará el tema predeterminado. Cuando se desactive el modo seguro, se volverá al tema original.",
	"themeForLightMode": "Tema para usar en Modo Linterna",
	"themeInstanceTheme": "Tema del servidor (o también denominado: tema de la instancia)",
	"themeInstalledThemes": "Temas instalados",
	"themeBuiltinThemes": "Temas integrados",
	"themeForDarkMode": "Tema para usar en Modo Oscuro",
	"settingsEnableSyncThemesBetweenDevices": "Sincronizar los temas instalados entre dispositivos.",
	"themeManage": "Gestor de temas",
	"themeExplore": "Explorar temas",
	"themeInstall": "Instalar tema",
	"themeMake": "Crear tema",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "{x} está activado ¿Te gustaría desactivar la sincronización y cambiar al modo manual?",
	"themeCopyThemeCode": "Copiar el código del tema",
	"delete": "Borrar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"theme": "Thème",
	"light": "Clair",
	"dark": "Sombre",
	"syncDeviceDarkMode": "Utiliser le mode sombre de votre appareil",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Thème à utiliser en Mode Clair",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Thèmes installés",
	"themeBuiltinThemes": "Thèmes intégrés",
	"themeForDarkMode": "Thème à utiliser en Mode Sombre",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Gestion des thèmes",
	"themeExplore": "Explorer les thèmes",
	"themeInstall": "Installer un thème",
	"themeMake": "Créer un thème",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Supprimer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"theme": "Tema",
	"light": "Terang",
	"dark": "Gelap",
	"syncDeviceDarkMode": "Sinkronkan mode gelap dengan pengaturan perangkat",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Tema untuk Mode Terang",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Tema yang dipasang",
	"themeBuiltinThemes": "Tema bawaan",
	"themeForDarkMode": "Tema untuk Mode Gelap",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manajer tema",
	"themeExplore": "Jelajahi tema",
	"themeInstall": "Pasang tema",
	"themeMake": "Buat tema",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" sedang dinyalakan. Apa anda ingin untuk menghentikan sinkronisasi dan mengganti mode secara manual?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Hapus"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"theme": "Tema",
	"light": "Chiaro",
	"dark": "Scuro",
	"syncDeviceDarkMode": "Sincronizza il tema scuro con le impostazioni del dispositivo",
	"themeIsDefaultBecauseSafeMode": "Quando la modalità sicura è attiva, viene utilizzato il tema predefinito. Quando la modalità sicura viene disattivata, il tema torna a essere quello precedente.",
	"themeForLightMode": "Tema da utilizzare per il modo chiaro",
	"themeInstanceTheme": "Tema dell'istanza",
	"themeInstalledThemes": "Temi installati",
	"themeBuiltinThemes": "Temi integrati",
	"themeForDarkMode": "Tema da utilizzare per il modo scuro",
	"settingsEnableSyncThemesBetweenDevices": "Sincronizzare il tema tra i dispositivi",
	"themeManage": "Gestione dei temi",
	"themeExplore": "Esplora temi",
	"themeInstall": "Installa un tema",
	"themeMake": "Crea un tema",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "({x}) è attiva. Vuoi disattivare la sincronizzazione e passare alla modalità manuale?",
	"themeCopyThemeCode": "Copia il codice del Tema",
	"delete": "Elimina"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"theme": "テーマ",
	"light": "ライト",
	"dark": "ダーク",
	"syncDeviceDarkMode": "デバイスのダークモードと同期する",
	"themeIsDefaultBecauseSafeMode": "セーフモードが有効な間はデフォルトのテーマが使用されます。セーフモードをオフにすると元に戻ります。",
	"themeForLightMode": "ライトモードで使うテーマ",
	"themeInstanceTheme": "サーバーのテーマ",
	"themeInstalledThemes": "インストールされたテーマ",
	"themeBuiltinThemes": "標準のテーマ",
	"themeForDarkMode": "ダークモードで使うテーマ",
	"settingsEnableSyncThemesBetweenDevices": "デバイス間でインストールしたテーマを同期",
	"themeManage": "テーマの管理",
	"themeExplore": "テーマを探す",
	"themeInstall": "テーマのインストール",
	"themeMake": "テーマを作る",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "「{x}」がオンになっています。同期をオフにして手動でモードを切り替えますか？",
	"themeCopyThemeCode": "テーマコードをコピー",
	"delete": "削除"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"theme": "テーマ",
	"light": "ライト",
	"dark": "ダーク",
	"syncDeviceDarkMode": "デバイスのダークモードと一緒にする",
	"themeIsDefaultBecauseSafeMode": "セーフモードがオンの間はデフォルトのテーマを使うで。セーフモードをオフにれば元に戻るで。",
	"themeForLightMode": "ライトモードではこのテーマ使うて",
	"themeInstanceTheme": "サーバーのテーマ",
	"themeInstalledThemes": "インストールされとるテーマ",
	"themeBuiltinThemes": "標準のテーマ",
	"themeForDarkMode": "ダークモードではこのテーマ使うて",
	"settingsEnableSyncThemesBetweenDevices": "デバイス間でインストールしたテーマを同期",
	"themeManage": "テーマの管理",
	"themeExplore": "テーマを探す",
	"themeInstall": "テーマのインストール",
	"themeMake": "テーマ作る",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "「{x}」がオンになってるで。同期切って手動でモード切り替える？",
	"themeCopyThemeCode": "テーマコードをコピー",
	"delete": "ほかす"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"theme": "Themes",
	"light": "Light",
	"dark": "Dark",
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Kkes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"theme": "Themes",
	"light": "Light",
	"dark": "Dark",
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"theme": "테마",
	"light": "라이트",
	"dark": "다크",
	"syncDeviceDarkMode": "디바이스의 다크 모드 설정과 동기화",
	"themeIsDefaultBecauseSafeMode": "세이프 모드가 활성화돼있는 동안에는 기본 테마가 사용됩니다. 세이프 모드를 끄면 원래대로 돌아옵니다.",
	"themeForLightMode": "라이트 모드에서 사용할 테마",
	"themeInstanceTheme": "서버 테마",
	"themeInstalledThemes": "설치된 테마",
	"themeBuiltinThemes": "표준 테마",
	"themeForDarkMode": "다크 모드에서 사용할 테마",
	"settingsEnableSyncThemesBetweenDevices": "기기 간 설치한 테마 동기화",
	"themeManage": "테마 관리",
	"themeExplore": "테마 둘러보기",
	"themeInstall": "테마 설치",
	"themeMake": "테마 만들기",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "'{x}'가 켜져 있습니다. 동기화를 끄고 수동으로 모드를 변경하겠습니까?",
	"themeCopyThemeCode": "테마 코드 복사",
	"delete": "삭제"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"theme": "Thema's",
	"light": "Licht",
	"dark": "Donker",
	"syncDeviceDarkMode": "Synchroniseer donkere modus met je apparaatinstellingen",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Thema voor gebruik in de lichte modus",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Thema voor gebruik in de donkere modus",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Verwijderen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"theme": "Temaer",
	"light": "Lys",
	"dark": "Mørk",
	"syncDeviceDarkMode": "Synkroniser mørkmodus med enhetens innstillinger",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Slett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"theme": "Motywy",
	"light": "Jasny",
	"dark": "Ciemny",
	"syncDeviceDarkMode": "Synchronizuj ciemny motyw z ustawieniami urządzenia",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Motyw używany w trybie jasnym",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Zainstalowane motywy",
	"themeBuiltinThemes": "Wbudowane motywy",
	"themeForDarkMode": "Motyw używany w trybie ciemnym",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Zarządzanie motywami",
	"themeExplore": "Przeglądaj motywy",
	"themeInstall": "Zainstaluj motyw",
	"themeMake": "Utwórz motyw",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Usuń"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"theme": "Tema",
	"light": "Claro",
	"dark": "Escuro",
	"syncDeviceDarkMode": "Sincronize com o modo escuro do dispositivo",
	"themeIsDefaultBecauseSafeMode": "Enquanto o modo seguro estiver ativo, o tema padrão é utilizado. Desabilitar o modo seguro reverterá essas mudanças.",
	"themeForLightMode": "Temas usados \u200b\u200bno modo de luz",
	"themeInstanceTheme": "Tema do servidor",
	"themeInstalledThemes": "Temas instalados",
	"themeBuiltinThemes": "Temas nativos",
	"themeForDarkMode": "Temas usados \u200b\u200bno modo escuro",
	"settingsEnableSyncThemesBetweenDevices": "Sincronizar temas instalados entre dispositivos",
	"themeManage": "Gerenciar temas",
	"themeExplore": "Explorar Temas",
	"themeInstall": "Instalar um tema",
	"themeMake": "Fazer um tema",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" está ativado. Você gostaria de desligar a sincronização e alterar manualmente?",
	"themeCopyThemeCode": "Copiar código do tema",
	"delete": "Excluir"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"theme": "Тема",
	"light": "Светлый",
	"dark": "Тёмный",
	"syncDeviceDarkMode": "Синхронизировать с тёмной темой системы",
	"themeIsDefaultBecauseSafeMode": "Пока безопасный режим активен, тема по умолчанию будет использована. При выключении безопасного режима тема применится обратно.",
	"themeForLightMode": "Тема для светлого режима",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Установленные темы",
	"themeBuiltinThemes": "Встроенные темы",
	"themeForDarkMode": "Тема для тёмного режима",
	"settingsEnableSyncThemesBetweenDevices": "Синхронизировать темы между устройствами",
	"themeManage": "Менеджер тем",
	"themeExplore": "Обзор",
	"themeInstall": "Установить тему",
	"themeMake": "Создать тему",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "Включена функция \"{x}\". Отключить синхронизацию, чтобы переключать режим вручную?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Удалить"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"theme": "Téma",
	"light": "Svetlá",
	"dark": "Tmavá",
	"syncDeviceDarkMode": "Synchronizovať tmavú tému s nastavení vášho systému",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Téma pri svetlom režime",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Nainštalované témy",
	"themeBuiltinThemes": "Vstavané témy",
	"themeForDarkMode": "Téma pri tmavom režime",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Spravovať témy",
	"themeExplore": "Objavovať témy",
	"themeInstall": "Nainštalovať tému",
	"themeMake": "Vytvoriť tému",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Odstrániť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"theme": "ธีม",
	"light": "สว่าง",
	"dark": "มืด",
	"syncDeviceDarkMode": "ซิงค์โหมดมืดกับการตั้งค่าอุปกรณ์ของคุณ",
	"themeIsDefaultBecauseSafeMode": "ในระหว่างที่โหมดปลอดภัยถูกเปิดใช้งาน จะใช้ธีมเริ่มต้น เมื่อปิดโหมดปลอดภัยจะกลับคืนดังเดิม",
	"themeForLightMode": "ธีมที่จะใช้ในโหมดสว่าง",
	"themeInstanceTheme": "ธีมของเซิร์ฟเวอร์",
	"themeInstalledThemes": "ธีมที่ติดตั้ง",
	"themeBuiltinThemes": "ธีมในตัว",
	"themeForDarkMode": "ธีมที่จะใช้ในโหมดมืด",
	"settingsEnableSyncThemesBetweenDevices": "ซิงค์ธีมที่ติดตั้งระหว่างอุปกรณ์",
	"themeManage": "จัดการธีม",
	"themeExplore": "สำรวจธีม",
	"themeInstall": "ติดตั้งธีม",
	"themeMake": "ทำธีม",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "“{x}” เปิดอยู่ ต้องการปิดการซิงค์และสลับโหมดด้วยตนเองหรือไม่?",
	"themeCopyThemeCode": "คัดลอกรหัสธีม",
	"delete": "ลบ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"theme": "Tema",
	"light": "Aydınlık",
	"dark": "Karanlık",
	"syncDeviceDarkMode": "Karanlık Modu cihaz ayarlarınızla senkronize et",
	"themeIsDefaultBecauseSafeMode": "Güvenli mod etkinken, varsayılan tema kullanılır. Güvenli modu devre dışı bırakmak bu değişiklikleri geri alır.",
	"themeForLightMode": "Aydınlık Mod'da kullanılacak tema",
	"themeInstanceTheme": "Sunucu teması",
	"themeInstalledThemes": "Yüklü temalar",
	"themeBuiltinThemes": "Yerleşik temalar",
	"themeForDarkMode": "Karanlık Mod'da kullanılacak tema",
	"settingsEnableSyncThemesBetweenDevices": "Yüklü temaları cihazlar arasında senkronize edin",
	"themeManage": "Temaları yönet",
	"themeExplore": "Temaları Keşfedin",
	"themeInstall": "Bir tema yükle",
	"themeMake": "Bir tema oluşturun",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" açık. Senkronizasyonu kapatıp modları manuel olarak değiştirmek ister misin?",
	"themeCopyThemeCode": "Tema kodunu kopyala",
	"delete": "Sil"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"theme": "Themes",
	"light": "Light",
	"dark": "Dark",
	"syncDeviceDarkMode": "Sync Dark Mode with your device settings",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Theme to use in Light Mode",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Installed themes",
	"themeBuiltinThemes": "Built-in themes",
	"themeForDarkMode": "Theme to use in Dark Mode",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Manage themes",
	"themeExplore": "Explore Themes",
	"themeInstall": "Install a theme",
	"themeMake": "Make a theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"theme": "Тема",
	"light": "Світла",
	"dark": "Темна",
	"syncDeviceDarkMode": "Синхронізувати темний режим із налаштуваннями вашого пристрою",
	"themeIsDefaultBecauseSafeMode": "Поки активний безпечний режим, використовується типова тема. Вимкнення безпечного режиму скасує ці зміни.",
	"themeForLightMode": "Світла тема",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Встановлені теми",
	"themeBuiltinThemes": "Вбудоваі теми",
	"themeForDarkMode": "Темна тема",
	"settingsEnableSyncThemesBetweenDevices": "Синхронізувати встановленні теми між пристроями",
	"themeManage": "Керування темами",
	"themeExplore": "Оглянути теми",
	"themeInstall": "Встановити тему",
	"themeMake": "Створити тему",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "Увімкнено «{x}». Бажаєте вимкнути синхронізацію та перемикати режими вручну?\n",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Видалити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"theme": "Chủ đề",
	"light": "Sáng",
	"dark": "Tối",
	"syncDeviceDarkMode": "Đồng bộ với thiết bị",
	"themeIsDefaultBecauseSafeMode": "While safe mode is active, the default theme is used. Disabling safe mode will revert these changes.",
	"themeForLightMode": "Chủ đề dùng trong trong chế độ Sáng",
	"themeInstanceTheme": "Server theme",
	"themeInstalledThemes": "Theme đã cài đặt",
	"themeBuiltinThemes": "Theme tích hợp sẵn",
	"themeForDarkMode": "Chủ đề dùng trong chế độ Tối",
	"settingsEnableSyncThemesBetweenDevices": "Synchronize installed themes across devices",
	"themeManage": "Quản lý theme",
	"themeExplore": "Khám phá theme",
	"themeInstall": "Cài đặt theme",
	"themeMake": "Tạo theme",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "\"{x}\" is turned on. Would you like to turn off synchronization and switch modes manually?",
	"themeCopyThemeCode": "Copy theme code",
	"delete": "Xóa"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"theme": "主题",
	"light": "浅色",
	"dark": "深色",
	"syncDeviceDarkMode": "将深色模式与设备设置同步",
	"themeIsDefaultBecauseSafeMode": "启用安全模式时将使用默认主题。关闭安全模式后将还原。",
	"themeForLightMode": "在浅色模式下使用的主题",
	"themeInstanceTheme": "服务器主题",
	"themeInstalledThemes": "已安装的主题",
	"themeBuiltinThemes": "标准主题",
	"themeForDarkMode": "在深色模式下使用的主题",
	"settingsEnableSyncThemesBetweenDevices": "在设备间同步已安装的主题",
	"themeManage": "主题管理",
	"themeExplore": "寻找主题",
	"themeInstall": "安装主题",
	"themeMake": "制作主题",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "“{x}” 已开启。要关闭同步并手动切换模式吗？",
	"themeCopyThemeCode": "复制主题代码",
	"delete": "删除"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"theme": "佈景主題",
	"light": "淺色",
	"dark": "深色",
	"syncDeviceDarkMode": "與裝置的深色模式同步",
	"themeIsDefaultBecauseSafeMode": "在安全模式啟用期間將使用預設主題。關閉安全模式後會恢復原本的設定。",
	"themeForLightMode": "在淺色模式下使用的佈景主題",
	"themeInstanceTheme": "伺服器的主題",
	"themeInstalledThemes": "已經安裝的佈景主題",
	"themeBuiltinThemes": "標準佈景主題",
	"themeForDarkMode": "在深色模式下使用的佈景主題",
	"settingsEnableSyncThemesBetweenDevices": "在裝置之間同步已安裝的主題",
	"themeManage": "管理佈景主題",
	"themeExplore": "探索佈景主題",
	"themeInstall": "安裝佈景主題",
	"themeMake": "製作佈景主題",
	"switchDarkModeManuallyWhenSyncEnabledConfirm": "「{x}」已開啟。要關閉同步並手動切換模式嗎？\n",
	"themeCopyThemeCode": "複製主題代碼",
	"delete": "刪除"
}
</locale>

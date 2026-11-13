# SFC・アクセシビリティ

新規 SFC は TypeScript の `<script setup>`、type-only props / emits、`<style lang="scss" module>` を使う。v-model には `defineModel` を使う。
既存例: [MkInfo.vue](../../../../../packages/features/ui/frontend/components/MkInfo.vue)、[MkInput.vue](../../../../../packages/features/ui/frontend/components/MkInput.vue)、[MkSelect.vue](../../../../../packages/features/ui/frontend/components/MkSelect.vue)。

操作には button、リンクには MkA を使う。非標準のクリック要素は role / focus / Enter・Space 操作を揃える。
フォームの label、アイコンのみの操作の accessible name、disabled 時のハンドラ抑止、キーボード操作・focus を確認する。
`_button` は装飾リセットで ripple 等は含まない。必要なら [MkButton.vue](../../../../../packages/features/ui/frontend/components/MkButton.vue) を使う。

表示文言は [i18n](i18n-usage.md)、色と共通スタイルは [テーマ変数](scss-modules.md)、dialog は [os.*](os-api.md) を使う。アイコンは既存の Tabler icons に合わせる。

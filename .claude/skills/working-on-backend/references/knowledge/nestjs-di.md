# DI

Repository / config 等の token は [di-symbols.ts](../../../../../packages/backend/src/di-symbols.ts)、provider は [GlobalModule.ts](../../../../../packages/features/boot/backend/assembly/GlobalModule.ts) を参照する。
Service は型で注入し、追加時は [CoreModule.ts](../../../../../packages/features/boot/backend/assembly/CoreModule.ts) 等の該当 module に登録する。
API の組み立ては [feature index](../../../../../packages/features/index/backend/) を参照する。
具体的な注入方法は近い既存実装に合わせる。

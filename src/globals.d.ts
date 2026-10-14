// import { Plugin } from "obsidian";

import { SyncPlugin, InternalPlugin } from "@obsidian-typings/obsidian-public-latest";
import { Events } from "obsidian";

export {}; // This line is required. If there are no top-level `import/export` statements, your typings will work not as expected.
declare module '@obsidian-typings/obsidian-public-latest' {
	interface SyncPluginInstance extends InternalPlugin<SyncPlugin>, Events {
		getStatus(): string
		deviceName?: string
		getDefaultDeviceName(): string
	}
}
import { Plugin } from "obsidian";

declare module "obsidian" {
	interface App {
		isMobile: boolean
		commands: {
			executeCommand: (command: Command) =>  Promise<void>;
			commands: { [key: string]: Command; }
		}
		plugins: {
			plugins: {
				[pluginId: string]: Plugin & {
					[pluginImplementations: string]: unknown;
				};
			};
			enablePlugin: (id: string) => Promise<void>;
			disablePlugin: (id: string) => Promise<void>;
		};
		internalPlugins: {
			plugins: {
				[pluginId: string]: Plugin & {
					[pluginImplementations: string]: unknown;
				};
			};
			enablePlugin: (id: string) => Promise<void>;
			disablePlugin: (id: string) => Promise<void>;
		};
	}
}

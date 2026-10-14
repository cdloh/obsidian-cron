import { App, EventRef } from 'obsidian';
import { CronJobSettings } from './job';
import Cron from './main';
import { SyncPluginInstance } from '@obsidian-typings/obsidian-public-latest';

const syncEmitterName = 'status-change';
const syncCompletedStatus = 'synced';

type promiseEntry = {
	resolve: () => void
	reject: (value?: string) => void
}

export default class SyncChecker {
	syncInstance: SyncPluginInstance
	eventRef: EventRef
	plugin: Cron
	syncWaiters: Array<promiseEntry> = []

	public constructor(app: App, plugin: Cron) {
		this.syncInstance = app.internalPlugins.plugins['sync'].instance;
		this.plugin = plugin;
		this.eventRef = this.syncInstance.on(syncEmitterName, this.handleSyncStatusChange.bind(this))
	}

	public deviceName(): string {
		return this.syncInstance.deviceName ? this.syncInstance.deviceName : this.syncInstance.getDefaultDeviceName()
	}

	private handleSyncStatusChange(): void {
		if(this.syncInstance.getStatus() === syncCompletedStatus) {
			this.clearSyncWaiters()
		}
	}

	private clearSyncWaiters(): void {
		this.syncWaiters.forEach(waiter => {
			waiter.resolve()
		});
	}

	public handleUnload():void {
		this.syncWaiters.forEach(waiter => {
			waiter.reject("Unloading plugin")
		});

		// Unload the listener
		this.syncInstance.offref(this.eventRef);
	}

	public waitForSync(settings: CronJobSettings): Promise<void> {
		return new Promise((resolve, reject) => {
			if(settings.disableSyncCheck) resolve();
			if(!this.plugin.settings.watchObsidianSync) resolve();
			if(this.syncInstance.getStatus() === syncCompletedStatus) { resolve() }
			this.syncWaiters.push({resolve: resolve, reject: reject})
		})
	}

}

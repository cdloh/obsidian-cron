import { App } from 'obsidian';
import { CronJobSettings } from './job';
import Cron from './main';

const syncEmitterName = 'status-change';
const syncCompletedStatus = 'synced';
const syncWaiterCtxID = "syncWaiter";

type promiseEntry = {
	resolve: () => void
	reject: (value?: string) => void
}

export default class SyncChecker {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	syncInstance: any
	plugin: Cron
	syncWaiters: Array<promiseEntry>

	public constructor(app: App, plugin: Cron) {
		this.syncInstance = app.internalPlugins.plugins['sync'].instance;
		this.plugin = plugin;
		this.syncWaiters = [];

		this.syncInstance.on(syncEmitterName, this.handleSyncStatusChange.bind(this), syncWaiterCtxID)
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
		this.syncInstance._[syncEmitterName] = this.syncInstance._[syncEmitterName].filter((listener: { ctx: string; }) => {
			if(listener.ctx === syncWaiterCtxID) return false
			return true
		})
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

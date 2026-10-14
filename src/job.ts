import { App, Platform } from 'obsidian';
import CronLockManager from './lockManager';
import Cron from './main';
import SyncChecker from './syncChecker';
import { CronExpressionParser } from 'cron-parser';

export interface CronJobFunc {(app:App): Promise<void> | void}

export interface CronJobSettings {
	enableMobile?: boolean
	disableSyncCheck?: boolean
	disableJobLock?: boolean
	disabled?: boolean
}

export default class Job {
	syncChecker: SyncChecker;
	plugin: Cron
	app: App;

	lockManager: CronLockManager;
	frequency: string
	settings: CronJobSettings
	job: CronJobFunc | string
	name: string
	id: string
	noRunReason = 'unknown'

	public constructor(id: string, name: string, job: CronJobFunc | string, frequency: string, settings: CronJobSettings, app: App, plugin: Cron, syncChecker: SyncChecker) {
		this.syncChecker = syncChecker;
		this.plugin = plugin;
		this.app = app;

		this.lockManager = new CronLockManager(id, settings, plugin, syncChecker)
		this.name = name;
		this.id = id;
		this.job = job;
		this.frequency = frequency;
		this.settings = settings;

	}

	public async runJob(): Promise<void> {

		console.debug(`Running ${this.name}`);

		await this.lockManager.lockJob()

		typeof this.job == "string" ? await this.runJobCommand() : await this.runJobFunction();

		await this.lockManager.updateLastrun()
		await this.lockManager.unlockJob()
	}

	public canRunJob(): boolean {
		if(this.settings.disabled) {
			this.noRunReason = "job disabled"
			return false
		}

		if(this.lockManager.jobLocked() && !this.settings.disableJobLock) {
			this.noRunReason = "job locked"
			return false
		}

		if(Platform.isMobile && !this.settings.enableMobile){
			this.noRunReason = "disabled on mobile"
			return false
		}

		if(!this.jobIntervalPassed()) {
			this.noRunReason = "job interval hasnt passed"
			return false
		}

		return true
	}

	public clearJobLock(): void {
		this.lockManager.clearLock()
	}

	private jobIntervalPassed(): boolean {
		// job never ran
		const lastRun = this.lockManager.lastRun()
		if(!lastRun) return true

		const prevRun = window.moment(CronExpressionParser.parse(this.frequency).prev().toDate())
		return prevRun.isAfter(lastRun)
	}

	private async runJobFunction(): Promise<void> {
		if(typeof this.job !== 'function') { return }

		try {
			await this.job(this.app)
			console.debug(`${this.name} completed`)
		} catch (error) {
			console.error(`${this.name} failed to run`)
			console.error(error)
		}
	}

	private async runJobCommand(): Promise<void> {
		if(typeof this.job !== 'string') { return }

		const jobCommand = this.app.commands.commands[this.job];

		if(!jobCommand) {
			console.error(`${this.name} failed to run: Command unknown`)
			return
		}

		this.app.commands.executeCommand(jobCommand)
	}

}

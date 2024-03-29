import { Plugin } from 'obsidian';
import Job, { CronJobFunc, CronJobSettings } from './job';
import { CronLock } from './lockManager';
import CronLockManager from './lockManager';
import CronSettingTab from './settings';
import SyncChecker from './syncChecker';
import CronAPI from './api';

export interface CronSettings {
	cronInterval: number;
	runOnStartup: boolean
	enableMobile: boolean
	watchObsidianSync: boolean
	crons: Array<CRONJob>,
	locks: { [key: string]: CronLock }
}

export interface CRONJob {
	id: string
	name: string
	job: string
	frequency: string
	settings: CronJobSettings
}

const DEFAULT_SETTINGS: CronSettings = {
	cronInterval: 15,
	runOnStartup: true,
	enableMobile: true,
	watchObsidianSync: true,
	crons: [],
	locks: {}
}

export default class Cron extends Plugin {
	static instance: Cron
	interval: number;
	settings: CronSettings;
	syncChecker: SyncChecker
	lockManager: CronLockManager
	jobs: { [key: string]: Job }
	api: CronAPI

	async onload() {
		console.log("Loading Obsidian CRON!");
		Cron.instance = this;
		await this.loadSettings();

		this.addSettingTab(new CronSettingTab(this.app, this));
		this.syncChecker = new SyncChecker(this.app, this);

		this.jobs = {}

		// load our cronjobs
		this.loadCrons()
		this.loadInterval()
		this.api = CronAPI.get(this)
		this.app.workspace.onLayoutReady(() => {
			if(this.settings.runOnStartup) {
				if(this.app.isMobile && !this.settings.enableMobile) { return }
				this.runCron()
			}
		})
	}

	public async runCron() {
		// console.log("Running Obsidian Cron!")
		for (const [, job] of Object.entries(this.jobs)) {
			await this.syncChecker.waitForSync(job.settings)

			// reload the settings incase we've had a new lock come in via sync
			await this.loadSettings()

			if(!job.canRunJob()) {
				// console.log(`Can't run job: ${job.noRunReason}`)
				continue
			}

			await job.runJob()
		}
	}

	public addCronJob(name: string, frequency: string, settings: CronJobSettings, job: CronJobFunc) {
		const existingJob = this.getJob(name)
		if(existingJob) throw new Error("CRON Job already exists")

		this.jobs[name] = new Job(name, name, job, frequency, settings, this.app, this, this.syncChecker)
	}

	public async runJob(name: string) {
		const job = this.getJob(name)
		if(!job) throw new Error("CRON Job doesn't exist")
		await job.runJob()
	}

	public clearJobLock(name: string) {
		const job = this.getJob(name)
		if(!job) throw new Error("CRON Job doesn't exist")
		job.clearJobLock()
	}

	public getJob(name: string): Job | null {
		for (const [, job] of Object.entries(this.jobs)) {
			if(job.name == name) return job
		}
		return null
	}

	public onunload() {
		if(this.settings.watchObsidianSync)	this.syncChecker.handleUnload()
		console.log("Cron unloaded")
	}

	public loadCrons() {
		this.settings.crons.forEach(cronjob => {
			if(cronjob.frequency === "" || cronjob.job === "") {
				return;
			}

			this.jobs[cronjob.id] = new Job(cronjob.id, cronjob.name, cronjob.job, cronjob.frequency, cronjob.settings, this.app, this, this.syncChecker)
		});
	}

	public loadInterval() {
		clearInterval(this.interval)
		if(this.app.isMobile && !this.settings.enableMobile) { return }
		this.interval = window.setInterval(async () => { await this.runCron()	}, this.settings.cronInterval * 60 * 1000)
		this.registerInterval(this.interval)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

import { CronJobFunc, CronJobSettings } from "./job"
import Cron from "./main"


export default class CronAPI {
	static instance: CronAPI

	public static get(plugin: Cron) {
		return {
			addCronJob(name: string, frequency: string, settings: CronJobSettings, job: CronJobFunc) {
				return plugin.addCronJob(name, frequency, settings, job)
			},
			runJob(name: string) {
				return plugin.runJob(name)
			},
			clearJobLock(name: string) {
				return plugin.clearJobLock(name)
			},
			getJob(name: string) {
				return plugin.getJob(name)
			},
		}
	}
}

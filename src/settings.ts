import { App, PluginSettingTab, Setting } from 'obsidian';
import { CommandSuggest } from './commandSuggest';
import type Cron from './main';

export default class CronSettingTab extends PluginSettingTab {
	plugin: Cron;

	constructor(app: App, plugin: Cron) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Cron.'});

		new Setting(containerEl)
			.setName('Cron Interval')
			.setDesc('The interval the cron will run in minutes')
			.addText(text => text
				.setValue(this.plugin.settings.cronInterval.toString())
				.onChange(async (value) => {
					if(value == "") {return}
					this.plugin.settings.cronInterval = parseInt(value);
					await this.plugin.saveSettings();
					this.plugin.loadInterval();
				})
			);

		new Setting(containerEl)
			.setName('Enable Obsidian Sync Checker')
			.setDesc('Whether or not to wait for Obsidian sync before running any CRONs globally.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.watchObsidianSync)
				.onChange(async (value) => {
					this.plugin.settings.watchObsidianSync = value;
					await this.plugin.saveSettings();
				})
			);

		const desc = document.createDocumentFragment();
		desc.append(
			"List of CRON Jobs to run. Jobs will not be ran until all 3 fields have been filled",
			desc.createEl("br"),
			"Cron Frequency is a cron schedule expression. Use ",
			desc.createEl("a", {
					href: "https://crontab.guru/",
					text: "crontab guru",
			}),
			" for help with creating cron schedule expressions."
		);

		new Setting(containerEl)
			.setName("Cron Jobs")
			.setDesc(desc)

		this.addCommandSearch()
	}

	addCommandSearch (): void {

		this.plugin.settings.crons.forEach((cronjob, index) => {
			const jobSetting = new Setting(this.containerEl)
				.addText(text => text
					.setValue(cronjob.name)
					.setPlaceholder("Job name")
					.onChange(async (value) => {
						this.plugin.settings.crons[index].name = value;
						await this.plugin.saveSettings();
						this.plugin.loadCrons();
					})
					.inputEl.addClass('cron-plugin-text-input')
				)
				.addSearch((cb) => {
						new CommandSuggest(cb.inputEl);
						cb.setPlaceholder("Command")
							.setValue(cronjob.job)
							.onChange(async (command) => {
								if(!command) { return }

								this.plugin.settings.crons[index].job = command;
								await this.plugin.saveSettings();
								this.plugin.loadCrons();
							})
							.inputEl.addClass('cron-plugin-text-input')
				})
				.addText(text => text
					.setPlaceholder("CronJob frequency")
					.setValue(cronjob.frequency)
					.onChange(async (value) => {
						this.plugin.settings.crons[index].frequency = value;
						await this.plugin.saveSettings();
						this.plugin.loadCrons();
					})
					.inputEl.addClass('cron-plugin-text-input')
				)
				.addExtraButton((button) => {
					button.setIcon(cronjob.settings.enableMobile ? "lucide-phone" : "lucide-phone-off")
						.setTooltip("Toggle job on mobile")
						.onClick(async () => {
							this.plugin.settings.crons[index].settings.enableMobile = !cronjob.settings.enableMobile;
							await this.plugin.saveSettings();
							// refresh
							this.display()
						})
				})

				const jobLocked = this.plugin.settings.locks[cronjob.name] && this.plugin.settings.locks[cronjob.name].locked
				jobSetting.addExtraButton((button) => {
					button.setIcon(jobLocked ? "lucide-lock" : "lucide-unlock")
						.setTooltip("Toggle job lock (clear lock if accidentally left locked)")
						.onClick(() => {
							this.plugin.settings.locks[cronjob.name].locked = !jobLocked;
							this.plugin.saveSettings();
							// refresh
							this.display()
						})
				})

				jobSetting.addExtraButton((button) => {
					button.setIcon(cronjob.settings.disableSyncCheck ? "paused" : "lucide-check-circle-2")
						.setTooltip("Toggle Sync check for this job. Presently: " + (cronjob.settings.disableSyncCheck ? "disabled" : "enabled"))
						.onClick(() => {
							this.plugin.settings.crons[index].settings.disableSyncCheck = !cronjob.settings.disableSyncCheck;
							this.plugin.saveSettings();
							// Force refresh
							this.display();
						});
				})
				.addExtraButton((button) => {
					button.setIcon("cross")
						.setTooltip("Delete Job")
						.onClick(() => {
							this.plugin.settings.crons.splice(index, 1)
							delete this.plugin.settings.locks[cronjob.name]
							this.plugin.saveSettings();
							// Force refresh
							this.display();
						});
				});

				jobSetting.controlEl.addClass("cron-plugin-job")
		});

		new Setting(this.containerEl).addButton((cb) => {
			cb.setButtonText("Add cron job")
				.setCta()
				.onClick(() => {
					this.plugin.settings.crons.push({
						name: "",
						job: "",
						frequency: "",
						settings: {
							enableMobile: false
						}
					})
					this.plugin.saveSettings();
					// Force refresh
					this.display();
				});
		});
	}
}

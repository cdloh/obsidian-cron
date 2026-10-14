import { App, ExtraButtonComponent, PluginSettingTab, SearchComponent, TextComponent, setTooltip } from 'obsidian';
import type { SettingDefinitionItem, SettingGroupItem } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { CommandSuggest } from './commandSuggest';
import type Cron from './main';
import { DEFAULT_SETTINGS } from './main';

export default class CronSettingTab extends PluginSettingTab {
	plugin: Cron;

	constructor(app: App, plugin: Cron) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const cronJobsDesc = createFragment();
		cronJobsDesc.append(
			"List of CRON Jobs to run. Jobs will not be ran until all 3 fields have been filled",
			cronJobsDesc.createEl("br"),
			"Cron Frequency is a cron schedule expression. Use ",
			cronJobsDesc.createEl("a", {
				href: "https://crontab.guru/",
				text: "Crontab guru",
			}),
			" for help with creating cron schedule expressions."
		);

		return [
			{
				type: 'group',
				heading: 'Settings for Cron.',
				items: [
					{
						name: 'Cron Interval',
						desc: 'The interval the cron will run in minutes.',
						control: {
							type: 'number',
							key: 'cronInterval',
							placeholder: DEFAULT_SETTINGS.cronInterval.toString(),
							defaultValue: DEFAULT_SETTINGS.cronInterval,
							// use the validator to reload our interval if it changes
							validate: (interval) => {
								if(interval == this.plugin.settings.cronInterval) {
									return;
								}
								this.plugin.loadInterval(interval)
								return;
							},
						},
					},
					{
						name: 'Run cron on startup',
						desc: 'Do a cron run on startup instead of waiting for the first interval to pass.',
						control: { type: 'toggle', key: 'runOnStartup', defaultValue: DEFAULT_SETTINGS.runOnStartup },
					},
					{
						name: 'Enable Obsidian Sync checker',
						desc: 'Whether or not to wait for Obsidian Sync before running any crons globally.',
						control: { type: 'toggle', key: 'watchObsidianSync', defaultValue: DEFAULT_SETTINGS.watchObsidianSync },
					},
					{
						name: 'Enable cron on mobile',
						desc: 'Whether or not to load jobs at all on mobile devices. If disabled even jobs with mobile enabled will not run.',
						control: { type: 'toggle', key: 'enableMobile', defaultValue: DEFAULT_SETTINGS.enableMobile },
					},
				],
			},
			{
				name: 'Cron Jobs',
				desc: cronJobsDesc,
			},
			{
				type: 'list',
				emptyState: 'No cron jobs yet.',
				items: this.getCronJobItems(),
				addItem: {
					name: 'Add cron job',
					action: () => {
						this.plugin.settings.crons.push({
							id: uuidv4(),
							name: "",
							job: "",
							frequency: "",
							settings: {
								enableMobile: false
							}
						})
						void this.plugin.saveSettings();
						this.update();
					},
				},
			},
		];
	}

	getCronJobItems(): SettingGroupItem[] {
		return this.plugin.settings.crons.map((cronjob, index): SettingGroupItem => ({
			name: cronjob.name || 'Unnamed cron job',
			render: (setting) => {
				// The name input acts as the label, so hide the default one
				setting.setName('');
				setting.settingEl.addClass('cron-plugin-job');

				const jobLocked = this.plugin.settings.locks[cronjob.id] && this.plugin.settings.locks[cronjob.id]!.locked;

				// Row 1: the three inputs side by side. Row 2: the action buttons.
				const fieldsEl = setting.controlEl.createDiv('cron-plugin-job-fields');
				const actionsEl = setting.controlEl.createDiv('cron-plugin-job-actions');

				const nameInput = new TextComponent(fieldsEl)
					.setValue(cronjob.name)
					.setPlaceholder("Job name")
					.onChange(async (value) => {
						this.plugin.settings.crons[index]!.name = value;
						await this.plugin.saveSettings();
						this.plugin.loadCrons();
					});
				nameInput.inputEl.addClass('cron-plugin-text-input');

				const commandSearch = new SearchComponent(fieldsEl);
				new CommandSuggest(this.app, commandSearch.inputEl)
					.onSelect(async (command) => {
						this.plugin.settings.crons[index]!.job = command.id;
						await this.plugin.saveSettings();
						this.plugin.loadCrons();
					});
				const currentCommand = this.app.commands.findCommand(cronjob.job)?.name;
				commandSearch
					.setPlaceholder("Command")
					.setValue(currentCommand ? currentCommand : cronjob.job)
					.inputEl.addClass('cron-plugin-text-input');

				const frequencyInput = new TextComponent(fieldsEl)
					.setPlaceholder("Cronjob frequency")
					.setValue(cronjob.frequency)
					.onChange(async (value) => {
						this.plugin.settings.crons[index]!.frequency = value;
						await this.plugin.saveSettings();
						this.plugin.loadCrons();
					});
				frequencyInput.inputEl.addClass('cron-plugin-text-input');

				// Hover tooltips on the three inputs
				setTooltip(nameInput.inputEl, "Name for this job. Shown in the list and in logs.", { placement: 'top' });
				setTooltip(commandSearch.inputEl, "Obsidian command to run. Start typing to search, or enter a command ID.", { placement: 'top' });
				setTooltip(frequencyInput.inputEl, "When to run, as a cron expression (e.g. */15 * * * * = every 15 minutes).", { placement: 'top' });

				new ExtraButtonComponent(actionsEl)
					.setIcon(cronjob.settings.enableMobile ? "lucide-phone" : "lucide-phone-off")
					.setTooltip("Toggle job on mobile")
					.onClick(async () => {
						this.plugin.settings.crons[index]!.settings.enableMobile = !cronjob.settings.enableMobile;
						await this.plugin.saveSettings();
						this.update();
					});

				new ExtraButtonComponent(actionsEl)
					.setIcon(jobLocked ? "lucide-lock" : "lucide-unlock")
					.setTooltip("Toggle job lock (clear lock if accidentally left locked)")
					.onClick(async () => {
						this.plugin.settings.locks[cronjob.id]!.locked = !jobLocked;
						await this.plugin.saveSettings();
						this.update();
					});

				new ExtraButtonComponent(actionsEl)
					.setIcon(cronjob.settings.disableSyncCheck ? "paused" : "lucide-check-circle-2")
					.setTooltip("Toggle Sync check for this job. Presently: " + (cronjob.settings.disableSyncCheck ? "disabled" : "enabled"))
					.onClick(async () => {
						this.plugin.settings.crons[index]!.settings.disableSyncCheck = !cronjob.settings.disableSyncCheck;
						await this.plugin.saveSettings();
						this.update();
					});

					new ExtraButtonComponent(actionsEl)
					.setIcon(cronjob.settings.disabled ? "lucide-power-off" : "lucide-power")
					.setTooltip("Disable this job entirely. Presently: " + (cronjob.settings.disabled ? "disabled" : "enabled"))
					.onClick(async () => {
						this.plugin.settings.crons[index]!.settings.disabled = !cronjob.settings.disabled;
						await this.plugin.saveSettings();
						this.update();
					});

				new ExtraButtonComponent(actionsEl)
					.setIcon("cross")
					.setTooltip("Delete job")
					.onClick(async () => {
						this.plugin.settings.crons.splice(index, 1);
						delete this.plugin.jobs[cronjob.id]
						delete this.plugin.settings.locks[cronjob.id];
						await this.plugin.saveSettings();
						this.update();
					});
			},

		}));
	}
}

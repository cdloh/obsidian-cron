# Obsidian Cron Plugin

Obsidian Cron is a plugin for Obsidian.md that allows users to schedule Obsidian commands or custom user scripts to run automatically on a schedule.

# Installation
To install Obsidian Cron you can download it through the community packages within Obsidian, or download the latest release and add it manually.

# Usage

Add jobs in the plugin settings page.

Each job requires

1. a name
2. an Obsidian command to run
3. a cron schedule syntax expression
   * This will be the frequency your job runs. If you need help writing a cron schedule [crontab.guru](https://crontab.guru/) can help

Each job also has three toggable options

1. Enable job to run on mobile
   * By default all jobs do not run on mobile
2. Toggle job lock
   * If your job gets stuck with a bad log you can toggle the status here. Check [locking](#locking) for more details
3. Toggle sync check
   * Toggles the sync check ability on a per job basis. Check [sync](#sync) for more details

# Functionality

## API / UserScripts

An API is exposed to add user functions via Javascript. The name is treated as a UUID for the job ensure that this is consistent across reloads of Obsidian to ensure that locks / last run data is usable.

An instance of the Obsidian app is passed to all user function as the first and only paramater.

To clear locks for jobs added via the API you can add a job with the corrosponding name and then pass the name to the `clearJobLock(name: string)` function also in the API.

Example of a user function

```javascript

const cron = app.plugins.plugins.cron.api;

cron.addCronJob('addCronJob', "* * * * 3", {"enableMobile": true}, function(app){console.log('Job has ran!')});

```

## Sync

Obsidian cron has the ability to hook into the native Obsidian Sync plugin. When enabled all locks, cron runs & commands will wait for Obsidian Sync to be fully completed before running any cron jobs.

This is useful if you have multiple instances of Obsidian running and want to ensure that cron jobs only run on one device or once per Obsidian vault.

## Locking

At the start of each cron job a lock is saved into the plugin settings that stops multiple instances of the same jobs running. Sometimes if jobs don't finish cleanly they can be left with locks still in place. They can be unlocked in the settings page of the plugin.

# License
Obsidian Cron is released under the MIT License. See the LICENSE file for more information.

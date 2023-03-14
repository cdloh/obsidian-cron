// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { Command } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class CommandSuggest extends TextInputSuggest<Command> {
    getSuggestions(inputStr: string): Command[] {
        const abstractCommands = app.commands.commands;
        const commands: Command[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

			for (const [, command] of Object.entries(abstractCommands)) {
				if (
					command.name.toLowerCase().contains(lowerCaseInputStr)
				) {
					commands.push(command)
				}
			}

        return commands;
    }

    renderSuggestion(command: Command, el: HTMLElement): void {
        el.setText(command.name);
    }

    selectSuggestion(command: Command): void {
        this.inputEl.value = command.id;
        this.inputEl.trigger("input");
        this.close();
    }
}

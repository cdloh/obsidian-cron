import { AbstractInputSuggest, Command } from "obsidian";
export class CommandSuggest extends AbstractInputSuggest<Command> {
    protected getSuggestions(query: string): Command[] {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.app.commands.commands)
            .filter((command) => command.name.toLowerCase().includes(lowerQuery));
    }
    renderSuggestion(command: Command, el: HTMLElement): void {
        el.setText(command.name);
    }
    selectSuggestion(command: Command, evt: MouseEvent | KeyboardEvent): void {
        this.setValue(command.name);
        super.selectSuggestion(command, evt);
        this.close();
    }
}
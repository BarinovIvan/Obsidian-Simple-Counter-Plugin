import { App, DropdownComponent, MarkdownView, Plugin, PluginSettingTab, Setting, ToggleComponent, getFrontMatterInfo} from 'obsidian';

interface CounterSettings {
	folders: string[];
	autoCreate: boolean;
	allFolders: boolean;
}

const DEFAULT_SETTINGS: CounterSettings = {
	folders: [],
	autoCreate: false,
	allFolders: false
}

export default class ObsidianCounter extends Plugin {
	settings: CounterSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				const view = leaf?.view;
				// if we are on the note tab
				if (view && view instanceof MarkdownView) {
					// @ts-ignore
					const isDirectoryIgnored = !this.settings.folders.includes(view.file.parent.path)
					if (!this.settings.allFolders && isDirectoryIgnored) {
						return
					}
					// get yaml frontmatter
					const file: any = view.file;
					const content = await readFile(file);
					let lines = getYamlFrontMatter(content)
					let visitedProperty;
					if (lines) {
						visitedProperty = getVisitedProperty(lines)
					} 
					// create property if set to autocreate
					if (!visitedProperty && this.settings.autoCreate) {
						if (!lines) {
								lines = []
						}
						visitedProperty = 'visited: 0'
						lines.push(visitedProperty)
					}
					let visitedValue: any = getPropertyValue(visitedProperty)
					const visitedPropertyIndex = lines.indexOf(visitedProperty)
					// update visited property
					visitedValue = Number(visitedValue) + 1
					lines[visitedPropertyIndex] = formProperty('visited', visitedValue)
					const updatedFrontMatter = convertArrayToYamlFrontMatter(lines)
					const newContent = uniteFrontMatterAndContent(updatedFrontMatter, content)
					await this.app.vault.modify(file, newContent)
				}
			})
		);

		this.addSettingTab(new CounterSettingsTab(this.app, this));
		const readFile = async (file: any) => {
			return await this.app.vault.read(file);
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
const getYamlFrontMatter = (content: string) => {
	return getFrontMatterInfo(content).frontmatter.split('\n').filter(Boolean);
}
const getVisitedProperty = (lines: any[]) => {
	const visitedProperty: any = lines.find((property) => property.includes('visited'))
	return visitedProperty ?? null
}
const getPropertyValue = (property: string) => {
	return property?.split(': ')[1]
}
const formProperty = (propertyName: string, value: any) => {
	return `${propertyName}: ${value}`
}
const convertArrayToYamlFrontMatter = (lines: any[]) => {
	return lines.join('\n') + '\n'
}
const uniteFrontMatterAndContent = (frontMatter: string, content: string) => {
	const frontMatterInfo = getFrontMatterInfo(content)
	if (frontMatterInfo.exists) {
		const contentBefore = content.substring(0, frontMatterInfo.from)
		const contentAfter = content.substring(frontMatterInfo.to)
		return String.prototype.concat(contentBefore, frontMatter, contentAfter)
	} else {
		return String.prototype.concat('---\n', frontMatter,'---\n', content)
	}
}

class CounterSettingsTab extends PluginSettingTab {
	plugin: ObsidianCounter;

	constructor(app: App, plugin: ObsidianCounter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private _selectedFolders: string[] = [];
	get selectedFolders(): string[] {
		return this._selectedFolders;
	}
	set selectedFolders(value: string[]) {
		this._selectedFolders = value;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		let buttonContainer = document.createElement('div');

		this.selectedFolders = this.plugin.settings.folders || [];

		const selectedFoldersSetting = new Setting(containerEl)
			.setName('Folders')
			.setDesc('Select folders where the plugin should work')
			.addTextArea(this.createTextArea());

		const updateTextAreaField = this.createUpdateTextAreaHandler(containerEl);
		const clearSelectionHandler = this.createClearSelectionHandler(updateTextAreaField);

		const selectedFoldersButtons = new Setting(buttonContainer)
			.addButton(button => button.setButtonText('Clear Selection').onClick(clearSelectionHandler))
			.addDropdown(dropdown => {
				dropdown.addOption('', 'Select Folders');
				this.getUniqueFolders().forEach(folder => dropdown.addOption(folder, folder));
				dropdown.onChange(this.createDropdownChangeHandler(dropdown, updateTextAreaField));
			});

		containerEl.appendChild(buttonContainer);

		new Setting(containerEl)
			.setName('Use for all notes vault')
			.setDesc('Toggles whether the plugin will be applied throughout every note in your vault')
			.addToggle((toggle: ToggleComponent) => {
				toggle.setValue(this.plugin.settings.allFolders)
				toggle.onChange(async (value) => {
					this.plugin.settings.allFolders = value
					selectedFoldersButtons.setDisabled(value)
					selectedFoldersSetting.setDisabled(value)
					await this.plugin.saveSettings()
				})
			})

		new Setting(containerEl)
			.setName('Auto-create property')
			.setDesc('Toggles whether the visited property is created automatically if not already existing')
			.addToggle((toggle: ToggleComponent) => {
				toggle.setValue(this.plugin.settings.autoCreate)
				toggle.onChange(async (value) => {
					this.plugin.settings.autoCreate = value
					await this.plugin.saveSettings()
					console.log("this", this)
				})
			})
	}
	getUniqueFolders() {
		return [...new Set(this.app.vault.getFiles().map(file => file.parent.path))];
	}
	private createTextArea() {
		return (text: any) => {
			text.inputEl.style.height = '200px';
			text.setValue(this.selectedFolders.join(',\n'));
			text.inputEl.setAttribute('readonly', 'true');
		};
	}
	private createUpdateTextAreaHandler(containerEl: HTMLElement) {
		return () => {
			const textAreaField: HTMLTextAreaElement = containerEl.querySelector('textarea')!;
			textAreaField.value = this.selectedFolders.join(',\n');
		};
	}
	private createClearSelectionHandler(updateTextAreaField: Function) {
		return async () => {
			this.selectedFolders = [];
			updateTextAreaField();
			await this.updatePlugin()
		};
	}
	private createDropdownChangeHandler(dropdown: DropdownComponent, updateTextAreaField: Function) {
		return async (value: string) => {
			if (!this.selectedFolders.includes(value)) {
				this.selectedFolders.push(value);
				this.selectedFolders = this.selectedFolders.filter(folder => folder);
			} else {
				const indexToRemove = this.selectedFolders.indexOf(value);
				if (indexToRemove !== -1)
					this.selectedFolders.splice(indexToRemove, 1);
			}
			dropdown.setValue('')
			updateTextAreaField();
			await this.updatePlugin()
		};
	}
	private async updatePlugin() {
		this.plugin.settings.folders = this.selectedFolders;
		await this.plugin.saveSettings();
	}
}


import settingsPage from "components/settingsPage";
import appSettings from "lib/settings";

export default function aiassistantSettings() {
	const title = "Ai Assistant Settings";
	const values = appSettings.value;
	const items = [
		{
			key: "aiProvider",
			text: "AI Provider",
			value: values.aiProvider,
			valueText(value) {
				const found = this.select.find(([v]) => v === value);
				return found ? found[1] : value;
			},
			select: [
				["openai", "OpenAI/OpenAI-Like"],
				["gemini", "Gemini"],
			],
			info: "Select your AI provider.",
		},
		{
			key: "aiApiKey",
			text: "API Key",
			value: values.aiApiKey,
			prompt: "API Key",
			promptType: "text",
			info: "Enter your API key here.",
		},
		{
			key: "aiBaseUrl",
			text: "API Base URL (OpenAI/OpenAI-Like only)",
			value: values.aiBaseUrl,
			prompt: "API Base URL",
			promptType: "text",
			info: "Enter base URL of your API here. (OpenAI compatible only)",
		},
		{
			key: "aiModel",
			text: "Model",
			value: values.aiModel,
			prompt: "Model",
			promptType: "text",
			info: "Enter your AI model here.",
		},
	];

	return settingsPage(title, items, callback);

	/**
	 * Callback for settings page when an item is clicked
	 * @param {string} key
	 * @param {string} value
	 */
	function callback(key, value) {
		switch (key) {
			default:
				appSettings.update({
					[key]: value,
				});
				break;
		}
	}
}

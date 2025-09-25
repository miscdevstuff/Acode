import settingsPage from "components/settingsPage";
import appSettings from "lib/settings";

export default function aiassistantSettings() {
	const title = "Ai Assistant Settings";
	const values = appSettings.value;
	const items = [
		{
			key: "aiApiKey",
			text: "API Key",
			value: values.aiApiKey,
			prompt: "API Key",
			info: "Enter your API key here.",
		},
		{
			key: "aiModel",
			text: "Model",
			value: values.aiModel,
			prompt: "Model",
			info: "Enter your AI model here.",
		},
		{
			key: "aiBaseUrl",
			text: "API Base URL",
			value: values.aiBaseUrl,
			prompt: "API Base URL",
			info: "Enter base url of your api here.",
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

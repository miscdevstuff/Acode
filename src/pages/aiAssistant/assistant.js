import EditorFile from "lib/editorFile";
import styles from "./assistant.module.scss";

export default function openAIAssistantPage() {
	const aiAssistantContainer = (
		<div className="chat-container">
			{/* Header */}
			<div className="chat-header">
				<div className="header-left">
					<button className="btn btn-sm btn-outline" id="new-chat-btn">
						<i className="icon add"></i>
						<span className="btn-text">New Chat</span>
					</button>
					<div className="separator"></div>
					<button className="btn btn-sm btn-outline" id="toggle-history-btn">
						<i className="icon historyrestore"></i>
						<span className="btn-text">History</span>
					</button>
					<div className="separator"></div>
					<div className="profile-switcher">
						<button className="profile-button" id="profile-btn">
							<i className="icon edit"></i>
							<span>Write</span>
							<i className="icon keyboard_arrow_down"></i>
						</button>
						<div className="profile-dropdown" id="profile-dropdown">
							<div className="profile-option" data-profile="ask">
								<div className="profile-option-header">
									<i className="icon info_outline"></i>
									<span>Ask</span>
								</div>
								<div className="profile-option-description">
									Suggest approaches without writing code
								</div>
							</div>
							<div className="profile-option" data-profile="write">
								<div className="profile-option-header">
									<i className="icon edit"></i>
									<span>Write</span>
								</div>
								<div className="profile-option-description">
									Write and implement code
								</div>
							</div>
							<div className="profile-option" data-profile="custom">
								<div className="profile-option-header">
									<i className="icon settings"></i>
									<span>Custom</span>
								</div>
								<div className="profile-option-description">
									Custom permissions and capabilities
								</div>
								<div className="permission-toggles" id="custom-permissions">
									<div className="permission-toggle">
										<div className="permission-label">
											<i data-feather="globe" className="feather-xs"></i>
											<span>Network Requests</span>
										</div>
										<label className="toggle-switch">
											<input type="checkbox" checked />
											<span className="toggle-slider"></span>
										</label>
									</div>
									<div className="permission-toggle">
										<div className="permission-label">
											<i data-feather="file" className="feather-xs"></i>
											<span>Read Files</span>
										</div>
										<label className="toggle-switch">
											<input type="checkbox" checked />
											<span className="toggle-slider"></span>
										</label>
									</div>
									<div className="permission-toggle">
										<div className="permission-label">
											<i data-feather="edit" className="feather-xs"></i>
											<span>Write Files</span>
										</div>
										<label className="toggle-switch">
											<input type="checkbox" />
											<span className="toggle-slider"></span>
										</label>
									</div>
									<div className="permission-toggle">
										<div className="permission-label">
											<i data-feather="terminal" className="feather-xs"></i>
											<span>Execute Commands</span>
										</div>
										<label className="toggle-switch">
											<input type="checkbox" />
											<span className="toggle-slider"></span>
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="header-right">
					<button className="btn btn-icon btn-outline" id="settings-btn">
						<i className="icon settings"></i>
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className="chat-main">
				{/* Chat history sidebar */}
				<div className="chat-sidebar hidden" id="chat-sidebar">
					<div className="sidebar-header">
						<h3 className="sidebar-title">CHAT HISTORY</h3>
						<button className="btn btn-icon">
							<i className="icon add"></i>
						</button>
					</div>
					<div className="chat-history">
						<div className="history-item active">
							<div className="history-icon">
								<i className="icon chat_bubble"></i>
							</div>
							<div className="history-text">File upload component</div>
						</div>
						<div className="history-item">
							<div className="history-icon">
								<i className="icon chat_bubble"></i>
							</div>
							<div className="history-text">Authentication implementation</div>
						</div>
						<div className="history-item">
							<div className="history-icon">
								<i className="icon chat_bubble"></i>
							</div>
							<div className="history-text">React state management</div>
						</div>
					</div>
				</div>

				{/* Messages area */}
				<div className="messages-wrapper" id="messages-wrapper">
					<div className="messages-container" id="messages-container">
						{/* Messages will be added here dynamically */}
					</div>
				</div>
			</div>

			{/* Input area */}
			<div className="chat-input-container">
				<div className="chat-input-wrapper">
					<textarea
						className="chat-input"
						id="chat-input"
						placeholder="Message..."
					></textarea>
					<div className="chat-input-actions">
						<div className="input-tools">
							<button className="btn btn-icon" title="Attach file">
								<i className="icon attach_file"></i>
							</button>
							{/* <button className="btn btn-icon" title="Code snippet">
								<i data-feather="code" className="feather-sm"></i>
							</button>
							<button className="btn btn-icon" title="Format text">
								<i data-feather="type" className="feather-sm"></i>
							</button> */}
						</div>
						<div className="input-send">
							<button className="btn btn-sm btn-outline" id="clear-btn">
								<i className="icon clearclose"></i>
								<span className="btn-text">Clear</span>
							</button>
							<button className="btn btn-sm btn-primary" id="send-btn" disabled>
								<i className="icon telegram"></i>
								<span className="btn-text">Send</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const uri = "ai://assistant";

	// Check if the tab is already open
	const existingFile = editorManager.getFile(uri, "uri");

	if (existingFile) {
		existingFile.makeActive();
		return;
	}

	// Create a new EditorFile instance for the AI Assistant tab
	new EditorFile("AI Assistant", {
		uri: uri,
		type: "page",
		tabIcon: "file file_type_assistant",
		content: aiAssistantContainer,
		render: true,
		stylesheets: styles,
		hideQuickTools: true,
	});

	console.log("Opened AI Assistant tab.");
}

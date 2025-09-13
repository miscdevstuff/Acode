/**
 * Terminal Manager
 * Handles terminal session creation and management
 */

import EditorFile from "lib/editorFile";
import TerminalComponent from "./terminal";
import "@xterm/xterm/css/xterm.css";
import toast from "components/toast";

class TerminalManager {
	constructor() {
		this.terminals = new Map();
		this.terminalCounter = 0;
	}

	/**
	 * Create a new terminal session
	 * @param {object} options - Terminal options
	 * @returns {Promise<object>} Terminal instance info
	 */
	async createTerminal(options = {}) {
		try {
			const terminalId = `terminal_${++this.terminalCounter}`;
			const terminalName = options.name || `Terminal ${this.terminalCounter}`;

			// Check if terminal is installed before proceeding
			if (options.serverMode !== false) {
				const installationResult = await this.checkAndInstallTerminal();
				if (!installationResult.success) {
					throw new Error(installationResult.error);
				}
			}

			// Create terminal component
			const terminalComponent = new TerminalComponent({
				serverMode: options.serverMode !== false,
				...options,
			});

			// Create container
			const terminalContainer = tag("div", {
				className: "terminal-content",
				id: `terminal-${terminalId}`,
			});

			// Terminal styles (inject once)
			if (!document.getElementById("acode-terminal-styles")) {
				const terminalStyles = this.getTerminalStyles();
				const terminalStyle = tag("style", {
					id: "acode-terminal-styles",
					textContent: terminalStyles,
				});
				document.body.appendChild(terminalStyle);
			}

			// Create EditorFile for terminal
			const terminalFile = new EditorFile(terminalName, {
				type: "terminal",
				content: terminalContainer,
				tabIcon: "licons terminal",
				render: true,
			});

			// Wait for tab creation and setup
			const terminalInstance = await new Promise((resolve, reject) => {
				setTimeout(async () => {
					try {
						// Mount terminal component
						terminalComponent.mount(terminalContainer);

						// Connect to session if in server mode
						if (terminalComponent.serverMode) {
							await terminalComponent.connectToSession();
						} else {
							// For local mode, just write a welcome message
							terminalComponent.write(
								"Local terminal mode - ready for output\r\n",
							);
						}

						// Use PID as unique ID if available, otherwise fall back to terminalId
						const uniqueId = terminalComponent.pid || terminalId;

						// Setup event handlers
						this.setupTerminalHandlers(
							terminalFile,
							terminalComponent,
							uniqueId,
						);

						const instance = {
							id: uniqueId,
							name: terminalName,
							component: terminalComponent,
							file: terminalFile,
							container: terminalContainer,
						};

						this.terminals.set(uniqueId, instance);
						resolve(instance);
					} catch (error) {
						console.error("Failed to initialize terminal:", error);
						reject(error);
					}
				}, 100);
			});

			return terminalInstance;
		} catch (error) {
			console.error("Failed to create terminal:", error);
			throw error;
		}
	}

	/**
	 * Check if terminal is installed and install if needed
	 * @returns {Promise<{success: boolean, error?: string}>}
	 */
	async checkAndInstallTerminal() {
		try {
			// Check if terminal is already installed
			const isInstalled = await Terminal.isInstalled();
			if (isInstalled) {
				return { success: true };
			}

			// Check if terminal is supported on this device
			const isSupported = await Terminal.isSupported();
			if (!isSupported) {
				return {
					success: false,
					error: "Terminal is not supported on this device architecture",
				};
			}

			// Create installation progress terminal
			const installTerminal = await this.createInstallationTerminal();

			// Install terminal with progress logging
			const installResult = await Terminal.install(
				(message) => {
					// Remove stdout/stderr prefix for
					const cleanMessage = message.replace(/^(stdout|stderr)\s+/, "");
					installTerminal.component.write(`${cleanMessage}\r\n`);
				},
				(error) => {
					// Remove stdout/stderr prefix
					const cleanError = error.replace(/^(stdout|stderr)\s+/, "");
					installTerminal.component.write(
						`\x1b[31mError: ${cleanError}\x1b[0m\r\n`,
					);
				},
			);

			// Only return success if Terminal.install() indicates success (exit code 0)
			if (installResult === true) {
				return { success: true };
			} else {
				return {
					success: false,
					error:
						"Terminal installation failed - process did not exit with code 0",
				};
			}
		} catch (error) {
			console.error("Terminal installation failed:", error);
			return {
				success: false,
				error: `Terminal installation failed: ${error.message}`,
			};
		}
	}

	/**
	 * Create a terminal for showing installation progress
	 * @returns {Promise<object>} Installation terminal instance
	 */
	async createInstallationTerminal() {
		const terminalId = `install_terminal_${++this.terminalCounter}`;
		const terminalName = "Terminal Installation";

		// Create terminal component in local mode (no server needed)
		const terminalComponent = new TerminalComponent({
			serverMode: false,
		});

		// Create container
		const terminalContainer = tag("div", {
			className: "terminal-content",
			id: `terminal-${terminalId}`,
		});

		// Terminal styles (inject once)
		if (!document.getElementById("acode-terminal-styles")) {
			const terminalStyles = this.getTerminalStyles();
			const terminalStyle = tag("style", {
				id: "acode-terminal-styles",
				textContent: terminalStyles,
			});
			document.body.appendChild(terminalStyle);
		}

		// Create EditorFile for terminal
		const terminalFile = new EditorFile(terminalName, {
			type: "terminal",
			content: terminalContainer,
			tabIcon: "icon save_alt",
			render: true,
		});

		// Wait for tab creation and setup
		const terminalInstance = await new Promise((resolve, reject) => {
			setTimeout(async () => {
				try {
					// Mount terminal component
					terminalComponent.mount(terminalContainer);

					// Write initial message
					terminalComponent.write("🚀 Installing Terminal Environment...\r\n");
					terminalComponent.write(
						"This may take a few minutes depending on your connection.\r\n\r\n",
					);

					// Setup event handlers
					this.setupTerminalHandlers(
						terminalFile,
						terminalComponent,
						terminalId,
					);

					// Set up custom title for installation terminal
					terminalFile.setCustomTitle(
						() => "Installing Terminal Environment...",
					);

					const instance = {
						id: terminalId,
						name: terminalName,
						component: terminalComponent,
						file: terminalFile,
						container: terminalContainer,
					};

					this.terminals.set(terminalId, instance);
					resolve(instance);
				} catch (error) {
					console.error("Failed to create installation terminal:", error);
					reject(error);
				}
			}, 100);
		});

		return terminalInstance;
	}

	/**
	 * Setup terminal event handlers
	 * @param {EditorFile} terminalFile - Terminal file instance
	 * @param {TerminalComponent} terminalComponent - Terminal component
	 * @param {string} terminalId - Terminal ID
	 */
	setupTerminalHandlers(terminalFile, terminalComponent, terminalId) {
		// Handle tab focus/blur
		terminalFile.onfocus = () => {
			// Guarded fit on focus: only fit if cols/rows would change, then focus
			const run = () => {
				try {
					const pd = terminalComponent.fitAddon?.proposeDimensions?.();
					if (
						pd &&
						(pd.cols !== terminalComponent.terminal.cols ||
							pd.rows !== terminalComponent.terminal.rows)
					) {
						terminalComponent.fitAddon.fit();
					}
				} catch {}
				terminalComponent.focus();
			};
			if (typeof requestAnimationFrame === "function") {
				requestAnimationFrame(run);
			} else {
				setTimeout(run, 0);
			}
		};

		// Handle tab close
		terminalFile.onclose = () => {
			this.closeTerminal(terminalId);
		};

		// Enhanced resize handling with debouncing
		let resizeTimeout = null;
		const RESIZE_DEBOUNCE = 200;
		let lastResizeTime = 0;

		let lastWidth = 0;
		let lastHeight = 0;
		const resizeObserver = new ResizeObserver((entries) => {
			const now = Date.now();
			const entry = entries && entries[0];
			const cr = entry?.contentRect;
			const width = cr?.width ?? terminalFile.content?.clientWidth ?? 0;
			const height = cr?.height ?? terminalFile.content?.clientHeight ?? 0;

			// Clear any pending resize
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}

			// Debounce rapid resize events (common during keyboard open/close)
			resizeTimeout = setTimeout(() => {
				try {
					// Check if terminal is still available and mounted
					if (!terminalComponent.terminal || !terminalComponent.container) {
						return;
					}

					// Only fit if actual size changed to reduce reflows
					if (
						Math.abs(width - lastWidth) > 0.5 ||
						Math.abs(height - lastHeight) > 0.5
					) {
						terminalComponent.fit();
						lastWidth = width;
						lastHeight = height;
					}

					// Update last resize time
					lastResizeTime = now;
				} catch (error) {
					console.error(`Resize error for terminal ${terminalId}:`, error);
				}
			}, RESIZE_DEBOUNCE);
		});

		// Wait for the terminal container to be available, then observe it
		setTimeout(() => {
			const containerElement = terminalFile.content;
			if (containerElement && containerElement instanceof Element) {
				resizeObserver.observe(containerElement);
				// store observer so we can disconnect on close
				terminalFile._resizeObserver = resizeObserver;
			} else {
				console.warn("Terminal container not available for ResizeObserver");
			}
		}, 200);

		// Terminal event handlers
		terminalComponent.onConnect = () => {
			console.log(`Terminal ${terminalId} connected`);
		};

		terminalComponent.onDisconnect = () => {
			console.log(`Terminal ${terminalId} disconnected`);
		};

		terminalComponent.onError = (error) => {
			console.error(`Terminal ${terminalId} error:`, error);
			window.toast?.("Terminal connection error");
			// Close the terminal tab on error
			this.closeTerminal(terminalId);
		};

		terminalComponent.onTitleChange = (title) => {
			if (title) {
				// Format terminal title as "Terminal ! - title"
				const formattedTitle = `Terminal ${this.terminalCounter} - ${title}`;
				terminalFile.filename = formattedTitle;

				// Refresh the header subtitle if this terminal is active
				if (
					editorManager.activeFile &&
					editorManager.activeFile.id === terminalFile.id
				) {
					// Force refresh of the header subtitle
					terminalFile.setCustomTitle(getTerminalTitle);
				}
			}
		};

		terminalComponent.onProcessExit = (exitData) => {
			// Format exit message based on exit code and signal
			let message;
			if (exitData.signal) {
				message = `Process terminated by signal ${exitData.signal}`;
			} else if (exitData.exit_code === 0) {
				message = `Process exited successfully (code ${exitData.exit_code})`;
			} else {
				message = `Process exited with code ${exitData.exit_code}`;
			}

			this.closeTerminal(terminalId);
			terminalFile.remove(true);
			toast(message);
		};

		// Store references for cleanup
		terminalFile._terminalId = terminalId;
		terminalFile.terminalComponent = terminalComponent;
		terminalFile._resizeObserver = resizeObserver;

		// Set up custom title function for terminal
		const getTerminalTitle = () => {
			if (terminalComponent.pid) {
				return `PID: ${terminalComponent.pid}`;
			}
			// fallback to terminal name
			return `${terminalId}`;
		};

		terminalFile.setCustomTitle(getTerminalTitle);
	}

	/**
	 * Close a terminal session
	 * @param {string} terminalId - Terminal ID
	 */
	closeTerminal(terminalId) {
		const terminal = this.terminals.get(terminalId);
		if (!terminal) return;

		try {
			// Cleanup resize observer
			if (terminal.file._resizeObserver) {
				terminal.file._resizeObserver.disconnect();
			}

			// Dispose terminal component
			terminal.component.dispose();

			// Remove from map
			this.terminals.delete(terminalId);

			console.log(`Terminal ${terminalId} closed`);
		} catch (error) {
			console.error(`Error closing terminal ${terminalId}:`, error);
		}
	}

	/**
	 * Get terminal by ID
	 * @param {string} terminalId - Terminal ID
	 * @returns {object|null} Terminal instance
	 */
	getTerminal(terminalId) {
		return this.terminals.get(terminalId) || null;
	}

	/**
	 * Get all active terminals
	 * @returns {Map} All terminals
	 */
	getAllTerminals() {
		return this.terminals;
	}

	/**
	 * Write to a specific terminal
	 * @param {string} terminalId - Terminal ID
	 * @param {string} data - Data to write
	 */
	writeToTerminal(terminalId, data) {
		const terminal = this.getTerminal(terminalId);
		if (terminal) {
			terminal.component.write(data);
		}
	}

	/**
	 * Clear a specific terminal
	 * @param {string} terminalId - Terminal ID
	 */
	clearTerminal(terminalId) {
		const terminal = this.getTerminal(terminalId);
		if (terminal) {
			terminal.component.clear();
		}
	}

	/**
	 * Get terminal styles for shadow DOM
	 * @returns {string} CSS styles
	 */
	getTerminalStyles() {
		return `
			.terminal-content {
				width: 100%;
				height: 100%;
				box-sizing: border-box;
				background: #1e1e1e;
				overflow: hidden;
				position: relative;
			}

			.terminal-content .xterm {
				padding: 0.25rem;
				box-sizing: border-box;
			}
		`;
	}

	/**
	 * Create a local terminal (no server connection)
	 * @param {object} options - Terminal options
	 * @returns {Promise<object>} Terminal instance
	 */
	async createLocalTerminal(options = {}) {
		return this.createTerminal({
			...options,
			serverMode: false,
		});
	}

	/**
	 * Create a server terminal (with backend connection)
	 * @param {object} options - Terminal options
	 * @returns {Promise<object>} Terminal instance
	 */
	async createServerTerminal(options = {}) {
		return this.createTerminal({
			...options,
			serverMode: true,
		});
	}

	/**
	 * Handle keyboard resize events for all terminals
	 * This is called when the virtual keyboard opens/closes on mobile
	 */
	handleKeyboardResize() {
		// Add a small delay to let the UI settle
		setTimeout(() => {
			this.terminals.forEach((terminal) => {
				try {
					if (terminal.component && terminal.component.terminal) {
						// Force a re-fit for all terminals
						terminal.component.fit();

						// If terminal has lots of content, try to preserve scroll position
						const buffer = terminal.component.terminal.buffer?.active;
						if (
							buffer &&
							buffer.length > terminal.component.terminal.rows * 2
						) {
							// For content-heavy terminals, ensure we stay near the bottom if we were there
							const wasNearBottom =
								buffer.viewportY >=
								buffer.length - terminal.component.terminal.rows - 5;
							if (wasNearBottom) {
								// Scroll to bottom after resize
								setTimeout(() => {
									terminal.component.terminal.scrollToBottom();
								}, 100);
							}
						}
					}
				} catch (error) {
					console.error(
						`Error handling keyboard resize for terminal ${terminal.id}:`,
						error,
					);
				}
			});
		}, 150);
	}

	/**
	 * Stabilize terminal viewport after resize operations
	 */
	stabilizeTerminals() {
		this.terminals.forEach((terminal) => {
			try {
				if (terminal.component && terminal.component.terminal) {
					// Clear any touch selections during stabilization
					if (
						terminal.component.touchSelection &&
						terminal.component.touchSelection.isSelecting
					) {
						terminal.component.touchSelection.clearSelection();
					}

					// Re-fit and refresh
					terminal.component.fit();

					// Focus the active terminal to ensure proper state
					if (terminal.file && terminal.file.isOpen) {
						setTimeout(() => {
							terminal.component.focus();
						}, 50);
					}
				}
			} catch (error) {
				console.error(`Error stabilizing terminal ${terminal.id}:`, error);
			}
		});
	}
}

// Create singleton instance
const terminalManager = new TerminalManager();

export default terminalManager;

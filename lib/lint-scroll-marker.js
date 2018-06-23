const { CompositeDisposable } =  require("atom");
require('atom-package-deps').install('lint-scroll-marker');

const LintMessage = require("./LintMessage");

const editors = new Map();

var scrollMarker;
var oldMessages = [];


/**
 * Clears a layer based on a message and keeps track of
 * removed layers into an accumulator
 * @param  {Object} message       A message as received from the linter
 * @param  {Array} cleanedLeyers  An array that keeps already cleared layers
 * @return {undefined}
 */
async function clearLayerForMessage(message, cleanedLeyers) {
	const lintMessage = new LintMessage(message);

	// check if we cleand this layer already
	if (cleanedLeyers.indexOf(lintMessage.location.file) !== -1) {
		return;
	}

	const editor = editors.get(lintMessage.location.file);
	if (!editor) {
		return;
	}

	const errorMarkerLayer = scrollMarker.scrollMarkerViewForEditor(editor).getLayer("lint-error", "#fb392e");

	await errorMarkerLayer.clear();
	cleanedLeyers.push(lintMessage.location.file);
}


/**
 * Adds a marker to the editor for the file mentioned in the message
 * at the line mentioned in the message
 * @param {Object} message A message as received from the linter
 */
function addMarkerForMessage(message) {
	const lintMessage = new LintMessage(message);
	const editor = editors.get(lintMessage.location.file);
	if (!editor) {
		return;
	}

	const errorMarkerLayer = scrollMarker.scrollMarkerViewForEditor(editor).getLayer("lint-error", "#fb392e");

	errorMarkerLayer.addMarker(lintMessage.location.position.start.row);
}

module.exports = {

	subscriptions: null,

	activate() {
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.workspace.observeTextEditors(function(editor) {
			editors.set(editor.getPath(), editor);
		}));
	},

	provideUI() {
		return {
			name: 'Lint Scroll Marker',

			async render({ removed, messages }) {
				if (!scrollMarker) {
					return;
				}

				const cleanedLeyers = [];
				for (const message of removed) {
					clearLayerForMessage(message, cleanedLeyers);
				}

				for (const message of messages) {
					addMarkerForMessage(message);
				}
			},

			didBeginLinting() {},
			didFinishLinting() {},
			dispose() {}
		};
	},

	consumeDiagnosticUpdates(diagnosticUpdater) {
		this.subscriptions.add(diagnosticUpdater.observeMessages(async function(messages) {

			const cleanedLeyers = [];
			for (const oldMessage of oldMessages) {
				if (!messages.includes(oldMessage)) {
					clearLayerForMessage(oldMessage, cleanedLeyers);
				}
			}

			for (const message of messages) {
				addMarkerForMessage(message);
			}

			oldMessages = messages;
		}));
	},

	consumeScrollMarker(scrollMarkerAPI) {
		scrollMarker = scrollMarkerAPI;
	},

	deactivate() {
		this.subscriptions.dispose();
		editors.clear();
	}
};

const { CompositeDisposable } =  require("atom");
var scrollMarker;

const editors = new Map();

require('atom-package-deps').install('find-scroll-marker');

function getMessageInfo(message) {
	var file, line;
	if (message.filePath) {
		file = message.filePath;
		line = message.range.start.row;
	}
	else {
		file = message.location.file;
		line = message.location.position.start.row;
	}

	return {
		file: file,
		line: line
	};
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

			render({ removed, messages }) {
				if (!scrollMarker) {
					return;
				}

				// clear marker layers that had markers removed from them this render
				let cleanedLeyers = [];
				for (const message of removed) {
					const messageInfo = getMessageInfo(message);

					// check if we cleand this layer already
					if (cleanedLeyers.indexOf(messageInfo.file) !== -1) {
						return;
					}

					const editor = editors.get(messageInfo.file);
					if (!editor) {
						return;
					}

					const scrollMarkerView = scrollMarker.scrollMarkerViewForEditor(editor);
					const errorMarkerLayer = scrollMarkerView.getLayer("lint-error", "#fb392e");

					errorMarkerLayer.clear();
					cleanedLeyers.push(messageInfo.file);
				}

				// add all the markers. We're not woried as scroll marker will not add another
				// marker at the same line again
				for (const message of messages) {
					const messageInfo = getMessageInfo(message);
					const editor = editors.get(messageInfo.file);
					if (!editor) {
						return;
					}

					const scrollMarkerView = scrollMarker.scrollMarkerViewForEditor(editor);
					const errorMarkerLayer = scrollMarkerView.getLayer("lint-error", "#fb392e");

					errorMarkerLayer.addMarker(messageInfo.line);
				}
			},

			didBeginLinting() {},
			didFinishLinting() {},
			dispose() {}
		};
	},

	consumeScrollMarker(scrollMarkerAPI) {
		scrollMarker = scrollMarkerAPI;
	},

	deactivate() {
		this.subscriptions.dispose();
		editors.clear();
	}
};

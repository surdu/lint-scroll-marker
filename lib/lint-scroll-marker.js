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

			didBeginLinting() {},
			didFinishLinting() {},

			render({ messages }) {
				if (!scrollMarker) {
					return;
				}

				for (const message of messages) {
					const messageInfo = getMessageInfo(message);
					const editor = editors.get(messageInfo.file);
					if (!editor) {
						return;
					}

					const scrollMarkerView = scrollMarker.scrollMarkerViewForEditor(editor);
					const errorMarkerLayer = scrollMarkerView.getLayer("lint-error-marker-layer", "#fb392e");

					errorMarkerLayer.addMarker(messageInfo.line);
				}
			},

			dispose() {

			}
		};
	},

	consumeScrollMarker(scrollMarkerAPI) {
		scrollMarker = scrollMarkerAPI;
	},

	deactivate() {
		this.subscriptions.dispose();
	}
};

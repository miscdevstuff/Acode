import run from './run';
import settingsMain from '../settings/mainSettings';
import dialogs from '../components/dialogs';
import openFile from './openFile';
import openFolder from './openFolder';
import helpers from '../utils/helpers';
import constants from './constants';
import help from '../settings/help';
import recents from '../lib/recents';
import fsOperation from '../fileSystem';
import Modes from '../pages/modes/modes';
import actions from '../handlers/quickTools';
import FileBrowser from '../pages/fileBrowser';
import path from '../utils/Path';
import showFileInfo from './showFileInfo';
import checkFiles from './checkFiles';
import saveState from './saveState';
import commandPalette from '../components/commandPalette';
import TextEncodings from '../pages/textEncodings';
import EditorFile from './editorFile';
import findFile from '../components/findFile';
import appSettings from './settings';
import Sidebar from '../components/sidebar';

export default {
  async 'close-all-tabs'() {
    let save = false;
    const unsavedFiles = editorManager.files.filter((file) => file.isUnsaved).length;
    if (unsavedFiles) {
      const confirmation = await dialogs.confirm(strings['warning'], strings['unsaved files warning']);
      if (!confirmation) return;
      const option = await dialogs.select(strings['select'], [
        ['save', strings['save all']],
        ['close', strings['close all']],
        ['cancel', strings['cancel']],
      ]);
      if (option === 'cancel') return;

      if (option === 'save') {
        const doSave = await dialogs.confirm(strings['warning'], strings['save all warning']);
        if (!doSave) return;
        save = true;
      } else {
        const doClose = await dialogs.confirm(strings['warning'], strings['close all warning']);
        if (!doClose) return;
      }
    }

    editorManager.files.forEach(async (file) => {
      if (save) {
        await file.save();
        file.remove();
        return;
      }

      file.remove(true);
    });
  },
  'close-current-tab'() {
    editorManager.activeFile.remove();
  },
  'console'() {
    run(true, 'in app');
  },
  'check-files'() {
    if (!appSettings.value.checkFiles) return;
    checkFiles();
  },
  'command-palette'() {
    commandPalette();
  },
  'disable-fullscreen'() {
    app.classList.remove('fullscreen-mode');
    this['resize-editor']();
  },
  'enable-fullscreen'() {
    app.classList.add('fullscreen-mode');
    this['resize-editor']();
  },
  async 'encoding'() {
    const encoding = await TextEncodings();
    const file = editorManager.activeFile;
    file.encoding = encoding;
    const text = file.session.getValue();
    const decodedText = new TextEncoder().encode(text);
    const newText = new TextDecoder(encoding).decode(decodedText);
    file.session.setValue(newText);
    file.isUnsaved = false;
    editorManager.onupdate('encoding');
    editorManager.emit('update', 'encoding');
  },
  'exit'() {
    navigator.app.exitApp();
  },
  'edit-with'() {
    editorManager.activeFile.editWith();
  },
  'find-file'() {
    findFile();
  },
  'files'() {
    FileBrowser('both', strings['file browser'])
      .then(FileBrowser.open)
      .catch(FileBrowser.openError);
  },
  'find'() {
    actions('search');
  },
  'file-info'(url) {
    showFileInfo(url);
  },
  async 'goto'() {
    const res = await dialogs.prompt(strings['enter line number'], '', 'number', {
      placeholder: 'line.column',
    });

    if (!res) return;

    const [line, col] = `${res}`.split('.');
    const editor = editorManager.editor;

    editor.focus();
    editor.gotoLine(line, col, true);
  },
  async 'new-file'() {
    let filename = await dialogs.prompt(
      strings['enter file name'],
      constants.DEFAULT_FILE_NAME,
      'filename',
      {
        match: constants.FILE_NAME_REGEX,
        required: true,
      },
    );

    filename = helpers.fixFilename(filename);
    if (!filename) return;

    new EditorFile(filename, {
      isUnsaved: false,
    });
  },
  'next-file'() {
    const len = editorManager.files.length;
    let fileIndex = editorManager.files.indexOf(editorManager.activeFile);

    if (fileIndex === len - 1) fileIndex = 0;
    else ++fileIndex;

    editorManager.files[fileIndex].makeActive();
  },
  'open'(page) {
    if (page === 'settings') settingsMain();
    if (page === 'help') help();
    editorManager.editor.blur();
  },
  'open-with'() {
    editorManager.activeFile.openWith();
  },
  'open-file'() {
    editorManager.editor.blur();
    FileBrowser('file')
      .then(FileBrowser.openFile)
      .catch(FileBrowser.openFileError);
  },
  'open-folder'() {
    editorManager.editor.blur();
    FileBrowser('folder')
      .then(FileBrowser.openFolder)
      .catch(FileBrowser.openFolderError);
  },
  'prev-file'() {
    const len = editorManager.files.length;
    let fileIndex = editorManager.files.indexOf(editorManager.activeFile);

    if (fileIndex === 0) fileIndex = len - 1;
    else --fileIndex;

    editorManager.files[fileIndex].makeActive();
  },
  'read-only'() {
    const file = editorManager.activeFile;
    file.editable = !file.editable;
  },
  'recent'() {
    recents.select().then((res) => {
      const { type } = res;
      if (helpers.isFile(type)) {
        openFile(res.val, {
          render: true,
        }).catch((err) => {
          helpers.error(err);
        });
      } else if (helpers.isDir(type)) {
        openFolder(res.val.url, res.val.opts);
      } else if (res === 'clear') {
        recents.clear();
      }
    });
  },
  'replace'() {
    this.find();
  },
  'resize-editor'() {
    editorManager.editor.resize(true);
  },
  'run'() {
    editorManager.activeFile.run();
  },
  'run-file'() {
    editorManager.activeFile.runFile?.();
  },
  async 'save'(showToast) {
    try {
      await editorManager.activeFile.save();
      if (showToast) {
        toast(strings['file saved']);
      }
    } catch (error) {
      helpers.error(error);
    }
  },
  async 'save-as'(showToast) {
    try {
      await editorManager.activeFile.saveAs();
      if (showToast) {
        toast(strings['file saved']);
      }
    } catch (error) {
      helpers.error(error);
    }
  },
  'save-state'() {
    saveState();
  },
  'share'() {
    editorManager.activeFile.share();
  },
  async 'syntax'() {
    editorManager.editor.blur();
    const mode = await Modes();
    const activefile = editorManager.activeFile;

    let modeAssociated;
    try {
      modeAssociated = JSON.parse(localStorage.modeassoc || '{}');
    } catch (error) {
      modeAssociated = {};
    }

    modeAssociated[path.extname(activefile.filename)] = mode;
    localStorage.modeassoc = JSON.stringify(modeAssociated);

    activefile.setMode(mode);
  },
  'toggle-fullscreen'() {
    app.classList.toggle('fullscreen-mode');
    this['resize-editor']();
  },
  'toggle-sidebar'() {
    Sidebar.toggle();
  },
  'toggle-menu'() {
    tag.get('[action=toggle-menu]')?.click();
  },
  'toggle-editmenu'() {
    tag.get('[action=toggle-edit-menu')?.click();
  },
  'insert-color'() {
    const { editor } = editorManager;
    let color = editor.session.getTextRange(editor.getSelectionRange());

    if (!helpers.isValidColor(color)) {
      color = undefined;
    }

    editor.blur();
    (async () => {
      const wasFocused = editorManager.activeFile.focused;
      const res = await dialogs.color(color, () => {
        if (wasFocused) {
          editor.focus();
        }
      });
      editor.insert(res);
    })();
  },
  'copy'() {
    editorManager.editor.execCommand('copy');
  },
  'cut'() {
    editorManager.editor.execCommand('cut');
  },
  'paste'() {
    editorManager.editor.execCommand('paste');
  },
  'select-all'() {
    const { editor } = editorManager;
    editor.execCommand('selectall');
    editor.scrollToRow(Infinity);
  },
  async 'rename'(file) {
    file = file || editorManager.activeFile;

    if (file.mode === 'single') {
      dialogs.alert(strings.info.toUpperCase(), strings['unable to rename']);
      return;
    }

    let newname = await dialogs.prompt(
      strings.rename,
      file.filename,
      'filename',
      {
        match: constants.FILE_NAME_REGEX,
      },
    );

    newname = helpers.fixFilename(newname);
    if (!newname || newname === file.filename) return;

    const { uri } = file;
    if (uri) {
      const fs = fsOperation(uri);
      try {
        const newUri = await fs.renameTo(newname);
        const stat = await fsOperation(newUri).stat();

        newname = stat.name;
        file.uri = newUri;
        file.filename = newname;

        openFolder.renameItem(uri, newUri, newname);
        toast(strings['file renamed']);
      } catch (err) {
        helpers.error(err);
      }
    } else {
      file.filename = newname;
    }
  },
  async 'format'(selectIfNull) {
    const { editor } = editorManager;
    const pos = editor.getCursorPosition();

    await acode.format(selectIfNull);
    editor.selection.moveCursorToPosition(pos);
  },
  async 'eol'() {
    const eol = await dialogs.select(
      strings['new line mode'],
      ['unix', 'windows'],
      {
        default: editorManager.activeFile.eol,
      },
    );
    editorManager.activeFile.eol = eol;
  },
};

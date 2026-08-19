import * as vscode from 'vscode';
import { cleanAiText } from './textCleaning';

export interface CleanCommandResult {
  readonly changed: boolean;
  readonly removedLineCount: number;
  readonly scope: 'selection' | 'document' | 'none';
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
  const lastLine = document.lineAt(document.lineCount - 1);
  return new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
}

export async function cleanActiveEditor(
  editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
): Promise<CleanCommandResult> {
  if (!editor) {
    void vscode.window.showInformationMessage('البطة مش لاقية ملف تنظّفه. افتح ملف الأول يا هندسة.');
    return { changed: false, removedLineCount: 0, scope: 'none' };
  }

  const hasSelection = !editor.selection.isEmpty;
  const range = hasSelection ? editor.selection : fullDocumentRange(editor.document);
  const original = editor.document.getText(range);
  const result = cleanAiText(original);
  const scope = hasSelection ? 'selection' : 'document';

  if (!result.changed) {
    void vscode.window.showInformationMessage('الكود نضيف… البطة ملقتش حاجة تمسحها. عاش.');
    return { changed: false, removedLineCount: 0, scope };
  }

  const applied = await editor.edit(
    (editBuilder) => {
      editBuilder.replace(range, result.text);
    },
    { undoStopBefore: true, undoStopAfter: true }
  );

  if (!applied) {
    void vscode.window.showWarningMessage('البطة حاولت تنظّف، بس الـ Editor قال لأ. جرّب تاني.');
    return { changed: false, removedLineCount: 0, scope };
  }

  const removed = result.removedLineCount;
  const detail = removed > 0 ? ` وشالت ${removed} سطر هبد.` : '.';
  void vscode.window.showInformationMessage(`نضّفتها يا فنان${detail}`);

  return { changed: true, removedLineCount: removed, scope };
}

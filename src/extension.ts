import * as vscode from 'vscode';
import { cleanActiveEditor } from './cleaner';
import { analyzeInsertion, type DetectionResult } from './detector';
import { getRandomRoast, type Roast, type TriggerReason } from './roasts';
import { DuckSidebarProvider, type DuckStatsSnapshot } from './sidebar';

const STATS_KEY = 'batta.stats';
const SHARE_ACTION = 'شارك القفشة';
const CLEAN_ACTION = 'نضّف الكود';
const NOTIFICATION_COOLDOWN_MS = 1_500;
const LTR_ISOLATE = '\u2066';
const POP_DIRECTIONAL_ISOLATE = '\u2069';

interface DuckStats extends DuckStatsSnapshot {}

interface TriggeredChange {
  readonly range: vscode.Range;
  readonly detection: DetectionResult;
}

const DEFAULT_STATS: DuckStats = {
  roastCount: 0,
  interceptedLines: 0,
  cleanedRuns: 0
};

let punishmentController: PunishmentController | undefined;
let sidebarProvider: DuckSidebarProvider | undefined;
let lastNotificationAt = 0;

function ltr(value: string): string {
  return `${LTR_ISOLATE}${value}${POP_DIRECTIONAL_ISOLATE}`;
}

class PunishmentController implements vscode.Disposable {
  private readonly decoration: vscode.TextEditorDecorationType;
  private readonly statusItem: vscode.StatusBarItem;
  private activeEditor: vscode.TextEditor | undefined;
  private activeRanges: vscode.Range[] = [];
  private ticker: NodeJS.Timeout | undefined;
  private deadline = 0;

  public constructor() {
    this.decoration = vscode.window.createTextEditorDecorationType({
      opacity: '0.22',
      backgroundColor: new vscode.ThemeColor('editorWarning.background'),
      overviewRulerColor: new vscode.ThemeColor('editorWarning.foreground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      textDecoration: 'none; filter: blur(5px); transition: filter 0.3s ease'
    });

    this.statusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      10_000
    );
    this.statusItem.name = 'El-Batta Paste Guard';
    this.statusItem.command = 'batta.openDuck';
    this.statusItem.tooltip = 'افتح البطة وشوف القفشة';
  }

  public punish(
    editor: vscode.TextEditor,
    ranges: readonly vscode.Range[],
    durationSeconds: number
  ): void {
    if (
      this.activeEditor &&
      this.activeEditor.document.uri.toString() !== editor.document.uri.toString()
    ) {
      this.activeEditor.setDecorations(this.decoration, []);
      this.activeRanges = [];
    }

    this.activeEditor = editor;
    this.activeRanges.push(...ranges);
    editor.setDecorations(this.decoration, this.activeRanges);

    this.deadline = Date.now() + Math.max(1, durationSeconds) * 1_000;
    this.stopTicker();
    this.renderCountdown();
    this.ticker = setInterval(() => this.renderCountdown(), 250);
  }

  public clearForDocument(document: vscode.TextDocument): void {
    if (this.activeEditor?.document.uri.toString() === document.uri.toString()) {
      this.clear();
    }
  }

  public clear(): void {
    this.stopTicker();
    this.activeEditor?.setDecorations(this.decoration, []);
    this.activeEditor = undefined;
    this.activeRanges = [];
    this.statusItem.hide();
  }

  public dispose(): void {
    this.clear();
    this.decoration.dispose();
    this.statusItem.dispose();
  }

  private renderCountdown(): void {
    const remaining = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1_000));

    if (remaining === 0) {
      this.clear();
      return;
    }

    this.statusItem.text = `$(warning) البطة: اقرا الكود قبل البرودكشن ما يولع (${ltr(`${remaining}s`)})`;
    this.statusItem.show();
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }
}

function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('batta');
}

function isEnabled(): boolean {
  return getConfiguration().get<boolean>('enabled', true);
}

function getStats(context: vscode.ExtensionContext): DuckStats {
  const stored = context.globalState.get<Partial<DuckStats>>(STATS_KEY, DEFAULT_STATS);
  return {
    roastCount: Math.max(0, stored.roastCount ?? 0),
    interceptedLines: Math.max(0, stored.interceptedLines ?? 0),
    cleanedRuns: Math.max(0, stored.cleanedRuns ?? 0)
  };
}

async function saveStats(
  context: vscode.ExtensionContext,
  stats: DuckStats
): Promise<void> {
  await context.globalState.update(STATS_KEY, stats);
  sidebarProvider?.updateStats(stats, isEnabled());
}

function insertedRange(start: vscode.Position, insertedText: string): vscode.Range {
  const newlineMatches = insertedText.match(/\n/g);
  const newLines = newlineMatches?.length ?? 0;

  if (newLines === 0) {
    return new vscode.Range(start, start.translate(0, insertedText.length));
  }

  const lastNewline = insertedText.lastIndexOf('\n');
  const trailingCharacters = insertedText.length - lastNewline - 1;
  return new vscode.Range(
    start,
    new vscode.Position(start.line + newLines, trailingCharacters)
  );
}

function severity(reason: TriggerReason): number {
  switch (reason) {
    case 'ai_junk_found':
      return 3;
    case 'huge_paste':
      return 2;
    case 'medium_paste':
      return 1;
  }
}

function findVisibleEditor(document: vscode.TextDocument): vscode.TextEditor | undefined {
  const uri = document.uri.toString();
  return vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() === uri
  );
}

async function shareRoast(shareText: string): Promise<void> {
  const text = `${shareText}\n\n#ElBattaElMeshmeshia #CodeReview`;
  const url = vscode.Uri.parse(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  );
  await vscode.env.openExternal(url);
}

async function showOptionalNativeRoast(roast: Roast): Promise<void> {
  if (!getConfiguration().get<boolean>('showRoastNotifications', false)) {
    return;
  }

  const now = Date.now();
  if (now - lastNotificationAt < NOTIFICATION_COOLDOWN_MS) {
    return;
  }
  lastNotificationAt = now;

  const chosen = await vscode.window.showWarningMessage(
    `البطة: ${roast.message}`,
    SHARE_ACTION,
    CLEAN_ACTION
  );

  if (chosen === CLEAN_ACTION) {
    await vscode.commands.executeCommand('batta.cleanAiJunk');
  } else if (chosen === SHARE_ACTION) {
    await shareRoast(roast.shareText);
  }
}

async function handleDocumentChange(
  event: vscode.TextDocumentChangeEvent,
  context: vscode.ExtensionContext
): Promise<void> {
  if (!isEnabled() || event.document.isClosed || event.contentChanges.length === 0) {
    return;
  }

  const editor = findVisibleEditor(event.document);
  if (!editor) {
    return;
  }

  const threshold = getConfiguration().get<number>('lineThreshold', 35);
  const triggered: TriggeredChange[] = [];

  for (const change of event.contentChanges) {
    const detection = analyzeInsertion(change.text, threshold);
    if (!detection) {
      continue;
    }

    triggered.push({
      range: insertedRange(change.range.start, change.text),
      detection
    });
  }

  if (triggered.length === 0) {
    return;
  }

  const strongest = triggered.reduce((current, candidate) =>
    severity(candidate.detection.reason) > severity(current.detection.reason)
      ? candidate
      : current
  );
  const totalLines = triggered.reduce(
    (sum, item) => sum + item.detection.lineCount,
    0
  );
  const duration = getConfiguration().get<number>('blurDurationSeconds', 5);
  const roast = getRandomRoast(strongest.detection.reason);

  punishmentController?.punish(
    editor,
    triggered.map((item) => item.range),
    duration
  );

  const previousStats = getStats(context);
  const nextStats: DuckStats = {
    ...previousStats,
    roastCount: previousStats.roastCount + 1,
    interceptedLines: previousStats.interceptedLines + totalLines
  };
  await saveStats(context, nextStats);
  await sidebarProvider?.react(
    roast.message,
    strongest.detection.reason,
    totalLines,
    nextStats,
    roast.shareText
  );
  await showOptionalNativeRoast(roast);
}

async function showStats(context: vscode.ExtensionContext): Promise<void> {
  const stats = getStats(context);
  sidebarProvider?.updateStats(stats, isEnabled());
  await sidebarProvider?.reveal(false);
  const enabledText = isEnabled() ? 'صاحية وبتراقب' : 'نايمة ومقفولة';
  await vscode.window.showInformationMessage(
    `البطة ${enabledText} — قفشت ${stats.roastCount} ${ltr('Paste')}، راجعت ${stats.interceptedLines} سطر، ونضّفت ${stats.cleanedRuns} مرة.`
  );
}

async function toggleGuard(context: vscode.ExtensionContext): Promise<void> {
  const next = !isEnabled();
  await getConfiguration().update('enabled', next, vscode.ConfigurationTarget.Global);

  if (!next) {
    punishmentController?.clear();
  }

  sidebarProvider?.updateStats(getStats(context), next);
  await sidebarProvider?.reveal(true);
}

async function resetStats(context: vscode.ExtensionContext): Promise<void> {
  const confirmation = await vscode.window.showWarningMessage(
    'نصفّر عدّاد قفشات البطة؟ التاريخ هيقول إنك بريء.',
    { modal: true },
    'صفّر العداد'
  );

  if (confirmation === 'صفّر العداد') {
    await saveStats(context, DEFAULT_STATS);
    await sidebarProvider?.reveal(true);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  punishmentController = new PunishmentController();
  sidebarProvider = new DuckSidebarProvider(context.extensionUri);

  context.subscriptions.push(
    punishmentController,
    vscode.window.registerWebviewViewProvider(
      DuckSidebarProvider.viewType,
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.workspace.onDidChangeTextDocument((event) => {
      void handleDocumentChange(event, context);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      punishmentController?.clearForDocument(document);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('batta.enabled')) {
        if (!isEnabled()) {
          punishmentController?.clear();
        }
        sidebarProvider?.updateStats(getStats(context), isEnabled());
      }
    }),
    vscode.commands.registerCommand('batta.openDuck', () =>
      sidebarProvider?.reveal(false)
    ),
    vscode.commands.registerCommand('batta.cleanAiJunk', async () => {
      const result = await cleanActiveEditor();
      if (result.changed) {
        const previousStats = getStats(context);
        const nextStats: DuckStats = {
          ...previousStats,
          cleanedRuns: previousStats.cleanedRuns + 1
        };
        await saveStats(context, nextStats);
        sidebarProvider?.showCleanResult(result.removedLineCount, nextStats);
        await sidebarProvider?.reveal(true);
      }
    }),
    vscode.commands.registerCommand('batta.showStats', () => showStats(context)),
    vscode.commands.registerCommand('batta.toggle', () => toggleGuard(context)),
    vscode.commands.registerCommand('batta.resetStats', () => resetStats(context))
  );

  sidebarProvider.updateStats(getStats(context), isEnabled());
  if (getConfiguration().get<boolean>('openSidebarOnStartup', true)) {
    setTimeout(() => {
      void sidebarProvider?.reveal(true);
    }, 350);
  }
}

export function deactivate(): void {
  punishmentController?.dispose();
  punishmentController = undefined;
  sidebarProvider = undefined;
}

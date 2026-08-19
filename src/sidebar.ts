import * as vscode from 'vscode';
import type { TriggerReason } from './roasts';

export interface DuckStatsSnapshot {
  readonly roastCount: number;
  readonly interceptedLines: number;
  readonly cleanedRuns: number;
}

interface SidebarState {
  readonly message: string;
  readonly reason: TriggerReason | 'idle' | 'sleeping';
  readonly lineCount: number;
  readonly stats: DuckStatsSnapshot;
  readonly enabled: boolean;
  readonly shareText: string;
}

type SidebarCommand = 'clean' | 'toggle' | 'stats' | 'share';

const EMPTY_STATS: DuckStatsSnapshot = {
  roastCount: 0,
  interceptedLines: 0,
  cleanedRuns: 0
};

function nonce(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  ).join('');
}

export class DuckSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'batta.duckView';

  private view: vscode.WebviewView | undefined;
  private state: SidebarState = {
    message: 'أنا صاحي وبراقب زرار Ctrl+V. ورّيني شغلك يا هندسة.',
    reason: 'idle',
    lineCount: 0,
    stats: EMPTY_STATS,
    enabled: true,
    shareText: 'البطة المشمشية بتراجع الكود قبل البرودكشن.'
  };

  public constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'images')]
    };
    webviewView.webview.html = this.renderHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: { command?: SidebarCommand }) => {
      switch (message.command) {
        case 'clean':
          void vscode.commands.executeCommand('batta.cleanAiJunk');
          break;
        case 'toggle':
          void vscode.commands.executeCommand('batta.toggle');
          break;
        case 'stats':
          void vscode.commands.executeCommand('batta.showStats');
          break;
        case 'share': {
          const text = `${this.state.shareText}\n\n#ElBattaElMeshmeshia #CodeReview`;
          const url = vscode.Uri.parse(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
          );
          void vscode.env.openExternal(url);
          break;
        }
        default:
          break;
      }
    });

    void this.publishState();
  }

  public async reveal(preserveFocus = true): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.batta-sidebar');
    this.view?.show(preserveFocus);
  }

  public async react(
    message: string,
    reason: TriggerReason,
    lineCount: number,
    stats: DuckStatsSnapshot,
    shareText: string
  ): Promise<void> {
    this.state = {
      message,
      reason,
      lineCount,
      stats,
      enabled: true,
      shareText
    };
    await this.reveal(true);
    await this.publishState();
  }

  public updateStats(stats: DuckStatsSnapshot, enabled: boolean): void {
    this.state = {
      ...this.state,
      stats,
      enabled,
      reason: enabled ? this.state.reason : 'sleeping',
      message: enabled
        ? this.state.message
        : 'أنا نايم دلوقتي. إلزق براحتك… بس البرودكشن ذنبك.'
    };
    void this.publishState();
  }

  public showCleanResult(removedLineCount: number, stats: DuckStatsSnapshot): void {
    const removal = removedLineCount > 0 ? ` وشلت ${removedLineCount} سطر هبد.` : '.';
    this.state = {
      message: `نضّفت الكود يا فنان${removal}`,
      reason: 'idle',
      lineCount: 0,
      stats,
      enabled: true,
      shareText: this.state.shareText
    };
    void this.publishState();
  }

  private async publishState(): Promise<void> {
    await this.view?.webview.postMessage({
      type: 'state',
      value: this.state
    });
  }

  private renderHtml(webview: vscode.Webview): string {
    const avatarUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'images', 'duck-avatar.png')
    );
    const token = nonce();
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data:`,
      `style-src 'nonce-${token}'`,
      `script-src 'nonce-${token}'`
    ].join('; ');

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <style nonce="${token}">
    :root {
      color-scheme: light dark;
      --duck-yellow: #ffd400;
      --duck-orange: #ff7a00;
      --duck-cyan: #22d3ee;
      --duck-red: #ff3b4f;
      --duck-navy: #020618;
      --panel: color-mix(in srgb, var(--vscode-sideBar-background) 88%, #07152f 12%);
      --border: color-mix(in srgb, var(--vscode-sideBar-foreground) 22%, transparent);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 14px 12px 20px;
      background: var(--panel);
      color: var(--vscode-sideBar-foreground);
      font-family: var(--vscode-font-family);
      overflow-x: hidden;
    }

    .stage {
      min-height: calc(100vh - 34px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .brand {
      direction: ltr;
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .12em;
      color: var(--duck-cyan);
      text-transform: uppercase;
    }

    .bubble {
      position: relative;
      width: 100%;
      min-height: 92px;
      padding: 15px 16px;
      border: 2px solid var(--duck-cyan);
      border-radius: 14px;
      background: color-mix(in srgb, var(--vscode-editor-background) 94%, #07152f 6%);
      box-shadow: 4px 4px 0 color-mix(in srgb, var(--duck-cyan) 30%, transparent);
      direction: rtl;
      text-align: right;
      unicode-bidi: plaintext;
      font-size: 14px;
      font-weight: 650;
      line-height: 1.75;
      transition: border-color .18s ease, transform .18s ease;
    }

    .bubble::after {
      content: '';
      position: absolute;
      bottom: -13px;
      right: 44px;
      width: 20px;
      height: 20px;
      background: inherit;
      border-right: 2px solid var(--duck-cyan);
      border-bottom: 2px solid var(--duck-cyan);
      transform: rotate(45deg);
    }

    .bubble[data-reason='huge_paste'],
    .bubble[data-reason='ai_junk_found'] {
      border-color: var(--duck-red);
      box-shadow: 4px 4px 0 color-mix(in srgb, var(--duck-red) 35%, transparent);
      transform: translateY(-2px);
    }

    .bubble[data-reason='huge_paste']::after,
    .bubble[data-reason='ai_junk_found']::after { border-color: var(--duck-red); }

    .meta {
      display: block;
      margin-top: 7px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 500;
    }

    .duck-wrap {
      width: min(100%, 310px);
      margin-top: 3px;
      padding: 4px;
      border-radius: 18px;
      background: radial-gradient(circle at 50% 44%, rgba(34, 211, 238, .18), transparent 65%);
    }

    .duck {
      display: block;
      width: 100%;
      height: auto;
      image-rendering: pixelated;
      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, .42));
      user-select: none;
    }

    .stats {
      direction: ltr;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
    }

    .stat {
      padding: 9px 4px;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: color-mix(in srgb, var(--vscode-editor-background) 90%, transparent);
      text-align: center;
    }

    .stat strong {
      display: block;
      color: var(--duck-yellow);
      font-size: 16px;
      font-variant-numeric: tabular-nums;
    }

    .stat span {
      color: var(--vscode-descriptionForeground);
      font-size: 9px;
      letter-spacing: .05em;
      text-transform: uppercase;
    }

    .actions {
      direction: rtl;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    button {
      min-height: 34px;
      padding: 7px 10px;
      border: 1px solid transparent;
      border-radius: 7px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover { background: var(--vscode-button-hoverBackground); }

    button.secondary {
      border-color: var(--border);
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .status {
      width: 100%;
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
    }

    .status b { color: var(--duck-cyan); }
  </style>
</head>
<body>
  <main class="stage">
    <div class="brand">Fake Senior Duck</div>
    <section id="bubble" class="bubble" data-reason="idle" aria-live="assertive">
      <span id="message">أنا صاحي وبراقب زرار Ctrl+V. ورّيني شغلك يا هندسة.</span>
      <small id="meta" class="meta"></small>
    </section>

    <div class="duck-wrap">
      <img class="duck" src="${avatarUri}" alt="البطة المشمشية، مهندس سينيور مزيف" />
    </div>

    <section class="stats" aria-label="Duck statistics">
      <div class="stat"><strong id="roasts">0</strong><span>Roasts</span></div>
      <div class="stat"><strong id="lines">0</strong><span>Lines</span></div>
      <div class="stat"><strong id="cleans">0</strong><span>Cleans</span></div>
    </section>

    <section class="actions">
      <button id="clean">نضّف الكود</button>
      <button id="toggle" class="secondary">نوّم البطة</button>
      <button id="stats" class="secondary">الإحصائيات</button>
      <button id="share" class="secondary">شارك القفشة</button>
    </section>

    <div class="status">الحراسة: <b id="guard">شغّالة</b> — كل حاجة محلية</div>
  </main>

  <script nonce="${token}">
    const vscode = acquireVsCodeApi();
    const byId = (id) => document.getElementById(id);

    byId('clean').addEventListener('click', () => vscode.postMessage({ command: 'clean' }));
    byId('toggle').addEventListener('click', () => vscode.postMessage({ command: 'toggle' }));
    byId('stats').addEventListener('click', () => vscode.postMessage({ command: 'stats' }));
    byId('share').addEventListener('click', () => vscode.postMessage({ command: 'share' }));

    window.addEventListener('message', (event) => {
      const payload = event.data;
      if (payload?.type !== 'state') return;

      const state = payload.value;
      const bubble = byId('bubble');
      bubble.dataset.reason = state.reason;
      byId('message').textContent = state.message;
      byId('meta').textContent = state.lineCount > 0
        ? 'قفشت ' + state.lineCount.toLocaleString('ar-EG') + ' سطر في آخر لصقة.'
        : '';
      byId('roasts').textContent = state.stats.roastCount.toLocaleString('en-US');
      byId('lines').textContent = state.stats.interceptedLines.toLocaleString('en-US');
      byId('cleans').textContent = state.stats.cleanedRuns.toLocaleString('en-US');
      byId('guard').textContent = state.enabled ? 'شغّالة' : 'نايمة';
      byId('toggle').textContent = state.enabled ? 'نوّم البطة' : 'صحّي البطة';
    });
  </script>
</body>
</html>`;
  }
}

<p align="center">
  <img src="images/hero.png" alt="El-Batta El-Meshmeshia catches a suspicious pasted code block" width="100%" />
</p>

<h1 align="center">El-Batta El-Meshmeshia</h1>
<p align="center"><strong>Fake Senior Duck — البطة اللي بتقفشك قبل ما البرودكشن يقفشك</strong></p>

**El-Batta** is a tiny, entirely local VS Code extension with a permanent pixel-duck sidebar. It notices suspicious AI-flavored pastes, blurs the pasted block for a few seconds, and delivers the roast in an RTL-safe speech bubble while you actually read what you copied.

> مش ضد الـ AI. ضد إنك تعمل `Ctrl+V` للكود وتعمل نفسك Senior.

## بالعربي

لزقت بلوك كود كبير؟ سايب `Here is the complete code` أو Markdown fences جوه الملف؟ حاطط `your_api_key_here` وداخل تعمل Run؟ **البطة هتقفشك.** الكود المشبوه بيتغبّش مؤقتًا، عدّاد خمس ثواني بيظهر في الـ Status Bar، والـ sidebar الخاص بالبطة بيتفتح ويعرض القفشة داخل speech bubble واضحة. النص العربي مضبوط RTL، والمصطلحات الإنجليزية معزولة اتجاهيًا عشان ترتيب الكلام وعلامات الترقيم يفضل سليم.

كل حاجة بتحصل على جهازك. مفيش API، مفيش حساب، مفيش Telemetry، ومفيش كود بيطلع بره VS Code. لو ضغطت زر المشاركة بنفسك فقط، الإضافة تفتح X برسالة جاهزة من غير ما تنشر مكانك.

## Why it is useful

The joke creates a useful interruption. A medium or huge paste is easy to skim past, while AI-answer debris can quietly leak into source files and reviews. El-Batta adds a short review checkpoint without blocking your work, changing your code automatically, or sending it anywhere.

| What the duck sees | What happens |
|---|---|
| AI answer comments, Markdown fences, or generic key placeholders | Highest-severity roast and temporary blur |
| A paste at least twice your configured line threshold | Huge-paste roast and temporary blur |
| A paste at least your configured line threshold | Medium-paste roast and temporary blur |
| Normal typing and small clean edits | Absolutely nothing |

## The mascot

<p align="center">
  <img src="images/duck-avatar.png" alt="Pixel-art Fake Senior Duck mascot" width="320" />
</p>

A real senior reviews the code. A **Fake Senior Duck** lowers its glasses, points at your paste, and asks why the Pull Request has already submitted its resignation.

## Commands

Open the Command Palette with `Ctrl/Cmd+Shift+P`, then search for **El-Batta**.

| Command | Purpose |
|---|---|
| **El-Batta: Open Duck Sidebar** | Opens the permanent pixel-duck panel |
| **El-Batta: Clean AI Junk** | Cleans the current selection, or the whole file when nothing is selected |
| **El-Batta: Show Duck Stats** | Shows locally stored roast, intercepted-line, and cleanup counts |
| **El-Batta: Toggle Paste Guard** | Wakes or puts the duck to sleep |
| **El-Batta: Reset Duck Stats** | Clears the local counters after a confirmation |

The cleaner removes surrounding Markdown code fences, common AI conversational comment lines, trailing whitespace, and excessive blank lines. The operation is a single undoable editor edit.

## Configuration

| Setting | Default | Description |
|---|---:|---|
| `batta.enabled` | `true` | Enables suspicious-paste detection |
| `batta.openSidebarOnStartup` | `true` | Opens the pixel-duck panel when VS Code starts |
| `batta.lineThreshold` | `35` | Lines required for a medium warning; huge means twice this value |
| `batta.blurDurationSeconds` | `5` | Seconds before the pasted range becomes readable again |
| `batta.showRoastNotifications` | `false` | Also shows a native warning; the sidebar bubble always updates |

Example `settings.json`:

```json
{
  "batta.lineThreshold": 25,
  "batta.blurDurationSeconds": 4,
  "batta.showRoastNotifications": true
}
```

## Privacy and cost

**Zero cost and zero data collection.** Detection uses fixed local string and RegExp heuristics inside the VS Code Extension Host. Statistics live only in VS Code's local extension storage. El-Batta does not use an LLM, remote server, network request, telemetry SDK, or analytics service.

The **Share the roast** action is explicit: when selected, it opens an X intent URL in your browser. Nothing is posted automatically.

## Install the packaged extension

1. Download `el-batta-el-meshmeshia.vsix`.
2. In VS Code, open **Extensions**.
3. Choose **Views and More Actions → Install from VSIX…**.
4. Select the file and wake the duck.

You can also run:

```bash
code --install-extension el-batta-el-meshmeshia.vsix
```

## Build locally

```bash
npm install
npm test
npm run package
```

The project targets TypeScript ES2022 in strict mode. The automated tests exercise the paste tiers, artifact rules, line counting, cleanup behavior, and line-ending preservation.

## English in one paragraph

Paste a suspiciously large or obviously AI-flavored block into a visible editor and El-Batta temporarily blurs the exact inserted range, displays a short countdown, records anonymous local-only totals, reveals its permanent sidebar, and serves an RTL-safe Egyptian-Arabic roast in a speech bubble beside the pixel mascot. You can clean common AI residue with one command, mute notifications while retaining the guard, or disable the extension completely. It is intentionally small, deterministic, offline, and reversible.

## Contributing and links

Issues, feature ideas, and pull requests belong in the public repository: [Asma-2005/el-batta-el-meshmeshia](https://github.com/Asma-2005/el-batta-el-meshmeshia).

**Made with TypeScript, local RegExp, and an unreasonable amount of duck confidence.**

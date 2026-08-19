# El-Batta El-Meshmeshia — Product Direction

## Product promise

**The duck interrupts suspicious pastes for five funny seconds, makes the developer actually look at the code, and offers one-click cleanup.** The extension stays local, fast, and deliberately small.

## Core interaction

A document insertion is classified in this order: obvious AI debris, huge paste, medium paste, or safe. Only paste-like multi-character insertions are inspected. When suspicious content is found, the exact inserted range is faded and blurred, a compact status-bar countdown appears, and one Egyptian-Arabic roast is shown. The user can clean the active file immediately or copy a shareable roast. The range becomes readable automatically when the countdown ends.

Rapid consecutive detections share one countdown per editor instead of spawning timer chaos. Multiple pasted ranges can remain blurred during the active countdown, document closures are handled safely, and disabling the extension clears all temporary UI.

## Funny, not annoying

The comedy should sound like a sharp Egyptian senior engineer, not an abusive bot. Roasts vary by severity, avoid slurs, and stay short enough for a notification. The duck's vocabulary revolves around Ctrl+V, production fires, unread pull requests, and suspiciously literary code blocks.

## Visual identity

The mascot is a **confident yellow pixel-art duck presented as a fake senior engineer**. It has a strong square silhouette, a dark navy hoodie, tiny round glasses, an orange beak, and one raised wing pointing at a glowing code screen. The palette uses duck yellow, warm orange, deep navy, terminal teal, and alert red. The marketplace icon contains no lettering and must remain recognizable at 32 px, while the README may use a larger hero version.

## Deliberate scope

The first release has four meaningful commands: clean AI junk, show local statistics, toggle the guard, and reset statistics. It performs no network calls or telemetry. Sharing opens a prefilled X intent only when the user explicitly chooses it. The cleaner defaults to the current selection when non-empty and otherwise cleans the whole active document.

## Acceptance criteria

The TypeScript project compiles in strict mode, automated tests cover detection and text cleaning, the extension packages into a VSIX, and the icon is visually crisp at marketplace and activity-bar sizes. The README explains the joke, privacy model, commands, settings, and installation in Arabic and English.

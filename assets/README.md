# Assets

Drop your final artwork into this folder and add them back to `app.json`
(`expo.icon`, `expo.android.adaptiveIcon.foregroundImage`, `expo.splash.image`,
`expo.web.favicon`).

Required files:

| File | Use | Suggested size |
|---|---|---|
| `icon.png` | iOS + general app icon | 1024 × 1024 |
| `adaptive-icon.png` | Android adaptive foreground | 1024 × 1024 (safe zone) |
| `splash.png` | Launch splash | 1242 × 2436 |
| `favicon.png` | PWA / web | 196 × 196 |

For sound effects, drop short royalty-free clips at:

```
sounds/tap.mp3
sounds/correct.mp3
sounds/wrong.mp3
sounds/win.mp3
sounds/lose.mp3
```

Then uncomment the corresponding `require()` lines in
`src/feedback/sounds.ts` and the audio playback wires up automatically.

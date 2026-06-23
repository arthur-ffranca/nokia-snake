# Snake LCD

A tiny web remake inspired by the classic Snake from old Nokia phones.

The goal was to keep it simple, nostalgic, and playable: a monochrome LCD-style screen, chunky pixels, keyboard controls, score tracking, restart flow, and retro beep sounds generated in the browser.

## Preview

Run it locally and open the game in your browser:

```bash
python -m http.server 5173
```

Then visit:

```text
http://localhost:5173
```

If you are already inside this folder, no build step is required.

## Stack

- HTML
- CSS
- JavaScript
- Canvas 2D
- Web Audio API

No framework, no bundler, no external assets.

## Controls

- Arrow keys: move the snake
- `W`, `A`, `S`, `D`: alternative movement
- `Enter` or `Space`: start, pause, or resume
- `OK` button: start, pause, or resume
- `Restart` button: restart the game
- `Sound On/Off`: toggle retro beeps

## Features

- Classic Snake grid movement
- Food spawning
- Score and best score
- Wall and self-collision detection
- Game over state
- Pause and restart
- LCD-style visual treatment
- Retro synthesized beep sounds
- Test-friendly hooks:
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`

## Project Structure

```text
.
├── index.html
├── styles.css
├── game.js
└── README.md
```

## Notes

This started as a small experiment with Codex and custom skills: build something nostalgic, inspect it in the browser, iterate on the design, and validate the gameplay loop.

The first version had a full Nokia-style phone shell. The final version keeps only the LCD screen, because the game itself was the part worth preserving.

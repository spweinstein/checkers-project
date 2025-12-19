# Checkers Browser Game

## How to Run

**Important:** This project uses ES6 modules and must be served via HTTP (not opened directly as a file).

### Option 1: Python (recommended)
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

### Option 2: Node.js
```bash
npx http-server
```

### Option 3: VS Code Live Server
Install the "Live Server" extension and click "Go Live" in the status bar.

**Note:** Opening `index.html` directly (file://) will not work due to CORS restrictions with ES6 modules.

## How to Play

Checkers is a game where...

## Technologies Used

- **HTML** -
- **CSS** -
- **JS** - ES6 Modules

## Wireframe

![alt text](image.png)

## Project Structure

```
├── index.html       # Main HTML file
├── main.js          # Entry point - loads game and UI modules
├── game.js          # Game logic and state management
├── ui.js            # UI rendering and event handling (imports ai.js)
├── ai.js            # AI opponent with minimax algorithm
└── style.css        # Styling
```

**Module Import Chain:**
- `index.html` loads `main.js` (type="module")
- `main.js` imports `game.js` and `ui.js`
- `ui.js` imports `game.js` and `ai.js`

## Future Improvements

## Author

- Spencer Weinstein
- GitHub:

## Reflections

- Blah
- blah
  - blah

<!--  -->

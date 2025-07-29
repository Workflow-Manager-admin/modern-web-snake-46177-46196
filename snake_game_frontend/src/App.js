import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// --- GAME CONSTANTS ---
const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 }
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const MOVE_INTERVAL = 110; // ms, speed of the snake

const COLORS = {
  boardBg: 'var(--bg-secondary, #f8f9fa)',
  snake: 'var(--color-primary, #18a558)',
  snakeHead: 'var(--color-accent, #f9c846)',
  food: 'var(--color-secondary, #273469)',
  border: '#e9ecef',
  score: 'var(--color-secondary, #273469)',
  control: 'var(--color-primary, #18a558)',
  notification: '#f9c846',
  notificationText: 'var(--text-primary, #282c34)'
};

// --- HELPER ---
const getRandomFreeCell = (snakeArr) => {
  let cells = [];
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (!snakeArr.some((s) => s.x === x && s.y === y)) {
        cells.push({ x, y });
      }
    }
  }
  return cells[Math.floor(Math.random() * cells.length)];
};

// PUBLIC_INTERFACE
function App() {
  // GAME STATES
  const [snake, setSnake] = useState([...INITIAL_SNAKE]);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(getRandomFreeCell(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem('highScore-snake-v1')) || 0
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [theme, setTheme] = useState('light');

  const moveIntervalRef = useRef();
  const directionRef = useRef(direction);
  const pendingDirectionRef = useRef(null);

  // Handle theme switching (reuse from template)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === ' ') {
        if (gameOver) {
          handleReset();
        } else if (isRunning) {
          handlePauseResume();
        } else {
          handleStart();
        }
        return;
      }
      const keys = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 }
      };
      const newDir = keys[e.key];
      if (newDir) {
        // Prevent reverse
        const curr = directionRef.current;
        if (curr.x + newDir.x !== 0 || curr.y + newDir.y !== 0) {
          pendingDirectionRef.current = newDir;
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [gameOver, isRunning]);

  // Snake movement timer logic
  useEffect(() => {
    if (isRunning && !isPaused && !gameOver) {
      moveIntervalRef.current = setInterval(() => {
        setSnake((currSnake) => {
          let currDir = pendingDirectionRef.current || directionRef.current;
          pendingDirectionRef.current = null;
          directionRef.current = currDir;
          setDirection(currDir);
          const newHead = {
            x: currSnake[0].x + currDir.x,
            y: currSnake[0].y + currDir.y
          };
          // Check collisions
          if (
            newHead.x < 0 || newHead.x >= BOARD_SIZE ||
            newHead.y < 0 || newHead.y >= BOARD_SIZE ||
            currSnake.some((s) => s.x === newHead.x && s.y === newHead.y)
          ) {
            handleGameOver();
            return currSnake;
          }
          if (food.x === newHead.x && food.y === newHead.y) {
            setFood(getRandomFreeCell([newHead, ...currSnake]));
            setScore((s) => s + 1);
            // check high score
            if (score + 1 > highScore) {
              localStorage.setItem('highScore-snake-v1', String(score + 1));
              setHighScore(score + 1);
              setShowNotification(true);
            }
            return [newHead, ...currSnake];
          } else {
            return [newHead, ...currSnake.slice(0, -1)];
          }
        });
      }, MOVE_INTERVAL);
      return () => clearInterval(moveIntervalRef.current);
    }
    return undefined;
    // eslint-disable-next-line
  }, [isRunning, isPaused, gameOver, food, score, highScore]);

  // Save direction ref for smooth turn
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Reset notification
  useEffect(() => {
    let timeout;
    if (showNotification) {
      timeout = setTimeout(() => setShowNotification(false), 2200);
    }
    return () => clearTimeout(timeout);
  }, [showNotification]);

  // PUBLIC_INTERFACE
  function handleStart() {
    if (!isRunning) {
      setSnake([...INITIAL_SNAKE]);
      setDirection(INITIAL_DIRECTION);
      directionRef.current = INITIAL_DIRECTION;
      pendingDirectionRef.current = null;
      setFood(getRandomFreeCell(INITIAL_SNAKE));
      setScore(0);
      setGameOver(false);
      setIsPaused(false);
      setIsRunning(true);
    }
  }
  // PUBLIC_INTERFACE
  function handlePauseResume() {
    if (!isRunning || gameOver) return;
    setIsPaused((prev) => !prev);
  }
  // PUBLIC_INTERFACE
  function handleReset() {
    setSnake([...INITIAL_SNAKE]);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    pendingDirectionRef.current = null;
    setFood(getRandomFreeCell(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsRunning(false);
    setShowNotification(false);
  }
  // PUBLIC_INTERFACE
  function handleGameOver() {
    setGameOver(true);
    setIsRunning(false);
    setIsPaused(false);
  }

  // Touch swipe for mobile controls
  useEffect(() => {
    let touchStart = null;
    const touchHandler = (e) => {
      if (!touchStart) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return;
      }
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        // Horizontal swipe
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && (directionRef.current.x !== -1)) pendingDirectionRef.current = { x: 1, y: 0 };
          else if (dx < 0 && (directionRef.current.x !== 1)) pendingDirectionRef.current = { x: -1, y: 0 };
        } else {
          // Vertical swipe
          if (dy > 0 && (directionRef.current.y !== -1)) pendingDirectionRef.current = { x: 0, y: 1 };
          else if (dy < 0 && (directionRef.current.y !== 1)) pendingDirectionRef.current = { x: 0, y: -1 };
        }
        touchStart = null;
      }
    };
    const board = document.getElementById('snake-board');
    if (board) {
      board.addEventListener('touchstart', (e) => (touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }), { passive: true });
      board.addEventListener('touchmove', touchHandler, { passive: false });
      board.addEventListener('touchend', () => (touchStart = null));
    }
    return () => {
      if (board) {
        board.removeEventListener('touchmove', touchHandler);
      }
    };
  }, []);

  // --- UI COMPONENTS ---
  // PUBLIC_INTERFACE
  function Board() {
    const cells = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const isHead = snake[0].x === x && snake[0].y === y;
        const isSnake = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
        const isFood = food.x === x && food.y === y;
        let cellType = '';
        if (isHead) cellType = 'snake-head';
        else if (isSnake) cellType = 'snake-body';
        else if (isFood) cellType = 'food';

        cells.push(
          <div
            key={`${x},${y}`}
            className={`cell ${cellType}`}
            aria-label={
              isHead
                ? 'Snake head'
                : isSnake
                ? 'Snake body'
                : isFood
                ? 'Food'
                : 'Empty cell'
            }
          ></div>
        );
      }
    }
    return (
      <div className="snake-board" id="snake-board"
           tabIndex={0}
           aria-label="Snake Game Board"
           role="grid">
        {cells}
      </div>
    );
  }

  function Notification({ text }) {
    return (
      <div className="notification" role="alert" style={{ background: COLORS.notification }}>
        <span style={{ color: COLORS.notificationText }}>{text}</span>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="App" data-theme={theme}>
      <header className="snake-header">
        <h1 className="snake-title">
          <span role="img" aria-label="snake" style={{ marginRight: 7 }}>🐍</span>
          Snake Game
        </h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title="Theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="snake-main">
        <div className="snake-panel">
          <div className="score-block">
            <div className="score-label">Score</div>
            <div className="score-value">{score}</div>
            <div className="score-label high">Best</div>
            <div className="score-value high">{highScore}</div>
          </div>
          <div className="snake-controls">
            <button
              className="snake-btn"
              onClick={handleStart}
              disabled={isRunning && !gameOver}
              aria-label="Start game"
            >
              Start
            </button>
            <button
              className="snake-btn"
              onClick={handlePauseResume}
              disabled={!isRunning || gameOver}
              aria-label={isPaused ? 'Resume game' : 'Pause game'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="snake-btn"
              onClick={handleReset}
              aria-label="Reset game"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="snake-board-container">
          <Board />
          {gameOver && (
            <Notification text={`Game Over! Score: ${score}`} />
          )}
          {showNotification && !gameOver && (
            <Notification text="🎉 New High Score!" />
          )}
          {!isRunning && !gameOver && (
            <div className="instruction">
              <span>Press <kbd>Start</kbd> or <kbd>Space</kbd> to begin</span>
            </div>
          )}
          {gameOver && (
            <div className="instruction">
              <span>Press <kbd>Reset</kbd> or <kbd>Space</kbd> to play again</span>
            </div>
          )}
        </div>
        <div className="snake-help">
          <small>
            <b>Controls:</b> Arrow keys / WASD / swipe. Space to start/pause/reset.<br />
            Enjoy on desktop or mobile!
          </small>
        </div>
      </main>
      <footer className="snake-footer">
        <span>
          &copy; {new Date().getFullYear()} Modern Snake | Built with React
        </span>
      </footer>
    </div>
  );
}

export default App;

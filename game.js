import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { UI } from './ui.js';
import { PowerUpManager } from './powerups.js';
import { AudioManager } from './audio.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.player = new Player(canvas);
        this.enemies = new EnemyManager(canvas, this);
        this.audio = new AudioManager();
        this.ui = new UI();
        this.ui.initButtons(this);
        this.powerups = new PowerUpManager(canvas);

        this.audio.playMenuMusic();

        this.score = 0;
        this.combo = 1;
        this.highScore = Number(localStorage.getItem("symbioteHighScore")) || 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.paused = false;
        this.countdown = 0;
        this.isCountingDown = false;
        this.highScoreCelebrated = false;
        this.colorCycle = ['green', 'gold', 'pink', 'blue'];
        this.colorIndex = -1; // Start with black
        this.lastThresholdScore = 0;

        // Dynamic Difficulty Scaling and Passive health drain
        this.difficultyInterval = setInterval(() => {
            if (this.gameStarted && !this.gameOver && !this.paused) {
                let drainRate = 3.33; // Default for 30s survival (100 / 30)

                if (this.score >= 500) {
                    // Phase 2: Complex Scaling
                    // Accelerating drain: +0.5 per 100 points above 500
                    drainRate += Math.floor((this.score - 500) / 100) * 0.5;
                    // Combo Penalty: +0.2 per combo point
                    drainRate += this.combo * 0.2;
                }

                this.player.health = Math.max(0, this.player.health - drainRate);

                // Difficulty Scaling: Increase enemy speed
                const speedIncrement = this.score >= 500 ? 0.02 : 0.01;
                this.enemies.enemies.forEach(e => {
                    if (e.speed < 5) e.speed += speedIncrement;
                });

                if (this.player.health <= 0) {
                    this.handleGameOver();
                }
            }
        }, 1000);

        document.addEventListener("keydown", e => {
            if (e.code === "Space") {
                if (!this.gameStarted && !this.isCountingDown) {
                    this.startSequence();
                }
                if (this.gameOver) this.restart();
            }
            if (e.code === "KeyP" || e.code === "Escape") {
                if (this.gameStarted && !this.gameOver) {
                    this.togglePause();
                }
            }
            if (this.gameStarted && !this.gameOver && !this.paused) {
                if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
                    this.player.activateDash();
                }
                if (e.code === "KeyR") {
                    if (this.player.activateScream()) {
                        this.enemies.enemies = this.enemies.enemies.filter(e => e.type !== 'anti-venom');
                    }
                }
                if (e.code === "KeyQ") {
                    this.player.activateRage();
                }
            }
        });
    }

    startSequence() {
        if (this.isCountingDown) return;

        this.ui.toggleMenu(false);
        this.gameStarted = true;
    }

    togglePause() {
        this.paused = !this.paused;
        this.ui.toggleMenu(this.paused, "PAUSED");
    }

    resume() {
        if (this.gameOver) {
            this.ui.toggleMenu(true, "GAME OVER", this.score, this.highScore);
            return;
        }
        this.paused = false;
        this.ui.toggleMenu(false);
        this.audio.playBGM();
    }

    goBack() {
        window.location.reload();
    }

    restart() {
        this.score = 0;
        this.combo = 1;
        this.gameOver = false;
        this.gameStarted = false;
        this.paused = false;
        this.isCountingDown = false;
        this.player.reset();
        this.enemies.reset();
        this.powerups.reset();
        this.ui.toggleMenu(false);
        this.highScoreCelebrated = false;

        this.audio.playBGM();
        this.startSequence();
    }

    update() {
        const isGameActive = this.gameStarted && !this.gameOver && !this.paused;
        const isStatic = !isGameActive;

        // Visual updates even when paused/counting down
        this.player.update(isStatic);
        this.enemies.update(this.player, isStatic);
        this.powerups.update(this.player, isStatic);

        if (isStatic) return;

        // Core logic only when active

        // Color Transition & Size Reset Every 1000 Points
        if (this.score - this.lastThresholdScore >= 1000) {
            this.colorIndex = (this.colorIndex + 1) % this.colorCycle.length;
            const nextColorName = this.colorCycle[this.colorIndex];
            this.player.targetColor = { ...this.player.colors[nextColorName] };

            this.lastThresholdScore = Math.floor(this.score / 1000) * 1000;
            this.player.radius = 16; // Reset size
        }

        let absorbResult = this.enemies.checkAbsorb(this.player);
        if (absorbResult.hitAntiVenom) {
            this.handleGameOver();
            return;
        }

        if (absorbResult.kills > 0) {
            this.score += absorbResult.kills * this.combo;
            this.combo++;

            // Dynamic Player Scaling (Reset at thresholds)
            let relativeScore = this.score - this.lastThresholdScore;
            this.player.radius = 16 + Math.floor(relativeScore / 50);
        }

        // High Score Celebration
        if (this.score > this.highScore && !this.highScoreCelebrated && this.score > 0) {
            this.highScoreCelebrated = true;
            // Optionally update highscore early to show in UI during run
            this.highScore = this.score;
            localStorage.setItem("symbioteHighScore", this.score);
        }
    }

    handleGameOver() {
        if (this.gameOver) return; // Prevent multiple calls
        this.gameOver = true;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("symbioteHighScore", this.score);
        }

        this.ui.toggleMenu(true, "STRIKE OVER", this.score, this.highScore);
        this.audio.playGameOver();
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.gameStarted && !this.isCountingDown && !this.gameOver) {
            this.ui.drawStart(this.ctx, this.canvas);
            return;
        }

        // Draw behind overlay
        this.player.draw(this.ctx);
        this.enemies.draw(this.ctx, 'black');
        this.powerups.draw(this.ctx);
        this.ui.drawHUD(this.ctx, this.score, this.player.health, this.combo, this.countdown, this.isCountingDown, this.player);

        if (this.gameOver) {
            this.ui.drawGameOver(this.ctx, this.canvas, this.highScore);
        }
    }
}

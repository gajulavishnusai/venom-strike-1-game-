export class UI {
    drawStart(ctx, canvas) {
        // Handled by HTML overlay for better visual impact
    }

    drawGameOver(ctx, canvas, highScore) {
        // Overlay handled by CSS, but we can draw extra effects here if needed
    }

    drawHUD(ctx, score, health, combo, countdown, isCountingDown, player) {
        // Countdown Overlay
        if (isCountingDown) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(-20, -20, ctx.canvas.width, ctx.canvas.height);

            ctx.font = "bold 150px 'Barlow Condensed', sans-serif";
            ctx.fillStyle = "#ff0000";
            ctx.textAlign = "center";
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#f00";
            ctx.fillText(countdown, ctx.canvas.width / 2, ctx.canvas.height / 2);

            ctx.font = "40px 'Metal Mania', cursive";
            ctx.fillText("THE STRIKE BEGINS", ctx.canvas.width / 2, ctx.canvas.height / 2 + 80);
            ctx.restore();
        }

        // Realistic Blood HUD
        ctx.save();
        ctx.translate(20, 20);

        // Organic Backdrop (Optimized: No shadow)
        let gradient = ctx.createLinearGradient(0, 0, 260, 0);
        gradient.addColorStop(0, "rgba(40, 0, 0, 0.95)");
        gradient.addColorStop(1, "rgba(10, 0, 0, 0.98)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, 260, 120, [0, 20, 0, 20]);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Blood Label (Nosifer)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ff0000";
        if (score >= 500) {
            // Complex phase: Pulsing text and brighter color
            let pulse = Math.abs(Math.sin(Date.now() / 300));
            ctx.fillStyle = `rgb(${200 + pulse * 55}, ${pulse * 50}, ${pulse * 50})`;
            ctx.shadowBlur = 10 * pulse;
            ctx.shadowColor = "#f00";
            ctx.font = "bold 16px 'Metal Mania', cursive";
            ctx.fillText("UNSTABLE SYNERGY", 15, 25);
        } else {
            ctx.font = "14px 'Metal Mania', cursive";
            ctx.fillText("BLOOD SYNERGY", 15, 25);
        }

        // Health Bar (Optimized: No shadow)
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.roundRect(15, 40, 230, 20, 10);
        ctx.fill();

        // Fluid Fill
        let hWidth = Math.max(0, 2.3 * health);
        let fluidGrad = ctx.createLinearGradient(15, 0, 15 + hWidth, 0);
        fluidGrad.addColorStop(0, "#600");
        fluidGrad.addColorStop(0.5, "#f00");
        fluidGrad.addColorStop(1, "#900");

        ctx.fillStyle = fluidGrad;
        ctx.beginPath();
        ctx.roundRect(15, 40, hWidth, 20, 10);
        ctx.fill();

        // Highlight on fluid
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(15, 42, hWidth, 4);

        // Score & Combo (Barlow Condensed)
        ctx.fillStyle = "#ffaaaa";
        ctx.font = "bold 24px 'Barlow Condensed', sans-serif";
        ctx.fillText("SCORE: " + score, 15, 85);

        ctx.font = "bold 34px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = "#ff0000";
        ctx.fillText("x" + combo, 15, 115);
        ctx.font = "14px 'Metal Mania', cursive";
        ctx.fillStyle = "#400";
        ctx.fillText("COMBO", 60, 115);

        ctx.restore();

        // Superpowers HUD (Bottom Left)
        if (player) {
            ctx.save();
            ctx.translate(20, ctx.canvas.height - 130);

            this.drawPowerBar(ctx, "DASH [SHIFT]", player.dashCooldown, 900, "#0ff", 0);
            this.drawPowerBar(ctx, "SCREAM [R]", player.screamCooldown, 900, "#f0f", 40);
            this.drawPowerBar(ctx, "RAGE [Q]", player.rageCooldown, 900, "#f00", 80);

            ctx.restore();
        }
    }

    drawPowerBar(ctx, label, current, max, color, yOffset) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(0, yOffset, 200, 30, 5);
        ctx.fill();

        let width = 200;
        if (current > 0) {
            width = (1 - current / max) * 200;
            ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
            ctx.beginPath();
            ctx.roundRect(0, yOffset, 200, 30, 5);
            ctx.fill();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(0, yOffset, width, 30, 5);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.fillText(label, 10, yOffset + 20);

        if (current > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillText(Math.ceil(current / 60) + "s", 170, yOffset + 20);
        } else {
            ctx.fillStyle = "#fff";
            ctx.fillText("READY", 155, yOffset + 20);
        }
    }

    toggleMenu(show, title = "PAUSED", score = 0, highScore = 0) {
        const overlay = document.getElementById("menu-overlay");
        const startScreen = document.getElementById("start-screen");
        const resumeBtn = document.getElementById("resume-btn");
        const scoreInfo = document.getElementById("score-info");

        if (!show && startScreen) {
            startScreen.style.opacity = '0';
            setTimeout(() => startScreen.classList.add('hidden'), 1000);
        }

        if (show) {
            overlay.classList.remove("hidden");
            document.getElementById("menu-title").innerText = title;

            // Treat STRIKE or GAME OVER as final states
            const isGameOverState = title.includes("GAME OVER") || title.includes("STRIKE");

            if (isGameOverState) {
                resumeBtn.classList.add("hidden");
                scoreInfo.classList.remove("hidden");
                document.getElementById("final-score").innerText = score;
                document.getElementById("high-score").innerText = highScore;
            } else {
                resumeBtn.classList.remove("hidden");
                scoreInfo.classList.add("hidden");
            }
        } else {
            overlay.classList.add("hidden");
        }
    }

    initButtons(game) {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                if (!game.gameStarted && !game.isCountingDown) {
                    game.startSequence();
                }
            };
            startBtn.onmouseenter = () => game.audio.playClick();
        }

        // Keyboard support for Enter key
        window.addEventListener('keydown', (e) => {
            const startScreen = document.getElementById('start-screen');
            if (e.key === 'Enter' && !startScreen.classList.contains('hidden')) {
                if (!game.gameStarted && !game.isCountingDown) {
                    game.startSequence();
                }
            }
        });

        const menuButtons = document.querySelectorAll('.menu-buttons button');
        menuButtons.forEach(btn => {
            btn.onmouseenter = () => {
                // Subtle pulse effect on corners when hovering buttons
                const corners = document.querySelectorAll('.menu-corner');
                corners.forEach(c => {
                    c.style.transform = 'scale(1.2)';
                    c.style.borderColor = '#fff';
                });
            };
            btn.onmouseleave = () => {
                const corners = document.querySelectorAll('.menu-corner');
                corners.forEach(c => {
                    c.style.transform = 'scale(1)';
                    c.style.borderColor = '#f00';
                });
            };
        });

        document.getElementById("resume-btn").onclick = () => {
            game.resume();
        };
        document.getElementById("restart-btn").onclick = () => {
            game.restart();
        };
        document.getElementById("back-btn").onclick = () => {
            game.goBack();
        };
    }
}

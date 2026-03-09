export class EnemyManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.enemies = [];
        setInterval(() => {
            if (this.game && this.game.gameStarted && !this.game.gameOver && !this.game.paused) {
                if (this.enemies.length < 60) { // Performance cap
                    this.spawn();
                }
            }
        }, 1000);
    }

    reset() { this.enemies = []; }

    spawn() {
        const rand = Math.random();
        let type = 'regular';
        let color = '#ff0040';
        let radius = 12;
        let speed = 1.2;
        let health = 1;

        if (rand < 0.15) {
            type = 'anti-venom';
            color = '#ffffff';
            radius = 15;
            speed = 1.7;
        } else if (rand < 0.25) {
            type = 'brute';
            color = '#800020';
            radius = 25;
            speed = 0.6;
            health = 3; // Requires 3 absorptions
        } else if (rand < 0.35) {
            type = 'stalker';
            color = '#ff6600';
            radius = 8;
            speed = 2.5;
        } else if (rand < 0.40) {
            type = 'screamer';
            color = '#ff00ff';
            radius = 14;
            speed = 1.0;
        }

        let enemy = { x: 0, y: 0, radius, type, color, speed, health };

        // Spawn at edges
        if (Math.random() < 0.5) {
            enemy.x = Math.random() < 0.5 ? -radius : this.canvas.width + radius;
            enemy.y = Math.random() * this.canvas.height;
        } else {
            enemy.x = Math.random() * this.canvas.width;
            enemy.y = Math.random() < 0.5 ? -radius : this.canvas.height + radius;
        }

        if (type === 'anti-venom') {
            enemy.tentacles = [];
            for (let i = 0; i < 8; i++) {
                let segments = [];
                for (let j = 0; j < 8; j++) segments.push({ x: enemy.x, y: enemy.y });
                enemy.tentacles.push(segments);
            }
        }

        this.enemies.push(enemy);
    }

    update(player, isStatic = false) {
        if (isStatic) return;

        const boundary = 200; // Cleanup threshold
        this.enemies = this.enemies.filter(enemy => {
            // Move enemy
            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;
            let angle = Math.atan2(dy, dx);
            enemy.x += Math.cos(angle) * enemy.speed;
            enemy.y += Math.sin(angle) * enemy.speed;

            // Tentacle update
            if (enemy.type === 'anti-venom' && enemy.tentacles) {
                enemy.tentacles.forEach((tentacle, i) => {
                    let tentacleAngle = (i / 8) * Math.PI * 2;
                    tentacle[0].x = enemy.x + Math.cos(tentacleAngle) * (enemy.radius * 0.7);
                    tentacle[0].y = enemy.y + Math.sin(tentacleAngle) * (enemy.radius * 0.7);
                    for (let j = 1; j < tentacle.length; j++) {
                        let tdx = tentacle[j - 1].x - tentacle[j].x;
                        let tdy = tentacle[j - 1].y - tentacle[j].y;
                        let dist = Math.hypot(tdx, tdy);
                        if (dist > 0) {
                            tentacle[j].x = tentacle[j - 1].x - (tdx / dist) * (enemy.radius * 0.3);
                            tentacle[j].y = tentacle[j - 1].y - (tdy / dist) * (enemy.radius * 0.3);
                        }
                    }
                });
            }

            // Off-screen cleanup
            return !(
                enemy.x < -boundary ||
                enemy.x > this.canvas.width + boundary ||
                enemy.y < -boundary ||
                enemy.y > this.canvas.height + boundary
            );
        });
    }


    checkAbsorb(player) {
        let result = { kills: 0, hitAntiVenom: false };
        const now = Date.now();
        this.enemies = this.enemies.filter(enemy => {
            let dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < player.radius) {
                if (enemy.type === 'anti-venom') {
                    result.hitAntiVenom = true;
                    return false;
                }

                // Absorption delay for high-health enemies (Brutes)
                if (enemy.lastAbsorb && now - enemy.lastAbsorb < 250) return true;

                enemy.health--;
                enemy.lastAbsorb = now;

                if (enemy.health <= 0) {
                    result.kills += (enemy.type === 'brute' ? 5 : 1);
                    return false;
                }
                // Brutes push back slightly when hit but not killed
                let pushX = (enemy.x - player.x) / dist;
                let pushY = (enemy.y - player.y) / dist;
                enemy.x += pushX * 20;
                enemy.y += pushY * 20;
            }
            return true;
        });
        return result;
    }

    draw(ctx, theme) {
        this.enemies.forEach(enemy => {
            if (enemy.type === 'anti-venom') {
                this.drawAntiVenom(ctx, enemy, theme);
            } else {
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                ctx.fillStyle = enemy.color;

                // Brute cracks
                if (enemy.type === 'brute' && enemy.health < 3) {
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    ctx.stroke();
                }

                // Screamer glow (optimized: use semi-transparent stroke instead of shadowBlur)
                if (enemy.type === 'screamer') {
                    ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }

                ctx.fill();
            }
        });
    }

    drawAntiVenom(ctx, enemy, theme) {
        ctx.lineCap = "round";
        let tentacleColor = "rgba(200, 200, 200, 0.9)";
        if (theme === 'white') tentacleColor = "rgba(100, 100, 100, 0.9)";

        // Draw tentacles
        if (enemy.tentacles) {
            enemy.tentacles.forEach(tentacle => {
                ctx.beginPath();
                ctx.moveTo(tentacle[0].x, tentacle[0].y);
                for (let j = 1; j < tentacle.length; j++) {
                    ctx.lineTo(tentacle[j].x, tentacle[j].y);
                }
                ctx.strokeStyle = tentacleColor;
                ctx.lineWidth = enemy.radius / 3;
                ctx.stroke();
            });
        }

        // Draw body
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        if (theme === 'white') {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Black Eyes (Anti-Venom)
        ctx.fillStyle = "#000";
        let eyeSize = enemy.radius * 0.5;
        let eyeOffset = enemy.radius * 0.3;

        // Left eye
        ctx.save();
        ctx.translate(enemy.x - eyeOffset, enemy.y - eyeOffset);
        ctx.rotate(-Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeSize, eyeSize * 0.375, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right eye
        ctx.save();
        ctx.translate(enemy.x + eyeOffset, enemy.y - eyeOffset);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeSize, eyeSize * 0.375, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

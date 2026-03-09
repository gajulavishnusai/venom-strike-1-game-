export class PowerUpManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.powerups = [];
        setInterval(() => this.spawn(), 12000);
    }

    reset() { this.powerups = []; }

    spawn() {
        this.powerups.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: 10
        });
    }

    update(player, isStatic = false) {
        if (isStatic) return;
        this.powerups = this.powerups.filter(p => {
            if (Math.hypot(player.x - p.x, player.y - p.y) < player.radius + 10) {
                player.health = Math.min(100, player.health + 20);
                return false;
            }
            return true;
        });
    }

    draw(ctx) {
        this.powerups.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);

            // Brain Base (Pink)
            ctx.fillStyle = "#ff8c94";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255, 100, 100, 0.5)";

            // Left Hemisphere
            ctx.beginPath();
            ctx.ellipse(-4, 0, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Right Hemisphere
            ctx.beginPath();
            ctx.ellipse(4, 0, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Brain Folds (Darker Pink Detail)
            ctx.strokeStyle = "#db6a72";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-4, -6);
            ctx.quadraticCurveTo(-8, -2, -4, 2);
            ctx.quadraticCurveTo(-6, 6, -2, 8);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(4, -6);
            ctx.quadraticCurveTo(8, -2, 4, 2);
            ctx.quadraticCurveTo(6, 6, 2, 8);
            ctx.stroke();

            // Center Fissure
            ctx.strokeStyle = "#9c4a52";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(0, 9);
            ctx.stroke();

            // Highlights (Wet look)
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(-2, -4, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(3, -5, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}

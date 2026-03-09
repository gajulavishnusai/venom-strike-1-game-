export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.health = 100;
        this.mouse = { x: this.x, y: this.y };
        this.shield = false;

        this.radius = 16;
        this.numTentacles = 8;
        this.tentacles = [];

        for (let i = 0; i < this.numTentacles; i++) {
            let segments = [];
            let segmentCount = 12;
            for (let j = 0; j < segmentCount; j++) {
                segments.push({ x: this.x, y: this.y });
            }
            this.tentacles.push(segments);
        }

        // Superpower States
        this.dashTimer = 0;
        this.rageTimer = 0;
        this.screamRipple = 0;
        this.dashCooldown = 0;
        this.rageCooldown = 0;
        this.screamCooldown = 0;

        this.baseSpeed = 0.15;
        this.speed = this.baseSpeed;
        this.history = [];

        // Color Transition States
        this.colors = {
            black: { r: 0, g: 0, b: 0 },
            green: { r: 0, g: 255, b: 100 },
            gold: { r: 255, g: 215, b: 0 },
            pink: { r: 255, g: 105, b: 180 },
            blue: { r: 0, g: 191, b: 255 }
        };
        this.currentColor = { ...this.colors.black };
        this.targetColor = { ...this.colors.black };
        this.colorLerpFactor = 0.02; // Smooth transition

        document.addEventListener("mousemove", e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener("keydown", e => {
            if (e.key === "e") this.activateShield();
        });
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.health = 100;
        this.radius = 16;
        this.currentColor = { ...this.colors.black };
        this.targetColor = { ...this.colors.black };

        // Reset Superpower States
        this.dashTimer = 0;
        this.rageTimer = 0;
        this.screamRipple = 0;
        this.dashCooldown = 0;
        this.rageCooldown = 0;
        this.screamCooldown = 0;
        this.shield = false;

        // Reset Trails
        this.history = [];
        this.speed = this.baseSpeed;
    }

    update(isStatic = false) {
        if (!isStatic) {
            // Cooldowns and Timers
            if (this.dashTimer > 0) this.dashTimer--;
            if (this.rageTimer > 0) this.rageTimer--;
            if (this.screamRipple > 0) this.screamRipple += 15;
            if (this.screamRipple > 1000) this.screamRipple = 0;

            if (this.dashCooldown > 0) this.dashCooldown--;
            if (this.rageCooldown > 0) this.rageCooldown--;
            if (this.screamCooldown > 0) this.screamCooldown--;

            // Movement Speed logic
            this.speed = this.baseSpeed;
            if (this.dashTimer > 0) this.speed *= 2.5;
            if (this.rageTimer > 0) this.speed *= 1.5;

            this.x += (this.mouse.x - this.x) * this.speed;
            this.y += (this.mouse.y - this.y) * this.speed;

            // Trail history
            this.history.push({ x: this.x, y: this.y, radius: this.radius });
            if (this.history.length > 50) this.history.shift();
        }

        // Color Interpolation (Always runs for smooth transitions)
        this.currentColor.r += (this.targetColor.r - this.currentColor.r) * this.colorLerpFactor;
        this.currentColor.g += (this.targetColor.g - this.currentColor.g) * this.colorLerpFactor;
        this.currentColor.b += (this.targetColor.b - this.currentColor.b) * this.colorLerpFactor;

        for (let i = 0; i < this.numTentacles; i++) {
            let tentacle = this.tentacles[i];
            let angle = (i / this.numTentacles) * Math.PI * 2;

            tentacle[0].x = this.x + Math.cos(angle) * (this.radius * 0.7);
            tentacle[0].y = this.y + Math.sin(angle) * (this.radius * 0.7);

            for (let j = 1; j < tentacle.length; j++) {
                let dx = tentacle[j - 1].x - tentacle[j].x;
                let dy = tentacle[j - 1].y - tentacle[j].y;
                let dist = Math.hypot(dx, dy);
                let idealDist = this.radius * 0.3;
                if (dist > 0) {
                    tentacle[j].x = tentacle[j - 1].x - (dx / dist) * idealDist;
                    tentacle[j].y = tentacle[j - 1].y - (dy / dist) * idealDist;
                }

                tentacle[j].x += Math.sin(Date.now() / 200 + i * 2 + j * 0.5) * 1.5;
                tentacle[j].y += Math.cos(Date.now() / 200 + i * 2 + j * 0.5) * 1.5;
            }
        }
    }


    activateShield() {
        this.shield = true;
        setTimeout(() => this.shield = false, 3000);
    }

    activateDash() {
        if (this.dashCooldown > 0) return false;
        this.dashTimer = 600; // 10 seconds
        this.dashCooldown = 900; // 15 seconds
        return true;
    }

    activateRage() {
        if (this.rageCooldown > 0) return false;
        this.rageTimer = 300; // 5 seconds
        this.rageCooldown = 900; // 15 seconds
        return true;
    }

    activateScream() {
        if (this.screamCooldown > 0) return false;
        this.screamRipple = 1;
        this.screamCooldown = 900; // 15 seconds
        return true;
    }

    takeDamage() {
        if (!this.shield && this.rageTimer <= 0) this.health -= 10;
    }

    draw(ctx) {
        ctx.lineCap = "round";

        // Dynamic Colors
        const rgb = `rgb(${Math.floor(this.currentColor.r)}, ${Math.floor(this.currentColor.g)}, ${Math.floor(this.currentColor.b)})`;
        const rgba = (a) => `rgba(${Math.floor(this.currentColor.r)}, ${Math.floor(this.currentColor.g)}, ${Math.floor(this.currentColor.b)}, ${a})`;

        // Define colors based on states
        let bodyColor = rgb;
        if (this.shield) bodyColor = "#0f0";
        if (this.rageTimer > 0) {
            bodyColor = `rgb(${150 + Math.sin(Date.now() / 100) * 105}, 0, 0)`;
        }

        let tentacleColor = rgba(0.9);
        if (this.shield) tentacleColor = "rgba(0, 255, 0, 0.8)";
        if (this.rageTimer > 0) tentacleColor = "rgba(150, 0, 0, 0.9)";

        // Draw Dash Trail
        if (this.dashTimer > 0) {
            this.history.forEach((pos, i) => {
                if (i % 5 !== 0) return;
                ctx.globalAlpha = i / 50;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pos.radius * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }

        // Draw Scream Ripple
        if (this.screamRipple > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.screamRipple, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${1 - this.screamRipple / 1000})`;
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.restore();
        }

        // Draw tentacles
        for (let i = 0; i < this.numTentacles; i++) {
            let tentacle = this.tentacles[i];

            ctx.beginPath();
            ctx.moveTo(tentacle[0].x, tentacle[0].y);

            for (let j = 1; j < tentacle.length; j++) {
                ctx.lineTo(tentacle[j].x, tentacle[j].y);
            }

            ctx.strokeStyle = tentacleColor;
            ctx.lineWidth = (this.rageTimer > 0 ? 10 : 6);

            // Only apply shadow weight when in special states
            if (this.shield || this.rageTimer > 0) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.shield ? "#0f0" : "#f00";
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
        }

        // Draw main body
        let currentRadius = this.radius;
        if (this.rageTimer > 0) currentRadius *= 2;

        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = bodyColor;

        if (this.shield || this.rageTimer > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = bodyColor;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Symbiote Eyes
        if (!this.shield) {
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 0;

            let eyeSize = currentRadius * 0.5;
            let eyeOffset = currentRadius * 0.3;

            // Left eye
            ctx.save();
            ctx.translate(this.x - eyeOffset, this.y - eyeOffset);
            ctx.rotate(-Math.PI / 4);
            if (this.rageTimer > 0) ctx.scale(1.5, 1.5);
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeSize, eyeSize * 0.375, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Right eye
            ctx.save();
            ctx.translate(this.x + eyeOffset, this.y - eyeOffset);
            ctx.rotate(Math.PI / 4);
            if (this.rageTimer > 0) ctx.scale(1.5, 1.5);
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeSize, eyeSize * 0.375, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.shadowBlur = 0;
    }
}

import { Game } from './game.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(canvas, ctx);
window.game = game;

function loop() {
    game.update();
    game.draw();
    requestAnimationFrame(loop);
}

loop();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

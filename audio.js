export class AudioManager {
    constructor() {
        this.bgm = document.getElementById('bgm');
        this.menuMusic = document.getElementById('menu-music');
        this.clickSound = document.getElementById('click-sound');
        this.gameOverSound = document.getElementById('game-over-sound');

        this.isStarted = false;

        // Set volumes
        if (this.bgm) this.bgm.volume = 0.5;
        if (this.menuMusic) this.menuMusic.volume = 0.6;
        if (this.clickSound) this.clickSound.volume = 0.7;
        if (this.gameOverSound) this.gameOverSound.volume = 0.8;

        // Add a global listener to handle autoplay restrictions on first click
        const startAudio = () => {
            if (!this.isStarted) {
                this.playMenuMusic();
                this.isStarted = true;
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            }
        };

        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);
    }

    playBGM() {
        if (!this.bgm) return;
        this.stopAll();
        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => {
            console.warn("BGM playback blocked:", e);
        });
    }

    playMenuMusic() {
        if (!this.menuMusic) return;
        this.stopAll();
        this.menuMusic.currentTime = 0;
        this.menuMusic.play().catch(e => {
            console.warn("Menu music playback blocked:", e);
        });
    }

    playClick() {
        if (!this.clickSound) return;
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(e => {
            // Silently fail for small SFX if blocked
        });
    }

    playGameOver() {
        if (!this.gameOverSound) return;
        this.stopAll();
        this.gameOverSound.currentTime = 0;
        this.gameOverSound.play().catch(e => {
            console.warn("Game Over sound blocked:", e);
        });
    }

    stopAll() {
        [this.bgm, this.menuMusic, this.gameOverSound].forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
}

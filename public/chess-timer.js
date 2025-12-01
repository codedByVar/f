// Chess Timer Class
class ChessTimer {
    constructor(initialTime, increment = 0) {
        this.initialTime = initialTime; // in seconds
        this.increment = increment; // bonus seconds per move
        this.whiteTime = initialTime;
        this.blackTime = initialTime;
        this.activeColor = null;
        this.intervalId = null;
        this.onTimeout = null;
        this.onUpdate = null;
    }

    start(color) {
        this.stop();
        this.activeColor = color;

        this.intervalId = setInterval(() => {
            if (this.activeColor === 'white') {
                this.whiteTime--;
                if (this.whiteTime <= 0) {
                    this.whiteTime = 0;
                    this.stop();
                    if (this.onTimeout) this.onTimeout('white');
                }
            } else if (this.activeColor === 'black') {
                this.blackTime--;
                if (this.blackTime <= 0) {
                    this.blackTime = 0;
                    this.stop();
                    if (this.onTimeout) this.onTimeout('black');
                }
            }

            if (this.onUpdate) {
                this.onUpdate(this.whiteTime, this.blackTime);
            }
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.activeColor = null;
    }

    switchTurn() {
        // Add increment to the player who just moved
        if (this.activeColor === 'white') {
            this.whiteTime += this.increment;
        } else if (this.activeColor === 'black') {
            this.blackTime += this.increment;
        }

        // Switch active player
        this.activeColor = this.activeColor === 'white' ? 'black' : 'white';
    }

    reset() {
        this.stop();
        this.whiteTime = this.initialTime;
        this.blackTime = this.initialTime;
        if (this.onUpdate) {
            this.onUpdate(this.whiteTime, this.blackTime);
        }
    }

    getTime(color) {
        return color === 'white' ? this.whiteTime : this.blackTime;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getFormattedTime(color) {
        return this.formatTime(this.getTime(color));
    }

    setOnTimeout(callback) {
        this.onTimeout = callback;
    }

    setOnUpdate(callback) {
        this.onUpdate = callback;
    }
}

// Time control presets
const TIME_CONTROLS = {
    blitz: { time: 180, increment: 2, name: 'Blitz (3+2)' },
    rapid: { time: 600, increment: 5, name: 'Rapid (10+5)' },
    classical: { time: 1800, increment: 0, name: 'Classical (30+0)' },
    bullet: { time: 60, increment: 0, name: 'Bullet (1+0)' }
};

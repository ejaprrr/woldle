// Utility function to get the root style property value
function getRootStyleProperty(property) {
    return getComputedStyle(document.body).getPropertyValue(`--${property}`);
}

// Function to show or hide the settings window
function toggleSettingsWindow(action) {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");

    if (action === "open") {
        windowWrapper.classList.add("show");
        window.style.backgroundColor = getRootStyleProperty('secondary');
        window.style.contentVisibility = "visible";
    } else if (action === "close") {
        windowWrapper.classList.remove("show");
        window.style.backgroundColor = "transparent";
        window.style.contentVisibility = "hidden";
    }
}

// Game class
class Game {
    static wrapper = document.getElementById("game");
    static tries = 6;
    static keys = Array.from(document.getElementsByClassName("key"));
    static backspace = document.getElementById("backspace");
    static enter = document.getElementById("enter");

    constructor(secret) {
        this.word = secret;
        this.row = 0;
        this.letter = 0;
        this.end = false;
        this.rows = [];

        this.init();

    }

    async init() {
        await this.loadDictionary();
        this.createGameEnvironment();
    }

    async loadDictionary() {
        const response = await fetch("files/dictionary.json");
        this.dictionary = await response.json();
    }

    createGameEnvironment() {
        for (let y = 0; y < Game.tries; y++) {
            const row = document.createElement("div");
            row.classList.add("row");

            for (let x = 0; x < this.word.length; x++) {
                const letter = document.createElement("div");
                letter.classList.add("letter");

                row.appendChild(letter);
            }
            Game.wrapper.appendChild(row);
            this.rows.push(row);
        }
    }

    animateElement(element, property, value, target, duration) {
        element.style[property] = value;
        setTimeout(() => element.style[property] = target, duration);
    }

    getCurrentLetter(position = this.letter) {
        return this.rows[this.row].children[position];
    }

    findKeyElement(key) {
        return Game.keys.find(x => x.textContent === key);
    }

    getCurrentGuess() {
        return Array.from(this.rows[this.row].children).map(x => x.textContent).join("");
    }

    changeOutline(element, color) {
        element.style.outline = `solid ${color}`;
    }

    countOccurrences(str, char) {
        return str.split(char).length - 1;
    }

    // Writing a letter
    write(letter) {
        if (this.letter < this.word.length && !this.end) {
            const letterElement = this.getCurrentLetter();
            this.animateElement(letterElement, "transform", "scale(80%)", "scale(100%)", 250);
            letterElement.textContent = letter;
            this.letter++;
            const key = this.findKeyElement(letter);
            this.animateElement(key, "transform", "scale(80%)", "scale(100%)", 250);
        }
    }

    // Removing a letter
    back() {
        this.animateElement(Game.backspace, "transform", "scale(80%)", "scale(100%)", 250);
        if (!this.end && this.letter > 0) {
            this.letter--;
            const letter = this.getCurrentLetter();
            letter.textContent = "";
        }
    }

    // Confirming the current guess
    confirm() {
        this.animateElement(Game.enter, "transform", "scale(80%)", "scale(100%)", 250);
        if (!this.end) {
            const row = this.rows[this.row];
            const guess = this.getCurrentGuess();

            const wrongColor = getRootStyleProperty("wrong");
            const rightColor = getRootStyleProperty("right");
            const displacementColor = getRootStyleProperty("displacement");
            const secondaryColor = getRootStyleProperty("secondary");

            if (this.word.length === this.letter && this.dictionary.includes(guess)) {
                this.processExactMatches(row, guess, rightColor);
                this.processInexactMatches(row, guess, displacementColor);
                this.processIncorrectLetters(row, wrongColor);
                this.updateDuplicateLetters(row, guess);
                this.animateElement(row, "gap", "20px", "15px", 500);
                this.moveToNextRow(guess);
            } else {
                this.animateInvalidGuess(row, wrongColor, secondaryColor);
            }
        }
    }

    processKeyHighlight(key, color) {
        if (!key.processed) {
            this.changeOutline(key, color);
            key.processed = true;
        }
    }

    processExactMatches(row, guess, rightColor) {
        for (let i = 0; i < this.word.length; i++) {
            const currentGuess = guess[i];
            const currentTarget = this.word[i];
            const current = row.children[i];
            const key = this.findKeyElement(currentGuess);

            if (currentGuess === currentTarget) {
                this.changeOutline(current, rightColor);
                this.processKeyHighlight(key, rightColor);
                key.processed = true;
                current.processed = true;
                current.exact = true;
            }
        }
    }

    processInexactMatches(row, guess, displacementColor) {
        for (let i = 0; i < this.word.length; i++) {
            const currentGuess = guess[i];
            const current = row.children[i];

            const key = this.findKeyElement(currentGuess);

            if (!current.processed && this.word.includes(currentGuess)) {
                const processed = Array.from(row.children).filter((x) => x.processed && x.textContent == currentGuess).length;
                if (processed < this.countOccurrences(this.word, currentGuess)) {
                    this.changeOutline(current, displacementColor);
                    this.processKeyHighlight(key, displacementColor);
                    key.processed = true;
                }

                current.exact = false;
                current.processed = true;
            };
        };
    }

    processIncorrectLetters(row, wrongColor) {
        for (let letter of row.children) {
            if (!letter.processed) {
                const key = this.findKeyElement(letter.textContent);
                this.changeOutline(letter, "transparent");
                this.processKeyHighlight(key, wrongColor);
                key.processed = true;
                letter.exact = null;
            }
        }
    }

    updateDuplicateLetters(row, guess) {
        for (let letter of row.children) {
            let countTarget = this.countOccurrences(this.word, letter.textContent);
            const inTarget = this.countOccurrences(this.word, letter.textContent);
            const inGuess = this.countOccurrences(guess, letter.textContent);

            if (inTarget > 1 && inGuess > 1) {
                if (letter.exact) {
                    countTarget -= (inGuess);
                } else {
                    countTarget -= (inGuess - 1);
                }
            }

            if (countTarget > 1) this.addCountIndex(letter, countTarget);
        }
    }

    addCountIndex(letter, count) {
        const countIndex = document.createElement("div");
        countIndex.classList.add("index");
        countIndex.textContent = count;
        letter.appendChild(countIndex);
    }

    moveToNextRow(guess) {
        if (this.word === guess || this.row === Game.tries) {
            this.end = true;
        } else {
            this.row++;
            this.letter = 0;
        }
    }

    animateInvalidGuess(row, wrongColor, secondaryColor) {
        for (let letter of row.children) {
            this.animateElement(letter, "outline", `solid ${wrongColor}`, `solid ${secondaryColor}`, 250);
        }
    }
}

let game;

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("files/targets.json");
    let words = await response.json();
    words = words.filter(word => word.length === 4);
    let secret = words[Math.floor(Math.random() * words.length)];
    secret = "koordinátor";
    game = new Game(secret);
    console.log(secret);
});

document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();

    switch (key) {
        case "BACKSPACE":
            game.back();
            break;
        
        case "ENTER":
            game.confirm();
            break;
    }
});

document.addEventListener("keypress", (event) => {
    const czechLetters = /[AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYZÝZŽ]/g;
    const key = event.key;

    if (key.length === 1 && key.toUpperCase().match(czechLetters)) {
        game.write(key);
    }
});

document.getElementById("settings").addEventListener("click", () => toggleSettingsWindow("open"));
document.getElementById("close").addEventListener("click", () => toggleSettingsWindow("close"));
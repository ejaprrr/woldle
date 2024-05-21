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
        return Game.keys.find(x => x.textContent.toLowerCase() === key);
    }

    getCurrentGuess() {
        return Array.from(this.rows[this.row].children).map(x => x.textContent.toLowerCase()).join("");
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
            const key = this.findKeyElement(letter.toLowerCase());
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
                this.processIncorrectLetters(row, guess, wrongColor);
                this.updateDuplicateLetters(row, guess);
                this.animateElement(row, "gap", "20px", "15px", 500);
                this.moveToNextRow(guess);
            } else {
                this.animateInvalidGuess(row, wrongColor, secondaryColor);
            }
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
                if (!key.processed) this.changeOutline(key, rightColor);
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
                const processed = Array.from(row.children).filter((x) => x.processed && x.textContent.toLowerCase() == currentGuess).length;
                if (processed < this.countOccurrences(this.word, currentGuess)) {
                    this.changeOutline(current, displacementColor);
                    if (!key.processed) this.changeOutline(key, displacementColor);
                    key.processed = true;
                }

                current.exact = false;
                current.processed = true;
            };
        };
    }

    processIncorrectLetters(row, guess, wrongColor) {
        for (let letter of row.children) {
            if (!letter.processed) {
                const key = this.findKeyElement(letter.textContent.toLowerCase());
                this.changeOutline(letter, "transparent");
                if (!key.processed) this.changeOutline(key, wrongColor);
                key.processed = true;
                letter.exact = null;
            }
        }
    }

    updateDuplicateLetters(row, guess) {
        for (let letter of row.children) {
            let countTarget = this.countOccurrences(this.word, letter.textContent.toLowerCase());
            const inTarget = this.countOccurrences(this.word, letter.textContent.toLowerCase());
            const inGuess = this.countOccurrences(guess, letter.textContent.toLowerCase());

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

    removeSingleCountIndices(row) {
        for (let letter of row.children) {
            const indexElement = letter.querySelector(".index");
            if (indexElement && indexElement.textContent == "1") {
                letter.removeChild(indexElement);
            }
        }
    }

    moveToNextRow(guess) {
        this.row++;
        this.letter = 0;
        if (this.word === guess || this.row === Game.tries) {
            this.end = true;
        }
    }

    animateInvalidGuess(row, wrongColor, secondaryColor) {
        for (let letter of row.children) {
            this.animateElement(letter, "outline", `solid ${wrongColor}`, `solid ${secondaryColor}`, 250);
        }
    }
}
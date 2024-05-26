// soubor, který definuje systém a operace hry

class Game {
    // základní elementy a definice

    static tries = 6;
    static keysRegex = /[AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ]/g;

    static wrapper = document.getElementById("game");
    static keys = Array.from(document.getElementsByClassName("key"));
    static backspace = document.getElementById("backspace");
    static enter = document.getElementById("enter");

    // inicializace a interní definice
    constructor() {
        this.currentRow = 0;
        this.currentLetter = 0;
        this.gameEnd = false;
        this.rows = [];
        this.length = 5;

        this.init();
    }

    async init() {
        await this.loadDictionary();
        await this.loadTargets();

        this.word = this.getSecret();

        this.createGameEnvironment();

        Game.keys.forEach((key) => {
            key.onclick = (event) => {

                switch (key.textContent) {
                    case "↵":
                        this.confirm();
                        break;
                    case "←":
                        this.back();
                        break;
                    default:
                        this.write(key.textContent);
                        break;
                }
            }
        })
    }

    changeLength(length) {
        this.currentRow = 0;
        this.currentLetter = 0;
        this.gameEnd = false;
        this.rows = [];
        
        Game.wrapper.innerHTML = "";
        this.length = length;
        this.word = this.getSecret();
        this.createGameEnvironment();
    }

    getSecret() {
        const filteredWords = Array.from(this.targets).filter((x) => x.length == this.length);
        const secret = filteredWords[Math.floor(Math.random() * filteredWords.length)];
        return secret;
    }

    // loading slovníku
    async loadDictionary() {
        const response = await fetch("files/dictionary.json");
        this.dictionary = await response.json();
    }

    async loadTargets() {
        const response = await fetch("files/targets.json");
        this.targets = await response.json();
    }

    // vytvoření herního prostředí
    createGameEnvironment() {
        for (let y = 0; y < Game.tries; y++) { // osa y
            const row = document.createElement("div");
            row.classList.add("row");

            for (let x = 0; x < this.word.length; x++) { // osa x
                const letter = document.createElement("div");
                letter.classList.add("letter");

                row.appendChild(letter);
            }

            Game.wrapper.appendChild(row);
            this.rows.push(row);
        }
    }

    // animace 
    animateElement(element, property, value, target, duration) {
        element.style[property] = value;
        setTimeout(() => element.style[property] = target, duration);
    }
    
    // momentální písmeno
    getCurrentLetter(position = this.currentLetter) {
        return this.rows[this.currentRow].children[position];
    }

    // najít klávesnicový ekvivalent písmena
    findKeyElement(key) {
        return Game.keys.find(x => x.textContent.toLowerCase() === key);
    }

    // získat obsah momentální řádky
    getCurrentGuess() {
        return Array.from(this.rows[this.currentRow].children).map(x => x.textContent.toLowerCase()).join("");
    }

    // změnit outline
    changeOutline(element, color) {
        element.classList.add(`${color}`);
    }

    // počet výskytů
    countOccurrences(str, char) {
        return str.split(char).length - 1;
    }

    // psaní do hry
    write(letter) {
        if (this.currentLetter < this.word.length && !this.gameEnd) {
            const letterElement = this.getCurrentLetter();
            this.animateElement(letterElement, "transform", "scale(80%)", "scale(100%)", 250);
            letterElement.textContent = letter;
            this.currentLetter++;
            const key = this.findKeyElement(letter.toLowerCase());
            this.animateElement(key, "transform", "scale(80%)", "scale(100%)", 250);
        }
    }

    // implementace backspace
    back() {
        this.animateElement(Game.backspace, "transform", "scale(80%)", "scale(100%)", 250);
        if (!this.gameEnd && this.currentLetter > 0) {
            this.currentLetter--;
            const letter = this.getCurrentLetter();
            letter.textContent = "";
        }
    }

    // implementace enteru (potvrzení)
    confirm() {
        this.animateElement(Game.enter, "transform", "scale(80%)", "scale(100%)", 250);
        if (!this.gameEnd) {
            const row = this.rows[this.currentRow];
            const guess = this.getCurrentGuess();

            const wrongColor = "wrong";
            const rightColor = "right";
            const displacementColor = "displacement";

            if (this.word.length === this.currentLetter && this.dictionary.includes(guess)) {
                this.processExactMatches(row, guess, rightColor);
                this.processInexactMatches(row, guess, displacementColor);
                this.processIncorrectLetters(row, guess, wrongColor);
                this.updateDuplicateLetters(row, guess);

                this.animateElement(row, "gap", "20px", "15px", 500);

                this.moveToNextRow(guess);
            } else {
                this.animateInvalidGuess(row, wrongColor);
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
                    key.processed = false;
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
        this.currentRow++;
        this.currentLetter = 0;
        if (this.word === guess || this.currentRow === Game.tries) {
            this.gameEnd = true;
        }
    }

    animateInvalidGuess(row, wrongColor) {
        for (let letter of row.children) {
            letter.classList.add(wrongColor);
            setTimeout(() => letter.classList.remove(wrongColor), 250);
        }
    }
}
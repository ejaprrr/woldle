// soubor (Object), který definuje systém a operace hry
class Game {
    // základní elementy a definice
    static tries = 6;
    static keyFilter = /[a-záčďéěíňóřšťúůýž]/g;

    // pro lehký přístup
    static container = document.getElementById("game");
    static keys = Array.from(document.getElementsByClassName("key"));
    static backspace = document.getElementById("backspace");
    static enter = document.getElementById("enter");

    // inicializace a interní definice
    constructor() {
        this.position = { row: 0, letter: 0 }; // pozice, na které se uživatel nachází
        this.end = false; // konec hry?
        this.rowElements = [];
        this.length = parseInt(localStorage.getItem("length")) || 5; // délka je v základu 5 pokud se nenajde preference uživatele
    }

    async init() {
        this.createGameEnvironment(); // vytvoření herních polí

        // načtení zdrojů
        await this.loadDictionary();
        await this.loadTargets();

        this.word = this.getSecret();

        // klikání na klávesnici
        Game.keys.forEach((key) => {
            key.onclick = () => {
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

        // async
        return this;
    }

    // restart hry popř. změna délky
    reset(length = this.length) {
        localStorage.setItem("length", length);
        this.length = length;

        this.position = { row: 0, letter: 0 };
        this.end = false;
        this.rowElements = [];

        Game.container.innerHTML = "";
        this.createGameEnvironment();

        Game.keys.forEach((key) => {
            key.classList.remove("incorrect", "inexact", "exact");
            delete key.processed;
        })

        this.word = this.getSecret();
    }

    // získání tajného slova
    getSecret() {
        const uniformTargets = Array.from(this.targets).filter((x) => x.length == this.length);
        const secret = uniformTargets[Math.floor(Math.random() * uniformTargets.length)];
        console.log(secret);
        return secret;
    }

    // loading slovníku
    async loadDictionary() {
        const response = await fetch("files/dictionary.json");
        this.dictionary = await response.json();
    }

    // loading cílů
    async loadTargets() {
        const response = await fetch("files/targets.json");
        this.targets = await response.json();
    }

    // vytvoření herního prostředí
    createGameEnvironment() {
        for (let y = 0; y < Game.tries; y++) { // osa y
            const rowElement = document.createElement("div");
            rowElement.classList.add("row");

            for (let x = 0; x < this.length; x++) { // osa x
                const letterElement = document.createElement("div");
                letterElement.classList.add("letter");

                rowElement.appendChild(letterElement);
            }

            Game.container.appendChild(rowElement);
            this.rowElements.push(rowElement);
        }
    }

    // animace 
    animatePress(element) {
        element.style.transform = "scale(80%)";
        setTimeout(() => element.style.transform = "scale(100%)", 250);
    }

    animateValidGuess(row) {
        Array.from(row.children).forEach((letter, index) => {
            setTimeout(() => letter.style.transform = "scale(120%)", index * 50);
            setTimeout(() => letter.style.transform = "scale(100%)", 250 + index * 50);
        })
    }

    animateInvalidGuess(row) {
        for (let letter of row.children) {
            letter.classList.add("incorrect");
            setTimeout(() => letter.classList.remove("incorrect"), 250);
        }
    }

    // momentální písmeno
    getCurrentLetter() {
        return this.rowElements[this.position.row].children[this.position.letter];
    }

    // najít klávesnicový ekvivalent písmena
    findKeyElement(target) {
        return Game.keys.find((key) => key.textContent === target);
    }

    // získat obsah momentální řádky
    getCurrentGuess() {
        return Array.from(this.rowElements[this.position.row].children).map((letter) => letter.textContent).join("");
    }

    // změnit outline
    changeOutline(element, placement) {
        element.classList.add(`${placement}`);
    }

    // počet výskytů
    countOccurrences(origin, target) {
        return origin.split(target).length - 1;
    }

    // psaní do hry
    write(letter) {
        if (!this.end && this.position.letter < this.length) {
            const letterElement = this.getCurrentLetter();
            const keyElement = this.findKeyElement(letter);

            letterElement.textContent = letter;
            this.position.letter++;

            this.animatePress(letterElement);
            this.animatePress(keyElement);
        }
    }

    // implementace backspace
    back() {
        this.animatePress(Game.backspace);
        if (!this.end && this.position.letter > 0) {
            this.position.letter--;

            const letter = this.getCurrentLetter();
            letter.textContent = "";
        }
    }

    // implementace enteru (potvrzení)
    confirm() {
        this.animatePress(Game.enter);

        if (!this.end) {
            const row = this.rowElements[this.position.row];
            const guess = this.getCurrentGuess();

            if (this.length === this.position.letter && this.dictionary.includes(guess)) {
                this.processExactMatches(row, guess);
                this.processInexactMatches(row, guess);
                this.processIncorrectLetters(row, guess);
                this.updateDuplicateLetters(row, guess);

                this.animateValidGuess(row);

                this.moveToNextRow(guess);
            } else {
                this.animateInvalidGuess(row);
            }
        }
    }
    processExactMatches(row, guess) {
        for (let i = 0; i < this.length; i++) {
            // v kontextu pozice
            const currentGuessLetter = guess[i];
            const currentTargetLetter = this.word[i];
            const currentLetterElement = row.children[i];
            const currentKeyElement = this.findKeyElement(currentGuessLetter);

            if (currentGuessLetter === currentTargetLetter) {
                this.changeOutline(currentLetterElement, "exact");
                if (!currentKeyElement.processed) this.changeOutline(currentKeyElement, "exact");

                currentKeyElement.processed = true;
                currentLetterElement.processed = true;
                currentLetterElement.isExact = true;
            }
        }
    }

    processInexactMatches(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentGuessLetter = guess[i];
            const currentLetterElement = row.children[i];
            const currentKeyElement = this.findKeyElement(currentGuessLetter);

            // pokud není již zpracovaný (není již zelený nebo žlutý) a je ve slově které hádáme
            if (!currentLetterElement.processed && this.word.includes(currentGuessLetter)) {
                // již zpracovaná stejná písmena
                const alreadyProcessedDuplicates = Array.from(row.children).filter((letter) => letter.processed && letter.textContent == currentGuessLetter);
                // pokud jich je méně než počet stejných písmen v hádance
                if (alreadyProcessedDuplicates.length < this.countOccurrences(this.word, currentGuessLetter)) {
                    this.changeOutline(currentLetterElement, "inexact");
                    if (!currentKeyElement.processed) this.changeOutline(currentKeyElement, "inexact");
                    currentLetterElement.isExact = false;
                }

                currentLetterElement.processed = true;
            };
        };
    }

    processIncorrectLetters(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentGuessLetter = guess[i];
            const currentLetterElement = row.children[i];
            const currentKeyElement = this.findKeyElement(currentGuessLetter);

            if (!currentLetterElement.processed) {
                this.changeOutline(currentLetterElement, "transparent");
                if (!currentKeyElement.processed) this.changeOutline(currentKeyElement, "incorrect");
                currentKeyElement.processed = true;
                currentLetterElement.isExact = false;
            }
        };
    }

    updateDuplicateLetters(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentLetterElement = row.children[i];

            let countInTarget = this.countOccurrences(this.word, currentLetterElement.textContent);
            const countInGuess = this.countOccurrences(guess, currentLetterElement.textContent);

            // pokud je počet 1 tak nemá smysl počítat duplikáty + eliminujeme písmena červená
            if (countInTarget > 1 && countInGuess > 1) {
                // pokud je na správný pozici, nepočítá se do finálního počtu, tedy se zahrnuje do rozdílu
                countInTarget -= currentLetterElement.isExact ? (countInGuess) : (countInGuess - 1);
            }
            // přidáme jen pokud finální index není 0 nebo 1 (nemá smysl)
            if (countInTarget > 1) this.addCountIndex(currentLetterElement, countInTarget);
        };
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
        this.position.row++;
        this.position.letter = 0;
        if (this.word === guess || this.position.row === Game.tries) {
            this.end = true;
            toggleWindow("open", this.word === guess ? "win" : "lose");
        }
    }
}
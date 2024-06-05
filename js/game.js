class Game {
    static tries = 6;
    static allowed = /[a-záčďéěíňóřšťúůýž]/g;
    static container = document.querySelector("#game");
    static keys = Array.from(document.querySelectorAll(".key"));
    static backspace = document.querySelector("#backspace");
    static enter = document.querySelector("#enter");

    constructor() {
        this.length = parseInt(localStorage.getItem("length")) || 5;
        this.mode = localStorage.getItem("mode") || "random";

        this.initGameSettings();
    }

    initGameSettings() {
        this.position = { row: 0, letter: 0 };
        this.ended = false;
        this.rows = [];
    }

    setModeTag() {
        document.querySelector("#mode-tag").textContent = this.mode
            .replace("daily", "slovo dne")
            .replace("random", "náhodné slovo")
            .replace("custom", "vlastní slovo");
    }

    async init() {
        await this.loadFile("dictionary");
        await this.loadFile("targets");

        this.setWord();
        this.createGameEnvironment();
        this.setupLengthOptions();
        this.setModeTag();

        return this;
    }

    async loadFile(file) {
        try {
            const response = await fetch(`files/${file}.json`);
            this[file] = await response.json();
        } catch (error) {
            console.error(`Failed to load ${file}:`, error)
        }
    }

    setWord() {
        const { searchParams } = new URL(location.href);
        const { random, daily } = this.getSecrets();

        if (searchParams.has("word")) {
            try {
                this.word = decodeURIComponent(atob(searchParams.get("word")));
                this.mode = this.word == daily ? "daily" : "custom";
                this.length = this.word.length;
            } catch (error) {
                console.error("Failed to decode the word search parameter:", error);
            }
        } else {
            this.word = this.mode === "daily" ? daily : random;
        }
    }

    createGameEnvironment() {
        for (let y = 0; y < Game.tries; y++) {
            const rowElement = document.createElement("div");
            rowElement.classList.add("row");

            for (let x = 0; x < this.length; x++) {
                const letterElement = document.createElement("div");
                letterElement.classList.add("letter");
                rowElement.appendChild(letterElement);
            }

            Game.container.appendChild(rowElement);
            this.rows.push(rowElement);
        }
    }

    setupLengthOptions() {
        const lengthSettings = document.querySelector("#length");
        const lengths = [...new Set(this.targets.map(target => target.length).sort((a, b) => a - b))];

        document.querySelector("#custom-word").maxLength = lengths[lengths.length - 1];
        document.querySelector("#custom-word").minLength = lengths[0];

        lengths.forEach(length => {
            const lengthOption = document.createElement("div");
            lengthOption.classList.add("length-option");
            lengthOption.textContent = length;

            if (length === this.length) {
                lengthOption.classList.add("selected-setting");
            }

            lengthOption.onclick = () => this.reset(length);
            lengthSettings.appendChild(lengthOption);
        });

        document.getElementById(this.mode).classList.add("selected-setting");
    }

    reset(length = this.length) {
        this.length = length;
        this.initGameSettings();

        if (this.mode !== "custom") localStorage.setItem("length", length);

        this.resetKeys();
        this.setWord();
        Game.container.replaceChildren();
        this.createGameEnvironment();
        this.changeSetting(document.getElementById("length"), this.length);
        document.getElementById("tags").replaceChildren(document.querySelector("#mode-tag"));
    }

    resetKeys() {
        Game.keys.forEach(key => {
            key.classList.remove("incorrect", "inexact", "exact");
            delete key.processed;
        });
    }

    getSecrets() {
        const time = new Date();
        const limit = time.getFullYear() + time.getMonth() + time.getDate();

        const uniformTargets = this.targets.filter(x => x.length === this.length);
        const random = uniformTargets[Math.floor(Math.random() * uniformTargets.length)];
        const daily = uniformTargets[limit % uniformTargets.length];

        return { random, daily };
    }

    setMode(mode) {
        this.mode = mode;
        if (this.mode !== "custom") localStorage.setItem("mode", mode);

        document.querySelector("#modes > .selected-setting").classList.remove("selected-setting");
        document.getElementById(this.mode).classList.add("selected-setting");

        this.setModeTag();
        this.reset();
    }

    changeSetting(parent, value) {
        parent.querySelector(".selected-setting").classList.remove("selected-setting");
        Array.from(parent.children).find(child => child.textContent == value).classList.add("selected-setting");
    }

    animatePress(element) {
        element.classList.toggle("smaller");
        setTimeout(() => element.classList.toggle("smaller"), 250);
    }

    animateValidGuess(row) {
        Array.from(row.children).forEach((letter, index) => {
            setTimeout(() => letter.classList.toggle("larger"), index * 50);
            setTimeout(() => letter.classList.toggle("larger"), 250 + index * 50);
        });
    }

    animateInvalidGuess(row) {
        Array.from(row.children).forEach(letter => {
            letter.classList.add("incorrect");
            setTimeout(() => letter.classList.remove("incorrect"), 250);
        });
    }

    getCurrentLetter() {
        return this.rows[this.position.row].children[this.position.letter];
    }

    findKeyElement(target) {
        return Game.keys.find(key => key.textContent === target);
    }

    getCurrentGuess() {
        return Array.from(this.rows[this.position.row].children).map(letter => letter.textContent).join("");
    }

    changeOutline(element, placement) {
        element.classList.add(placement);
    }

    countOccurrences(origin, target) {
        return origin.split(target).length - 1;
    }

    write(letter) {
        if (!this.ended && this.position.letter < this.length) {
            const currentLetter = this.getCurrentLetter();
            const pressedKey = this.findKeyElement(letter);

            currentLetter.textContent = letter;
            this.position.letter++;

            this.animatePress(currentLetter);
            this.animatePress(pressedKey);
        }
    }

    back() {
        if (!this.ended && this.position.letter > 0) {
            this.animatePress(Game.backspace);
            this.position.letter--;

            const currentLetter = this.getCurrentLetter();
            currentLetter.textContent = "";
        }
    }

    confirm() {
        if (!this.ended) {
            this.animatePress(Game.enter);
            const currentRow = this.rows[this.position.row];
            const currentGuess = this.getCurrentGuess();

            if (this.length === this.position.letter && this.dictionary.includes(currentGuess)) {
                this.processExactMatches(currentRow, currentGuess);
                this.processInexactMatches(currentRow, currentGuess);
                this.processIncorrectLetters(currentRow, currentGuess);
                this.updateDuplicateLetters(currentRow, currentGuess);

                this.animateValidGuess(currentRow);
                this.moveToNextRow(currentGuess);
            } else {
                this.animateInvalidGuess(currentRow);
            }
        }
    }

    processExactMatches(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentLetter = guess[i];
            const currentGameLetter = row.children[i];
            const currentKey = this.findKeyElement(currentLetter);

            if (currentLetter === this.word[i]) {
                this.changeOutline(currentGameLetter, "exact");
                if (!currentKey.processed) this.changeOutline(currentKey, "exact");

                currentKey.processed = true;
                currentGameLetter.processed = true;
                currentGameLetter.isExact = true;
            }
        }
    }

    processInexactMatches(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentLetter = guess[i];
            const currentGameLetter = row.children[i];
            const currentKey = this.findKeyElement(currentLetter);

            if (!currentGameLetter.processed && this.word.includes(currentLetter)) {
                const alreadyProcessedDuplicates = Array.from(row.children)
                    .filter(letter => letter.processed && letter.textContent === currentLetter);

                if (alreadyProcessedDuplicates.length < this.countOccurrences(this.word, currentLetter)) {
                    this.changeOutline(currentGameLetter, "inexact");
                    if (!currentKey.processed) this.changeOutline(currentKey, "inexact");
                    currentGameLetter.isExact = false;
                }
                currentGameLetter.processed = true;
            }
        }
    }

    processIncorrectLetters(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentGameLetter = row.children[i];
            const currentKey = this.findKeyElement(guess[i]);

            if (!currentGameLetter.processed) {
                this.changeOutline(currentGameLetter, "transparent");
                if (!currentKey.processed) this.changeOutline(currentKey, "incorrect");
                currentKey.processed = true;
                currentGameLetter.isExact = false;
            }
        }
    }

    updateDuplicateLetters(row, guess) {
        for (let i = 0; i < this.length; i++) {
            const currentGameLetter = row.children[i];
            let countInTarget = this.countOccurrences(this.word, currentGameLetter.textContent);
            const countInGuess = this.countOccurrences(guess, currentGameLetter.textContent);

            if (countInTarget > 1 && countInGuess > 1) {
                countInTarget -= currentGameLetter.isExact ? countInGuess : (countInGuess - 1);
            }

            if (countInTarget > 1) {
                const countIndex = document.createElement("div");
                countIndex.classList.add("index");
                countIndex.textContent = countInTarget;
                currentGameLetter.appendChild(countIndex);
            }
        }
    }

    endGame(state) {
        this.ended = true;
        toggleWindow("open", state);

        const information = document.createElement("div");
        information.textContent = state === "win" ? "výhra" : "prohra";
        Array.from(document.querySelectorAll(".slovo")).forEach(vis => vis.textContent = this.word);
        document.getElementById("tags").appendChild(information);
    }

    moveToNextRow(guess) {
        this.position.row++;
        this.position.letter = 0;

        if (this.position.row === Game.tries) {
            this.endGame("lose");
        } else if (this.word === guess) {
            this.endGame("win");
        }
    }

    surrender() {
        if (!this.ended) this.endGame("lose");
    }
}

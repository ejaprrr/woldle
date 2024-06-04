class Game {
    static tries = 6;
    static allowed = /[a-záčďéěíňóřšťúůýž]/g;

    static container = document.querySelector("#game");

    static keys = Array.from(document.querySelectorAll(".key"));
    static backspace = document.querySelector("#backspace");
    static enter = document.querySelector("#enter");

    constructor() {
        this.position = { row: 0, letter: 0 };
        this.ended = false;
        this.rows = [];
        
        this.length = parseInt(localStorage.getItem("length")) || 5;
        this.mode = localStorage.getItem("mode") || "random";

        this.update();
    }

    update() {
        document.querySelector("#mode-visual").textContent = this.mode
            .replace("daily", "slovo dne")
            .replace("random", "náhodné slovo")
            .replace("custom", "vlastní slovo");
    }

    async init() {
        await this.loadDictionary();
        await this.loadTargets();

        const urlParameters = new URL(location.href).searchParams;
        const { random, daily } = this.getSecrets();


        if (urlParameters.has("word")) {
            try {
                const decodedWord = decodeURIComponent(atob(urlParameters.get("word")));
                this.word = decodedWord;
                this.mode = decodedWord == daily ? "daily" : "custom";
            } catch {
                console.error("Failed to decode the word.");
            }
        } else if (this.mode == "random") {
            this.word = random;
        } else if (this.mode == "daily") {
            this.word = daily;
        }

        this.length = this.word.length;

        this.createGameEnvironment();
        
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

        const lengthOptions = document.querySelector("#length");
        const targetLengths = this.targets.map(target => target.length);

        const minLength = Math.min(...targetLengths);
        const maxLength = Math.max(...targetLengths);

        document.querySelector("#content-custom input").maxLength = maxLength;
        document.querySelector("#content-custom input").minLength = minLength;

        for (let length = minLength; length <= maxLength; length++) {
            const lengthOption = document.createElement("div");
            
            lengthOption.classList.add("length-option");
            lengthOption.textContent = length;
            
            if (length == this.length) lengthOption.classList.add("selected-setting");
            lengthOption.onclick = () => window.gameInstance.reset(length);

            lengthOptions.appendChild(lengthOption);
        }

        document.getElementById(this.mode).classList.add("selected-setting");

        return this;
    }

    async loadDictionary() {
        const response = await fetch("files/dictionary.json");
        this.dictionary = await response.json();
    }

    async loadTargets() {
        const response = await fetch("files/targets.json");
        this.targets = await response.json();
    }

    getSecrets() {
        const time = new Date();
        const limit = time.getFullYear() + time.getMonth() + time.getDate();

        const uniformTargets = Array.from(this.targets).filter((x) => x.length == this.length);

        const out = {
            random: uniformTargets[Math.floor(Math.random() * uniformTargets.length)], 
            daily: uniformTargets[limit % uniformTargets.length]
        };

        console.log(out);
        return out;
    }

    setMode(mode) {
        this.mode = mode;
        if (this.mode != "custom") localStorage.setItem("mode", mode);
        this.setSettingToId(document.getElementById("modes"), this.mode)
        
        this.update();
        this.reset();
    }

    setSettingToId(parent, idTarget) {
        parent.querySelector(".selected-setting").classList.remove("selected-setting");
        document.getElementById(idTarget).classList.add("selected-setting")
    }

    setSetting(parent, value) {
        parent.querySelector(".selected-setting").classList.remove("selected-setting");
        Array.from(parent.children).find((child) => child.textContent == value).classList.add("selected-setting");
    }

    // restart hry popř. změna délky
    reset(length = this.length) {
        this.length = length;
        if (this.mode != "custom") localStorage.setItem("length", length);

        this.setSetting(document.getElementById("length"), parseInt(this.length));

        this.position = { row: 0, letter: 0 };
        this.ended = false;
        this.rows = [];

        Array.from(document.querySelectorAll("#tags > div:not(#mode-visual)")).forEach((tag) => tag.remove());
        Game.container.replaceChildren();

        Game.keys.forEach((key) => {
            key.classList.remove("incorrect", "inexact", "exact");
            delete key.processed;
        })

        const { random, daily } = this.getSecrets();

        if (this.mode == "random") {
            this.word = random;
        } else if (this.mode == "daily") {
            this.word = daily;
        } else if (this.mode == "custom") {
            this.word = document.querySelector("#custom-word").value;
        }

        this.length = this.word.length;
        this.setSetting(document.querySelector("#length"), this.length);
        this.createGameEnvironment();
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
            this.rows.push(rowElement);
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
        return this.rows[this.position.row].children[this.position.letter];
    }

    // najít klávesnicový ekvivalent písmena
    findKeyElement(target) {
        return Game.keys.find((key) => key.textContent === target);
    }

    // získat obsah momentální řádky
    getCurrentGuess() {
        return Array.from(this.rows[this.position.row].children).map((letter) => letter.textContent).join("");
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
        if (!this.ended && this.position.letter < this.length) {
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
        if (!this.ended && this.position.letter > 0) {
            this.animatePress(Game.backspace);
            
            this.position.letter--;

            const letter = this.getCurrentLetter();
            letter.textContent = "";
        }
    }

    // implementace enteru (potvrzení)
    confirm() {
        if (!this.ended) {
            this.animatePress(Game.enter);

            const row = this.rows[this.position.row];
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
            if (countInTarget > 1)  {
                const countIndex = document.createElement("div");
                countIndex.classList.add("index");
                countIndex.textContent = countInTarget;
                currentLetterElement.appendChild(countIndex);
            };
        };
    }

    endGame(state) {
        this.ended = true;
        toggleWindow("open", state);
        const information = document.createElement("div");
        information.textContent = state == "win" ? "výhra" : "prohra";
        Array.from(document.querySelectorAll(".slovo")).forEach((vis) => vis.textContent = this.word);
        document.getElementById("tags").appendChild(information);
    }

    moveToNextRow(guess) {
        this.position.row++;
        this.position.letter = 0;

        if (this.position.row === Game.tries) {
            this.endGame("lose")
        } else if (this.word === guess) {
            this.endGame("win");
        }
    }

    surrender() {
        if (!this.ended) {
            this.ended = true;
            this.endGame("lose");
        }
    }
}
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
        this.mode = localStorage.getItem("mode") || "random";
        this.surrendered = false;
        document.getElementById(this.mode).classList.add("selected-setting");
    }

    setMode(mode) {
        if (mode != "custom") localStorage.setItem("mode", mode);
        document.getElementById(this.mode).classList.remove("selected-setting");
        this.mode = mode;
        document.getElementById("mode-visual").textContent = this.mode.replace("daily", "slovo dne").replace("random", "náhodné slovo").replace("custom", "vlastní slovo");
        document.getElementById(this.mode).classList.add("selected-setting");
        this.reset();
    }

    async init() {
        // načtení zdrojů
        await this.loadDictionary();
        await this.loadTargets();

        switch (this.mode) {
            case "random":
                this.word = this.getSecret();
                break;
            case "daily":
                this.word = this.getSecret(this.hash(document.getElementById("time").textContent + this.hash(document.getElementById("year").textContent)));
                break;
            case "custom":
                this.word = this.getSecret(null, document.querySelector("#content-custom form > input").value);
                break;
        }

        const url = new URL(location.href);
        if (url.searchParams.has("word")) {
            let decodedWord;
            try {
                decodedWord = decodeURIComponent(escape(window.atob(url.searchParams.get("word"))));
            } catch {
                ;
            }
            if (decodedWord) {
                console.log(decodedWord);
                this.mode = "custom";
                this.word = decodedWord;
                this.length = this.word.length;
                if (decodedWord == this.getSecret(this.hash(document.getElementById("time").textContent + this.hash(document.getElementById("year").textContent)))) {
                    this.mode = "daily";
                }
            }
        }
        this.createGameEnvironment();
        document.getElementById("mode-visual").textContent = this.mode.replace("daily", "slovo dne").replace("random", "náhodné slovo").replace("custom", "vlastní slovo");

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

        const lengthOptions = document.getElementById("length");
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


        // async
        return this;
    }

    hash(string) {
        let hash = 0;
        
        if (string.length == 0) return hash;
    
        for (let i = 0; i < string.length; i++) {
            let char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
    
        return hash;
    }

    // restart hry popř. změna délky
    reset(length = this.length) {
        if (this.mode != "custom") localStorage.setItem("length", length);
        Array.from(document.getElementsByClassName("length-option")).filter((lengthOption) => parseInt(lengthOption.textContent) == this.length)[0].classList.remove("selected-setting");
        this.length = length;
        Array.from(document.getElementsByClassName("length-option")).filter((lengthOption) => parseInt(lengthOption.textContent) == this.length)[0].classList.add("selected-setting");
        this.position = { row: 0, letter: 0 };
        this.end = false;
        this.rowElements = [];
        Array.from(document.querySelectorAll("#tags > div:not(#mode-visual)")).forEach((tag) => tag.remove());
        this.surrendered = false;
        Game.container.innerHTML = "";

        Game.keys.forEach((key) => {
            key.classList.remove("incorrect", "inexact", "exact");
            delete key.processed;
        })

        switch (this.mode) {
            case "random":
                this.word = this.getSecret();
                break;
            case "daily":
                this.word = this.getSecret(this.hash(document.getElementById("time").textContent + this.hash(document.getElementById("year").textContent)));
                break;
        }

        this.createGameEnvironment();
    }

    // získání tajného slova
    getSecret(seed = null, custom = null) {
        let secret;

        if (custom != null) {
            this.length = custom.length;
            secret = custom;
        } else {
            const uniformTargets = Array.from(this.targets).filter((x) => x.length == this.length);
            secret = uniformTargets[Math.floor((seed != null ? mulberry32(seed) : Math.random()) * uniformTargets.length)];
        }
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
        if (!this.end && this.position.letter > 0) {
            this.animatePress(Game.backspace);
            
            this.position.letter--;

            const letter = this.getCurrentLetter();
            letter.textContent = "";
        }
    }

    // implementace enteru (potvrzení)
    confirm() {
        if (!this.end) {
            this.animatePress(Game.enter);

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

    surrender() {
        if (!this.end) {
            this.endGame("lose");
        }
    }

    endGame(state) {
        this.end = true;
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
            this.lost = true;
            this.endGame("lose")
        } else if (this.word === guess) {
            this.lost = false;
            this.endGame("win");
        }

    }
}
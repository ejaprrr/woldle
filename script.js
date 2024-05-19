// k pracování s barvy
const root = getComputedStyle(document.body);

// funkce s oknem nastavení, otevření a zavření
function settingsWindow(func) {
    // získávání potřebných elementů
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");

    // na základě operace (otevření, zavření) provedeme úpravy stylu
    switch (func) {
        case "open": // otevření
            windowWrapper.classList.add("show"); // animace zobrazení .show
        
            window.style.backgroundColor = root.getPropertyValue('--secondary'); // získání primární barvy pro pozadí a zobrazení kontentu
            window.style.contentVisibility = "visible";
            break;
        case "close": // zavření
            windowWrapper.classList.remove("show"); // odebrat animaci zobrazení .show

            window.style.backgroundColor = "transparent"; // zneviditelnění pozadí a kontentu
            window.style.contentVisibility = "hidden";
            break;
    };
};

// hra
class Game {
    static wrapper = document.getElementById("game");
    static tries = 6;

    constructor (secret) { // inicializace
        // získání pracovního prostředí (#main) a definování základních pojmů

        this.word = secret;

        this.row = 0;
        this.letter = 0;
        this.end = false;

        this.rows = [];

        // načíst slovník, kde se nachází slova, která jsou validní -> this.dictionary
        this.#fetchDictionary();

        // vytvoření herního prostředí
        this.#createEnvironment();
        
    };

    async #fetchDictionary() {
        const dictionary = await fetch("files/dictionary.json");
        this.dictionary = await dictionary.json();
    }

    #createEnvironment() {
        for (let y = 0; y < Game.tries; y++) { // osa y (řádky)
            const row = document.createElement("div");
            row.classList.add("row"); // .row

            for (let x = 0; x < this.word.length; x++) { // osa x (písmena)
                const letter = document.createElement("div");
                letter.classList.add("letter"); // .letter

                row.appendChild(letter);
            };

            Game.wrapper.appendChild(row);
            this.rows.push(row);
        };
    };


    // zápis písmene do hry
    write(letter) {
        if (this.letter < this.word.length && !this.end) { // psát je možné jen pokud uživatel doposud nedosáhl poslední pozice (délky slova) a samozřejmě pokud neskončila hra
            const row = this.rows[this.row]; // současná řada
            const letterElement = row.children[this.letter]; // současné písmeno

            // animace zadávání písmen
            letterElement.style.transform = "scale(80%)";
            setTimeout(() => {
                letterElement.style.transform = "scale(100%)";
            }, 250);

            letterElement.textContent = letter;
            this.letter++;
        };

        const keys = document.getElementsByClassName("key"); // všechna písmena na klávesnici
        const letterKeyboard = Array.from(keys).find((x) => x.textContent == letter); // zmáčklé písmeno

        // animace zadávání písmen
        letterKeyboard.style.transform = "scale(80%)";
        setTimeout(() => {
            letterKeyboard.style.transform = "scale(100%)";
        }, 250);
    };

    // odebrání písmene ze hry
    back() {
        const backspace = document.getElementById("backspace"); // backspace klávesnice

        backspace.style.transform = "scale(80%)";
        setTimeout(() => {
            backspace.style.transform = "scale(100%)";
        }, 250);

        if (!this.end && this.letter > 0) {  // nelze mazat písmena z již potvrzené řádky
            const row = this.rows[this.row];

            this.letter--; // nastavení současné pozice na předchozí
            row.children[this.letter].textContent = "";
        };
    };

    // potvrzení řady
    
    confirm() {
        const enter = document.getElementById("enter");
        enter.style.transform = "scale(80%)";
        setTimeout(() => {
            enter.style.transform = "scale(100%)";
        }, 250);

        if (!this.end) {
            const keys = document.getElementsByClassName("key");
            const row = this.rows[this.row];
            const word = Array.from(row.children).map(x => x.textContent.toLowerCase()).join("");

            const red = root.getPropertyValue('--wrong');
            const green = root.getPropertyValue('--right');
            const orange = root.getPropertyValue('--displacement');
            const blue = root.getPropertyValue('--secondary');

            if (this.word.length == this.letter && this.dictionary.includes(word)) {
                // Step 1: Process exact matches
                for (let i = 0; i < word.length; i++) {
                    if (word[i] == this.word[i]) {
                        row.children[i].style.outline = `solid ${green}`;
                        const letterKeyboard = Array.from(keys).find(x => x.textContent.toLowerCase() == word[i]);
                        if (letterKeyboard) letterKeyboard.style.outline = `solid ${green}`;
                        
                        const count = this.word.split(word[i]).length - 1;
                        if (count > 1 && this.#remainingDuplicates(word[i], word, this.word)) {
                            const countE = document.createElement("div");
                            countE.classList.add("index");
                            countE.textContent = this.word.split(word[i]).length - word.split(word[i]).length + 1;
                            row.children[i].appendChild(countE);
                        }
                        
                        row.children[i].processed = true;
                    };
                };

                // Step 2: Process inexact matches
                for (let i = 0; i < word.length; i++) {
                    if (!row.children[i].processed && this.word.includes(word[i])) {
                        console.log(word[i])
                        const letterKeyboard = Array.from(keys).find(x => x.textContent.toLowerCase() == word[i]);
                        const remainingInTarget = this.word.split('').filter((letter, idx) => letter == word[i] && !row.children[idx].processed).length;
                        const remainingInGuess = word.split('').filter((letter, idx) => letter == word[i] && !row.children[idx].processed).length;
                        console.log(remainingInGuess, remainingInTarget);
                        if (remainingInTarget >= 0 && remainingInGuess >= 0) {
                            // Highlight the letter only if it's the first remaining occurrence in the guessed word
                            const firstRemainingIndex = word.indexOf(word[i]);
                            if (i === firstRemainingIndex || word.split(word[i]).length - 1 <= this.word.split(word[i]).length - 1) {
                                row.children[i].style.outline = `solid ${orange}`;
                                if (letterKeyboard) letterKeyboard.style.outline = `solid ${orange}`;
                            }
                            row.children[i].processed = true;
                        }

                        const count = this.word.split(word[i]).length - 1;
                        if (count > 1 && this.#remainingDuplicates(word[i], word, this.word)) {
                            const countE = document.createElement("div");
                            countE.classList.add("index");
                            countE.textContent = this.word.split(word[i]).length - word.split(word[i]).length + 1;
                            row.children[i].appendChild(countE);
                        }
                        
                        row.children[i].processed = true;
                    }
                }
                

                // Step 3: Process incorrect letters
                for (let letter of row.children) {
                    if (!letter.processed) {
                        const letterKeyboard = Array.from(keys).find(x => x.textContent == letter.textContent);
                        letter.style.outline = "none";
                        if (letterKeyboard) letterKeyboard.style.outline = `solid ${red}`;
                    };
                };

                // Animate row confirmation
                row.style.gap = "20px";
                setTimeout(() => {
                    row.style.gap = "15px";
                }, 500);

                // Move to next row
                this.row++;
                this.letter = 0;

                if (this.word == word || this.row == Game.tries) {
                    this.end = true;
                }
            } else {
                for (let letter of row.children) {
                    letter.style.outline = `solid ${red}`;
                    setTimeout(() => {
                        letter.style.outline = `solid ${blue}`;
                    }, 250);
                }
            }
        }
    }

    #remainingDuplicates(letter, guessWord, targetWord) {
        const correctCount = targetWord.split('').filter((char, idx) => char === letter && guessWord[idx] === letter).length;
        const totalCount = targetWord.split(letter).length - 1;
        return totalCount > correctCount;
    }
};

let game;

// zajištění toho, že se kód spustí po loadingu a parsingu HTML
document.addEventListener("DOMContentLoaded", async () => {
    const targets = await fetch("files/targets.json");
    let words = await targets.json();
    words = Array.from(words).filter((x) => x.length == 11);
    console.log(words);
    let secret = words[Math.floor(Math.random() * words.length)];
    secret = "olše";
    console.log(secret);
    game = new Game(secret);
    console.log(secret);
});

// na stisknutí tlačítka
document.addEventListener("keydown", (event) => {
    // filtr pro českou klávesnici (proti použití jiných znaků, ale také kláves např. F12, CTRL)
    const czech = /[AÁBCČDĎEÉĚFGHIIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYZÝZŽ]/g;
    const key = event.key.toUpperCase();

    switch (key) {
        case "BACKSPACE":
            game.back();
            break;

        case "ENTER":
            game.confirm();
            break;

        default:
            if (key.length == 1 && key.match(czech)) { // jen pro písmena (délka 1, tím se vyvarujeme například TAB) a filtr české klávesnice
                game.write(key);
            };
            break;
    };
});

document.getElementById("settings").addEventListener("click", () => settingsWindow("open")); // otevření okna na kliknutí
document.getElementById("close").addEventListener("click", () => settingsWindow("close")); // zavření okna na kliknutí
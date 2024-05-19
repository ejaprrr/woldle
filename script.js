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
    static keys = document.getElementsByClassName("key");

    static backspace = document.getElementById("backspace");
    static enter = document.getElementById("enter");

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

    #animateElement(element, property, value, target, duration) {
        element.style[property] = value;
        setTimeout(() => element.style[property] = target, duration);
    };

    #getCurrentLeter(position = this.letter) {
        const currentRow = this.rows[this.row];
        return currentRow.children[position];
    };

    #findKey(key) {
        return Array.from(Game.keys).find((x) => x.textContent.toLowerCase() == key);
    };

    #getCurrentGuess() {
        const row = this.rows[this.row];

        return Array.from(row.children).map((x) => x.textContent.toLowerCase()).join("");
    };

    #getProperty(name) {
        return root.getPropertyValue(`--${name}`);
    };

    #changeOutline(element, color) {
        element.style.outline = `solid ${color}`;
    };

    #count(x, y) {
        return x.split(y).length - 1;
    };

    // zápis písmene do hry
    write(letter) {
        if (this.letter < this.word.length && !this.end) { // psát je možné jen pokud uživatel doposud nedosáhl poslední pozice (délky slova) a samozřejmě pokud neskončila hra
            const letterElement = this.#getCurrentLeter(); // současné písmeno
            this.#animateElement(letterElement, "transform", "scale(80%)", "scale(100%)", 250); // animace zadávání písmen
            
            letterElement.textContent = letter;
            this.letter++;
        };
        const key = this.#findKey(letter.toLowerCase());

        this.#animateElement(key, "transform", "scale(80%)", "scale(100%)", 250); // animace zadávání písmen
    };

    // odebrání písmene ze hry
    back() {
        this.#animateElement(Game.backspace, "transform", "scale(80%)", "scale(100%)", 250);

        if (!this.end && this.letter > 0) {  // nelze mazat písmena z již potvrzené řádky
            this.letter--; // nastavení současné pozice na předchozí

            const letter = this.#getCurrentLeter();
            letter.textContent = "";
        };
    };

    // potvrzení řady
    confirm() {
        this.#animateElement(Game.enter, "transform", "scale(80%)", "scale(100%)", 250);

        if (!this.end) {
            const row = this.rows[this.row];
            const guess = this.#getCurrentGuess();

            const wrong = this.#getProperty("wrong");
            const right = this.#getProperty("right");
            const displacement = this.#getProperty("displacement");
            const secondary = this.#getProperty("secondary");

            if (this.word.length == this.letter && this.dictionary.includes(guess)) {
                // Step 1: Process exact matches
                for (let i = 0; i < this.word.length; i++) {
                    const currentGuess = guess[i];
                    const currentTarget = this.word[i];
                    const current = row.children[i];

                    const key = this.#findKey(currentGuess);
    
                    if (currentGuess == currentTarget) {
                        this.#changeOutline(current, right);
                        this.#changeOutline(key, right);

                        current.processed = true;
                        current.exact = true;
                    };
                };

                // Step 2: Process inexact matches
                for (let i = 0; i < this.word.length; i++) {
                    const currentGuess = guess[i];
                    const current = row.children[i];

                    const key = this.#findKey(currentGuess);

                    if (!current.processed && this.word.includes(currentGuess)) {
                        const remainingInTarget = this.#count(this.word, currentGuess);
                        const remainingInGuess = this.#count(guess, currentGuess);

                        if (remainingInGuess <= remainingInTarget) {
                            this.#changeOutline(current, displacement);
                            this.#changeOutline(key, displacement);

                            current.exact = false;
                        } else {
                            current.exact = null;
                        };

                        current.processed = true;
                    };
                };

                // Step 3: Process incorrect letters
                for (let letter of row.children) {
                    if (!letter.processed) {
                        const key = this.#findKey(letter.textContent.toLowerCase());
                        this.#changeOutline(letter, "transparent");
                        this.#changeOutline(key, wrong);
                        letter.exact = null;
                    };
                };

                // N - remaining letter duplicates to guess
                for (let letter of row.children) {
                    let countTarget = this.#count(this.word, letter.textContent.toLowerCase());
                    const inTarget = this.#count(this.word, letter.textContent.toLowerCase());
                    const inGuess = this.#count(guess, letter.textContent.toLowerCase());
                    if (countTarget > 1 && !letter.exact && inTarget != inGuess) {
                        console.log(inTarget, inGuess);
                        countTarget -= inGuess - 1
                        countTarget -= Array.from(row.children).filter((x) => x.exact && x.textContent == letter.textContent).length;
                        const countIndex = document.createElement("div");
                        countIndex.classList.add("index");
                        countIndex.textContent = countTarget;
                        letter.appendChild(countIndex);
                    } else if (countTarget > 1 && letter.exact && inTarget != inGuess) {
                        const well = Array.from(row.children).filter((x) => !x.exact && x.textContent == letter.textContent).length;
                        if (well > 0) {
                            countTarget -= inGuess - 1
                            countTarget -= Array.from(row.children).filter((x) => x.exact && x.textContent == letter.textContent).length;
                        }
                        const countIndex = document.createElement("div");
                        countIndex.classList.add("index");
                        countIndex.textContent = countTarget;
                        letter.appendChild(countIndex);
                    };
                };

                // Animate row confirmation
                this.#animateElement(row, "gap", "20px", "15px", 500);

                // Move to next row
                this.row++;
                this.letter = 0;

                if (this.word == guess || this.row == Game.tries) {
                    this.end = true;
                };
            } else {
                for (let letter of row.children) {
                    this.#animateElement(letter, "outline", `solid ${wrong}`, `solid ${secondary}`, 250);
                };
            };
        };
    };
};

let game;

// zajištění toho, že se kód spustí po loadingu a parsingu HTML
document.addEventListener("DOMContentLoaded", async () => {
    const targets = await fetch("files/targets.json");
    let words = await targets.json();
    words = Array.from(words).filter((x) => x.length == 11);
    console.log(words);
    let secret = words[Math.floor(Math.random() * words.length)];
    secret = "koordinátor";
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
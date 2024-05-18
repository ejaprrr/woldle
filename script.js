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
    static wrapper = document.getElementById("main");
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

    };

    // odebrání písmene ze hry
    back() {
        if (!this.end && this.letter > 0) {  // nelze mazat písmena z již potvrzené řádky
            const row = this.rows[this.row];

            this.letter--; // nastavení současné pozice na předchozí
            row.children[this.letter].textContent = "";
        };
    };

    // potvrzení řady
    confirm() {
        if (!this.end) {
            const row = this.rows[this.row];
            const word = Array.from(row.children).map(x => x.textContent.toLowerCase()).join(""); // slovo zadané (písmena složena dohromady)

            // barvy
            const red = root.getPropertyValue('--wrong');
            const green = root.getPropertyValue('--right');
            const orange = root.getPropertyValue('--displacement');
            const blue = root.getPropertyValue('--secondary');
            
            if (this.word.length == this.letter && this.dictionary.includes(word)) { // lze validovat pouze pokud je uživatel na konci řádky a zároveň je slovo validní (obsahuje ho slovník)
                for (let i = 0; i < word.length; i++) { // index pro obě slova pro porovnávání
                    if (word[i] == this.word[i]) { // pokud se shodují indexy a písmena, jde o shodu
                        row.children[i].style.outline = `solid ${green}`;
                    } else if (this.word.includes(word[i])) { // pokud slovo obsahuje stejné písmeno, označí se první co najde (z důvodu duplikátů)
                        Array.from(row.children).find((x) => x.textContent.toLowerCase() == word[i]).style.outline = `solid ${orange}`;
                    };
                };

                // animace potvrzení
                row.style.gap = "20px";
                setTimeout(() => {
                    row.style.gap = "15px";
                }, 500);

                // přejetí na další řádku
                this.row++;
                this.letter = 0;
            } else { // pokud není input validní
                for (let letter of row.children) {
                    // spustí se animace červeného zvýraznění
                    letter.style.outline = `solid ${red}`;
                    setTimeout(() => {
                        letter.style.outline = `solid ${blue}`;
                    }, 250);
                }
            };

            // pokud se slovo shoduje, končí tím hra, to samé platí pro poslední pokus
            if (this.word == word || this.row == Game.tries) {
                this.end = true;
            }
        };
    };
};

let game;

// zajištění toho, že se kód spustí po loadingu a parsingu HTML
document.addEventListener("DOMContentLoaded", async () => {
    const targets = await fetch("files/targets.json");
    const words = await targets.json();
    const secret = words[Math.floor(Math.random() * words.length)];
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
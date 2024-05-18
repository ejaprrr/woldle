function settingsWindow(func) {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");

    const backgroundColor = getComputedStyle(document.body).getPropertyValue('--dark');

    switch (func) {
        case "open":
            windowWrapper.classList.add("show");
            window.style.backgroundColor = backgroundColor;
            window.style.contentVisibility = "visible";
            break;
        case "close":
            windowWrapper.classList.remove("show");
            window.style.backgroundColor = "transparent";
            window.style.contentVisibility = "hidden";
            break;
    };
};

class Game {
    constructor (secret) {
        this.wrapper = document.getElementById("main");
        this.tries = 6;
        this.length = secret.length;
        this.row = 0;
        this.letter = 0;
        this.word = secret;
        this.end = false;

        fetch("files/dictionary.json")
        .then(response => response.json())
        .then(content => {
            this.dictionary = content;
        });

        for (let y = 0; y < this.tries; y++) {
            const row = document.createElement("div");
            row.classList.add("row");

            for (let x = 0; x < this.length; x++) {
                const letter = document.createElement("div");

                letter.classList.add("letter");
                row.appendChild(letter);
            }

            this.wrapper.appendChild(row);
        };
    };

    write(letter) {
        const row = this.wrapper.getElementsByClassName("row")[this.row];
        const ltr = row.getElementsByClassName("letter")[this.letter];

        if (this.letter < this.length) {
            ltr.textContent = letter;
            this.letter++;
        };

    };

    back() {
        if (!this.end) {
            if (this.letter > 0) {
                this.letter--;
            } else {
                return; // No letters to erase
            }
    
            const row = this.wrapper.getElementsByClassName("row")[this.row];
            const ltr = row.getElementsByClassName("letter")[this.letter];
            ltr.textContent = '';
        }
    };

    confirm() {
        if (this.letter == this.length) {
            const row = this.wrapper.getElementsByClassName("row")[this.row];
            let word = "";
            const letters = row.getElementsByClassName("letter");
            for (let ltr of letters) {
                let char = ltr.textContent.toLowerCase();
                word += char;
            }

            const red = getComputedStyle(document.body).getPropertyValue('--red');
            const green = getComputedStyle(document.body).getPropertyValue('--green');
            const orange = getComputedStyle(document.body).getPropertyValue('--orange');
            const blue = getComputedStyle(document.body).getPropertyValue('--darkblue');
            if (this.word == word) {
                for (let ltr of row.getElementsByClassName("letter")) {
                    ltr.style.outline = `solid ${green}`;
                }
                this.end = true;
            } else if (this.dictionary.includes(word)) {
                for (let i = 0; i < this.word.length; i++) {
                    console.log(i);
                    if (this.word[i] == word[i]) {
                        letters[i].style.outline = `solid ${green}`;
                    } else if (this.word.includes(word[i]))  {
                        letters[i].style.outline = `solid ${orange}`;
                    } else {
                        letters[i].style.outline = `none`;
                    }
                } /*need to fix duplicates! letters */
                this.row++;
                this.letter = 0;
            } else {
                for (let ltr of row.getElementsByClassName("letter")) {
                    ltr.style.outline = `solid ${red}`;
                }
                setTimeout(() => {
                    // Remove fade-out class after animation
                    for (let ltr of row.getElementsByClassName("letter")) {
                        ltr.style.outline = `solid ${blue}`;
                    }
                }, 1000); // 1000ms = 1 second
            }
        }

    }
};

let game;

fetch("files/targets.json")
.then(response => response.json())
.then(content => {
    content = content.filter((x) => x.length == 5)
    const index = Math.floor(Math.random() * content.length);
    console.log(content[index])
    let word = content[index];
    game = new Game(word);
});

document.getElementById("settings").addEventListener("click", () => settingsWindow("open"));
document.getElementById("close").addEventListener("click", () => settingsWindow("close"));
document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();
    console.log(key);
    switch (key) {
        case "BACKSPACE":
            console.log("b");
            game.back();
            break;
        case "ENTER":
            game.confirm();
            break;
        default:
            if (key.length == 1 && key.match(/[AÁBCČDĎEÉĚFGHIIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYZÝZŽ]/g)) {
                game.write(key);
                break;
            };
    };
});
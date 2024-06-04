const Mode = Object.freeze({
    RANDOM: Symbol("random"),
    DAILY: Symbol("daily"),
    CUSTOM: Symbol("custom")
});

class Game {
    static tries = 6;
    static allowed = /[a-záčďéěíňóřšťúůýž]/g;

    static container = document.querySelector("#game");

    static keys = Array.from(document.querySelectorAll(".key"));
    static backspace = document.querySelector("#backspace");
    static enter = document.querySelector("#enter");

    constructor(secret) {
        this.position = {row: 0, letter: 0};
        this.letters = [];
        this.secret = secret;
        this.ended = false;
        this.mode = JSON.parse(localStorage.getItem("mode")) || Mode.RANDOM;

        this.dictionary = JSON.parse(sessionStorage.getItem("dictionary"));

        for (let y = 0; y < Game.tries; y++) {
            let row = document.createElement("div");
            row.classList.add("row");

            for (let x = 0; x < this.secret.length; x++) {
                let letter = document.createElement("div");
                letter.classList.add("letter");

                row.appendChild(letter);
                this.letters.push(letter);
            }

            Game.container.appendChild(row);
        }
    }
}
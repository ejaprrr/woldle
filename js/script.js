// Utility function to get the root style property value
function getRootStyleProperty(property) {
    return getComputedStyle(document.body).getPropertyValue(`--${property}`);
}

function changeRootStyleProperty(property, value) {
    getComputedStyle(document.body).setProperty(`--${property}`, value);
}

let windowState = "";

async function playSound(sound) {
    for (let i = 0; i < (Math.random() + 1) * 5; i++) {
        await setTimeout(() => { new Audio(sound).play() }, Math.random() * 2000);
    }
}

// Function to show or hide the settings window
async function toggleWindow(action, content) {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");

    if (action === "open") {
        windowState = content;
        const main = document.getElementById(`window-${windowState}`);
        windowWrapper.classList.add("show");
        window.classList.add("show");
        main.classList.add("show");

        if (windowState === "win") {
            await playSound("files/yippie.mp3");
        }
    } else if (action === "close") {
        const main = document.getElementById(`window-${windowState}`);
        windowWrapper.classList.remove("show");
        window.classList.remove("show");
        main.classList.remove("show");
    };
    console.log(windowState);
};

function changeTheme(theme) {
    switch (theme) {
        case "dark-blue":
            document.body.classList = {};
            document.body.classList.add("dark");
            break;
        case "light-blue":
            document.body.classList = {};
            document.body.classList.add("light");
            break;
    };
};

let game;

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("files/targets.json");
    const words = await response.json();
    const lengths = words.map((x) => x.length);
    const lengthSelection = document.getElementById("length");

    for (let lengthNum = Math.min(...lengths); lengthNum <= Math.max(...lengths); lengthNum++) {
        const lengthOption = document.createElement("div");
        lengthOption.classList.add("number");
        lengthOption.textContent = lengthNum;

        lengthOption.onclick = () => {
            const length = parseInt(lengthOption.textContent);
            game.changeLength(length);
        };
        
        lengthSelection.appendChild(lengthOption);
    };

    game = new Game();
});

document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();

    switch (key) {
        case "BACKSPACE":
            game.back();
            break;
        
        case "ENTER":
            game.confirm();
            break;
    };
});

document.addEventListener("keypress", (event) => {
    const key = event.key;

    if (key.length === 1 && key.toUpperCase().match(Game.keysRegex)) {
        game.write(key);
    };
});

document.getElementById("refresh").addEventListener("click", () => game.changeLength(game.length));
document.getElementById("settings").addEventListener("click", () => toggleWindow("open", "settings"));
document.getElementById("close").addEventListener("click", () => toggleWindow("close", windowState));

function date() {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    
    const today = day + ". " + months[month];
    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = today;
};

date();
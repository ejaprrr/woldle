// Utility function to get the root style property value
function getRootStyleProperty(property) {
    return getComputedStyle(document.body).getPropertyValue(`--${property}`);
}

function changeRootStyleProperty(property, value) {
    getComputedStyle(document.body).setProperty(`--${property}`, value);
}

// Function to show or hide the settings window
function toggleSettingsWindow(action) {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");

    if (action === "open") {
        window.style.pointerEvents = "all";
        windowWrapper.classList.add("show");
        window.classList.add("show");
        window.style.contentVisibility = "visible";
    } else if (action === "close") {
        window.style.pointerEvents = "none";
        windowWrapper.classList.remove("show");
        window.classList.remove("show");
        window.style.contentVisibility = "hidden";
    };
};

function changeTheme(theme) {
    switch (theme) {
        case "dark-blue":
            document.body.classList = {};
            document.body.classList.add("dark", "dark-blue");
            break;
        case "dark-yellow":
            document.body.classList = {};
            document.body.classList.add("dark", "dark-yellow");
            break;
        case "light-blue":
            document.body.classList = {};
            document.body.classList.add("light", "light-blue");
            break;
        case "light-yellow":
            document.body.classList = {};
            document.body.classList.add("light", "light-yellow");
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

document.getElementById("settings").addEventListener("click", () => toggleSettingsWindow("open"));
document.getElementById("close").addEventListener("click", () => toggleSettingsWindow("close"));

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
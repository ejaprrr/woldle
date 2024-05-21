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
        windowWrapper.classList.add("show");
        window.style.backgroundColor = getRootStyleProperty('secondary');
        window.style.contentVisibility = "visible";
    } else if (action === "close") {
        windowWrapper.classList.remove("show");
        window.style.backgroundColor = "transparent";
        window.style.contentVisibility = "hidden";
    }
}

let game;

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("files/targets.json");
    let words = await response.json();
    words = words.filter(word => word.length === 4);
    let secret = words[Math.floor(Math.random() * words.length)];
    secret = "koordinátor";
    game = new Game(secret);
    console.log(secret);
});

document.addEventListener("keydown", (event) => {
    const czechLetters = /[AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYZÝZŽ]/g;
    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
        game.back();
    } else if (key === "ENTER") {
        game.confirm();
    } else if (key.length === 1 && key.match(czechLetters)) {
        game.write(key);
    }
});

document.getElementById("settings").addEventListener("click", () => toggleSettingsWindow("open"));
document.getElementById("close").addEventListener("click", () => toggleSettingsWindow("close"));

function date() {
    let date = new Date();
    let month = date.getMonth();
    let day = date.getDate();
    
    let months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    month = months[month];

    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = day + ". " + month;
};

function changeTheme(lightness, color) {
    switch (lightness) {
        case "dark":
            changeRootStyleProperty("primary", "#181818");
            changeRootStyleProperty("secondary", "#002652");
            changeRootStyleProperty("tertiary", "#D6D6D6");
            break;
        case "light":
            changeRootStyleProperty("primary", "#D6D6D6");
            changeRootStyleProperty("secondary", "#002652");
            changeRootStyleProperty("tertiary", "#181818");
            break;
    }
};

date();
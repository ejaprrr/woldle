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
    localStorage.setItem("theme", theme);
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

const theme = localStorage.getItem("theme");
if (theme) {
    changeTheme(theme);
};
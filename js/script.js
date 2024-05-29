const keydown = () => {
    switch (event.key) {
            case "Backspace":
                window.gameInstance.back();
                break;
            
            case "Enter":
                window.gameInstance.confirm();
                break;
    }
}

const keypress = (event) => {
    const { key } = event;

    if (key.toLowerCase().match(Game.keyFilter) && key.length === 1) {
        window.gameInstance.write(key);
    }
}

const toggleWindow = (action, content = null) => {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");
    switch (action) {
        case "open":
            document.onkeydown, document.onkeypress = () => {};
            windowWrapper.classList.add("show");
            window.classList.add("show");
            document.getElementById(`content-${content}`).classList.add("show");
            break;

        case "close":
            document.onkeydown = keydown;
            document.onkeypress = keypress;
            windowWrapper.classList.remove("show");
            window.classList.remove("show");
            document.querySelector(`#window > main.show`).classList.remove("show");
            break;
    }
}

const changeTheme = () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.className)

    const otherOption = document.querySelector(".theme.selected-setting");
    if (otherOption) otherOption.classList.remove("selected-setting");
    document.getElementById(theme).classList.add("selected-setting");
}

const time = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    
    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = `${day}. ${months[month]}`;
};

const mulberry32 = (seed) => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;

}
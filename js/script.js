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

    if (key.toLowerCase().match(Game.allowed) && key.length === 1) {
        window.gameInstance.write(key);
    }
}

const handleCopy = (target) => {
    let url = new URL(location.href.split("?")[0]);
    url.searchParams.append("word", btoa(encodeURIComponent(target)));
    navigator.clipboard.writeText(url.toString());
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
    if (otherOption) document.getElementById(theme).classList.add("selected-setting");
}

const time = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    
    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = `${day}. ${months[month]}`;
};
const handleKeydown = (event) => {
    if (event.key === "Backspace") window.gameInstance.back();
    if (event.key === "Enter") window.gameInstance.confirm();
}

const handleKeypress = (event) => {
    let { key } = event;
    key = key.toLowerCase()

    if (key.length === 1 && key.match(Game.allowed)) window.gameInstance.write(key);
}

const handleCopy = (target) => {
    let url = new URL(location.href.split("?")[0]);

    url.searchParams.append("word", btoa(encodeURIComponent(target)));
    navigator.clipboard.writeText(url.toString());
}

const toggleWindow = (action, content = null) => {
    const container = document.querySelector("#window-wrapper");
    const window = document.querySelector("#window");

    if (action === "open") {
        document.onkeydown, document.onkeypress = () => {};

        [container, window, document.querySelector(`#content-${content}`)].forEach((element) => element.classList.add("show"));
    }
    if (action === "close" && window.classList.contains("show")) {
        document.onkeydown = handleKeydown;
        document.onkeypress = handleKeypress;

        [container, window, document.querySelector(`#window div.show`)].forEach((element) => element.classList.remove("show"));
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

const setDateTime = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    
    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = `${day}. ${months[month]}`;
};
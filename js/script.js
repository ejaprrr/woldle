const toggleWindow = (action, content = null) => {
    const windowWrapper = document.getElementById("window-wrapper");
    const window = document.getElementById("window");
    switch (action) {
        case "open":
            windowWrapper.classList.add("show");
            window.classList.add("show");
            document.getElementById(`content-${content}`).classList.add("show");
            break;

        case "close":
            windowWrapper.classList.remove("show");
            window.classList.remove("show");
            document.querySelector(`#window > main.show`).classList.remove("show");
            break;
    }
}

const changeTheme = (theme) => {
    localStorage.setItem("theme", theme);

    document.body.className = "";
    document.body.classList.add(theme);
}

const time = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    
    document.getElementById("year").textContent = date.getFullYear();
    document.getElementById("date").textContent = `${day}. ${months[month]}`;
};
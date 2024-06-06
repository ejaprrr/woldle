document.querySelector("#theme-toggle").onclick = () => changeTheme();

const theme = localStorage.getItem("theme");

if (theme != null && document.body.className != theme) {
    changeTheme(theme);
}

setDateTime();
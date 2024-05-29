time();

const theme = localStorage.getItem("theme");

if (theme != null && document.body.className != theme) {
    changeTheme(theme);
}
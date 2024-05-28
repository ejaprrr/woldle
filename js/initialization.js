time();

const theme = localStorage.getItem("theme");

if (theme != null) {
    changeTheme(theme);
};
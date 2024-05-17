function settingsWindow() {
    const window = document.getElementById("window");
    const windowWrapper = document.getElementById("window-wrapper");
    const cs = getComputedStyle(document.querySelector(":root"));
    windowWrapper.style.backgroundColor = "#550055";
    console.log("tvoje máma");
};

document.getElementById("settings").addEventListener("click", settingsWindow)
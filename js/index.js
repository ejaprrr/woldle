window.onload = async () => window.gameInstance = await new Game().init();

document.onkeydown = keydown;
document.onkeypress = keypress;

// onclick events
document.querySelector("#surrender").onclick = () => window.gameInstance.surrender();;
document.querySelector("#info").onclick = () => location.href = "info.html";
document.querySelector("#settings").onclick = () => toggleWindow("open", "settings");
document.querySelector("#theme-toggle").onclick = () => changeTheme();

const input = document.querySelector("#custom-word");

input.addEventListener("input", (event) => {
    input.setCustomValidity("");
})

document.querySelector("form").addEventListener("submit", (event) => {
    if (window.gameInstance.dictionary.includes(input.value.toLowerCase())) {
        window.gameInstance.setMode('custom');
        toggleWindow('close');
    } else {
        input.setCustomValidity("Word is invalid.");
        input.reportValidity();
    }
})

Array.from(document.querySelectorAll(".key")).forEach((key) => {
    if (key.id == "enter") {
        key.onclick = () => window.gameInstance.confirm();
    } else if (key.id == "backspace") {
        key.onclick = () => window.gameInstance.back();
    } else {
        key.onclick = () => window.gameInstance.write(key.textContent);
    }
})
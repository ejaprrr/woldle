window.onload = async () => window.gameInstance = await new Game().init();

document.onkeydown = handleKeydown;
document.onkeypress = handleKeypress;

// onclick events
document.querySelector("#info").onclick = () => location.href = "info.html";
document.querySelector("#settings").onclick = () => toggleWindow("open", "settings");
document.querySelector("#surrender").onclick = () => window.gameInstance.endGame("lose");
document.querySelector("#close").onclick = () => toggleWindow("close");
document.querySelector("#random").onclick = () => window.gameInstance.setMode("random");
document.querySelector("#daily").onclick = () => window.gameInstance.setMode("daily");
document.querySelector("#custom").onclick = () => { toggleWindow("close"); toggleWindow("open", "custom") };
document.querySelector("#copy-link").onclick = () => handleCopy(document.querySelector("#custom-word").value);

Array.from(document.querySelectorAll(".refresh")).forEach((element) => element.onclick = () => {window.gameInstance.reset(); toggleWindow("close")});
Array.from(document.querySelectorAll(".copy-word")).forEach((element) => element.onclick = () => handleCopy(window.gameInstance.word));

const input = document.querySelector("#custom-word");

input.addEventListener("input", () => {
    input.setCustomValidity("");
})

document.querySelector("form").addEventListener("submit", () => {
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
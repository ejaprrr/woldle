const test = document.getElementById("test");

document.addEventListener("keydown", (event) => {
    const { key } = event;
    test.innerHTML += key;
});
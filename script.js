const test = document.getElementById("test");
let line = 1;
let len = 0;
let end = false;
document.addEventListener("keydown", (event) => {
    const key = event.key.toUpperCase();
    if (/^[A-Z]+$/.test(key) && !end) {
        switch (key) {
            case "BACKSPACE":
                test.innerHTML = test.innerHTML.slice(0, -1);
                len--;
                break;
            case "ENTER":
                if (len >= 5) {
                    console.log("aaaa");
                    if (line >= 5) {
                        end = true;
                    }
                    test.innerHTML += "<br>";
                    line++;
                    len = 0;
                }
                break;
            default:
                if (len < 5) {
                    test.innerHTML += key;
                    len++;
                }
                break;
        }
    };
});
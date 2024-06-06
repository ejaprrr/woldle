// onclick events
document.querySelector("#home").onclick = () => location.href = "index.html";

const images = ['skola1.jpg', 'budova.jpg', 'infis.jpg'];
let currentIndex = 0;

function rotateImage() {
    const imageElement = document.getElementById('image');
    currentIndex = (currentIndex + 1) % images.length;
    imageElement.style.opacity = 0;

    setTimeout(() => {
        imageElement.src = "images/" + images[currentIndex];
        imageElement.style.opacity = 1;
    }, 650);
}
setInterval(rotateImage, 4500); // Change image every 3 seconds
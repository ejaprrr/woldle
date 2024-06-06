// onclick events
document.querySelector("#home").onclick = () => location.href = "index.html";

const images = ['invite.png', 'gameplay.png', 'victory.png'];
let currentIndex = 0;

function rotateImage() {
    const imageElement = document.getElementById('image');
    currentIndex = (currentIndex + 1) % images.length;
    imageElement.style.opacity = 0;

    setTimeout(() => {
        imageElement.src = "images/slideshow/" + images[currentIndex];
        imageElement.style.opacity = 1;
    }, 250);
}
setInterval(rotateImage, 4500); // Change image every 3 seconds
const canvas = document.getElementById("followerCanvas");
const ctx = canvas.getContext("2d");

//Load rat and set initial position
const ratImage = new Image();
ratImage.src = "images/Mauswheel.webp";


let x = 0;
let y = 0;
let targetX = 0;
let targetY = 0;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

//Tracking
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    targetX = mouseX;
    targetY = mouseY;
});


ratImage.onload = () => {
    x = canvas.width / 2;
    y = canvas.height / 2;
    targetX = x;
    targetY = y;

    requestAnimationFrame(animate);
};

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    x += (targetX - x);
    y += (targetY - y);

    const imgW = ratImage.width;
    const imgH = ratImage.height;
    const clampedX = Math.min(Math.max(x, imgW / 2), canvas.width - imgW / 2);
    const clampedY = Math.min(Math.max(y, imgH / 2), canvas.height - imgH / 2);

    ctx.drawImage(ratImage, clampedX - imgW / 2, clampedY - imgH / 2);

    requestAnimationFrame(animate);
}

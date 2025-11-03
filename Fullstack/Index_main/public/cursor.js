const circle = document.querySelector('.cursor-circle');
let x = 0, y = 0;
let targetX = 0, targetY = 0;
const speed = 0.15;
const size = 10; // CSS circle size

document.addEventListener('mousemove', (e) => {
  targetX = e.clientX - size / 2;
  targetY = e.clientY - size / 2;
});

function animate() {
  x += (targetX - x) * speed;
  y += (targetY - y) * speed;
  circle.style.transform = `translate(${x}px, ${y}px)`;
  requestAnimationFrame(animate);
}

animate();

const number = Math.floor(Math.random() * 100);

function verificar() {
  const valor = Number(document.getElementById("entrada").value);
  const mensagem = document.getElementById("mensagem");

  if (valor === number) {
    mensagem.textContent = "YIPPEE! Você acertou!";
    document.body.style.setProperty("background-color", "lightgreen");
  } 
  else if (valor > number) {
    document.body.style.setProperty("background-color", "red");
  } 
  else if (valor < number) {
    document.body.style.setProperty("background-color", "red");
  } 
  else {
    mensagem.textContent = "Insira um número entre 0 e 99.";
  }
}

console.log("N° é:", number);
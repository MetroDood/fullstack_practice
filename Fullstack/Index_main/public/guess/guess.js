const number = Math.floor(Math.random() * 100);

function verificar() {
  const value = Number(document.getElementById("entry").value);
  const message = document.getElementById("message");

  if (isNaN(value) || value < 0 || value > 99){
    message.textContent = "Insira um número entre 0 e 99";
  }
  else if (value === number){
    message.textContent = "YIPPEE! Você acertou!";
    document.getElementById("bg").style.backgroundColor = "lightgreen";
  } 
  else if (value > number){
    document.getElementById("bg").style.backgroundColor = "red";
    message.textContent = "Menor";
  } 
  else{
    document.getElementById("bg").style.backgroundColor = "red";
    message.textContent = "Maior";
  } 
}

console.log("N° é:", number); 
var texto_monto = document.getElementById("deuda");
var texto_tasa = document.getElementById("tasa");
var texto_plazo = document.getElementById("periodos");
var monto = parseInt(texto_monto.value);
var tasa = parseInt(texto_tasa.value);
var plazo = parseInt(texto_plazo.value);
var cuota = 0;
var calcular = document.getElementById("calcular");
var resultado = document.getElementById("resultado");
calcular.addEventListener("click", calcularCuota);


function calcularCuota()
{
  var monto = parseFloat(texto_monto.value);
  var tasa = parseFloat(texto_tasa.value);
  var plazo = parseFloat(texto_plazo.value);
  var numerador = tasa*(1+tasa)**plazo;
  var denominador = (1+tasa)**plazo-1;
  var cuota = monto * numerador / denominador
  resultado.innerHTML = "El valor de la cuota es " + cuota;
}

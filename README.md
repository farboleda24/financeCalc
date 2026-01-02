# financeCalc

Pequeña calculadora de cuota constante (anualidad).

Uso rápido:
- Ingrese el monto (ej. 1000000). El campo "Valor deuda" formatea miles en tiempo real (ej. escribe 100000000 → verá 100,000,000 mientras escribe).
- Ingrese la tasa por período en PORCENTAJE (ej. 1 = 1%). No ingrese la tasa como decimal (0.01).
- Ingrese el número de periodos (entero).
- Presione "Calcular". El resultado muestra la cuota por período, el total pagado y el interés total, con separadores de miles y 2 decimales.

Cambios principales realizados:
- La tasa ahora se ingresa únicamente en porcentaje (ej. 1 = 1%).
- Validación de entradas y mensajes de error.
- Manejo de tasa cero (sin interés).
- Mejor formato de salida y estilos responsivos y profesionales.

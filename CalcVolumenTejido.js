function calcular() {
    // Obtener los valores ingresados en el HTML
    const espesorTablita = parseFloat(document.getElementById("espesorTablita").value); // mm
    const anchoTablita = parseFloat(document.getElementById("anchoTablita").value); // mm
    const espesorTejido = parseFloat(document.getElementById("espesorTejido").value); // mm (estado estirado)
    const longitudInicial = parseFloat(document.getElementById("longitudInicial").value); // mm
    const elasticidad = parseFloat(document.getElementById("elasticidad").value); // Valor entre 0.1 y 1

    // Validar los valores ingresados
    if (isNaN(espesorTablita) || isNaN(anchoTablita) || isNaN(espesorTejido) || isNaN(longitudInicial) || isNaN(elasticidad)) {
        document.getElementById("resultados").innerText = "Por favor, completa todos los campos correctamente.";
        return;
    }
    if (elasticidad <= 0 || elasticidad > 1) {
        document.getElementById("resultados").innerText = "La elasticidad debe estar entre 0.1 y 1.";
        return;
    }

    // Inicializar variables
    let longitudRestante = longitudInicial; // Longitud total del tejido en mm
    let altoAcumulado = espesorTablita; // Inicialmente solo el espesor de la tablita
    let anchoAcumulado = anchoTablita; // Inicialmente solo el ancho de la tablita
    let vueltas = 0; // Contador de vueltas
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Escala para visualizar
    const scale = 2; // Escala ajustada para un dibujo más grande
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar canvas

    // Preparar tabla para el log
    const logs = document.getElementById("logs");
    logs.innerHTML = `
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr>
                    <th># Vuelta</th>
                    <th>Longitud Restante (cm)</th>
                    <th>Alto Acumulado (mm)</th>
                    <th>Ancho Acumulado (mm)</th>
                    <th>Consumo Vuelta (mm)</th>
                    <th>Consumo Vuelta (cm)</th>
                </tr>
            </thead>
            <tbody id="logBody"></tbody>
        </table>
    `;
    const logBody = document.getElementById("logBody");

    // Dibujar tablita inicial
    ctx.fillStyle = "lightblue";
    ctx.fillRect(
        centerX - (anchoTablita / 2) * scale,
        centerY - (espesorTablita / 2) * scale,
        anchoTablita * scale,
        espesorTablita * scale
    );

    // Iterar hasta consumir todo el tejido
    while (longitudRestante > 0) {
        // Determinar el perímetro efectivo
        let perimetroEfectivo;
        if (vueltas < 3) {
            // Antes de la cuarta vuelta (perímetro rectangular)
            perimetroEfectivo = 2 * (anchoAcumulado + altoAcumulado);
        } else {
            // A partir de la cuarta vuelta (perímetro con semicirculaciones)
            perimetroEfectivo = 2 * anchoAcumulado + Math.PI * altoAcumulado;
        }

        // Ajustar consumo por elasticidad
        const consumoVuelta = perimetroEfectivo * elasticidad;

        if (longitudRestante >= consumoVuelta) {
            vueltas++;
            longitudRestante -= consumoVuelta;

            // Incrementar alto y ancho acumulado
            if (vueltas > 1) {
                altoAcumulado += 2 * espesorTejido;
                anchoAcumulado += 2 * espesorTejido;
            }

            // Dibujar la vuelta
            ctx.strokeStyle = "purple";
            ctx.beginPath();
            const leftX = centerX - (anchoAcumulado / 2) * scale;
            const rightX = centerX + (anchoAcumulado / 2) * scale;
            const topY = centerY - (altoAcumulado / 2) * scale;
            const bottomY = centerY + (altoAcumulado / 2) * scale;

            // Línea superior
            ctx.moveTo(leftX, topY);
            ctx.lineTo(rightX, topY);

            // Semicirculo derecho
            ctx.arc(
                rightX,
                centerY,
                (altoAcumulado / 2) * scale,
                1.5 * Math.PI,
                0,
                false
            );

            // Línea inferior
            ctx.lineTo(leftX, bottomY);

            // Semicirculo izquierdo
            ctx.arc(
                leftX,
                centerY,
                (altoAcumulado / 2) * scale,
                0.5 * Math.PI,
                Math.PI,
                false
            );

            ctx.stroke();

            // Agregar fila al log
            logBody.innerHTML += `
                <tr>
                    <td>${vueltas}</td>
                    <td>${(longitudRestante / 10).toFixed(2)}</td>
                    <td>${altoAcumulado.toFixed(2)}</td>
                    <td>${anchoAcumulado.toFixed(2)}</td>
                    <td>${consumoVuelta.toFixed(2)}</td>
                    <td>${(consumoVuelta / 10).toFixed(2)}</td>
                </tr>
            `;
        } else {
            break;
        }
    }

    // Mostrar resultados
    const alturaFinal = altoAcumulado; // Altura total del enrollado
    const anchoFinal = anchoAcumulado; // Ancho total del enrollado
    document.getElementById("resultados").innerHTML = `
        Número total de vueltas: ${vueltas}<br>
        Altura final del enrollado: ${alturaFinal.toFixed(2)} mm<br>
        Ancho final del enrollado: ${anchoFinal.toFixed(2)} mm
    `;
}

var mm_en_pixeles = 3.78; //3.78

var px = 0; // Punto Partida x
var py = 0; // Punto Partida y

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function calcular() {
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
    let consumoPrimero = 0; // Consumo de la primera vuelta
    const decrementos = []; // Para almacenar los consumos por vuelta

    // Preparar tabla para el log
    const logs = document.getElementById("logs");
    logs.innerHTML = `
        <h2>Log de Vueltas:</h2>
        <table border="1" style="border-collapse: collapse; width: auto;">
            <thead>
                <tr>
                    <th># Vuelta</th>
                    <th>Longitud Restante (cm)</th>
                    <th>Alto Acumulado (mm)</th>
                    <th>Ancho Acumulado (mm)</th>
                    <th>Consumo Vuelta (mm)</th>
                    <th>Consumo Vuelta (cm)</th>
                    <th>Diff c/ Primero (cm)</th>
                </tr>
            </thead>
            <tbody id="logBody"></tbody>
        </table>
    `;
    const logBody = document.getElementById("logBody");
    
    // Dibujar el rectangulo
    
    const canvas = new fabric.Canvas('canvas');
    dibujarTablita(canvas,espesorTablita,anchoTablita );

    // Iterar hasta consumir todo el tejido
    while (longitudRestante > 0) {
        // Determinar el perímetro efectivo
        let perimetroEfectivo;
        if (vueltas < 3) {
            // Antes de la cuarta vuelta (perímetro rectangular)
            perimetroEfectivo = 2 * (anchoAcumulado + altoAcumulado);
            dibujarPerimetroRectangular(canvas,anchoAcumulado,altoAcumulado);
            //break;
        } else {
            // A partir de la cuarta vuelta (perímetro con semicirculaciones)
            const radio = altoAcumulado / 2; // Radio de los semicirculos
            perimetroEfectivo = 2 * anchoAcumulado + Math.PI * altoAcumulado;
            dibujarPerimetroCircular(canvas,anchoAcumulado,altoAcumulado);
            if(vueltas > 200){
                break;
            }
        }

        // Ajustar consumo por elasticidad
        const consumoVuelta = perimetroEfectivo * elasticidad;

        // Guardar el consumo de la primera vuelta
        if (vueltas === 0) {
            consumoPrimero = consumoVuelta;
        }
        var cosumoNeto = parseFloat(consumoVuelta / 10 ).toFixed(1); 
        document.getElementById("info").innerHTML = `Vuelta: ${vueltas}         &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;         Consumo Tejido: ${cosumoNeto}cm`;

        // Calcular la diferencia con respecto al primero en cm
        const diferenciaPrimero =
            vueltas > 0 ? ((consumoVuelta - consumoPrimero) / 10).toFixed(4) : "N/A";

        if (longitudRestante >= consumoVuelta) {
            vueltas++;
            decrementos.push(consumoVuelta);
            longitudRestante -= consumoVuelta;

            // Incrementar alto y ancho acumulado a partir de la segunda vuelta
            if (vueltas > 1) {
                altoAcumulado += 2 * espesorTejido; // Incremento por arriba y abajo
                anchoAcumulado += 2 * espesorTejido; // Incremento por izquierda y derecha
            }

            // Agregar fila a la tabla del log
            logBody.innerHTML += `
                <tr>
                    <td>${vueltas}</td>
                    <td>${(longitudRestante / 10).toFixed(2)}</td>
                    <td>${altoAcumulado.toFixed(2)}</td>
                    <td>${anchoAcumulado.toFixed(2)}</td>
                    <td>${consumoVuelta.toFixed(2)}</td>
                    <td>${(consumoVuelta / 10).toFixed(4)}</td>
                    <td>${diferenciaPrimero}</td>
                </tr>
            `;
        } else {
            // Última vuelta parcial
            decrementos.push(longitudRestante);
            vueltas++;
            logBody.innerHTML += `
                <tr>
                    <td>${vueltas}</td>
                    <td>${(0).toFixed(2)}</td>
                    <td>${altoAcumulado.toFixed(2)}</td>
                    <td>${anchoAcumulado.toFixed(2)}</td>
                    <td>${longitudRestante.toFixed(2)}</td>
                    <td>${(longitudRestante / 10).toFixed(4)}</td>
                    <td>${diferenciaPrimero}</td>
                </tr>
            `;
            longitudRestante = 0;
        }
        await sleep(100);
    }

    // Calcular resultados finales
    const alturaFinal = altoAcumulado; // Altura total del enrollado
    const anchoFinal = anchoAcumulado; // Ancho total del enrollado
    const decrementoPromedioPorMetro = decrementos.reduce((a, b) => a + b, 0) / decrementos.length;

    // Mostrar los resultados en mm y cm
    const resultados = `
        <div>
            Número total de vueltas: ${vueltas}<br>
            Altura final del enrollado: ${alturaFinal.toFixed(2)} mm | ${(alturaFinal / 10).toFixed(2)} cm<br>
            Ancho final del enrollado: ${anchoFinal.toFixed(2)} mm | ${(anchoFinal / 10).toFixed(2)} cm<br>
            Decremento promedio por metro: ${decrementoPromedioPorMetro.toFixed(2)} mm | ${(decrementoPromedioPorMetro / 10).toFixed(2)} cm
        </div>
    `;
    document.getElementById("resultados").innerHTML = resultados;
}

function dibujarPerimetroRectangular(canvas,anchoAcumulado,altoAcumulado){
    var espesor_tela = 1 * mm_en_pixeles;
    
    var ancho = anchoAcumulado * mm_en_pixeles;
    var alto  = altoAcumulado * mm_en_pixeles;
    
    // Linea de arriba
    const telaArriba = new fabric.Line([px, py, px + ancho, py], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaArriba);
    
    // Linea vertical derecha
    const telaVD = new fabric.Line([px + ancho, py, px + ancho , py + alto ], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaVD);
    
    // Linea de abajo
    const telaAbajo = new fabric.Line([px + ancho, py + alto, px , py + alto], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaAbajo);
    
    // Linea vertical izquierda
    const telaVI = new fabric.Line([px  , py + alto, px  , py  ], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaVI);
    
    var k = 0.5;    
    px = px - (espesor_tela / 2) - k;
    py = py - (espesor_tela / 2) - k;
}

function dibujarPerimetroCircular(canvas,anchoAcumulado,altoAcumulado ){
    var espesor_tela = 1 * mm_en_pixeles;
    
    var ancho = anchoAcumulado * mm_en_pixeles;
    var alto  = altoAcumulado * mm_en_pixeles;
    
    
    
    // Linea de arriba
    const telaArriba = new fabric.Line([px, py, px + ancho, py], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaArriba);
    
    // Semicirculo Derecho
    
    const centerXD = px + ancho;
    const centerYD = py + alto / 2;
    const radius = alto / 2;
    
    
    const rightHalf = new fabric.Path(
        `M ${centerXD},${centerYD  - radius} 
         A ${radius},${radius} 0 0,1 ${centerXD},${centerYD + radius}`, 
        {
            fill: '',  
            stroke: 'blue', // Color del trazo
            strokeWidth: espesor_tela 
        }
    );
    canvas.add(rightHalf);

      
    // Linea de abajo
    const telaAbajo = new fabric.Line([px + ancho, py + alto, px , py + alto], {
        stroke: 'blue',  
        strokeWidth: espesor_tela    
    });
    canvas.add(telaAbajo);
    
    // Semicirculo izquierdo
    
    const centerXI = px;
    const centerYI = py + alto / 2;
     
    
    const leftHalf = new fabric.Path(
        `M ${centerXI},${centerYI  - radius} 
         A ${radius},${radius} 0 0,0 ${centerXI},${centerYI +  radius}`, 
        {
            fill: '', // Sin relleno
            stroke: 'blue', // Color del trazo
            strokeWidth: espesor_tela
        }
    );
    canvas.add(leftHalf);
    
     
    var k = 0.5;    
    px = px - (espesor_tela / 2) - k;
    py = py - (espesor_tela / 2) - k;
}

function dibujarTablita(canvas,espesorTablita,anchoTablita ){
    const rectWidth = anchoTablita * mm_en_pixeles;  
    const rectHeight = espesorTablita * mm_en_pixeles;   
     
    const rect = new fabric.Rect({
      width: rectWidth,
      height: rectHeight,
      fill: 'gray', // Color del rectángulo
      originX: 'center',
      originY: 'center',
      left: canvas.width / 2,
      top: canvas.height / 2  
    });
    
    px = rect.left - rect.width / 2;   // Defino el punto de partida de forma global X
    py = rect.top - rect.height / 2;   // Defino el punto de partida de forma global Y    
    
    canvas.add(rect);
}

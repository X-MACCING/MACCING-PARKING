document.addEventListener('DOMContentLoaded', function() {
    // Se ejecuta automáticamente al cargar la página
    updateTable();

    // Formulario de registro
    document.getElementById('registroForm')?.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenir el comportamiento de envío por defecto

        const nombreConductor = document.getElementById('nombre').value;
        const placaVehiculo = document.getElementById('placa_vehiculo').value;
        const tipoVehiculo = document.getElementById('tipo_vehiculo').value;

        // Realizar la petición POST
        const response = await fetch('/api/registros', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreConductor,
                placa_vehiculo: placaVehiculo,
                tipo_vehiculo: tipoVehiculo
            })
        });

        const errorMessageDiv = document.getElementById('errorMessage');
        errorMessageDiv.innerText = ''; // Limpiar mensajes de error previos

        if (response.ok) {
            alert('Registro agregado con éxito');
            document.getElementById('registroForm').reset(); // Limpiar el formulario
            updateTable(); // Actualizar la tabla de registros después de agregar
        } else {
            const errorMessage = await response.text();
            errorMessageDiv.innerText = `Error: ${errorMessage}`; // Mostrar el mensaje de error
        }
    });

    // Evento para eliminar un registro
    document.getElementById('borrarForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const placa = document.getElementById('placa').value;
        const tipo = document.getElementById('tipo').value;

        try {
            const response = await fetch(`/api/registros`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ placa_vehiculo: placa, tipo_vehiculo: tipo }),
            });

            if (response.ok) {
                document.getElementById('deleteMessage').textContent = 'Registro eliminado con éxito.';
                updateTable(); // Actualiza la tabla después de eliminar
            } else {
                const errorText = await response.text();
                document.getElementById('deleteMessage').textContent = `Error al eliminar: ${errorText}`;
            }
        } catch (error) {
            document.getElementById('deleteMessage').textContent = `Error: ${error.message}`;
        }
    });

    // Función para actualizar las tablas
    async function updateTable() {
        // Obtener registros
        const responseRegistros = await fetch('/api/registros');
        const registros = await responseRegistros.json();

        const tbodyRegistros = document.getElementById('tabla-registros-body');
        tbodyRegistros.innerHTML = ''; // Limpiar la tabla existente

        registros.forEach(registro => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${registro.id}</td>
                <td>${registro.nombre}</td>
                <td>${registro.placa_vehiculo}</td>
                <td>${registro.tipo_vehiculo}</td>
                <td>${registro.lugar_parqueo}</td>
                <td>${registro.hora_ingreso}</td>
                <td>${registro.fecha_ingreso}</td>
            `;
            tbodyRegistros.appendChild(row);
        });

        // Obtener conductores
        const responseConductores = await fetch('/api/conductor');
        const conductores = await responseConductores.json();

        const tbodyConductores = document.getElementById('tabla-conductores-body');
        tbodyConductores.innerHTML = ''; // Limpiar la tabla existente

        conductores.forEach(conductor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${conductor.id}</td>
                <td>${conductor.nombre}</td>
                <td>${conductor.placa_vehiculo}</td>
            `;
            tbodyConductores.appendChild(row);
        });
    }
});

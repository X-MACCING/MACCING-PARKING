const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path'); // Asegúrate de agregar esta línea

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Proyecto Corner',
  password: '123456789',
  port: 5432,
});

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));  // Para servir archivos estáticos como HTML, CSS, JS
app.use(express.static(path.join(__dirname, 'public'))); // Asegúrate de que 'public' exista

// Configurar las rutas para cada página
app.get('/page-1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/page-1.html'));
});

app.get('/page-2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/page-2.html'));
});

app.get('/page-3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/page-3.html'));
});

app.get('/page-4', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/page-4.html'));
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


app.get('/page-1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/page-1.html'));
});

// Ruta para registrar la entrada del vehículo
app.post('/registro-entrada', async (req, res) => {
  const { nombre, placa, tipo } = req.body;

  if (!nombre || !placa || !tipo) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  try {
    const { rows: resultsPrimeraConsulta } = await pool.query(
      'SELECT 1 FROM Conductor WHERE nombre = $1 AND Placa_Vehiculo = $2',
      [nombre, placa]
    );

    if (resultsPrimeraConsulta.length === 0) {
      return res.status(401).send('El usuario no es el propietario del vehículo');
    }

    const { rows: resultsSegundaConsulta } = await pool.query(
      'SELECT 1 FROM Vehiculo WHERE Placa = $1 AND Tipo_Vehiculo = $2',
      [placa, tipo]
    );

    if (resultsSegundaConsulta.length === 0) {
      return res.status(401).send('El tipo de Vehículo no coincide con la Placa en la Base de Datos');
    }

    const { rows: availableSpaces } = await pool.query(
      'SELECT COUNT(*) FROM Lugar_Parking WHERE disponible = true'
    );

    if (parseInt(availableSpaces[0].count, 10) === 0) {
      return res.status(400).send('No hay plazas disponibles');
    }

    const insertQuery = `
      INSERT INTO REGISTRO (nombre, Placa_Vehiculo, Tipo_Vehiculo, hora_ingreso, fecha_ingreso)
      VALUES ($1, $2, $3, current_time, current_date)
      RETURNING lugar_parqueo
    `;
    const values = [nombre, placa, tipo];
    const result = await pool.query(insertQuery, values);
    const lugar_parqueo = result.rows[0].lugar_parqueo;

    res.status(200).send(`Registro exitoso. Lugar de parqueo asignado: ${lugar_parqueo}`);
  } catch (err) {
    console.error('Error al procesar la solicitud:', err);
    res.status(500).send('Error interno del servidor');
  }
  console.log('Registro exitoso. Placa del carro : ${placa}')
  console.log('Registro exitoso. Tipo de Vehiculo: ${tipo}')
  console.log('Registro exitoso. Lugar de parqueo asignado: ${lugar_parqueo}')

});

// Ruta para registrar la salida del vehículo
app.post('/registrar-salida', async (req, res) => {
  const { placa, tipo } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM Registro WHERE Placa_Vehiculo = $1 AND Tipo_Vehiculo = $2 RETURNING *',
      [placa, tipo]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Vehículo no encontrado en el registro');
    }

    res.status(200).send(`Vehículo con placa ${placa} ha salido del parqueadero.`);
  } catch (error) {
    console.error('Error al registrar la salida:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// API para obtener el número de lugares disponibles
app.get('/api/contador', async (req, res) => {
  try {
    console.log('Consulta de contador de lugares disponibles iniciada'); // Agrega esta línea
    const { rows } = await pool.query('SELECT COUNT(*) FROM Lugar_Parking WHERE disponible = true');
    res.json({ disponibles: parseInt(rows[0].count, 10) });
  } catch (error) {
    console.error('Error al obtener contador:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// API para obtener el historial de registros
app.get('/api/registros', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Registro');
    res.json({ registros: rows });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).send('Error interno del servidor');
  }
});

async function actualizarContador() {
  try {
      const response = await fetch('/api/contador');
      if (!response.ok) {
          throw new Error('Error al obtener el contador');
      }
      const data = await response.json();
      document.getElementById('disponibles').textContent = data.disponibles;
  } catch (error) {
      console.error('Error al actualizar el contador:', error);
      document.getElementById('disponibles').textContent = 'Error al cargar';
  }
}

// Llama a la función para actualizar el contador al cargar la página
actualizarContador();

// Opcional: actualiza cada 5 segundos
setInterval(actualizarContador, 5000);


// Iniciar el servidor
const port = 3000;


document.getElementById('registro-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // Evitar el envío del formulario por defecto

  const nombre = document.getElementById('nombre').value;
  const placa = document.getElementById('placa').value;
  const tipo = document.getElementById('tipo').value;

  try {
      const response = await fetch('/page-1', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre, placa, tipo }),
      });

      const data = await response.text();
      document.getElementById('resultado').textContent = data;

      if (!response.ok) {
          throw new Error(`Error: ${data}`);
      }
  } catch (error) {
      console.error('Error al enviar el formulario:', error);
      document.getElementById('resultado').textContent = 'Error al registrar el vehículo';
  }
});

// Ruta para comprobar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Consulta simple para obtener la hora actual
    res.json({ message: 'Conexión a la base de datos exitosa', time: result.rows[0].now });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).json({ message: 'Error de conexión a la base de datos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 3000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Proyecto Corner',
  password: '123456789',
  port: 5432,
});

// Obtener datos
app.get('/api/datos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registro');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en la consulta');
  }
});

// Insertar datos
app.post('/api/insertar', async (req, res) => {
  const { nombre, Placa_vehiculo, Tipo_vehiculo } = req.body;

  if (!nombre || !Placa_vehiculo || !Tipo_vehiculo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Validar que el conductor es propietario del vehículo
    const { rows: resultsPrimeraConsulta } = await pool.query(
      'SELECT 1 FROM Conductor WHERE nombre = $1 AND Placa_Vehiculo = $2',
      [nombre, Placa_vehiculo]
    );

    if (resultsPrimeraConsulta.length === 0) {
      return res.status(401).json({ message: 'El usuario no es el propietario del vehículo' });
    }

    // Validar que el tipo de vehículo coincide
    const { rows: resultsSegundaConsulta } = await pool.query(
      'SELECT 1 FROM Vehiculo WHERE Placa_vehiculo = $1 AND Tipo_Vehiculo = $2',
      [Placa_vehiculo, Tipo_vehiculo]
    );

    if (resultsSegundaConsulta.length === 0) {
      return res.status(401).json({ message: 'El tipo de vehículo no coincide con la placa' });
    }

    // Insertar en la tabla registro
    const result = await pool.query(
      `INSERT INTO REGISTRO (nombre, Placa_Vehiculo, Tipo_Vehiculo, hora_ingreso, fecha_ingreso)
      VALUES ($1, $2, $3, current_time, current_date) RETURNING *`,
      [nombre, Placa_vehiculo, Tipo_vehiculo]
    );

    res.json({ message: 'Datos insertados correctamente', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al insertar datos', error: err.message });
  }
});

// Borrar datos
app.delete('/api/salida', async (req, res) => {
  const { Placa_vehiculo_b, Tipo_vehiculo_b } = req.body;

  if (!Placa_vehiculo_b || !Tipo_vehiculo_b) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Validar que el tipo de vehículo coincide con la placa
    const { rows: resultsPriB } = await pool.query(
      'SELECT 1 FROM Vehiculo WHERE Placa_vehiculo_b = $1 AND Tipo_vehiculo_b = $2',
      [Placa_vehiculo_b, Tipo_vehiculo_b]
    );

    if (resultsPriB.length === 0) {
      return res.status(401).json({ message: 'El tipo de vehículo no coincide con la placa' });
    }

    // Borrar registro
    const result = await pool.query(
      'DELETE FROM REGISTRO WHERE Placa_vehiculo_b = $1 AND Tipo_vehiculo_b = $2 RETURNING *',
      [Placa_vehiculo_b, Tipo_vehiculo_b]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró el vehículo para borrar' });
    }

    res.json({ message: 'Vehículo borrado correctamente', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al borrar datos', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

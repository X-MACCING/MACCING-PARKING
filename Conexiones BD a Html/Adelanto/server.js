const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path'); // Agrega esta línea

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Proyecto Corner',
  password: '123456789',
  port: 5432,
});


// Endpoint para obtener registros
app.get('/api/registros', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM registro');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los registros');
    }
});
// Endpoint para obtener registros
app.get('/api/conductor', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM conductor');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los registros');
    }
});
// Servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Endpoint para insertar un registro
app.post('/api/registros', async (req, res) => {
    const { nombre, placa_vehiculo, tipo_vehiculo } = req.body;
    
    try {
        // Verificar si el conductor existe
        const conductorResult = await pool.query('SELECT * FROM conductor WHERE nombre = $1', [nombre]);
        if (conductorResult.rowCount === 0) {
            return res.status(400).send('El conductor no esta registrado en la base de datos');
        }

        // Verificar si la placa existe
        const vehiculoResult = await pool.query('SELECT * FROM conductor WHERE placa_vehiculo = $1', [placa_vehiculo]);
        if (vehiculoResult.rowCount === 0) {
            return res.status(400).send('La placa del vehículo no esta registrada en la base de datos');
        }

        // Verificar si el conductor esta relacionado con la placa
        const vehi_condResult = await pool.query('SELECT * FROM conductor WHERE placa_vehiculo = $1 and nombre = $2' , [placa_vehiculo,nombre]);
        if (vehi_condResult.rowCount === 0) {
            return res.status(400).send('El nombre del usuario no corresponde a la placa registrada en la base de datos');
        }
                // Verificar si el conductor existe
        const Inparkingresult = await pool.query('SELECT * FROM registro WHERE nombre = $1', [nombre]);
        if (Inparkingresult.rowCount === 1) {
            return res.status(400).send('El vehiculo ya esta en el parqueadero');
        }
        const result = await pool.query(
            'INSERT INTO registro (nombre, placa_vehiculo, tipo_vehiculo, hora_ingreso,fecha_ingreso) VALUES ($1, $2, $3, current_time, current_date) RETURNING lugar_parqueo',
            [nombre, placa_vehiculo, tipo_vehiculo]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al insertar el registro');
    }
});


app.delete('/api/registros', async (req, res) => {
    const { placa_vehiculo, tipo_vehiculo } = req.body;

    try {
        // Verificar si el conductor existe
        const Inparkingresult = await pool.query('SELECT * FROM registro WHERE placa_vehiculo = $1', [placa_vehiculo]);
        if (Inparkingresult.rowCount === 0) {
            return res.status(400).send('El vehiculo no esta en el parqueadero');
        }
        const result = await pool.query(
            'DELETE FROM registro WHERE placa_vehiculo = $1 AND tipo_vehiculo = $2',
            [placa_vehiculo, tipo_vehiculo]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Registro no encontrado');
        }
        
        res.status(204).send(); // No hay contenido en la respuesta
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar el registro');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
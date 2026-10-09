const Cita = require('../models/cita.model');
const Usuario = require('../models/usuario.model');
const Servicio = require('../models/servicio.model');
const Disponibilidad = require('../models/disponibilidad.model');
const {
  parsearFechaHora,
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  diaSemanaISO,
  sumarMinutos,
} = require('../utils/fechas');

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'];

const bad = (res, mensaje, codigo = 400) => res.status(codigo).json({ ok: false, mensaje });

const crearCita = async (req, res) => {
  try {
    const { empleadoId, inicio, servicios, clienteId: clienteIdBody } = req.body || {};

    // 1. ¿Para quién es la cita?
    let clienteId;
    if (req.usuario.rol === 'CLIENTE') {
      clienteId = req.usuario.id;
    } else {
      if (!Number.isInteger(clienteIdBody) || clienteIdBody < 1) {
        return bad(res, 'clienteId es obligatorio cuando agenda un administrador');
      }
      const cliente = await Usuario.buscarPorId(clienteIdBody);
      if (!cliente || cliente.role_nombre !== 'CLIENTE' || cliente.user_estado !== 'ACTIVO') {
        return bad(res, 'El cliente indicado no existe o no está activo');
      }
      clienteId = clienteIdBody;
    }

    // 2. Empleado
    if (!Number.isInteger(empleadoId) || empleadoId < 1) {
      return bad(res, 'empleadoId debe ser un entero válido');
    }
    const empleado = await Usuario.buscarPorId(empleadoId);
    if (!empleado || empleado.role_nombre !== 'EMPLEADO' || empleado.user_estado !== 'ACTIVO') {
      return bad(res, 'El empleado indicado no existe o no está activo');
    }

    // 3. Fecha y hora de inicio
    const fechaInicio = parsearFechaHora(inicio);
    if (!fechaInicio) {
      return bad(res, 'inicio debe tener el formato AAAA-MM-DD HH:MM y ser una fecha real');
    }
    if (fechaInicio <= new Date()) {
      return bad(res, 'La cita debe ser en una fecha y hora futuras');
    }

    // 4. Servicios
    if (
      !Array.isArray(servicios) ||
      servicios.length < 1 ||
      servicios.length > 5 ||
      servicios.some((id) => !Number.isInteger(id) || id < 1) ||
      new Set(servicios).size !== servicios.length
    ) {
      return bad(res, 'servicios debe ser una lista de 1 a 5 ids de servicios distintos');
    }

    const detalle = [];
    let duracionTotal = 0;
    let total = 0;
    for (const id of servicios) {
      const servicio = await Servicio.obtenerPorId(id);
      if (!servicio || servicio.port_cita_estado !== 'ACTIVO') {
        return bad(res, `El servicio ${id} no existe o no está activo`);
      }
      detalle.push({ id: servicio.port_cita_id, precio: servicio.port_cita_precio });
      duracionTotal += servicio.port_cita_duracion_minutos;
      total += Number(servicio.port_cita_precio);
    }

    // 5. Hora de fin
    const fechaFin = sumarMinutos(fechaInicio, duracionTotal);
    if (formatearFecha(fechaFin) !== formatearFecha(fechaInicio)) {
      return bad(res, 'La cita debe terminar el mismo día en que empieza');
    }

    // 6. ¿El empleado atiende en ese horario?
    const enHorario = await Disponibilidad.estaDentroDeHorario({
      empleadoId,
      diaSemana: diaSemanaISO(fechaInicio),
      horaInicio: formatearHora(fechaInicio),
      horaFin: formatearHora(fechaFin),
    });
    if (!enHorario) {
      return bad(res, 'El empleado no atiende en ese horario', 409);
    }

    // 7. Guardar (la transacción comprueba los cruces)
    const resultado = await Cita.crear({
      clienteId,
      empleadoId,
      inicio: formatearFechaHora(fechaInicio),
      fin: formatearFechaHora(fechaFin),
      servicios: detalle,
    });

    if (resultado.error === 'EMPLEADO_OCUPADO') {
      return bad(res, 'El empleado ya tiene una cita en ese horario', 409);
    }
    if (resultado.error === 'CLIENTE_OCUPADO') {
      return bad(res, 'El cliente ya tiene una cita en ese horario', 409);
    }

    res.status(201).json({
      ok: true,
      mensaje: 'Cita agendada',
      data: {
        cita_id: resultado.citaId,
        inicio: formatearFechaHora(fechaInicio),
        fin: formatearFechaHora(fechaFin),
        duracion_minutos: duracionTotal,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al agendar la cita' });
  }
};

const listarCitas = async (req, res) => {
  try {
    const { estado, fecha } = req.query;

    if (estado && !ESTADOS.includes(estado)) {
      return bad(res, `estado debe ser uno de: ${ESTADOS.join(', ')}`);
    }
    if (fecha && !parsearFechaHora(`${fecha} 00:00`)) {
      return bad(res, 'fecha debe tener el formato AAAA-MM-DD');
    }

    const filtros = { estado, fecha };
    // Cada rol ve solo lo suyo; el administrador ve todo
    if (req.usuario.rol === 'CLIENTE') filtros.clienteId = req.usuario.id;
    if (req.usuario.rol === 'EMPLEADO') filtros.empleadoId = req.usuario.id;

    const citas = await Cita.listar(filtros);
    res.json({ ok: true, data: citas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar las citas' });
  }
};

const obtenerCita = async (req, res) => {
  try {
    const cita = await Cita.obtenerPorId(req.params.id);

    const { rol, id } = req.usuario;
    const puedeVerla =
      cita &&
      (rol === 'ADMIN' ||
        (rol === 'CLIENTE' && cita.cliente_id === id) ||
        (rol === 'EMPLEADO' && cita.id_empleado === id));

    // Si no es suya respondemos 404, para no revelar que esa cita existe
    if (!puedeVerla) {
      return bad(res, 'Cita no encontrada', 404);
    }
    res.json({ ok: true, data: cita });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la cita' });
  }
};

module.exports = { crearCita, listarCitas, obtenerCita };
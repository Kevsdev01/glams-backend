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
  horaAMinutos,
  minutosAHora,
} = require('../utils/fechas');

const ESTADOS = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'];
const PASO_MINUTOS = 30; // de cuánto en cuánto se ofrecen las horas (9:00, 9:30, 10:00...)
const HORAS_MIN_CANCELAR = process.env.CANCELACION_HORAS_MIN
  ? Number(process.env.CANCELACION_HORAS_MIN)
  : 2;

const TRANSICIONES = {
  PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['COMPLETADA', 'NO_ASISTIO', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
  NO_ASISTIO: [],
};

// Qué roles pueden llevar una cita a cada estado
const PERMITIDO = {
  CONFIRMADA: ['ADMIN'],
  CANCELADA: ['ADMIN', 'CLIENTE'],
  COMPLETADA: ['ADMIN', 'EMPLEADO'],
  NO_ASISTIO: ['ADMIN', 'EMPLEADO'],
};

const bad = (res, mensaje, codigo = 400) => res.status(codigo).json({ ok: false, mensaje });

// Valida la lista de ids y calcula duración y total; la usan crear cita y horas libres
const cargarServicios = async (ids) => {
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 5 ||
    ids.some((id) => !Number.isInteger(id) || id < 1) ||
    new Set(ids).size !== ids.length
  ) {
    return { error: 'servicios debe ser una lista de 1 a 5 ids de servicios distintos' };
  }

  const detalle = [];
  let duracionTotal = 0;
  let total = 0;
  for (const id of ids) {
    const servicio = await Servicio.obtenerPorId(id);
    if (!servicio || servicio.port_cita_estado !== 'ACTIVO') {
      return { error: `El servicio ${id} no existe o no está activo` };
    }
    detalle.push({ id: servicio.port_cita_id, precio: servicio.port_cita_precio });
    duracionTotal += servicio.port_cita_duracion_minutos;
    total += Number(servicio.port_cita_precio);
  }

  return { detalle, duracionTotal, total };
};


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
    const { error: errorServicios, detalle, duracionTotal, total } = await cargarServicios(servicios);
    if (errorServicios) {
      return bad(res, errorServicios);
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

const cambiarEstadoCita = async (req, res) => {
  try {
    const { estado, motivo } = req.body || {};

    if (!PERMITIDO[estado]) {
      return bad(res, 'estado debe ser CONFIRMADA, CANCELADA, COMPLETADA o NO_ASISTIO');
    }

    const cita = await Cita.obtenerPorId(req.params.id);
    const { rol, id } = req.usuario;
    const esDueno = rol === 'CLIENTE' && cita && cita.cliente_id === id;
    const esAsignado = rol === 'EMPLEADO' && cita && cita.id_empleado === id;

    // Si no es suya respondemos 404, para no revelar que existe
    if (!cita || !(rol === 'ADMIN' || esDueno || esAsignado)) {
      return bad(res, 'Cita no encontrada', 404);
    }

    if (!PERMITIDO[estado].includes(rol)) {
      return bad(res, 'No tienes permiso para realizar esta acción', 403);
    }

    if (!TRANSICIONES[cita.cita_estado].includes(estado)) {
      return bad(res, `No se puede pasar una cita de ${cita.cita_estado} a ${estado}`, 409);
    }

    const inicio = parsearFechaHora(cita.cita_hora_inicio.slice(0, 16));
    const ahora = new Date();

    let motivoLimpio = null;
    if (estado === 'CANCELADA') {
      if (typeof motivo !== 'string' || motivo.trim().length < 3 || motivo.trim().length > 255) {
        return bad(res, 'motivo es obligatorio (entre 3 y 255 caracteres)');
      }
      motivoLimpio = motivo.trim();

      // El cliente debe cancelar con anticipación; el administrador no tiene esa restricción
      if (rol === 'CLIENTE' && inicio.getTime() - ahora.getTime() < HORAS_MIN_CANCELAR * 3600000) {
        return bad(
          res,
          `Solo puedes cancelar con al menos ${HORAS_MIN_CANCELAR} hora(s) de anticipación`,
          409
        );
      }
    }

    if ((estado === 'COMPLETADA' || estado === 'NO_ASISTIO') && inicio > ahora) {
      return bad(res, 'Aún no ha llegado la hora de la cita', 409);
    }

    const cambiado = await Cita.cambiarEstado(cita.cita_id, {
      desde: cita.cita_estado,
      hacia: estado,
      motivo: motivoLimpio,
    });
    if (!cambiado) {
      return bad(res, 'La cita cambió de estado mientras se procesaba. Intenta de nuevo', 409);
    }

    res.json({ ok: true, mensaje: `Cita ${estado.toLowerCase()}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al cambiar el estado de la cita' });
  }
};

const horasLibres = async (req, res) => {
  try {
    const { empleadoId, fecha } = req.query;

    if (!/^\d+$/.test(empleadoId || '')) {
      return bad(res, 'empleadoId es obligatorio y debe ser un número');
    }
    const dia = parsearFechaHora(`${fecha} 00:00`);
    if (!dia) {
      return bad(res, 'fecha es obligatoria y debe tener el formato AAAA-MM-DD');
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (dia < hoy) {
      return bad(res, 'La fecha no puede ser pasada');
    }

    // servicios llega como "1,2,3"
    const ids = String(req.query.servicios || '').split(',').filter(Boolean).map(Number);
    const { error: errorServicios, duracionTotal } = await cargarServicios(ids);
    if (errorServicios) {
      return bad(res, errorServicios);
    }

    const empleado = await Usuario.buscarPorId(empleadoId);
    if (!empleado || empleado.role_nombre !== 'EMPLEADO' || empleado.user_estado !== 'ACTIVO') {
      return bad(res, 'Empleado no encontrado', 404);
    }

    const bloques = await Disponibilidad.listarBloquesDisponibles(empleadoId, diaSemanaISO(dia));
    const ocupadas = (await Cita.ocupadasDelDia(empleadoId, fecha)).map((c) => ({
      inicio: horaAMinutos(c.cita_hora_inicio.slice(11)),
      fin: horaAMinutos(c.cita_hora_fin.slice(11)),
    }));

    const ahora = new Date();
    const esHoy = fecha === formatearFecha(ahora);
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    const horas = [];
    for (const bloque of bloques) {
      const desde = horaAMinutos(bloque.disp_empl_hora_inicio);
      const hasta = horaAMinutos(bloque.disp_empl_hora_fin);

      for (let inicio = desde; inicio + duracionTotal <= hasta; inicio += PASO_MINUTOS) {
        const fin = inicio + duracionTotal;
        if (esHoy && inicio <= minutosAhora) continue; // ya pasó
        const choca = ocupadas.some((o) => o.inicio < fin && o.fin > inicio);
        if (!choca) horas.push(minutosAHora(inicio));
      }
    }

    res.json({
      ok: true,
      data: { fecha, empleado_id: Number(empleadoId), duracion_minutos: duracionTotal, horas },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar las horas libres' });
  }
};

module.exports = { crearCita, listarCitas, obtenerCita, cambiarEstadoCita, horasLibres };
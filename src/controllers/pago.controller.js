const Pago = require('../models/pago.model');

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA'];

// Si el valor del .env es inválido, el servidor no arranca y lo dice claramente
const IMPUESTO = process.env.IMPUESTO_PORCENTAJE ? Number(process.env.IMPUESTO_PORCENTAJE) : 0;
if (!Number.isFinite(IMPUESTO) || IMPUESTO < 0 || IMPUESTO > 100) {
  throw new Error('IMPUESTO_PORCENTAJE debe ser un número entre 0 y 100');
}

const bad = (res, mensaje, codigo = 400) => res.status(codigo).json({ ok: false, mensaje });

const registrarPago = async (req, res) => {
  try {
    const { citaId, metodo, referencia } = req.body || {};

    if (!Number.isInteger(citaId) || citaId < 1) {
      return bad(res, 'citaId debe ser un entero válido');
    }
    if (!METODOS.includes(metodo)) {
      return bad(res, `metodo debe ser uno de: ${METODOS.join(', ')}`);
    }

    let referenciaLimpia = null;
    if (referencia !== undefined && referencia !== null) {
      if (typeof referencia !== 'string' || referencia.trim().length > 50) {
        return bad(res, 'referencia debe ser texto de máx. 50 caracteres');
      }
      referenciaLimpia = referencia.trim() || null;
    }

    const resultado = await Pago.registrarPago({
      citaId,
      metodo,
      referencia: referenciaLimpia,
      impuestoPorcentaje: IMPUESTO,
    });

    if (resultado.error === 'CITA_NO_EXISTE') return bad(res, 'Cita no encontrada', 404);
    if (resultado.error === 'CITA_NO_COMPLETADA') {
      return bad(res, 'Solo se pueden cobrar citas en estado COMPLETADA', 409);
    }
    if (resultado.error === 'YA_PAGADA') return bad(res, 'La cita ya fue pagada', 409);
    if (resultado.error === 'SIN_SERVICIOS') return bad(res, 'La cita no tiene servicios', 409);

    res.status(201).json({
      ok: true,
      mensaje: 'Pago registrado y factura emitida',
      data: {
        pago_id: resultado.pagoId,
        factura_id: resultado.facturaId,
        fact_numero: resultado.numero,
        subtotal: resultado.subtotal,
        impuestos: resultado.impuestos,
        total: resultado.total,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return bad(res, 'Conflicto al numerar la factura. Intenta de nuevo', 409);
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el pago' });
  }
};

const listarPagos = async (req, res) => {
  try {
    const { citaId } = req.query;
    if (citaId && !/^\d+$/.test(citaId)) {
      return bad(res, 'citaId debe ser un número');
    }
    const pagos = await Pago.listar({ citaId });
    res.json({ ok: true, data: pagos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar los pagos' });
  }
};

const obtenerPago = async (req, res) => {
  try {
    const pago = await Pago.obtenerPorId(req.params.id);
    if (!pago) return bad(res, 'Pago no encontrado', 404);
    res.json({ ok: true, data: pago });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el pago' });
  }
};

module.exports = { registrarPago, listarPagos, obtenerPago };
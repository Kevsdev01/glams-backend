const Factura = require('../models/factura.model');

const bad = (res, mensaje, codigo = 400) => res.status(codigo).json({ ok: false, mensaje });

const listarFacturas = async (req, res) => {
  try {
    const { citaId } = req.query;
    if (citaId && !/^\d+$/.test(citaId)) {
      return bad(res, 'citaId debe ser un número');
    }

    const filtros = { citaId };
    // El cliente solo ve sus facturas; el administrador ve todas
    if (req.usuario.rol === 'CLIENTE') filtros.clienteId = req.usuario.id;

    const facturas = await Factura.listar(filtros);
    res.json({ ok: true, data: facturas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar las facturas' });
  }
};

const obtenerFactura = async (req, res) => {
  try {
    const factura = await Factura.obtenerPorId(req.params.id);

    const puedeVerla =
      factura && (req.usuario.rol === 'ADMIN' || factura.cliente_id === req.usuario.id);

    // Si no es suya respondemos 404, para no revelar que existe
    if (!puedeVerla) return bad(res, 'Factura no encontrada', 404);

    res.json({ ok: true, data: factura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la factura' });
  }
};

module.exports = { listarFacturas, obtenerFactura };
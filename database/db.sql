-- =====================================================
-- GLAMS NAILS SPA - Script de base de datos v2
-- ATENCION: este script ejecuta DROP SCHEMA y BORRA la base
-- `glams` actual con todos sus datos antes de recrearla.
-- =====================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `glams`;
CREATE SCHEMA IF NOT EXISTS `glams` DEFAULT CHARACTER SET utf8mb4;
USE `glams`;

-- -----------------------------------------------------
-- roles  (se crea primero porque usuarios depende de ella)
-- role_autor NO lleva FK a proposito: el primer rol se inserta
-- antes de que exista ningun usuario.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT NOT NULL AUTO_INCREMENT,
  `role_nombre` VARCHAR(20) NOT NULL,
  `role_descripcion` TEXT NOT NULL,
  `role_fecha_creacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `role_fecha_actualizacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `role_autor` INT NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_roles_nombre` (`role_nombre`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- permisos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `permisos` (
  `perm_id` INT NOT NULL AUTO_INCREMENT,
  `perm_nombre` VARCHAR(50) NOT NULL,
  `perm_descripcion` TEXT NOT NULL,
  `perm_fecha_creacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `perm_fecha_actualizacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `perm_autor` INT NOT NULL,
  PRIMARY KEY (`perm_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- permisos_has_roles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `permisos_has_roles` (
  `permisos_perm_id` INT NOT NULL,
  `roles_role_id` INT NOT NULL,
  PRIMARY KEY (`permisos_perm_id`, `roles_role_id`),
  INDEX `fk_permisos_has_roles_roles1_idx` (`roles_role_id` ASC),
  INDEX `fk_permisos_has_roles_permisos1_idx` (`permisos_perm_id` ASC),
  CONSTRAINT `fk_permisos_has_roles_permisos1`
    FOREIGN KEY (`permisos_perm_id`) REFERENCES `permisos` (`perm_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_permisos_has_roles_roles1`
    FOREIGN KEY (`roles_role_id`) REFERENCES `roles` (`role_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- usuarios  (clientes, empleados y administradores)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `user_correo` VARCHAR(100) NOT NULL,
  `user_password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `user_estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `user_token_recuperacion` VARCHAR(255) NULL,
  `user_token_expiracion` DATETIME NULL,
  `user_nombre` VARCHAR(50) NOT NULL,
  `user_apellido` VARCHAR(50) NOT NULL,
  `user_fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_telefono` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_usuarios_correo` (`user_correo`),
  INDEX `fk_usuarios_roles_idx` (`role_id` ASC),
  CONSTRAINT `fk_usuarios_roles`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- auditoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `audi_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `audi_accion` VARCHAR(45) NOT NULL,
  `audi_entidad_afectada` VARCHAR(45) NOT NULL,
  `audi_id_registro_afectado` VARCHAR(45) NOT NULL,
  `audi_detalle` TEXT NOT NULL,
  `audi_fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audi_id`),
  INDEX `fk_auditoria_usuarios1_idx` (`user_id` ASC),
  CONSTRAINT `fk_auditoria_usuarios1`
    FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`user_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- categoria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categoria` (
  `cate_id` INT NOT NULL AUTO_INCREMENT,
  `cate_nombre` VARCHAR(50) NOT NULL,
  `cate_tipo` VARCHAR(20) NOT NULL,
  `cate_descripcion` TEXT NOT NULL,
  PRIMARY KEY (`cate_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- portafolio_citas  (servicios ofrecidos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `portafolio_citas` (
  `port_cita_id` INT NOT NULL AUTO_INCREMENT,
  `cate_id` INT NOT NULL,
  `port_cita_nombre` VARCHAR(100) NOT NULL,
  `port_cita_tipo` VARCHAR(20) NOT NULL,
  `port_cita_precio` DECIMAL(10,2) NOT NULL,
  `port_cita_duracion_minutos` INT NOT NULL,
  `port_cita_estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`port_cita_id`),
  INDEX `fk_portafolio_citas_categoria1_idx` (`cate_id` ASC),
  CONSTRAINT `fk_portafolio_citas_categoria1`
    FOREIGN KEY (`cate_id`) REFERENCES `categoria` (`cate_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- cita
-- Los servicios de cada cita van en detalle_cita (una cita
-- puede tener varios). cita_hora_fin = inicio + suma de duraciones.
-- La fecha se obtiene con DATE(cita_hora_inicio).
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cita` (
  `cita_id` INT NOT NULL AUTO_INCREMENT,
  `cliente_id` INT NOT NULL,
  `id_empleado` INT NOT NULL,
  `cita_hora_inicio` DATETIME NOT NULL,
  `cita_hora_fin` DATETIME NOT NULL,
  `cita_estado` ENUM('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO') NOT NULL DEFAULT 'PENDIENTE',
  `cita_motivo_cancelacion` TEXT NULL,
  `cita_fecha_creacion` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`cita_id`),
  INDEX `idx_cita_empleado_inicio` (`id_empleado` ASC, `cita_hora_inicio` ASC),
  INDEX `idx_cita_cliente_inicio` (`cliente_id` ASC, `cita_hora_inicio` ASC),
  CONSTRAINT `chk_cita_horas` CHECK (`cita_hora_fin` > `cita_hora_inicio`),
  CONSTRAINT `fk_cita_usuarios_cliente`
    FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`user_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_cita_usuarios_empleado`
    FOREIGN KEY (`id_empleado`) REFERENCES `usuarios` (`user_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- detalle_cita  (servicios incluidos en cada cita)
-- deta_cita_precio guarda el precio al momento de agendar,
-- para que un cambio de precio futuro no altere citas pasadas.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_cita` (
  `deta_cita_id` INT NOT NULL AUTO_INCREMENT,
  `cita_id` INT NOT NULL,
  `port_cita_id` INT NOT NULL,
  `deta_cita_precio` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`deta_cita_id`),
  INDEX `fk_detalle_cita_cita1_idx` (`cita_id` ASC),
  INDEX `fk_detalle_cita_portafolio_citas1_idx` (`port_cita_id` ASC),
  CONSTRAINT `fk_detalle_cita_cita1`
    FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_cita_portafolio_citas1`
    FOREIGN KEY (`port_cita_id`) REFERENCES `portafolio_citas` (`port_cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- disponibilidad_empleado  (horario semanal por empleado)
-- dia_semana: 1 = lunes ... 7 = domingo
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `disponibilidad_empleado` (
  `disp_empl_id` INT NOT NULL AUTO_INCREMENT,
  `empleado_id` INT NOT NULL,
  `disp_empl_dia_semana` TINYINT NOT NULL,
  `disp_empl_hora_inicio` TIME NOT NULL,
  `disp_empl_hora_fin` TIME NOT NULL,
  `disp_empl_estado` ENUM('DISPONIBLE', 'NO_DISPONIBLE') NOT NULL DEFAULT 'DISPONIBLE',
  PRIMARY KEY (`disp_empl_id`),
  INDEX `fk_disponibilidad_empleado_usuarios1_idx` (`empleado_id` ASC),
  CONSTRAINT `chk_disp_dia` CHECK (`disp_empl_dia_semana` BETWEEN 1 AND 7),
  CONSTRAINT `chk_disp_horas` CHECK (`disp_empl_hora_fin` > `disp_empl_hora_inicio`),
  CONSTRAINT `fk_disponibilidad_empleado_usuarios1`
    FOREIGN KEY (`empleado_id`) REFERENCES `usuarios` (`user_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- notificacion
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `notificacion` (
  `noti_id` INT NOT NULL AUTO_INCREMENT,
  `cita_id` INT NOT NULL,
  `noti_tipo` VARCHAR(45) NOT NULL,
  `noti_canal` VARCHAR(45) NOT NULL,
  `noti_contenido` TEXT NOT NULL,
  `noti_estado` ENUM('ENVIADO', 'NO_ENVIADO') NOT NULL DEFAULT 'NO_ENVIADO',
  `noti_fecha_programada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_envio` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`noti_id`),
  INDEX `fk_notificacion_cita1_idx` (`cita_id` ASC),
  CONSTRAINT `fk_notificacion_cita1`
    FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- pregunta_encuesta
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pregunta_encuesta` (
  `preg_encu_id` INT NOT NULL AUTO_INCREMENT,
  `preg_encu_texto_pregunta` VARCHAR(255) NOT NULL,
  `preg_encu_tipo_respuesta` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`preg_encu_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- encuesta  (se crea al completar la cita; la fecha de
-- respuesta queda NULL hasta que el cliente la responde)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `encuesta` (
  `encu_id` INT NOT NULL AUTO_INCREMENT,
  `cita_id` INT NOT NULL,
  `encu_fecha_respuesta` DATETIME NULL DEFAULT NULL,
  `encu_estado` ENUM('PENDIENTE', 'RESPONDIDA') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`encu_id`),
  INDEX `fk_encuesta_cita1_idx` (`cita_id` ASC),
  CONSTRAINT `fk_encuesta_cita1`
    FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- respuesta_encuesta  (antes: repuesta_encuesta)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `respuesta_encuesta` (
  `repu_encu_id` INT NOT NULL AUTO_INCREMENT,
  `encu_id` INT NOT NULL,
  `preg_encu_id` INT NOT NULL,
  `repu_encu_valor_respuesta` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`repu_encu_id`),
  INDEX `fk_respuesta_encuesta_encuesta1_idx` (`encu_id` ASC),
  INDEX `fk_respuesta_encuesta_pregunta_encuesta1_idx` (`preg_encu_id` ASC),
  CONSTRAINT `fk_respuesta_encuesta_encuesta1`
    FOREIGN KEY (`encu_id`) REFERENCES `encuesta` (`encu_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_respuesta_encuesta_pregunta_encuesta1`
    FOREIGN KEY (`preg_encu_id`) REFERENCES `pregunta_encuesta` (`preg_encu_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- pago
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pago` (
  `pago_id` INT NOT NULL AUTO_INCREMENT,
  `cita_id` INT NOT NULL,
  `pago_proveedor` VARCHAR(45) NOT NULL,
  `pago_estado` ENUM('POR_APROBAR', 'APROBADO', 'RECHAZADO') NOT NULL DEFAULT 'POR_APROBAR',
  `pago_metodo` VARCHAR(20) NOT NULL,
  `pago_referencia_transaccion` VARCHAR(50) NULL,
  `pago_valor` DECIMAL(10,2) NOT NULL,
  `pago_fecha` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`pago_id`),
  INDEX `fk_pago_cita1_idx` (`cita_id` ASC),
  CONSTRAINT `fk_pago_cita1`
    FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- descuento_promocion  (antes: DESCUENTO_PROMOCION)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `descuento_promocion` (
  `desc_id` INT NOT NULL AUTO_INCREMENT,
  `desc_nombre` VARCHAR(60) NOT NULL,
  `desc_tipo` VARCHAR(20) NOT NULL,
  `desc_valor` INT NOT NULL,
  `desc_condiciones` VARCHAR(255) NULL,
  `desc_fecha_inicio` DATETIME NOT NULL,
  `desc_fecha_fin` DATETIME NOT NULL,
  `desc_estado` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`desc_id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- factura  (desc_id es opcional: solo si se aplico una promocion)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `factura` (
  `fact_id` INT NOT NULL AUTO_INCREMENT,
  `pago_id` INT NOT NULL,
  `desc_id` INT NULL,
  `fact_descuento` INT NOT NULL DEFAULT 0,
  `fact_numero` INT NOT NULL,
  `fact_fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fact_subtotal` DECIMAL(10,2) NOT NULL,
  `fact_impuestos` DECIMAL(10,2) NOT NULL,
  `fact_valor_descuento` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fact_total` DECIMAL(10,2) NOT NULL,
  `fact_estado` ENUM('EMITIDA', 'ANULADA') NOT NULL DEFAULT 'EMITIDA',
  PRIMARY KEY (`fact_id`),
  UNIQUE KEY `uq_factura_numero` (`fact_numero`),
  INDEX `fk_factura_pago1_idx` (`pago_id` ASC),
  INDEX `fk_factura_descuento_promocion1_idx` (`desc_id` ASC),
  CONSTRAINT `fk_factura_pago1`
    FOREIGN KEY (`pago_id`) REFERENCES `pago` (`pago_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_factura_descuento_promocion1`
    FOREIGN KEY (`desc_id`) REFERENCES `descuento_promocion` (`desc_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- detalle_factura
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_factura` (
  `deta_fact_id` INT NOT NULL AUTO_INCREMENT,
  `fact_id` INT NOT NULL,
  `port_cita_id` INT NOT NULL,
  `deta_fact_cantidad` INT NOT NULL DEFAULT 1,
  `deta_fact_precio_unitario` DECIMAL(10,2) NOT NULL,
  `deta_fact_subtotal_linea` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`deta_fact_id`),
  INDEX `fk_detalle_factura_factura1_idx` (`fact_id` ASC),
  INDEX `fk_detalle_factura_portafolio_citas1_idx` (`port_cita_id` ASC),
  CONSTRAINT `fk_detalle_factura_factura1`
    FOREIGN KEY (`fact_id`) REFERENCES `factura` (`fact_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_factura_portafolio_citas1`
    FOREIGN KEY (`port_cita_id`) REFERENCES `portafolio_citas` (`port_cita_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- movimiento_puntos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `movimiento_puntos` (
  `movi_punt_id` INT NOT NULL AUTO_INCREMENT,
  `fact_id` INT NOT NULL,
  `movi_punt_tipo` VARCHAR(20) NOT NULL,
  `movi_puntos` INT NOT NULL,
  `movi_punt_fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`movi_punt_id`),
  INDEX `fk_movimiento_puntos_factura1_idx` (`fact_id` ASC),
  CONSTRAINT `fk_movimiento_puntos_factura1`
    FOREIGN KEY (`fact_id`) REFERENCES `factura` (`fact_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- reembolso
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `reembolso` (
  `reem_id` INT NOT NULL AUTO_INCREMENT,
  `fact_id` INT NOT NULL,
  `reem_motivo` TEXT NOT NULL,
  `reem_estado` ENUM('PROCESANDO', 'PROCESADO') NOT NULL DEFAULT 'PROCESANDO',
  `reem_valor_reembolsado` DECIMAL(10,2) NOT NULL,
  `reem_fecha_solicitud` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reem_fecha_procesado` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`reem_id`),
  INDEX `fk_reembolso_factura1_idx` (`fact_id` ASC),
  CONSTRAINT `fk_reembolso_factura1`
    FOREIGN KEY (`fact_id`) REFERENCES `factura` (`fact_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- egreso  (gastos del salon, para la gestion de finanzas)
-- user_id = usuario que registro el egreso
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `egreso` (
  `egre_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `egre_concepto` VARCHAR(100) NOT NULL,
  `egre_categoria` VARCHAR(45) NOT NULL,
  `egre_valor` DECIMAL(10,2) NOT NULL,
  `egre_fecha` DATE NOT NULL,
  `egre_descripcion` TEXT NULL,
  `egre_fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`egre_id`),
  INDEX `fk_egreso_usuarios1_idx` (`user_id` ASC),
  CONSTRAINT `fk_egreso_usuarios1`
    FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`user_id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Datos obligatorios: roles
-- (los ids quedan: 1 = ADMIN, 2 = CLIENTE, 3 = EMPLEADO)
-- -----------------------------------------------------
INSERT INTO `roles` (`role_nombre`, `role_descripcion`, `role_autor`) VALUES
('ADMIN', 'Rol con acceso total al sistema', 1),
('CLIENTE', 'Rol para usuarios finales', 1),
('EMPLEADO', 'Rol para el personal que atiende las citas', 1);

SELECT * FROM `roles`;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
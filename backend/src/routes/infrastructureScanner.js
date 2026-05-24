import express from 'express'
import rateLimit from 'express-rate-limit'
import infrastructureScannerController from '../controllers/infrastructureScannerController.js'

const router = express.Router()
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiados escaneos solicitados desde esta IP. Intentá nuevamente más tarde.'
  }
})

// Ruta para iniciar escaneo completo de infraestructura
router.post('/scan', scanLimiter, infrastructureScannerController.performFullScan.bind(infrastructureScannerController))

// Ruta para obtener resultado de escaneo por ID
router.get('/scan/:scanId', infrastructureScannerController.getScanResult.bind(infrastructureScannerController))

export default router

import multer from 'multer'
import sharp from 'sharp'
import exifr from 'exifr'
// import pdfParse from 'pdf-parse' // Removido por problemas de compatibilidad
import mammoth from 'mammoth'

const MAX_FILE_SIZE = Number.parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

const hasAllowedSignature = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false
  }

  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }

  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }

  if (mimetype === 'application/pdf') {
    return buffer.subarray(0, 4).toString() === '%PDF'
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer.subarray(0, 4).toString('binary') === 'PK\u0003\u0004'
  }

  return false
}

// Configurar multer para subida de archivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no soportado'), false)
    }
  }
})

/**
 * Controlador para análisis de archivos
 */
export class FileAnalysisController {
  
  /**
   * Middleware de multer para subida de archivos
   */
  static uploadMiddleware = upload.single('file')

  /**
   * Extrae metadatos EXIF de imágenes
   */
  static async extractImageMetadata(buffer, filename) {
    try {
      // Usar exifr para extraer metadatos EXIF
      const exifData = await exifr.parse(buffer, {
        gps: true,
        pick: [
          'Make', 'Model', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
          'Software', 'Artist', 'Copyright', 'ImageWidth', 'ImageHeight',
          'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit',
          'WhiteBalance', 'Flash', 'FocalLength', 'ExposureTime', 'FNumber',
          'ISO', 'ExposureProgram', 'MeteringMode', 'ColorSpace',
          'latitude', 'longitude', 'GPSAltitude', 'GPSImgDirection'
        ]
      })

      // Usar sharp para obtener información adicional de la imagen
      const imageInfo = await sharp(buffer).metadata()

      const metadata = {
        filename,
        filesize: buffer.length,
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
        density: imageInfo.density,
        hasAlpha: imageInfo.hasAlpha,
        channels: imageInfo.channels,
        exif: exifData || {},
        gps: null
      }

      // Procesar coordenadas GPS si están disponibles
      if (exifData && (exifData.latitude || exifData.longitude)) {
        metadata.gps = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          altitude: exifData.GPSAltitude,
          direction: exifData.GPSImgDirection
        }
      }

      return metadata
    } catch (error) {
      console.error('Error extrayendo metadatos de imagen:', error)
      return {
        filename,
        filesize: buffer.length,
        error: 'No se pudieron extraer los metadatos EXIF',
        exif: {},
        gps: null
      }
    }
  }

  /**
   * Extrae metadatos de documentos PDF
   */
  static async extractPdfMetadata(buffer, filename) {
    try {
      // Implementación simplificada sin pdf-parse para evitar problemas de compatibilidad
      // En una implementación completa, se podría usar pdfjs-dist o pdf-lib

      return {
        filename,
        filesize: buffer.length,
        type: 'pdf',
        metadata: {
          note: 'Análisis básico de PDF implementado. Para análisis completo, configure las librerías de PDF apropiadas.'
        },
        // Información básica que podemos extraer del buffer
        file_header: buffer.slice(0, 8).toString(),
        is_pdf: buffer.slice(0, 4).toString() === '%PDF',
        estimated_version: buffer.slice(0, 8).toString().includes('PDF-') ?
          buffer.slice(5, 8).toString() : 'unknown'
      }
    } catch (error) {
      console.error('Error extrayendo metadatos de PDF:', error)
      return {
        filename,
        filesize: buffer.length,
        type: 'pdf',
        error: 'No se pudieron extraer los metadatos del PDF'
      }
    }
  }

  /**
   * Extrae metadatos de documentos DOCX
   */
  static async extractDocxMetadata(buffer, filename) {
    try {
      // Extraer texto del documento
      const textResult = await mammoth.extractRawText({ buffer })
      
      // Mammoth no extrae metadatos directamente, pero podemos obtener información básica
      return {
        filename,
        filesize: buffer.length,
        type: 'docx',
        text_length: textResult.value.length,
        text_preview: textResult.value.substring(0, 500),
        messages: textResult.messages,
        // Para metadatos más detallados necesitaríamos una librería adicional
        metadata: {
          extracted_text_length: textResult.value.length,
          has_content: textResult.value.length > 0
        }
      }
    } catch (error) {
      console.error('Error extrayendo metadatos de DOCX:', error)
      return {
        filename,
        filesize: buffer.length,
        type: 'docx',
        error: 'No se pudieron extraer los metadatos del DOCX'
      }
    }
  }


  /**
   * Endpoint principal para análisis de archivos
   * POST /api/file-analysis/analyze
   */
  static async analyzeFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        })
      }

      const { buffer, originalname, mimetype, size } = req.file
      const fileType = mimetype.split('/')[0]

      if (!hasAllowedSignature(buffer, mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'La firma del archivo no coincide con el tipo declarado'
        })
      }
      
      let analysisResult = {
        filename: originalname,
        mimetype,
        size,
        type: fileType,
        analyzed_at: new Date().toISOString()
      }

      // Analizar según el tipo de archivo
      if (fileType === 'image') {
        // Extraer metadatos de imagen
        const imageMetadata = await FileAnalysisController.extractImageMetadata(buffer, originalname)
        analysisResult.image_metadata = imageMetadata


      } else if (mimetype === 'application/pdf') {
        // Extraer metadatos de PDF
        const pdfMetadata = await FileAnalysisController.extractPdfMetadata(buffer, originalname)
        analysisResult.document_metadata = pdfMetadata

      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extraer metadatos de DOCX
        const docxMetadata = await FileAnalysisController.extractDocxMetadata(buffer, originalname)
        analysisResult.document_metadata = docxMetadata
      }

      res.json({
        success: true,
        data: analysisResult
      })

    } catch (error) {
      console.error('Error analizando archivo:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { message: error.message })
      })
    }
  }

  /**
   * Obtener tipos de archivo soportados
   * GET /api/file-analysis/supported-types
   */
  static async getSupportedTypes(req, res) {
    try {
      const supportedTypes = {
        images: {
          formats: ['JPEG', 'JPG', 'PNG'],
          mimetypes: ['image/jpeg', 'image/jpg', 'image/png'],
          features: [
            'Extracción de metadatos EXIF',
            'Coordenadas GPS',
            'Información de cámara',
            'Fecha y hora de captura',
          ]
        },
        documents: {
          formats: ['PDF', 'DOCX'],
          mimetypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          features: [
            'Metadatos del documento',
            'Información de autor',
            'Fechas de creación/modificación',
            'Software utilizado',
            'Extracción de texto'
          ]
        },
        limits: {
          max_file_size: `${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          max_file_size_bytes: MAX_FILE_SIZE
        }
      }

      res.json({
        success: true,
        data: supportedTypes
      })
    } catch (error) {
      console.error('Error obteniendo tipos soportados:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}

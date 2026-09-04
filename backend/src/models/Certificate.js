import mongoose from 'mongoose'

const certificateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  version: { type: Number, required: true },
  learnerName: { type: String, required: true, maxlength: 100 },
  courseId: { type: String, required: true },
  courseTitle: { type: String, required: true },
  issuer: { type: String, required: true },
  issuedAt: { type: String, required: true },
  score: { type: Number, required: true },
  kind: { type: String, enum: ['assessment'], required: true },
  signature: { type: String, required: true },
  revokedAt: { type: Date, default: null },
}, { versionKey: false, bufferCommands: false })

export default mongoose.model('Certificate', certificateSchema)

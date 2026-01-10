import { Request, Response } from 'express';
// Mantenemos tu import del monorepo (¡Esto es lo correcto!)
import { prisma } from '@rvrs/database'; 
// Mantenemos tu configuración de Kafka existente
import { sendEvent } from '../config/kafka'; 

export const createComplaint = async (req: Request, res: Response) => {
  try {
    // 1. Extraer datos del formulario (Texto)
    // NOTA: Ya no extraemos 'evidenceUrl' de aquí, porque no viene en el JSON
    const { title, description, building, userId, evidenceType } = req.body;

    // 2. Extraer la URL del archivo (Backblaze)
    // Multer-S3 guarda la info del archivo en 'req.file'
    // La propiedad 'location' es la URL pública de Backblaze
    const fileData = req.file as any;
    const evidenceUrl = fileData?.location || null;

    // 3. Validación básica
    if (!title || !description || !building || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 4. Guardar en Base de Datos (Command - ACID)
    const newComplaint = await prisma.complaint.create({
      data: {
        title,
        description,
        building,    
        userId,      
        evidenceUrl, // <--- Aquí va la URL real de la nube
        evidenceType: evidenceType || 'IMAGE',
        status: 'RECEIVED'
      }
    });

    // 5. Publicar Evento en Kafka
    // OJO: Asegúrate que el topic sea 'complaint.received' si así lo espera tu AI Worker
    // o 'complaint.created' si así lo configuraste en Python.
    // Usaremos 'complaint.received' que es el estándar que veníamos hablando.
    await sendEvent('complaint.received', {
      complaintId: newComplaint.id,
      title: newComplaint.title, // La IA necesita el título también
      description: newComplaint.description,
      evidenceUrl: newComplaint.evidenceUrl // ¡La IA recibirá el link a la foto!
    });

    // 6. Responder
    res.status(201).json({
      message: 'Complaint created successfully',
      data: newComplaint
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
};
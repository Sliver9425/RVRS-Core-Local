import { Request, Response } from 'express';
import { prisma } from '@rvrs/database'; 
import { sendEvent } from '../config/kafka'; 

// 1. 🔥 IMPORTAR NUESTRO CLIENTE RABBITMQ
// (Asegúrate de haber creado el archivo src/lib/rabbitmq.ts que vimos antes)
import { rabbit } from '../config/rabbitmq';

export const createComplaint = async (req: Request, res: Response) => {
  try {
    // --- Extracción y Validación (Igual que antes) ---
    const { title, description, building, userId, evidenceType } = req.body;
    const fileData = req.file as any;
    const evidenceUrl = fileData?.location || null;

    if (!title || !description || !building || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // --- 4. Guardar en Base de Datos (Command - ACID) ---
    const newComplaint = await prisma.complaint.create({
      data: {
        title,
        description,
        building,    
        userId,      
        evidenceUrl, 
        evidenceType: evidenceType || 'IMAGE',
        status: 'RECEIVED'
      }
    });

    // ============================================================
    // ESTRATEGIA DE MENSAJERÍA HÍBRIDA (Polyglot Messaging)
    // ============================================================

    // 5.A. KAFKA -> Para el AI Worker y Auditoría (Alto volumen / Datos)
    // La IA escuchará 'complaint.received' para analizar la imagen
    await sendEvent('complaint.received', {
      complaintId: newComplaint.id,
      title: newComplaint.title,
      description: newComplaint.description,
      evidenceUrl: newComplaint.evidenceUrl 
    });

    // 5.B. RABBITMQ -> Para Notificaciones (Transaccional / Tareas)
    // El Notification Service escuchará esto para enviar un Email
    // "Fire and Forget": No esperamos (await) obligatoriamente si no es crítico,
    // pero aquí ponemos await para asegurar que se encole.
    await rabbit.publishEvent('complaint.created', {
      id: newComplaint.id,
      title: newComplaint.title,
      userId: userId, // El servicio de notificaciones buscará el email de este ID
      status: 'RECEIVED',
      timestamp: new Date()
    });

    // ============================================================

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
import { Request, Response } from 'express';
import { prisma } from '@rvrs/database'; 
import { sendEvent } from '../config/kafka'; 


import { rabbit } from '../config/rabbitmq';

export const createComplaint = async (req: Request, res: Response) => {
  try {
    
    const { title, description, building, userId, evidenceType } = req.body;
    const fileData = req.file as any;
    const evidenceUrl = fileData?.location || null;

    if (!title || !description || !building || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    
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

    
    await sendEvent('complaint.received', {
      complaintId: newComplaint.id,
      title: newComplaint.title,
      description: newComplaint.description,
      evidenceUrl: newComplaint.evidenceUrl 
    });

    
    await rabbit.publishEvent('complaint.created', {
      id: newComplaint.id,
      title: newComplaint.title,
      userId: userId, 
      status: 'RECEIVED',
      timestamp: new Date()
    });

    
    res.status(201).json({
      message: 'Complaint created successfully',
      data: newComplaint
    });

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
};
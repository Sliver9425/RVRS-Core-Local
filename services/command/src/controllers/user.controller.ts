import { Request, Response } from 'express';
// Importamos 'Role' para usar el Enum correcto
import { prisma, Role } from '@rvrs/database'; 

export const createUser = async (req: Request, res: Response) => {
  try {
    // 1. Recibimos 'name' del JSON, pero sabemos que en la DB es 'fullName'
    const { id, email, password, name } = req.body; 

    // Validación
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields (email, password, name)' });
    }

    const newUser = await prisma.user.create({
      data: {
        id: id || undefined,
        email,
        password,
        
        // --- CORRECCIÓN 1: EL NOMBRE REAL ---
        // Asignamos la variable 'name' al campo 'fullName' de la DB
        fullName: name, 

        // --- CORRECCIÓN 2: EL ROL VÁLIDO ---
        // Usamos Role.STUDENT porque es el que definiste en el schema
        role: Role.STUDENT 
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      data: newUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
};
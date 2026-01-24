import { Request, Response } from 'express';

import { prisma, Role } from '@rvrs/database'; 

export const createUser = async (req: Request, res: Response) => {
  try {
    
    const { id, email, password, name } = req.body; 

    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields (email, password, name)' });
    }

    const newUser = await prisma.user.create({
      data: {
        id: id || undefined,
        email,
        password,
        
        
        fullName: name, 

        
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
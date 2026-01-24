import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@rvrs/database';
import jwt from 'jsonwebtoken';

const router: Router = Router();


router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!email.endsWith('@uce.edu.ec')) {
      return res.status(400).json({ 
        error: 'Seguridad: Solo se permiten correos de la Universidad Central (@uce.edu.ec)' 
      });
    }

    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El usuario ya existe' });

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword, role }
    });

    res.status(201).json({ message: 'Usuario creado', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciales inválidas' });

    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123', 
      { expiresIn: '8h' }
    );

    
    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

export default router;
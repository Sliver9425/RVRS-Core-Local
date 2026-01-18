import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@rvrs/database';
import jwt from 'jsonwebtoken';

const router: Router = Router();

// Endpoint de Registro
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!email.endsWith('@uce.edu.ec')) {
      return res.status(400).json({ 
        error: 'Seguridad: Solo se permiten correos de la Universidad Central (@uce.edu.ec)' 
      });
    }

    // 1. Verificar si existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El usuario ya existe' });

    // 2. Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear en DB
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

    // 1. Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciales inválidas' });

    // 3. Generar Token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123', // Usa una clave segura en producción
      { expiresIn: '8h' }
    );

    // 4. Responder con el token y datos del usuario
    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  }
});

export default router;
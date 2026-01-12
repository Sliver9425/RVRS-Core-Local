import { Router } from 'express';
import { createUser } from '../controllers/user.controller';

const router: Router = Router();


// POST /users
router.post('/', createUser);

export default router;
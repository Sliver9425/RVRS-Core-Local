import { Router } from 'express';
import { createComplaint } from '../controllers/complaint.controller';
import { upload } from '../config/storage';

const router: Router = Router();

/**
 * @swagger
 * /complaints:
 *      post:
 *              summary: Crear una nueva denuncia
 *              tags: [Complaints]
 *              requestBody:
 *                      required: true
 *                      content:
 *                              multipart/form-data:
 *                                      schema:
 *                                              type: object
 *                                              properties:
 *                                                      title:
 *                                                          type: string
 *                                                      description:
 *                                                          type: string
 *                                                      building:
 *                                                          type: string
 *                                                          enum: [FACULTAD_INGENIERIA, BIBLIOTECA_CENTRAL]
 *                                                      userId:
 *                                                          type: string
 *                                                          format: uuid
 *                                                      evidence:
 *                                                          type: string
 *                                                          format: binary
 *                                                      evidenceType:
 *                                                          type: string
 *                                                          enum: [IMAGE, VIDEO]
 *              responses:
 *                      201:
 *                              description: Denuncia creada exitosamente
 *                      500:
 *                              description: Error del servidor
 */
router.post('/', upload.single('evidence'), createComplaint);

export default router;
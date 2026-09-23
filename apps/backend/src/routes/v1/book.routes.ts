import { Router } from 'express';
import { BookController } from '../../controllers/v1/book.controller.js';
import { authenticator } from '../../middleware/authenticator.js';

const router = Router();

router.get('/', BookController.getAll);
router.get('/:id', BookController.getById);
router.post('/', authenticator, BookController.create);
router.put('/:id', authenticator, BookController.update);
router.delete('/:id', authenticator, BookController.delete);

export default router;

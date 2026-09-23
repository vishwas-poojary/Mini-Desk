import { Router } from 'express';
import { CheckoutController } from '../../controllers/v1/checkout.controller.js';
import { authenticator } from '../../middleware/authenticator.js';

const router = Router();

router.get('/', authenticator, CheckoutController.getAll);
router.get('/:id', authenticator, CheckoutController.getById);
router.post('/', authenticator, CheckoutController.create);
router.post('/:id/return', authenticator, CheckoutController.returnBook);

export default router;

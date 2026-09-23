import { Router } from 'express';
import { MemberController } from '../../controllers/v1/member.controller.js';
import { authenticator } from '../../middleware/authenticator.js';

const router = Router();

router.get('/', authenticator, MemberController.getAll);
router.get('/:id', authenticator, MemberController.getById);
router.post('/', authenticator, MemberController.create);
router.put('/:id', authenticator, MemberController.update);
router.delete('/:id', authenticator, MemberController.delete);

export default router;

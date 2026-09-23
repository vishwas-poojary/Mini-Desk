import { Router } from 'express';
import { AuthController } from '../../controllers/v1/auth.controller.js';
import { authenticator } from '../../middleware/authenticator.js';

const router = Router();

// Public auth routes
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Passkey public routes
router.get('/passkey/auth-options', AuthController.getPasskeyAuthOptions);
router.post('/passkey/verify-auth', AuthController.verifyPasskeyAuth);

// Protected routes (requires Bearer token verified in Redis cache)
router.get('/me', authenticator, AuthController.me);
router.get('/passkey/register-options', authenticator, AuthController.getPasskeyRegisterOptions);
router.post('/passkey/verify-register', authenticator, AuthController.verifyPasskeyRegister);

export default router;

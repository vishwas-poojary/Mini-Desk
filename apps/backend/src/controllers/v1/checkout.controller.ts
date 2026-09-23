import type { Request, Response } from 'express';
import { CheckoutService } from '../../services/checkout.service.js';

export class CheckoutController {
  static getAll(req: Request, res: Response) {
    const checkouts = CheckoutService.getAll();
    res.json(checkouts);
  }

  static getById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const checkout = CheckoutService.getById(id);
    if (!checkout) {
      res.status(404).json({ message: 'Checkout record not found' });
      return;
    }
    res.json(checkout);
  }

  static create(req: Request, res: Response) {
    const { memberId, bookId, days } = req.body;
    if (!memberId || !bookId) {
      res.status(400).json({ message: 'memberId and bookId are required' });
      return;
    }

    try {
      const created = CheckoutService.createCheckout(memberId, bookId, days ? Number(days) : 14);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to create checkout' });
    }
  }

  static returnBook(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = CheckoutService.returnBook(id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to return book' });
    }
  }
}

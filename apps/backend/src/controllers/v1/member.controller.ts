import type { Request, Response } from 'express';
import { MemberService } from '../../services/member.service.js';

export class MemberController {
  static getAll(req: Request, res: Response) {
    const members = MemberService.getAll();
    res.json(members);
  }

  static getById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const member = MemberService.getById(id);
    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }
    res.json(member);
  }

  static create(req: Request, res: Response) {
    const { name, email, phone, status, membershipNumber } = req.body;
    if (!name || !email) {
      res.status(400).json({ message: 'Name and email are required' });
      return;
    }
    const created = MemberService.create({
      name,
      email,
      phone: phone || '',
      status: status || 'active',
      membershipNumber: membershipNumber || `LIB-${Date.now().toString().slice(-4)}`,
    });
    res.status(201).json(created);
  }

  static update(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = MemberService.update(id, req.body);
    if (!updated) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }
    res.json(updated);
  }

  static delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = MemberService.delete(id);
    if (!success) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }
    res.json({ success: true, message: 'Member deleted' });
  }
}

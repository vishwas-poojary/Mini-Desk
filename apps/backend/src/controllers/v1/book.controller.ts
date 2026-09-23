import type { Request, Response } from 'express';
import { BookService } from '../../services/book.service.js';

export class BookController {
  static getAll(req: Request, res: Response) {
    const books = BookService.getAll();
    res.json(books);
  }

  static getById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const book = BookService.getById(id);
    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json(book);
  }

  static create(req: Request, res: Response) {
    const { isbn, title, author, category, totalCopies, shelfLocation, publishedYear } = req.body;
    if (!title || !author) {
      res.status(400).json({ message: 'Title and author are required' });
      return;
    }
    const created = BookService.create({
      isbn: isbn || 'N/A',
      title,
      author,
      category: category || 'General',
      totalCopies: Number(totalCopies) || 1,
      shelfLocation: shelfLocation || 'General Stack',
      publishedYear: Number(publishedYear) || new Date().getFullYear(),
    });
    res.status(201).json(created);
  }

  static update(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = BookService.update(id, req.body);
    if (!updated) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json(updated);
  }

  static delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = BookService.delete(id);
    if (!success) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json({ success: true, message: 'Book deleted' });
  }
}

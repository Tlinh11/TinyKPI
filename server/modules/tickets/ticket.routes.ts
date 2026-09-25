import { Router } from 'express';
import { ticketController } from './ticket.controller.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', ticketController.getTickets);
router.post('/', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

export default router;

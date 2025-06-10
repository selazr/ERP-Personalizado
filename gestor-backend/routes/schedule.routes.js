// src/routes/schedule.routes.js
import { Router } from 'express';
import {
  createSchedule,
  getScheduleByWorker,
  deleteScheduleByDate
} from '../controllers/schedule.controller.js';

const router = Router();

router.post('/', createSchedule);
router.get('/:trabajador_id', getScheduleByWorker);
router.delete('/:trabajador_id/:fecha', deleteScheduleByDate);

export default router;

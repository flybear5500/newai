import { Router } from 'express';
import route1 from './handle-command.js';
import route2 from './node-question.js';
// importez d'autres fichiers de route selon vos besoins

const router = Router();

router.use('/devhandle-command', route1);
router.use('/devnode-question', route2);
// utilisez d'autres routes selon vos besoins

export default router;

import { Router } from 'express';
import {
    addTool,
    getCategories,
    getToolById,
    getTools,
    getToolsByCategories,
    updateTool
} from "../controllers/toolController";

const router = Router();



router.post('/', addTool);
router.put('/', updateTool);
router.get('/', getToolById)
router.get('/all', getTools)
router.get('/categories', getCategories)
router.get('/tools-by-category', getToolsByCategories)

export default router;

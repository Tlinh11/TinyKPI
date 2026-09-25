import { Router } from 'express';
import { bscController } from './bsc.controller.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

// Strategy Map & Scorecard
router.get('/strategy-map', bscController.getStrategyMap);

// Strategic Objectives
router.post('/objectives', requirePermission('bsc_strategy.manage'), bscController.createObjective);
router.put('/objectives/:id', requirePermission('bsc_strategy.manage'), bscController.updateObjective);
router.delete('/objectives/:id', requirePermission('bsc_strategy.manage'), bscController.deleteObjective);

// KPI Indicators
router.post('/kpis', requirePermission('bsc_strategy.manage'), bscController.createKpi);
router.put('/kpis/:id', requirePermission('bsc_strategy.manage'), bscController.updateKpi);
router.delete('/kpis/:id', requirePermission('bsc_strategy.manage'), bscController.deleteKpi);

// BSC Reports
router.get('/reports', bscController.getReports);
router.post('/reports', requirePermission('bsc_strategy.manage'), bscController.createReport);
router.delete('/reports/:id', requirePermission('bsc_strategy.manage'), bscController.deleteReport);

// SWOT Analysis
router.get('/swot', bscController.getSwot);
router.post('/swot', requirePermission('bsc_strategy.manage'), bscController.createSwotItem);
router.delete('/swot/:id', requirePermission('bsc_strategy.manage'), bscController.deleteSwotItem);

// Strategy Matrix (SO, WO, ST, WT)
router.get('/strategy-matrix', bscController.getStrategyMatrix);
router.post('/strategy-matrix', requirePermission('bsc_strategy.manage'), bscController.createStrategyMatrixItem);
router.put('/strategy-matrix/:id', requirePermission('bsc_strategy.manage'), bscController.updateStrategyMatrixItem);
router.delete('/strategy-matrix/:id', requirePermission('bsc_strategy.manage'), bscController.deleteStrategyMatrixItem);

export default router;


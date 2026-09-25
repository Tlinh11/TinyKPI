import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

// 1. Roles & Permissions RBAC Matrix
router.get('/roles', settingsController.getRoles);
router.post('/roles', settingsController.createRole);
router.put('/roles/:id', settingsController.updateRole);
router.put('/roles/:id/permissions', settingsController.updateRolePermissions);
router.delete('/roles/:id', settingsController.deleteRole);
router.get('/permissions', settingsController.getPermissions);

// 2. Org-Chart Tree
router.get('/org-chart', settingsController.getOrgChart);

// 3. Employee Leave Records
router.get('/leaves', settingsController.getLeaves);
router.post('/leaves', settingsController.createLeave);
router.put('/leaves/:id', settingsController.updateLeave);
router.delete('/leaves/:id', settingsController.deleteLeave);

// 4. Form Templates
router.get('/forms', settingsController.getForms);
router.post('/forms', settingsController.createForm);
router.put('/forms/:id', settingsController.updateForm);
router.delete('/forms/:id', settingsController.deleteForm);

// 5. AI KPI Rules & AI Generator
router.get('/ai-rules', settingsController.getAiRules);
router.post('/ai-rules', settingsController.createAiRule);
router.post('/ai-rules/generate', settingsController.generateAiKpis);
router.post('/ai-rules/bulk-save', settingsController.bulkSaveAiRules);
router.post('/ai-rules/apply-to-kpis', settingsController.applyAiKpisToScorecard);
router.delete('/ai-rules/:id', settingsController.deleteAiRule);

// 6. System & Email Settings
router.get('/system', settingsController.getSystemSettings);
router.put('/system', settingsController.updateSystemSettings);
router.post('/system/test-email', settingsController.testEmail);

export default router;

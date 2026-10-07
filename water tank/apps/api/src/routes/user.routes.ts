import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Only ADMINs can access user management routes
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", userController.list);
router.post("/", userController.create);
router.patch("/:id", userController.update);
router.delete("/:id", userController.remove);

export { router as userRoutes };

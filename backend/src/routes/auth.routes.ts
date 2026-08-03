// routes are to map the incoming URL to the correct controller function. no business logic. the actual business logic should be in the service layer, which is called by the controller.

import { Router } from "express";

import {
  getCurrentUserHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();

authRouter.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");   // prevents user/session responses from being cached.
  next();
});

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get(
  "/me",                 // only /me is protected because it returns the current user's info
  authenticate,
  getCurrentUserHandler,
);
authRouter.post("/logout", logoutHandler);  // logout is made idempotent so expired session can also be cleared  
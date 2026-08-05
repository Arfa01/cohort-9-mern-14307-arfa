import { Router } from "express";

import {
  createNoteHandler,
  deleteNoteHandler,
  getNoteHandler,
  listNotesHandler,
  updateNoteHandler,
} from "../controllers/note.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const noteRouter = Router();

noteRouter.use((_request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  next();
});

noteRouter.use(authenticate);

noteRouter.post("/", createNoteHandler);
noteRouter.get("/", listNotesHandler);
noteRouter.get("/:noteId", getNoteHandler);
noteRouter.patch("/:noteId", updateNoteHandler);
noteRouter.delete("/:noteId", deleteNoteHandler);

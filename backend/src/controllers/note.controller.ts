import type { Request, RequestHandler } from "express";
import type { ZodError } from "zod";

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "../services/note.service.js";
import { AppError } from "../utils/app-error.js";
import {
  createNoteSchema,
  updateNoteSchema,
} from "../validation/note.schemas.js";

function createValidationError(error: ZodError): AppError {
  return new AppError(
    400,
    "VALIDATION_ERROR",
    "The submitted data is invalid.",
    {
      details: error.issues.map((issue) => ({
        field:
          issue.path.length === 0
            ? "body"
            : issue.path.map(String).join("."),
        message: issue.message,
      })),
    },
  );
}

function getAuthenticatedUserId(request: Request): string {
  const userId = request.auth?.userId;

  if (userId === undefined) {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }

  return userId;
}

function getNoteId(request: Request): string {
  const noteId = request.params.noteId;

  return typeof noteId === "string" ? noteId : "";
}

export const createNoteHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const result = createNoteSchema.safeParse(request.body);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  const userId = getAuthenticatedUserId(request);
  const note = await createNote(userId, result.data);

  request.log.info(
    { userId, noteId: note.id },
    "Note created",
  );

  response.status(201).json({
    success: true,
    data: {
      note,
    },
  });
};

export const listNotesHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const userId = getAuthenticatedUserId(request);
  const notes = await listNotes(userId);

  response.status(200).json({
    success: true,
    data: {
      notes,
    },
  });
};

export const getNoteHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const userId = getAuthenticatedUserId(request);
  const note = await getNote(
    userId,
    getNoteId(request),
  );

  response.status(200).json({
    success: true,
    data: {
      note,
    },
  });
};

export const updateNoteHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const result = updateNoteSchema.safeParse(request.body);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  const userId = getAuthenticatedUserId(request);
  const note = await updateNote(
    userId,
    getNoteId(request),
    result.data,
  );

  request.log.info(
    { userId, noteId: note.id },
    "Note updated",
  );

  response.status(200).json({
    success: true,
    data: {
      note,
    },
  });
};

export const deleteNoteHandler: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  const userId = getAuthenticatedUserId(request);
  const noteId = getNoteId(request);

  await deleteNote(userId, noteId);

  request.log.info(
    { userId, noteId },
    "Note deleted",
  );

  response.status(200).json({
    success: true,
    data: {
      message: "Note deleted successfully.",
    },
  });
};

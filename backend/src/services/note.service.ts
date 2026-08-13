import mongoose from "mongoose";
import sanitizeHtml, { type IOptions } from "sanitize-html";

import {
  NoteModel,
  type NoteDocument,
} from "../models/note.model.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateNoteInput,
  UpdateNoteInput,
} from "../validation/note.schemas.js";

const MAX_STORED_CONTENT_LENGTH = 100_000;

const sanitizationOptions: IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "pre",
    "code",
    "a",
  ],
  allowedAttributes: {
    a: ["href"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
  nestingLimit: 20,
  nonTextTags: [
    "script",
    "style",
    "textarea",
    "option",
    "noscript",
    "xmp",
  ],
};

export interface PublicNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function toPublicNote(note: NoteDocument): PublicNote {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function noteNotFoundError(): AppError {
  return new AppError(
    404,
    "NOTE_NOT_FOUND",
    "The requested note was not found.",
  );
}

function validateNoteId(noteId: string): void {
  if (!mongoose.isObjectIdOrHexString(noteId)) {
    throw noteNotFoundError();
  }
}

function sanitizeNoteContent(content: string): string {
  const sanitizedContent = sanitizeHtml(
    content,
    sanitizationOptions,
  );

  if (sanitizedContent.length > MAX_STORED_CONTENT_LENGTH) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "The submitted data is invalid.",
      {
        details: [
          {
            field: "content",
            message:
              "Note content must not exceed 100000 characters after sanitization.",
          },
        ],
      },
    );
  }

  return sanitizedContent;
}

export async function createNote(
  ownerId: string,
  input: CreateNoteInput,
): Promise<PublicNote> {
  const note = await NoteModel.create({
    ownerId,
    title: input.title,
    content: sanitizeNoteContent(input.content),
  });

  return toPublicNote(note);
}

export async function listNotes(
  ownerId: string,
): Promise<PublicNote[]> {
  const notes = await NoteModel.find({ ownerId })
    .sort({ updatedAt: -1, _id: -1 })
    .exec();

  return notes.map(toPublicNote);
}

export async function getNote(
  ownerId: string,
  noteId: string,
): Promise<PublicNote> {
  validateNoteId(noteId);

  const note = await NoteModel.findOne({
    _id: noteId,
    ownerId,
  }).exec();

  if (note === null) {
    throw noteNotFoundError();
  }

  return toPublicNote(note);
}

export async function updateNote(
  ownerId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<PublicNote> {
  validateNoteId(noteId);

  const changes: {
    title?: string;
    content?: string;
  } = {};

  if (input.title !== undefined) {
    changes.title = input.title;
  }

  if (input.content !== undefined) {
    changes.content = sanitizeNoteContent(input.content);
  }

  const note = await NoteModel.findOneAndUpdate(
    {
      _id: noteId,
      ownerId,
    },
    {
      $set: changes,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).exec();

  if (note === null) {
    throw noteNotFoundError();
  }

  return toPublicNote(note);
}

export async function deleteNote(
  ownerId: string,
  noteId: string,
): Promise<void> {
  validateNoteId(noteId);

  const note = await NoteModel.findOneAndDelete({
    _id: noteId,
    ownerId,
  }).exec();

  if (note === null) {
    throw noteNotFoundError();
  }
}

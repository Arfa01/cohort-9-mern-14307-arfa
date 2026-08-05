import {
  Schema,
  model,
  type HydratedDocument,
  type Types,
} from "mongoose";

export interface Note {
  ownerId: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteDocument = HydratedDocument<Note>;

const noteSchema = new Schema<Note>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    content: {
      type: String,
      maxlength: 100_000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

noteSchema.index({ ownerId: 1, updatedAt: -1 });

export const NoteModel = model<Note>("Note", noteSchema);

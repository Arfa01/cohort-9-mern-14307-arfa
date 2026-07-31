import {
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";

export interface User { // interface describes the yser to typescript
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>( // schema describes the user to mongoose
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,       // this is a mongoose-level index constraint, not a validation rule
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,   // this keeps the hash out of normal queries unless explicitly requested
    },
  },
  {
    timestamps: true,    // this adds createdAt and updatedAt fields automatically
    versionKey: false,
  },
);

export const UserModel = model<User>("User", userSchema);
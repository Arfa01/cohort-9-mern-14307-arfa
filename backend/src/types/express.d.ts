// this extends express's typescript def request.auth?.userId is understtod by compiler. 
declare module "express-serve-static-core" { // now Request contains an optional auth property, which contains a string userId. useful for authentication middleware that adds user information to the request object after verifying a user's identity.
  interface Request {
    auth?: {
      readonly userId: string;
    };
  }
}

export {};
import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // validate here
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ errors: result.error.flatten().fieldErrors });
    }
    next();
  };
};

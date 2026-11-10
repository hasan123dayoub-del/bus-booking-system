import { Request, Response } from "express";

/** Every successful response is { data } (lists with paging add { meta }). */
export const send = (res: Response, data: unknown, status = 200) => res.status(status).json({ data });

/** Parsed query from validateQuery(). */
export const query = <T>(res: Response): T => res.locals.query as T;

export const idParam = (req: Request) => String(req.params.id);

export const userId = (req: Request) => req.user!.id;

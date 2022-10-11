import { Request, Response } from 'express';

const getAdmin = (req: Request, res: Response) => {
  const val = req.query.code;
  console.log(`req.query.code: ${val}`);
  res.status(200).send(val);
};

export default {
  getAdmin
};

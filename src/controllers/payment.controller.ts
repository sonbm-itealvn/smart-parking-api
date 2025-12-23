import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Payment } from "../entity/Payment";

export class PaymentController {
  static async create(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = repo.create(req.body);
      const savedPayment = await repo.save(payment);
      return res.status(201).json(savedPayment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payments = await repo.find({
        relations: ["parkingSession"],
        order: { paymentTime: "DESC" },
      });
      return res.json(payments);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ["parkingSession"],
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return res.json(payment);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      repo.merge(payment, req.body);
      const updatedPayment = await repo.save(payment);
      return res.json(updatedPayment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: parseInt(req.params.id) },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      await repo.remove(payment);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}


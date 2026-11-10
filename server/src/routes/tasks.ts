import { Router } from "express";
import { Task } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { currentUserId, requireAuth } from "../middleware/auth";

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });

const dueDateSchema = z.union([calendarDate, z.null()]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(5000).nullish(),
  dueDate: dueDateSchema.optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    completed: z.boolean().optional(),
    dueDate: dueDateSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one field to update.",
  });

function parseDueDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function toTask(task: Task) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    completed: task.completed,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: currentUserId(req) },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks.map(toTask));
  } catch (error) {
    next(error);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Title is required." });
      return;
    }

    const notes = parsed.data.notes?.trim() ? parsed.data.notes.trim() : null;
    const task = await prisma.task.create({
      data: {
        userId: currentUserId(req),
        title: parsed.data.title,
        notes,
        dueDate: parseDueDate(parsed.data.dueDate) ?? null,
      },
    });
    res.status(201).json(toTask(task));
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Check the task fields and try again." });
      return;
    }

    const userId = currentUserId(req);
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    const data: {
      title?: string;
      notes?: string | null;
      completed?: boolean;
      dueDate?: Date | null;
    } = {};
    if (parsed.data.title !== undefined) {
      data.title = parsed.data.title;
    }
    if (parsed.data.notes !== undefined) {
      data.notes = parsed.data.notes?.trim() ? parsed.data.notes.trim() : null;
    }
    if (parsed.data.completed !== undefined) {
      data.completed = parsed.data.completed;
    }
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parseDueDate(parsed.data.dueDate);
    }

    const task = await prisma.task.update({
      where: { id: existing.id },
      data,
    });
    res.json(toTask(task));
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      res.status(404).json({ message: "Task not found." });
      return;
    }

    await prisma.task.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

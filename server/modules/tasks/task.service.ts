import { taskRepository } from './task.repository.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TaskService {
  async getAllTasks(filters?: any) {
    return taskRepository.findMany(filters);
  }

  async getTaskById(id: string) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError('Không tìm thấy công việc', 404, 'NOT_FOUND');
    }
    return task;
  }

  async createTask(data: any, creatorId: string) {
    if (!data.title) {
      throw new AppError('Tiêu đề công việc là bắt buộc', 400, 'VALIDATION_ERROR');
    }

    const taskData: any = {
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
      progress: data.progress || 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || creatorId,
      creatorId,
      departmentId: data.departmentId || null,
      slaItemId: data.slaItemId || null,
      objectiveId: data.objectiveId || null,
    };

    if (data.checklists && Array.isArray(data.checklists)) {
      taskData.checklists = {
        create: data.checklists.map((c: any) => ({
          title: typeof c === 'string' ? c : c.title,
          isDone: false,
        })),
      };
    }

    return taskRepository.create(taskData);
  }

  async updateTask(id: string, data: any) {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy công việc', 404, 'NOT_FOUND');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'DONE') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;

    return taskRepository.update(id, updateData);
  }

  async deleteTask(id: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy công việc', 404, 'NOT_FOUND');
    }
    return taskRepository.delete(id);
  }

  async addChecklist(taskId: string, title: string) {
    return taskRepository.addChecklist(taskId, title);
  }

  async toggleChecklist(checklistId: string, isDone: boolean) {
    return taskRepository.updateChecklist(checklistId, isDone);
  }

  async addComment(taskId: string, userId: string, content: string) {
    if (!content || !content.trim()) {
      throw new AppError('Nội dung bình luận không được để trống', 400, 'VALIDATION_ERROR');
    }
    return taskRepository.addComment(taskId, userId, content.trim());
  }
}

export const taskService = new TaskService();

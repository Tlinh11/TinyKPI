import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  MessageSquare,
  User,
  Building,
  Flag,
  ChevronRight,
  X,
  Send,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client.js';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  progress: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  assignee?: { id: string; fullName: string; email: string; avatar?: string };
  department?: { id: string; name: string; code: string };
  slaItem?: { id: string; taskType: string; durationHours: number };
  objective?: { id: string; title: string; perspective: string };
  checklists?: Array<{ id: string; title: string; isDone: boolean }>;
  comments?: Array<{ id: string; content: string; createdAt: string; user?: { fullName: string } }>;
}

export const TasksPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected task for drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tasks');
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const res = await api.post('/api/tasks', formData);
      if (res.data?.success) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleToggleChecklist = async (checklistId: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/tasks/checklist/${checklistId}`, { isDone: !currentStatus });
      fetchTasks();
      if (selectedTask) {
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                checklists: prev.checklists?.map((c) =>
                  c.id === checklistId ? { ...c, isDone: !currentStatus } : c
                ),
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentInput.trim()) return;

    try {
      const res = await api.post(`/api/tasks/${selectedTask.id}/comments`, { content: commentInput });
      if (res.data?.success) {
        setCommentInput('');
        fetchTasks();
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                comments: [res.data.data, ...(prev.comments || [])],
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchSearch =
      !searchTerm ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Cao</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Vừa</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Thấp</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'DONE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Hoàn thành</span>;
      case 'REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Chờ duyệt</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Đang làm</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Cần làm</span>;
    }
  };

  const kanbanColumns = [
    { key: 'TODO', label: 'CẦN LÀM (TODO)', color: 'border-slate-300 bg-slate-50' },
    { key: 'IN_PROGRESS', label: 'ĐANG THỰC HIỆN', color: 'border-blue-400 bg-blue-50/40' },
    { key: 'REVIEW', label: 'CHỜ DUYỆT (REVIEW)', color: 'border-purple-400 bg-purple-50/40' },
    { key: 'DONE', label: 'HOÀN THÀNH (DONE)', color: 'border-emerald-400 bg-emerald-50/40' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1677ff] mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>PHÂN HỆ VẬN HÀNH TINYKPI</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hộp thư Công việc & Quản trị Tác vụ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ, gắn kết cam kết SLA và kiểm soát mục tiêu chiến lược cá nhân.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'kanban' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'table' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng danh sách</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Giao việc mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Tổng số việc</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{tasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-500 uppercase">Đang thực hiện</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-purple-500 uppercase">Chờ phê duyệt</div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {tasks.filter((t) => t.status === 'REVIEW').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-500 uppercase">Đã hoàn tất</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {tasks.filter((t) => t.status === 'DONE').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên công việc, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">Cần làm</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="REVIEW">Chờ duyệt</option>
            <option value="DONE">Hoàn thành</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Ưu tiên:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="URGENT">Khẩn cấp</option>
            <option value="HIGH">Cao</option>
            <option value="MEDIUM">Vừa</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Đang tải danh sách công việc từ Neon DB...</span>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">{col.label}</span>
                  <span className="px-2 py-0.5 bg-white text-slate-600 rounded-full text-[11px] font-bold shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer hover:border-blue-400 group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {getPriorityBadge(task.priority)}
                        {task.slaItem && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            SLA {task.slaItem.durationHours}h
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                          <span>Tiến độ</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.progress === 100
                                ? 'bg-emerald-500'
                                : task.progress > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px]">
                            {task.assignee?.fullName?.charAt(0) || 'U'}
                          </div>
                          <span className="truncate max-w-[90px]">{task.assignee?.fullName || 'Chưa giao'}</span>
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">Không có công việc</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Tên công việc</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3">Ưu tiên</th>
                <th className="py-3 px-3">Tiến độ</th>
                <th className="py-3 px-3">Phụ trách</th>
                <th className="py-3 px-3">Hạn chót</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 hover:text-blue-600">{task.title}</div>
                    {task.objective && (
                      <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        🎯 BSC: {task.objective.title}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(task.status)}</td>
                  <td className="py-3 px-3">{getPriorityBadge(task.priority)}</td>
                  <td className="py-3 px-3">
                    <div className="w-24">
                      <div className="text-[10px] font-bold text-slate-600 mb-0.5">{task.progress}%</div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-700">{task.assignee?.fullName || 'Chưa gán'}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="text-[11px] px-2 py-1 bg-white border border-slate-200 rounded font-medium text-slate-700 outline-hidden"
                    >
                      <option value="TODO">Cần làm</option>
                      <option value="IN_PROGRESS">Đang làm</option>
                      <option value="REVIEW">Chờ duyệt</option>
                      <option value="DONE">Hoàn thành</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTask.status)}
                {getPriorityBadge(selectedTask.priority)}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedTask.title}</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description || 'Chưa có mô tả chi tiết cho công việc này.'}
                </p>
              </div>

              {/* Status Update Buttons */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">Chuyển trạng thái công việc:</div>
                <div className="grid grid-cols-4 gap-2">
                  {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedTask.id, st)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                        selectedTask.status === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'TODO' ? 'Cần làm' : st === 'IN_PROGRESS' ? 'Đang làm' : st === 'REVIEW' ? 'Chờ duyệt' : 'Xong'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Checklist công việc</h3>
                  <span className="text-[11px] text-slate-500">
                    {selectedTask.checklists?.filter((c) => c.isDone).length || 0}/
                    {selectedTask.checklists?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedTask.checklists?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id, item.isDone)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`text-xs ${item.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Stream */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Trao đổi & Nhật ký xử lý</h3>
                <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Viết phản hồi / báo cáo tiến độ..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="space-y-3">
                  {selectedTask.comments?.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{c.user?.fullName || 'Người dùng'}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <div className="text-center py-4 text-xs text-slate-400">Chưa có bình luận nào.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Giao việc mới (Tạo tác vụ)</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàn tất đối soát SLA tháng 9..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung chi tiết công việc..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Vừa (Bình thường)</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn hoàn thành (Deadline)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                >
                  Tạo công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

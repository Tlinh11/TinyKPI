import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Users,
  Briefcase,
  UserCheck,
  Building,
  RotateCw,
  Search,
  Layers,
  LayoutGrid,
  GitBranch,
  X,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface DepartmentUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  status: string;
  position?: { title: string } | null;
}

interface OrgDepartmentNode {
  id: string;
  name: string;
  code: string;
  description: string | null;
  manager?: {
    id: string;
    fullName: string;
    email: string;
    avatar: string | null;
    position?: { title: string } | null;
  } | null;
  users: DepartmentUser[];
  _count: {
    users: number;
    positions: number;
  };
  children: OrgDepartmentNode[];
}

export const OrgChartPage: React.FC = () => {
  const [roots, setRoots] = useState<OrgDepartmentNode[]>([]);
  const [flatDepartments, setFlatDepartments] = useState<OrgDepartmentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [selectedDept, setSelectedDept] = useState<OrgDepartmentNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadOrgChart = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<{ roots: OrgDepartmentNode[]; flat: OrgDepartmentNode[] }>('/settings/org-chart');
      setRoots(res.roots);
      setFlatDepartments(res.flat);
    } catch (err: any) {
      console.error('Lỗi tải sơ đồ tổ chức:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgChart();
  }, []);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setScale(1);

  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(collapsedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCollapsedNodes(next);
  };

  const collapseAll = () => {
    const allIds = new Set<string>();
    const traverse = (node: OrgDepartmentNode) => {
      if (node.children?.length > 0) {
        allIds.add(node.id);
        node.children.forEach(traverse);
      }
    };
    roots.forEach(traverse);
    setCollapsedNodes(allIds);
  };

  const expandAll = () => setCollapsedNodes(new Set());

  // Render a Node in the Tree
  const renderTreeNode = (node: OrgDepartmentNode, isRoot = false) => {
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isMatched = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => setSelectedDept(node)}
          className={`relative z-10 w-72 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl ${
            isMatched
              ? 'ring-4 ring-amber-400 bg-amber-50/90 border-amber-300'
              : isRoot
              ? 'bg-gradient-to-b from-blue-700 to-indigo-800 text-white border-blue-600'
              : 'bg-white hover:bg-slate-50/80 text-slate-800 border-slate-200'
          }`}
        >
          {/* Card Top Header */}
          <div className={`p-4 border-b ${isRoot ? 'border-blue-600/60' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  isRoot ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                {node.code}
              </span>
              <span
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  isRoot ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                {node._count?.users || 0} nhân sự
              </span>
            </div>

            <h3
              className={`text-sm font-bold mt-2 line-clamp-1 ${
                isRoot ? 'text-white' : 'text-slate-900'
              }`}
            >
              {node.name}
            </h3>
            {node.description && (
              <p
                className={`text-[11px] line-clamp-1 mt-0.5 ${
                  isRoot ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {node.description}
              </p>
            )}
          </div>

          {/* Manager Info */}
          <div className="p-3.5 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                isRoot ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {node.manager?.avatar ? (
                <img src={node.manager.avatar} alt="Manager" className="w-full h-full object-cover" />
              ) : (
                node.manager?.fullName ? node.manager.fullName.slice(0, 2).toUpperCase() : 'TP'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <UserCheck className={`w-3.5 h-3.5 ${isRoot ? 'text-blue-200' : 'text-blue-600'}`} />
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isRoot ? 'text-blue-200' : 'text-slate-400'}`}>
                  Trưởng đơn vị
                </span>
              </div>
              <div
                className={`text-xs font-bold truncate mt-0.5 ${
                  isRoot ? 'text-white' : 'text-slate-900'
                }`}
              >
                {node.manager?.fullName || 'Chưa bổ nhiệm'}
              </div>
              <div
                className={`text-[10px] truncate ${
                  isRoot ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {node.manager?.position?.title || 'Phụ trách chung'}
              </div>
            </div>
          </div>

          {/* Expand / Collapse Button if has children */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-md border text-xs transition ${
                isCollapsed
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title={isCollapsed ? 'Mở rộng nhánh con' : 'Thu gọn nhánh con'}
            >
              {isCollapsed ? (
                <span className="font-bold text-[10px]">+{node.children.length}</span>
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Children Branches & Connecting Lines */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center pt-8 relative">
            {/* Vertical connector down from parent */}
            <div className="w-0.5 h-8 bg-blue-300 absolute top-0" />

            {/* Sub-tree branches container */}
            <div className="flex items-start justify-center gap-8 relative pt-4">
              {/* Horizontal line across children */}
              {node.children.length > 1 && (
                <div
                  className="h-0.5 bg-blue-300 absolute top-4"
                  style={{
                    left: `calc(${100 / (node.children.length * 2)}%)`,
                    right: `calc(${100 / (node.children.length * 2)}%)`,
                  }}
                />
              )}

              {node.children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical drop line to child card */}
                  <div className="w-0.5 h-4 bg-blue-300 -mt-4 mb-2" />
                  {renderTreeNode(child, false)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <Network className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sơ đồ Tổ chức Doanh nghiệp (Interactive Org-Chart)</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              Mô hình hóa trực quan cơ cấu phân cấp, định biên nhân sự và quản trị đơn vị thành viên theo cây phả hệ
            </p>
          </div>
        </div>

        {/* View Switch & Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'tree' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Sơ đồ cây
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Dạng lưới
            </button>
          </div>

          <button
            onClick={loadOrgChart}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Zoom */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm phòng ban hoặc chức vụ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
          />
        </div>

        {viewMode === 'tree' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              Mở rộng tất cả
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              Thu gọn tất cả
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white text-slate-600 rounded-md transition"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-md transition"
                title="Khôi phục 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white text-slate-600 rounded-md transition"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'tree' ? (
        <div
          ref={containerRef}
          className="bg-slate-100/70 border border-slate-200 rounded-2xl p-12 min-h-[640px] overflow-auto shadow-inner relative flex justify-center"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Đang khởi tạo cấu trúc sơ đồ tổ chức...</span>
            </div>
          ) : roots.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              Chưa có dữ liệu phòng ban nào trong hệ thống.
            </div>
          ) : (
            <div
              className="transition-transform duration-200 origin-top flex flex-col items-center gap-12"
              style={{ transform: `scale(${scale})` }}
            >
              {roots.map((root) => renderTreeNode(root, true))}
            </div>
          )}
        </div>
      ) : (
        /* Grid Table Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flatDepartments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => setSelectedDept(dept)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {dept.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {dept._count?.users || 0} thành viên
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {dept.description || 'Không có mô tả chi tiết'}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {dept.manager?.avatar ? (
                    <img src={dept.manager.avatar} alt="Manager" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    dept.manager?.fullName ? dept.manager.fullName.slice(0, 2).toUpperCase() : 'TP'
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{dept.manager?.fullName || 'Chưa bổ nhiệm'}</div>
                  <div className="text-[10px] text-slate-400">{dept.manager?.position?.title || 'Trưởng phòng ban'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over / Modal Details for Selected Department */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDept.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Mã đơn vị: {selectedDept.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Leader Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {selectedDept.manager?.avatar ? (
                      <img src={selectedDept.manager.avatar} alt="Manager" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      selectedDept.manager?.fullName ? selectedDept.manager.fullName.slice(0, 2).toUpperCase() : 'TP'
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Trưởng bộ phận</span>
                    <h4 className="text-sm font-bold text-slate-900">{selectedDept.manager?.fullName || 'Chưa bổ nhiệm'}</h4>
                    <p className="text-xs text-slate-500">{selectedDept.manager?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200">
                    {selectedDept.manager?.position?.title || 'Phụ trách chung'}
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    Danh sách Nhân sự trực thuộc ({selectedDept.users?.length || 0})
                  </h4>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedDept.users && selectedDept.users.length > 0 ? (
                    selectedDept.users.map((u) => (
                      <div key={u.id} className="p-3 hover:bg-slate-50 flex items-center justify-between transition">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.fullName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              u.fullName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {u.position?.title || 'Chuyên viên'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ chế độ'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Chưa có nhân viên nào được gán vào phòng ban này.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDept(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

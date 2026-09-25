import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  RotateCw,
  Plus,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Users,
  Cpu,
  GraduationCap,
  X,
  Target,
  Trash2,
  Check,
  AlertCircle,
  Link2,
  GitFork,
  Eye,
  EyeOff,
  Sparkles,
  Workflow,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { apiClient } from '../api/client.js';

export interface CauseEffectLink {
  id: string;
  sourceId: string; // Lower-tier / cause objective
  targetId: string; // Upper-tier / effect objective
  label?: string;   // Description of relationship, e.g. "Thúc đẩy SLA"
  type?: 'DRIVES' | 'ENABLES' | 'IMPROVES' | string;
}

interface KpiIndicator {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  targetValue: number;
  actualValue: number;
  achievementRate: number;
  status: string;
}

interface StrategicObjective {
  id: string;
  code?: string;
  title: string;
  description?: string;
  perspective: string;
  order: number;
  kpiIndicators: KpiIndicator[];
}

interface PerspectiveGroup {
  key: string;
  title: string;
  description: string;
  objectives: StrategicObjective[];
  kpiCount: number;
  averageAchievement: number;
}

interface StrategyMapResponse {
  organization: string;
  stage: string;
  overallScore: number;
  totalObjectives: number;
  totalKpis: number;
  perspectives: PerspectiveGroup[];
  links?: CauseEffectLink[];
}

interface StrategyMapPageProps {
  onNavigate: (path: string) => void;
}

interface LineCoord {
  id: string;
  link: CauseEffectLink;
  path: string;
  midX: number;
  midY: number;
  sourceObj?: StrategicObjective;
  targetObj?: StrategicObjective;
  color: string;
}

export const StrategyMapPage: React.FC<StrategyMapPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<StrategyMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View & Visual Controls
  const [viewMode, setViewMode] = useState<'SWIMLANE' | 'FLOW_TREE'>('SWIMLANE');
  const [showArrows, setShowArrows] = useState(true);
  const [hoveredObjId, setHoveredObjId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [lineCoords, setLineCoords] = useState<LineCoord[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Modal Objective
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [selectedPerspective, setSelectedPerspective] = useState('FINANCIAL');
  const [objTitle, setObjTitle] = useState('');
  const [objCode, setObjCode] = useState('');
  const [objDesc, setObjDesc] = useState('');

  // Modal Cause-Effect Link
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkLabel, setLinkLabel] = useState('Thúc đẩy trực tiếp');
  const [linkType, setLinkType] = useState<'DRIVES' | 'ENABLES' | 'IMPROVES'>('DRIVES');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStrategyMap = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<StrategyMapResponse>('/bsc/strategy-map');
      setData(res);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải bản đồ chiến lược' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStrategyMap();
  }, []);

  // Recalculate dynamic SVG lines
  const updateLines = () => {
    if (!canvasRef.current || !data || viewMode !== 'SWIMLANE' || !showArrows) {
      setLineCoords([]);
      return;
    }

    const container = canvasRef.current;
    const cRect = container.getBoundingClientRect();

    const allObjs = data.perspectives.flatMap((p) => p.objectives);
    const objMap = new Map(allObjs.map((o) => [o.id, o]));

    const coords: LineCoord[] = [];
    const links = data.links || [];

    links.forEach((link) => {
      const sourceEl = container.querySelector(`[data-obj-id="${link.sourceId}"]`) as HTMLElement;
      const targetEl = container.querySelector(`[data-obj-id="${link.targetId}"]`) as HTMLElement;

      if (!sourceEl || !targetEl) return;

      const sRect = sourceEl.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();

      // In BSC: Learning is bottom, Financial is top. Causes usually flow upward.
      const isUpward = sRect.top > tRect.top;

      let sx = sRect.left + sRect.width / 2 - cRect.left;
      let sy = isUpward ? sRect.top - cRect.top : sRect.bottom - cRect.top;

      let tx = tRect.left + tRect.width / 2 - cRect.left;
      let ty = isUpward ? tRect.bottom - cRect.top + 4 : tRect.top - cRect.top - 4;

      // Handle horizontal connections within the same perspective
      const isSameRow = Math.abs(sRect.top - tRect.top) < 50;
      if (isSameRow) {
        if (sRect.left < tRect.left) {
          sx = sRect.right - cRect.left;
          sy = sRect.top + sRect.height / 2 - cRect.top;
          tx = tRect.left - cRect.left - 4;
          ty = tRect.top + tRect.height / 2 - cRect.top;
        } else {
          sx = sRect.left - cRect.left;
          sy = sRect.top + sRect.height / 2 - cRect.top;
          tx = tRect.right - cRect.left + 4;
          ty = tRect.top + tRect.height / 2 - cRect.top;
        }
      }

      const dx = tx - sx;
      const dy = ty - sy;

      let cp1x = sx;
      let cp1y = sy + dy * 0.5;
      let cp2x = tx;
      let cp2y = ty - dy * 0.5;

      if (isSameRow) {
        cp1x = sx + dx * 0.5;
        cp1y = sy - 35;
        cp2x = tx - dx * 0.5;
        cp2y = ty - 35;
      }

      const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2 + (isSameRow ? -18 : 0);

      const color =
        link.type === 'ENABLES' ? '#059669' : link.type === 'IMPROVES' ? '#7c3aed' : '#2563eb';

      coords.push({
        id: link.id,
        link,
        path,
        midX,
        midY,
        sourceObj: objMap.get(link.sourceId),
        targetObj: objMap.get(link.targetId),
        color,
      });
    });

    setLineCoords(coords);
  };

  useLayoutEffect(() => {
    updateLines();
    const timer = setTimeout(updateLines, 250);
    const handleResize = () => updateLines();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [data, viewMode, showArrows]);

  // Handle Create Objective
  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim()) return;

    try {
      await apiClient('/bsc/objectives', {
        method: 'POST',
        body: JSON.stringify({
          perspective: selectedPerspective,
          title: objTitle.trim(),
          code: objCode.trim() || undefined,
          description: objDesc.trim() || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo mục tiêu chiến lược thành công' });
      setIsObjModalOpen(false);
      setObjTitle('');
      setObjCode('');
      setObjDesc('');
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm mục tiêu' });
    }
  };

  // Handle Delete Objective
  const handleDeleteObjective = async (obj: StrategicObjective) => {
    if (!confirm(`Bạn có chắc muốn xóa mục tiêu "${obj.title}"?`)) return;
    try {
      await apiClient(`/bsc/objectives/${obj.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa mục tiêu chiến lược' });
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  // Handle Add Cause-Effect Link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkSourceId || !linkTargetId) {
      setNotification({ type: 'error', message: 'Vui lòng chọn mục tiêu nguồn và mục tiêu đích' });
      return;
    }
    if (linkSourceId === linkTargetId) {
      setNotification({ type: 'error', message: 'Mục tiêu nguồn và đích không thể trùng nhau' });
      return;
    }

    try {
      await apiClient('/bsc/strategy-map/links/add', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: linkSourceId,
          targetId: linkTargetId,
          label: linkLabel.trim() || 'Thúc đẩy',
          type: linkType,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo liên kết nhân - quả thành công' });
      setIsLinkModalOpen(false);
      setLinkSourceId('');
      setLinkTargetId('');
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tạo liên kết' });
    }
  };

  // Handle Delete Cause-Effect Link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Bạn có muốn xóa đường liên kết nhân - quả này?')) return;
    try {
      await apiClient(`/bsc/strategy-map/links/${linkId}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa liên kết nhân - quả' });
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi xóa liên kết' });
    }
  };

  // Auto-connect standard Kaplan & Norton chain
  const handleAutoConnect = async () => {
    if (!data) return;
    const allObjs = data.perspectives.flatMap((p) => p.objectives);
    const learnObjs = allObjs.filter((o) => o.perspective === 'LEARNING_GROWTH');
    const procObjs = allObjs.filter((o) => o.perspective === 'INTERNAL_PROCESS');
    const custObjs = allObjs.filter((o) => o.perspective === 'CUSTOMER');
    const finObjs = allObjs.filter((o) => o.perspective === 'FINANCIAL');

    const recommendedLinks: CauseEffectLink[] = [];

    // Learning -> Process
    learnObjs.forEach((lo, idx) => {
      const target = procObjs[idx % procObjs.length];
      if (target) {
        recommendedLinks.push({
          id: `auto-pt-qt-${lo.id}-${target.id}`,
          sourceId: lo.id,
          targetId: target.id,
          label: 'Nâng cao năng suất & SLA',
          type: 'ENABLES',
        });
      }
    });

    // Process -> Customer
    procObjs.forEach((po, idx) => {
      const target = custObjs[idx % custObjs.length];
      if (target) {
        recommendedLinks.push({
          id: `auto-qt-kh-${po.id}-${target.id}`,
          sourceId: po.id,
          targetId: target.id,
          label: 'Đảm bảo trải nghiệm xuất sắc',
          type: 'DRIVES',
        });
      }
    });

    // Customer -> Financial
    custObjs.forEach((co, idx) => {
      const target = finObjs[idx % finObjs.length];
      if (target) {
        recommendedLinks.push({
          id: `auto-kh-tc-${co.id}-${target.id}`,
          sourceId: co.id,
          targetId: target.id,
          label: 'Tăng trưởng doanh thu bền vững',
          type: 'DRIVES',
        });
      }
    });

    try {
      await apiClient('/bsc/strategy-map/links', {
        method: 'POST',
        body: JSON.stringify({ links: recommendedLinks }),
      });
      setNotification({
        type: 'success',
        message: `Đã tự động khởi tạo ${recommendedLinks.length} liên kết Nhân - Quả chuẩn Balanced Scorecard!`,
      });
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tự động kết nối' });
    }
  };

  const getPerspectiveMeta = (key: string) => {
    switch (key) {
      case 'FINANCIAL':
        return {
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
          color: 'border-blue-200 bg-blue-50/40',
          badge: 'bg-blue-100 text-blue-700',
          tierLabel: 'TẦNG 1: KẾT QUẢ TÀI CHÍNH',
          flowColor: 'border-l-blue-500',
        };
      case 'CUSTOMER':
        return {
          icon: <Users className="w-4 h-4 text-emerald-600" />,
          color: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-700',
          tierLabel: 'TẦNG 2: GIÁ TRỊ KHÁCH HÀNG',
          flowColor: 'border-l-emerald-500',
        };
      case 'INTERNAL_PROCESS':
        return {
          icon: <Cpu className="w-4 h-4 text-indigo-600" />,
          color: 'border-indigo-200 bg-indigo-50/40',
          badge: 'bg-indigo-100 text-indigo-700',
          tierLabel: 'TẦNG 3: VẬN HÀNH & QUY TRÌNH NỘI BỘ',
          flowColor: 'border-l-indigo-500',
        };
      case 'LEARNING_GROWTH':
      default:
        return {
          icon: <GraduationCap className="w-4 h-4 text-amber-600" />,
          color: 'border-amber-200 bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-700',
          tierLabel: 'TẦNG 4: HỌC HỎI, NĂNG LỰC & ĐỔI MỚI (NỀN TẢNG)',
          flowColor: 'border-l-amber-500',
        };
    }
  };

  const allObjectives = data?.perspectives.flatMap((p) => p.objectives) || [];

  return (
    <div className="space-y-4">
      {/* Inline styles for animated flow arrows */}
      <style>{`
        @keyframes bscFlowDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-animated-arrow {
          animation: bscFlowDash 1.4s linear infinite;
        }
      `}</style>

      {/* Top Header Row matching TopKPI B4 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1677ff]">
              BƯỚC 4
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              B4 BẢN ĐỒ CHIẾN LƯỢC / MỤC TIÊU & LIÊN KẾT NHÂN - QUẢ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô hình hóa quan hệ nhân quả (Cause & Effect) giữa 4 viễn cảnh: Học hỏi & Phát triển ➔ Quy trình ➔ Khách hàng ➔ Tài chính.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('SWIMLANE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                viewMode === 'SWIMLANE'
                  ? 'bg-white text-[#1677ff] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bản đồ Phân tầng</span>
            </button>
            <button
              onClick={() => setViewMode('FLOW_TREE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition ${
                viewMode === 'FLOW_TREE'
                  ? 'bg-white text-[#1677ff] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Cây Luồng Nhân Quả</span>
            </button>
          </div>

          {/* Toggle Arrows Button */}
          {viewMode === 'SWIMLANE' && (
            <button
              onClick={() => setShowArrows(!showArrows)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-xs ${
                showArrows
                  ? 'border-blue-200 bg-blue-50 text-[#1677ff]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Bật/Tắt hiển thị mũi tên liên kết động"
            >
              {showArrows ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showArrows ? 'Mũi tên: Bật' : 'Mũi tên: Ẩn'}</span>
            </button>
          )}

          {/* Nối Liên Kết Button */}
          <button
            onClick={() => {
              if (allObjectives.length >= 2) {
                setLinkSourceId(allObjectives[allObjectives.length - 1]?.id || '');
                setLinkTargetId(allObjectives[0]?.id || '');
              }
              setIsLinkModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Nối Liên Kết</span>
          </button>

          {/* Auto-connect button */}
          <button
            onClick={handleAutoConnect}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition shadow-xs"
            title="Tự động kết nối chuỗi nhân quả mẫu Kaplan & Norton"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nối Mẫu BSC</span>
          </button>

          <button
            onClick={loadStrategyMap}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('/bsc-scorecard')}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <span>Bước 5: Thẻ điểm BSC</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TopKPI Notice Banner with Cause-and-Effect explanation */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 border border-blue-200/80 rounded-xl p-3 text-xs text-slate-800 flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-[#1677ff] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">
            Nguyên lý Chuỗi Nhân - Quả (Cause-and-Effect Chain) theo Balanced Scorecard:
          </p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Các mục tiêu nền tảng từ <span className="font-bold text-amber-700">Học hỏi & Phát triển</span>{' '}
            thúc đẩy cải tiến <span className="font-bold text-indigo-700">Quy trình nội bộ</span>, quy trình xuất sắc tạo ra sự hài lòng của{' '}
            <span className="font-bold text-emerald-700">Khách hàng</span>, từ đó đem lại thành công vượt trội về{' '}
            <span className="font-bold text-blue-700">Tài chính</span>. Rê chuột lên thẻ mục tiêu để làm nổi bật luồng liên kết.
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Điểm hiệu suất BSC</div>
          <div className="text-2xl font-extrabold text-[#1677ff] mt-0.5">
            {data?.overallScore || 0}%
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Tổng hợp 4 viễn cảnh</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Mục tiêu chiến lược</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-0.5">
            {data?.totalObjectives || 0}
          </div>
          <div className="text-[10px] text-slate-400">Phân bổ 4 trụ cột</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Đường liên kết Nhân - Quả</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-0.5">
            {data?.links?.length || 0}
          </div>
          <div className="text-[10px] text-indigo-600 font-medium">Mối quan hệ hỗ trợ</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chỉ số đo lường (KPI)</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-0.5">
            {data?.totalKpis || 0}
          </div>
          <div className="text-[10px] text-slate-400">Đã gán chỉ tiêu đo</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tổ chức & Giai đoạn</div>
          <div className="text-sm font-bold text-slate-800 mt-1 truncate">
            {data?.organization}
          </div>
          <div className="text-[10px] text-[#1677ff] font-medium">{data?.stage}</div>
        </div>
      </div>

      {/* VIEW MODE 1: SWIMLANE WITH DYNAMIC SVG ARROWS */}
      {viewMode === 'SWIMLANE' && (
        <div ref={canvasRef} className="relative space-y-4 pt-1 pb-4">
          {/* Dynamic SVG Curves Overlay */}
          {showArrows && lineCoords.length > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
              style={{ minHeight: '100%' }}
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="arrow-drives"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                </marker>
                <marker
                  id="arrow-enables"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
                </marker>
                <marker
                  id="arrow-improves"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7c3aed" />
                </marker>
                {/* Arrow glow effect on hover */}
                <filter id="arrow-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.7" />
                </filter>
              </defs>

              {lineCoords.map((coord) => {
                const isHovered = hoveredObjId
                  ? coord.link.sourceId === hoveredObjId || coord.link.targetId === hoveredObjId
                  : hoveredLinkId === coord.id;
                const isDimmed = (hoveredObjId || hoveredLinkId) && !isHovered;

                const markerId =
                  coord.link.type === 'ENABLES'
                    ? 'arrow-enables'
                    : coord.link.type === 'IMPROVES'
                    ? 'arrow-improves'
                    : 'arrow-drives';

                return (
                  <g
                    key={coord.id}
                    className={`transition-opacity duration-200 ${isDimmed ? 'opacity-15' : 'opacity-100'}`}
                  >
                    {/* Transparent thick line for effortless hover */}
                    <path
                      d={coord.path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={20}
                      className="pointer-events-auto cursor-pointer"
                      onMouseEnter={() => setHoveredLinkId(coord.id)}
                      onMouseLeave={() => setHoveredLinkId(null)}
                    />
                    {/* Visible animated curve */}
                    <path
                      d={coord.path}
                      fill="none"
                      stroke={coord.color}
                      strokeWidth={isHovered ? 3.5 : 2}
                      strokeDasharray={isHovered ? 'none' : '5,4'}
                      className={!isHovered ? 'flow-animated-arrow' : ''}
                      markerEnd={`url(#${markerId})`}
                      filter={isHovered ? 'url(#arrow-glow)' : undefined}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Interactive Badges at Curve Midpoints */}
          {showArrows &&
            lineCoords.map((coord) => {
              const isHovered = hoveredObjId
                ? coord.link.sourceId === hoveredObjId || coord.link.targetId === hoveredObjId
                : hoveredLinkId === coord.id;
              const isDimmed = (hoveredObjId || hoveredLinkId) && !isHovered;

              return (
                <div
                  key={`badge-${coord.id}`}
                  style={{
                    left: `${coord.midX}px`,
                    top: `${coord.midY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-20 pointer-events-auto transition-all duration-200 ${
                    isDimmed ? 'opacity-20 pointer-events-none' : 'opacity-100'
                  } ${isHovered ? 'scale-110 z-30' : ''}`}
                  onMouseEnter={() => setHoveredLinkId(coord.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                >
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md border transition ${
                      isHovered
                        ? 'bg-slate-900 text-white border-slate-700 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 animate-ping"
                      style={{ backgroundColor: coord.color }}
                    />
                    <span className="truncate max-w-[150px]">{coord.link.label || 'Thúc đẩy'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLink(coord.id);
                      }}
                      className="text-slate-400 hover:text-red-500 transition ml-0.5 p-0.5 rounded"
                      title="Xóa liên kết này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* 4 Swimlane Layers */}
          {data?.perspectives.map((persp) => {
            const meta = getPerspectiveMeta(persp.key);
            return (
              <div
                key={persp.key}
                className={`relative rounded-2xl border p-4 bg-white/95 backdrop-blur-xs shadow-xs transition hover:shadow-md ${meta.color}`}
              >
                {/* Swimlane Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {meta.tierLabel}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                        VIỄN CẢNH {persp.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="text-[11px] text-slate-400 font-medium">Hoàn thành:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${meta.badge}`}>
                        {persp.averageAchievement}%
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPerspective(persp.key);
                        setObjCode(
                          `${
                            persp.key === 'FINANCIAL'
                              ? 'TC'
                              : persp.key === 'CUSTOMER'
                              ? 'KH'
                              : persp.key === 'INTERNAL_PROCESS'
                              ? 'QT'
                              : 'PT'
                          }-0${persp.objectives.length + 1}`
                        );
                        setIsObjModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm mục tiêu</span>
                    </button>
                  </div>
                </div>

                {/* Objectives Grid */}
                <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {persp.objectives.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                      Chưa có mục tiêu chiến lược nào cho viễn cảnh này. Bấm "Thêm mục tiêu" để khởi tạo.
                    </div>
                  ) : (
                    persp.objectives.map((obj) => {
                      const incomingLinks = (data?.links || []).filter((l) => l.targetId === obj.id);
                      const outgoingLinks = (data?.links || []).filter((l) => l.sourceId === obj.id);

                      const isSelfHovered = hoveredObjId === obj.id;
                      const isLinkedToHovered = hoveredObjId
                        ? incomingLinks.some((l) => l.sourceId === hoveredObjId) ||
                          outgoingLinks.some((l) => l.targetId === hoveredObjId)
                        : false;

                      return (
                        <div
                          key={obj.id}
                          id={`obj-card-${obj.id}`}
                          data-obj-id={obj.id}
                          onMouseEnter={() => setHoveredObjId(obj.id)}
                          onMouseLeave={() => setHoveredObjId(null)}
                          className={`bg-white rounded-xl border p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between ${
                            isSelfHovered
                              ? 'border-[#1677ff] ring-2 ring-blue-100 shadow-md scale-[1.01]'
                              : isLinkedToHovered
                              ? 'border-emerald-400 ring-2 ring-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {obj.code || 'OBJ'}
                                </span>
                                {/* Quick link badges */}
                                {incomingLinks.length > 0 && (
                                  <span
                                    className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    title={`Được thúc đẩy bởi ${incomingLinks.length} mục tiêu nền tảng`}
                                  >
                                    ↑ {incomingLinks.length}
                                  </span>
                                )}
                                {outgoingLinks.length > 0 && (
                                  <span
                                    className="text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                                    title={`Thúc đẩy ${outgoingLinks.length} mục tiêu cấp trên`}
                                  >
                                    → {outgoingLinks.length}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setLinkSourceId(obj.id);
                                    setIsLinkModalOpen(true);
                                  }}
                                  className="text-slate-400 hover:text-[#1677ff] p-1 transition rounded hover:bg-slate-50"
                                  title="Tạo liên kết nhân quả từ mục tiêu này"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteObjective(obj)}
                                  className="text-slate-300 hover:text-red-500 p-1 transition rounded hover:bg-slate-50"
                                  title="Xóa mục tiêu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                              {obj.title}
                            </h3>
                            {obj.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {obj.description}
                              </p>
                            )}
                          </div>

                          {/* KPI indicators linked */}
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between text-[11px] mb-2">
                              <span className="font-semibold text-slate-600 flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-blue-500" />
                                {obj.kpiIndicators.length} Chỉ số KPI
                              </span>
                              <button
                                onClick={() => onNavigate('/bsc-scorecard')}
                                className="text-[#1677ff] hover:underline font-medium text-[11px]"
                              >
                                Quản lý KPI ›
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {obj.kpiIndicators.slice(0, 2).map((kpi) => (
                                <div
                                  key={kpi.id}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 text-[10px] text-slate-700 border border-slate-100"
                                >
                                  <span className="truncate max-w-[140px] font-medium">• {kpi.name}</span>
                                  <span className="font-bold text-[#1677ff]">{kpi.achievementRate}%</span>
                                </div>
                              ))}
                              {obj.kpiIndicators.length > 2 && (
                                <div className="text-[10px] text-slate-400 text-center font-medium">
                                  +{obj.kpiIndicators.length - 2} chỉ số khác
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CAUSE & EFFECT FLOW TREE */}
      {viewMode === 'FLOW_TREE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-[#1677ff]" />
                Mạch Dẫn Luồng Giá Trị Chiến Lược (Value Creation Narrative)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị chuỗi logic 4 viễn cảnh: Từ nền tảng năng lực tổ chức đến kết quả tài chính cuối cùng.
              </p>
            </div>
            <button
              onClick={() => {
                if (allObjectives.length >= 2) {
                  setLinkSourceId(allObjectives[allObjectives.length - 1]?.id || '');
                  setLinkTargetId(allObjectives[0]?.id || '');
                }
                setIsLinkModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Nối thêm mắt xích</span>
            </button>
          </div>

          {/* Sequential Tier Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {[
              {
                key: 'LEARNING_GROWTH',
                title: '1. Năng lực & Đổi mới',
                desc: 'Học hỏi, văn hóa và công nghệ số làm nền tảng.',
                color: 'border-amber-300 bg-amber-50/50 text-amber-900',
                badge: 'bg-amber-100 text-amber-800',
                icon: <GraduationCap className="w-4 h-4 text-amber-600" />,
              },
              {
                key: 'INTERNAL_PROCESS',
                title: '2. Quy trình Nội bộ',
                desc: 'Tối ưu hóa quy trình, SLA và năng suất vận hành.',
                color: 'border-indigo-300 bg-indigo-50/50 text-indigo-900',
                badge: 'bg-indigo-100 text-indigo-800',
                icon: <Cpu className="w-4 h-4 text-indigo-600" />,
              },
              {
                key: 'CUSTOMER',
                title: '3. Giá trị Khách hàng',
                desc: 'Gia tăng mức độ hài lòng và tỷ lệ giữ chân khách hàng.',
                color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
                badge: 'bg-emerald-100 text-emerald-800',
                icon: <Users className="w-4 h-4 text-emerald-600" />,
              },
              {
                key: 'FINANCIAL',
                title: '4. Kết quả Tài chính',
                desc: 'Tăng trưởng doanh thu, biên lợi nhuận và ROI.',
                color: 'border-blue-300 bg-blue-50/50 text-blue-900',
                badge: 'bg-blue-100 text-blue-800',
                icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
              },
            ].map((tier, idx) => {
              const tierObjs = data?.perspectives.find((p) => p.key === tier.key)?.objectives || [];
              return (
                <div key={tier.key} className={`rounded-xl border p-4 flex flex-col justify-between ${tier.color}`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        {tier.icon}
                        <h3 className="text-xs font-bold">{tier.title}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tier.badge}`}>
                        {tierObjs.length} Mục tiêu
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2">{tier.desc}</p>

                    <div className="mt-3 space-y-2">
                      {tierObjs.map((obj) => (
                        <div
                          key={obj.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                            <span>{obj.code || 'OBJ'}</span>
                            <span className="text-[#1677ff] font-sans font-semibold">
                              {obj.kpiIndicators.length} KPIs
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 line-clamp-2">{obj.title}</div>
                        </div>
                      ))}
                      {tierObjs.length === 0 && (
                        <div className="text-center py-4 text-[11px] text-slate-400 italic">
                          Chưa có mục tiêu
                        </div>
                      )}
                    </div>
                  </div>

                  {idx < 3 && (
                    <div className="hidden md:flex justify-center pt-3 text-slate-400">
                      <ArrowRight className="w-5 h-5 text-slate-400 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Links Summary Table */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-emerald-600" />
              Danh mục các Mắt xích Nhân - Quả Đang Kích Hoạt ({data?.links?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Mục tiêu Nguồn (Nguyên nhân / Nền tảng)</th>
                    <th className="py-2.5 px-3">Quan hệ Logic</th>
                    <th className="py-2.5 px-3">Mục tiêu Đích (Kết quả / Cấp trên)</th>
                    <th className="py-2.5 px-3 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.links || []).map((link) => {
                    const sourceObj = allObjectives.find((o) => o.id === link.sourceId);
                    const targetObj = allObjectives.find((o) => o.id === link.targetId);

                    return (
                      <tr key={link.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5">
                            {sourceObj?.code || 'OBJ'}
                          </span>
                          <span className="font-semibold text-slate-800">{sourceObj?.title || link.sourceId}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1677ff] border border-blue-200">
                            → {link.label || 'Thúc đẩy'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5">
                            {targetObj?.code || 'OBJ'}
                          </span>
                          <span className="font-semibold text-slate-800">{targetObj?.title || link.targetId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-slate-400 hover:text-red-500 transition p-1 rounded"
                            title="Xóa liên kết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!data?.links || data.links.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                        Chưa có liên kết nhân quả nào. Nhấn "Nối Liên Kết" hoặc "Nối Mẫu BSC" để thiết lập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Mục tiêu Chiến lược */}
      {isObjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thêm Mục tiêu Chiến lược BSC</h2>
              <button onClick={() => setIsObjModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObjective} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Viễn cảnh BSC *</label>
                <select
                  value={selectedPerspective}
                  onChange={(e) => setSelectedPerspective(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium text-slate-800"
                >
                  <option value="FINANCIAL">TÀI CHÍNH (Financial)</option>
                  <option value="CUSTOMER">KHÁCH HÀNG (Customer)</option>
                  <option value="INTERNAL_PROCESS">QUY TRÌNH NỘI BỘ (Internal Process)</option>
                  <option value="LEARNING_GROWTH">HỌC HỎI & PHÁT TRIỂN (Learning & Growth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-red-500 mr-0.5">*</span> Tên mục tiêu chiến lược
                </label>
                <input
                  type="text"
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  required
                  placeholder="VD: Gia tăng tỷ suất lợi nhuận trên vốn đầu tư..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã mục tiêu</label>
                <input
                  type="text"
                  value={objCode}
                  onChange={(e) => setObjCode(e.target.value)}
                  placeholder="VD: TC-01, KH-02..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết mục tiêu</label>
                <textarea
                  value={objDesc}
                  onChange={(e) => setObjDesc(e.target.value)}
                  rows={3}
                  placeholder="Định hướng và giải pháp trọng tâm..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsObjModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Tạo mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Liên Kết Nhân - Quả (Cause & Effect Link) */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Thiết Lập Mối Quan Hệ Nhân - Quả</h2>
                  <p className="text-[11px] text-slate-500">Nối đường mũi tên động giữa 2 mục tiêu chiến lược</p>
                </div>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu Nguồn (Nguyên nhân / Nền tảng) *
                </label>
                <select
                  value={linkSourceId}
                  onChange={(e) => setLinkSourceId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium text-slate-800"
                >
                  <option value="">-- Chọn mục tiêu nguồn --</option>
                  {allObjectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.code || 'OBJ'}] {o.title} ({o.perspective})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mục tiêu Đích (Kết quả đạt được / Cấp trên) *
                </label>
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium text-slate-800"
                >
                  <option value="">-- Chọn mục tiêu đích --</option>
                  {allObjectives
                    .filter((o) => o.id !== linkSourceId)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        [{o.code || 'OBJ'}] {o.title} ({o.perspective})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại quan hệ</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium"
                  >
                    <option value="DRIVES">Thúc đẩy trực tiếp (Drives)</option>
                    <option value="ENABLES">Tạo tiền đề nền tảng (Enables)</option>
                    <option value="IMPROVES">Tối ưu hóa hiệu suất (Improves)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhãn mô tả ngắn</label>
                  <input
                    type="text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="VD: Thúc đẩy SLA, Nâng cao năng lực..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Gợi ý nhãn nhanh:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Thúc đẩy năng suất',
                    'Đảm bảo SLA & trải nghiệm KH',
                    'Tăng trưởng doanh thu',
                    'Tối ưu hóa chi phí',
                    'Nền tảng số hóa',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setLinkLabel(s)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Xác nhận Nối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

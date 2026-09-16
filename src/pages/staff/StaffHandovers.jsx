import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, CheckCircle, Search, PackageCheck, UserCheck,
  Calendar, ClipboardCheck, User, FileText, Hash, ShieldCheck, Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { CLAIM_STATUS } from '../../constants';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import ImageUploadCamera from '../../components/common/ImageUploadCamera';
import { Modal } from '../../components/common/Modal';
import { formatDateTime, formatDate } from '../../utils';
import { toast } from 'sonner';

export default function StaffHandovers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState([]);
  const [readyClaims, setReadyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Handover modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [evidenceImage, setEvidenceImage] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [handoversData, claimsData, itemsData, usersData] = await Promise.all([
        claimService.getHandovers(),
        claimService.getClaims(),
        itemService.getItems(),
        userService.getUsers(),
      ]);

      const itemsMap = new Map(itemsData.map(i => [i.id, i]));
      const usersMap = new Map(usersData.map(u => [u.id, u]));

      // Enrich handover history
      const enrichedHandovers = handoversData.map(h => {
        const item = itemsMap.get(h.itemId);
        const receiver = usersMap.get(h.receiverId);
        const staff = usersMap.get(h.staffId || h.handoverBy);
        return {
          ...h,
          itemTitle: item?.title || h.itemId,
          itemImage: item?.images?.[0] || 'https://placehold.co/100x100?text=No+Image',
          receiverName: receiver?.fullName || receiver?.name || 'Người nhận',
          receiverIdCode: receiver?.studentId || receiver?.employeeId || '',
          receiverPhone: receiver?.phone || '',
          staffName: staff?.fullName || staff?.name || 'Nhân viên',
          handoverDate: h.date || h.createdAt,
          handoverNote: h.notes || h.note || '',
        };
      });

      setHandovers(enrichedHandovers);

      // Get claims ready for handover (for the quick-handover modal feature)
      const ready = claimsData
        .filter(c => [CLAIM_STATUS.APPROVED, CLAIM_STATUS.READY_FOR_HANDOVER].includes(c.status))
        .map(c => {
          const item = itemsMap.get(c.itemId);
          const claimant = usersMap.get(c.claimantId);
          return {
            ...c,
            itemTitle: item?.title || c.itemId,
            itemImage: item?.images?.[0] || 'https://placehold.co/100x100?text=No+Image',
            claimantName: claimant?.fullName || claimant?.name || 'Người nhận',
            claimantStudentId: claimant?.studentId || claimant?.employeeId || '',
            claimantPhone: claimant?.phone || '',
          };
        });

      setReadyClaims(ready);
    } catch (err) {
      console.error('Failed to load handovers:', err);
    } finally {
      setLoading(false);
    }
  };

  const openHandoverModal = (claim) => {
    setSelectedClaim(claim);
    setHandoverNote('');
    setEvidenceImage('');
    setHandoverModalOpen(true);
  };

  const handleCompleteHandover = async () => {
    if (!selectedClaim) return;
    if (!evidenceImage) {
      toast.error('Vui lòng chụp hoặc tải ảnh bằng chứng sinh viên nhận đồ');
      return;
    }
    setHandoverLoading(true);
    try {
      await claimService.completeHandover(selectedClaim.id, {
        staffId: user.id,
        notes: handoverNote,
        date: new Date().toISOString(),
        evidenceImage,
      });
      toast.success('Bàn giao tài sản thành công! Hồ sơ đã được lưu trữ.');
      setHandoverModalOpen(false);
      setSelectedClaim(null);
      setEvidenceImage('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể hoàn tất bàn giao');
    } finally {
      setHandoverLoading(false);
    }
  };

  const filtered = search
    ? handovers.filter(h =>
        h.id.toLowerCase().includes(search.toLowerCase()) ||
        h.itemTitle.toLowerCase().includes(search.toLowerCase()) ||
        h.receiverName.toLowerCase().includes(search.toLowerCase()) ||
        h.receiverIdCode.toLowerCase().includes(search.toLowerCase()) ||
        h.staffName.toLowerCase().includes(search.toLowerCase()) ||
        h.handoverNote.toLowerCase().includes(search.toLowerCase())
      )
    : handovers;

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-5 pb-10">
      {/* Back navigation row */}
      <div className="-mt-1 mb-2 flex items-center h-8">
        <button
          onClick={() => navigate('/staff/claims')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#344054] hover:text-[#981B1E] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-[#981B1E] group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách yêu cầu</span>
        </button>
      </div>

      {/* Header Title Card */}
      <div className="bg-white rounded-2xl p-6 md:p-7 border border-[#E8E2DD] shadow-[0_2px_10px_rgba(40,25,20,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[#18181B] flex items-center gap-3 leading-snug">
            <div className="w-10 h-10 rounded-xl bg-[#981B1E]/10 text-[#981B1E] flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5.5 h-5.5 text-[#981B1E]" />
            </div>
            <span>Bàn giao tài sản &amp; Nhật ký</span>
          </h1>
          <p className="text-sm md:text-[15px] text-[#667085] mt-1.5 leading-relaxed">
            Xác nhận trao trả tài sản cho chủ sở hữu và tra cứu lịch sử hồ sơ bàn giao
          </p>
        </div>
      </div>

      {/* Chờ bàn giao (Quick handover ready list) */}
      {readyClaims.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-700" />
              <h2 className="font-bold text-slate-900 text-base">Chờ bàn giao</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">{readyClaims.length}</span>
            </div>
            <span className="text-xs text-slate-500">Đã duyệt, sẵn sàng trao trả</span>
          </div>

          <div className="divide-y divide-purple-100">
            {readyClaims.map(claim => (
              <div
                key={claim.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={claim.itemImage}
                    alt={claim.itemTitle}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {claim.itemTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{claim.id}</span>
                      <span>→</span>
                      <span className="font-semibold text-slate-900">{claim.claimantName}</span>
                      {claim.claimantStudentId && (
                        <span className="text-slate-400">(MSSV: {claim.claimantStudentId})</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 shrink-0 rounded-xl"
                  icon={CheckCircle}
                  onClick={() => openHandoverModal(claim)}
                >
                  Xác nhận bàn giao
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tổng lượt bàn giao</p>
            <p className="text-3xl font-extrabold text-emerald-700">{loading ? '...' : handovers.length}</p>
            <p className="text-xs text-slate-400 mt-1">Giao dịch hoàn tất &amp; lưu biên bản</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#88171B]/20 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tỉ lệ trao trả</p>
            <p className="text-3xl font-extrabold text-[#88171B]">100%</p>
            <p className="text-xs text-slate-400 mt-1">Đã xác minh và lập biên bản đầy đủ</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#88171B]/10 text-[#88171B] flex items-center justify-center border border-[#88171B]/20 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Xác nhận trực tiếp</p>
            <p className="text-3xl font-extrabold text-slate-900">{loading ? '...' : handovers.length}</p>
            <p className="text-xs text-slate-400 mt-1">Tại quầy Lost &amp; Found DNTU</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã bàn giao (H001...), vật phẩm, tên người nhận, MSSV..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#88171B] focus:ring-1 focus:ring-[#88171B] bg-slate-50/50 text-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Handover History Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#88171B]" />
          <h2 className="font-bold text-slate-900 text-base">Hồ sơ Bàn giao (Handover Records History)</h2>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Truck}
              title="Chưa có dữ liệu bàn giao"
              description="Khi sinh viên đến nhận lại tài sản, nhân viên xác nhận sẽ tạo hồ sơ bàn giao tại đây."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-[#F3F4F6] text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-4">Mã bàn giao</th>
                    <th className="py-4 px-4">Vật phẩm</th>
                    <th className="py-4 px-4">Người nhận (Tên + MSSV)</th>
                    <th className="py-4 px-4">Nhân viên bàn giao</th>
                    <th className="py-4 px-4">Ngày bàn giao</th>
                    <th className="py-4 px-4">Ghi chú bàn giao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {paginated.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#88171B] text-xs">
                        #{h.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={h.itemImage}
                            alt={h.itemTitle}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 line-clamp-1 max-w-[180px]" title={h.itemTitle}>
                              {h.itemTitle}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              Claim: {h.claimId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-900">{h.receiverName}</p>
                        <div className="text-xs text-slate-500 space-x-1 mt-0.5">
                          {h.receiverIdCode && <span>MSSV: {h.receiverIdCode}</span>}
                          {h.receiverIdCode && h.receiverPhone && <span>•</span>}
                          {h.receiverPhone && <span>SĐT: {h.receiverPhone}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                          <User className="w-3 h-3 text-slate-500" />
                          {h.staffName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateTime(h.handoverDate)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs max-w-[280px]">
                        <p className="line-clamp-2" title={h.handoverNote}>
                          {h.handoverNote || <span className="text-slate-400 italic">Không có ghi chú</span>}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#F3F4F6]">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Xác nhận bàn giao */}
      <Modal
        isOpen={handoverModalOpen}
        onClose={() => setHandoverModalOpen(false)}
        title="Biên bản Xác nhận bàn giao tài sản"
      >
        {selectedClaim && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto px-1 py-1">
            {/* Info Banner */}
            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200">
              Bạn đang lập biên bản bàn giao tài sản tại Bộ phận Lost &amp; Found DNTU.
            </div>

            {/* Thông tin vật phẩm */}
            <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl border border-cream-200">
              <img
                src={selectedClaim.itemImage}
                alt={selectedClaim.itemTitle}
                className="w-12 h-12 rounded-lg object-cover border border-cream-300 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-dark text-sm truncate">{selectedClaim.itemTitle}</p>
                <p className="text-xs text-warm-gray-500 font-mono">Claim: {selectedClaim.id}</p>
              </div>
            </div>

            {/* Summary rows */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-cream-100">
                <span className="text-warm-gray-500 font-medium">Người nhận:</span>
                <span className="font-bold text-text-dark">{selectedClaim.claimantName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-cream-100">
                <span className="text-warm-gray-500 font-medium">MSSV / Mã nhân viên:</span>
                <span className="font-mono font-semibold">{selectedClaim.claimantStudentId || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-cream-100">
                <span className="text-warm-gray-500 font-medium">Nhân viên thực hiện:</span>
                <span className="font-bold text-text-dark">{user?.fullName || user?.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-cream-100">
                <span className="text-warm-gray-500 font-medium">Ngày bàn giao:</span>
                <span className="font-semibold">{formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Chụp ảnh bằng chứng nhận đồ */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-dark">
                Bằng chứng sinh viên nhận đồ <span className="text-red-500">*</span>
              </label>
              <ImageUploadCamera
                value={evidenceImage}
                onChange={setEvidenceImage}
                label="Chụp hoặc tải ảnh sinh viên cùng thẻ SV khi nhận đồ"
              />
            </div>

            {/* Ghi chú bàn giao */}
            <Textarea
              label="Ghi chú bàn giao"
              placeholder="Ghi chú (ví dụ: đã kiểm tra CCCD/Thẻ SV trực tiếp, tài sản còn nguyên vẹn, sinh viên xác nhận nhận đồ)..."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              rows={3}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-cream-200 sticky bottom-0 bg-white p-2 -mx-1">
              <Button variant="ghost" onClick={() => setHandoverModalOpen(false)}>Hủy</Button>
              <Button
                variant="primary"
                className="bg-emerald-700 hover:bg-emerald-800"
                loading={handoverLoading}
                onClick={handleCompleteHandover}
                icon={CheckCircle}
              >
                Xác nhận bàn giao thành công
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

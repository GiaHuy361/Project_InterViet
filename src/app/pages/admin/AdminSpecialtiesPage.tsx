import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import mentorSpecialtyService, { MentorSpecialtyDto } from '../../../services/mentorSpecialtyService';
import { toast } from 'sonner';

export const AdminSpecialtiesPage: React.FC = () => {
  const [specialties, setSpecialties] = useState<MentorSpecialtyDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<MentorSpecialtyDto | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSpecialties = async () => {
    setLoading(true);
    try {
      const response = await mentorSpecialtyService.getAdminSpecialties();
      setSpecialties(response || []);
    } catch (error) {
      console.error('Failed to fetch specialties', error);
      toast.error('Lỗi khi tải danh sách chuyên môn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const openAddModal = () => {
    setEditingSpecialty(null);
    setCode('');
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (specialty: MentorSpecialtyDto) => {
    setEditingSpecialty(specialty);
    setCode(specialty.code);
    setName(specialty.name);
    setDescription(specialty.description || '');
    setIsModalOpen(true);
  };

  const openDeleteModal = (specialty: MentorSpecialtyDto) => {
    setEditingSpecialty(specialty);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên chuyên môn không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSpecialty) {
        await mentorSpecialtyService.updateSpecialty(editingSpecialty.id, {
          name: name.trim(),
          description: description.trim()
        });
        toast.success('Cập nhật chuyên môn thành công');
      } else {
        if (!code.trim()) {
          toast.error('Mã chuyên môn không được để trống');
          setSubmitting(false);
          return;
        }
        await mentorSpecialtyService.createSpecialty({
          code: code.trim(),
          name: name.trim(),
          description: description.trim()
        });
        toast.success('Thêm chuyên môn thành công');
      }
      closeModal();
      fetchSpecialties();
    } catch (error: any) {
      console.error('Submit error', error);
      toast.error(error?.response?.data?.detail || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSpecialty) return;
    setSubmitting(true);
    try {
      await mentorSpecialtyService.deleteSpecialty(editingSpecialty.id);
      toast.success('Xóa chuyên môn thành công');
      closeModal();
      fetchSpecialties();
    } catch (error: any) {
      console.error('Delete error', error);
      if (error?.response?.data?.code === 'Specialty.InUse') {
        toast.error('Chuyên môn này đang được sử dụng và không thể xóa');
      } else {
        toast.error('Có lỗi xảy ra khi xóa');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200 dark:shadow-none">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Quản lý Chuyên môn Mentor</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Quản lý danh mục chuyên môn hệ thống</p>
          </div>
        </div>

        <Button onClick={openAddModal} className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Thêm mới
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Danh sách chuyên môn</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{loading ? 'Đang tải...' : `${specialties.length} kết quả`}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-950/70">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã (Code)</th>
                <th className="px-6 py-4 font-semibold">Tên Chuyên Môn</th>
                <th className="px-6 py-4 font-semibold">Mô tả</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-cyan-500 mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : specialties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Chưa có danh mục chuyên môn nào.
                  </td>
                </tr>
              ) : (
                specialties.map((spec) => (
                  <tr key={spec.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                      {spec.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-cyan-700 dark:text-cyan-400">
                      {spec.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 truncate max-w-[300px]" title={spec.description}>
                      {spec.description || <span className="italic text-gray-400">Không có mô tả</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(spec)} className="h-8 w-8 p-0 text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(spec)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">
              {editingSpecialty ? 'Cập nhật Chuyên môn' : 'Thêm mới Chuyên môn'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mã (Code)</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  disabled={!!editingSpecialty}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 disabled:opacity-50"
                  placeholder="Ví dụ: backend_dev"
                  required={!editingSpecialty}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tên (Name)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  placeholder="Ví dụ: Lập trình Backend"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mô tả (Description)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none h-24"
                  placeholder="Nhập mô tả chuyên môn..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl">
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa chuyên môn <span className="font-semibold text-gray-900 dark:text-slate-100">{editingSpecialty?.name}</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl">
                Hủy
              </Button>
              <Button type="button" onClick={handleDelete} disabled={submitting} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xóa chuyên môn'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpecialtiesPage;

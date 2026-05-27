import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import adminSystemService from '../../../services/adminSystemService';

export const AdminDevPromoteModal: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await adminSystemService.promoteAdminDev({ email, roleCode });
      setResult(resp?.message || 'Thành công');
    } catch (err: any) {
      setResult(err?.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dev: Promote user role</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Select value={roleCode} onValueChange={setRoleCode}>
            <SelectTrigger className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="support">support</SelectItem>
            </SelectContent>
          </Select>

          {result && <div className="text-sm text-gray-700">{result}</div>}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Đóng</Button>
            <Button onClick={submit} disabled={loading || !email} className="flex-1">
              {loading ? 'Đang...' : 'Thực hiện'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDevPromoteModal;

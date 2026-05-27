import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Copy } from 'lucide-react';

const samples: { title: string; json: object }[] = [
  {
    title: 'Ticket detail (public)',
    json: {
      success: true,
      message: null,
      data: {
        id: '7fa84be2-ca15-4ba8-bc19-58b4da79f42d',
        ticketNumber: 'TK-20260521004512-385',
        category: 'technical',
        priority: 'medium',
        subject: 'Không thể tải lên CV định dạng PDF',
        status: 'in_progress',
        description:
          'Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.',
        assignedTo: 'Support Staff A',
        createdAt: '2026-05-21T00:45:12Z',
        closedAt: null,
        lastMessageAt: '2026-05-21T00:50:00Z',
        messages: [
          {
            id: 'bc8c7d24-8f0a-48d6-ae4f-561b36bc2150',
            senderType: 'support',
            senderUserId: 'a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d',
            messageBody:
              'Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn. Vui lòng đợi trong giây lát.',
            createdAt: '2026-05-21T00:50:00Z',
            isInternalNote: false,
          },
        ],
      },
      meta: { requestId: '0HMTRSPV9QNS7', timestamp: '2026-05-21T00:51:00Z' },
    },
  },
  {
    title: 'Ticket detail (admin, includes internal notes)',
    json: {
      success: true,
      message: null,
      data: {
        id: '7fa84be2-ca15-4ba8-bc19-58b4da79f42d',
        ticketNumber: 'TK-20260521004512-385',
        category: 'technical',
        priority: 'medium',
        subject: 'Không thể tải lên CV định dạng PDF',
        status: 'in_progress',
        description:
          'Hệ thống báo lỗi không xác định khi tôi cố gắng tải lên file CV dài 2 trang dạng PDF dung lượng 1.5MB.',
        assignedTo: 'Support Staff A',
        createdAt: '2026-05-21T00:45:12Z',
        closedAt: null,
        lastMessageAt: '2026-05-21T01:10:00Z',
        messages: [
          {
            id: '11111111-2222-3333-4444-555555555555',
            senderType: 'support',
            senderUserId: 'a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d',
            messageBody:
              'HỒ SƠ NỘI BỘ: Ứng viên này đã từng đăng tải file CV lỗi do parser lỗi font chữ tiếng Việt Unicode tổ hợp. Kỹ thuật cần patch lại module parse.',
            createdAt: '2026-05-21T01:08:00Z',
            isInternalNote: true,
          },
          {
            id: 'bc8c7d24-8f0a-48d6-ae4f-561b36bc2150',
            senderType: 'support',
            senderUserId: 'a9b1c2d3-e4f5-5a6b-7c8d-9e0f1a2b3c4d',
            messageBody:
              'Xin chào ứng viên, bộ phận kỹ thuật đang kiểm tra file PDF của bạn. Vui lòng đợi trong giây lát.',
            createdAt: '2026-05-21T01:10:00Z',
            isInternalNote: false,
          },
        ],
      },
      meta: { requestId: '0HMTRSPV9QNT1', timestamp: '2026-05-21T01:12:00Z' },
    },
  },
  {
    title: 'Feature gate disabled (503) sample',
    json: {
      type: 'https://api.interviet.vn/errors/service-unavailable',
      title: 'ServiceUnavailable',
      detail: 'Admin features are currently disabled.',
      code: 'Admin.Disabled',
    },
  },
  {
    title: 'Forbidden (403) sample',
    json: {
      type: 'https://api.interviet.vn/errors/forbidden',
      title: 'Forbidden',
      detail: 'You do not have permission to access this resource.',
      code: 'Forbidden',
    },
  },
];

function PrettyJson({ data }: { data: object }) {
  const text = JSON.stringify(data, null, 2);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
  };
  return (
    <div className="relative">
      <pre className="max-h-[40vh] overflow-auto rounded-md bg-slate-50 dark:bg-slate-950 p-4 text-sm">{text}</pre>
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="sm" onClick={copy}>
          <Copy className="mr-2 h-4 w-4" />Copy
        </Button>
      </div>
    </div>
  );
}

export const AdminJsonSamplesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System JSON Samples</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Standard response samples and error shapes used by backend (RFC7807, API envelope)</p>
        </div>
      </div>

      <div className="grid gap-4">
        {samples.map((s) => (
          <Card key={s.title} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">JSON shape</p>
              </div>
            </div>
            <div className="mt-3">
              <PrettyJson data={s.json} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminJsonSamplesPage;

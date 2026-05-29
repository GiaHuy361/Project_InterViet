import { apiClient } from '../lib/api/apiClient';

export interface BillingProviderRecord {
  provider: 'vnpay' | 'momo' | 'stripe' | 'payos' | string;
  displayName: string;
  isMock: boolean;
  enabled: boolean;
}

export interface BillingCheckoutRequest {
  /** Có thể truyền planId HOẶC planKey. Backend ưu tiên planId nếu có cả hai. */
  planId?: string;
  planKey?: string;
  provider: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface BillingCheckoutSessionResponse {
  checkoutSessionId: string;
  /** paymentId == checkoutSessionId trong hệ thống hiện tại (Phase 18) */
  paymentId?: string;
  checkoutUrl: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | string;
  expiresAt?: string;
  expiredAt?: string;
  provider: string;
  planKey: string;
  contextType: 'subscription' | 'mentor_booking' | string;
  amount: number;
  currencyCode: string;
  paymentInstructionsUrl: string;
  bookingId?: string | null;
}

/**
 * Trạng thái giao dịch trả về từ GET /billing/payments/{id}
 * Dùng cho Polling fallback trên trang Success/Cancel.
 */
export interface PaymentStatusResponse {
  id: string;
  provider: string;
  planKey: string;
  checkoutSessionId: string;
  purpose: 'subscription_plan' | 'mentor_booking' | string;
  description: string;
  amount: number;
  currencyCode: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  paidAt: string | null;
  failedAt: string | null;
}

export interface BillingPaymentInstructionsResponse {
  checkoutSessionId: string;
  planKey: string;
  purpose: 'subscription_plan' | 'mentor_booking' | string;
  description: string;
  amount: number;
  currencyCode: string;
  merchant: {
    merchantName: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  transfer: {
    requiredContent: string;
    amount: number;
    currencyCode: string;
  };
  qr: {
    payload: string;
    imageBase64: string;
  };
}

export interface BillingBankTransferRequest {
  payerAccountNumber: string;
  payerAccountName: string;
  amountPaid: number;
  transferContent: string;
}

export interface BillingTransferAttempt {
  id: string;
  checkoutSessionId: string;
  provider: string;
  method: 'bank_transfer' | string;
  payerAccountNumberMasked: string;
  payerAccountName: string;
  amountPaid: number;
  transferContent: string;
  status: 'submitted' | 'accepted' | 'rejected' | string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface BillingCheckoutSuccessInfo {
  checkoutSessionId: string;
  paymentTransactionId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  isIdempotent?: boolean;
  emailSent?: boolean;
  subscriptionId?: string;
  bookingId?: string;
}

export interface BillingBankTransferResponse {
  checkoutSessionId: string;
  status: 'succeeded' | 'failed' | 'pending' | string;
  attempt: BillingTransferAttempt;
  successInfo?: BillingCheckoutSuccessInfo | null;
}

export interface BillingCheckoutAttemptResponse {
  id: string;
  checkoutSessionId: string;
  provider: string;
  method: string;
  payerAccountNumberMasked: string;
  payerAccountName: string;
  amountPaid: number;
  transferContent: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface BillingCheckoutAttemptListResponse {
  success: boolean;
  data: BillingCheckoutAttemptResponse[];
  meta?: unknown;
}

export interface BillingCheckoutSimulationResponse {
  success: boolean;
  data?: unknown;
  message?: string | null;
}

export async function getBillingProviders(): Promise<BillingProviderRecord[]> {
  return apiClient.get<BillingProviderRecord[]>('/billing/providers');
}

export async function createBillingCheckoutSession(
  payload: BillingCheckoutRequest
): Promise<BillingCheckoutSessionResponse> {
  return apiClient.post<BillingCheckoutSessionResponse>(
    '/billing/checkout',
    payload
  );
}

export async function getBillingPaymentInstructions(
  checkoutSessionId: string
): Promise<BillingPaymentInstructionsResponse> {
  return apiClient.get<BillingPaymentInstructionsResponse>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/payment-instructions`
  );
}

export async function submitBillingBankTransfer(
  checkoutSessionId: string,
  payload: BillingBankTransferRequest
): Promise<BillingBankTransferResponse> {
  return apiClient.post<BillingBankTransferResponse>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/submit-bank-transfer`,
    payload
  );
}

export async function getBillingCheckoutAttempts(
  checkoutSessionId: string
): Promise<BillingTransferAttempt[]> {
  return apiClient.get<BillingTransferAttempt[]>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/attempts`
  );
}

export async function simulateBillingCheckoutSuccess(
  checkoutSessionId: string
): Promise<BillingCheckoutSimulationResponse> {
  return apiClient.post<BillingCheckoutSimulationResponse>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/simulate-success`,
    {}
  );
}

export async function simulateBillingCheckoutFailed(
  checkoutSessionId: string
): Promise<BillingCheckoutSimulationResponse> {
  return apiClient.post<BillingCheckoutSimulationResponse>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/simulate-failed`,
    {}
  );
}

export async function simulateBillingCheckoutCancelled(
  checkoutSessionId: string
): Promise<BillingCheckoutSimulationResponse> {
  return apiClient.post<BillingCheckoutSimulationResponse>(
    `/billing/checkout-sessions/${encodeURIComponent(checkoutSessionId)}/simulate-cancelled`,
    {}
  );
}

export async function getInvoices(): Promise<unknown[]> {
  return apiClient.get<unknown[]>('/billing/invoices');
}

export async function getPayments(): Promise<unknown[]> {
  return apiClient.get<unknown[]>('/billing/payments');
}

/**
 * Lấy trạng thái giao dịch theo paymentId (hoặc checkoutSessionId).
 * Dùng làm Polling Fallback khi SignalR không khả dụng.
 * Phase 18 – GET /api/v1/billing/payments/{id}
 */
export async function getPaymentById(paymentId: string): Promise<PaymentStatusResponse> {
  return apiClient.get<PaymentStatusResponse>(`/billing/payments/${encodeURIComponent(paymentId)}`);
}

export default {
  getBillingProviders,
  createBillingCheckoutSession,
  getBillingPaymentInstructions,
  submitBillingBankTransfer,
  getBillingCheckoutAttempts,
  simulateBillingCheckoutSuccess,
  simulateBillingCheckoutFailed,
  simulateBillingCheckoutCancelled,
  getInvoices,
  getPayments,
  getPaymentById,
};

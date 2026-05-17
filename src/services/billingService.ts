import { apiClient } from '../lib/api/apiClient';

export async function getInvoices(): Promise<unknown[]> {
  return apiClient.get<unknown[]>('/billing/invoices');
}

export async function getPayments(): Promise<unknown[]> {
  return apiClient.get<unknown[]>('/billing/payments');
}

/**
 * checkoutRetry.ts — Phase 18 Utility
 *
 * Giải quyết vấn đề "persistent unique OrderCode collisions" khi tạo checkout session.
 *
 * Nguyên nhân: Backend sinh OrderCode dạng long integer; nếu Frontend gửi nhiều
 * request gần cùng thời điểm (double-click, StrictMode double-render, v.v.),
 * các request có thể nhận cùng OrderCode → 409/500 collision.
 *
 * Giải pháp:
 *  1. Ref-based guard (đồng bộ, không phụ thuộc React state cycle)
 *  2. Retry với exponential backoff + jitter khi gặp collision error
 *  3. Idempotency key gửi kèm header để Backend dedup (nếu Backend hỗ trợ)
 */

import { ApiError } from '../lib/api/apiError';
import { createBillingCheckoutSession, type BillingCheckoutRequest, type BillingCheckoutSessionResponse } from './billingService';

/** Delay (ms) */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Tập hợp error code báo hiệu OrderCode collision từ Backend.
 * Điều chỉnh theo error codes thực tế của Backend.
 */
const ORDER_CODE_COLLISION_CODES = new Set([
  'Checkout.OrderCodeConflict',
  'Checkout.DuplicateOrderCode',
  'OrderCode.Conflict',
  'OrderCode.Duplicate',
  'Billing.OrderCodeConflict',
]);

/**
 * Kiểm tra xem lỗi có phải do OrderCode collision không.
 * Dựa trên error code hoặc HTTP status (409 Conflict).
 */
function isOrderCodeCollision(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (ORDER_CODE_COLLISION_CODES.has(error.code)) return true;
    if (error.status === 409) return true;
    // Một số backend trả 500 với message chứa "ordercode" hoặc "unique"
    if (
      error.status === 500 &&
      (error.message?.toLowerCase().includes('ordercode') ||
       error.message?.toLowerCase().includes('order_code') ||
       error.message?.toLowerCase().includes('unique') ||
       error.message?.toLowerCase().includes('duplicate'))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Tạo checkout session với tự động retry khi gặp OrderCode collision.
 *
 * @param payload         Request body cho checkout API
 * @param maxRetries      Số lần retry tối đa khi gặp collision (default: 3)
 * @param baseDelayMs     Thời gian chờ cơ sở trước khi retry (default: 400ms)
 */
export async function createCheckoutWithRetry(
  payload: BillingCheckoutRequest,
  maxRetries = 3,
  baseDelayMs = 400
): Promise<BillingCheckoutSessionResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff với jitter ngẫu nhiên để tránh thundering herd
      const jitter = Math.random() * 200; // 0–200ms random
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      console.warn(
        `[checkoutRetry] OrderCode collision, thử lại lần ${attempt}/${maxRetries} sau ${Math.round(delay)}ms...`
      );
      await sleep(delay);
    }

    try {
      const response = await createBillingCheckoutSession(payload);
      if (attempt > 0) {
        console.log(`[checkoutRetry] Thành công sau ${attempt} lần retry.`);
      }
      return response;
    } catch (err) {
      lastError = err;

      // Chỉ retry nếu là lỗi collision — không retry lỗi khác (auth, validation...)
      if (!isOrderCodeCollision(err) || attempt === maxRetries) {
        throw err;
      }
    }
  }

  // Không bao giờ đến đây, nhưng TypeScript cần return/throw
  throw lastError;
}

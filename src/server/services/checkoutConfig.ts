import { prisma } from "@/server/db/client";
import { PaymentMethod } from "@/types";
import { isPaymobConfigured } from "./paymob/paymobClient";
import { getOrderingStatus } from "@/server/config/ordering";

export type CheckoutConfig = {
  enabledPaymentMethods: PaymentMethod[];
  deliveryFee: number;
  codFee: number;
  paymobEnabled: boolean;
  orderingEnabled: boolean;
  orderingMessage?: string;
};

const DEFAULT_CONFIG: CheckoutConfig = {
  enabledPaymentMethods: [
    PaymentMethod.CARD,
    PaymentMethod.WALLET,
    PaymentMethod.CASH,
  ],
  deliveryFee: 15,
  codFee: 0,
  paymobEnabled: false,
  orderingEnabled: true,
};

function parsePaymentMethods(value: unknown): PaymentMethod[] | null {
  if (!Array.isArray(value)) return null;
  const methods: PaymentMethod[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (!Object.values(PaymentMethod).includes(item as PaymentMethod))
      return null;
    methods.push(item as PaymentMethod);
  }
  return methods;
}

export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  try {
    const { orderingEnabled, orderingMessage } = getOrderingStatus();
    const row = await prisma.checkoutConfig.findUnique({
      where: { id: "checkout" },
      select: {
        enabledPaymentMethods: true,
        deliveryFee: true,
        codFee: true,
      },
    });

    const enabledPaymentMethods =
      parsePaymentMethods(row?.enabledPaymentMethods) ||
      DEFAULT_CONFIG.enabledPaymentMethods;

    // Check if Paymob is configured
    const paymobEnabled = isPaymobConfigured();

    // Respect DB/admin-configured methods, but never expose online methods when Paymob is disabled.
    const finalPaymentMethods = enabledPaymentMethods.filter((method) =>
      paymobEnabled ? true : method === PaymentMethod.CASH,
    );

    // Safety fallback to ensure checkout always has at least CASH.
    if (finalPaymentMethods.length === 0) {
      finalPaymentMethods.push(PaymentMethod.CASH);
    }

    if (!row) {
      return {
        ...DEFAULT_CONFIG,
        enabledPaymentMethods: finalPaymentMethods,
        paymobEnabled,
        orderingEnabled,
        orderingMessage,
      };
    }

    return {
      enabledPaymentMethods: finalPaymentMethods,
      deliveryFee: Number(row.deliveryFee),
      codFee: Number(row.codFee),
      paymobEnabled,
      orderingEnabled,
      orderingMessage,
    };
  } catch {
    const { orderingEnabled, orderingMessage } = getOrderingStatus();
    const paymobEnabled = isPaymobConfigured();
    const fallbackMethods = paymobEnabled
      ? [PaymentMethod.CARD, PaymentMethod.WALLET, PaymentMethod.CASH]
      : [PaymentMethod.CASH];

    return {
      ...DEFAULT_CONFIG,
      enabledPaymentMethods: fallbackMethods,
      paymobEnabled,
      orderingEnabled,
      orderingMessage,
    };
  }
}

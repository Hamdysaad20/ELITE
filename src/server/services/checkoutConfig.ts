import { prisma } from "@/server/db/client";
import { PaymentMethod } from "@/types";
import { isPaymobConfigured } from "./paymob/paymobClient";

export type CheckoutConfig = {
  enabledPaymentMethods: PaymentMethod[];
  deliveryFee: number;
  codFee: number;
  paymobEnabled: boolean;
};

const DEFAULT_CONFIG: CheckoutConfig = {
  // Online-only checkout (no COD / no offline methods)
  enabledPaymentMethods: [PaymentMethod.CARD, PaymentMethod.WALLET],
  deliveryFee: 15,
  codFee: 0,
  paymobEnabled: false,
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

    // Online-only: when Paymob isn't configured, disable checkout payment methods entirely.
    const finalPaymentMethods = paymobEnabled
      ? [PaymentMethod.CARD, PaymentMethod.WALLET]
      : [];

    if (!row) {
      return {
        ...DEFAULT_CONFIG,
        enabledPaymentMethods: finalPaymentMethods,
        paymobEnabled,
      };
    }

    return {
      enabledPaymentMethods: finalPaymentMethods,
      deliveryFee: Number(row.deliveryFee),
      codFee: Number(row.codFee),
      paymobEnabled,
    };
  } catch {
    return {
      ...DEFAULT_CONFIG,
      enabledPaymentMethods: isPaymobConfigured()
        ? [PaymentMethod.CARD, PaymentMethod.WALLET]
        : [],
      paymobEnabled: isPaymobConfigured(),
    };
  }
}

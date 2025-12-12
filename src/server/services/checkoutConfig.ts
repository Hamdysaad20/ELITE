import { prisma } from "@/server/db/client";
import { PaymentMethod } from "@/types";

export type CheckoutConfig = {
  enabledPaymentMethods: PaymentMethod[];
  deliveryFee: number;
  codFee: number;
};

const DEFAULT_CONFIG: CheckoutConfig = {
  enabledPaymentMethods: [PaymentMethod.CASH],
  deliveryFee: 15,
  codFee: 0,
};

function parsePaymentMethods(value: unknown): PaymentMethod[] | null {
  if (!Array.isArray(value)) return null;
  const methods: PaymentMethod[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (!Object.values(PaymentMethod).includes(item as PaymentMethod)) return null;
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

    if (!row) return DEFAULT_CONFIG;

    const enabledPaymentMethods =
      parsePaymentMethods(row.enabledPaymentMethods) || DEFAULT_CONFIG.enabledPaymentMethods;

    return {
      enabledPaymentMethods,
      deliveryFee: Number(row.deliveryFee),
      codFee: Number(row.codFee),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

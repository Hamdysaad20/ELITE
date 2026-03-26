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

    // Always provide all methods to the frontend;
    // The frontend will disable online methods dynamically based on orderingEnabled.
    const finalPaymentMethods = [
      PaymentMethod.CARD,
      PaymentMethod.WALLET,
      PaymentMethod.CASH,
    ];

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
    return {
      ...DEFAULT_CONFIG,
      enabledPaymentMethods: [
        PaymentMethod.CARD,
        PaymentMethod.WALLET,
        PaymentMethod.CASH,
      ],
      paymobEnabled: isPaymobConfigured(),
      orderingEnabled,
      orderingMessage,
    };
  }
}

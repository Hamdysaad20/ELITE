import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "../../setup/prisma";
import { POST } from "@/app/api/admin/inventory/route";

const { requireRoleMock, reconcileMock } = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  reconcileMock: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  requireRole: requireRoleMock,
}));

vi.mock("@/server/services/inventoryReconciliation", () => ({
  reconcileSubmittedInventoryCount: reconcileMock,
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/inventory", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const basePayload = {
  location: "bar",
  shiftConfirmed: "morning",
  countType: "regular",
  submit: true,
  entries: [
    {
      itemId: "00000000-0000-0000-0000-000000000001",
      quantity: 5,
      packsCount: 0,
      looseSingles: 0,
    },
  ],
};

describe("admin inventory POST flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.inventoryItem.findMany.mockResolvedValue([
      { id: "00000000-0000-0000-0000-000000000001", packSize: 1 },
    ] as never);
  });

  it("blocks non-head-barista from submitting once a shift count is already submitted", async () => {
    requireRoleMock.mockResolvedValue({ id: "user-1", role: "barista" });
    prismaMock.inventoryCount.findFirst
      .mockResolvedValueOnce({ id: "submitted-1", countedById: "other-user" } as never)
      .mockResolvedValueOnce(null as never);

    const response = await POST(makeRequest(basePayload));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.success).toBe(false);
    expect(prismaMock.inventoryCount.create).not.toHaveBeenCalled();
  });

  it("allows head barista to overwrite with correction count", async () => {
    requireRoleMock.mockResolvedValue({ id: "head-1", role: "head_barista" });
    prismaMock.inventoryCount.findFirst
      .mockResolvedValueOnce({ id: "submitted-1", countedById: "barista-1" } as never)
      .mockResolvedValueOnce(null as never);
    prismaMock.inventoryCount.create.mockResolvedValue({
      id: "count-new",
      entries: [],
    } as never);
    reconcileMock.mockResolvedValue({ created: 1, skipped: false });

    const response = await POST(makeRequest(basePayload));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.overwrite).toBe(true);
    expect(payload.overwrittenCountId).toBe("submitted-1");
    expect(prismaMock.inventoryCount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          countType: "correction",
          correctionOfId: "submitted-1",
        }),
      }),
    );
  });

  it("promotes existing draft into correction when head barista submits override", async () => {
    requireRoleMock.mockResolvedValue({ id: "head-1", role: "head_barista" });
    prismaMock.inventoryCount.findFirst
      .mockResolvedValueOnce({ id: "submitted-1", countedById: "barista-1" } as never)
      .mockResolvedValueOnce({ id: "draft-1" } as never);
    prismaMock.inventoryCount.update.mockResolvedValue({
      id: "draft-1",
      entries: [],
    } as never);
    reconcileMock.mockResolvedValue({ created: 1, skipped: false });

    const response = await POST(makeRequest(basePayload));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.updated).toBe(true);
    expect(payload.overwrite).toBe(true);
    expect(prismaMock.inventoryCount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          countType: "correction",
          correctionOfId: "submitted-1",
          status: "submitted",
        }),
      }),
    );
  });

  it("rejects non-regular count types unless they are valid overwrite submissions", async () => {
    requireRoleMock.mockResolvedValue({ id: "user-2", role: "barista" });
    prismaMock.inventoryCount.findFirst
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(null as never);

    const response = await POST(
      makeRequest({
        ...basePayload,
        countType: "correction",
        submit: false,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(prismaMock.inventoryCount.create).not.toHaveBeenCalled();
  });
});

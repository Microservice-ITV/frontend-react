import { describe, expect, it } from "vitest";
import {
  accountingReferenceKey,
  formatAccountingReferences,
  toExpenseReferenceInput,
} from "./accountingReferenceFormatting";

describe("accounting reference formatting", () => {
  it("formats generated sequence references using their embedded date", () => {
    const input = {
      referenceType: "EXPENSE",
      referenceId: "DELI-INVOICE-20261009-0003",
      date: "2026-10-19",
    };

    expect(
      formatAccountingReferences([input]).get(accountingReferenceKey(input)),
    ).toBe("DELI-INVOICE-091026-0003");
  });

  it("formats expense IDs with a sequence in expense detail style", () => {
    const input = {
      referenceType: "EXPENSE",
      referenceId: "EXP-2026-0001",
      date: "2026-09-21",
    };

    expect(
      formatAccountingReferences([input]).get(accountingReferenceKey(input)),
    ).toBe("EXP-210926-0001");
  });

  it("formats Deli per-order expenses with the order basis and a display sequence", () => {
    const input = toExpenseReferenceInput({
      expenseNo: "DELI-ORDER-0123456789abcdef",
      expenseDate: "2026-10-19",
      categoryCode: "DELI",
      description: "Delivery charge (PER_ORDER)",
    });

    expect(formatAccountingReferences([input]).get(accountingReferenceKey(input)))
      .toBe("DELI-ORDER-191026-0001");
  });

  it("formats Deli order journal references the same as expense records", () => {
    const expenseInput = toExpenseReferenceInput({
      expenseNo: "DELI-ORDER-fe490d95a1e7a4d1243b",
      expenseDate: "2026-10-19",
      categoryCode: "DELI",
      description: "Delivery expense (PER_ORDER)",
    });
    const transactionInput = {
      referenceType: "EXPENSE",
      referenceId: "DELI-ORDER-fe490d95a1e7a4d1243b",
      date: "2026-10-19",
    };
    const inputs = [expenseInput, transactionInput];
    const formatted = formatAccountingReferences(inputs);

    expect(formatted.get(accountingReferenceKey(expenseInput))).toBe(
      "DELI-ORDER-191026-0001",
    );
    expect(formatted.get(accountingReferenceKey(transactionInput))).toBe(
      "DELI-ORDER-191026-0001",
    );
  });

  it("keeps Deli per-invoice IDs and uses their existing invoice sequence", () => {
    const input = toExpenseReferenceInput({
      expenseNo: "DELI-INVOICE-20261009-0003",
      expenseDate: "2026-10-19",
      categoryCode: "DELI",
      description: "Delivery charge (PER_INVOICE)",
    });

    expect(formatAccountingReferences([input]).get(accountingReferenceKey(input)))
      .toBe("DELI-INVOICE-091026-0003");
  });

  it("assigns sequential display numbers for unsequenced references", () => {
    const inputs = [
      {
        referenceType: "COD_REVENUE",
        referenceId: "order-b",
        date: "2026-10-19",
      },
      {
        referenceType: "COD_REVENUE",
        referenceId: "order-a",
        date: "2026-10-19",
      },
    ];
    const formatted = formatAccountingReferences(inputs);

    expect(formatted.get(accountingReferenceKey(inputs[1]))).toBe(
      "COD_REVENUE-191026-0001",
    );
    expect(formatted.get(accountingReferenceKey(inputs[0]))).toBe(
      "COD_REVENUE-191026-0002",
    );
  });

  it("uses existing sequence numbers and avoids collisions", () => {
    const inputs = [
      {
        referenceType: "EXPENSE",
        referenceId: "DELI-INVOICE-20261009-0002",
        date: "2026-10-09",
      },
      {
        referenceType: "EXPENSE",
        referenceId: "DELI-INVOICE-20261009-0001",
        date: "2026-10-09",
      },
      {
        referenceType: "EXPENSE",
        referenceId: "DELI-INVOICE-20261009-0003",
        date: "2026-10-09",
      },
    ];
    const formatted = formatAccountingReferences(inputs);

    expect(inputs.map((input) => formatted.get(accountingReferenceKey(input)))).toEqual([
      "DELI-INVOICE-091026-0002",
      "DELI-INVOICE-091026-0001",
      "DELI-INVOICE-091026-0003",
    ]);
  });
});

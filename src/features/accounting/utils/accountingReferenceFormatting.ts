export type AccountingReferenceInput = {
  referenceType: string;
  referenceId: string;
  date: string;
};

export type ExpenseReferenceInput = {
  expenseNo: string;
  expenseDate: string;
  categoryCode?: string;
  description?: string | null;
};

export const toExpenseReferenceInput = ({
  expenseNo,
  expenseDate,
  categoryCode,
  description,
}: ExpenseReferenceInput): AccountingReferenceInput => {
  const idBasis = expenseNo.match(/^DELI-(ORDER|INVOICE)-/i)?.[1];
  const descriptionBasis = description?.match(/\bPER_(ORDER|INVOICE)\b/i)?.[1];
  const deliveryBasis =
    categoryCode?.toUpperCase() === "DELI" || idBasis
      ? (idBasis ?? descriptionBasis)
      : undefined;

  return {
    referenceType: deliveryBasis
      ? `DELI-${deliveryBasis.toUpperCase()}`
      : "EXPENSE",
    referenceId: expenseNo,
    date: expenseDate,
  };
};

const referenceKey = ({ referenceType, referenceId, date }: AccountingReferenceInput) => {
  const deliveryType = referenceId.match(/^(DELI-(?:ORDER|INVOICE))-/i)?.[1];
  const normalizedType = deliveryType?.toUpperCase() ?? referenceType;
  return `${normalizedType}\u0000${referenceId}\u0000${date.slice(0, 10)}`;
};

const validDatePart = (date: string) => {
  const match = date.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return null;
  }
  return `${day}${month}${year.slice(-2)}`;
};

const getReferenceParts = ({
  referenceType,
  referenceId,
  date,
}: AccountingReferenceInput) => {
  const datedSequence = referenceId.match(/^(.*)-(\d{8})-(\d+)$/);
  const deliveryReference = referenceId.match(/^(DELI-(?:ORDER|INVOICE))-/i);
  const legacyExpenseSequence =
    referenceType.toUpperCase() === "EXPENSE"
      ? referenceId.match(/^(.*?)(?:-\d{4})?-(\d{4,})$/)
      : null;
  const year = datedSequence?.[2].slice(0, 4);
  const month = datedSequence?.[2].slice(4, 6);
  const day = datedSequence?.[2].slice(6, 8);
  const encodedDate = year && month && day ? `${year}-${month}-${day}` : date;
  const formattedDate = validDatePart(encodedDate) ?? validDatePart(date) ?? "000000";

  if (datedSequence) {
    return {
      prefix: datedSequence[1],
      formattedDate,
      existingSequence: Number(datedSequence[3]),
    };
  }
  if (deliveryReference) {
    return {
      prefix: deliveryReference[1].toUpperCase(),
      formattedDate,
      existingSequence: null,
    };
  }
  if (legacyExpenseSequence) {
    return {
      prefix: legacyExpenseSequence[1] || referenceType,
      formattedDate,
      existingSequence: Number(legacyExpenseSequence[2]),
    };
  }
  return {
    prefix: referenceType.trim() || "TRANSACTION",
    formattedDate,
    existingSequence: null,
  };
};

export const formatAccountingReferences = (
  inputs: AccountingReferenceInput[],
): Map<string, string> => {
  const uniqueInputs = new Map(inputs.map((input) => [referenceKey(input), input]));
  const groups = new Map<
    string,
    Array<{
      key: string;
      prefix: string;
      formattedDate: string;
      existingSequence: number | null;
    }>
  >();

  for (const [key, input] of uniqueInputs) {
    const parts = getReferenceParts(input);
    const groupKey = `${parts.prefix}\u0000${parts.formattedDate}`;
    const group = groups.get(groupKey) ?? [];
    group.push({ key, ...parts });
    groups.set(groupKey, group);
  }

  const formatted = new Map<string, string>();
  for (const group of groups.values()) {
    group.sort((left, right) => left.key.localeCompare(right.key));
    const occupied = new Set(
      group.flatMap((item) =>
        item.existingSequence === null ? [] : [item.existingSequence],
      ),
    );
    let nextSequence = 1;
    for (const item of group) {
      let sequence = item.existingSequence;
      if (sequence === null) {
        while (occupied.has(nextSequence)) nextSequence += 1;
        sequence = nextSequence;
        occupied.add(sequence);
        nextSequence += 1;
      }
      formatted.set(
        item.key,
        `${item.prefix}-${item.formattedDate}-${String(sequence).padStart(4, "0")}`,
      );
    }
  }

  return formatted;
};

export const accountingReferenceKey = referenceKey;

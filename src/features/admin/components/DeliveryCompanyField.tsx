import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  adminShippingApi,
  type DeliveryCompanyDto,
  type DeliveryCompanyStatus,
} from "../api/adminShippingApi";

type DeliveryCompanyFieldProps = {
  id: string;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** When set, an inactive company that is already selected stays in the list. */
  includeCompanyId?: string;
};

const DeliveryCompanyField = ({
  id,
  value,
  onChange,
  disabled = false,
  includeCompanyId,
}: DeliveryCompanyFieldProps) => {
  const [companies, setCompanies] = useState<DeliveryCompanyDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminShippingApi
      .listDeliveryCompanies({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setCompanies(res.data.data.companies ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(adminShippingApi.getApiErrorMessage(loadError, "Could not load delivery companies."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const rows = companies.filter(
      (company) =>
        company.status === "ACTIVE" ||
        company.id === value ||
        company.id === includeCompanyId,
    );
    return [
      { value: "", label: "Select a company" },
      ...rows.map((company) => ({
        value: company.id,
        label: `${company.name} (${company.code})${company.status === "INACTIVE" ? " — inactive" : ""}`,
      })),
    ];
  }, [companies, includeCompanyId, value]);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        Delivery company
      </label>
      <SearchableSelect
        id={id}
        className="mt-1"
        placeholder="Select a company"
        emptyLabel="Select a company"
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled || companies.length === 0}
        searchAriaLabel="Search delivery company"
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
};

export function companyStatusLabel(status: DeliveryCompanyStatus): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}

export default DeliveryCompanyField;

import { useMemo } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { CityOptionWithState } from "../api/locationOptions";

type CitySelectFieldProps = {
  id: string;
  label: string;
  value: string;
  cities: CityOptionWithState[];
  onChange: (cityId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const CitySelectField = ({
  id,
  label,
  value,
  cities,
  onChange,
  disabled = false,
  placeholder = "Select a city",
}: CitySelectFieldProps) => {
  const options = useMemo(
    () => [...cities]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((city) => ({ value: String(city.id), label: city.name })),
    [cities],
  );

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      <SearchableSelect
        id={id}
        className="mt-1"
        placeholder={placeholder}
        emptyLabel={placeholder}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        searchAriaLabel={`Search ${label}`}
      />
    </div>
  );
};

export default CitySelectField;
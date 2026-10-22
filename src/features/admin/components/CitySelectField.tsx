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
  loading?: boolean;
  placeholder?: string;
  /** When set, the list starts with this choice and selecting it clears the value. */
  clearLabel?: string;
};

const CitySelectField = ({
  id,
  label,
  value,
  cities,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Select a city",
  clearLabel,
}: CitySelectFieldProps) => {
  const options = useMemo(() => {
    const citiesOptions = [...cities]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((city) => ({ value: String(city.id), label: city.name }));
    if (!clearLabel) return citiesOptions;
    return [{ value: "", label: clearLabel }, ...citiesOptions];
  }, [cities, clearLabel]);

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
        loading={loading}
        searchAriaLabel={`Search ${label}`}
      />
    </div>
  );
};

export default CitySelectField;
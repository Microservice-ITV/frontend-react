import { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightElement?: ReactNode;
}

export const Input = ({ label, rightElement, ...props }: Props) => {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          {...props}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring focus:ring-blue-300 pr-10"
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}
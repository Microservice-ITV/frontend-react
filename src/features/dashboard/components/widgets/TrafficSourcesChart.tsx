import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type ShopStatusCount = {
  statusId: number;
  count: number;
};

type TrafficSourcesChartProps = {
  data: ShopStatusCount[];
  total: number;
  title?: string;
  description?: string;
  statusLabels?: Record<number, { name: string; color: string }>;
  totalLabel?: string;
};

const DEFAULT_STATUS_LABELS: Record<number, { name: string; color: string }> = {
  0: { name: "Pending", color: "#f59e0b" },
  1: { name: "Approved", color: "#10b981" },
  2: { name: "Rejected", color: "#ef4444" },
};

const TrafficSourcesChart = ({
  data,
  total,
  title = "Shop Status",
  description = "Current platform shop distribution",
  statusLabels = DEFAULT_STATUS_LABELS,
  totalLabel = "Shops",
}: TrafficSourcesChartProps) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;

      if (width > 0 && height > 0) {
        setDimensions({
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    });

    observer.observe(el);

    const rect = el.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>

        <p className="mt-0.5 text-xs text-slate-600">{description}</p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <div
          ref={containerRef}
          className="relative h-48 w-48 shrink-0 sm:h-52 sm:w-52"
        >
          {dimensions && (
          <ResponsiveContainer width={dimensions.width} height={dimensions.height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.statusId} fill={statusLabels[entry.statusId]?.color ?? '#94a3b8'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-center text-base font-bold text-slate-900">
              {total.toLocaleString()} {totalLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2">
          {data.map((item) => (
            <div key={item.statusId} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    statusLabels[item.statusId]?.color ?? "#94a3b8",
                }}
              />

              <span className="text-xs text-slate-600">
                {statusLabels[item.statusId]?.name ?? "Unknown"}
              </span>

              <span className="ml-auto text-xs font-medium text-slate-900">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrafficSourcesChart;

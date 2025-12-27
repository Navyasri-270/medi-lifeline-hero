import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobilePage } from "@/components/MobileShell";
import { useMediSOS } from "@/state/MediSOSProvider";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useSeo } from "@/lib/seo";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  useSeo({
    title: "SOS Dashboard – Smart MediSOS",
    description: "View SOS logs and severity analytics (demo data).",
    canonicalPath: "/dashboard",
  });

  const { logs } = useMediSOS();

  const counts = useMemo(() => {
    const c = { low: 0, moderate: 0, high: 0, critical: 0 } as Record<string, number>;
    for (const l of logs) c[l.severity] = (c[l.severity] ?? 0) + 1;
    return c;
  }, [logs]);

  const data = useMemo(
    () => ({
      labels: ["Low", "Moderate", "High", "Critical"],
      datasets: [
        {
          label: "SOS Count",
          data: [counts.low, counts.moderate, counts.high, counts.critical],
          backgroundColor: ["rgba(255, 59, 48, 0.20)", "rgba(255, 59, 48, 0.35)", "rgba(255, 59, 48, 0.55)", "rgba(255, 59, 48, 0.85)"],
          borderRadius: 12,
        },
      ],
    }),
    [counts.critical, counts.high, counts.low, counts.moderate],
  );

  return (
    <MobilePage title="Dashboard">
      <section className="space-y-3">
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">SOS Count by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={data}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent SOS Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
                <div>
                  <div className="text-sm font-semibold">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(l.timeISO).toLocaleString()}</div>
                </div>
                <SeverityBadge severity={l.severity} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}

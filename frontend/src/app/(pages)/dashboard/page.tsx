'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Text, 
  Metric, 
  AreaChart, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Badge,
  Flex,
  Grid,
  Icon
} from '@tremor/react';
import { Users, MousePointerClick, UserCheck, Share2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface DashboardData {
  users: Array<{
    full_name: string;
    email: string;
    referral_code: string;
    is_verified: boolean;
    invite_count: number;
  }>;
  stats: {
    total_visits: number;
    total_signups: number;
    conversion_rate: number;
    avg_referrals: number;
  };
  chartData: Array<{
    date: string;
    Visits: number;
    Signups: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/stats');
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch live dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <main className="p-6 md:p-10 bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Growth Intelligence</h1>
          <Text className="text-neutral-500 mt-1 font-medium">AuraWorks Live Performance</Text>
        </div>

        {/* Top Level KPIs */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
          <StatCard title="Total Visits" value={data.stats.total_visits.toLocaleString()} icon={MousePointerClick} />
          <StatCard title="Total Signups" value={data.stats.total_signups} icon={Users} />
          <StatCard title="Conv. Rate" value={`${data.stats.conversion_rate}%`} icon={UserCheck} />
          <StatCard title="Avg. Referrals" value={data.stats.avg_referrals.toFixed(2)} icon={Share2} />
        </Grid>

        {/* Acquisition Trend */}
        <Card className="bg-neutral-900 border-neutral-800 p-8">
          <Text className="text-white font-bold text-lg">Acquisition Trend</Text>
          <AreaChart
            className="h-80 mt-8"
            data={data.chartData}
            index="date"
            categories={["Visits", "Signups"]}
            colors={["slate", "orange"]}
            showLegend={true}
            showGridLines={false}
            curveType="monotone"
            valueFormatter={(number: number) => Intl.NumberFormat("en-US").format(number)}
          />
        </Card>

        {/* Detailed User Table */}
        <Card className="bg-neutral-900 border-neutral-800 p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5">
             <Text className="text-white font-bold text-lg">Verification Ledger</Text>
          </div>
          <Table>
            <TableHead className="bg-white/[0.02]">
              <TableRow className="border-neutral-800">
                <TableHeaderCell className="text-neutral-400 pl-8 font-semibold uppercase tracking-wider text-[10px]">Identity</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Referral Code</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 text-center font-semibold uppercase tracking-wider text-[10px]">Invites</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 pr-8 font-semibold uppercase tracking-wider text-[10px]">Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.users.map((item) => (
                <TableRow key={item.email} className="border-neutral-800 hover:bg-white/[0.01] transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">{item.full_name}</span>
                      <span className="text-neutral-500 text-xs">{item.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-orange-500 font-mono text-xs bg-orange-500/5 px-2 py-1 rounded">
                      {item.referral_code}
                    </code>
                  </TableCell>
                  <TableCell className="text-white text-center font-medium">
                    {item.invite_count}
                  </TableCell>
                  <TableCell className="pr-8">
                    <Badge 
                      color={item.is_verified ? "green" : "orange"} 
                      className="bg-opacity-10 border-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      {item.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: any }) {
  return (
    <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
      <Flex justifyContent="start" className="space-x-4">
        <Icon icon={icon} variant="simple" color="slate" />
        <Text className="text-neutral-400 font-medium">{title}</Text>
      </Flex>
      <Metric className="text-white mt-2 font-bold">{value}</Metric>
    </Card>
  );
}
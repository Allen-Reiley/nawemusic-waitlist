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

export default function DashboardPage() {
  const [data, setData] = useState({
    users: [],
    stats: {
      total_visits: 0,
      total_signups: 0,
      conversion_rate: 0,
      avg_referrals: 0
    },
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetching the unified stats endpoint from your FastAPI backend
        const response = await api.get('/admin/stats');
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch live dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh data every 60 seconds for "Realtime" feel
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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
          <Text className="text-neutral-500 mt-1 font-medium">AuraWorks NaweMusic Live Performance</Text>
        </div>

        {/* Top Level KPIs */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Icon icon={MousePointerClick} variant="simple" color="slate" />
              <Text className="text-neutral-400 font-medium">Total Visits</Text>
            </Flex>
            <Metric className="text-white mt-2 font-bold">
              {data.stats.total_visits.toLocaleString()}
            </Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Icon icon={Users} variant="simple" color="slate" />
              <Text className="text-neutral-400 font-medium">Total Signups</Text>
            </Flex>
            <Metric className="text-white mt-2 font-bold">
              {data.stats.total_signups}
            </Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Icon icon={UserCheck} variant="simple" color="slate" />
              <Text className="text-neutral-400 font-medium">Conv. Rate</Text>
            </Flex>
            <Metric className="text-white mt-2 font-bold">
              {data.stats.conversion_rate}%
            </Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Icon icon={Share2} variant="simple" color="slate" />
              <Text className="text-neutral-400 font-medium">Avg. Referrals</Text>
            </Flex>
            <Metric className="text-white mt-2 font-bold">
              {data.stats.avg_referrals.toFixed(2)}
            </Metric>
          </Card>
        </Grid>

        {/* Real-time Graph */}
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
            valueFormatter={(number: number) => Intl.NumberFormat("us").format(number).toString()}
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
                <TableHeaderCell className="text-neutral-400 pl-8">Identity</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Referral Code</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 text-center">Invites</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 pr-8">Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.users.map((item: any) => (
                <TableRow key={item.email} className="border-neutral-800 hover:bg-white/[0.01] transition-colors">
                  <TableCell className="pl-8">
                    <Text className="text-white font-semibold">{item.full_name}</Text>
                    <Text className="text-neutral-500 text-xs">{item.email}</Text>
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
                    <Badge color={item.is_verified ? "green" : "orange"} className="bg-opacity-10 border-none font-bold uppercase text-[10px] tracking-widest">
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
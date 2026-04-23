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
  Grid
} from '@tremor/react';
import { Users, MousePointerClick, UserCheck, Share2 } from 'lucide-react';
import api from '@/lib/api';

// Mock data for the chart - integrate with your analytics backend later
const chartData = [
  { date: "Apr 20", "Visits": 150, "Signups": 45 },
  { date: "Apr 21", "Visits": 230, "Signups": 72 },
  { date: "Apr 22", "Visits": 450, "Signups": 110 },
  { date: "Apr 23", "Visits": 380, "Signups": 95 },
];

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // You'll need to create this endpoint in your FastAPI backend
        const response = await api.get('/admin/stats');
        setUsers(response.data.users);
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalVisits = 1210; // Integration point for Plausible or Google Analytics
  const totalSignups = users.length;
  const conversionRate = ((totalSignups / totalVisits) * 100).toFixed(1);

  return (
    <main className="p-6 md:p-10 bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Growth Intelligence</h1>
          <Text className="text-neutral-500 mt-1">AuraWorks NaweMusic Waitlist Performance</Text>
        </div>

        {/* Top Level KPIs */}
        <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <MousePointerClick className="text-neutral-500" size={20} />
              <Text className="text-neutral-400">Total Visits</Text>
            </Flex>
            <Metric className="text-white mt-2">{totalVisits}</Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Users className="text-neutral-500" size={20} />
              <Text className="text-neutral-400">Total Signups</Text>
            </Flex>
            <Metric className="text-white mt-2">{totalSignups}</Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <UserCheck className="text-neutral-500" size={20} />
              <Text className="text-neutral-400">Conversion Rate</Text>
            </Flex>
            <Metric className="text-white mt-2">{conversionRate}%</Metric>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800" decoration="top" decorationColor="orange">
            <Flex justifyContent="start" className="space-x-4">
              <Share2 className="text-neutral-500" size={20} />
              <Text className="text-neutral-400">Avg. Referrals</Text>
            </Flex>
            <Metric className="text-white mt-2">2.4</Metric>
          </Card>
        </Grid>

        {/* Conversion Graph */}
        <Card className="bg-neutral-900 border-neutral-800">
          <Text className="text-white font-bold mb-4">Traffic vs. Conversion Funnel</Text>
          <AreaChart
            className="h-72 mt-4"
            data={chartData}
            index="date"
            categories={["Visits", "Signups"]}
            colors={["slate", "orange"]}
            valueFormatter={(number: number) => Intl.NumberFormat("us").format(number).toString()}
          />
        </Card>

        {/* Detailed User Table */}
        <Card className="bg-neutral-900 border-neutral-800">
          <Text className="text-white font-bold mb-4">Verification Ledger</Text>
          <Table className="mt-5">
            <TableHead>
              <TableRow className="border-neutral-800">
                <TableHeaderCell className="text-neutral-400">Full Name</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Email Address</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Referral Code</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400 text-center">Invites</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((item: any) => (
                <TableRow key={item.email} className="border-neutral-800">
                  <TableCell className="text-white font-medium">{item.full_name}</TableCell>
                  <TableCell className="text-neutral-400">{item.email}</TableCell>
                  <TableCell className="text-orange-500 font-mono text-xs">{item.referral_code}</TableCell>
                  <TableCell className="text-white text-center">{item.invite_count || 0}</TableCell>
                  <TableCell>
                    <Badge color={item.is_verified ? "green" : "orange"} className="bg-opacity-10 border-none">
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
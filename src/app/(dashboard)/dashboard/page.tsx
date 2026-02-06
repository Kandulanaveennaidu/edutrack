"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  CalendarCheck,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardData {
  stats: {
    total: number;
    marked: number;
    unmarked: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  trend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  data: Array<{
    student_id: string;
    name: string;
    roll_number: string;
    class_name: string;
    status: string | null;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      try {
        const response = await fetch("/api/attendance/today");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          const errData = await response.json();
          setError(errData.error || "Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (loading || status === "loading") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = data?.stats || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    marked: 0,
  };

  const presentPercentage =
    stats.marked > 0 ? Math.round((stats.present / stats.marked) * 100) : 0;

  const statCards = [
    {
      title: "Total Students",
      value: stats.total,
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Today's Present",
      value: `${presentPercentage}%`,
      subtitle: `${stats.present} students`,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Absent Count",
      value: stats.absent,
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      title: "Late Count",
      value: stats.late,
      icon: Clock,
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Overview of attendance for {session?.user?.school_id}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/attendance/mark">
            <Button>
              <CalendarCheck className="mr-2 h-4 w-4" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/students">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-slate-400">{stat.subtitle}</p>
                  )}
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Last 7 Days Trend</CardTitle>
            <CardDescription>Daily attendance statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#22c55e" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Today&apos;s attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data || []).slice(0, 8).map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">
                      {student.roll_number}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.class_name}</TableCell>
                    <TableCell>
                      {student.status ? (
                        <Badge
                          variant={
                            student.status === "present"
                              ? "present"
                              : student.status === "absent"
                                ? "absent"
                                : student.status === "late"
                                  ? "late"
                                  : "leave"
                          }
                        >
                          {student.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Marked</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Low Attendance Alert */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Attention Required</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            Students with less than 75% attendance this month need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            Run the monthly report to identify students with low attendance and
            take necessary action.
          </p>
          <Link href="/reports">
            <Button variant="warning" size="sm" className="mt-4">
              View Reports
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

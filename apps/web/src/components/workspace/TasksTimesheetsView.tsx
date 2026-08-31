import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MotionProgressBar } from "../motion/MotionPrimitives";
import {
  CheckSquare,
  Clock,
  Play,
  Pause,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  RotateCcw,
  Layers,
  Users,
  Briefcase,
  Activity,
  BarChart3,
  ListTodo,
  FolderGit2,
  X,
  PlusCircle,
  Trash2,
  SlidersHorizontal,
  Flame,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Timer,
  AlertCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  TaskRecord,
  TaskSubtask,
  TimesheetEntry,
  WeeklyTimesheetRow,
  StaffWorkloadCapacity,
  ClientRecord,
  EngagementRecord,
} from "../../types";

interface TasksTimesheetsViewProps {
  initialTab?: "tasks" | "timesheets" | "resource_matrix";
  tasks: TaskRecord[];
  timesheets: TimesheetEntry[];
  weeklyTimesheets?: WeeklyTimesheetRow[];
  resourceCapacities?: StaffWorkloadCapacity[];
  clients?: ClientRecord[];
  engagements?: EngagementRecord[];
  onAddTask: (task: Partial<TaskRecord>) => void;
  onAddTimesheet: (entry: Partial<TimesheetEntry>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskRecord["status"]) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onSaveWeeklyTimesheet?: (rows: WeeklyTimesheetRow[]) => void;
}

export const TasksTimesheetsView: React.FC<TasksTimesheetsViewProps> = ({
  initialTab = "tasks",
  tasks,
  timesheets,
  weeklyTimesheets: initialWeeklyRows = [],
  resourceCapacities = [],
  clients = [],
  engagements = [],
  onAddTask,
  onAddTimesheet,
  onUpdateTaskStatus,
  onToggleSubtask,
  onSaveWeeklyTimesheet,
}) => {
  const [activeTab, setActiveTab] = useState<
    "tasks" | "timesheets" | "resource_matrix"
  >(initialTab);

  // 1. Task Management States
  const [taskGroupBy, setTaskGroupBy] = useState<
    "engagement" | "assignee" | "dueDate"
  >("engagement");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<
    "All" | "Critical" | "High" | "Medium" | "Low"
  >("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    "All" | "Todo" | "In Progress" | "Blocked" | "Done"
  >("All");

  // Task Creation Modal & Form State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskClient, setNewTaskClient] = useState(
    clients[0]?.name || "Apex Footwear & Polymer Ltd.",
  );
  const [newTaskEngagement, setNewTaskEngagement] = useState(
    engagements[0]?.engagementCode || "AUD-2026-081",
  );
  const [newTaskAssignee, setNewTaskAssignee] = useState("Sabbir Ahmed (Art)");
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskRecord["priority"]>("High");
  const [newTaskStatus, setNewTaskStatus] =
    useState<TaskRecord["status"]>("Todo");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-09-10");
  const [newTaskHours, setNewTaskHours] = useState(6);
  const [newTaskCategory, setNewTaskCategory] =
    useState<TaskRecord["category"]>("Field Audit");
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [newSubtaskList, setNewSubtaskList] = useState<
    Array<{ id: string; title: string; completed: boolean }>
  >([
    {
      id: "sub-1",
      title: "Prepare documentation schedule and cross-index",
      completed: false,
    },
  ]);

  // 2. Timesheet & Weekly Grid States
  const [weeklyRows, setWeeklyRows] =
    useState<WeeklyTimesheetRow[]>(initialWeeklyRows);
  const [timesheetWeekLabel, setTimesheetWeekLabel] = useState(
    "Current Week: 31 Aug 2026 - 06 Sep 2026",
  );
  const [selectedStaffUser, setSelectedStaffUser] =
    useState("Zahirul Islam, FCA");
  const [isTimerDrawerOpen, setIsTimerDrawerOpen] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1450); // ~24 mins default
  const [timerClient, setTimerClient] = useState(
    "Apex Footwear & Polymer Ltd.",
  );
  const [timerEngagementCode, setTimerEngagementCode] =
    useState("AUD-2026-081");
  const [timerWorkCode, setTimerWorkCode] = useState<
    "Field Audit" | "Report Drafting" | "Tax Computation" | "Client Meeting"
  >("Field Audit");
  const [timerDescription, setTimerDescription] = useState(
    "Testing of revenue cut-off transactions and ISA 505 bank confirmations.",
  );

  // 3. Resource Allocation Matrix Filter
  const [resourceDeptFilter, setResourceDeptFilter] = useState<string>("All");
  const [resourceCapacityFilter, setResourceCapacityFilter] = useState<
    "All" | "Overallocated" | "Optimal" | "Available"
  >("All");

  // Real-time Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format Timer
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Add Subtask to modal list
  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setNewSubtaskList([
      ...newSubtaskList,
      {
        id: `sub-${Date.now()}`,
        title: newSubtaskInput.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskInput("");
  };

  const handleRemoveSubtask = (id: string) => {
    setNewSubtaskList(newSubtaskList.filter((s) => s.id !== id));
  };

  // Submit New Task
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle.trim(),
      clientName: newTaskClient,
      engagementCode: newTaskEngagement,
      assignedTo: newTaskAssignee,
      priority: newTaskPriority,
      status: newTaskStatus,
      dueDate: newTaskDueDate,
      estimatedHours: Number(newTaskHours) || 4,
      category: newTaskCategory,
      subtasks: newSubtaskList,
    });

    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewSubtaskList([
      {
        id: `sub-${Date.now()}`,
        title: "Review audit findings with manager",
        completed: false,
      },
    ]);
  };

  // Weekly Grid Inline Cell Edit
  const handleWeeklyHourChange = (
    rowId: string,
    day: keyof WeeklyTimesheetRow["hours"],
    value: string,
  ) => {
    const num = Math.max(0, Math.min(24, parseFloat(value) || 0));
    setWeeklyRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            hours: {
              ...row.hours,
              [day]: num,
            },
          };
        }
        return row;
      }),
    );
  };

  // Add New Row to Weekly Timesheet
  const handleAddWeeklyRow = () => {
    const newRow: WeeklyTimesheetRow = {
      id: `ts-row-${Date.now()}`,
      clientName: clients[0]?.name || "Apex Footwear & Polymer Ltd.",
      engagementCode: engagements[0]?.engagementCode || "AUD-2026-081",
      workCode: "Field Audit",
      billable: true,
      hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    };
    setWeeklyRows([...weeklyRows, newRow]);
  };

  // Remove Row from Weekly Timesheet
  const handleRemoveWeeklyRow = (rowId: string) => {
    setWeeklyRows(weeklyRows.filter((r) => r.id !== rowId));
  };

  // Stop Timer and Log into Weekly Grid
  const handleStopAndLogTimer = () => {
    setIsTimerRunning(false);
    const loggedHours = Math.max(
      0.25,
      parseFloat((timerSeconds / 3600).toFixed(2)),
    );

    // Add timesheet entry record
    onAddTimesheet({
      date: new Date().toISOString().split("T")[0],
      staffName: selectedStaffUser,
      clientName: timerClient,
      engagementCode: timerEngagementCode,
      taskDescription: timerDescription,
      hours: loggedHours,
      billable: true,
      status: "Approved",
    });

    // Also inject hours into today's weekly grid column
    const todayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const dayKeyMap: Record<number, keyof WeeklyTimesheetRow["hours"]> = {
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat",
      0: "sun",
    };
    const targetDay = dayKeyMap[todayIndex] || "mon";

    setWeeklyRows((prev) => {
      const existing = prev.find(
        (r) =>
          r.clientName === timerClient &&
          r.engagementCode === timerEngagementCode &&
          r.workCode === timerWorkCode,
      );
      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                hours: {
                  ...r.hours,
                  [targetDay]: Number(
                    (r.hours[targetDay] + loggedHours).toFixed(1),
                  ),
                },
              }
            : r,
        );
      } else {
        return [
          ...prev,
          {
            id: `ts-row-${Date.now()}`,
            clientName: timerClient,
            engagementCode: timerEngagementCode,
            workCode: timerWorkCode,
            billable: true,
            hours: {
              mon: targetDay === "mon" ? loggedHours : 0,
              tue: targetDay === "tue" ? loggedHours : 0,
              wed: targetDay === "wed" ? loggedHours : 0,
              thu: targetDay === "thu" ? loggedHours : 0,
              fri: targetDay === "fri" ? loggedHours : 0,
              sat: targetDay === "sat" ? loggedHours : 0,
              sun: targetDay === "sun" ? loggedHours : 0,
            },
          },
        ];
      }
    });

    setIsTimerDrawerOpen(false);
    setTimerSeconds(0);
  };

  // Calculations for Weekly Totals
  const dayTotals = {
    mon: weeklyRows.reduce((acc, r) => acc + (r.hours.mon || 0), 0),
    tue: weeklyRows.reduce((acc, r) => acc + (r.hours.tue || 0), 0),
    wed: weeklyRows.reduce((acc, r) => acc + (r.hours.wed || 0), 0),
    thu: weeklyRows.reduce((acc, r) => acc + (r.hours.thu || 0), 0),
    fri: weeklyRows.reduce((acc, r) => acc + (r.hours.fri || 0), 0),
    sat: weeklyRows.reduce((acc, r) => acc + (r.hours.sat || 0), 0),
    sun: weeklyRows.reduce((acc, r) => acc + (r.hours.sun || 0), 0),
  };

  const grandTotalHours = Object.values(dayTotals).reduce(
    (a: number, b: number) => a + b,
    0,
  );
  const billableHours = weeklyRows
    .filter((r) => r.billable)
    .reduce(
      (acc, r) =>
        acc +
        (Object.values(r.hours) as number[]).reduce(
          (a: number, b: number) => a + b,
          0,
        ),
      0,
    );
  const nonBillableHours = grandTotalHours - billableHours;
  const billableUtilizationPercent =
    grandTotalHours > 0
      ? Math.round((billableHours / grandTotalHours) * 100)
      : 0;

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.clientName.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.engagementCode &&
        t.engagementCode.toLowerCase().includes(taskSearch.toLowerCase()));

    const matchesPriority =
      taskPriorityFilter === "All" || t.priority === taskPriorityFilter;
    const matchesStatus =
      taskStatusFilter === "All" || t.status === taskStatusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Grouping logic for tasks
  const groupedTasks: Record<string, TaskRecord[]> = {};
  if (taskGroupBy === "engagement") {
    filteredTasks.forEach((t) => {
      const key = t.engagementCode
        ? `${t.engagementCode} - ${t.clientName}`
        : t.clientName;
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(t);
    });
  } else if (taskGroupBy === "assignee") {
    filteredTasks.forEach((t) => {
      const key = t.assignedTo || "Unassigned";
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(t);
    });
  } else {
    // By Due Date
    filteredTasks.forEach((t) => {
      const key = t.dueDate ? `Due: ${t.dueDate}` : "No Deadline";
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(t);
    });
  }

  // Filtered Resource Capacities
  const filteredResources = resourceCapacities.filter((staff) => {
    const matchesDept =
      resourceDeptFilter === "All" || staff.department === resourceDeptFilter;
    const matchesCapacity =
      resourceCapacityFilter === "All" ||
      staff.weeks.some((w) => w.status === resourceCapacityFilter);
    return matchesDept && matchesCapacity;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-left pb-16">
      {/* 1. TOP HEADER & MAIN MODULE TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-[#EBE6DD] shadow-2xs relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] border border-[#EADBBF] px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider text-[#8A5A18]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E]" />
            <span className="uppercase">
              AVENQUIS PRACTICE VELOCITY &amp; PRODUCTIVITY SUITE
            </span>
            <span className="text-[#C58A3E] font-serif">✦</span>
            <span>ISA 220 RESOURCE ALLOCATION</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Task Management, Timesheets &amp; Resource Planning
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] max-w-2xl leading-relaxed">
            Manage granular audit deliverables, log weekly billable hours across
            engagement work codes, run real-time timers, and monitor multi-week
            staff capacity heatmaps.
          </p>
        </div>

        {/* 3-Way Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0 z-10">
          <button
            id="tab-tasks-deadlines"
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "tasks"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Tasks ({tasks.length})</span>
          </button>

          <button
            id="tab-timesheets-grid"
            onClick={() => setActiveTab("timesheets")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "timesheets"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Weekly Timesheet</span>
          </button>

          <button
            id="tab-resource-matrix"
            onClick={() => setActiveTab("resource_matrix")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "resource_matrix"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Resource Matrix</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 1: TASKS & DEADLINES */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Grouped Views, Priority Filter, Status Filter & "+ Create Task" */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9691]" />
                <input
                  id="task-search-input"
                  type="text"
                  placeholder="Search tasks, client names, assignees, engagement codes..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Group By Selector (By Engagement, By Assignee, By Due Date) */}
              <div className="flex items-center space-x-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E1D5]">
                <span className="text-[11px] font-bold text-[#8A9691] px-2">
                  Group:
                </span>
                <button
                  id="group-by-engagement"
                  onClick={() => setTaskGroupBy("engagement")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    taskGroupBy === "engagement"
                      ? "bg-[#113227] text-white shadow-2xs"
                      : "text-[#66706B] hover:text-[#1C1F1E]"
                  }`}
                >
                  <Briefcase className="w-3 h-3" />
                  <span>By Engagement</span>
                </button>
                <button
                  id="group-by-assignee"
                  onClick={() => setTaskGroupBy("assignee")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    taskGroupBy === "assignee"
                      ? "bg-[#113227] text-white shadow-2xs"
                      : "text-[#66706B] hover:text-[#1C1F1E]"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>By Assignee</span>
                </button>
                <button
                  id="group-by-due-date"
                  onClick={() => setTaskGroupBy("dueDate")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    taskGroupBy === "dueDate"
                      ? "bg-[#113227] text-white shadow-2xs"
                      : "text-[#66706B] hover:text-[#1C1F1E]"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>By Due Date</span>
                </button>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center space-x-1.5">
                <select
                  id="task-priority-filter"
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1.5">
                <select
                  id="task-status-filter"
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* "+ Create Task" Modal Trigger */}
            <button
              id="btn-open-create-task-modal"
              onClick={() => setIsTaskModalOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-sm cursor-pointer transition-all shrink-0 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Create Task</span>
            </button>
          </div>

          {/* Grouped Task List View */}
          <div className="space-y-6">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#EBE6DD] p-12 text-center space-y-3 shadow-2xs">
                <ListTodo className="w-10 h-10 text-[#8A9691] mx-auto stroke-1" />
                <h3 className="font-serif font-bold text-base text-[#1C1F1E]">
                  No Tasks Found
                </h3>
                <p className="text-xs text-[#66706B] max-w-md mx-auto">
                  There are no audit tasks matching your current search or
                  filter query. Click "+ Create Task" to dispatch new
                  deliverables.
                </p>
              </div>
            ) : (
              Object.entries(groupedTasks).map(([groupTitle, groupItems]) => (
                <motion.div
                  key={`${taskSearch}-${taskPriorityFilter}-${taskStatusFilter}-${taskGroupBy}-${groupTitle}`}
                  className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs space-y-4"
                  initial={{ opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C58A3E]" />
                      <h2 className="font-serif font-bold text-sm sm:text-base text-[#1C1F1E]">
                        {groupTitle}
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#FAF0DE] text-[#8A5A18] px-2.5 py-0.5 rounded-full border border-[#EADBBF]">
                      {groupItems.length}{" "}
                      {groupItems.length === 1 ? "task" : "tasks"}
                    </span>
                  </div>

                  {/* Task Items Table / Rows */}
                  <div className="divide-y divide-[#F0EBE1]">
                    {groupItems.map((task) => {
                      const priorityColor =
                        task.priority === "Critical"
                          ? "bg-[#FDE6E2] text-[#8E362C] border-[#F4CCC6]"
                          : task.priority === "High"
                            ? "bg-[#FAF0DE] text-[#8A5A18] border-[#ECD9B8]"
                            : "bg-[#E1F3EE] text-[#1F5946] border-[#C5E8DC]";

                      const statusColor =
                        task.status === "Done"
                          ? "bg-[#E1F3EE] text-[#1F5946] border-[#C5E8DC]"
                          : task.status === "In Progress"
                            ? "bg-[#FAF0DE] text-[#8A5A18] border-[#ECD9B8]"
                            : task.status === "Blocked"
                              ? "bg-[#FDE6E2] text-[#8E362C] border-[#F4CCC6]"
                              : "bg-[#FAF7F2] text-[#66706B] border-[#E8E1D5]";

                      const completedSubtasks =
                        task.subtasks?.filter((s) => s.completed).length || 0;
                      const totalSubtasks = task.subtasks?.length || 0;

                      return (
                        <motion.div
                          key={task.id}
                          className="py-4 hover:bg-[#FAF8F5] transition-colors rounded-2xl px-3 -mx-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          layout
                          transition={{
                            duration: 0.2,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          {/* Task Left: Title, Engagement, Category & Subtasks */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-xs sm:text-sm text-[#1C1F1E] hover:text-[#113227] transition-colors">
                                {task.title}
                              </h4>
                              <span className="text-[10px] font-semibold text-[#7A8782] bg-[#FAF7F2] px-2 py-0.2 rounded border border-[#EAE3D5]">
                                {task.category}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#7A8782]">
                              <span className="flex items-center text-[#113227] font-semibold">
                                <Briefcase className="w-3.5 h-3.5 mr-1 text-[#C58A3E]" />
                                {task.clientName}
                              </span>
                              {task.engagementCode && (
                                <span className="font-mono text-[11px] text-[#C58A3E] font-bold">
                                  [{task.engagementCode}]
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center">
                                <User className="w-3.5 h-3.5 mr-1 text-[#8A9691]" />
                                {task.assignedTo}
                              </span>
                            </div>

                            {/* Subtask checklist progress preview */}
                            {totalSubtasks > 0 && (
                              <div className="flex items-center space-x-2 pt-1">
                                <div className="text-[10.5px] font-mono text-[#8A9691]">
                                  Subtasks ({completedSubtasks}/{totalSubtasks})
                                </div>
                                <div className="w-24 h-1.5 rounded-full bg-[#EBE5DA] overflow-hidden">
                                  <MotionProgressBar
                                    value={
                                      (completedSubtasks / totalSubtasks) * 100
                                    }
                                    className="h-full bg-[#113227] rounded-full"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Task Right: Priority Badge, Due Date, Est. Hours & Status Selector */}
                          <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Priority Badge (Critical, High, Medium, Low) */}
                            <span
                              className={`px-2.5 py-0.8 rounded-full text-[10.5px] font-bold border ${priorityColor}`}
                            >
                              {task.priority === "Critical" && (
                                <Flame className="w-3 h-3 inline mr-1" />
                              )}
                              {task.priority} Priority
                            </span>

                            {/* Due Date */}
                            <div className="flex items-center space-x-1 text-xs text-[#1C1F1E] font-mono bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#EAE3D5]">
                              <Calendar className="w-3.5 h-3.5 text-[#C58A3E]" />
                              <span>{task.dueDate}</span>
                            </div>

                            {/* Est. Hours */}
                            <div className="text-[11px] font-mono text-[#7A8782]">
                              {task.estimatedHours}h est.
                            </div>

                            {/* Status Selector Dropdown (Todo, In Progress, Blocked, Done) */}
                            <select
                              id={`task-status-select-${task.id}`}
                              value={task.status}
                              onChange={(e) =>
                                onUpdateTaskStatus(
                                  task.id,
                                  e.target.value as any,
                                )
                              }
                              className={`px-3 py-1 text-xs font-bold rounded-xl border focus:outline-none cursor-pointer transition-colors ${statusColor}`}
                            >
                              <option value="Todo">Todo</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Blocked">Blocked</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECTION 2: TIMESHEET & DAILY WORK LOGGING */}
      {/* ========================================================================= */}
      {activeTab === "timesheets" && (
        <div className="space-y-6">
          {/* Top Summary Cards: Billable vs Non-Billable & Live Timer Launcher */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Week Hours */}
            <div className="bg-white p-5 rounded-3xl border border-[#EBE6DD] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                Total Week Hours
              </div>
              <div className="text-2xl font-serif font-bold text-[#1C1F1E]">
                {grandTotalHours.toFixed(1)}{" "}
                <span className="text-xs font-normal font-sans text-[#7A8782]">
                  hrs
                </span>
              </div>
              <div className="text-[11px] text-[#7A8782]">
                {timesheetWeekLabel}
              </div>
            </div>

            {/* Billable Hours */}
            <div className="bg-white p-5 rounded-3xl border border-[#EBE6DD] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-[#1F5946] uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1F5946]" />
                <span>Billable Hours</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#113227]">
                {billableHours.toFixed(1)}{" "}
                <span className="text-xs font-normal font-sans text-[#7A8782]">
                  hrs
                </span>
              </div>
              <div className="text-[11px] text-[#1F5946] font-semibold">
                {billableUtilizationPercent}% Billable Utilization
              </div>
            </div>

            {/* Non-Billable Hours */}
            <div className="bg-white p-5 rounded-3xl border border-[#EBE6DD] shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-[#8A5A18] uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#C58A3E]" />
                <span>Non-Billable / Admin</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#8A5A18]">
                {nonBillableHours.toFixed(1)}{" "}
                <span className="text-xs font-normal font-sans text-[#7A8782]">
                  hrs
                </span>
              </div>
              <div className="text-[11px] text-[#7A8782]">
                Practice Admin &amp; ICAB Training
              </div>
            </div>

            {/* Daily Timer Quick Widget */}
            <div className="bg-[#113227] text-white p-5 rounded-3xl border border-[#113227] shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E1F3EE] bg-white/10 px-2 py-0.5 rounded">
                  Live Audit Stopwatch
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${isTimerRunning ? "bg-emerald-400 motion-timer-indicator" : "bg-[#E1F3EE]/40"}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="font-mono text-2xl font-bold tracking-tight text-[#FAF0DE]">
                  {formatTimer(timerSeconds)}
                </div>
                <button
                  id="btn-toggle-daily-timer"
                  onClick={() => setIsTimerDrawerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#C58A3E] text-[#1C1F1E] font-bold text-xs hover:bg-[#D49A4E] transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{isTimerRunning ? "Active" : "Open Timer"}</span>
                </button>
              </div>

              <div className="text-[10.5px] text-[#E1F3EE]/80 truncate">
                {timerClient.split(" ")[0]} • {timerWorkCode}
              </div>
            </div>
          </div>

          {/* Interactive Weekly Timesheet Grid (Mon-Sun) */}
          <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs space-y-4">
            {/* Grid Header & Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE1]">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#113227]" />
                  <h3 className="font-serif font-bold text-base text-[#1C1F1E]">
                    Weekly Timesheet Matrix (Mon - Sun)
                  </h3>
                </div>
                <p className="text-xs text-[#7A8782]">
                  Log actual time in hours against specific Clients,
                  Engagements, and Work Codes.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-add-timesheet-row"
                  onClick={handleAddWeeklyRow}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#113227] border border-[#E0D7C8] hover:bg-[#F2ECE1] transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Add Line Item</span>
                </button>

                <button
                  id="btn-save-weekly-timesheet"
                  onClick={() =>
                    onSaveWeeklyTimesheet && onSaveWeeklyTimesheet(weeklyRows)
                  }
                  className="btn-forest px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Submit Timesheet</span>
                </button>
              </div>
            </div>

            {/* Weekly Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                    <th className="pb-3 pl-1 min-w-[200px]">
                      Client / Account
                    </th>
                    <th className="pb-3 px-2 min-w-[130px]">Engagement</th>
                    <th className="pb-3 px-2 min-w-[150px]">Work Code</th>
                    <th className="pb-3 px-1 text-center w-14">Mon</th>
                    <th className="pb-3 px-1 text-center w-14">Tue</th>
                    <th className="pb-3 px-1 text-center w-14">Wed</th>
                    <th className="pb-3 px-1 text-center w-14">Thu</th>
                    <th className="pb-3 px-1 text-center w-14">Fri</th>
                    <th className="pb-3 px-1 text-center w-14">Sat</th>
                    <th className="pb-3 px-1 text-center w-14">Sun</th>
                    <th className="pb-3 px-2 text-right w-16">Total</th>
                    <th className="pb-3 pr-1 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1] text-xs">
                  {weeklyRows.map((row) => {
                    const rowTotal = (
                      Object.values(row.hours) as number[]
                    ).reduce((a: number, b: number) => a + b, 0);

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#FAF8F5] transition-colors"
                      >
                        {/* Client Selector */}
                        <td className="py-2.5 pl-1">
                          <select
                            value={row.clientName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWeeklyRows(
                                weeklyRows.map((r) =>
                                  r.id === row.id
                                    ? { ...r, clientName: val }
                                    : r,
                                ),
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227] font-medium truncate"
                          >
                            {clients.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                            <option value="Internal Practice / ICAB">
                              Internal Practice / ICAB
                            </option>
                          </select>
                        </td>

                        {/* Engagement Code */}
                        <td className="py-2.5 px-2">
                          <select
                            value={row.engagementCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWeeklyRows(
                                weeklyRows.map((r) =>
                                  r.id === row.id
                                    ? { ...r, engagementCode: val }
                                    : r,
                                ),
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227] font-mono text-[11px]"
                          >
                            {engagements.map((eng) => (
                              <option key={eng.id} value={eng.engagementCode}>
                                {eng.engagementCode}
                              </option>
                            ))}
                            <option value="INT-FIRM-ADMIN">
                              INT-FIRM-ADMIN
                            </option>
                          </select>
                        </td>

                        {/* Work Code (Field Audit, Report Drafting, Tax Computation, Client Meeting) */}
                        <td className="py-2.5 px-2">
                          <select
                            value={row.workCode}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setWeeklyRows(
                                weeklyRows.map((r) =>
                                  r.id === row.id ? { ...r, workCode: val } : r,
                                ),
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#113227] font-semibold focus:outline-none focus:ring-1 focus:ring-[#113227]"
                          >
                            <option value="Field Audit">Field Audit</option>
                            <option value="Report Drafting">
                              Report Drafting
                            </option>
                            <option value="Tax Computation">
                              Tax Computation
                            </option>
                            <option value="Client Meeting">
                              Client Meeting
                            </option>
                          </select>
                        </td>

                        {/* Mon-Sun Inputs */}
                        {(
                          [
                            "mon",
                            "tue",
                            "wed",
                            "thu",
                            "fri",
                            "sat",
                            "sun",
                          ] as const
                        ).map((day) => (
                          <td key={day} className="py-2.5 px-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={row.hours[day] === 0 ? "" : row.hours[day]}
                              placeholder="0"
                              onChange={(e) =>
                                handleWeeklyHourChange(
                                  row.id,
                                  day,
                                  e.target.value,
                                )
                              }
                              className="w-12 py-1 text-center font-mono text-xs bg-white border border-[#D8CFC0] rounded-lg text-[#1C1F1E] focus:ring-1 focus:ring-[#113227] focus:bg-[#FAF7F2]"
                            />
                          </td>
                        ))}

                        {/* Row Total */}
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-xs text-[#113227]">
                          {rowTotal.toFixed(1)}h
                        </td>

                        {/* Delete Line */}
                        <td className="py-2.5 pr-1 text-right">
                          <button
                            onClick={() => handleRemoveWeeklyRow(row.id)}
                            className="text-[#8A9691] hover:text-rose-600 transition-colors p-1"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Day Total Footer */}
                <tfoot>
                  <tr className="border-t-2 border-[#113227] bg-[#FAF8F5] font-mono text-xs font-bold text-[#1C1F1E]">
                    <td className="py-3 pl-3" colSpan={3}>
                      <span>DAILY TOTAL SUMMARY</span>
                    </td>
                    <td className="py-3 text-center text-[#113227]">
                      {dayTotals.mon.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#113227]">
                      {dayTotals.tue.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#113227]">
                      {dayTotals.wed.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#113227]">
                      {dayTotals.thu.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#113227]">
                      {dayTotals.fri.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#8A9691]">
                      {dayTotals.sat.toFixed(1)}h
                    </td>
                    <td className="py-3 text-center text-[#8A9691]">
                      {dayTotals.sun.toFixed(1)}h
                    </td>
                    <td className="py-3 text-right pr-2 text-sm text-[#113227]">
                      {grandTotalHours.toFixed(1)}h
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Audit Log Historical Feed */}
            <div className="pt-4 border-t border-[#F0EBE1]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A9691] pb-2">
                Recent Timesheet Log Submissions (Approved / In Verification)
              </div>
              <div className="divide-y divide-[#F0EBE1]">
                {timesheets.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1C1F1E]">
                        {item.taskDescription}
                      </div>
                      <div className="text-[11px] text-[#7A8782] flex items-center space-x-2">
                        <span>{item.staffName}</span>
                        <span>•</span>
                        <span className="font-mono text-[#C58A3E]">
                          {item.engagementCode}
                        </span>
                        <span>•</span>
                        <span>{item.clientName}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-xs text-[#113227]">
                        {item.hours} hrs
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#C5E8DC]">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECTION 3: RESOURCE ALLOCATION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "resource_matrix" && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[#1C1F1E]">
                4-Week Resource Capacity &amp; Workload Matrix
              </h3>
              <p className="text-xs text-[#7A8782]">
                Monitor partner, manager, and articled trainee allocations to
                prevent overallocation and ensure ISA 220 compliance.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center space-x-2.5">
              {/* Capacity Status Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691]">
                  Status:
                </span>
                <select
                  id="resource-capacity-filter"
                  value={resourceCapacityFilter}
                  onChange={(e) =>
                    setResourceCapacityFilter(e.target.value as any)
                  }
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Capacities</option>
                  <option value="Overallocated">
                    Overallocated (&gt;100%)
                  </option>
                  <option value="Optimal">Optimal (75-100%)</option>
                  <option value="Available">Available (&lt;75%)</option>
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691]">
                  Dept:
                </span>
                <select
                  id="resource-dept-filter"
                  value={resourceDeptFilter}
                  onChange={(e) => setResourceDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Practice Areas</option>
                  <option value="Audit & Assurance">
                    Audit &amp; Assurance
                  </option>
                  <option value="Taxation & Regulatory">
                    Taxation &amp; Regulatory
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Matrix Heatmap Table */}
          <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[940px]">
                <thead>
                  <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                    <th className="pb-3 pl-1 min-w-[220px]">
                      Staff Member &amp; Role
                    </th>
                    <th className="pb-3 px-3 text-center min-w-[160px]">
                      Week 1 (Sep 1-7)
                    </th>
                    <th className="pb-3 px-3 text-center min-w-[160px]">
                      Week 2 (Sep 8-14)
                    </th>
                    <th className="pb-3 px-3 text-center min-w-[160px]">
                      Week 3 (Sep 15-21)
                    </th>
                    <th className="pb-3 px-3 text-center min-w-[160px]">
                      Week 4 (Sep 22-28)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1] text-xs">
                  {filteredResources.map((staff) => (
                    <tr
                      key={staff.staffId}
                      className="hover:bg-[#FAF8F5] transition-colors"
                    >
                      {/* Staff Profile & Designation */}
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#113227] text-white font-bold text-xs flex items-center justify-center border border-[#C58A3E] shrink-0 shadow-2xs">
                            {staff.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1C1F1E] text-xs">
                              {staff.staffName}
                            </div>
                            <div className="text-[10.5px] text-[#7A8782]">
                              {staff.role} • {staff.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4 Weekly Columns */}
                      {staff.weeks.map((week, wIdx) => {
                        const loadRatio = Math.round(
                          (week.allocatedHours / week.capacityHours) * 100,
                        );
                        const isOver = week.status === "Overallocated";
                        const isOpt = week.status === "Optimal";

                        const heatBg = isOver
                          ? "bg-[#FDE6E2] border-[#F4CCC6] text-[#8E362C]"
                          : isOpt
                            ? "bg-[#E1F3EE] border-[#C5E8DC] text-[#1F5946]"
                            : "bg-[#FAF7F2] border-[#E8E1D5] text-[#66706B]";

                        return (
                          <td key={wIdx} className="py-3 px-2">
                            <div
                              className={`p-2.5 rounded-2xl border ${heatBg} space-y-1.5 transition-all`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold">
                                  {week.allocatedHours}h / {week.capacityHours}h
                                </span>
                                <span className="font-bold">{loadRatio}%</span>
                              </div>

                              <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isOver
                                      ? "bg-rose-600"
                                      : isOpt
                                        ? "bg-[#113227]"
                                        : "bg-[#C58A3E]"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, loadRatio)}%`,
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[9.5px]">
                                <span className="font-semibold uppercase tracking-wider">
                                  {week.status}
                                </span>
                                <span
                                  className="truncate max-w-[80px] text-right font-mono opacity-80"
                                  title={week.engagements.join(", ")}
                                >
                                  {week.engagements.length}{" "}
                                  {week.engagements.length === 1
                                    ? "eng"
                                    : "engs"}
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matrix Legend */}
            <div className="pt-4 border-t border-[#F0EBE1] flex flex-wrap items-center justify-between text-xs text-[#7A8782] gap-3">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-[#FDE6E2] border border-[#F4CCC6]" />
                  <span>Overallocated (&gt;100%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-[#E1F3EE] border border-[#C5E8DC]" />
                  <span>Optimal Workload (75-100%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-[#FAF7F2] border border-[#E8E1D5]" />
                  <span>Available Capacity (&lt;75%)</span>
                </span>
              </div>

              <div className="text-[11px] font-mono">
                Standard Capacity: 40h/week (Staff) • 45h/week (CA Articled
                Trainees)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: "+ CREATE TASK" */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E8E1D5] max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold font-mono text-[#8A5A18] uppercase bg-[#FAF0DE] px-2 py-0.5 rounded border border-[#EADBBF]">
                  DELIVERABLE DISPATCH
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1C1F1E]">
                  Create New Task &amp; Checklist
                </h3>
              </div>
              <button
                id="btn-close-task-modal"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-full text-[#8A9691] hover:text-[#1C1F1E] hover:bg-[#FAF7F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1F1E]">
                  Task Title / Objective *
                </label>
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="e.g., Bank Confirmations & ISA 505 External Reconciliations"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Client Linkage & Engagement Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1F1E]">
                    Associated Client *
                  </label>
                  <select
                    id="input-task-client"
                    value={newTaskClient}
                    onChange={(e) => setNewTaskClient(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1F1E]">
                    Engagement Code *
                  </label>
                  <select
                    id="input-task-engagement"
                    value={newTaskEngagement}
                    onChange={(e) => setNewTaskEngagement(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227] font-mono"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.engagementCode}>
                        {eng.engagementCode} ({eng.serviceType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee & Work Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1F1E]">
                    Assignee *
                  </label>
                  <select
                    id="input-task-assignee"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Sabbir Ahmed (Art)">
                      Sabbir Ahmed (Articled Student)
                    </option>
                    <option value="Farhan Kabir (Art)">
                      Farhan Kabir (Articled Student)
                    </option>
                    <option value="Mehvish Sultana (Art)">
                      Mehvish Sultana (Articled Student)
                    </option>
                    <option value="Nadia Sharmin, ACCA">
                      Nadia Sharmin, ACCA (Senior)
                    </option>
                    <option value="Zahirul Islam, FCA">
                      Zahirul Islam, FCA (Manager)
                    </option>
                    <option value="Mahmudur Rahman, ACA">
                      Mahmudur Rahman, ACA (Manager)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1F1E]">
                    Category *
                  </label>
                  <select
                    id="input-task-category"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Field Audit">Field Audit</option>
                    <option value="Report Drafting">Report Drafting</option>
                    <option value="Tax Computation">Tax Computation</option>
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Audit Workpaper">Audit Workpaper</option>
                    <option value="Tax Filing">Tax Filing</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
              </div>

              {/* Priority, Status, Due Date & Estimated Hours */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1C1F1E]">
                    Priority
                  </label>
                  <select
                    id="input-task-priority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1C1F1E]">
                    Status
                  </label>
                  <select
                    id="input-task-status"
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E]"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1C1F1E]">
                    Deadline
                  </label>
                  <input
                    id="input-task-due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1C1F1E]">
                    Est. Hours
                  </label>
                  <input
                    id="input-task-hours"
                    type="number"
                    min="1"
                    max="100"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E]"
                  />
                </div>
              </div>

              {/* Subtasks & Checklist Builder */}
              <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1C1F1E]">
                    Granular Subtasks &amp; Step Checklist
                  </label>
                  <span className="text-[10px] font-mono text-[#8A9691]">
                    {newSubtaskList.length} items
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add a step (e.g., Circularize bank balances...)"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:ring-1 focus:ring-[#113227]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-xl bg-[#113227] text-white text-xs font-bold hover:bg-[#1C4D3E] transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pt-1">
                  {newSubtaskList.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-[#FAF8F5] p-2 rounded-xl border border-[#EBE5DA] text-xs"
                    >
                      <span className="text-[#1C1F1E] truncate max-w-[360px]">
                        • {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="text-[#8A9691] hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#66706B] hover:text-[#1C1F1E] bg-[#FAF7F2] border border-[#E0D7C8]"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-new-task"
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Create &amp; Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DRAWER / MODAL: DAILY TIMER WIDGET */}
      {/* ========================================================================= */}
      {isTimerDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="motion-dialog bg-white rounded-3xl border border-[#E8E1D5] max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-[#C58A3E]" />
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Audit Work Timer
                </h3>
              </div>
              <button
                id="btn-close-timer-drawer"
                onClick={() => setIsTimerDrawerOpen(false)}
                className="p-1.5 rounded-full text-[#8A9691] hover:text-[#1C1F1E] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timer Large Display */}
            <div className="bg-[#113227] text-white p-6 rounded-2xl text-center space-y-3 shadow-inner">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#E1F3EE]/80">
                {isTimerRunning ? "● RECORDING LIVE TIME" : "TIMER PAUSED"}
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[#FAF0DE]">
                {formatTimer(timerSeconds)}
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  id="btn-timer-start-stop"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all ${
                    isTimerRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "bg-[#C58A3E] hover:bg-[#D49A4E] text-[#1C1F1E]"
                  }`}
                >
                  {isTimerRunning ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isTimerRunning ? "Pause Timer" : "Start Timer"}</span>
                </button>
                <button
                  id="btn-timer-reset"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Work Target Linkages */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Target Client Account
                </label>
                <select
                  value={timerClient}
                  onChange={(e) => setTimerClient(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">Engagement</label>
                  <select
                    value={timerEngagementCode}
                    onChange={(e) => setTimerEngagementCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] font-mono text-[11px]"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.engagementCode}>
                        {eng.engagementCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">Work Code</label>
                  <select
                    value={timerWorkCode}
                    onChange={(e) => setTimerWorkCode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#113227] font-semibold"
                  >
                    <option value="Field Audit">Field Audit</option>
                    <option value="Report Drafting">Report Drafting</option>
                    <option value="Tax Computation">Tax Computation</option>
                    <option value="Client Meeting">Client Meeting</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Activity Notes
                </label>
                <textarea
                  rows={2}
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  placeholder="Describe the audit procedures executed..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] text-xs resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsTimerDrawerOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#66706B] bg-[#FAF7F2] border border-[#E0D7C8]"
              >
                Dismiss
              </button>
              <button
                id="btn-stop-and-log-timer"
                type="button"
                onClick={handleStopAndLogTimer}
                className="btn-forest px-4 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Save to Timesheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

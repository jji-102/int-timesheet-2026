import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, CheckCircle2, 
  X, Save, Edit3, ChevronDown, CalendarDays, Trash2, 
  LogIn, LogOut, Search, RefreshCcw,
  ArrowRight, Calendar as CalendarIcon,
  Hash, FolderKanban, ListTodo, PlusCircle, LayoutList, Copy, Repeat, Check, AlertCircle, CalendarRange,
  Columns, Layout, MapPin, UserX, Info
} from 'lucide-react';

const App = () => {
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day', 'project'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [editingId, setEditingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 9));
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectPages, setProjectPages] = useState({});
  const [isMultiDateMode, setIsMultiDateMode] = useState(false);
  const [selectedRepeatDates, setSelectedRepeatDates] = useState([]);

  const ITEMS_PER_PAGE = 5;

  // ฐานข้อมูลงาน (Project IDs starting with 69)
  const [jobDatabase, setJobDatabase] = useState([
    { id: '69001', name: 'Mobile Banking Redesign' },
    { id: '69002', name: 'AI Integration Phase 1' },
    { id: '69003', name: 'E-Commerce Platform' },
    { id: '69065', name: 'Sanitary napkins Tracking Survey' },
    { id: '69880', name: 'Market Share Analysis Q1' },
    { id: '69550', name: 'HR System Upgrade' },
    { id: '69120', name: 'Internal Audit 2026' }
  ]);

  // ฟังก์ชันสร้าง Mockup Data เฉพาะวันทำงาน (จันทร์-ศุกร์) วันละ 8-10 ชม.
  const generateInitialData = () => {
    const entries = {};
    const leaves = {};
    const jobPool = [
      { id: '69001', name: 'Mobile Banking Redesign' },
      { id: '69002', name: 'AI Integration Phase 1' },
      { id: '69003', name: 'E-Commerce Platform' },
      { id: '69065', name: 'Sanitary napkins Tracking Survey' }
    ];

    for (let day = 1; day <= 31; day++) {
      const checkDate = new Date(2026, 2, day);
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;

      const dateKey = `2026-03-${day.toString().padStart(2, '0')}`;
      
      // กรณีลาทั้งวัน - วันที่ 2 และ 16
      if (day === 2 || day === 16) {
        leaves[dateKey] = [{ 
          id: `l-f-${day}`, type: 'ลาพักร้อน', detail: 'พักผ่อนประจำปี (ทั้งวัน)', 
          startTime: '09:00', endTime: '18:00', isFullDay: true 
        }];
        entries[dateKey] = [];
        continue;
      }

      // กรณีลาบางช่วง - วันที่ 4 และ 18
      if (day === 4 || day === 18) {
        leaves[dateKey] = [{ 
          id: `l-h-${day}`, type: 'ลาป่วย', detail: 'พบแพทย์ช่วงเช้า', 
          startTime: '09:00', endTime: '12:00', isFullDay: false 
        }];
        entries[dateKey] = [
          { id: `m1-${day}`, date: dateKey, jobNo: jobPool[1].id, jobName: jobPool[1].name, round: '0', startTime: '13:00', endTime: '17:00', hours: 4, minutes: 0, detail: 'Development', location: 'ทำงานที่บ้าน' },
          { id: `m2-${day}`, date: dateKey, jobNo: jobPool[2].id, jobName: jobPool[2].name, round: '0', startTime: '17:00', endTime: '18:30', hours: 1, minutes: 30, detail: 'Review', location: 'ทำงานที่บ้าน' }
        ];
        continue;
      }

      // วันทำงานปกติ ~ 8.5-9.5 ชม.
      entries[dateKey] = [
        { id: `m1-${day}`, date: dateKey, jobNo: jobPool[0].id, jobName: jobPool[0].name, round: '0', startTime: '09:00', endTime: '12:00', hours: 3, minutes: 0, detail: 'Morning Sync', location: 'ทำงานที่ออฟฟิศ' },
        { id: `m2-${day}`, date: dateKey, jobNo: jobPool[1].id, jobName: jobPool[1].name, round: '0', startTime: '13:00', endTime: '17:00', hours: 4, minutes: 0, detail: 'Main Tasks', location: 'ทำงานที่บ้าน' },
        { id: `m3-${day}`, date: dateKey, jobNo: jobPool[2].id, jobName: jobPool[2].name, round: '0', startTime: '17:00', endTime: '19:00', hours: 2, minutes: 0, detail: 'Reporting', location: 'ทำงานนอกสถานที่' }
      ];
    }
    return { entries, leaves };
  };

  const initialData = useMemo(() => generateInitialData(), []);
  const [allEntries, setAllEntries] = useState(initialData.entries);
  const [leaveEntries, setLeaveEntries] = useState(initialData.leaves);

  const [newTask, setNewTask] = useState({
    date: '2026-03-09', jobNo: '', jobName: '', round: '0', startTime: '09:00', endTime: '10:00', detail: '', location: 'ทำงานที่ออฟฟิศ'
  });

  const [newLeave, setNewLeave] = useState({
    startDate: '2026-03-09', endDate: '2026-03-09', type: 'ลาพักร้อน', detail: '', startTime: '09:00', endTime: '18:00', isFullDay: true
  });

  const [suggestions, setSuggestions] = useState([]);

  // --- Helpers ---
  const getDateKey = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const currentDateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const currentDayEntries = useMemo(() => allEntries[currentDateKey] || [], [allEntries, currentDateKey]);
  const currentDayLeaves = useMemo(() => leaveEntries[currentDateKey] || [], [leaveEntries, currentDateKey]);

  useEffect(() => {
    if (newTask.jobNo.length > 0) {
      setSuggestions(jobDatabase.filter(job => job.id.includes(newTask.jobNo)));
    } else {
      setSuggestions([]);
    }
  }, [newTask.jobNo, jobDatabase]);

  const selectJob = (job) => {
    setNewTask({ ...newTask, jobNo: job.id, jobName: job.name });
    setSuggestions([]);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return { h: 0, m: 0 };
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMinutes < 0) totalMinutes = 0;
    return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 };
  };

  const totalLoggedHours = useMemo(() => {
    const totalMinutes = currentDayEntries.reduce((sum, entry) => sum + (Number(entry.hours) * 60) + Number(entry.minutes), 0);
    return totalMinutes / 60;
  }, [currentDayEntries]);

  const flattenedEntriesByProject = useMemo(() => {
    const grouped = {};
    Object.entries(allEntries).forEach(([date, entries]) => {
      entries.forEach(entry => {
        if (!grouped[entry.jobNo]) grouped[entry.jobNo] = [];
        grouped[entry.jobNo].push({ ...entry, date });
      });
    });
    return grouped;
  }, [allEntries]);

  // --- Core Operations ---
  const handleSaveTask = () => {
    if (!newTask.jobNo) return;
    const duration = calculateDuration(newTask.startTime, newTask.endTime);
    
    setAllEntries(prev => {
      const newState = { ...prev };
      if (isMultiDateMode && selectedRepeatDates.length > 0) {
        selectedRepeatDates.forEach(dKey => {
          const entryData = { ...newTask, date: dKey, hours: duration.h, minutes: duration.m, id: `rep-${Date.now()}-${Math.random()}` };
          newState[dKey] = [...(newState[dKey] || []), entryData].sort((a,b) => a.startTime.localeCompare(b.startTime));
        });
      } else {
        const entryData = { ...newTask, hours: duration.h, minutes: duration.m, id: editingId || Date.now() };
        const targetDateKey = newTask.date;
        if (editingId) {
          Object.keys(newState).forEach(k => { newState[k] = newState[k].filter(e => e.id !== editingId); });
        }
        newState[targetDateKey] = [...(newState[targetDateKey] || []), entryData].sort((a,b) => a.startTime.localeCompare(b.startTime));
      }
      return newState;
    });
    setIsModalOpen(false);
  };

  const handleSaveLeave = () => {
    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const newState = { ...leaveEntries };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dKey = getDateKey(d);
      const leaveData = { ...newLeave, id: `lv-${Date.now()}-${Math.random()}`, date: dKey };
      newState[dKey] = [...(newState[dKey] || []), leaveData];
      if (newLeave.isFullDay) { setAllEntries(prev => ({ ...prev, [dKey]: [] })); }
    }
    setLeaveEntries(newState);
    setIsLeaveModalOpen(false);
  };

  const requestDeleteTask = (dateKey, entryId, entryName) => {
    setConfirmDialog({
      isOpen: true, type: 'delete', title: 'ลบรายการงาน', message: `ต้องการลบ "${entryName}"?`,
      onConfirm: () => {
        setAllEntries(prev => ({ ...prev, [dateKey]: prev[dateKey].filter(e => e.id !== entryId) }));
        closeConfirm();
      }
    });
  };

  const requestDeleteLeave = (dateKey, leaveId, leaveType) => {
    setConfirmDialog({
      isOpen: true, type: 'delete', title: 'ยกเลิกวันลา', message: `ต้องการยกเลิก "${leaveType}"?`,
      onConfirm: () => {
        setLeaveEntries(prev => ({ ...prev, [dateKey]: prev[dateKey].filter(e => e.id !== leaveId) }));
        closeConfirm();
      }
    });
  };

  const requestCopyTask = (entry) => {
    setConfirmDialog({
      isOpen: true, type: 'copy', title: 'คัดลอกรายการ', message: `ยืนยันการคัดลอกรายการนี้?`,
      onConfirm: () => {
        const newEntry = { ...entry, id: Date.now() + Math.random() };
        setAllEntries(prev => ({
          ...prev,
          [entry.date]: [...(prev[entry.date] || []), newEntry].sort((a,b) => a.startTime.localeCompare(b.startTime))
        }));
        closeConfirm();
      }
    });
  };

  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', title: '', message: '', onConfirm: null });

  const openModal = (entry = null, date = null, jobOverride = null) => {
    const targetDate = date || currentDate;
    const targetDateKey = getDateKey(targetDate);
    setCurrentDate(targetDate);
    setIsMultiDateMode(false);
    setSelectedRepeatDates([]);

    if (entry) {
      setEditingId(entry.id);
      setNewTask({ ...entry, date: entry.date || targetDateKey });
    } else {
      setEditingId(null);
      const entriesForTargetDate = allEntries[targetDateKey] || [];
      const lastEntry = entriesForTargetDate[entriesForTargetDate.length - 1];
      const nextStart = lastEntry ? lastEntry.endTime : '09:00';
      setNewTask({ 
        date: targetDateKey, jobNo: jobOverride?.id || '', jobName: jobOverride?.name || '', 
        round: '0', startTime: nextStart, endTime: nextStart, detail: '', location: 'ทำงานที่ออฟฟิศ'
      });
    }
    setIsModalOpen(true);
  };

  const handleRepeatTask = (entry) => {
    setEditingId(null);
    setNewTask({ ...entry, id: null });
    setIsMultiDateMode(true);
    setSelectedRepeatDates([entry.date]);
    setIsModalOpen(true);
  };

  const toggleRepeatDate = (dKey) => {
    setSelectedRepeatDates(prev => prev.includes(dKey) ? prev.filter(d => d !== dKey) : [...prev, dKey]);
  };

  const clearRepeatDates = () => setSelectedRepeatDates([]);

  const selectWeekdaysOnly = () => {
    const d = new Date(newTask.date);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const weekdays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const checkDate = new Date(d.getFullYear(), d.getMonth(), i);
        if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) { weekdays.push(getDateKey(checkDate)); }
    }
    setSelectedRepeatDates(weekdays);
  };

  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const setPage = (projectId, page) => {
    setProjectPages(prev => ({ ...prev, [projectId]: page }));
  };

  // --- UI Components ---

  const CompactDateNavigator = () => (
    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 shrink-0 scale-95">
      <button onClick={() => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
        else if (viewMode === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentDate(d);
      }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all"><ChevronLeft size={14}/></button>
      <div className="px-2 py-0.5 cursor-pointer" onClick={() => setCurrentDate(new Date())}>
          <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase">
            {currentDate.toLocaleDateString('th-TH', { 
                month: viewMode === 'month' ? 'long' : 'short', 
                year: 'numeric',
                day: viewMode !== 'month' ? 'numeric' : undefined
            })}
          </span>
      </div>
      <button onClick={() => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
        else if (viewMode === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentDate(d);
      }} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all"><ChevronRight size={14}/></button>
    </div>
  );

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="bg-slate-50/5 border-r border-b border-slate-100 min-h-[110px]"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = getDateKey(date);
      const entries = allEntries[key] || [];
      const leaves = leaveEntries[key] || [];
      const isSelected = key === currentDateKey;
      const isToday = new Date().toDateString() === date.toDateString();

      cells.push(
        <div 
          key={d} 
          onClick={() => setCurrentDate(date)}
          onDoubleClick={() => openModal(null, date)}
          className={`group flex flex-col min-h-[110px] border-r border-b border-slate-100 p-2 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-100' : 'bg-white hover:bg-slate-50/80'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-rose-500 text-white shadow-sm' : isSelected ? 'bg-blue-600 text-white' : 'text-slate-400 group-hover:text-slate-700'}`}>
              {d}
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {leaves.map((l, idx) => (
              <div key={`${l.id}-${idx}`} className="text-[8px] px-1.5 py-0.5 rounded truncate font-black bg-orange-100 text-orange-700 border border-orange-200 leading-none">
                L: {l.type}
              </div>
            ))}
            {entries.slice(0, 2).map((entry, idx) => (
              <div key={`${entry.id}-${idx}`} className={`text-[8px] px-1.5 py-0.5 rounded truncate font-black border leading-tight shadow-sm bg-blue-50 text-blue-700 border-blue-100`}>
                {entry.jobName}
              </div>
            ))}
            {entries.length > 2 && <div className="text-[7px] font-bold text-slate-300 text-center">+ {entries.length - 2}</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full bg-white animate-in fade-in duration-500">
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center sticky top-16 z-30 shadow-sm backdrop-blur-md">
            <CompactDateNavigator />
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Live
               </span>
            </div>
        </div>
        <div className="w-full">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 sticky top-[116px] z-20">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                <div key={`weekday-h-${i}`} className="py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {cells}
            </div>
        </div>
        {renderSelectedDaySection()}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
    }

    return (
      <div className="flex flex-col w-full bg-white animate-in fade-in duration-500">
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center sticky top-[68px] z-30 shadow-sm backdrop-blur-md">
            <CompactDateNavigator />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Week View</span>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 sticky top-[116px] z-20">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                <div key={`week-h-${i}`} onClick={() => setCurrentDate(days[i])} className={`py-4 text-center cursor-pointer border-r last:border-0 border-slate-100 ${days[i].toDateString() === currentDate.toDateString() ? 'bg-blue-50/50' : 'hover:bg-white'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{day}</p>
                    <p className={`text-xl font-black ${days[i].toDateString() === new Date().toDateString() ? 'text-rose-500' : days[i].toDateString() === currentDate.toDateString() ? 'text-blue-600' : 'text-slate-800'}`}>{days[i].getDate()}</p>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7 min-h-[500px] divide-x divide-slate-100">
            {days.map((d, idx) => {
                const dKey = getDateKey(d);
                const entries = allEntries[dKey] || [];
                const leaves = leaveEntries[dKey] || [];
                return (
                    <div key={`week-day-${idx}`} className={`p-3 space-y-2 bg-white transition-colors ${dKey === currentDateKey ? 'bg-blue-50/10 shadow-inner' : ''}`}>
                        {leaves.map(l => (
                          <div key={l.id} className="bg-orange-50 border border-orange-100 p-2 rounded-xl text-[9px] font-black text-orange-700 shadow-sm">
                             <UserX size={10} className="mb-1"/> {l.type}
                          </div>
                        ))}
                        {entries.map(e => (
                            <div key={e.id} onDoubleClick={() => openModal(e)} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase">#{e.jobNo}</span>
                                    <span className="text-[7px] font-bold text-slate-400">{e.startTime}</span>
                                </div>
                                <h4 className="text-[9px] font-black text-slate-800 leading-tight truncate">{e.jobName}</h4>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="flex flex-col w-full bg-white animate-in fade-in duration-500">
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center sticky top-[68px] z-30 shadow-sm backdrop-blur-md">
            <CompactDateNavigator />
            <div className="flex gap-2">
                <button onClick={() => openModal()} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-sm flex items-center gap-2"><Plus size={14}/> Add Task</button>
            </div>
        </div>
        <div className="p-8 bg-slate-50/30 min-h-[600px]">
            {renderSelectedDaySection(true)}
        </div>
    </div>
  );

  const renderSelectedDaySection = (isExpanded = false) => (
    <div className={`bg-slate-50/50 p-8 border-t border-slate-200 ${isExpanded ? 'border-none p-0' : ''}`}>
        <div className="max-w-6xl mx-auto">
            {!isExpanded && (
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100">
                            <ListTodo size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">
                                {currentDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {currentDayEntries.length} Tasks Recorded • {currentDayLeaves.length} Leaves
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => setIsLeaveModalOpen(true)} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100">Request Leave</button>
                         <button onClick={() => openModal()} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-xl">Add Task</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50 p-5 rounded-3xl border border-orange-100 shadow-sm flex items-start gap-4 hover:border-orange-300 transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-5"><UserX size={40} /></div>
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                        <UserX size={20} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[8px] font-black text-orange-600 uppercase">Leave: {l.type}</span>
                           {l.isFullDay && <span className="text-[7px] font-black bg-orange-200 text-orange-800 px-1 rounded">ALL DAY</span>}
                        </div>
                        <h4 className="text-xs font-black text-slate-800 truncate">{l.detail}</h4>
                        <p className="text-[9px] text-orange-400 mt-1 font-bold">{l.startTime} - {l.endTime}</p>
                     </div>
                     <button onClick={() => requestDeleteLeave(currentDateKey, l.id, l.type)} className="p-1 text-orange-300 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Trash2 size={14} />
                     </button>
                  </div>
                ))}
                {currentDayEntries.map((entry, idx) => (
                    <div key={`${entry.id}-${idx}`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-300 transition-all group relative overflow-hidden">
                        <div className="flex flex-col items-center bg-slate-50 px-2 py-3 rounded-xl border border-slate-100 min-w-[55px]">
                            <span className="text-[10px] font-black text-slate-800">{entry.startTime}</span>
                            <div className="h-2 w-px bg-slate-200 my-1"></div>
                            <span className="text-[10px] font-black text-slate-400">{entry.endTime}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                               <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase block w-fit">JOB {entry.jobNo}</span>
                               <span className="text-[7px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md flex items-center gap-1"><MapPin size={8}/> {entry.location}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-800 mb-1 truncate">{entry.jobName}</h4>
                            <p className="text-[9px] text-slate-400 line-clamp-1 italic">{entry.detail}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(entry)} className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg"><Edit3 size={14}/></button>
                            <button onClick={() => requestCopyTask(entry)} className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-blue-500 rounded-lg"><Copy size={14}/></button>
                            <button onClick={() => requestDeleteTask(currentDateKey, entry.id, entry.jobName)} className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderProjectView = () => (
    <div className="w-full bg-slate-50 min-h-screen animate-in fade-in duration-500 pb-24 px-8 py-12">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Projects Center</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-2">Resource database (69-Series)</p>
                </div>
                <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-xl"><PlusCircle size={18}/> New Project</button>
            </div>
            <div className="space-y-3">
                {jobDatabase.map(project => {
                    const entries = flattenedEntriesByProject[project.id] || [];
                    const totalH = entries.reduce((sum, e) => sum + (e.hours * 60) + e.minutes, 0) / 60;
                    const isExpanded = expandedProjects[project.id];
                    const currentPage = projectPages[project.id] || 1;
                    const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
                    const pagedEntries = entries.sort((a,b) => b.date.localeCompare(a.date)).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                    return (
                      <div key={project.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-200 transition-all">
                          <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleProjectExpansion(project.id)}>
                              <div className="flex items-center gap-5">
                                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Hash size={20} /></div>
                                  <div>
                                      <h3 className="text-sm font-black text-slate-800 truncate">{project.name}</h3>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">ID: {project.id}</span>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{totalH.toFixed(1)} HRS Recorded</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); openModal(null, null, project); }} className="px-4 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 rounded-lg font-black text-[9px] uppercase transition-all">Log Time</button>
                                <button onClick={(e) => { e.stopPropagation(); requestDeleteProject(project); }} className="p-2 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Delete Project"><Trash2 size={16} /></button>
                                <div className={`p-1.5 rounded-lg bg-slate-50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={16} /></div>
                              </div>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/20 p-4 animate-in slide-in-from-top-2">
                              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                  <thead><tr className="bg-slate-50"><th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">Date</th><th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">Time</th><th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center">Dur.</th><th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">Location</th><th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Actions</th></tr></thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {pagedEntries.map((e, idx) => (
                                      <tr key={`${e.id}-${idx}`} className="hover:bg-blue-50/10 group transition-colors">
                                        <td className="px-6 py-3 font-black text-[11px] text-slate-700">{new Date(e.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}</td>
                                        <td className="px-6 py-3 font-bold text-[10px] text-slate-500">{e.startTime} - {e.endTime}</td>
                                        <td className="px-6 py-3 text-center font-black text-[11px] text-blue-600">{e.hours}h</td>
                                        <td className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase">{e.location}</td>
                                        <td className="px-6 py-3 text-right">
                                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100">
                                            <button onClick={() => openModal(e)} className="p-1.5 hover:bg-white text-slate-300 hover:text-blue-500 rounded-lg shadow-sm"><Edit3 size={12}/></button>
                                            <button onClick={() => requestDeleteTask(e.date, e.id, e.jobName)} className="p-1.5 hover:bg-white text-slate-300 hover:text-rose-500 rounded-lg shadow-sm"><Trash2 size={12}/></button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {totalPages > 1 && (
                                  <div className="p-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Page {currentPage} / {totalPages}</span>
                                    <div className="flex gap-2">
                                      <button disabled={currentPage === 1} onClick={() => setPage(project.id, currentPage - 1)} className="p-1.5 bg-white rounded-lg disabled:opacity-20"><ChevronLeft size={14}/></button>
                                      <button disabled={currentPage === totalPages} onClick={() => setPage(project.id, currentPage + 1)} className="p-1.5 bg-white rounded-lg disabled:opacity-20"><ChevronRight size={14}/></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                })}
            </div>
        </div>
    </div>
  );

  const requestDeleteProject = (project) => {
    setConfirmDialog({
      isOpen: true, type: 'delete', title: 'ลบโปรเจกต์', message: `ยืนยันการลบโปรเจกต์ "${project.name}"? ข้อมูลทั้งหมดจะหายไป`,
      onConfirm: () => {
        setJobDatabase(prev => prev.filter(p => p.id !== project.id));
        setAllEntries(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(date => {
            newState[date] = newState[date].filter(entry => entry.jobNo !== project.id);
          });
          return newState;
        });
        closeConfirm();
      }
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-all selection:bg-blue-100">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-10 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-slate-900">Time<span className="text-blue-600">Flow</span></h1>
            <nav className="flex bg-slate-100 p-1 rounded-[14px] shadow-inner">
                {[
                  { id: 'month', icon: CalendarIcon, label: 'Month' },
                  { id: 'week', icon: Layout, label: 'Week' },
                  { id: 'day', icon: Columns, label: 'Day' },
                  { id: 'project', icon: FolderKanban, label: 'Projects' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setViewMode(tab.id)} className={`flex items-center gap-2 px-5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                    <tab.icon size={12}/> {tab.label}
                  </button>
                ))}
            </nav>
        </div>
        <button onClick={() => setIsLeaveModalOpen(true)} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase border border-orange-100 hover:bg-orange-100 transition-all shadow-sm"><UserX size={14}/> Leave Request</button>
      </header>

      <main className="w-full relative">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'project' && renderProjectView()}
      </main>

      {/* Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-200">
              <div className="h-16 bg-orange-50/80 border-b border-orange-100 flex items-center justify-between px-8">
                <div className="flex items-center gap-3 text-orange-600"><UserX size={18} /><h2 className="text-xs font-black uppercase tracking-widest">ยื่นใบลา</h2></div>
                <button onClick={() => setIsLeaveModalOpen(false)} className="p-2 hover:bg-orange-100 rounded-xl text-orange-400 transition-all"><X size={18}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">ประเภทการลา</label>
                  <select value={newLeave.type} onChange={(e) => setNewLeave({...newLeave, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-orange-500 outline-none">{['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาบวช', 'ลาคลอด', 'อื่นๆ'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="flex items-center gap-2 p-1"><input type="checkbox" id="fullDayCheck" checked={newLeave.isFullDay} onChange={(e) => setNewLeave({...newLeave, isFullDay: e.target.checked})} className="w-4 h-4 rounded text-orange-600"/><label htmlFor="fullDayCheck" className="text-[11px] font-black text-slate-700 uppercase cursor-pointer">ลาทั้งวัน</label></div>
                  {!newLeave.isFullDay && (<div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">เริ่ม</label><input type="time" value={newLeave.startTime} onChange={(e) => setNewLeave({...newLeave, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:bg-white outline-none"/></div><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">ถึง</label><input type="time" value={newLeave.endTime} onChange={(e) => setNewLeave({...newLeave, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:bg-white outline-none"/></div></div>)}
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">เริ่มวันที่</label><input type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white outline-none"/></div><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">ถึงวันที่</label><input type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white outline-none"/></div></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">รายละเอียด</label><textarea value={newLeave.detail} onChange={(e) => setNewLeave({...newLeave, detail: e.target.value})} placeholder="ระบุเหตุผล..." rows="2" className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:bg-white outline-none resize-none"></textarea></div>
                </div>
                <button onClick={handleSaveLeave} className="w-full py-4 bg-orange-600 text-white rounded-[20px] text-[10px] font-black uppercase shadow-lg hover:bg-orange-700 active:scale-95 transition-all">ส่งคำขอยื่นลา</button>
              </div>
           </div>
        </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="h-14 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${isMultiDateMode ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {isMultiDateMode ? <CalendarRange size={16} /> : editingId ? <Edit3 size={14}/> : <Plus size={16}/>}
                    </div>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">{isMultiDateMode ? 'Repeat Task' : editingId ? 'Update Entry' : 'Log Hours'}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all"><X size={18}/></button>
              </div>
              <div className="p-8 overflow-y-auto scrollbar-thin">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {!isMultiDateMode ? (
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Date</label>
                                <input type="date" value={newTask.date} onChange={(e) => setNewTask({...newTask, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"/>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1"><label className="text-[9px] font-black text-slate-400 uppercase">Target Dates</label>
                                    <div className="flex gap-2"><button onClick={selectWeekdaysOnly} className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">M-F</button><button onClick={clearRepeatDates} className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase">Clear</button></div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-7 gap-1 mb-2">{['S','M','T','W','T','F','S'].map((d, i) => (<div key={`wd-lbl-${i}`} className="text-center text-[8px] font-black text-slate-300 uppercase">{d}</div>))}</div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {(() => {
                                            const refDate = new Date(newTask.date);
                                            const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
                                            const firstDay = new Date(refDate.getFullYear(), refDate.getMonth(), 1).getDay();
                                            const cells = [];
                                            for(let i=0; i<firstDay; i++) cells.push(<div key={`em-c-${i}`} />);
                                            for(let i=1; i<=daysInMonth; i++) {
                                                const dKey = `${refDate.getFullYear()}-${(refDate.getMonth()+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                                                const isSel = selectedRepeatDates.includes(dKey);
                                                cells.push(<button key={`dc-${i}`} onClick={() => toggleRepeatDate(dKey)} className={`w-7 h-7 rounded-xl text-[9px] font-black flex items-center justify-center transition-all ${isSel ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>{i}</button>);
                                            }
                                            return cells;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">สถานที่ทำงาน</label>
                            <select value={newTask.location} onChange={(e) => setNewTask({...newTask, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white outline-none">{['ทำงานที่ออฟฟิศ', 'ทำงานที่บ้าน', 'ทำงานนอกสถานที่', 'อื่นๆ'].map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
                            <div className="relative space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Project ID</label><div className="relative"><input type="text" value={newTask.jobNo} onChange={(e) => setNewTask({...newTask, jobNo: e.target.value})} placeholder="e.g. 69065" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white outline-none pr-10 shadow-inner"/><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/></div>
                                {suggestions.length > 0 && (<div className="absolute z-[600] w-full bg-white border border-slate-200 rounded-2xl mt-1 shadow-xl max-h-40 overflow-y-auto">{suggestions.map((job, jIdx) => (<button key={`sug-t-${job.id}-${jIdx}`} onClick={() => selectJob(job)} className="w-full text-left px-4 py-3 text-[10px] hover:bg-blue-50 border-b last:border-0 font-black flex justify-between items-center"><span className="text-blue-600">{job.id}</span><span className="text-slate-400 ml-4">{job.name}</span></button>))}</div>)}
                            </div>
                            <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Activity Name</label><input type="text" value={newTask.jobName} onChange={(e) => setNewTask({...newTask, jobName: e.target.value})} placeholder="Project title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all shadow-inner"/></div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Clock size={100} /></div><div className="space-y-2 relative z-10"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><LogIn size={12} className="text-emerald-500"/> Start Time</label><input type="time" value={newTask.startTime} onChange={(e) => setNewTask({...newTask, startTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm"/></div><div className="space-y-2 relative z-10"><label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><LogOut size={12} className="text-rose-500"/> End Time</label><input type="time" value={newTask.endTime} onChange={(e) => setNewTask({...newTask, endTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-rose-500 transition-all shadow-sm"/></div></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Documentation</label><textarea value={newTask.detail} onChange={(e) => setNewTask({...newTask, detail: e.target.value})} rows="4" placeholder="Add notes..." className="w-full bg-slate-100/50 border border-slate-200 rounded-[30px] px-6 py-5 text-sm font-bold outline-none resize-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"></textarea></div>
                        <div className="flex gap-4 pt-2"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase hover:bg-slate-200 transition-all">Discard</button><button onClick={handleSaveTask} className={`flex-[1.5] py-4 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${isMultiDateMode ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-600 shadow-blue-100'}`}>{isMultiDateMode ? <CalendarRange size={16}/> : <CheckCircle2 size={16}/>}{isMultiDateMode ? 'Repeat Entry' : 'Save Record'}</button></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl border border-white animate-in zoom-in-95 duration-200">
              <div className="p-10 text-center space-y-6">
                <div className={`w-16 h-16 mx-auto rounded-[22px] flex items-center justify-center shadow-md ${confirmDialog.type === 'delete' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'}`}>
                    {confirmDialog.type === 'delete' ? <Trash2 size={28} /> : <Copy size={28} />}
                </div>
                <div className="space-y-1"><h3 className="text-lg font-black text-slate-900">{confirmDialog.title}</h3><p className="text-xs font-medium text-slate-500 leading-relaxed px-2">{confirmDialog.message}</p></div>
                <div className="flex gap-3 pt-2"><button onClick={closeConfirm} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">ยกเลิก</button><button onClick={confirmDialog.onConfirm} className={`flex-1 py-3.5 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${confirmDialog.type === 'delete' ? 'bg-rose-500' : 'bg-blue-600'}`}>ยืนยัน</button></div>
              </div>
           </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-12 animate-in zoom-in-95 duration-200 border border-white">
             <div className="flex justify-between items-center mb-10 text-slate-900"><h2 className="text-xl font-black uppercase tracking-widest">New Project</h2><button onClick={() => setIsProjectModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-3xl text-slate-400 transition-all"><X size={24}/></button></div>
             <div className="space-y-10"><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase ml-4">Unique Project ID</label><input type="text" placeholder="e.g. 69080" className="w-full bg-slate-100/50 border-2 border-transparent rounded-[26px] px-8 py-5 text-sm font-bold focus:bg-white outline-none transition-all shadow-inner"/></div><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase ml-4">Project Name</label><input type="text" placeholder="Project title..." className="w-full bg-slate-100/50 border-2 border-transparent rounded-[26px] px-8 py-5 text-sm font-bold focus:bg-white outline-none transition-all shadow-inner"/></div><button className="w-full py-6 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase shadow-2xl">Register Project</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
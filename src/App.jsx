import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, CheckCircle2, 
  X, Save, Edit3, ChevronDown, CalendarDays, Trash2, 
  LogIn, LogOut, Search, RefreshCcw,
  ArrowRight, Calendar as CalendarIcon,
  Hash, FolderKanban, ListTodo, PlusCircle, LayoutList, Copy, Repeat, Check, AlertCircle, CalendarRange,
  Columns, Layout, MapPin, UserX, Info, Home, Building2, Globe, MoreHorizontal, Settings
} from 'lucide-react';

const App = () => {
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isProjectManageOpen, setIsProjectManageOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [editingId, setEditingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 9));
  const [isMultiDateMode, setIsMultiDateMode] = useState(false);
  const [multiDateConfigs, setMultiDateConfigs] = useState({}); 

  // ฐานข้อมูลงาน (Internal Management)
  const [jobDatabase, setJobDatabase] = useState([
    { id: '69001', name: 'Mobile Banking Redesign' },
    { id: '69002', name: 'AI Integration Phase 1' },
    { id: '69003', name: 'E-Commerce Platform' },
    { id: '69065', name: 'Sanitary napkins Tracking Survey' }
  ]);

  // สถานที่ทำงาน (Active per date)
  const [dayMetadata, setDayMetadata] = useState({});

  // Mockup Data Generator (Working Days Only)
  const generateInitialData = () => {
    const entries = {};
    const leaves = {};
    const metadata = {};
    const jobPool = [
      { id: '69001', name: 'Mobile Banking Redesign' },
      { id: '69002', name: 'AI Integration Phase 1' },
      { id: '69003', name: 'E-Commerce Platform' }
    ];

    for (let day = 1; day <= 31; day++) {
      const checkDate = new Date(2026, 2, day);
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      const dateKey = `2026-03-${day.toString().padStart(2, '0')}`;
      
      metadata[dateKey] = { location: day % 2 === 0 ? 'ทำงานที่ออฟฟิศ' : 'ทำงานที่บ้าน' };

      if (day === 2 || day === 16) {
        leaves[dateKey] = [{ id: `l-${day}`, type: 'ลาพักร้อน', detail: 'พักผ่อนประจำปี', startTime: '09:00', endTime: '18:00', isFullDay: true }];
        entries[dateKey] = [];
        continue;
      }

      entries[dateKey] = [
        { id: `m1-${day}`, date: dateKey, jobNo: jobPool[0].id, jobName: jobPool[0].name, round: '0', startTime: '09:00', endTime: '12:00', hours: 3, minutes: 0, detail: 'Morning Sync' },
        { id: `m2-${day}`, date: dateKey, jobNo: jobPool[1].id, jobName: jobPool[1].name, round: '0', startTime: '13:00', endTime: '18:00', hours: 5, minutes: 0, detail: 'Development' }
      ];
    }
    return { entries, leaves, metadata };
  };

  const initialData = useMemo(() => generateInitialData(), []);
  const [allEntries, setAllEntries] = useState(initialData.entries);
  const [leaveEntries, setLeaveEntries] = useState(initialData.leaves);
  const [metadata, setMetadata] = useState(initialData.metadata);

  const [newTask, setNewTask] = useState({
    date: '2026-03-09', jobNo: '', jobName: '', round: '0', startTime: '09:00', endTime: '18:00', detail: ''
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
  const currentLocation = useMemo(() => metadata[currentDateKey]?.location || 'ทำงานที่ออฟฟิศ', [metadata, currentDateKey]);

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

  const updateLocation = (location) => {
    setMetadata(prev => ({ ...prev, [currentDateKey]: { ...prev[currentDateKey], location } }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return { h: 0, m: 0 };
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    return { h: Math.floor(Math.max(0, totalMinutes) / 60), m: Math.max(0, totalMinutes) % 60 };
  };

  const handleSaveTask = () => {
    if (!newTask.jobNo) return;
    setAllEntries(prev => {
      const newState = { ...prev };
      if (isMultiDateMode) {
        Object.entries(multiDateConfigs).forEach(([dKey, config]) => {
          const dur = calculateDuration(config.startTime, config.endTime);
          const entryData = { ...newTask, date: dKey, startTime: config.startTime, endTime: config.endTime, hours: dur.h, minutes: dur.m, id: Date.now() + Math.random() };
          newState[dKey] = [...(newState[dKey] || []), entryData].sort((a,b) => a.startTime.localeCompare(b.startTime));
        });
      } else {
        const dur = calculateDuration(newTask.startTime, newTask.endTime);
        const entryData = { ...newTask, hours: dur.h, minutes: dur.m, id: editingId || Date.now() };
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
      newState[dKey] = [...(newState[dKey] || []), { ...newLeave, id: Date.now() + Math.random(), date: dKey }];
      if (newLeave.isFullDay) setAllEntries(prev => ({ ...prev, [dKey]: [] }));
    }
    setLeaveEntries(newState);
    setIsLeaveModalOpen(false);
  };

  const requestDeleteTask = (dateKey, entryId, entryName) => {
    setConfirmDialog({
      isOpen: true, type: 'delete', title: 'ลบรายการนี้?', message: entryName,
      onConfirm: () => {
        setAllEntries(prev => ({ ...prev, [dateKey]: prev[dateKey].filter(e => e.id !== entryId) }));
        closeConfirm();
      }
    });
  };

  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', title: '', message: '', onConfirm: null });

  const openModal = (entry = null, date = null) => {
    const targetDate = date || currentDate;
    const targetDateKey = getDateKey(targetDate);
    setCurrentDate(targetDate);
    setIsMultiDateMode(false);
    if (entry) {
      setEditingId(entry.id);
      setNewTask({ ...entry });
    } else {
      setEditingId(null);
      setNewTask({ date: targetDateKey, jobNo: '', jobName: '', round: '0', startTime: '09:00', endTime: '18:00', detail: '' });
      setMultiDateConfigs({ [targetDateKey]: { startTime: '09:00', endTime: '18:00' } });
    }
    setIsModalOpen(true);
  };

  const toggleRepeatDate = (dKey) => {
    setMultiDateConfigs(prev => {
      const n = { ...prev };
      if (n[dKey]) delete n[dKey];
      else n[dKey] = { startTime: newTask.startTime, endTime: newTask.endTime };
      return n;
    });
  };

  // --- Views ---

  // iOS Style Location & Date Bar
  const HeaderStatus = () => (
    <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-4 py-3 sticky top-[60px] sm:top-[64px] z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Date Navigator */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                  else d.setDate(d.getDate() - 1);
                  setCurrentDate(d);
                }} className="p-2 hover:bg-white rounded-xl text-slate-500"><ChevronLeft size={18}/></button>
                <div className="flex-1 px-4 text-center cursor-pointer font-black text-sm text-slate-800 uppercase tracking-tight" onClick={() => setCurrentDate(new Date())}>
                    {currentDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric', day: viewMode !== 'month' ? 'numeric' : undefined })}
                </div>
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                  else d.setDate(d.getDate() + 1);
                  setCurrentDate(d);
                }} className="p-2 hover:bg-white rounded-xl text-slate-500"><ChevronRight size={18}/></button>
            </div>

            {/* Location Selector - Segmented iOS Control */}
            <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full sm:w-auto shadow-inner">
                {[
                  { id: 'ทำงานที่ออฟฟิศ', icon: Building2, label: 'ออฟฟิศ' },
                  { id: 'ทำงานที่บ้าน', icon: Home, label: 'ที่บ้าน' },
                  { id: 'ทำงานนอกสถานที่', icon: Globe, label: 'Field' }
                ].map(loc => (
                  <button 
                    key={loc.id}
                    onClick={() => updateLocation(loc.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${currentLocation === loc.id ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <loc.icon size={14}/> {loc.label}
                  </button>
                ))}
            </div>
        </div>
    </div>
  );

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="bg-slate-50/5 border-r border-b border-slate-100 min-h-[90px]"></div>);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = getDateKey(date);
      const entries = allEntries[key] || [];
      const leaves = leaveEntries[key] || [];
      const isSelected = key === currentDateKey;
      const isToday = new Date().toDateString() === date.toDateString();

      cells.push(
        <div key={d} onClick={() => setCurrentDate(date)} onDoubleClick={() => openModal(null, date)}
          className={`group flex flex-col min-h-[90px] border-r border-b border-slate-100 p-1 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-100' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="flex justify-between items-start mb-0.5">
            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white' : isSelected ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{d}</span>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {leaves.map((l, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-orange-100 text-orange-600 border border-orange-200 leading-none">L: {l.type}</div>)}
            {entries.slice(0, 2).map((e, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-blue-50 text-blue-700 border border-blue-100 leading-none">{e.jobName}</div>)}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full bg-white pb-32">
        <HeaderStatus />
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 sticky top-[128px] sm:top-[128px] z-20 shadow-sm">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-2 text-center text-[9px] font-black text-slate-400 uppercase">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">{cells}</div>
        <div className="p-6 max-w-4xl mx-auto w-full">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><ListTodo size={20}/> Tasks List</h3>
            <div className="space-y-3">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50 p-4 rounded-2xl flex items-center gap-4 border border-orange-100 shadow-sm">
                    <UserX className="text-orange-500" size={20}/>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-black text-orange-600 uppercase">Leave</p><h4 className="text-sm font-black text-slate-800">{l.type}</h4></div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm">
                    <div className="w-12 text-[10px] font-black text-slate-400 text-center">{e.startTime}</div>
                    <div className="flex-1 min-w-0"><p className="text-[9px] font-black text-blue-600 uppercase">#{e.jobNo}</p><h4 className="text-sm font-black text-slate-800 truncate">{e.jobName}</h4></div>
                    <button onClick={() => openModal(e)} className="p-2 text-slate-300"><Edit3 size={16}/></button>
                  </div>
                ))}
            </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [...Array(7)].map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });

    return (
      <div className="flex flex-col w-full bg-slate-50 pb-32 animate-in slide-in-from-right-4 duration-500">
        <HeaderStatus />
        <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
            {weekDays.map(d => {
                const k = getDateKey(d);
                const isSelected = k === currentDateKey;
                const entries = allEntries[k] || [];
                const leaves = leaveEntries[k] || [];
                return (
                  <div key={k} onClick={() => setCurrentDate(d)} className={`bg-white rounded-3xl p-5 border-2 transition-all ${isSelected ? 'border-blue-500 shadow-xl' : 'border-white shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>{d.getDate()}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                        {metadata[k]?.location && <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{metadata[k].location}</span>}
                    </div>
                    <div className="space-y-2">
                        {leaves.map(l => <div key={l.id} className="text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-2 rounded-xl flex items-center gap-2"><UserX size={12}/> {l.type}</div>)}
                        {entries.map(e => <div key={e.id} className="text-[9px] font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between"><span>{e.startTime} - {e.jobName}</span><span className="text-blue-500">#{e.jobNo}</span></div>)}
                        {entries.length === 0 && leaves.length === 0 && <div className="text-center py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic opacity-40">No records</div>}
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="flex flex-col w-full bg-white pb-32 animate-in fade-in duration-500">
        <HeaderStatus />
        <div className="max-w-lg mx-auto w-full p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Day Focus</h2>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{totalLoggedHours.toFixed(1)} Hours logged</div>
            </div>
            <div className="space-y-4">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50 p-6 rounded-[35px] border border-orange-100 flex items-start gap-4 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><UserX size={60} /></div>
                     <UserX className="text-orange-500 mt-1" size={24} />
                     <div className="flex-1">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Leave status</span>
                        <h4 className="text-lg font-black text-slate-800 leading-tight mt-1">{l.type}</h4>
                        <p className="text-xs text-orange-400 font-bold mt-2">{l.startTime} - {l.endTime}</p>
                     </div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-start gap-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                     <div className="w-16 flex flex-col items-center justify-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-xs font-black text-slate-800">{e.startTime}</span>
                        <div className="h-4 w-px bg-slate-200 my-1"></div>
                        <span className="text-xs font-black text-slate-400">{e.endTime}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">JOB {e.jobNo}</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1 truncate">{e.jobName}</h4>
                        <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">{e.detail || 'Working on primary deliverables'}</p>
                     </div>
                     <div className="flex flex-col gap-2">
                        <button onClick={() => openModal(e)} className="p-2 text-slate-300 hover:text-blue-500"><Edit3 size={18}/></button>
                     </div>
                  </div>
                ))}
                {currentDayEntries.length === 0 && currentDayLeaves.length === 0 && (
                  <div className="py-20 text-center opacity-30 italic"><CalendarDays className="mx-auto mb-4" size={48} /><p className="text-sm font-bold uppercase">No tasks for this day</p></div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-all selection:bg-blue-100 overflow-x-hidden">
      {/* iOS Style Top Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200 px-6 h-[60px] sm:h-[64px] flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white rotate-6 shadow-lg"><Clock size={18} /></div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase text-slate-900">TimeFlow</h1>
        </div>
        <div className="flex items-center gap-2">
             <button onClick={() => setIsLeaveModalOpen(true)} className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100"><UserX size={20}/></button>
             <button onClick={() => setIsProjectManageOpen(!isProjectManageOpen)} className="p-2.5 rounded-2xl bg-slate-100 text-slate-500"><Settings size={20}/></button>
             <button onClick={() => openModal()} className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100"><Plus size={20}/></button>
        </div>
      </header>

      <main className="pt-[60px] sm:pt-[64px] min-h-screen">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'project' && (
          <div className="p-10 max-w-2xl mx-auto pb-40">
             <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center gap-3"><FolderKanban /> Project Registry</h2>
             <div className="grid gap-3">
                {jobDatabase.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Hash size={18}/></div><div><h4 className="text-sm font-black text-slate-800">{p.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase">ID: {p.id}</p></div></div>
                     <button className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* iPhone Style Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-white/80 backdrop-blur-3xl border-t border-slate-200/50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-4">
              {[
                { id: 'month', icon: CalendarIcon, label: 'ปฏิทิน' },
                { id: 'week', icon: Layout, label: 'สัปดาห์' },
                { id: 'day', icon: Columns, label: 'รายวัน' },
                { id: 'project', icon: FolderKanban, label: 'โปรเจกต์' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)} className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${viewMode === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    <tab.icon size={22} strokeWidth={viewMode === tab.id ? 2.5 : 2} className={viewMode === tab.id ? 'scale-110' : ''}/>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${viewMode === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                </button>
              ))}
          </div>
      </nav>

      {/* iPhone Style Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh]">
              <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>
              <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-8">
                <div className="flex items-center gap-3"><Plus className="text-blue-600" size={20}/><h2 className="text-xs font-black uppercase tracking-widest">Activity Detail</h2></div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
                 <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setIsMultiDateMode(false)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${!isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Single Day</button>
                    <button onClick={() => setIsMultiDateMode(true)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Multi-Day</button>
                 </div>

                 <div className="space-y-6">
                    {isMultiDateMode ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-7 gap-1 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                {[...Array(31)].map((_, i) => {
                                    const dK = `2026-03-${(i+1).toString().padStart(2, '0')}`;
                                    const isSel = !!multiDateConfigs[dK];
                                    return <button key={i} onClick={() => toggleRepeatDate(dK)} className={`w-7 h-7 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${isSel ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'}`}>{i+1}</button>
                                })}
                            </div>
                            <div className="space-y-2">
                                {Object.entries(multiDateConfigs).sort().map(([dk, c]) => (
                                    <div key={dk} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4">
                                        <div className="flex justify-between items-center mb-3 text-[10px] font-black text-slate-500 uppercase">{new Date(dk).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="time" value={c.startTime} onChange={(e) => updateMultiTime(dk, 'startTime', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-blue-500"/>
                                            <input type="time" value={c.endTime} onChange={(e) => updateMultiTime(dk, 'endTime', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-blue-500"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Date</label><input type="date" value={newTask.date} onChange={(e) => setNewTask({...newTask, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white outline-none"/></div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        <div className="relative space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Project Code</label><div className="relative"><input type="text" value={newTask.jobNo} onChange={(e) => setNewTask({...newTask, jobNo: e.target.value})} placeholder="69XXX" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white outline-none pr-10 shadow-inner"/><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/></div>
                            {suggestions.length > 0 && (<div className="absolute z-[600] w-full bg-white border border-slate-200 rounded-2xl mt-1 shadow-2xl max-h-40 overflow-y-auto">{suggestions.map((job, idx) => (<button key={idx} onClick={() => selectJob(job)} className="w-full text-left px-5 py-3 text-[10px] hover:bg-blue-50 border-b last:border-0 font-black flex justify-between"><span className="text-blue-600">{job.id}</span><span className="text-slate-400">{job.name}</span></button>))}</div>)}
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Activity Name</label><input type="text" value={newTask.jobName} onChange={(e) => setNewTask({...newTask, jobName: e.target.value})} placeholder="Task title..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none shadow-inner focus:bg-white"/></div>
                    </div>

                    {!isMultiDateMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><LogIn size={12} className="text-emerald-500"/> Start At</label><input type="time" value={newTask.startTime} onChange={(e) => setNewTask({...newTask, startTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-emerald-500"/></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1"><LogOut size={12} className="text-rose-500"/> End At</label><input type="time" value={newTask.endTime} onChange={(e) => setNewTask({...newTask, endTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-rose-500"/></div>
                        </div>
                    )}

                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notes</label><textarea value={newTask.detail} onChange={(e) => setNewTask({...newTask, detail: e.target.value})} rows="3" placeholder="Additional details..." className="w-full bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-4 text-sm font-bold outline-none resize-none focus:bg-white"></textarea></div>

                    <button onClick={handleSaveTask} className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all">Save Activity</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Sheet */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-[280px] rounded-[30px] shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center space-y-4">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{confirmDialog.title}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{confirmDialog.message}</p>
              </div>
              <div className="flex border-t border-slate-100 bg-white">
                  <button onClick={closeConfirm} className="flex-1 py-4 text-[13px] font-bold text-blue-600 active:bg-slate-50 border-r border-slate-100 uppercase tracking-widest">ยกเลิก</button>
                  <button onClick={confirmDialog.onConfirm} className={`flex-1 py-4 text-[13px] font-black active:bg-slate-50 uppercase tracking-widest ${confirmDialog.type === 'delete' ? 'text-rose-600' : 'text-blue-600'}`}>ตกลง</button>
              </div>
           </div>
        </div>
      )}

      {/* Leave Sheet */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[32px] shadow-2xl p-8 pb-12 animate-in slide-in-from-bottom duration-300">
              <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
              <div className="flex justify-between items-center mb-8"><h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">ยื่นใบลา</h2><button onClick={() => setIsLeaveModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button></div>
              <div className="space-y-6">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">ประเภทการลา</label><select value={newLeave.type} onChange={(e) => setNewLeave({...newLeave, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none">{['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาบวช', 'ลาคลอด', 'อื่นๆ'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl"><input type="checkbox" id="f-day" checked={newLeave.isFullDay} onChange={(e) => setNewLeave({...newLeave, isFullDay: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-orange-500"/><label htmlFor="f-day" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">ลาทั้งวัน (Full Day)</label></div>
                 <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">จาก</label><input type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none"/></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">ถึง</label><input type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none"/></div></div>
                 <button onClick={handleSaveLeave} className="w-full py-5 bg-orange-600 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl shadow-orange-100 active:scale-95 transition-all">ส่งคำขอยื่นลา</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
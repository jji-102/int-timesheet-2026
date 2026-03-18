import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, CheckCircle2, 
  X, Save, Edit3, ChevronDown, CalendarDays, Trash2, 
  LogIn, LogOut, Search, ShieldCheck, RefreshCcw,
  ArrowRight, Calendar as CalendarIcon,
  Hash, FolderKanban, ListTodo, PlusCircle, LayoutList, Copy, Repeat, Check, AlertCircle, CalendarRange,
  Columns, Layout, MapPin, UserX, Info, Home, Building2, Globe, MoreHorizontal
} from 'lucide-react';

const App = () => {
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('task'); // 'task' or 'leave'
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [editingId, setEditingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 9));
  const [isMultiDateMode, setIsMultiDateMode] = useState(false);
  const [multiDateConfigs, setMultiDateConfigs] = useState({}); 

  // ฐานข้อมูลโครงการ
  const [jobDatabase] = useState([
    { id: '69001', name: 'Mobile Banking Redesign' },
    { id: '69002', name: 'AI Integration Phase 1' },
    { id: '69003', name: 'E-Commerce Platform' },
    { id: '69065', name: 'Sanitary napkins Tracking Survey' }
  ]);

  // Mockup Data Generator (เฉพาะวันจันทร์-ศุกร์)
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
      
      metadata[dateKey] = { location: day % 3 === 0 ? 'ทำงานที่ออฟฟิศ' : day % 3 === 1 ? 'ทำงานที่บ้าน' : 'ทำงานนอกสถานที่' };

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
  const [dayMetadata, setDayMetadata] = useState(initialData.metadata);

  const [newTask, setNewTask] = useState({
    date: '2026-03-09', jobNo: '', jobName: '', startTime: '09:00', endTime: '18:00', detail: ''
  });

  const [newLeave, setNewLeave] = useState({
    startDate: '2026-03-09', endDate: '2026-03-09', type: 'ลาพักร้อน', detail: '', isFullDay: true
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
  const currentLocation = useMemo(() => dayMetadata[currentDateKey]?.location || 'ทำงานที่ออฟฟิศ', [dayMetadata, currentDateKey]);

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
    setDayMetadata(prev => ({ ...prev, [currentDateKey]: { ...prev[currentDateKey], location } }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return { h: 0, m: 0 };
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    return { h: Math.floor(Math.max(0, totalMinutes) / 60), m: Math.max(0, totalMinutes) % 60 };
  };

  // --- Core Operations ---
  const handleSaveEntry = () => {
    if (entryType === 'task') {
      if (!newTask.jobNo) return;
      setAllEntries(prev => {
        const newState = { ...prev };
        if (isMultiDateMode) {
          Object.entries(multiDateConfigs).forEach(([dKey, config]) => {
            const dur = calculateDuration(config.startTime, config.endTime);
            newState[dKey] = [...(newState[dKey] || []), { ...newTask, date: dKey, startTime: config.startTime, endTime: config.endTime, hours: dur.h, minutes: dur.m, id: Date.now() + Math.random() }].sort((a,b) => a.startTime.localeCompare(b.startTime));
          });
        } else {
          const dur = calculateDuration(newTask.startTime, newTask.endTime);
          const entryData = { ...newTask, hours: dur.h, minutes: dur.m, id: editingId || Date.now() };
          const targetKey = newTask.date;
          if (editingId) {
            Object.keys(newState).forEach(k => { newState[k] = newState[k].filter(e => e.id !== editingId); });
          }
          newState[targetKey] = [...(newState[targetKey] || []), entryData].sort((a,b) => a.startTime.localeCompare(b.startTime));
        }
        return newState;
      });
    } else {
      const start = new Date(newLeave.startDate);
      const end = new Date(newLeave.endDate);
      const newLeaves = { ...leaveEntries };
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dKey = getDateKey(d);
        newLeaves[dKey] = [...(newLeaves[dKey] || []), { ...newLeave, id: Date.now() + Math.random(), date: dKey, startTime: '09:00', endTime: '18:00' }];
        if (newLeave.isFullDay) setAllEntries(prev => ({ ...prev, [dKey]: [] }));
      }
      setLeaveEntries(newLeaves);
    }
    setIsModalOpen(false);
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
    setEntryType('task');
    setIsMultiDateMode(false);
    
    if (entry) {
      setEditingId(entry.id);
      setNewTask({ ...entry });
    } else {
      setEditingId(null);
      setNewTask({ date: targetDateKey, jobNo: '', jobName: '', startTime: '09:00', endTime: '18:00', detail: '' });
      setMultiDateConfigs({ [targetDateKey]: { startTime: '09:00', endTime: '18:00' } });
      setNewLeave({ startDate: targetDateKey, endDate: targetDateKey, type: 'ลาพักร้อน', detail: '', isFullDay: true });
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

  const updateMultiTime = (dKey, field, value) => {
    setMultiDateConfigs(prev => ({ ...prev, [dKey]: { ...prev[dKey], [field]: value } }));
  };

  // --- Views ---

  const ActiveHeaderBar = () => (
    <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-4 py-3 sticky top-[56px] sm:top-[64px] z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Date Navigator */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl w-full sm:w-auto">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                  else d.setDate(d.getDate() - 1);
                  setCurrentDate(d);
                }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronLeft size={18}/></button>
                <div className="flex-1 px-4 text-center cursor-pointer font-black text-xs text-slate-800 uppercase tracking-tight" onClick={() => setCurrentDate(new Date())}>
                    {currentDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric', day: viewMode !== 'month' ? 'numeric' : undefined })}
                </div>
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                  else d.setDate(d.getDate() + 1);
                  setCurrentDate(d);
                }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronRight size={18}/></button>
            </div>

            {/* Workplace Selector - iPhone Style */}
            <div className="flex bg-slate-200/50 p-1 rounded-[16px] w-full sm:w-auto sm:min-w-[300px] shadow-inner">
                {[
                  { id: 'ทำงานที่ออฟฟิศ', icon: Building2, label: 'OFFICE' },
                  { id: 'ทำงานที่บ้าน', icon: Home, label: 'HOME' },
                  { id: 'ทำงานนอกสถานที่', icon: Globe, label: 'FIELD' }
                ].map(loc => (
                  <button 
                    key={loc.id}
                    onClick={() => updateLocation(loc.id)}
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${currentLocation === loc.id ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400'}`}
                  >
                    <loc.icon size={14} className="mb-0.5" />
                    <span className="text-[7px] font-black tracking-tighter uppercase">{loc.label}</span>
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

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="bg-slate-50/5 border-r border-b border-slate-100 min-h-[85px]"></div>);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = getDateKey(date);
      const entries = allEntries[key] || [];
      const leaves = leaveEntries[key] || [];
      const isSelected = key === currentDateKey;
      const isToday = new Date().toDateString() === date.toDateString();

      cells.push(
        <div key={d} onClick={() => setCurrentDate(date)} onDoubleClick={() => openModal(null, date)}
          className={`group flex flex-col min-h-[85px] sm:min-h-[110px] border-r border-b border-slate-100 p-1 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-200' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white shadow-sm' : isSelected ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{d}</span>
          </div>
          <div className="flex-1 space-y-0.5 mt-1 overflow-hidden">
            {leaves.map((l, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-orange-100 text-orange-600 border border-orange-200 leading-none">L: {l.type}</div>)}
            {entries.slice(0, 2).map((e, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-blue-50 text-blue-700 border-blue-100 leading-none">{e.jobName}</div>)}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full bg-white pb-32 animate-in fade-in duration-300">
        <ActiveHeaderBar />
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 sticky top-[120px] sm:top-[128px] z-20 shadow-sm">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-2 text-center text-[9px] font-black text-slate-400 uppercase">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr border-l border-slate-50">{cells}</div>
        
        <div className="p-6 max-w-2xl mx-auto w-full border-t border-slate-50">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ListTodo size={16}/> {currentDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}</h3>
            </div>
            <div className="space-y-3">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50/50 p-4 rounded-3xl flex items-center gap-4 border border-orange-100 shadow-sm">
                    <UserX className="text-orange-500" size={20}/>
                    <div className="flex-1 min-w-0"><h4 className="text-sm font-black text-slate-800">{l.type}</h4><p className="text-[10px] text-orange-400 font-bold uppercase">{l.startTime} - {l.endTime}</p></div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} onClick={() => openModal(e)} className="bg-white p-4 rounded-3xl flex items-center gap-4 border border-slate-100 shadow-sm active:scale-[0.98] transition-all">
                    <div className="w-10 text-[10px] font-black text-slate-400 text-center">{e.startTime}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-blue-500 uppercase mb-0.5">#{e.jobNo}</p>
                        <h4 className="text-sm font-black text-slate-800 truncate">{e.jobName}</h4>
                    </div>
                    <ChevronRight size={16} className="text-slate-200" />
                  </div>
                ))}
                {currentDayEntries.length === 0 && currentDayLeaves.length === 0 && (
                   <div className="py-16 text-center text-slate-300 font-bold text-xs italic uppercase tracking-widest">No Activity Records</div>
                )}
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
      <div className="flex flex-col w-full bg-slate-50 min-h-screen pb-32 animate-in slide-in-from-right-4 duration-500">
        <ActiveHeaderBar />
        <div className="px-4 py-6 space-y-3 max-w-md mx-auto w-full">
            {weekDays.map(d => {
                const k = getDateKey(d);
                const isSelected = k === currentDateKey;
                const entries = allEntries[k] || [];
                const leaves = leaveEntries[k] || [];
                return (
                  <div key={k} onClick={() => setCurrentDate(d)} className={`bg-white rounded-[32px] p-4 border-2 transition-all ${isSelected ? 'border-blue-500 shadow-xl scale-[1.02]' : 'border-white shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>{d.getDate()}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full uppercase">{dayMetadata[k]?.location || 'N/A'}</span>
                    </div>
                    <div className="space-y-1.5">
                        {leaves.map(l => <div key={l.id} className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-2 rounded-2xl border border-orange-100 flex items-center gap-2"><UserX size={12}/> {l.type}</div>)}
                        {entries.map(e => <div key={e.id} className="text-[10px] font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl flex justify-between items-center shadow-inner"><span>{e.startTime} • {e.jobName}</span><span className="text-blue-500 font-bold shrink-0 ml-2">#{e.jobNo}</span></div>)}
                        {entries.length === 0 && leaves.length === 0 && <div className="text-center py-2 text-[10px] font-bold text-slate-200 uppercase tracking-widest italic">No Data</div>}
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="flex flex-col w-full bg-white min-h-screen pb-32 animate-in fade-in duration-500">
        <ActiveHeaderBar />
        <div className="max-w-lg mx-auto w-full p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Day Focus</h2>
                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg shadow-blue-100">Timeline Mode</div>
            </div>
            <div className="space-y-4">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50 p-6 rounded-[30px] border border-orange-100 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><UserX size={64} /></div>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><UserX size={24} /></div>
                        <div><span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Leave Event</span><h4 className="text-lg font-black text-slate-800 leading-tight mt-1">{l.type}</h4></div>
                     </div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} onClick={() => openModal(e)} className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-start gap-5 shadow-sm active:bg-slate-50 transition-all group">
                     <div className="flex flex-col items-center justify-center bg-slate-50 w-14 py-4 rounded-2xl shrink-0 border border-slate-100">
                        <span className="text-xs font-black text-slate-800">{e.startTime}</span>
                        <div className="h-3 w-px bg-slate-200 my-1"></div>
                        <span className="text-xs font-black text-slate-400">{e.endTime}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">#{e.jobNo}</span>
                        <h4 className="text-lg font-black text-slate-800 mt-0.5 truncate">{e.jobName}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed italic">{e.detail || 'Working on primary tasks'}</p>
                     </div>
                  </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-all selection:bg-blue-100 overflow-x-hidden">
      {/* iOS Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200 px-6 h-[56px] sm:h-[64px] flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white rotate-3 shadow-lg"><Clock size={18} /></div>
            <h1 className="text-base font-black italic tracking-tighter uppercase text-slate-900">TimeFlow</h1>
        </div>
        <button onClick={() => openModal()} className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 flex items-center justify-center active:scale-90 transition-all"><Plus size={24}/></button>
      </header>

      <main className="pt-[56px] sm:pt-[64px] min-h-screen">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </main>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-white/80 backdrop-blur-3xl border-t border-slate-200/50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-4">
              {[
                { id: 'month', icon: CalendarIcon, label: 'Month' },
                { id: 'week', icon: Layout, label: 'Week' },
                { id: 'day', icon: Columns, label: 'Day' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)} className={`flex flex-col items-center gap-1 min-w-[75px] transition-all ${viewMode === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    <tab.icon size={22} strokeWidth={viewMode === tab.id ? 2.5 : 2} className={viewMode === tab.id ? 'scale-110' : ''}/>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${viewMode === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                </button>
              ))}
          </div>
      </nav>

      {/* Entry Detail Modal (Combined Task/Leave) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh]">
              <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>
              <div className="h-14 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm ${entryType === 'leave' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                      {entryType === 'leave' ? <UserX size={16}/> : <Edit3 size={16}/>}
                   </div>
                   <h2 className="text-xs font-black uppercase tracking-widest">{editingId ? 'Edit Record' : 'Create New Entry'}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all"><X size={18}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
                 {/* Unified Type Switcher */}
                 <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 shadow-inner">
                    <button onClick={() => setEntryType('task')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${entryType === 'task' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>ลงงาน (Task / Job)</button>
                    <button onClick={() => setEntryType('leave')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${entryType === 'leave' ? 'bg-white shadow-md text-orange-600' : 'text-slate-400'}`}>แจ้งลา (Leave)</button>
                 </div>

                 {entryType === 'task' ? (
                    <div className="space-y-6">
                        {/* Task Form Logic (Supports Multi-day) */}
                        <div className="flex bg-slate-100/50 p-1 rounded-xl mb-4">
                           <button onClick={() => setIsMultiDateMode(false)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${!isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Single Day</button>
                           <button onClick={() => setIsMultiDateMode(true)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Multi-Day</button>
                        </div>
                        
                        <div className="space-y-6">
                           {isMultiDateMode ? (
                              <div className="space-y-4">
                                 <div className="grid grid-cols-7 gap-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                    {[...Array(31)].map((_, i) => {
                                       const dK = `2026-03-${(i+1).toString().padStart(2, '0')}`;
                                       return <button key={i} onClick={() => toggleRepeatDate(dK)} className={`w-7 h-7 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${!!multiDateConfigs[dK] ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-200'}`}>{i+1}</button>
                                    })}
                                 </div>
                                 <div className="space-y-2">
                                    {Object.entries(multiDateConfigs).sort().map(([dk, c]) => (
                                       <div key={dk} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 animate-in slide-in-from-right-4">
                                          <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(dk).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                          <div className="grid grid-cols-2 gap-2 flex-1"><input type="time" value={c.startTime} onChange={e => updateMultiTime(dk, 'startTime', e.target.value)} className="bg-white border rounded-xl px-2 py-2 text-xs font-black outline-none focus:border-blue-500"/><input type="time" value={c.endTime} onChange={e => updateMultiTime(dk, 'endTime', e.target.value)} className="bg-white border rounded-xl px-2 py-2 text-xs font-black outline-none focus:border-blue-500"/></div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ) : (
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label><input type="date" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white outline-none"/></div>
                           )}
                           <div className="relative space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Project</label><div className="relative"><input type="text" value={newTask.jobNo} onChange={e => setNewTask({...newTask, jobNo: e.target.value})} placeholder="Project Code" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none pr-10 shadow-inner"/><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/></div>
                               {suggestions.length > 0 && (<div className="absolute z-[600] w-full bg-white border border-slate-200 rounded-2xl mt-1 shadow-2xl max-h-40 overflow-y-auto">{suggestions.map((job, idx) => (<button key={idx} onClick={() => selectJob(job)} className="w-full text-left px-5 py-3 text-[10px] hover:bg-blue-50 border-b last:border-0 font-black flex justify-between"><span>{job.id}</span><span className="text-slate-400">{job.name}</span></button>))}</div>)}
                           </div>
                           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Activity Name</label><input type="text" value={newTask.jobName} onChange={e => setNewTask({...newTask, jobName: e.target.value})} placeholder="What did you do?" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none shadow-inner"/></div>
                           {!isMultiDateMode && (
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Start</label><input type="time" value={newTask.startTime} onChange={e => setNewTask({...newTask, startTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-800"/></div>
                                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">End</label><input type="time" value={newTask.endTime} onChange={e => setNewTask({...newTask, endTime: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-800"/></div>
                               </div>
                           )}
                           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Notes</label><textarea value={newTask.detail} onChange={e => setNewTask({...newTask, detail: e.target.value})} rows="3" placeholder="Additional details..." className="w-full bg-slate-100/50 border border-slate-200 rounded-[28px] px-6 py-4 text-sm font-bold outline-none resize-none focus:bg-white"></textarea></div>
                           <button onClick={handleSaveEntry} className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all">Commit Task</button>
                        </div>
                    </div>
                 ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        {/* Leave Form Logic */}
                        <div className="space-y-4">
                           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">ประเภทการลา</label><select value={newLeave.type} onChange={e => setNewLeave({...newLeave, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white transition-all">{['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาบวช', 'ลาคลอด', 'อื่นๆ'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                           <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner"><input type="checkbox" id="ios-full-day" checked={newLeave.isFullDay} onChange={e => setNewLeave({...newLeave, isFullDay: e.target.checked})} className="w-6 h-6 rounded-lg text-orange-600 border-slate-300"/><label htmlFor="ios-full-day" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer">ลาทั้งวัน (Full Day Leave)</label></div>
                           <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">เริ่มวันที่</label><input type="date" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none"/></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">ถึงวันที่</label><input type="date" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none"/></div></div>
                           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">หมายเหตุการลา</label><textarea value={newLeave.detail} onChange={e => setNewLeave({...newLeave, detail: e.target.value})} placeholder="เหตุผลการลา..." rows="3" className="w-full bg-slate-100/50 border border-slate-200 rounded-[28px] px-6 py-4 text-sm font-bold outline-none resize-none focus:bg-white"></textarea></div>
                           <button onClick={handleSaveEntry} className="w-full py-5 bg-orange-600 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all">ยื่นคำขอยื่นลา</button>
                        </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Sheet */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-[280px] rounded-[32px] shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center space-y-4">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{confirmDialog.title}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed italic">"{confirmDialog.message}"</p>
              </div>
              <div className="flex border-t border-slate-100">
                  <button onClick={closeConfirm} className="flex-1 py-4 text-[13px] font-bold text-blue-600 active:bg-slate-50 border-r border-slate-100 uppercase tracking-widest">ยกเลิก</button>
                  <button onClick={confirmDialog.onConfirm} className={`flex-1 py-4 text-[13px] font-black active:bg-slate-50 uppercase tracking-widest ${confirmDialog.type === 'delete' ? 'text-rose-600' : 'text-blue-600'}`}>ตกลง</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
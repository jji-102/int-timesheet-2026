import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, CheckCircle2, 
  X, Save, Edit3, ChevronDown, CalendarDays, Trash2, 
  LogIn, LogOut, Search, ShieldCheck, RefreshCcw,
  ArrowRight, Calendar as CalendarIcon,
  Hash, FolderKanban, ListTodo, PlusCircle, LayoutList, Copy, Repeat, Check, AlertCircle, CalendarRange,
  Columns, Layout, MapPin, UserX, Info, Home, Building2, Globe, MoreHorizontal, Settings, User
} from 'lucide-react';

const App = () => {
  const [viewMode, setViewMode] = useState('month'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('task'); 
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [editingId, setEditingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 9));
  const [isMultiDateMode, setIsMultiDateMode] = useState(false);
  const [multiDateConfigs, setMultiDateConfigs] = useState({}); 

  // Mobile Detection
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('week');
    }
  }, []);

  const jobDatabase = [
    { id: '69001', name: 'Mobile Banking Redesign' },
    { id: '69002', name: 'AI Integration Phase 1' },
    { id: '69003', name: 'E-Commerce Platform' },
    { id: '69065', name: 'Sanitary napkins Tracking Survey' }
  ];

  const getLocationStyle = (loc) => {
    switch (loc) {
      case 'Office': return 'bg-blue-50 text-blue-500 border-blue-100';
      case 'Home': return 'bg-emerald-50 text-emerald-500 border-emerald-100';
      case 'Field': return 'bg-purple-50 text-purple-500 border-purple-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getLocationIcon = (loc) => {
    switch (loc) {
      case 'Office': return <Building2 size={10} />;
      case 'Home': return <Home size={10} />;
      case 'Field': return <Globe size={10} />;
      default: return <MapPin size={10} />;
    }
  };

  const getDateKey = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  // Mockup Data
  const generateInitialData = () => {
    const entries = {};
    const leaves = {};
    const meta = {};
    const jobPool = jobDatabase.slice(0, 3);

    for (let day = 1; day <= 31; day++) {
      const checkDate = new Date(2026, 2, day);
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      const dateKey = `2026-03-${day.toString().padStart(2, '0')}`;
      
      meta[dateKey] = { location: day % 3 === 0 ? 'Office' : day % 3 === 1 ? 'Home' : 'Field' };

      if (day === 2 || day === 16) {
        leaves[dateKey] = [{ id: `l-${day}`, type: 'Vacation', detail: 'Annual Leave', startTime: '09:00', endTime: '18:00', isFullDay: true }];
        entries[dateKey] = [];
        meta[dateKey].location = 'Home';
        continue;
      }
      entries[dateKey] = [
        { id: `m1-${day}`, date: dateKey, jobNo: jobPool[0].id, jobName: jobPool[0].name, startTime: '09:00', endTime: '12:00', hours: 3, minutes: 0, detail: 'Technical Sync' },
        { id: `m2-${day}`, date: dateKey, jobNo: jobPool[1].id, jobName: jobPool[1].name, startTime: '13:00', endTime: '18:00', hours: 5, minutes: 0, detail: 'Core Development' }
      ];
    }
    return { entries, leaves, meta };
  };

  const initialData = useMemo(() => generateInitialData(), []);
  const [allEntries, setAllEntries] = useState(initialData.entries);
  const [leaveEntries, setLeaveEntries] = useState(initialData.leaves);
  const [dayMetadata, setDayMetadata] = useState(initialData.meta);

  const [newTask, setNewTask] = useState({ date: '2026-03-09', jobNo: '', jobName: '', startTime: '09:00', endTime: '18:00', detail: '' });
  const [newLeave, setNewLeave] = useState({ date: '2026-03-09', type: 'Vacation', detail: '', isFullDay: true, startTime: '09:00', endTime: '18:00' });
  const [suggestions, setSuggestions] = useState([]);

  const currentDateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const currentDayEntries = useMemo(() => allEntries[currentDateKey] || [], [allEntries, currentDateKey]);
  const currentDayLeaves = useMemo(() => leaveEntries[currentDateKey] || [], [leaveEntries, currentDateKey]);
  const currentLocation = useMemo(() => dayMetadata[currentDateKey]?.location || 'Office', [dayMetadata, currentDateKey]);

  useEffect(() => {
    if (newTask.jobNo.length > 0) {
      setSuggestions(jobDatabase.filter(job => job.id.includes(newTask.jobNo)));
    } else {
      setSuggestions([]);
    }
  }, [newTask.jobNo]);

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
          if (editingId) { Object.keys(newState).forEach(k => { newState[k] = newState[k].filter(e => e.id !== editingId); }); }
          newState[targetKey] = [...(newState[targetKey] || []), entryData].sort((a,b) => a.startTime.localeCompare(b.startTime));
        }
        return newState;
      });
    } else {
      setLeaveEntries(prev => {
        const newState = { ...prev };
        const newMeta = { ...dayMetadata };
        const targetDates = isMultiDateMode ? Object.keys(multiDateConfigs) : [newLeave.date];
        targetDates.forEach(dKey => {
          newState[dKey] = [...(newState[dKey] || []), { ...newLeave, id: Date.now() + Math.random(), date: dKey, startTime: isMultiDateMode ? multiDateConfigs[dKey].startTime : newLeave.startTime, endTime: isMultiDateMode ? multiDateConfigs[dKey].endTime : newLeave.endTime }];
          if (newLeave.isFullDay) {
            setAllEntries(old => ({ ...old, [dKey]: [] }));
            newMeta[dKey] = { ...newMeta[dKey], location: 'Home' };
          }
        });
        setDayMetadata(newMeta);
        return newState;
      });
    }
    setIsModalOpen(false);
  };

  const openModal = (entry = null, date = null, type = 'task') => {
    const targetDate = date || currentDate;
    const targetDateKey = getDateKey(targetDate);
    setCurrentDate(targetDate);
    setEntryType(type);
    setIsMultiDateMode(false);
    if (entry) {
      setEditingId(entry.id);
      if (type === 'task') setNewTask({ ...entry });
      else setNewLeave({ ...entry });
    } else {
      setEditingId(null);
      setNewTask({ date: targetDateKey, jobNo: '', jobName: '', startTime: '09:00', endTime: '18:00', detail: '' });
      setNewLeave({ date: targetDateKey, type: 'Vacation', detail: '', isFullDay: true, startTime: '09:00', endTime: '18:00' });
      setMultiDateConfigs({ [targetDateKey]: { startTime: '09:00', endTime: '18:00' } });
    }
    setIsModalOpen(true);
  };

  const toggleRepeatDate = (dKey) => {
    setMultiDateConfigs(prev => {
      const n = { ...prev };
      if (n[dKey]) delete n[dKey];
      else n[dKey] = { startTime: entryType === 'task' ? newTask.startTime : newLeave.startTime, endTime: entryType === 'task' ? newTask.endTime : newLeave.endTime };
      return n;
    });
  };

  const updateMultiTime = (dKey, field, value) => {
    setMultiDateConfigs(prev => ({ ...prev, [dKey]: { ...prev[dKey], [field]: value } }));
  };

  const closeConfirm = () => setConfirmDialog({ isOpen: false, type: '', title: '', message: '', onConfirm: null });

  // --- Frozen Header Components ---

  const MainHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200 px-6 h-[56px] flex justify-between items-center">
      <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white rotate-3 shadow-lg"><Clock size={18} /></div>
          <h1 className="text-sm font-black italic tracking-tighter uppercase text-slate-900 select-none">TimeFlow</h1>
      </div>
      <button onClick={() => openModal()} className="w-9 h-9 rounded-full bg-blue-600 text-white shadow-lg active:scale-90 transition-all flex items-center justify-center"><Plus size={20}/></button>
    </header>
  );

  const ActiveHeaderBar = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const locale = 'en-US';

    return (
      <div className="bg-white/90 backdrop-blur-3xl border-b border-slate-200 px-4 py-2 fixed top-[56px] left-0 right-0 z-[90] shadow-sm">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl w-full sm:w-auto shadow-inner border border-slate-200/50">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                    else d.setDate(d.getDate() - 1);
                    setCurrentDate(d);
                  }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronLeft size={16}/></button>
                  <div className="flex-1 px-3 text-center cursor-pointer font-black text-[10px] text-slate-800 uppercase tracking-tighter whitespace-nowrap min-w-[150px]" onClick={() => setCurrentDate(new Date())}>
                      {viewMode === 'week' ? (
                          `${weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
                      ) : (
                          currentDate.toLocaleDateString(locale, { month: 'short', year: 'numeric', day: viewMode === 'day' ? 'numeric' : undefined })
                      )}
                  </div>
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                    else d.setDate(d.getDate() + 1);
                    setCurrentDate(d);
                  }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronRight size={16}/></button>
              </div>

              <div className="flex bg-slate-200/50 p-1 rounded-[14px] w-full sm:w-auto sm:min-w-[280px]">
                  {[
                    { id: 'Office', icon: Building2, label: 'Office' },
                    { id: 'Home', icon: Home, label: 'Home' },
                    { id: 'Field', icon: Globe, label: 'Field' }
                  ].map(loc => (
                    <button 
                      key={loc.id}
                      onClick={() => updateLocation(loc.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${currentLocation === loc.id ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-400 font-bold'}`}
                    >
                      <loc.icon size={11} />
                      <span className="text-[8px] uppercase tracking-tighter">{loc.label}</span>
                    </button>
                  ))}
              </div>
          </div>
      </div>
    );
  };

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
      const meta = dayMetadata[key];

      cells.push(
        <div key={d} onClick={() => setCurrentDate(date)} onDoubleClick={() => openModal(null, date)}
          className={`group relative flex flex-col min-h-[85px] sm:min-h-[100px] border-r border-b border-slate-100 p-1 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 ring-2 ring-inset ring-blue-100 z-10' : 'bg-white hover:bg-slate-50/50'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white shadow-sm' : isSelected ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{d}</span>
            {meta && <div className="text-slate-200 mt-0.5">{getLocationIcon(meta.location)}</div>}
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {leaves.map((l, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-orange-100 text-orange-600 leading-none shadow-sm">L: {l.type}</div>)}
            {entries.slice(0, 2).map((e, i) => <div key={i} className="text-[7px] px-1 py-0.5 rounded truncate font-black bg-blue-50 text-blue-700 border border-blue-100 leading-none shadow-sm">{e.jobName}</div>)}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full bg-white pb-32 animate-in fade-in duration-300">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 sticky top-[104px] sm:top-[112px] z-30 shadow-sm">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="py-2 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr border-l border-slate-50">{cells}</div>
        
        <div className="p-6 pb-40 max-w-2xl mx-auto w-full border-t border-slate-50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Activities List</h3>
            <div className="space-y-2">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50/50 p-4 rounded-3xl flex items-center gap-4 border border-orange-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm"><UserX size={20}/></div>
                    <div className="flex-1"><h4 className="text-sm font-black text-slate-800">{l.type}</h4><p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{l.startTime} - {l.endTime}</p></div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} onClick={() => openModal(e)} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-slate-100 shadow-sm active:scale-[0.98] transition-all">
                    <div className="w-10 text-[10px] font-black text-slate-400 text-center">{e.startTime}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-blue-500 uppercase mb-0.5">#{e.jobNo}</p>
                        <h4 className="text-sm font-black text-slate-800 truncate">{e.jobName}</h4>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                  </div>
                ))}
                {!currentDayEntries.length && !currentDayLeaves.length && <div className="py-12 text-center text-slate-300 font-bold text-xs italic uppercase">No entries</div>}
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
      <div className="flex flex-col w-full bg-slate-50 min-h-screen pb-40 animate-in fade-in duration-500">
        <div className="px-4 py-4 space-y-3 max-w-md mx-auto w-full">
            {weekDays.map(d => {
                const k = getDateKey(d);
                const isSelected = k === currentDateKey;
                const entries = allEntries[k] || [];
                const leaves = leaveEntries[k] || [];
                const loc = dayMetadata[k]?.location;
                return (
                  <div key={k} onClick={() => setCurrentDate(d)} onDoubleClick={() => openModal(null, d)}
                       className={`bg-white rounded-[28px] p-4 border-2 transition-all active:scale-[0.98] w-full ${isSelected ? 'border-blue-500 shadow-xl' : 'border-transparent shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>{d.getDate()}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                        {loc && <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase ${getLocationStyle(loc)}`}>{getLocationIcon(loc)} {loc}</div>}
                    </div>
                    <div className="space-y-1">
                        {leaves.map(l => <div key={l.id} className="text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 flex items-center gap-2 shadow-sm"><UserX size={12}/> {l.type}</div>)}
                        {entries.map(e => <div key={e.id} className="text-[9px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl flex justify-between border border-slate-100"><span>{e.startTime} • {e.jobName}</span><span className="text-blue-400 font-bold shrink-0 ml-2">#{e.jobNo}</span></div>)}
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div className="flex flex-col w-full bg-white min-h-screen pb-40 animate-in fade-in duration-500">
        <div className="max-w-lg mx-auto w-full p-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Timeline</h2>
                <button onClick={() => openModal()} className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-all"><Plus size={20}/></button>
            </div>
            <div className="space-y-4">
                {currentDayLeaves.map(l => (
                  <div key={l.id} className="bg-orange-50/50 p-6 rounded-[30px] border border-orange-100 flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><UserX size={24} /></div>
                     <div><span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Leave Event</span><h4 className="text-lg font-black text-slate-800 leading-tight mt-1">{l.type}</h4></div>
                  </div>
                ))}
                {currentDayEntries.map(e => (
                  <div key={e.id} onClick={() => openModal(e)} className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-start gap-5 shadow-sm active:bg-slate-50 transition-all group">
                     <div className="flex flex-col items-center justify-center bg-slate-50 w-14 py-4 rounded-2xl shrink-0 border border-slate-100 shadow-inner">
                        <span className="text-xs font-black text-slate-800 leading-none">{e.startTime}</span>
                        <div className="h-3 w-px bg-slate-200 my-1"></div>
                        <span className="text-xs font-black text-slate-400 leading-none">{e.endTime}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">#{e.jobNo}</span>
                        <h4 className="text-lg font-black text-slate-800 mt-0.5 truncate">{e.jobName}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed italic">{e.detail}</p>
                     </div>
                  </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-x-hidden">
      <MainHeader />
      <ActiveHeaderBar />

      <div className="pt-[138px] sm:pt-[132px]">
          <main className="min-h-screen">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </main>
      </div>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-white/90 backdrop-blur-3xl border-t border-slate-200 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-2">
              {[
                { id: 'month', icon: CalendarIcon, label: 'Month' },
                { id: 'week', icon: Layout, label: 'Week' },
                { id: 'day', icon: Columns, label: 'Day' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)} className={`flex flex-col items-center gap-1 min-w-[70px] transition-all ${viewMode === tab.id ? 'text-blue-600 scale-105' : 'text-slate-400 opacity-60'}`}>
                    <tab.icon size={22} strokeWidth={viewMode === tab.id ? 2.5 : 2}/>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${viewMode === tab.id ? 'opacity-100' : ''}`}>{tab.label}</span>
                </button>
              ))}
          </div>
      </nav>

      {/* Unified Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[92vh]">
              <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>
              <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3 text-blue-600">
                   {entryType === 'leave' ? <UserX size={18}/> : <Plus size={18}/>}
                   <h2 className="text-xs font-black uppercase tracking-widest">{editingId ? 'Edit Record' : 'Quick Entry'}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition-all"><X size={18}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto scrollbar-thin">
                 {/* Segmented Switcher */}
                 <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
                    <button onClick={() => setEntryType('task')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${entryType === 'task' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Task</button>
                    <button onClick={() => setEntryType('leave')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${entryType === 'leave' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Leave</button>
                 </div>

                 {/* Shared Multi-date Toggle */}
                 <div className="flex bg-slate-100/50 p-1 rounded-xl mb-6 shadow-inner">
                    <button onClick={() => setIsMultiDateMode(false)} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg ${!isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Single</button>
                    <button onClick={() => setIsMultiDateMode(true)} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg ${isMultiDateMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Multi</button>
                 </div>

                 <div className="space-y-6 pb-12">
                    {isMultiDateMode ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-7 gap-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                {[...Array(31)].map((_, i) => {
                                    const dK = `2026-03-${(i+1).toString().padStart(2, '0')}`;
                                    return <button key={i} onClick={() => toggleRepeatDate(dK)} className={`w-7 h-7 rounded-xl text-[9px] font-black flex items-center justify-center transition-all ${!!multiDateConfigs[dK] ? 'bg-blue-600 text-white shadow-sm scale-110' : 'text-slate-300 hover:bg-slate-200'}`}>{i+1}</button>
                                })}
                            </div>
                            <div className="space-y-2">
                                {Object.entries(multiDateConfigs).sort().map(([dk, c]) => (
                                    <div key={dk} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm animate-in slide-in-from-right-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">{new Date(dk).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                        {!(entryType === 'leave' && newLeave.isFullDay) && (
                                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border">
                                              <input type="time" value={c.startTime} onChange={e => updateMultiTime(dk, 'startTime', e.target.value)} className="w-16 bg-transparent text-[11px] font-black outline-none"/>
                                              <span className="text-slate-300 text-[10px]">→</span>
                                              <input type="time" value={c.endTime} onChange={e => updateMultiTime(dk, 'endTime', e.target.value)} className="w-16 bg-transparent text-[11px] font-black outline-none"/>
                                          </div>
                                        )}
                                        {(entryType === 'leave' && newLeave.isFullDay) && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded">FULL DAY</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest leading-none">Target Date</label><input type="date" value={entryType === 'task' ? newTask.date : newLeave.date} onChange={e => entryType === 'task' ? setNewTask({...newTask, date: e.target.value}) : setNewLeave({...newLeave, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:bg-white outline-none"/></div>
                    )}
                    
                    {entryType === 'task' ? (
                        <div className="space-y-5">
                            <div className="relative space-y-1"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest leading-none">Project ID</label><div className="relative"><input type="text" value={newTask.jobNo} onChange={e => setNewTask({...newTask, jobNo: e.target.value})} placeholder="69XXX" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none pr-10 shadow-inner"/><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/></div>
                                {suggestions.length > 0 && (<div className="absolute z-[600] w-full bg-white border border-slate-200 rounded-2xl mt-1 shadow-xl max-h-40 overflow-y-auto">{suggestions.map((job, idx) => (<button key={idx} onClick={() => selectJob(job)} className="w-full text-left px-5 py-2.5 text-[10px] hover:bg-blue-50 border-b last:border-0 font-black flex justify-between"><span>{job.id}</span><span className="text-slate-400">{job.name}</span></button>))}</div>)}
                            </div>
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest leading-none">Activity</label><input type="text" value={newTask.jobName} onChange={e => setNewTask({...newTask, jobName: e.target.value})} placeholder="Description" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none shadow-inner"/></div>
                            
                            {!isMultiDateMode && (
                                <div className="flex items-center gap-3 justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                    <div className="flex-1 flex flex-col items-center">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Start</label>
                                        <input type="time" value={newTask.startTime} onChange={e => setNewTask({...newTask, startTime: e.target.value})} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-base font-black text-slate-800 focus:border-blue-500 outline-none w-full text-center"/>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 mt-5" />
                                    <div className="flex-1 flex flex-col items-center">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1">End</label>
                                        <input type="time" value={newTask.endTime} onChange={e => setNewTask({...newTask, endTime: e.target.value})} className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-base font-black text-slate-800 focus:border-blue-500 outline-none w-full text-center"/>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Notes</label><textarea value={newTask.detail} onChange={e => setNewTask({...newTask, detail: e.target.value})} rows="2" className="w-full bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-3 text-sm font-bold outline-none resize-none focus:bg-white transition-all shadow-inner"></textarea></div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest leading-none">Leave Type</label><select value={newLeave.type} onChange={e => setNewLeave({...newLeave, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none shadow-inner">{['Vacation', 'Sick Leave', 'Personal Leave', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner"><input type="checkbox" id="ios-fday" checked={newLeave.isFullDay} onChange={e => setNewLeave({...newLeave, isFullDay: e.target.checked})} className="w-6 h-6 rounded-lg text-orange-600 border-slate-300"/><label htmlFor="ios-fday" className="text-xs font-black text-slate-700 uppercase cursor-pointer">Full Day Leave</label></div>
                            
                            {!isMultiDateMode && !newLeave.isFullDay && (
                                <div className="flex items-center gap-3 justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                    <div className="flex-1 flex flex-col items-center">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Start</label>
                                        <input type="time" value={newLeave.startTime} onChange={e => setNewLeave({...newLeave, startTime: e.target.value})} className="bg-white border-2 border-orange-200 rounded-xl px-4 py-2 text-base font-black text-slate-800 outline-none w-full text-center"/>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 mt-5" />
                                    <div className="flex-1 flex flex-col items-center">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-1">End</label>
                                        <input type="time" value={newLeave.endTime} onChange={e => setNewLeave({...newLeave, endTime: e.target.value})} className="bg-white border-2 border-orange-200 rounded-xl px-4 py-2 text-base font-black text-slate-800 outline-none w-full text-center"/>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest leading-none">Reason</label><textarea value={newLeave.detail} onChange={e => setNewLeave({...newLeave, detail: e.target.value})} rows="2" className="w-full bg-slate-100/50 border border-slate-200 rounded-[24px] px-5 py-3 text-sm font-bold outline-none resize-none focus:bg-white shadow-inner"></textarea></div>
                        </div>
                    )}
                    <button onClick={handleSaveEntry} className={`w-full py-4.5 text-white rounded-[24px] text-[11px] font-black uppercase shadow-xl active:scale-95 transition-all ${entryType === 'task' ? 'bg-blue-600 shadow-blue-100' : 'bg-orange-600 shadow-orange-100'}`}>Save Record</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-[280px] rounded-[30px] shadow-2xl overflow-hidden border border-white/50">
              <div className="p-8 text-center space-y-4"><h3 className="text-lg font-black text-slate-900 leading-tight">{confirmDialog.title}</h3><p className="text-xs font-medium text-slate-500 italic">"{confirmDialog.message}"</p></div>
              <div className="flex border-t border-slate-100 bg-white">
                  <button onClick={closeConfirm} className="flex-1 py-4 text-[13px] font-bold text-blue-600 active:bg-slate-50 border-r border-slate-100 uppercase tracking-widest">Cancel</button>
                  <button onClick={confirmDialog.onConfirm} className={`flex-1 py-4 text-[13px] font-black active:bg-slate-50 uppercase tracking-widest ${confirmDialog.type === 'delete' ? 'text-rose-600' : 'text-blue-600'}`}>Confirm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
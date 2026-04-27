
import { useState, useMemo } from "react";

const COURSES = [
  { id: "icap_arch", name: "ICAP建築", weeks: 5, navisWeeks: [4, 5] },
  { id: "icap_elec", name: "ICAP電機", weeks: 6, navisWeeks: [5, 6] },
  { id: "icap_fire", name: "ICAP消防", weeks: 5, navisWeeks: [4, 5] },
  { id: "icap_hvac", name: "ICAP空調", weeks: 5, navisWeeks: [4, 5] },
  { id: "icap_civil", name: "ICAP土木", weeks: 8, navisWeeks: [1,2,3,4,5,6,7,8] },
  { id: "struct", name: "結構軀體圖", weeks: 2, navisWeeks: [1, 2] },
  { id: "arch_app", name: "建築實務應用", weeks: 6, navisWeeks: [1,2,3,4,5,6] },
  { id: "acu", name: "ACU", weeks: 1, navisWeeks: [1] },
  { id: "const_app", name: "營建實務應用", weeks: 6, navisWeeks: [1,2,3,4,5,6] },
  { id: "five_sys", name: "五大系統班", weeks: 8, navisWeeks: [1,2,3,4,5,6,7,8] },
  { id: "navis", name: "Navisworks", weeks: 1, navisWeeks: [1] },
];

const LOCATIONS = ["北部", "中部", "南部"];
const DAYS = ["週六", "週日"];

const COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981",
  "#ef4444","#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6"
];

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function getNextDayOfWeek(date, dayOfWeek) {
  // dayOfWeek: 6=Saturday, 0=Sunday
  const d = new Date(date);
  const diff = (dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

export default function App() {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    courseId: COURSES[0].id,
    location: "北部",
    day: "週六",
    startDate: new Date().toISOString().slice(0,10),
  });
  const [error, setError] = useState("");
  const [view, setView] = useState("list"); // list | calendar

  const courseMap = useMemo(() => Object.fromEntries(COURSES.map(c => [c.id, c])), []);

  function validate(f) {
    const course = courseMap[f.courseId];
    const needsNavis = course.navisWeeks.length > 0;
    if (needsNavis && f.location !== "北部") {
      return `「${course.name}」含 Navisworks 課程（第 ${course.navisWeeks.join("、")} 週），只能在北部據點開課。`;
    }
    return "";
  }

  function addSchedule() {
    const err = validate(form);
    if (err) { setError(err); return; }
    setError("");

    const course = courseMap[form.courseId];
    const dayOfWeek = form.day === "週六" ? 6 : 0;
    const firstDate = getNextDayOfWeek(new Date(form.startDate), dayOfWeek);

    const sessions = Array.from({ length: course.weeks }, (_, i) => {
      const d = addWeeks(firstDate, i);
      const usesNavis = course.navisWeeks.includes(i + 1);
      return { week: i + 1, date: d, usesNavis };
    });

    const newSchedule = {
      id: Date.now(),
      courseId: form.courseId,
      courseName: course.name,
      location: form.location,
      day: form.day,
      sessions,
      color: COLORS[schedules.length % COLORS.length],
    };

    setSchedules(prev => [...prev, newSchedule]);
  }

  function removeSchedule(id) {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }

  // Build calendar data
  const calendarEvents = useMemo(() => {
    const events = [];
    schedules.forEach(s => {
      s.sessions.forEach(sess => {
        events.push({
          date: sess.date,
          label: s.courseName,
          week: sess.week,
          total: courseMap[s.courseId].weeks,
          usesNavis: sess.usesNavis,
          location: s.location,
          color: s.color,
          scheduleId: s.id,
        });
      });
    });
    return events;
  }, [schedules]);

  // Generate months for calendar
  const months = useMemo(() => {
    if (calendarEvents.length === 0) return [];
    const dates = calendarEvents.map(e => e.date);
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    min.setDate(1);
    const result = [];
    let cur = new Date(min);
    while (cur <= max) {
      result.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }, [calendarEvents]);

  return (
    <div style={{ fontFamily: "'Noto Sans TC', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", padding: "24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📅</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>BIM 課程排程系統</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>北部 / 中部 / 南部據點管理</p>
          </div>
        </div>

        {/* Add Form */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #334155" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#cbd5e1" }}>➕ 新增開課排程</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>課程</label>
              <select style={selectStyle} value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                {COURSES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}（{c.weeks}週）</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>據點</label>
              <select style={selectStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}據點</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>固定上課日</label>
              <select style={selectStyle} value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>開課起始日</label>
              <input type="date" style={selectStyle} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
          </div>

          {/* Course info preview */}
          <CourseInfo course={courseMap[form.courseId]} />

          {error && (
            <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={addSchedule} style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            確認排程
          </button>
        </div>

        {/* View Toggle */}
        {schedules.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["list", "calendar"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "#3b82f6" : "#1e293b",
                color: view === v ? "#fff" : "#94a3b8",
                border: `1px solid ${view === v ? "#3b82f6" : "#334155"}`,
                borderRadius: 8, padding: "7px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600
              }}>
                {v === "list" ? "📋 課表列表" : "🗓 月曆檢視"}
              </button>
            ))}
          </div>
        )}

        {/* List View */}
        {view === "list" && schedules.map(s => (
          <ScheduleCard key={s.id} schedule={s} onRemove={() => removeSchedule(s.id)} />
        ))}

        {/* Calendar View */}
        {view === "calendar" && months.map((month, mi) => (
          <MonthCalendar key={mi} month={month} events={calendarEvents} />
        ))}

        {schedules.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15 }}>尚未建立任何排程，請從上方新增開課計畫</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseInfo({ course }) {
  const hasNavis = course.navisWeeks.length > 0;
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#94a3b8", display: "flex", gap: 16, flexWrap: "wrap" }}>
      <span>📌 共 <b style={{ color: "#e2e8f0" }}>{course.weeks}</b> 週</span>
      <span>🖥 Revit：全程</span>
      {hasNavis
        ? <span>🔷 Navisworks：第 <b style={{ color: "#60a5fa" }}>{course.navisWeeks.join("、")}</b> 週（<b style={{ color: "#f87171" }}>限北部據點</b>）</span>
        : <span style={{ color: "#64748b" }}>無 Navisworks</span>
      }
    </div>
  );
}

function ScheduleCard({ schedule, onRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#1e293b", borderRadius: 14, marginBottom: 14, border: "1px solid #334155", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: schedule.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{schedule.courseName}</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#94a3b8" }}>
            {schedule.location}據點 · {schedule.day} · {schedule.sessions.length}週
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>{formatDate(schedule.sessions[0].date)} ～ {formatDate(schedule.sessions[schedule.sessions.length-1].date)}</span>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "#450a0a", border: "none", borderRadius: 6, color: "#f87171", padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>刪除</button>
        <span style={{ color: "#64748b", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {schedule.sessions.map(sess => (
            <div key={sess.week} style={{
              background: sess.usesNavis ? "#1e3a5f" : "#1e2d3d",
              border: `1px solid ${sess.usesNavis ? "#3b82f6" : "#334155"}`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12
            }}>
              <div style={{ color: "#94a3b8", marginBottom: 2 }}>第 {sess.week} 週</div>
              <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{formatDate(sess.date)}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                <Tag color="#065f46" text="Revit" />
                {sess.usesNavis && <Tag color="#1e3a8a" text="Navisworks" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tag({ color, text }) {
  return (
    <span style={{ background: color, borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#d1fae5" }}>{text}</span>
  );
}

function MonthCalendar({ month, events }) {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsByDay = {};
  events.forEach(e => {
    if (e.date.getFullYear() === year && e.date.getMonth() === mon) {
      const d = e.date.getDate();
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(e);
    }
  });

  return (
    <div style={{ background: "#1e293b", borderRadius: 14, padding: 18, marginBottom: 18, border: "1px solid #334155" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{year} 年 {mon + 1} 月</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
        {["日","一","二","三","四","五","六"].map(d => (
          <div key={d} style={{ fontSize: 11, color: "#64748b", padding: "4px 0", fontWeight: 600 }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} style={{
            minHeight: 52, background: d ? "#0f172a" : "transparent", borderRadius: 8,
            padding: 4, border: d ? "1px solid #1e293b" : "none"
          }}>
            {d && <>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>{d}</div>
              {(eventsByDay[d] || []).map((ev, ei) => (
                <div key={ei} style={{
                  background: ev.color + "33", border: `1px solid ${ev.color}55`,
                  borderLeft: `3px solid ${ev.color}`,
                  borderRadius: 4, padding: "2px 4px", fontSize: 9, color: "#e2e8f0",
                  marginBottom: 2, textAlign: "left", lineHeight: 1.3
                }}>
                  {ev.label} W{ev.week}
                  {ev.usesNavis && <span style={{ color: "#60a5fa" }}> N</span>}
                </div>
              ))}
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 600, letterSpacing: "0.05em" };
const selectStyle = { width: "100%", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" };

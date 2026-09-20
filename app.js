const workouts = [
  {
    name: "Home Made Hero",
    short: "Hero",
    intro: "Your original session with pressing, dips, rows, arms, legs and swings.",
    exercises: [
      ["Shoulder Press", "15 to 45 reps"],
      ["Lateral Raises", "Optional · 15 to 45 reps"],
      ["Dips", "Near failure"],
      ["Assisted Front Lever Rows", "Controlled reps"],
      ["Goblet Curls", "15 to 45 reps"],
      ["Bulgarian Split Squats", "Each leg · 15 to 45 reps"],
      ["Hindu Squats", "15 to 45 reps"],
      ["Calf Raises", "Optional · 20 to 45 reps"],
      ["Kettlebell Swings", "Powerful clean reps"]
    ]
  },
  {
    name: "Push, Pull and Posterior Chain",
    short: "Posterior",
    intro: "Chest pressing, pull ups, hamstrings, rear shoulders and trunk work.",
    exercises: [
      ["Feet Elevated Push Ups", "Use push up bars"],
      ["Pull Ups or Chin Ups", "Add slow negatives if needed"],
      ["Dumbbell Romanian Deadlifts", "15 to 30 reps · 3 second lowering"],
      ["Single Arm Dumbbell Bench Row", "Each side"],
      ["Dumbbell Reverse Lunges", "Each leg"],
      ["Chest Supported Rear Delt Raises", "Light and controlled"],
      ["Kettlebell Pullover Crunch", "15 to 30 reps"],
      ["Single Leg Calf Raises", "Each leg"],
      ["20 kg Kettlebell Swings", "Stop before technique fades"]
    ]
  },
  {
    name: "Side Plane and Rotation",
    short: "Side plane",
    intro: "Lateral movement, rotation and resisting unwanted rotation.",
    exercises: [
      ["Lateral Lunges", "Each side"],
      ["Cossack Squats", "Alternate sides"],
      ["Single Arm Dumbbell Floor Press", "Each side · resist rotation"],
      ["Offset Kettlebell Front Squat", "Each side"],
      ["Renegade Rows", "Keep hips square"],
      ["Side Plank Hip Raises", "Each side · 15 to 30 reps"],
      ["Half Kneeling Dumbbell Wood Chops", "Each side · light and controlled"],
      ["Suitcase March", "Each side · 30 to 60 steps"],
      ["Skater Steps or Bounds", "30 to 60 total reps"]
    ]
  },
  {
    name: "Chest, Back and Athletic Legs",
    short: "Athletic",
    intro: "Horizontal pressing and rowing with quads, hamstrings, arms and athletic legs.",
    exercises: [
      ["Flat Dumbbell Bench Press", "15 to 30 reps"],
      ["Chest Supported Dumbbell Rows", "Pause at the top"],
      ["Heels Raised Goblet Squat", "Quadriceps focus"],
      ["Single Leg Romanian Deadlift", "Each side"],
      ["Close Grip Push Ups", "Use bars or parallettes"],
      ["Dumbbell Hammer Curls", "15 to 45 reps"],
      ["Kettlebell High Pulls", "Begin with 12 kg"],
      ["Bench Step Ups with Knee Drive", "Each leg"],
      ["Hanging Knee Raises", "Or reverse crunches"]
    ]
  },
  {
    name: "Compound Full Body",
    short: "Compound",
    intro: "Heavy multi-joint strength work for the whole body using dumbbells, kettlebells and a bench.",
    exercises: [
      ["Flat Dumbbell Bench Press", "15 to 30 reps"],
      ["Kettlebell Goblet Squats", "15 to 30 reps"],
      ["Bulgarian Split Squats, Rear Foot on Bench", "Each leg · dumbbells"],
      ["Dumbbell Romanian Deadlifts", "15 to 30 reps · 3 second lowering"],
      ["Kettlebell Clean and Press", "Each side · controlled reps"],
      ["Bench Supported Renegade Rows", "Each side · dumbbells"],
      ["Dumbbell Thrusters", "15 to 25 reps"],
      ["Single Arm Kettlebell Swings", "Each side · powerful reps"],
      ["Dumbbell Step Ups on Bench", "Each leg · knee drive"]
    ]
  }
];

const STORAGE_KEY = "homeMadeHeroFinalV1";

const defaultState = {
  currentDay: 1,
  days: {},
  workoutSeconds: 0,
  settings: {
    restTime: 60,
    sound: "chime",
    volume: 0.65,
    vibration: true,
    voice: false,
    autoRest: true,
    wakeLock: false,
    largeText: false,
    theme: "blue"
  },
  bodyEntries: []
};

let state = loadState();
let workoutInterval = null;
let workoutRunning = false;
let restInterval = null;
let restSeconds = 60;
let restTotalSeconds = 60;
let wakeLock = null;
let audioContext = null;

const $ = id => document.getElementById(id);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const merged = { ...defaultState, ...(saved || {}) };
    merged.settings = { ...defaultState.settings, ...((saved && saved.settings) || {}) };
    merged.bodyEntries = Array.isArray(merged.bodyEntries) ? merged.bodyEntries : [];
    return merged;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function plannedWorkout(day) {
  return (day - 1) % workouts.length;
}

function plannedMode(day) {
  return day % 4 === 0 ? "recovery" : "standard";
}

function getDay(day = state.currentDay) {
  if (!state.days[day]) {
    state.days[day] = {
      workout: plannedWorkout(day),
      mode: plannedMode(day),
      sets: {},
      notes: {},
      performance: {},
      completed: false,
      completedAt: null,
      durationSeconds: 0
    };
  }
  return state.days[day];
}

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h
    ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function renderIbizaCountdown() {
  const el = $("ibizaCountdown");
  if (!el) return;
  const target = new Date(2026, 9, 16);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target - startOfToday) / 86400000);
  if (diffDays > 1) el.textContent = `☀️ ${diffDays} days to Ibiza`;
  else if (diffDays === 1) el.textContent = `☀️ 1 day to Ibiza — pack your bags`;
  else if (diffDays === 0) el.textContent = `☀️ Ibiza starts today — have an amazing trip`;
  else el.textContent = `☀️ Hope Ibiza was unforgettable`;
}

function renderAll() {
  const day = getDay();
  $("dayLabel").textContent = `Day ${state.currentDay} of 35`;
  $("dayStatus").textContent = day.completed ? "Completed" : "Planned";
  $("dayStatus").classList.toggle("complete", day.completed);

  $("workoutSelect").value = String(day.workout);
  $("modeSelect").value = day.mode;
  $("workoutTitle").textContent = workouts[day.workout].name;
  $("workoutIntro").textContent = workouts[day.workout].intro;

  renderExercises();
  renderPlan();
  renderHistory();
  renderWorkoutTimer();
  saveState();
}

function renderExercises() {
  const day = getDay();
  const workout = workouts[day.workout];
  const setCount = day.mode === "recovery" ? 1 : 2;
  $("exerciseList").innerHTML = "";

  workout.exercises.forEach(([name, detail], index) => {
    const card = document.createElement("article");
    card.className = "exercise";

    const allDone = Array.from({ length: setCount }, (_, s) => day.sets[`${index}-${s}`]).every(Boolean);
    card.classList.toggle("done", allDone);

    const setButtons = Array.from({ length: setCount }, (_, s) => {
      const done = !!day.sets[`${index}-${s}`];
      return `<button class="set-button ${done ? "completed" : ""}" data-exercise="${index}" data-set="${s}">
        Set ${s + 1}${done ? " ✓" : ""}
      </button>`;
    }).join("");

    card.innerHTML = `
      <div class="exercise-head">
        <div class="exercise-number">${index + 1}</div>
        <div>
          <div class="exercise-name">${name}</div>
          <div class="exercise-meta">${setCount} set${setCount > 1 ? "s" : ""} · ${detail}</div>
        </div>
      </div>
      <div class="set-row">${setButtons}</div>
      <div class="performance-row">
        <input class="performance-input" data-weight="${index}" type="number" min="0" step="0.1" placeholder="Weight kg" value="${escapeHtml(day.performance?.[index]?.weight ?? "")}">
        <input class="performance-input" data-reps="${index}" type="number" min="0" step="1" placeholder="Best reps" value="${escapeHtml(day.performance?.[index]?.reps ?? "")}">
      </div>
      <input class="note-input" data-note="${index}" placeholder="Extra note" value="${escapeHtml(day.notes[index] || "")}">
    `;
    $("exerciseList").appendChild(card);
  });

  document.querySelectorAll(".set-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = `${btn.dataset.exercise}-${btn.dataset.set}`;
      day.sets[key] = !day.sets[key];
      if (day.sets[key] && state.settings.autoRest) startRestTimer();
      day.completed = false;
      day.completedAt = null;
      renderAll();
    });
  });

  document.querySelectorAll(".note-input").forEach(input => {
    input.addEventListener("change", () => {
      day.notes[input.dataset.note] = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-weight]").forEach(input => {
    input.addEventListener("change", () => {
      const i = input.dataset.weight;
      day.performance = day.performance || {};
      day.performance[i] = day.performance[i] || {};
      day.performance[i].weight = Number(input.value) || 0;
      saveState();
      renderProgress();
    });
  });

  document.querySelectorAll("[data-reps]").forEach(input => {
    input.addEventListener("change", () => {
      const i = input.dataset.reps;
      day.performance = day.performance || {};
      day.performance[i] = day.performance[i] || {};
      day.performance[i].reps = Number(input.value) || 0;
      saveState();
      renderProgress();
    });
  });

  const total = workout.exercises.length * setCount;
  const complete = Object.entries(day.sets)
    .filter(([key, value]) => value && Number(key.split("-")[1]) < setCount).length;
  $("progressText").textContent = `${complete} / ${total} sets`;
  $("progressBar").style.width = `${total ? (complete / total) * 100 : 0}%`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPlan() {
  $("planGrid").innerHTML = "";
  for (let dayNum = 1; dayNum <= 35; dayNum++) {
    const data = getDay(dayNum);
    const btn = document.createElement("button");
    btn.className = "plan-day";
    btn.classList.toggle("complete", data.completed);
    btn.classList.toggle("selected", dayNum === state.currentDay);
    btn.innerHTML = `
      <span class="small">Day ${dayNum}</span>
      <strong>${workouts[data.workout].short}</strong>
      <em>${data.mode === "recovery" ? "Recovery" : data.completed ? "Completed" : "Standard"}</em>
    `;
    btn.addEventListener("click", () => {
      state.currentDay = dayNum;
      setView("session");
      renderAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("planGrid").appendChild(btn);
  }
}

function renderHistory() {
  const completeDays = Object.entries(state.days)
    .filter(([, data]) => data.completed)
    .sort((a, b) => Number(b[0]) - Number(a[0]));

  if (!completeDays.length) {
    $("historyList").innerHTML = `<div class="empty">No completed workouts yet.</div>`;
    return;
  }

  $("historyList").innerHTML = completeDays.map(([dayNum, data]) => `
    <article class="history-card">
      <div class="history-card-top">
        <strong>Day ${dayNum}: ${workouts[data.workout].name}</strong>
        <span class="status-pill complete">Done</span>
      </div>
      <p>${data.mode === "recovery" ? "Recovery session" : "Standard session"} · ${formatTime(data.durationSeconds || 0)} · ${data.completedAt ? new Date(data.completedAt).toLocaleDateString("en-GB") : ""}</p>
    </article>
  `).join("");
}

function renderWorkoutTimer() {
  $("workoutTimer").textContent = formatTime(state.workoutSeconds || 0);
  $("workoutState").textContent = workoutRunning ? "Running" : "Stopped";
}

function startWorkoutTimer() {
  if (workoutRunning) return;
  workoutRunning = true;
  renderWorkoutTimer();
  workoutInterval = setInterval(() => {
    state.workoutSeconds += 1;
    renderWorkoutTimer();
    if (state.workoutSeconds % 5 === 0) saveState();
  }, 1000);
}

function pauseWorkoutTimer() {
  workoutRunning = false;
  clearInterval(workoutInterval);
  saveState();
  renderWorkoutTimer();
}

function resetWorkoutTimer() {
  pauseWorkoutTimer();
  state.workoutSeconds = 0;
  renderWorkoutTimer();
  saveState();
}

function drawRest() {
  $("restTimer").textContent = formatTime(restSeconds);
  const total = Math.max(1, restTotalSeconds);
  const circumference = 314.159;
  const progress = Math.max(0, Math.min(1, restSeconds / total));
  $("restRingProgress").style.strokeDashoffset = String(circumference * (1 - progress));
  $("restDurationLabel").textContent = `${state.settings.restTime} seconds`;
}

function startRestTimer() {
  prepareAudio();
  clearInterval(restInterval);
  restTotalSeconds = Number(state.settings.restTime) || 60;
  restSeconds = restTotalSeconds;
  drawRest();
  restInterval = setInterval(() => {
    restSeconds -= 1;
    drawRest();
    if (restSeconds <= 0) finishRest();
  }, 1000);
}


function prepareAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {}
}

function playRestChime() {
  try {
    prepareAudio();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const volume = Math.max(0, Math.min(1, Number(state.settings.volume ?? .65)));
    const patterns = {
      chime: [
        { frequency: 659.25, start: 0.00, duration: 0.28, type: "sine" },
        { frequency: 880.00, start: 0.22, duration: 0.42, type: "sine" }
      ],
      bell: [
        { frequency: 987.77, start: 0.00, duration: 0.70, type: "sine" },
        { frequency: 1318.51, start: 0.05, duration: 0.58, type: "sine" }
      ],
      beep: [
        { frequency: 880, start: 0.00, duration: 0.16, type: "square" },
        { frequency: 880, start: 0.25, duration: 0.16, type: "square" },
        { frequency: 1046.5, start: 0.50, duration: 0.24, type: "square" }
      ],
      gong: [
        { frequency: 220, start: 0.00, duration: 1.15, type: "sine" },
        { frequency: 330, start: 0.03, duration: 0.90, type: "triangle" },
        { frequency: 440, start: 0.06, duration: 0.70, type: "sine" }
      ]
    };

    const notes = patterns[state.settings.sound] || patterns.chime;
    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * .22), now + note.start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration + 0.05);
    });
  } catch {}
}

function showScreenGlow() {
  const glow = $("screenGlow");
  if (!glow) return;
  glow.classList.remove("active");
  void glow.offsetWidth;
  glow.classList.add("active");
  setTimeout(() => glow.classList.remove("active"), 3800);
}

function finishRest() {
  clearInterval(restInterval);
  restSeconds = 0;
  drawRest();
  $("restCard").classList.add("flash");
  setTimeout(() => $("restCard").classList.remove("flash"), 1800);
  showScreenGlow();
  if (state.settings.vibration && "vibrate" in navigator) {
    navigator.vibrate([220, 100, 220, 100, 320]);
  }
  playRestChime();
  if (state.settings.voice && "speechSynthesis" in window) {
    speechSynthesis.cancel();
    const phrase = new SpeechSynthesisUtterance("Rest complete. Next set.");
    phrase.rate = 1;
    phrase.pitch = 1;
    speechSynthesis.speak(phrase);
  }
}

function resetRestTimer() {
  clearInterval(restInterval);
  restTotalSeconds = Number(state.settings.restTime) || 60;
  restSeconds = restTotalSeconds;
  drawRest();
}

function setView(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  document.querySelector(`.tab[data-view="${view}"]`).classList.add("active");
  if (view === "progress") setTimeout(renderProgress, 30);
  if (view === "body") setTimeout(renderBody, 30);
}

workouts.forEach((workout, index) => {
  const option = document.createElement("option");
  option.value = index;
  option.textContent = `${index + 1}. ${workout.name}`;
  $("workoutSelect").appendChild(option);
});

$("workoutSelect").addEventListener("change", e => {
  const day = getDay();
  day.workout = Number(e.target.value);
  day.sets = {};
  day.completed = false;
  renderAll();
});

$("modeSelect").addEventListener("change", e => {
  const day = getDay();
  day.mode = e.target.value;
  day.completed = false;
  renderAll();
});

$("previousDay").addEventListener("click", () => {
  state.currentDay = Math.max(1, state.currentDay - 1);
  renderAll();
});

$("nextDay").addEventListener("click", () => {
  state.currentDay = Math.min(35, state.currentDay + 1);
  renderAll();
});

$("clearSession").addEventListener("click", () => {
  if (!confirm("Clear all sets and notes for this day?")) return;
  const day = getDay();
  day.sets = {};
  day.notes = {};
  day.completed = false;
  day.completedAt = null;
  renderAll();
});

$("completeSession").addEventListener("click", () => {
  const day = getDay();
  const setCount = day.mode === "recovery" ? 1 : 2;
  workouts[day.workout].exercises.forEach((_, ex) => {
    for (let set = 0; set < setCount; set++) day.sets[`${ex}-${set}`] = true;
  });
  day.completed = true;
  day.completedAt = new Date().toISOString();
  day.durationSeconds = state.workoutSeconds || 0;
  pauseWorkoutTimer();
  renderAll();
  setView("history");
});

$("startWorkout").addEventListener("click", startWorkoutTimer);
$("pauseWorkout").addEventListener("click", pauseWorkoutTimer);
$("resetWorkout").addEventListener("click", resetWorkoutTimer);
$("startRest").addEventListener("click", startRestTimer);
$("addRest").addEventListener("click", () => {
  restSeconds += 15;
  restTotalSeconds = Math.max(restTotalSeconds, restSeconds);
  drawRest();
});
$("resetRest").addEventListener("click", resetRestTimer);

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

$("exportData").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `home-made-hero-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("importData").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || typeof imported !== "object" || !imported.days) throw new Error();
    state = { ...defaultState, ...imported };
    state.settings = { ...defaultState.settings, ...(imported.settings || {}) };
    state.bodyEntries = Array.isArray(imported.bodyEntries) ? imported.bodyEntries : [];
    saveState();
    applySettings();
    renderAll();
    alert("Backup restored.");
  } catch {
    alert("That backup file could not be read.");
  }
  e.target.value = "";
});

$("resetAll").addEventListener("click", () => {
  if (!confirm("Erase all 35 day progress, notes and history?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  renderAll();
});




function applySettings() {
  document.body.classList.remove("theme-green", "theme-orange", "theme-purple", "large-text");
  if (state.settings.theme !== "blue") document.body.classList.add(`theme-${state.settings.theme}`);
  document.body.classList.toggle("large-text", !!state.settings.largeText);
  restTotalSeconds = Number(state.settings.restTime) || 60;
  if (!restInterval) restSeconds = restTotalSeconds;
  drawRest();
  handleWakeLock();
}

async function handleWakeLock() {
  try {
    if (!("wakeLock" in navigator)) return;
    if (state.settings.wakeLock && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } else if (!state.settings.wakeLock && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {}
}

function openSettings() {
  const s = state.settings;
  $("settingRestTime").value = String(s.restTime);
  $("settingSound").value = s.sound;
  $("settingVolume").value = String(s.volume);
  $("settingTheme").value = s.theme;
  $("settingVibration").checked = !!s.vibration;
  $("settingVoice").checked = !!s.voice;
  $("settingAutoRest").checked = !!s.autoRest;
  $("settingWakeLock").checked = !!s.wakeLock;
  $("settingLargeText").checked = !!s.largeText;
  $("settingsModal").classList.add("open");
  $("settingsModal").setAttribute("aria-hidden", "false");
}

function closeSettings() {
  $("settingsModal").classList.remove("open");
  $("settingsModal").setAttribute("aria-hidden", "true");
}

function saveSettingsFromForm() {
  state.settings = {
    restTime: Number($("settingRestTime").value),
    sound: $("settingSound").value,
    volume: Number($("settingVolume").value),
    theme: $("settingTheme").value,
    vibration: $("settingVibration").checked,
    voice: $("settingVoice").checked,
    autoRest: $("settingAutoRest").checked,
    wakeLock: $("settingWakeLock").checked,
    largeText: $("settingLargeText").checked
  };
  saveState();
  applySettings();
  closeSettings();
}

function allExerciseNames() {
  return [...new Set(workouts.flatMap(w => w.exercises.map(e => e[0])))].sort();
}

function collectPerformance(exerciseName) {
  const rows = [];
  Object.entries(state.days).forEach(([dayNum, day]) => {
    const workout = workouts[day.workout];
    if (!workout || !day.performance) return;
    workout.exercises.forEach(([name], index) => {
      if (name !== exerciseName) return;
      const p = day.performance[index];
      if (!p) return;
      const weight = Number(p.weight) || 0;
      const reps = Number(p.reps) || 0;
      if (!weight && !reps) return;
      rows.push({
        day: Number(dayNum),
        weight,
        reps,
        volume: weight * reps,
        completedAt: day.completedAt
      });
    });
  });
  return rows.sort((a,b) => a.day - b.day);
}

function drawLineChart(canvas, labels, values, title) {
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 800;
  const cssHeight = 320;
  canvas.width = cssWidth * ratio;
  canvas.height = cssHeight * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0,0,cssWidth,cssHeight);

  const pad = { left: 48, right: 18, top: 30, bottom: 42 };
  const w = cssWidth - pad.left - pad.right;
  const h = cssHeight - pad.top - pad.bottom;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);

  ctx.font = "13px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#cbb3c8";
  ctx.fillText(title, pad.left, 18);

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let i=0;i<=4;i++) {
    const y = pad.top + (h/4)*i;
    ctx.beginPath();
    ctx.moveTo(pad.left,y);
    ctx.lineTo(pad.left+w,y);
    ctx.stroke();
    const val = max - (range/4)*i;
    ctx.fillText(Number(val.toFixed(1)).toString(), 6, y+4);
  }

  if (!values.length) {
    ctx.fillText("No performance entries yet.", pad.left, pad.top + h/2);
    return;
  }

  const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#ff9466";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((v,i) => {
    const x = values.length === 1 ? pad.left + w/2 : pad.left + (w*i/(values.length-1));
    const y = pad.top + h - ((v-min)/range)*h;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = accent;
  values.forEach((v,i) => {
    const x = values.length === 1 ? pad.left + w/2 : pad.left + (w*i/(values.length-1));
    const y = pad.top + h - ((v-min)/range)*h;
    ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#cbb3c8";
    ctx.fillText(String(labels[i]), x-10, pad.top+h+24);
    ctx.fillStyle = accent;
  });
}

function renderProgress() {
  const names = allExerciseNames();
  if (!$("progressExercise").options.length) {
    names.forEach(name => {
      const o = document.createElement("option");
      o.value = name; o.textContent = name;
      $("progressExercise").appendChild(o);
    });
  }
  const exercise = $("progressExercise").value || names[0];
  if (!exercise) return;
  const metric = $("progressMetric").value || "weight";
  const rows = collectPerformance(exercise);
  const labels = rows.map(r => `D${r.day}`);
  const values = rows.map(r => r[metric]);
  const metricTitle = metric === "weight" ? "Weight (kg)" : metric === "reps" ? "Reps" : "Weight × reps";
  drawLineChart($("progressChart"), labels, values, `${exercise} — ${metricTitle}`);

  const maxWeight = Math.max(0, ...rows.map(r => r.weight));
  const maxReps = Math.max(0, ...rows.map(r => r.reps));
  const maxVolume = Math.max(0, ...rows.map(r => r.volume));
  $("pbList").innerHTML = `
    <article class="history-card pb-card"><div><strong>Heaviest weight</strong><p>${exercise}</p></div><span>${maxWeight || "—"} kg</span></article>
    <article class="history-card pb-card"><div><strong>Highest reps</strong><p>${exercise}</p></div><span>${maxReps || "—"}</span></article>
    <article class="history-card pb-card"><div><strong>Best estimated volume</strong><p>${exercise}</p></div><span>${maxVolume || "—"}</span></article>
  `;
}

function renderBody() {
  const entries = [...state.bodyEntries].sort((a,b) => a.date.localeCompare(b.date));
  drawLineChart(
    $("bodyChart"),
    entries.map(e => e.date.slice(5)),
    entries.map(e => Number(e.weight) || 0),
    "Body weight (kg)"
  );

  if (!entries.length) {
    $("bodyHistory").innerHTML = `<div class="empty">No measurements saved yet.</div>`;
    return;
  }

  $("bodyHistory").innerHTML = [...entries].reverse().map((e,index) => `
    <article class="history-card">
      <div class="history-card-top">
        <strong>${new Date(e.date + "T12:00:00").toLocaleDateString("en-GB")}</strong>
        <button class="ghost compact" data-delete-body="${e.id}">Delete</button>
      </div>
      <p>
        ${e.weight ? `Weight ${e.weight} kg` : ""}
        ${e.waist ? ` · Waist ${e.waist} cm` : ""}
        ${e.chest ? ` · Chest ${e.chest} cm` : ""}
        ${e.arms ? ` · Arms ${e.arms} cm` : ""}
        ${e.thighs ? ` · Thighs ${e.thighs} cm` : ""}
      </p>
    </article>
  `).join("");

  document.querySelectorAll("[data-delete-body]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.bodyEntries = state.bodyEntries.filter(e => String(e.id) !== btn.dataset.deleteBody);
      saveState();
      renderBody();
    });
  });
}

function saveBodyEntry() {
  const date = $("bodyDate").value;
  if (!date) { alert("Choose a date first."); return; }
  const entry = {
    id: `${Date.now()}`,
    date,
    weight: Number($("bodyWeight").value) || 0,
    waist: Number($("bodyWaist").value) || 0,
    chest: Number($("bodyChest").value) || 0,
    arms: Number($("bodyArms").value) || 0,
    thighs: Number($("bodyThighs").value) || 0
  };
  state.bodyEntries.push(entry);
  saveState();
  ["bodyWeight","bodyWaist","bodyChest","bodyArms","bodyThighs"].forEach(id => $(id).value = "");
  renderBody();
}

/* Spotify now-playing controls */
const SPOTIFY_CLIENT_ID = "1866785d98a442dcbc6c52a005605ef7";
const SPOTIFY_REDIRECT_URI = "https://mikesweet23.github.io/home-made-hero/";
const SPOTIFY_SCOPES = "user-read-playback-state user-modify-playback-state";
const SPOTIFY_TOKEN_KEY = "homeMadeHeroSpotifyTokens";

let spotifyPollInterval = null;

function spotifyRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, v => chars[v % chars.length]).join("");
}

async function spotifyCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function loadSpotifyTokens() {
  try { return JSON.parse(localStorage.getItem(SPOTIFY_TOKEN_KEY)); } catch { return null; }
}

function saveSpotifyTokens(tokens) {
  localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens));
}

function clearSpotifyTokens() {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY);
}

async function spotifyConnect() {
  const verifier = spotifyRandomString(64);
  const authState = spotifyRandomString(16);
  sessionStorage.setItem("spotifyVerifier", verifier);
  sessionStorage.setItem("spotifyState", authState);
  const challenge = await spotifyCodeChallenge(verifier);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES,
    state: authState
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

async function spotifyHandleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  if (!code) return;
  window.history.replaceState({}, "", window.location.pathname);

  const expectedState = sessionStorage.getItem("spotifyState");
  const verifier = sessionStorage.getItem("spotifyVerifier");
  sessionStorage.removeItem("spotifyState");
  sessionStorage.removeItem("spotifyVerifier");
  if (!verifier || returnedState !== expectedState) return;

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
      })
    });
    if (!res.ok) throw new Error("token exchange failed");
    const data = await res.json();
    saveSpotifyTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000
    });
  } catch {
    alert("Could not connect to Spotify. Please try again.");
  }
}

async function spotifyRefreshToken() {
  const tokens = loadSpotifyTokens();
  if (!tokens || !tokens.refresh_token) return null;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        client_id: SPOTIFY_CLIENT_ID
      })
    });
    if (!res.ok) throw new Error("refresh failed");
    const data = await res.json();
    const updated = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000
    };
    saveSpotifyTokens(updated);
    return updated;
  } catch {
    clearSpotifyTokens();
    return null;
  }
}

async function spotifyGetAccessToken() {
  let tokens = loadSpotifyTokens();
  if (!tokens) return null;
  if (Date.now() > tokens.expires_at - 60000) tokens = await spotifyRefreshToken();
  return tokens ? tokens.access_token : null;
}

async function spotifyApi(path, options = {}) {
  const token = await spotifyGetAccessToken();
  if (!token) return null;
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    clearSpotifyTokens();
    renderSpotify();
    return null;
  }
  return res;
}

async function spotifyFetchState() {
  const res = await spotifyApi("/me/player");
  if (!res) return null;
  if (res.status === 204) return { empty: true };
  if (!res.ok) return null;
  return res.json();
}

async function spotifyControlAction(path, method) {
  const res = await spotifyApi(path, { method });
  if (res && res.status === 404) alert("Open Spotify on a device first, then try again.");
  setTimeout(renderSpotify, 400);
}

async function renderSpotify() {
  const tokens = loadSpotifyTokens();
  const connected = !!tokens;
  $("spotifyConnectBtn").textContent = connected ? "Disconnect" : "Connect Spotify";
  $("spotifyNowPlaying").hidden = !connected;
  $("spotifyControls").hidden = !connected;
  $("spotifyEmpty").hidden = connected;
  if (!connected) {
    stopSpotifyPolling();
    return;
  }
  startSpotifyPolling();
  const trackState = await spotifyFetchState();
  if (!trackState || trackState.empty || !trackState.item) {
    $("spotifyTrackName").textContent = "Nothing playing";
    $("spotifyArtistName").textContent = "Open Spotify and press play on a track";
    $("spotifyArt").hidden = true;
    $("spotifyArt").removeAttribute("src");
    $("spotifyPlayPause").textContent = "▶";
    return;
  }
  $("spotifyTrackName").textContent = trackState.item.name;
  $("spotifyArtistName").textContent = trackState.item.artists.map(a => a.name).join(", ");
  const art = trackState.item.album?.images?.[trackState.item.album.images.length - 1];
  if (art) {
    $("spotifyArt").src = art.url;
    $("spotifyArt").hidden = false;
  } else {
    $("spotifyArt").removeAttribute("src");
    $("spotifyArt").hidden = true;
  }
  $("spotifyPlayPause").textContent = trackState.is_playing ? "⏸" : "▶";
}

function startSpotifyPolling() {
  if (spotifyPollInterval) return;
  spotifyPollInterval = setInterval(renderSpotify, 8000);
}

function stopSpotifyPolling() {
  clearInterval(spotifyPollInterval);
  spotifyPollInterval = null;
}

$("spotifyConnectBtn").addEventListener("click", () => {
  if (loadSpotifyTokens()) {
    if (confirm("Disconnect Spotify?")) {
      clearSpotifyTokens();
      renderSpotify();
    }
  } else {
    spotifyConnect();
  }
});

$("spotifyPlayPause").addEventListener("click", async () => {
  const trackState = await spotifyFetchState();
  const isPlaying = trackState && trackState.is_playing;
  spotifyControlAction(isPlaying ? "/me/player/pause" : "/me/player/play", "PUT");
});
$("spotifyNext").addEventListener("click", () => spotifyControlAction("/me/player/next", "POST"));
$("spotifyPrev").addEventListener("click", () => spotifyControlAction("/me/player/previous", "POST"));

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && loadSpotifyTokens()) renderSpotify();
  else stopSpotifyPolling();
});

$("settingsBtn").addEventListener("click", openSettings);
$("closeSettings").addEventListener("click", closeSettings);
document.querySelectorAll("[data-close-settings]").forEach(el => el.addEventListener("click", closeSettings));
$("saveSettings").addEventListener("click", saveSettingsFromForm);
$("testSound").addEventListener("click", () => {
  const original = state.settings;
  state.settings = {
    ...state.settings,
    sound: $("settingSound").value,
    volume: Number($("settingVolume").value)
  };
  playRestChime();
  state.settings = original;
});
$("progressExercise").addEventListener("change", renderProgress);
$("progressMetric").addEventListener("change", renderProgress);
$("saveBodyEntry").addEventListener("click", saveBodyEntry);

window.addEventListener("resize", () => {
  renderProgress();
  renderBody();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.settings.wakeLock) handleWakeLock();
});

$("bodyDate").value = new Date().toISOString().slice(0,10);
applySettings();
renderProgress();
renderBody();
renderIbizaCountdown();
spotifyHandleRedirect().then(renderSpotify);


if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

renderAll();
drawRest();

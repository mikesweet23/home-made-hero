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
  }
];

const STORAGE_KEY = "homeMadeHeroFinalV1";

const defaultState = {
  currentDay: 1,
  days: {},
  workoutSeconds: 0
};

let state = loadState();
let workoutInterval = null;
let workoutRunning = false;
let restInterval = null;
let restSeconds = 60;
let wakeLock = null;

const $ = id => document.getElementById(id);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...(saved || {}) };
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
      <input class="note-input" data-note="${index}" placeholder="Weight, reps or note" value="${escapeHtml(day.notes[index] || "")}">
    `;
    $("exerciseList").appendChild(card);
  });

  document.querySelectorAll(".set-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = `${btn.dataset.exercise}-${btn.dataset.set}`;
      day.sets[key] = !day.sets[key];
      if (day.sets[key]) startRestTimer();
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
}

function startRestTimer() {
  clearInterval(restInterval);
  restSeconds = 60;
  drawRest();
  restInterval = setInterval(() => {
    restSeconds -= 1;
    drawRest();
    if (restSeconds <= 0) finishRest();
  }, 1000);
}

function finishRest() {
  clearInterval(restInterval);
  restSeconds = 0;
  drawRest();
  $("restCard").classList.add("flash");
  setTimeout(() => $("restCard").classList.remove("flash"), 1500);
  if ("vibrate" in navigator) navigator.vibrate([180, 90, 180]);
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .35);
    osc.start();
    osc.stop(ctx.currentTime + .35);
  } catch {}
}

function resetRestTimer() {
  clearInterval(restInterval);
  restSeconds = 60;
  drawRest();
}

function setView(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  document.querySelector(`.tab[data-view="${view}"]`).classList.add("active");
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
$("addRest").addEventListener("click", () => { restSeconds += 15; drawRest(); });
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
    saveState();
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

$("wakeLockBtn").addEventListener("click", async () => {
  try {
    if (!("wakeLock" in navigator)) {
      alert("Keep awake is not supported by this browser.");
      return;
    }
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      $("wakeLockBtn").textContent = "●";
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
        $("wakeLockBtn").textContent = "◉";
      });
    } else {
      await wakeLock.release();
    }
  } catch {
    alert("The browser could not keep the screen awake.");
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

renderAll();
drawRest();

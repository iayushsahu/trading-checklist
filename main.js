// Configuration
const CONFIG = {
  STORAGE_KEY: "trading_checklist_v5",
  TASKS: [
    "Open the chart and switch to the 4H timeframe",
    "Find the most recent swing high and swing low",
    "Draw Fib levels between 61.80% and 78.60% on that swing",
    "Mark key zones: FVG, Support & Resistance, and Trendlines",
    "Switch to the 15M timeframe",
    "Wait for price to reach the marked Fibonacci zone",
    "When price taps the zone, look for a bullish/bearish confirmation candle",
    "Set stop loss at 1% risk or less",
    "Set take profit at a minimum of 1:3 risk-to-reward ratio (or higher)",
  ],
  RULES: ["FIRST RULE: FOLLOW THE RULES", "SECOND RULE: FOLLOW THE FIRST RULE"],
  SESSIONS: {
    asia: { start: 5.5, end: 14.5 },
    london: { start: 12.5, end: 21.5 },
    newyork: { start: 17.5, end: 2.5 },
  },
  PROGRESS_CIRCUMFERENCE: 565.48,
};

// DOM Cache
const DOM = {
  tasksList: document.getElementById("tasksList"),
  progressFill: document.getElementById("progressFill"),
  percentText: document.getElementById("percentText"),
  statusText: document.getElementById("statusText"),
  completeMsg: document.getElementById("completeMsg"),
  warningMsg: document.getElementById("warningMsg"),
  totalCount: document.getElementById("totalCount"),
  completedCount: document.getElementById("completedCount"),
  resetBtn: document.getElementById("resetBtn"),
  checkAllBtn: document.getElementById("checkAllBtn"),
  ruleHeadingTop: document.getElementById("ruleHeadingTop"),
  currentTime: document.getElementById("currentTime"),
  currentDate: document.getElementById("currentDate"),
  asiaSession: document.getElementById("asiaSession"),
  londonSession: document.getElementById("londonSession"),
  newyorkSession: document.getElementById("newyorkSession"),
  asiaStatus: document.getElementById("asiaStatus"),
  londonStatus: document.getElementById("londonStatus"),
  newyorkStatus: document.getElementById("newyorkStatus"),
  overlapIndicator: document.getElementById("overlapIndicator"),
};

// State
let appState = {
  checked: new Array(CONFIG.TASKS.length).fill(false),
  currentRuleIndex: 0,
};

// Utilities
const utils = {
  loadState() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.checked?.length === CONFIG.TASKS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load state:", e);
    }
    return { checked: new Array(CONFIG.TASKS.length).fill(false) };
  },

  saveState() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  },

  formatTime(date) {
    return (
      date.toLocaleTimeString("en-IN", {
        hour12: false,
        timeZone: "Asia/Kolkata",
      }) + " IST"
    );
  },

  formatDate(date) {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  },

  getTimeAsHour(date) {
    return date.getHours() + date.getMinutes() / 60;
  },

  isSessionActive(sessionName, currentHour) {
    const session = CONFIG.SESSIONS[sessionName];
    return sessionName === "newyork"
      ? currentHour >= session.start || currentHour <= session.end
      : currentHour >= session.start && currentHour <= session.end;
  },
};

// Task Manager
const taskManager = {
  render() {
    const fragment = document.createDocumentFragment();

    CONFIG.TASKS.forEach((text, index) => {
      const task = this.createTaskElement(text, index);
      fragment.appendChild(task);
    });

    DOM.tasksList.innerHTML = "";
    DOM.tasksList.appendChild(fragment);
    DOM.totalCount.textContent = CONFIG.TASKS.length;
  },

  createTaskElement(text, index) {
    const task = document.createElement("div");
    task.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.id = `task-${index}`;
    checkbox.checked = appState.checked[index];
    checkbox.addEventListener("change", (e) => this.handleTaskChange(e, index));

    const label = document.createElement("label");
    label.className = "task-label";
    label.htmlFor = `task-${index}`;
    label.textContent = text;

    if (appState.checked[index]) {
      label.classList.add("completed");
    }

    task.appendChild(checkbox);
    task.appendChild(label);

    return task;
  },

  handleTaskChange(event, index) {
    const isChecked = event.target.checked;

    if (isChecked && index > 0 && !appState.checked[index - 1]) {
      event.target.checked = false;
      uiManager.showMessage("warning");
      return;
    }

    appState.checked[index] = isChecked;
    utils.saveState();
    this.updateProgress();
    this.updateTaskAppearance();
  },

  updateTaskAppearance() {
    CONFIG.TASKS.forEach((_, index) => {
      const checkbox = document.getElementById(`task-${index}`);
      const label = checkbox?.nextElementSibling;

      if (label) {
        if (appState.checked[index]) {
          label.classList.add("completed");
        } else {
          label.classList.remove("completed");
        }
      }
    });
  },

  updateProgress() {
    const completed = appState.checked.filter(Boolean).length;
    const percentage = Math.round((completed / CONFIG.TASKS.length) * 100);

    const offset =
      CONFIG.PROGRESS_CIRCUMFERENCE -
      (percentage / 100) * CONFIG.PROGRESS_CIRCUMFERENCE;
    DOM.progressFill.style.strokeDashoffset = offset;

    this.animateNumber(DOM.percentText, percentage);
    DOM.completedCount.textContent = completed;

    let statusText = "Not Started";
    if (percentage === 100) {
      statusText = "Complete";
      uiManager.showMessage("success");
    } else if (percentage > 0) {
      statusText = "In Progress";
      uiManager.hideMessages();
    } else {
      uiManager.hideMessages();
    }

    DOM.statusText.textContent = statusText;
    this.updateTaskAppearance();
  },

  animateNumber(element, targetNumber) {
    const current = parseInt(element.textContent) || 0;
    const increment = targetNumber > current ? 1 : -1;
    const timer = setInterval(() => {
      const currentValue = parseInt(element.textContent) || 0;
      if (currentValue === targetNumber) {
        clearInterval(timer);
      } else {
        element.textContent = currentValue + increment + "%";
      }
    }, 20);
  },

  resetAll() {
    appState.checked = new Array(CONFIG.TASKS.length).fill(false);
    utils.saveState();
    this.render();
    this.updateProgress();
    uiManager.hideMessages();
  },

  checkAll() {
    appState.checked = new Array(CONFIG.TASKS.length).fill(true);
    utils.saveState();
    this.render();
    this.updateProgress();
  },
};

// UI Manager
const uiManager = {
  showMessage(type) {
    this.hideMessages();
    const message = type === "success" ? DOM.completeMsg : DOM.warningMsg;
    message.classList.add("show");

    if (type === "warning") {
      setTimeout(() => message.classList.remove("show"), 3500);
    }
  },

  hideMessages() {
    DOM.completeMsg.classList.remove("show");
    DOM.warningMsg.classList.remove("show");
  },

  rotateRuleHeading() {
    DOM.ruleHeadingTop.style.opacity = "0";

    setTimeout(() => {
      appState.currentRuleIndex =
        (appState.currentRuleIndex + 1) % CONFIG.RULES.length;
      DOM.ruleHeadingTop.textContent = CONFIG.RULES[appState.currentRuleIndex];
      DOM.ruleHeadingTop.style.opacity = "1";
    }, 400);
  },
};

// Session Manager
const sessionManager = {
  update() {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const currentHour = utils.getTimeAsHour(istTime);

    DOM.currentTime.textContent = utils.formatTime(istTime);
    DOM.currentDate.textContent = utils.formatDate(istTime);

    const sessions = {
      asia: utils.isSessionActive("asia", currentHour),
      london: utils.isSessionActive("london", currentHour),
      newyork: utils.isSessionActive("newyork", currentHour),
    };

    this.updateSessionStatus(DOM.asiaSession, DOM.asiaStatus, sessions.asia);
    this.updateSessionStatus(
      DOM.londonSession,
      DOM.londonStatus,
      sessions.london
    );
    this.updateSessionStatus(
      DOM.newyorkSession,
      DOM.newyorkStatus,
      sessions.newyork
    );

    this.handleOverlaps(sessions);
  },

  updateSessionStatus(sessionElement, statusElement, isActive) {
    if (isActive) {
      sessionElement.classList.add("active");
      sessionElement.classList.remove("inactive");
      statusElement.textContent = "Open";
    } else {
      sessionElement.classList.remove("active");
      sessionElement.classList.add("inactive");
      statusElement.textContent = "Closed";
    }
  },

  handleOverlaps(sessions) {
    const overlaps = [];

    [DOM.asiaSession, DOM.londonSession, DOM.newyorkSession].forEach(
      (session) => {
        session.classList.remove("overlap");
      }
    );

    if (sessions.asia && sessions.london) {
      overlaps.push("Asia-London");
      DOM.asiaSession.classList.add("overlap");
      DOM.londonSession.classList.add("overlap");
    }
    if (sessions.london && sessions.newyork) {
      overlaps.push("London-NY");
      DOM.londonSession.classList.add("overlap");
      DOM.newyorkSession.classList.add("overlap");
    }
    if (sessions.asia && sessions.newyork) {
      overlaps.push("Asia-NY");
      DOM.asiaSession.classList.add("overlap");
      DOM.newyorkSession.classList.add("overlap");
    }

    if (overlaps.length > 0) {
      DOM.overlapIndicator.textContent = `🔥 ${overlaps.join(
        " & "
      )} Overlap - High Volatility`;
      DOM.overlapIndicator.classList.add("show");
    } else {
      DOM.overlapIndicator.classList.remove("show");
    }
  },
};

// Initialize
const init = () => {
  appState = { ...appState, ...utils.loadState() };

  taskManager.render();
  taskManager.updateProgress();
  sessionManager.update();

  DOM.resetBtn.addEventListener("click", () => taskManager.resetAll());
  DOM.checkAllBtn.addEventListener("click", () => taskManager.checkAll());

  setInterval(() => sessionManager.update(), 1000);
  setInterval(() => uiManager.rotateRuleHeading(), 4500);
};

// Start
init();

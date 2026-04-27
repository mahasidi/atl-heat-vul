const CANVAS_W = 3072;
const CANVAS_H = 1280;
const COLS = 5;
const ROWS = 3;

let video;
let bodyPose;
let poses = [];
let pulseT = 0;
let figT = 0;
let figDir = 1;

let scaleFactor = 0.4;
const SCALE_STEP = 0.05;

// Instruction panel cells (col, row) in the center of middle row
const INSTRUCTION_CELLS = [[1,1],[2,1],[3,1]];

function isInstructionCell(col, row) {
  return INSTRUCTION_CELLS.some(([c, r]) => c === col && r === row);
}

// All fan cells have white bg, tier determines fan/text color
const MINIMAL = { bg: "#FFFFFF", fan: "#1a1a1a", ring: "#36E6D9", jacksNeeded: 5  };
const MEDIUM   = { bg: "#FFFFFF", fan: "#1a1a1a", ring: "#FF9F1C", jacksNeeded: 10 };
const HIGH     = { bg: "#FFFFFF", fan: "#1a1a1a", ring: "#FF3366", jacksNeeded: 20 };

let sounds = {};

const transcripts = {
  "BANKHEAD": {
    context: "Adult child calling a sibling · Est. 20 seconds",
    audio: "BANKHEAD",
    lines: [
      { speaker: "CALLER",  text: "I just got to his house. He's been in one room all day with the door closed trying to keep the cool air in. It's one room. The rest of the house is suffocating.", delay: 0 },
      { speaker: "SIBLING", text: "We need to start putting money together for another unit before this gets worse.", delay: 8900 }
    ]
  },
  "ENGLISH AVE": {
    context: "Resident calling a family member · Est. 20 seconds",
    audio: "ENGLISH AVENUE",
    lines: [
      { speaker: "CALLER", text: "I just checked on Grandma. She had a cold wet towel on her neck and was trying to sit completely still to not generate any body heat. It's 94 degrees in her living room, I don't even know what to do.", delay: 0 }
    ]
  },
  "GEORGIA TECH": {
    context: "Facilities manager leaving a voicemail · Est. 15 seconds",
    audio: "GEORGIA TECH",
    lines: [
      { speaker: "CALLER", text: "Hey, just calling to let you know the HVAC upgrade is done across the whole engineering quad. Walked through at noon today, felt like a different city in there. Students won't feel the summer at all. Let me know if there's anything else that's needed.", delay: 0 }
    ]
  },
  "KIRKWOOD": {
    context: "Longtime resident calling a community aid line · Est. 20 seconds",
    audio: "KIRKWOOD",
    lines: [
      { speaker: "OPERATOR", text: "Hi, thank you for calling Kirkwood Cares, how can I help you?", delay: 0 },
      { speaker: "CALLER",   text: "My bedroom was 91 degrees at midnight. I'm waking up soaked every night. I've lived on this street 47 years and I can't afford to fix my roof. I just need to sleep.", delay: 4300 }
    ]
  },
  "EAST ATLANTA": {
    context: "Resident calling 311 · Est. 20 seconds",
    audio: "EAST ATLANTA",
    lines: [
      { speaker: "OPERATOR", text: "Thank you for calling 311, how can I help you?", delay: 0 },
      { speaker: "CALLER",   text: "The cooling center on Gresham is packed every afternoon. People coming in just to sit somewhere that isn't dangerous. We need more space before somebody collapses.", delay: 3500 }
    ]
  },
  "CASCADE RD": {
    context: "Resident calling apartment management · Est. 20 seconds",
    audio: "CASCADE ROAD",
    lines: [
      { speaker: "CALLER",  text: "My AC has been out for eight days. Last night it was 88 degrees inside at 11pm and my kid could not sleep. Eight days.", delay: 0 },
      { speaker: "MANAGER", text: "We're waiting on a part, it'll come in next week. Hold tight.", delay: 9600 }
    ]
  },
  "GREENBRIAR": {
    context: "Resident calling 311 · Est. 25 seconds",
    audio: "GREENBRIAR",
    lines: [
      { speaker: "OPERATOR", text: "Thank you for calling 311, how can I help you?", delay: 0 },
      { speaker: "CALLER",   text: "With this heat wave, this summer has been a nightmare. My neighbor's kid has been in and out of the hospital with her asthma and my elderly neighbor collapsed from heat exhaustion last week. Is there anything, any funding, any support at all?", delay: 3300 }
    ]
  },
  "WASHINGTON PK": {
    context: "Family member calling a relative · Est. 20 seconds",
    audio: "WASHINGTON PARK",
    lines: [
      { speaker: "CALLER", text: "Mama, Ann told me you've been turning the AC off because the bill got too high. You cannot do that in this heat. Please turn it back on.", delay: 0 },
      { speaker: "MAMA",   text: "You know, I know it's hot, but I still got groceries to buy this week.", delay: 7400 }
    ]
  },
  "PITTSBURGH": {
    context: "Neighbor calling 911 · Est. 25 seconds",
    audio: "PITTSBURGH",
    lines: [
      { speaker: "DISPATCHER", text: "911 what's your emergency?", delay: 0 },
      { speaker: "CALLER",     text: "I need help, my neighbor Patricia, she's 65 and lives alone. I came to check on her and she's not responding. It's like an oven in there. We've been complaining about this neighborhood for years, nothing ever changes. Oh my god, please hurry.", delay: 2600 }
    ]
  },
  "ORMEWOOD PK": {
    context: "Teen calling a friend · Est. 15 seconds",
    audio: "ORMEWOOD PARK",
    lines: [
      { speaker: "CALLER", text: "Hey you want to go to the park by the creek later?", delay: 0 },
      { speaker: "FRIEND", text: "It's supposed to be 94 today.", delay: 2400 },
      { speaker: "CALLER", text: "Just bring water, there's plenty of shade out there, we'll be fine.", delay: 4200 }
    ]
  },
  "MT. PARAN": {
    context: "Resident calling a neighbor · Est. 15 seconds",
    audio: "MT. PARAN",
    lines: [
      { speaker: "CALLER",   text: "Hey, you got a fan I can borrow? My old AC is working overtime today.", delay: 0 },
      { speaker: "NEIGHBOR", text: "Yeah of course, come grab it.", delay: 3600 }
    ]
  },
  "PLEASANT HILL": {
    context: "Friend calling friend · Est. 10 seconds",
    audio: "PLEASANT HILL",
    lines: [
      { speaker: "CALLER", text: "Hey! We're doing a neighborhood cookout Saturday, come through. And don't worry about the heat, if it gets too much we'll just head inside. The house stays cool.", delay: 0 }
    ]
  },
};

const audioDurations = {
  "BANKHEAD":      15000,
  "ENGLISH AVE":   13000,
  "GEORGIA TECH":  15000,
  "KIRKWOOD":      18000,
  "EAST ATLANTA":  13000,
  "CASCADE RD":    15000,
  "GREENBRIAR":    18000,
  "WASHINGTON PK": 13000,
  "PITTSBURGH":    18000,
  "ORMEWOOD PK":    9000,
  "MT. PARAN":      6000,
  "PLEASANT HILL": 10000,
};

// 5x3 grid: 12 fan cells + 3 instruction cells in center of row 1
const neighborhoods = [
  { name: "BANKHEAD",      col: 0, row: 0, tier: HIGH    },
  { name: "ENGLISH AVE",   col: 1, row: 0, tier: HIGH    },
  { name: "GEORGIA TECH",  col: 2, row: 0, tier: MINIMAL },
  { name: "KIRKWOOD",      col: 3, row: 0, tier: MEDIUM  },
  { name: "EAST ATLANTA",  col: 4, row: 0, tier: MEDIUM  },
  { name: "CASCADE RD",    col: 0, row: 1, tier: MEDIUM  },
  // cols 1,2,3 row 1 = instruction panel (no neighborhood)
  { name: "GREENBRIAR",    col: 4, row: 1, tier: MEDIUM  },
  { name: "WASHINGTON PK", col: 0, row: 2, tier: HIGH    },
  { name: "PITTSBURGH",    col: 1, row: 2, tier: HIGH    },
  { name: "ORMEWOOD PK",   col: 2, row: 2, tier: MINIMAL },
  { name: "MT. PARAN",     col: 3, row: 2, tier: MEDIUM  },
  { name: "PLEASANT HILL", col: 4, row: 2, tier: MINIMAL },
];

let cellStates = {};
function initCellStates() {
  for (let n of neighborhoods) {
    cellStates[n.name] = {
      angle: 0, speed: 0, done: false,
      jackCount: 0,
      expandT: 0, expanding: false, shrinking: false,
      transcriptLine: -1, transcriptTimers: [],
      lineAlphas: [],
    };
  }
}
initCellStates();

let cellW, cellH;
let fullscreenCell = null;
let globalArmsUp = false;
let pg;

// State
let appState = 'running';
let completionTime = 0;
const COMPLETION_DISPLAY_MS = 15000;

// Visual boost per tier (how fast fan spins visually per jack)
const VISUAL_BOOST = { MINIMAL: 0.06, MEDIUM: 0.035, HIGH: 0.018 };
const DAMPING = 0.97;

// Jacks needed to trigger story
const JACKS_NEEDED = { MINIMAL: 5, MEDIUM: 10, HIGH: 20 };

function tierKey(tier) {
  if (tier === MINIMAL) return 'MINIMAL';
  if (tier === HIGH)    return 'HIGH';
  return 'MEDIUM';
}

function preload() {
  for (let key in transcripts) {
    sounds[key] = loadSound("Phonecalls/" + transcripts[key].audio + ".mp3");
  }
}

function setup() {
  createCanvas(floor(CANVAS_W * scaleFactor), floor(CANVAS_H * scaleFactor));
  pg = createGraphics(CANVAS_W, CANVAS_H);
  cellW = CANVAS_W / COLS;
  cellH = CANVAS_H / ROWS;
  video = createCapture(VIDEO);
  video.size(CANVAS_W, CANVAS_H);
  video.hide();
  bodyPose = ml5.bodyPose("MoveNet", { flipped: true, multiPose: true }, modelReady);
  textFont("Arial");
  pg.textFont("Arial");
}

function modelReady() { bodyPose.detect(video, gotPoses); }
function gotPoses(r)  { poses = r; bodyPose.detect(video, gotPoses); }

function keyPressed() {
  if (keyCode === UP_ARROW)        scaleFactor += SCALE_STEP;
  else if (keyCode === DOWN_ARROW) scaleFactor = max(scaleFactor - SCALE_STEP, 0.05);
  resizeCanvas(floor(CANVAS_W * scaleFactor), floor(CANVAS_H * scaleFactor));
}

function getKeypoints(pose) {
  let kps = {};
  let vw = (video && video.width  > 0) ? video.width  : CANVAS_W;
  let vh = (video && video.height > 0) ? video.height : CANVAS_H;
  for (let kp of pose.keypoints) {
    kps[kp.name] = {
      x: kp.x * (CANVAS_W / vw),
      y: kp.y * (CANVAS_H / vh),
      confidence: kp.confidence || kp.score
    };
  }
  return kps;
}

function draw() {
  pulseT += 0.05;
  figT += 0.025 * figDir;
  if (figT >= 1) { figT = 1; figDir = -1; }
  if (figT <= 0) { figT = 0; figDir =  1; }

  pg.background(0);

  if (appState === 'completed') {
    drawEndingScreen();
  } else {
    drawGrid();
    drawInstructionPanel();

    if (!fullscreenCell) {
      for (let pose of poses) drawShadow(getKeypoints(pose));
      detectGlobalJumpingJack();
      updateFanSpeeds();
    }

    if (fullscreenCell) drawFullscreen(fullscreenCell);
  }

  background(0);
  image(pg, 0, 0, width, height);
}

// ── Grid ────────────────────────────────────────────────────

function drawGrid() {
  // Draw instruction cells black first
  for (let [col, row] of INSTRUCTION_CELLS) {
    pg.fill(0);
    pg.noStroke();
    pg.rect(col * cellW, row * cellH, cellW, cellH);
  }

  // Draw fan cells
  for (let n of neighborhoods) {
    if (!fullscreenCell || fullscreenCell.name !== n.name) {
      drawCell(n);
    }
  }
}

// ── Instruction Panel (3 center cells merged) ────────────────

function drawInstructionPanel() {
  let panelX = 1 * cellW;
  let panelY = 1 * cellH;
  let panelW = 3 * cellW;
  let panelH = cellH;

  pg.noStroke();

  let ease = figT < 0.5 ? 2*figT*figT : -1+(4-2*figT)*figT;

  // Figure on left third
  let figSize = panelH * 0.62;
  let figCX = panelX + panelW * 0.18;
  let figX = figCX - figSize * 0.5;
  let figY = panelY + (panelH - figSize) / 2;
  drawGuideFigure(figX, figY, figSize, ease);

  // Text block on right two thirds
  let txtX = panelX + panelW * 0.36;
  let maxW = panelW * 0.60;

  // Main instruction line
  pg.fill(255);
  pg.textAlign(LEFT, TOP);
  pg.textStyle(BOLD);
  pg.textSize(panelH * 0.115);
  pg.textLeading(panelH * 0.155);
  pg.textWrap(WORD);
  pg.text("As you do jumping jacks, your movement powers the fans.", txtX, panelY + panelH * 0.12, maxW);

  // Sub text - white italic
  pg.fill(255);
  pg.textStyle(ITALIC);
  pg.textSize(panelH * 0.085);
  pg.textLeading(panelH * 0.12);
  pg.text("Some neighborhoods are harder to cool.", txtX, panelY + panelH * 0.56, maxW);
}

function drawGuideFigure(x, y, size, ease) {
  let cx = x + size * 0.5;
  let headY = y + size * 0.08;
  let shoulderY = y + size * 0.26;
  let hipY = y + size * 0.60;
  let armAngle = lerp(PI / 5, -PI / 1.5, ease);
  let legSpread = lerp(0, PI * 0.22, ease);
  let pulse = sin(pulseT) * 0.5 + 0.5;
  let fc = color(255, 120, 0);

  pg.noStroke();
  pg.fill(red(fc), green(fc), blue(fc), 40 + pulse*30); pg.circle(cx, headY, size*0.32);
  pg.fill(red(fc), green(fc), blue(fc), 80 + pulse*40); pg.circle(cx, headY, size*0.24);
  pg.fill(red(fc), green(fc), blue(fc));                pg.circle(cx, headY, size*0.16);
  pg.fill(255, 255, 255, 180);                          pg.circle(cx, headY, size*0.08);
  pg.fill(255);                                         pg.circle(cx, headY, size*0.03);

  pg.stroke(red(fc), green(fc), blue(fc), 220);
  pg.strokeCap(ROUND);
  pg.strokeWeight(size * 0.09);
  pg.line(cx, shoulderY, cx, hipY);

  let armLen = size * 0.3;
  pg.strokeWeight(size * 0.08);
  pg.line(cx, shoulderY, cx - sin(armAngle)*armLen*0.6, shoulderY + cos(armAngle)*armLen);
  pg.line(cx, shoulderY, cx + sin(armAngle)*armLen*0.6, shoulderY + cos(armAngle)*armLen);

  let legLen = size * 0.38;
  pg.line(cx, hipY, cx - sin(legSpread)*legLen*0.8, hipY + cos(legSpread)*legLen);
  pg.line(cx, hipY, cx + sin(legSpread)*legLen*0.8, hipY + cos(legSpread)*legLen);
  pg.noStroke();
}

// ── Jumping Jack Detection ───────────────────────────────────

function detectGlobalJumpingJack() {
  let anyBothUp = false;
  for (let pose of poses) {
    let kps = getKeypoints(pose);
    let lw = kps["left_wrist"],    rw = kps["right_wrist"];
    let ls = kps["left_shoulder"], rs = kps["right_shoulder"];
    if (!lw || !rw || !ls || !rs) continue;
    if (lw.confidence < 0.2 || rw.confidence < 0.2 ||
        ls.confidence < 0.2 || rs.confidence < 0.2) continue;
    if (lw.y < ls.y && rw.y < rs.y) { anyBothUp = true; break; }
  }

  if (anyBothUp && !globalArmsUp) {
    globalArmsUp = true;
  } else if (!anyBothUp && globalArmsUp) {
    globalArmsUp = false;
    for (let n of neighborhoods) {
      let s = cellStates[n.name];
      if (!s.done) {
        let tk = tierKey(n.tier);
        s.jackCount++;
        s.speed += VISUAL_BOOST[tk];
      }
    }
  }
}

// ── Fan Speed Update & Story Trigger ────────────────────────

function updateFanSpeeds() {
  for (let n of neighborhoods) {
    let s = cellStates[n.name];
    if (!s.done) { s.angle += s.speed; s.speed *= DAMPING; }
  }

  if (fullscreenCell) return;

  // Check each tier for threshold
  for (let tierObj of [MINIMAL, MEDIUM, HIGH]) {
    let tk     = tierKey(tierObj);
    let needed = JACKS_NEEDED[tk];
    let undone = neighborhoods.filter(n => n.tier === tierObj && !cellStates[n.name].done);
    if (undone.length === 0) continue;

    let reached = undone.filter(n => cellStates[n.name].jackCount >= needed);
    if (reached.length === 0) continue;

    // Pick random one from this tier to trigger
    let chosen = undone[floor(random(undone.length))];

    // Reset jack counts and speeds for all others
    for (let n of neighborhoods) {
      if (!cellStates[n.name].done && n.name !== chosen.name) {
        cellStates[n.name].speed    = 0;
        cellStates[n.name].jackCount = 0;
      }
    }

    triggerStory(chosen);
    break;
  }
}

// ── Story Trigger ────────────────────────────────────────────

function triggerStory(n) {
  let s = cellStates[n.name];
  s.done      = true;
  s.expanding = true;
  s.expandT   = 0;
  fullscreenCell = n;

  let tr = transcripts[n.name];
  if (!tr) return;

  s.lineAlphas = tr.lines.map(() => 0);
  let expandDuration = 1200;

  if (sounds[n.name] && sounds[n.name].isLoaded()) {
    setTimeout(() => sounds[n.name].play(), expandDuration);
  }

  tr.lines.forEach((line, i) => {
    let t = setTimeout(() => { s.transcriptLine = i; }, expandDuration + line.delay);
    s.transcriptTimers.push(t);
  });

  let audioDur = audioDurations[n.name] || 15000;
  let shrinkDelay = expandDuration + audioDur;

  setTimeout(() => { s.expanding = false; s.shrinking = true; }, shrinkDelay);
  setTimeout(() => {
    s.shrinking      = false;
    s.expandT        = 0;
    s.transcriptLine = -1;
    s.lineAlphas     = [];
    fullscreenCell   = null;
    if (neighborhoods.every(n2 => cellStates[n2.name].done)) {
      completionTime = millis();
      appState = 'completed';
    }
  }, shrinkDelay + 900);
}

// ── Fullscreen Story ─────────────────────────────────────────

function drawFullscreen(n) {
  let s = cellStates[n.name];
  if (s.expanding && s.expandT < 1) s.expandT = min(s.expandT + 0.04, 1);
  if (s.shrinking && s.expandT > 0) s.expandT = max(s.expandT - 0.05, 0);

  let t  = easeInOut(s.expandT);
  let tx = n.col * cellW, ty = n.row * cellH;
  let rx = lerp(tx, 0, t), ry = lerp(ty, 0, t);
  let rw = lerp(cellW, CANVAS_W, t);
  let rh = lerp(cellH, CANVAS_H, t);

  // Tinted white background
  let bg = lerpColor(color(n.tier.fan), color(255), 0.85);
  pg.fill(red(bg), green(bg), blue(bg));
  pg.noStroke();
  pg.rect(rx, ry, rw, rh);

  if (t > 0.85) {
    let tr = transcripts[n.name];
    if (!tr) return;

    let alpha = map(t, 0.85, 1.0, 0, 255);
    for (let i = 0; i < tr.lines.length; i++) {
      if (i <= s.transcriptLine) s.lineAlphas[i] = min(s.lineAlphas[i] + 8, alpha);
    }

    let speakerH = CANVAS_H * 0.055;
    let tSize    = CANVAS_H * 0.048;
    let lineGap  = CANVAS_H * 0.02;
    let blockGap = CANVAS_H * 0.055;
    let padX     = CANVAS_W * 0.1;
    let headerH  = CANVAS_H * 0.22;

    let totalH = 0;
    for (let i = 0; i < tr.lines.length; i++) {
      let wraps = max(0, floor(tr.lines[i].text.length / 80));
      totalH += speakerH + tSize * (1.4 + wraps * 1.4) + lineGap;
      if (i < tr.lines.length - 1) totalH += blockGap;
    }
    let startY = headerH + max(0, (CANVAS_H - headerH - totalH) / 2) * 0.6;

    // Use darker shade for teal (low tier) so title is readable on light bg
    let ringHex = n.tier.ring;
    let titleC = (ringHex === "#36E6D9") ? color(0, 150, 136) : color(ringHex);
    pg.fill(red(titleC), green(titleC), blue(titleC), alpha);
    pg.noStroke(); pg.textAlign(LEFT, TOP); pg.textStyle(BOLD);
    pg.textSize(CANVAS_H * 0.06);
    pg.text(n.name, padX, CANVAS_H * 0.06);

    pg.fill(40, 40, 40, alpha * 0.55);
    pg.textStyle(NORMAL); pg.textSize(CANVAS_H * 0.032);
    pg.text(tr.context, padX, CANVAS_H * 0.14);

    let yPos = startY;
    for (let i = 0; i < tr.lines.length; i++) {
      let la = s.lineAlphas[i];
      pg.fill(20, 20, 20, la);
      pg.textStyle(BOLD); pg.textSize(CANVAS_H * 0.032); pg.textAlign(LEFT, TOP);
      pg.text(tr.lines[i].speaker, padX, yPos);
      yPos += speakerH;

      pg.fill(20, 20, 20, la);
      pg.textStyle(NORMAL); pg.textSize(tSize); pg.textWrap(WORD);
      pg.text(tr.lines[i].text, padX, yPos, CANVAS_W * 0.8);

      let wraps = max(0, floor(tr.lines[i].text.length / 80));
      yPos += tSize * (1.4 + wraps * 1.4) + lineGap;
      if (i < tr.lines.length - 1) yPos += blockGap;
    }
  }
}

// ── Ending Screen ────────────────────────────────────────────

function drawEndingScreen() {
  let elapsed = millis() - completionTime;
  pg.background(10);

  // Ghost grid
  for (let n of neighborhoods) {
    let c = color(n.tier.fan);
    pg.fill(red(c), green(c), blue(c), 12); pg.noStroke();
    pg.rect(n.col * cellW, n.row * cellH, cellW, cellH);
  }

  let masterAlpha = constrain(map(elapsed, 0, 2000, 0, 255), 0, 255);

  pg.noStroke();
  pg.fill(255, 255, 255, masterAlpha);
  pg.textAlign(CENTER, CENTER);
  pg.textStyle(NORMAL);
  pg.textSize(CANVAS_H * 0.042);
  pg.textLeading(CANVAS_H * 0.065);
  pg.text("Atlanta's heat does not fall equally.\nSome neighborhoods have always lived in it.\nOthers have always had the option to leave.", CANVAS_W / 2, CANVAS_H / 2 - CANVAS_H * 0.18);

  pg.stroke(230, 57, 70, masterAlpha * 0.6);
  pg.strokeWeight(2);
  let lineLen = CANVAS_W * 0.06;
  pg.line(CANVAS_W/2 - lineLen, CANVAS_H/2 - CANVAS_H*0.02, CANVAS_W/2 + lineLen, CANVAS_H/2 - CANVAS_H*0.02);
  pg.noStroke();

  let qAlpha = constrain(map(elapsed, 800, 3000, 0, 255), 0, 255);
  pg.textStyle(BOLD);
  pg.textSize(CANVAS_H * 0.082);
  pg.textLeading(CANVAS_H * 0.11);

  pg.fill(255, 255, 255, qAlpha);
  pg.textAlign(CENTER, CENTER);
  pg.text("Despite living under the same sun,", CANVAS_W / 2, CANVAS_H/2 + CANVAS_H*0.06);

  let line2a = "why are certain communities left to ";
  let line2b = "burn?";
  pg.textAlign(LEFT, CENTER);
  let l2aW = pg.textWidth(line2a);
  let l2bW = pg.textWidth(line2b);
  let l2X  = CANVAS_W / 2 - (l2aW + l2bW) / 2;
  pg.fill(255, 255, 255, qAlpha);
  pg.text(line2a, l2X, CANVAS_H/2 + CANVAS_H*0.175);
  pg.fill(230, 57, 70, qAlpha);
  pg.text(line2b, l2X + l2aW, CANVAS_H/2 + CANVAS_H*0.175);

  if (elapsed > COMPLETION_DISPLAY_MS - 5000) {
    let ctAlpha = constrain(map(elapsed, COMPLETION_DISPLAY_MS-5000, COMPLETION_DISPLAY_MS-3000, 0, 120), 0, 120);
    let remaining = max(0, ceil((COMPLETION_DISPLAY_MS - elapsed) / 1000));
    pg.fill(255, 255, 255, ctAlpha);
    pg.textStyle(NORMAL); pg.textSize(CANVAS_H * 0.022);
    pg.textAlign(CENTER, CENTER); pg.noStroke();
    pg.text("Resetting in " + remaining + "...", CANVAS_W/2, CANVAS_H - CANVAS_H*0.06);
  }

  if (elapsed >= COMPLETION_DISPLAY_MS) resetAll();
}

// ── Shadow / Skeleton ────────────────────────────────────────

function drawShadow(kps) {
  let connections = [
    ["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],
    ["left_elbow","left_wrist"],["right_shoulder","right_elbow"],
    ["right_elbow","right_wrist"],["left_shoulder","left_hip"],
    ["right_shoulder","right_hip"],["left_hip","right_hip"],
    ["left_hip","left_knee"],["left_knee","left_ankle"],
    ["right_hip","right_knee"],["right_knee","right_ankle"],
  ];
  pg.stroke(255, 120, 0, 200); pg.strokeWeight(18); pg.strokeCap(ROUND);
  for (let [a, b] of connections) {
    if (kps[a] && kps[b] && kps[a].confidence > 0.2 && kps[b].confidence > 0.2)
      pg.line(kps[a].x, kps[a].y, kps[b].x, kps[b].y);
  }
  if (kps["nose"] && kps["nose"].confidence > 0.2) {
    let hx = kps["nose"].x, hy = kps["nose"].y;
    let pulse = sin(pulseT) * 0.5 + 0.5;
    let oc = color(255, 120, 0);
    pg.noStroke();
    pg.fill(red(oc),green(oc),blue(oc), 40+pulse*30); pg.circle(hx,hy,160);
    pg.fill(red(oc),green(oc),blue(oc), 80+pulse*40); pg.circle(hx,hy,110);
    pg.fill(red(oc),green(oc),blue(oc), 255);          pg.circle(hx,hy,70);
    pg.fill(255,255,255,180);                           pg.circle(hx,hy,36);
    pg.fill(255);                                       pg.circle(hx,hy,14);
  }
}

// ── Cell & Fan Draw ──────────────────────────────────────────

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

function drawCell(n) {
  let s = cellStates[n.name];
  let x = n.col * cellW, y = n.row * cellH;

  // White background for all fan cells
  pg.fill(255);
  pg.noStroke();
  pg.rect(x, y, cellW, cellH);

  let fanX = x + cellW / 2;
  let fanY = y + cellH * 0.42;
  let r    = min(cellW, cellH) * 0.30;

  // Progress ring
  if (!s.done) {
    let tk     = tierKey(n.tier);
    let needed = JACKS_NEEDED[tk];
    let prog   = constrain(s.jackCount / needed, 0, 1);
    let rc     = color(n.tier.ring);
    pg.noFill();
    pg.stroke(red(rc), green(rc), blue(rc), 40);
    pg.strokeWeight(12);
    pg.circle(fanX, fanY, r * 2.6);
    pg.stroke(red(rc), green(rc), blue(rc), 220);
    pg.arc(fanX, fanY, r * 2.6, r * 2.6, -HALF_PI, -HALF_PI + TWO_PI * prog);
    pg.noStroke();
  }

  drawFan(fanX, fanY, r, n.tier.bg, n.tier.fan, s.angle);

  // Neighborhood name
  pg.fill(color(n.tier.fan));
  pg.noStroke();
  pg.textAlign(CENTER, TOP);
  pg.textStyle(BOLD);
  pg.textSize(cellH * 0.065);
  pg.text(n.name, fanX, fanY + r + cellH * 0.055);

  if (s.done) {
    pg.fill(0, 0, 0, 150);
    pg.rect(x, y, cellW, cellH);
  }


}

function drawFan(cx, cy, r, bgCol, fanCol, angle) {
  pg.push(); pg.translate(cx, cy);
  let fc = color(fanCol);
  let bc = color(255); // always white bg inside ring

  pg.fill(fc); pg.noStroke(); pg.circle(0, 0, r * 2.22);
  pg.fill(bc); pg.circle(0, 0, r * 2.0);

  pg.push(); pg.rotate(angle);
  for (let i = 0; i < 5; i++) {
    pg.push(); pg.rotate((TWO_PI / 5) * i);
    pg.fill(fc); pg.noStroke();
    pg.ellipse(0, -r*0.52, r*0.46, r*0.95);
    pg.fill(red(bc), green(bc), blue(bc), 100);
    pg.ellipse(0, -r*0.52, r*0.24, r*0.66);
    pg.pop();
  }
  pg.pop();

  pg.fill(fc); pg.circle(0, 0, r*0.38);
  pg.fill(bc); pg.circle(0, 0, r*0.25);
  pg.fill(fc); pg.circle(0, 0, r*0.1);
  pg.pop();
}

// ── Reset ────────────────────────────────────────────────────

function resetAll() {
  initCellStates();
  fullscreenCell = null;
  globalArmsUp   = false;
  figT           = 0;
  figDir         = 1;
  appState       = 'running';
}
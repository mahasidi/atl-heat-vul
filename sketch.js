const CANVAS_W = 3072;
const CANVAS_H = 1280;
const COLS = 5;
const ROWS = 3;

let video;
let bodyPose;
let poses = [];
let pulseT = 0;

let scaleFactor = 0.4;
const SCALE_STEP = 0.05;

const CELL_STABILITY = 10;
const MINIMAL = { bg: "#EAEAEA", fan: "#FF3366", jacksNeeded: 5  };
const MEDIUM   = { bg: "#FF9F1C", fan: "#1C6EFF", jacksNeeded: 10 };
const HIGH     = { bg: "#E63946", fan: "#36E6D9", jacksNeeded: 20 };

const transcripts = {
  "OAKCLIFF":      { context: "New resident calling a friend · Est. 15 seconds", lines: [
    { speaker: "CALLER", text: "Honestly my first Atlanta summer and I don't understand what people complain about. My building stays cool, I go outside, it's hot but I'm fine. I've never even thought about it." }
  ]},
  "KINGS FOREST":  { context: "Older resident calling their adult child · Est. 15 seconds", lines: [
    { speaker: "CALLER", text: "I just got back from my walk. Those big old trees on the main stretch keep it so cool, I forget it's August out here. You should come visit before summer's over." }
  ]},
  "ORMEWOOD PK":   { context: "Teen calling a friend · Est. 15 seconds", lines: [
    { speaker: "CALLER", text: "Hey you want to go to the park by the creek later?" },
    { speaker: "FRIEND", text: "It's supposed to be 94 today." },
    { speaker: "CALLER", text: "Just bring water, there's plenty of shade out there, we'll be fine." }
  ]},
  "PLEASANT HILL": { context: "Friend calling friend · Est. 10 seconds", lines: [
    { speaker: "CALLER", text: "Hey! We're doing a neighborhood cookout Saturday, come through. And don't worry about the heat, if it gets too much we'll just head inside. The house stays cool." }
  ]},
  "GEORGIA TECH":  { context: "Facilities manager leaving a voicemail · Est. 15 seconds", lines: [
    { speaker: "CALLER", text: "HVAC upgrade is done across the whole engineering quad. Walked through at noon today, felt like a different city in there. Students won't feel the summer at all." }
  ]},
  "MT. PARAN":     { context: "Resident calling a neighbor · Est. 15 seconds", lines: [
    { speaker: "CALLER",   text: "Hey, you got a fan I can borrow? My old AC is working overtime today, I've been feeling uncomfortable all day." },
    { speaker: "NEIGHBOR", text: "Yeah of course, come grab it." }
  ]},
  "EAST ATLANTA":  { context: "Resident calling 311 · Est. 20 seconds", lines: [
    { speaker: "OPERATOR", text: "Thank you for calling 311, how can I help you?" },
    { speaker: "CALLER",   text: "The cooling center on Gresham is packed every afternoon. People coming in just to sit somewhere that isn't dangerous. We need more space before somebody collapses." }
  ]},
  "KIRKWOOD":      { context: "Longtime resident calling a community aid line · Est. 20 seconds", lines: [
    { speaker: "OPERATOR", text: "Hi, thank you for calling Kirkwood Cares, how can I help you?" },
    { speaker: "CALLER",   text: "My bedroom was 91 degrees at midnight. I'm waking up soaked every night. I've lived on this street 47 years and I can't afford to fix my roof. I just need to sleep." }
  ]},
  "LINDRIDGE":     { context: "Resident calling Georgia Power · Est. 20 seconds", lines: [
    { speaker: "REP",    text: "Thank you for calling Georgia Power, how can I assist you today?" },
    { speaker: "CALLER", text: "My bill has been climbing every summer for three years. This month I can barely cover it and I have children in this house. What is going on?" }
  ]},
  "CASCADE RD":    { context: "Resident calling apartment management · Est. 20 seconds", lines: [
    { speaker: "CALLER",   text: "My AC has been out for eight days. Last night it was 88 degrees inside at 11pm and my kid couldn't sleep. Eight days." },
    { speaker: "MANAGER",  text: "We're waiting on a part, it'll come in next week. Hold tight." }
  ]},
  "GREENBRIAR":    { context: "Resident calling 311 · Est. 25 seconds", lines: [
    { speaker: "OPERATOR", text: "Thank you for calling 311, how can I help you?" },
    { speaker: "CALLER",   text: "With this heat wave, this summer has been a nightmare. My neighbor's kid has been in and out of the hospital with her asthma and my elderly neighbor collapsed from heat exhaustion last week. Is there anything, any funding, any support at all?" }
  ]},
  "BANKHEAD":      { context: "Adult child calling a sibling · Est. 20 seconds", lines: [
    { speaker: "CALLER",  text: "I just got to his house. He's been in one room all day with the door closed trying to keep the cool air in. It's one room. The rest of the house is suffocating." },
    { speaker: "SIBLING", text: "We need to start putting money together for another unit before this gets worse." }
  ]},
  "WASHINGTON PK": { context: "Family member calling a relative · Est. 20 seconds", lines: [
    { speaker: "CALLER", text: "Mama, Ann told me you've been turning the AC off because the bill got too high. You cannot do that in this heat. Please turn it back on." },
    { speaker: "MAMA",   text: "I know it's hot baby, but I still got groceries to buy this week." }
  ]},
  "ENGLISH AVE":   { context: "Resident calling a family member · Est. 20 seconds", lines: [
    { speaker: "CALLER", text: "It's 4pm and I just checked on Grandma. She had a cold wet towel on her neck and she was sitting completely still trying not to generate any body heat. It's 94 degrees in her living room. We need to get her out of here." }
  ]},
  "PITTSBURGH":    { context: "Neighbor calling 911 · Est. 25 seconds", lines: [
    { speaker: "DISPATCHER", text: "911 what's your emergency?" },
    { speaker: "CALLER",     text: "I need help, my neighbor Patricia, she's 65 and lives alone. I came to check on her and she's not responding. It's like an oven in there. We've been complaining about this neighborhood for years, nothing ever changes. Oh my god, please hurry." }
  ]}
};

const neighborhoods = [
  { name: "MT. PARAN",     col: 0, row: 0, tier: MEDIUM  },
  { name: "PLEASANT HILL", col: 1, row: 0, tier: MINIMAL },
  { name: "OAKCLIFF",      col: 2, row: 0, tier: MINIMAL },
  { name: "KINGS FOREST",  col: 3, row: 0, tier: MINIMAL },
  { name: "LINDRIDGE",     col: 4, row: 0, tier: MEDIUM  },
  { name: "BANKHEAD",      col: 0, row: 1, tier: HIGH    },
  { name: "ENGLISH AVE",   col: 1, row: 1, tier: HIGH    },
  { name: "GEORGIA TECH",  col: 2, row: 1, tier: MINIMAL },
  { name: "KIRKWOOD",      col: 3, row: 1, tier: MEDIUM  },
  { name: "EAST ATLANTA",  col: 4, row: 1, tier: MEDIUM  },
  { name: "CASCADE RD",    col: 0, row: 2, tier: MEDIUM  },
  { name: "GREENBRIAR",    col: 1, row: 2, tier: MEDIUM  },
  { name: "WASHINGTON PK", col: 2, row: 2, tier: HIGH    },
  { name: "PITTSBURGH",    col: 3, row: 2, tier: HIGH    },
  { name: "ORMEWOOD PK",   col: 4, row: 2, tier: MINIMAL },
];

let cellStates = {};
for (let n of neighborhoods) {
  cellStates[n.name] = {
    angle: 0, speed: 0, done: false,
    jackCount: 0,
    expanding: false, shrinking: false, expandT: 0,
    transcriptLine: -1, transcriptTimers: [],
    lineAlphas: [],
  };
}

let personStates = {};
let cellW, cellH;
let fullscreenCell = null;
let completionQueue = []; // queue for simultaneous completions
let pg;

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

function modelReady() {
  bodyPose.detect(video, gotPoses);
}

function gotPoses(results) {
  poses = results;
  bodyPose.detect(video, gotPoses);
}

function keyPressed() {
  if (keyCode === UP_ARROW) scaleFactor += SCALE_STEP;
  else if (keyCode === DOWN_ARROW) scaleFactor = max(scaleFactor - SCALE_STEP, 0.05);
  resizeCanvas(floor(CANVAS_W * scaleFactor), floor(CANVAS_H * scaleFactor));
}

function getCell(x, y) {
  let col = floor(x / cellW);
  let row = floor(y / cellH);
  col = constrain(col, 0, COLS - 1);
  row = constrain(row, 0, ROWS - 1);
  return neighborhoods.find(n => n.col === col && n.row === row);
}

function getKeypoints(pose) {
  let kps = {};
  for (let kp of pose.keypoints) {
    let x = kp.x * (CANVAS_W / video.width);
    let y = kp.y * (CANVAS_H / video.height);
    kps[kp.name] = { x, y, confidence: kp.confidence || kp.score };
  }
  return kps;
}

function draw() {
  pulseT += 0.05;

  pg.background(0);

  // Update fan physics
  for (let n of neighborhoods) {
    let s = cellStates[n.name];
    if (!s.done) {
      s.angle += s.speed;
      s.speed *= 0.97;
    }
  }

  // Draw grid
  for (let n of neighborhoods) {
    if (!fullscreenCell || fullscreenCell.name !== n.name) {
      drawCell(n);
    }
  }

  // Process poses
  if (!fullscreenCell) {
    let activeIds = new Set(poses.map((_, i) => i));
    for (let id in personStates) {
      if (!activeIds.has(parseInt(id))) delete personStates[id];
    }

    for (let i = 0; i < poses.length; i++) {
      let kps = getKeypoints(poses[i]);
      if (!personStates[i]) {
        personStates[i] = {
          armsUp: false,
          currentCell: null,
          cellBuffer: null,
          cellBufferCount: 0,
        };
      }
      drawShadow(kps, personStates[i]);
      detectCell(kps, personStates[i]);
      detectJumpingJack(kps, personStates[i]);
    }
  }

  if (fullscreenCell) {
    drawFullscreen(fullscreenCell);
  }

  background(0);
  image(pg, 0, 0, width, height);
}

function drawShadow(kps, ps) {
  let connections = [
    ["left_shoulder","right_shoulder"],["left_shoulder","left_elbow"],
    ["left_elbow","left_wrist"],["right_shoulder","right_elbow"],
    ["right_elbow","right_wrist"],["left_shoulder","left_hip"],
    ["right_shoulder","right_hip"],["left_hip","right_hip"],
    ["left_hip","left_knee"],["left_knee","left_ankle"],
    ["right_hip","right_knee"],["right_knee","right_ankle"],
  ];

  pg.stroke(0, 0, 0, 180);
  pg.strokeWeight(18);
  pg.strokeCap(ROUND);
  for (let [a, b] of connections) {
    if (kps[a] && kps[b] && kps[a].confidence > 0.2 && kps[b].confidence > 0.2) {
      pg.line(kps[a].x, kps[a].y, kps[b].x, kps[b].y);
    }
  }

  if (kps["nose"] && kps["nose"].confidence > 0.2) {
    let hx = kps["nose"].x;
    let hy = kps["nose"].y;
    let pulse = sin(pulseT) * 0.5 + 0.5;
    let orbColor = (ps && ps.currentCell) ? ps.currentCell.tier.fan : "#FF3366";
    let oc = color(orbColor);

    pg.noStroke();
    pg.fill(red(oc), green(oc), blue(oc), 40 + pulse * 30); pg.circle(hx, hy, 160);
    pg.fill(red(oc), green(oc), blue(oc), 80 + pulse * 40); pg.circle(hx, hy, 110);
    pg.fill(red(oc), green(oc), blue(oc), 255);             pg.circle(hx, hy, 70);
    pg.fill(255, 255, 255, 180);                            pg.circle(hx, hy, 36);
    pg.fill(255, 255, 255, 255);                            pg.circle(hx, hy, 14);
  }
}

function detectCell(kps, ps) {
  let nose = kps["nose"];
  if (!nose || nose.confidence < 0.2) return;
  let candidate = getCell(nose.x, nose.y);
  if (!candidate) return;

  if (ps.cellBuffer && ps.cellBuffer.name === candidate.name) {
    ps.cellBufferCount++;
  } else {
    ps.cellBuffer = candidate;
    ps.cellBufferCount = 1;
  }

  if (ps.cellBufferCount >= CELL_STABILITY) {
    if (!ps.currentCell || ps.currentCell.name !== candidate.name) {
      ps.currentCell = candidate;
    }
  }
}

function detectJumpingJack(kps, ps) {
  if (!ps.currentCell) return;
  let s = cellStates[ps.currentCell.name];
  if (s.done) return;

  let lw = kps["left_wrist"];
  let rw = kps["right_wrist"];
  let ls = kps["left_shoulder"];
  let rs = kps["right_shoulder"];

  let allValid = lw && rw && ls && rs &&
    lw.confidence > 0.2 && rw.confidence > 0.2 &&
    ls.confidence > 0.2 && rs.confidence > 0.2;

  if (!allValid) return;

  let bothUp = lw.y < ls.y && rw.y < rs.y;

  if (bothUp && !ps.armsUp) {
    ps.armsUp = true;
  } else if (!bothUp && ps.armsUp) {
    ps.armsUp = false;
    s.jackCount++;
    let boost = TWO_PI / ps.currentCell.tier.jacksNeeded;
    s.speed += boost;
    if (s.jackCount >= ps.currentCell.tier.jacksNeeded) {
      queueCompletion(ps.currentCell);
    }
  }
}

function queueCompletion(n) {
  let s = cellStates[n.name];
  if (s.done) return;
  s.done = true;
  s.speed = 0;

  // Add to queue. If nothing is playing, start immediately.
  completionQueue.push(n);
  if (!fullscreenCell) {
    playNextCompletion();
  }
}

function playNextCompletion() {
  if (completionQueue.length === 0) return;
  let n = completionQueue.shift();
  fullscreenCell = n;

  let s = cellStates[n.name];
  s.expanding = true;
  s.expandT = 0;

  let tr = transcripts[n.name];
  if (!tr) return;

  s.lineAlphas = tr.lines.map(() => 0);

  let baseDelay = 1200;
  tr.lines.forEach((line, i) => {
    setTimeout(() => { s.transcriptLine = i; }, baseDelay + i * 2500);
  });

  let shrinkDelay = baseDelay + tr.lines.length * 2500 + 2000;
  setTimeout(() => { s.expanding = false; s.shrinking = true; }, shrinkDelay);
  setTimeout(() => {
    s.shrinking = false;
    s.expandT = 0;
    s.transcriptLine = -1;
    s.lineAlphas = [];
    fullscreenCell = null;
    // Play next in queue if any
    playNextCompletion();
  }, shrinkDelay + 900);
}

function drawFullscreen(n) {
  let s = cellStates[n.name];

  if (s.expanding && s.expandT < 1) s.expandT = min(s.expandT + 0.04, 1);
  if (s.shrinking && s.expandT > 0) s.expandT = max(s.expandT - 0.05, 0);

  let t = easeInOut(s.expandT);
  let tx = n.col * cellW;
  let ty = n.row * cellH;
  let rx = lerp(tx, 0, t);
  let ry = lerp(ty, 0, t);
  let rw = lerp(cellW, CANVAS_W, t);
  let rh = lerp(cellH, CANVAS_H, t);

  pg.fill(n.tier.bg);
  pg.noStroke();
  pg.rect(rx, ry, rw, rh);

  if (t > 0.85) {
    let tr = transcripts[n.name];
    if (!tr) return;

    let alpha = map(t, 0.85, 1.0, 0, 255);
    for (let i = 0; i < tr.lines.length; i++) {
      if (i <= s.transcriptLine) {
        s.lineAlphas[i] = min(s.lineAlphas[i] + 8, alpha);
      }
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

    pg.fill(0, 0, 0, alpha * 0.4);
    pg.noStroke();
    pg.textAlign(LEFT, TOP);
    pg.textStyle(BOLD);
    pg.textSize(CANVAS_H * 0.06);
    pg.text(n.name, padX, CANVAS_H * 0.06);

    pg.textStyle(NORMAL);
    pg.textSize(CANVAS_H * 0.032);
    pg.fill(0, 0, 0, alpha * 0.3);
    pg.text(tr.context, padX, CANVAS_H * 0.14);

    let yPos = startY;
    for (let i = 0; i < tr.lines.length; i++) {
      let la = s.lineAlphas[i];
      pg.fill(20, 20, 20, la);
      pg.textStyle(BOLD);
      pg.textSize(CANVAS_H * 0.032);
      pg.textAlign(LEFT, TOP);
      pg.text(tr.lines[i].speaker, padX, yPos);
      yPos += speakerH;

      pg.fill(20, 20, 20, la);
      pg.textStyle(NORMAL);
      pg.textSize(tSize);
      pg.textWrap(WORD);
      pg.text(tr.lines[i].text, padX, yPos, CANVAS_W * 0.8);

      let wraps = max(0, floor(tr.lines[i].text.length / 80));
      yPos += tSize * (1.4 + wraps * 1.4) + lineGap;
      if (i < tr.lines.length - 1) yPos += blockGap;
    }
  }
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function drawCell(n) {
  let s = cellStates[n.name];
  let x = n.col * cellW;
  let y = n.row * cellH;

  pg.fill(n.tier.bg);
  pg.noStroke();
  pg.rect(x, y, cellW, cellH);

  let fanX = x + cellW / 2;
  let fanY = y + cellH * 0.44;
  let r = min(cellW, cellH) * 0.33;

  drawFan(fanX, fanY, r, n.tier.bg, n.tier.fan, s.angle);

  pg.fill(color(n.tier.fan));
  pg.noStroke();
  pg.textAlign(CENTER, TOP);
  pg.textStyle(BOLD);
  pg.textSize(cellH * 0.07);
  pg.text(n.name, fanX, fanY + r + cellH * 0.055);

  if (s.done) {
    pg.fill(0, 0, 0, 165);
    pg.rect(x, y, cellW, cellH);
  }
}

function drawFan(cx, cy, r, bgCol, fanCol, angle) {
  pg.push();
  pg.translate(cx, cy);
  let fc = color(fanCol);
  let bc = color(bgCol);

  pg.fill(fc); pg.noStroke();
  pg.circle(0, 0, r * 2.22);
  pg.fill(bc);
  pg.circle(0, 0, r * 2.0);

  pg.push();
  pg.rotate(angle);
  for (let i = 0; i < 5; i++) {
    pg.push();
    pg.rotate((TWO_PI / 5) * i);
    pg.fill(fc); pg.noStroke();
    pg.ellipse(0, -r * 0.52, r * 0.46, r * 0.95);
    pg.fill(red(bc), green(bc), blue(bc), 100);
    pg.ellipse(0, -r * 0.52, r * 0.24, r * 0.66);
    pg.pop();
  }
  pg.pop();

  pg.fill(fc); pg.circle(0, 0, r * 0.38);
  pg.fill(bc); pg.circle(0, 0, r * 0.25);
  pg.fill(fc); pg.circle(0, 0, r * 0.1);
  pg.pop();
}
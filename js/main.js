VanillaTilt.init(document.querySelectorAll(".card"), {
    max: 15,
    speed: 400,
    glare: true,
    "max-glare": .5
});



const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function parsePointsInput(input) {
  return input.split(" ").map(point => {
    let [x, y] = point.split(",").map(Number);
    return { x, y };
  }).filter(p => !isNaN(p.x) && !isNaN(p.y));
}

function getBoundingBox(points) {
  let minX = Math.min(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y));
  let maxX = Math.max(...points.map(p => p.x));
  let maxY = Math.max(...points.map(p => p.y));
  return { minX, minY, maxX, maxY };
}

function normalizePoints(points, canvasWidth, canvasHeight) {
  let { minX, minY, maxX, maxY } = getBoundingBox(points);
  let scaleX = canvasWidth / (maxX - minX || 1);
  let scaleY = canvasHeight / (maxY - minY || 1);
  let scale = Math.min(scaleX, scaleY) * 0.8;

  return points.map(p => ({
    x: (p.x - minX) * scale + (canvasWidth * 0.1),
    y: (p.y - minY) * scale + (canvasHeight * 0.1)
  }));
}

// الگوریتم گراهام اسکن
function computeConvexHullGrahamScan(points) {
  if (points.length < 3) return points;

  // پیدا کردن نقطه با کمترین y (در صورت تساوی، کمترین x)
  const pivot = points.reduce((res, p) =>
    p.y < res.y || (p.y === res.y && p.x < res.x) ? p : res
  );

  // زاویه هر نقطه نسبت به pivot
  const angle = (p) => Math.atan2(p.y - pivot.y, p.x - pivot.x);

  // مرتب‌سازی بر اساس زاویه و فاصله
  let sorted = points.slice().sort((a, b) => {
    let angleA = angle(a), angleB = angle(b);
    if (angleA === angleB)
      return (pivot.x - a.x) ** 2 + (pivot.y - a.y) ** 2 - ((pivot.x - b.x) ** 2 + (pivot.y - b.y) ** 2);
    return angleA - angleB;
  });

  // استک برای ساخت پوش محدب
  let stack = [];
  for (let pt of sorted) {
    while (stack.length >= 2) {
      let [q, r] = stack.slice(-2);
      let cross = (r.x - q.x) * (pt.y - q.y) - (r.y - q.y) * (pt.x - q.x);
      if (cross <= 0) stack.pop();
      else break;
    }
    stack.push(pt);
  }

  return { hull: stack, pivot };
}


function distance(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function drawPointsAndHull(ctx, allPoints, hull, pivot) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // همه‌ی نقاط به رنگ قرمز ملایم
  for (let p of allPoints) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 0, 0, 0.76)";
    ctx.fill();

    try {
      // خط قرمز از pivot به هر نقطه
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    catch(e) {
      document.getElementById("isInBtn").classList.remove("yes");
      document.getElementById("isInValue").textContent = "wrong input";
    }
  }

  try {
    // پوش محدب با رنگ سفید
    if (hull.length > 1) {
      console.log(hull.length);
      hull.reverse(); 
      ctx.beginPath();
      ctx.moveTo(hull[0].x, hull[0].y);
      for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // شماره‌گذاری
      ctx.fillStyle = "#06BDFF";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < hull.length; i++) {
        ctx.save();
        ctx.translate(hull[i].x, hull[i].y);
        ctx.scale(1, -1); // Flip عمودی
        if(i+1 == hull.length)
          {
            ctx.fillText((i + 2 - hull.length).toString(), 0, -15);
          }
          else {
            ctx.fillText((i + 2).toString(), 0, -15);
          }
        ctx.restore();
      }

      document.getElementById("isInBtn").classList.add("yes");
      document.getElementById("isInValue").textContent = "done";
    }
    else {
      document.getElementById("isInBtn").classList.remove("yes");
      document.getElementById("isInValue").textContent = "wrong input";
    }
  }
  catch(e) {
    document.getElementById("isInBtn").classList.remove("yes");
    document.getElementById("isInValue").textContent = "wrong input";
  }
}

function handleInput() {
  let polygonInput = document.getElementById("input1").value;

  if (polygonInput.trim() !== "") {
    let points = parsePointsInput(polygonInput);
    let normalizedPolygon = normalizePoints(points, canvas.width, canvas.height);
    
    let { hull, pivot } = computeConvexHullGrahamScan(normalizedPolygon);
    drawPointsAndHull(ctx, normalizedPolygon, hull, pivot);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("isInBtn").classList.remove("yes");
    document.getElementById("isInValue").textContent = "wrong input";
  }
}

function resizeCanvas() {
  const card2 = document.querySelector('.card2');

  canvas.width = card2.clientWidth;
  canvas.height = card2.clientHeight;

  handleInput();
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
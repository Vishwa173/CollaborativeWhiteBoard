const socket = io('http://localhost:5000');

const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let isDrawing = false;
let startX = 0;
let startY = 0;
let tool = 'freehand';

document.getElementById('freehandBtn').addEventListener('click', () => tool = 'freehand');
document.getElementById('lineBtn').addEventListener('click', () => tool = 'line');
document.getElementById('rectBtn').addEventListener('click', () => tool = 'rect');
document.getElementById('circleBtn').addEventListener('click', () => tool = 'circle');
document.getElementById('eraserBtn').addEventListener('click', () => tool = 'eraser');

document.getElementById('clearBtn').addEventListener('click', () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear');
  tool = 'freehand';
});

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const { offsetX, offsetY } = e;
  startX = offsetX;
  startY = offsetY;

  if (tool === 'freehand') {
    context.beginPath();
    context.moveTo(startX, startY);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return;
  isDrawing = false;
  context.strokeStyle = 'black';

  const { offsetX, offsetY } = e;

  if (tool === 'line') {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(offsetX, offsetY);
    context.stroke();

    socket.emit('info', {
      type: 'line',
      startX,
      startY,
      endX: offsetX,
      endY: offsetY
    });
  }

  else if (tool === 'rect') {
    const width = offsetX - startX;
    const height = offsetY - startY;
    context.strokeRect(startX, startY, width, height);

    socket.emit('info', {
      type: 'rect',
      startX,
      startY,
      width,
      height
    });
  }

  else if (tool === 'circle') {
    const radius = Math.sqrt((offsetX - startX) ** 2 + (offsetY - startY) ** 2);
    context.beginPath();
    context.arc(startX, startY, radius, 0, Math.PI * 2);
    context.stroke();

    socket.emit('info', {
      type: 'circle',
      startX,
      startY,
      radius
    });
  }

  context.closePath();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const { offsetX, offsetY } = e;

  if (tool === 'freehand') {
    context.lineWidth = 2;
    context.strokeStyle = '#000';
    context.lineTo(offsetX, offsetY);
    context.stroke();

    socket.emit('info', {
      type: 'draw',
      fromX: startX,
      fromY: startY,
      toX: offsetX,
      toY: offsetY
    });

    startX = offsetX;
    startY = offsetY;
  }

  else if (tool === 'eraser') {
    context.clearRect(offsetX - 5, offsetY - 5, 10, 10);
    socket.emit('info', {
      type: 'erase',
      x: offsetX,
      y: offsetY,
      size: 10
    });
  }
});

socket.on('info', (data) => {
  context.strokeStyle = 'red';
  context.lineWidth = 2;

  if (data.type === 'draw') {
    context.beginPath();
    context.moveTo(data.fromX, data.fromY);
    context.lineTo(data.toX, data.toY);
    context.stroke();
    context.closePath();
  }

  else if (data.type === 'erase') {
    context.clearRect(data.x - 5, data.y - 5, data.size, data.size);
  }

  else if (data.type === 'line') {
    context.beginPath();
    context.moveTo(data.startX, data.startY);
    context.lineTo(data.endX, data.endY);
    context.stroke();
    context.closePath();
  }

  else if (data.type === 'rect') {
    context.strokeRect(data.startX, data.startY, data.width, data.height);
  }

  else if (data.type === 'circle') {
    context.beginPath();
    context.arc(data.startX, data.startY, data.radius, 0, Math.PI * 2);
    context.stroke();
    context.closePath();
  }
});

socket.on('clear', () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  tool = 'freehand';
});

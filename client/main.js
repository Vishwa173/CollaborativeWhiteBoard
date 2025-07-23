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
let lastX = 0;
let lastY = 0;
let tool = 'pen';

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const { offsetX, offsetY } = e;
  lastX = offsetX;
  lastY = offsetY;
  context.beginPath();
  context.moveTo(lastX, lastY);
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
  context.closePath();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const { offsetX, offsetY } = e;

  if (tool === 'pen') {
    context.lineWidth = 2;
    context.strokeStyle = '#000';
    context.lineTo(offsetX, offsetY);
    context.stroke();

    socket.emit('info', {
      type: 'draw',
      fromX: lastX,
      fromY: lastY,
      toX: offsetX,
      toY: offsetY
    });

    lastX = offsetX;
    lastY = offsetY;
  } else if (tool === 'eraser') {
    context.clearRect(offsetX - 5, offsetY - 5, 10, 10);
    socket.emit('info', {
      type: 'erase',
      x: offsetX,
      y: offsetY,
      size: 10
    });
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear');
  tool = 'pen';
});

document.getElementById('eraserBtn').addEventListener('click', () => {
  tool = 'eraser';
});

socket.on('info', (data) => {
  if (data.type === 'draw') {
    context.lineWidth = 2;
    context.strokeStyle = 'red';
    context.beginPath();
    context.moveTo(data.fromX, data.fromY);
    context.lineTo(data.toX, data.toY);
    context.stroke();
    context.closePath();
  } else if (data.type === 'erase') {
    context.clearRect(data.x - 5, data.y - 5, data.size, data.size);
  }
});

socket.on('clear', () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  tool = 'pen';
});

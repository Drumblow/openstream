interface ToastOptions {
  title: string;
  description: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const toast = ({ 
  title, 
  description, 
  type = 'info', 
  duration = 3000 
}: ToastOptions) => {
  const toastEl = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-500' : 
                 type === 'error' ? 'bg-red-500' : 
                 'bg-blue-500';

  toastEl.className = `
    fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg
    ${bgColor} text-white min-w-[300px]
    transform transition-all duration-300 ease-out
  `;
  
  toastEl.innerHTML = `
    <h3 class="font-bold">${title}</h3>
    <p class="text-sm opacity-90">${description}</p>
  `;
  
  document.body.appendChild(toastEl);
  
  // Animate in
  requestAnimationFrame(() => {
    toastEl.style.transform = 'translateX(0)';
    toastEl.style.opacity = '1';
  });
  
  setTimeout(() => {
    toastEl.style.transform = 'translateX(100%)';
    toastEl.style.opacity = '0';
    setTimeout(() => toastEl.remove(), 300);
  }, duration);

  // Click to dismiss
  toastEl.addEventListener('click', () => {
    toastEl.style.transform = 'translateX(100%)';
    toastEl.style.opacity = '0';
    setTimeout(() => toastEl.remove(), 300);
  });
};

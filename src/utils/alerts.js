import Swal from 'sweetalert2';

export const notify = async (options) => {
  // Mapping icons to colors for the rings and icons
  const brandColors = {
    success: '#10b981', // emerald-500
    error: '#e11d48',   // rose-600
    warning: '#f59e0b', // amber-500
    info: '#3b82f6',    // blue-500
  };

  const activeColor = brandColors[options.icon] || brandColors.info;

  return Swal.fire({
    ...options,
    background: '#0f172a',
    color: '#f1f5f9',

    // Use your specific Blue 600 color here
    confirmButtonColor: '#2563eb',

    // This handles the interior color of the icon
    iconColor: activeColor,

    // This hook allows us to color the outer ring/border of the icon
    didOpen: (popup) => {
      const icon = popup.querySelector('.swal2-icon');
      if (icon) {
        icon.style.borderColor = activeColor;
      }
    },

    customClass: {
      popup: 'rounded-3xl border border-slate-800 shadow-2xl',
      title: 'font-bold text-2xl pt-4 font-sans',
      htmlContainer: 'text-slate-400 font-sans',
      // We add 'shadow-lg shadow-blue-500/20' to match your button's shadow exactly
      confirmButton: 'rounded-xl px-6 py-3 font-bold font-sans mx-2 shadow-lg shadow-blue-500/20',
      cancelButton: 'rounded-xl px-6 py-3 font-semibold font-sans mx-2 text-slate-400'
    },
    buttonsStyling: true // Ensure Swal uses its internal styler to apply confirmButtonColor
  });
};
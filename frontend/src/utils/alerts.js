import Swal from 'sweetalert2';

export const notify = async (options) => {
  const brandColors = {
    success: '#4edea3',
    error: '#f87171',
    warning: '#ffb690',
    info: '#4b8eff',
  };

  const activeColor = brandColors[options.icon] || brandColors.info;
  const isDestructive = options.icon === 'error' || options.icon === 'warning';
  const confirmColor = isDestructive ? activeColor : '#4b8eff';

  return Swal.fire({
    ...options,
    background: '#151c25',
    color: '#dce3f0',

    confirmButtonColor: confirmColor,
    cancelButtonColor: '#19202a',

    iconColor: activeColor,

    didOpen: (popup) => {
      const icon = popup.querySelector('.swal2-icon');
      if (icon) {
        icon.style.borderColor = activeColor;
      }
    },

    customClass: {
      popup: 'rounded-3xl border border-[#414755]/30 shadow-2xl',
      title: 'font-black text-2xl pt-4 text-white',
      htmlContainer: 'text-[#8b90a0] font-semibold',
      confirmButton: 'rounded-xl px-5 h-11 text-white font-black text-sm mx-2',
      cancelButton: 'rounded-xl px-4 h-11 text-white font-bold text-sm mx-2',
    },
    buttonsStyling: true,
  });
};
export const theme = {
  global: {
    colors: {
      brand: '#000000',
      focus: '#000000',
      active: '#000000',
      'accent-1': '#00C781',
      'accent-2': '#6FFFB0',
      'neutral-1': '#00873D',
      'neutral-2': '#3D138D',
      'status-error': '#FF4040',
      border: '#EDEDED',
      background: '#FFFFFF'
    },
    font: {
      family: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      size: '16px',
      height: '20px',
    },
    breakpoints: {
      small: {
        value: 768,
      },
      medium: {
        value: 1024,
      },
    },
    elevation: {
      light: {
        small: '0 2px 4px rgba(0,0,0,0.1)',
        medium: '0 4px 8px rgba(0,0,0,0.1)',
        large: '0 8px 16px rgba(0,0,0,0.1)',
      },
    },
    spacing: {
      small: '12px',
      medium: '24px',
      large: '48px',
    },
  },
};

export const formFieldTheme = {
  border: {
    color: 'border',
    radius: '4px',
  },
  focus: {
    border: {
      color: 'brand',
    },
  },
};

export const buttonTheme = {
  border: {
    radius: '4px',
  },
  padding: {
    vertical: '10px',
    horizontal: '20px',
  },
  transition: 'all 0.3s ease',
};

export const cardStyle = {
  background: 'white',
  pad: 'medium',
  round: 'small',
  elevation: 'small',
  gap: 'small',
};

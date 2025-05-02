export function convertTemperature(fahrenheit: number | null): { fahrenheit: number | null; celsius: number | null } {
  if (fahrenheit === null) {
    return { fahrenheit: null, celsius: null };
  }
  
  const celsius = (fahrenheit - 32) * (5/9);
  return {
    fahrenheit,
    celsius: Math.round(celsius * 10) / 10 // Round to 1 decimal place
  };
}

export function getTemperatureDisplay(fahrenheit: number | null): string {
  if (fahrenheit === null) {
    return 'N/A';
  }

  const useCelsius = localStorage.getItem('temperatureUnit') === 'celsius';
  if (useCelsius) {
    const celsius = (fahrenheit - 32) * (5/9);
    return `${Math.round(celsius * 10) / 10}°C`;
  }
  
  return `${Math.round(fahrenheit * 10) / 10}°F`;
}
export function convertTimeToSeconds(expTime: string): number {
  const numericValue = parseInt(expTime);
  const unit = expTime.slice(-1);

  let seconds = 0;
  switch (unit) {
    case 's':
      seconds = numericValue;
      break;
    case 'm':
      seconds = numericValue * 60;
      break;
    case 'h':
      seconds = numericValue * 60 * 60;
      break;
    case 'd':
      seconds = numericValue * 24 * 60 * 60;
      break;
    default:
      throw new Error('Invalid time unit');
  }

  return seconds;
}

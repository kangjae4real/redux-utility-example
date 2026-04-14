export function capitalize(text: string): Capitalize<string> {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}` as Capitalize<string>;
}

export function padding(text: string, pad: string, length: number, trailing = false): string {
  if (text.length >= length || pad === "") {
    return text;
  }
  const repeat = Math.ceil((length - text.length) / pad.length);
  const fullPad = pad.repeat(repeat);

  if (trailing) {
    return (text + fullPad).substring(0, length);
  } else {
    const concated = fullPad + text;
    return concated.substring(concated.length - length, length);
  }
}
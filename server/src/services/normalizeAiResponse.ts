/** Same normalization as client — keeps API responses renderable without raw pipe tables. */
export function normalizeAiResponse(content: string): string {
  let text = content.trim();

  if (
    (text.startsWith('"') && text.endsWith('"') && text.length > 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length > 2)
  ) {
    text = text.slice(1, -1).trim();
  }

  text = text.replace(/<br\s*\/?>/gi, '\n');

  if (/\|\s*\d+\s*\|/.test(text) || /\|\s*#?\s*\|\s*mode/i.test(text)) {
    text = convertPipeTablesToSteps(text);
  }

  // LLM often invents "Alangilan St" from the route name — that street is not a CLB landmark
  text = text.replace(/\bAlangilan\s+St(?:reet)?\b/gi, 'Arrieta Rd (Alangilan - Batangas jeepney stop)');
  text = text.replace(/\btoward\s+Alangilan\s+St(?:reet)?\b/gi, 'toward the Alangilan - Batangas jeepney stop on Arrieta Rd');
  // Soft cleanup of other common fake street patterns from route names
  text = text.replace(/\bBalagtas\s+St(?:reet)?\b/gi, 'Balagtas - Batangas jeepney stop');
  text = text.replace(/\bSorosoro\s+St(?:reet)?\b/gi, 'Sorosoro - Batangas jeepney stop');
  text = text.replace(/\bTabangao\s+St(?:reet)?\b/gi, 'Batangas–Tabangao–Lobo Road (N439)');

  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function convertPipeTablesToSteps(text: string): string {
  const totalLine = text.match(/\*\*Total:?\*\*[^|]+/i)?.[0]?.trim();
  const tipLine = text.match(/\*Tip:[^|]+\*/i)?.[0]?.trim();

  const rowRegex = /\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*((?:[^|]|\|(?!\s*\d+\s*\|))+?)\s*(?=\|\s*\d+\s*\||$)/gi;

  const steps: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(text)) !== null) {
    const num = match[1];
    const mode = match[2].trim();
    const details = match[3]
      .trim()
      .replace(/\|\s*$/g, '')
      .replace(/\s*•\s*/g, '\n   - ')
      .replace(/\n{2,}/g, '\n');
    steps.push(`${num}. **${mode}** — ${details}`);
  }

  if (steps.length === 0) return text;

  let remainder = text.replace(rowRegex, ' ');
  remainder = remainder
    .replace(/\|\s*#?\s*\|\s*Mode\s*\|\s*Details\s*\|/gi, ' ')
    .replace(/\|\s*-+\s*\|/g, ' ')
    .replace(/\*\*Total:?\*\*[^|]+/gi, ' ')
    .replace(/\*Tip:[^|]+\*/gi, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const parts = [...steps];
  if (totalLine) parts.push('', totalLine);
  if (tipLine) parts.push('', tipLine);
  else if (remainder.length > 20) parts.push('', remainder);
  return parts.join('\n\n');
}

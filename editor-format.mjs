/** Pure editor transformations suitable for textarea.selectionStart/End. */
export function formatSelection(value, start, end, action) {
  if (typeof value !== 'string' || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > value.length) throw new RangeError('Invalid selection');
  const selected = value.slice(start,end);
  const wrap = {bold:'**',italic:'*',code:'`'}[action];
  if (wrap) {
    const content = selected || {bold:'bold text',italic:'italic text',code:'code'}[action];
    const replacement = wrap + content + wrap;
    return {value:value.slice(0,start)+replacement+value.slice(end),start:start+wrap.length,end:start+wrap.length+content.length};
  }
  if (action === 'link') {
    const label = selected || 'link text'; const replacement=`[${label}](https://example.com)`;
    return {value:value.slice(0,start)+replacement+value.slice(end),start:start+1,end:start+1+label.length};
  }
  if (!['bullet','number','task','heading'].includes(action)) throw new TypeError('Unsupported formatting action');
  const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start-1)+1;
  const nextBreak = value.indexOf('\n',end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const source = value.slice(lineStart,lineEnd);
  const lines = source.split('\n');
  const updated = lines.map((line,i) => {
    if (action === 'bullet') return `- ${line}`;
    if (action === 'number') return `${i+1}. ${line}`;
    if (action === 'task') return `- [ ] ${line}`;
    return `## ${line}`;
  }).join('\n');
  return {value:value.slice(0,lineStart)+updated+value.slice(lineEnd),start:lineStart,end:lineStart+updated.length};
}

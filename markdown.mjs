/** Dependency-free Markdown subset. All user content is rendered via text nodes. */
export function safeUrl(raw) {
  try {
    const url = new URL(raw.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

/** Inline formatting: strong, emphasis, inline code, links, plain text. */
export function inlineTokens(source) {
  const tokens = [];
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\))/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > cursor) tokens.push({ type: 'text', text: source.slice(cursor, match.index) });
    const value = match[0];
    if (value.startsWith('`')) tokens.push({ type: 'code', text: value.slice(1,-1) });
    else if (value.startsWith('**')) tokens.push({ type: 'strong', text: value.slice(2,-2) });
    else if (value.startsWith('*')) tokens.push({ type: 'em', text: value.slice(1,-1) });
    else {
      const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      const href = safeUrl(parts[2]);
      if (href) tokens.push({ type: 'link', text: parts[1], href });
      else tokens.push({ type: 'text', text: value });
    }
    cursor = match.index + value.length;
  }
  if (cursor < source.length) tokens.push({type:'text',text:source.slice(cursor)});
  return tokens.reduce((merged, token) => {
    const last = merged.at(-1);
    if (last?.type === 'text' && token.type === 'text') last.text += token.text;
    else merged.push(token);
    return merged;
  }, []);
}

/** A deliberately small and predictable parser for supported Markdown. */
export function parseMarkdown(source) {
  const lines = String(source).split(/\r?\n/);
  const blocks = [];
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (fence) {
      if (/^\s*```\s*$/.test(line)) { blocks.push({type:'codeblock',text:fence.join('\n')}); fence=null; }
      else fence.push(line);
      continue;
    }
    if (/^\s*```[^`]*$/.test(line)) { fence=[]; continue; }
    if (!line.trim()) { blocks.push({type:'space'}); continue; }
    const task = /^(\s*[-*+]\s+)\[([ xX])\]\s*(.*)$/.exec(line);
    if (task) { blocks.push({type:'task',line:index,checked:task[2].toLowerCase()==='x',text:task[3]});continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) { blocks.push({type:'heading',level:heading[1].length,text:heading[2]}); continue; }
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {blocks.push({type:'bullet',text:bullet[1]});continue;}
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (numbered) {blocks.push({type:'number',text:numbered[1]});continue;}
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {blocks.push({type:'quote',text:quote[1]});continue;}
    blocks.push({type:'paragraph',text:line});
  }
  if (fence) blocks.push({type:'codeblock',text:fence.join('\n')});
  return blocks;
}

export function toggleTask(source, lineIndex) {
  const lines = String(source).split('\n');
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length) return source;
  const original = lines[lineIndex];
  if (!/^(\s*[-*+]\s+)\[([ xX])\]/.test(original)) return source;
  lines[lineIndex] = original.replace(/^(\s*[-*+]\s+)\[([ xX])\]/, (_, prefix, flag) => `${prefix}[${flag === ' ' ? 'x' : ' '}]`);
  return lines.join('\n');
}

function appendInline(parent, text, doc) {
  for (const token of inlineTokens(text)) {
    if (token.type === 'text') { parent.append(doc.createTextNode(token.text)); continue; }
    const node = doc.createElement(token.type === 'strong' ? 'strong' : token.type === 'em' ? 'em' : token.type === 'code' ? 'code' : 'a');
    node.textContent = token.text;
    if (token.type === 'link') {node.href = token.href; node.target = '_blank';node.rel='noopener noreferrer';}
    parent.append(node);
  }
}

/** No innerHTML or unsafe embedded HTML; supported links restricted to HTTP(S). */
export function renderMarkdown(root, source, onTaskToggle) {
  const doc = root.ownerDocument;
  const fragment = doc.createDocumentFragment();
  for (const block of parseMarkdown(source)) {
    if (block.type === 'space') continue;
    let node;
    if (block.type === 'heading') node = doc.createElement(`h${block.level}`);
    else if (block.type === 'codeblock') node = doc.createElement('pre');
    else if (block.type === 'quote') node = doc.createElement('blockquote');
    else if (block.type === 'task') {
      node = doc.createElement('label');node.className='preview-task';
      const input = doc.createElement('input');input.type='checkbox';input.checked=block.checked;
      input.setAttribute('aria-label', `Mark task ${block.checked ? 'incomplete' : 'complete'}: ${block.text}`);
      input.addEventListener('change',()=>onTaskToggle?.(block.line));
      node.append(input);
      const label = doc.createElement('span');appendInline(label,block.text,doc);node.append(label);
      fragment.append(node);continue;
    } else if (block.type === 'bullet' || block.type === 'number') {
      node=doc.createElement('div');node.className=`preview-${block.type}`;
    } else node=doc.createElement('p');
    if (block.type === 'codeblock') {const code = doc.createElement('code');code.textContent=block.text;node.append(code);}
    else appendInline(node,block.text,doc);
    fragment.append(node);
  }
  root.replaceChildren(fragment);
}

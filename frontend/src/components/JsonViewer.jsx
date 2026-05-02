import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function tokenize(json) {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

const JsonViewer = ({ src, raw }) => {
  const [copied, setCopied] = useState(false);

  let formatted = raw;
  let isJson = false;

  try {
    const parsed = typeof src === 'string' ? JSON.parse(src) : src;
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    formatted = raw || '';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="json-viewer">
      <button className="json-copy-btn" onClick={handleCopy}>
        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
      </button>
      {isJson ? (
        <pre
          className="json-pre"
          dangerouslySetInnerHTML={{ __html: tokenize(formatted) }}
        />
      ) : (
        <pre className="json-pre">{formatted}</pre>
      )}
    </div>
  );
};

export default JsonViewer;

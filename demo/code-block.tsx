import { useEffect, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { CodeHighlight, CodeHighlightAdapterProvider, CodeHighlightControl, createHighlightJsAdapter } from '@mantine/code-highlight';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import '@mantine/core/styles/UnstyledButton.layer.css';
import '@mantine/core/styles/ActionIcon.layer.css';
import '@mantine/core/styles/ScrollArea.layer.css';
import '@mantine/code-highlight/styles.layer.css';
import 'highlight.js/styles/github.css';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('tsx', typescript);
const adapter = createHighlightJsAdapter(hljs);

export function CodeBlock({ code, dark = false }: { code: string; dark?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 1000);
    return () => clearTimeout(timer);
  }, [status]);
  return <MantineProvider forceColorScheme={dark ? 'dark' : 'light'} cssVariablesSelector=".code-block" withGlobalClasses={false}>
    <CodeHighlightAdapterProvider adapter={adapter}>
      <div className="code-block" data-dark={dark}>
        <div className="code-caption"><span>example.tsx</span><span>TypeScript / React</span></div>
        <CodeHighlight code={code} language="tsx" codeColorScheme={dark ? 'dark' : 'light'} withLineNumbers withCopyButton={false} radius={0}
          attributes={{ pre: { tabIndex: 0, 'aria-label': 'Code example' } }}
          controls={[<CodeHighlightControl key="copy" aria-label="Copy code" onClick={() => {
            void Promise.resolve().then(() => navigator.clipboard.writeText(code)).then(() => setStatus('copied')).catch(() => setStatus('error'));
          }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{status === 'copied' ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>}</svg></CodeHighlightControl>]} />
        {status === 'error' && <span className="copy-feedback" role="status">Could not copy</span>}
      </div>
    </CodeHighlightAdapterProvider>
  </MantineProvider>;
}

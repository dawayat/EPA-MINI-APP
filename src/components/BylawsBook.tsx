import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, List, LockKeyhole, ShieldCheck, Type, X } from 'lucide-react';
import './bylaws.css';

export type ArticleDocument = { paragraphs: { text: string; style: string | null; label: string; level: number }[]; watermark: string; issuedAt: string };
type Props = { documentData: ArticleDocument | null; paused: boolean; message: string; onResume: () => void; onClose: () => void; closeButtonRef: React.RefObject<HTMLButtonElement>; lang: 'EN' | 'AM' };

/** Presentation only. Authorization, leases and capture deterrents remain in Reader. */
export function BylawsBook({ documentData, paused, message, onResume, onClose, closeButtonRef, lang }: Props) {
  const [page, setPage] = useState(-1);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const chapterTitle = useRef<HTMLHeadingElement>(null);
  const chapters = useMemo(() => {
    const result: { title: string; paragraphs: ArticleDocument['paragraphs'] }[] = [];
    for (const paragraph of documentData?.paragraphs || []) {
      if (paragraph.style?.startsWith('TOC') || paragraph.text.trim() === 'Table of Content') continue;
      if (paragraph.style === 'Heading1') result.push({ title: paragraph.text, paragraphs: [] });
      else if (result.length) result[result.length - 1].paragraphs.push(paragraph);
    }
    return result;
  }, [documentData?.paragraphs]);
  const chapter = chapters[page];
  const goTo = (next: number) => {
    setPage(Math.max(-1, Math.min(next, chapters.length - 1)));
    setContentsOpen(false);
    scroll.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => chapterTitle.current?.focus({ preventScroll: true }));
  };
  const title = (value: string) => value.replace(/^Article\s+\d+\s*:\s*/i, '');
  const readable = Boolean(documentData && !paused);
  const progress = chapters.length ? Math.round((page + 1) / chapters.length * 100) : 0;
  return <>
    <header className="book-toolbar">
      <div className="book-brand"><span className="book-brand-icon"><BookOpen size={19} /></span><div><span className="book-eyebrow">EPA / GOVERNANCE LIBRARY</span><h2 id="bylaws-title">{lang === 'AM' ? 'የማኅበሩ መተዳደሪያ ደንብ' : 'Articles of Association'}</h2></div></div>
      <div className="book-tools"><span className="book-private"><ShieldCheck size={13} /> Member edition</span><button ref={closeButtonRef} onClick={onClose} aria-label="Close articles" className="book-icon-button"><X size={20} /></button></div>
    </header>
    <div className="book-workspace">
      <aside className={`book-contents ${contentsOpen && readable ? 'is-open' : ''}`} aria-label="Table of contents">
        <div className="book-contents-heading"><span className="book-eyebrow">IN THIS VOLUME</span><span className="book-volume-count">{chapters.length.toString().padStart(2, '0')} ARTICLES</span></div>
        <nav aria-label="Articles"><button className={`book-chapter-link book-cover-link ${page === -1 ? 'is-current' : ''}`} onClick={() => goTo(-1)} disabled={!readable} aria-current={page === -1 ? 'page' : undefined}><BookOpen size={16} /><span>Cover & introduction</span></button>{readable && chapters.map((item, index) => <button key={index} className={`book-chapter-link ${page === index ? 'is-current' : ''}`} onClick={() => goTo(index)} aria-current={page === index ? 'page' : undefined}><span className="book-chapter-number">{String(index + 1).padStart(2, '0')}</span><span>{title(item.title)}</span></button>)}</nav>
        <div className="book-sidebar-foot"><ShieldCheck size={15} /><p>For EPA members.<br /><span>Read thoughtfully. Share responsibly.</span></p></div>
      </aside>
      <main className={`book-reading ${largeText ? 'book-large-type' : ''}`}>
        <div className="book-reading-toolbar"><button aria-expanded={contentsOpen} aria-controls="book-mobile-contents" className="book-contents-toggle" onClick={() => setContentsOpen(value => !value)} disabled={!readable}><List size={17} /><span>Contents</span><ChevronDown size={13} /></button><span className="book-reading-location">{page < 0 ? 'THE ASSOCIATION’S SHARED FOUNDATION' : `ARTICLE ${String(page + 1).padStart(2, '0')} / ${chapters.length}`}</span><button className={`book-type-toggle ${largeText ? 'is-active' : ''}`} aria-label="Use larger reading text" aria-pressed={largeText} onClick={() => setLargeText(value => !value)}><Type size={17} /><span>Aa</span></button></div>
        <div id="book-mobile-contents" className="book-mobile-selector"><label><span className="book-eyebrow">CONTENTS</span><select aria-label="Select article" value={page} onChange={e => goTo(Number(e.target.value))} disabled={!readable}><option value={-1}>Cover & introduction</option>{chapters.map((item, index) => <option key={index} value={index}>{item.title}</option>)}</select></label></div>
        <div ref={scroll} className="book-scroll" tabIndex={0} aria-label="Book reading area">
          {!documentData || paused ? <div className="book-state" role="status"><span className="book-state-icon">{paused ? <LockKeyhole size={25} /> : <BookOpen size={25} />}</span><span className="book-eyebrow">EPA READING ROOM</span><h3>{paused ? 'A moment of privacy.' : 'Your reading room'}</h3><p>{paused ? 'Your book is covered while this window is inactive. Return when you’re ready to continue.' : message}</p>{paused && <button className="book-primary" onClick={onResume}>Continue reading <ArrowRight size={16} /></button>}</div> : page < 0 ? <div className="book-cover-stage">
            <article className="book-cover"><div className="book-cover-spine" aria-hidden="true" /><div className="book-cover-border" aria-hidden="true" /><div className="book-cover-topline"><span>ETHIOPIAN PSYCHOLOGISTS’<br />ASSOCIATION</span><span>EST.<br />1992</span></div><div className="book-seal" aria-hidden="true"><span>EPA</span><BookOpen size={22} strokeWidth={1} /><small>KNOWLEDGE · ETHICS · COMMUNITY</small></div><div className="book-cover-title"><p>OUR SHARED FOUNDATION</p><h3 ref={chapterTitle} tabIndex={-1}>Articles of<br /><em>Association</em></h3><span className="book-cover-rule" /><p className="book-cover-amharic">የማኅበሩ መተዳደሪያ ደንብ</p></div><div className="book-cover-bottom"><span>SEPTEMBER 2026</span><span>MEMBERS’ EDITION</span></div></article>
            <div className="book-introduction"><span className="book-eyebrow">A FRAMEWORK FOR OUR PROFESSION</span><p>The principles, responsibilities and shared purpose of the Ethiopian Psychologists’ Association.</p><button className="book-primary" onClick={() => goTo(0)} disabled={!chapters.length}>Open the book <ArrowRight size={17} /></button><span className="book-edition-note">{chapters.length} articles · Read at your own pace</span></div>
          </div> : chapter && <article className="book-paper" key={page}>
            <div className="book-running-head"><span>ETHIOPIAN PSYCHOLOGISTS’ ASSOCIATION</span><span>ARTICLES OF ASSOCIATION</span></div><header className="book-article-heading"><span className="book-eyebrow">ARTICLE {String(page + 1).padStart(2, '0')}</span><h3 ref={chapterTitle} tabIndex={-1}>{title(chapter.title)}</h3><span className="book-article-rule" /></header>
            <div className="book-article-body">{chapter.paragraphs.map((paragraph, index) => <div key={index} className={`book-clause book-level-${Math.min(paragraph.level, 3)}`}><span className="book-clause-number">{paragraph.label}</span><p>{paragraph.text}</p><span aria-hidden="true" className="book-watermark">EPA · {documentData.watermark}</span></div>)}</div>
            <div className="book-page-end"><span aria-hidden="true">✦</span><span>End of Article {page + 1}</span></div><div className="book-paper-footer"><span>MEMBERS’ READING COPY</span><span>{String(page + 1).padStart(2, '0')}</span></div>
          </article>}
        </div>
        <footer className="book-pagination"><div className="book-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div><button className="book-page-button" onClick={() => goTo(page - 1)} disabled={!readable || page < 0} aria-label={page === 0 ? 'Back to cover' : 'Previous article'}><ArrowLeft size={16} /><span>{page === 0 ? 'Cover' : 'Previous'}</span></button><div className="book-page-position" aria-live="polite"><strong>{page < 0 ? 'The beginning' : `Article ${page + 1} of ${chapters.length}`}</strong><span>{page < 0 ? 'Your association. Your shared foundation.' : `${progress}% through the book`}</span></div><button className="book-page-button book-page-next" onClick={() => goTo(page + 1)} disabled={!readable || page >= chapters.length - 1}><span>{page < 0 ? 'Begin' : page === chapters.length - 1 ? 'Complete' : 'Next'}</span><ArrowRight size={16} /></button></footer>
      </main>
    </div>
    <div className="book-session-note"><LockKeyhole size={11} /><span>Personal reading copy · {documentData?.watermark || 'EPA members’ library'}</span><details><summary>Reading policy</summary><p>Copying, printing and saving are restricted. Reader activity is logged. Device screenshots and recordings cannot be reliably detected or blocked.</p></details></div>
  </>;
}

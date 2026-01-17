import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { OFFLINE_NAMES_BY_COUNTRY, ALL_OFFLINE_NAMES } from './constants';

type Tab = 'Copier' | 'Identity' | 'Randomizer' | 'SmartLink';

const App: React.FC = () => {
  const countries = Object.keys(OFFLINE_NAMES_BY_COUNTRY);
  
  const [activeTab, setActiveTab] = useState<Tab>('Copier');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Logic States
  const [selectedCountry, setSelectedCountry] = useState<string>(countries[0] || 'Australia');
  const [currentName, setCurrentName] = useState<string>('');
  const [passValue, setPassValue] = useState<string>('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [sentenceList, setSentenceList] = useState<string>('');
  const [linkList, setLinkList] = useState<string>('');
  const [autoShuffle, setAutoShuffle] = useState<boolean>(false);
  const [copiedMerged, setCopiedMerged] = useState(false);
  const [inputGroups, setInputGroups] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [copiedSelected, setCopiedSelected] = useState(false);
  const [sourceListText, setSourceListText] = useState<string>('');
  const [copierIndex, setCopierIndex] = useState<number>(0);
  const [copiedItemDisplay, setCopiedItemDisplay] = useState(false);
  const [isReservoirVisible, setIsReservoirVisible] = useState(true);

  const MAILBOX_PREFIX = "https://mnx-family.com/mailbox/";
  const EMAIL_DOMAIN = "mnx-family.com";

  // Initialization: Load from LocalStorage (Offline only)
  useEffect(() => {
    const savedPass = localStorage.getItem('session_password');
    setPassValue(savedPass || "6tyrqjqk");
    getRandomName();
    generateEmails();
  }, [selectedCountry]); // Re-roll name if country changes

  const getRandomName = useCallback(() => {
    const pool = OFFLINE_NAMES_BY_COUNTRY[selectedCountry] || ALL_OFFLINE_NAMES;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentName(pool[randomIndex]);
  }, [selectedCountry]);

  const handleNameClick = () => {
    if (copiedName) return;
    navigator.clipboard.writeText(currentName);
    setCopiedName(true);
    setTimeout(() => {
      setCopiedName(false);
      getRandomName();
    }, 250);
  };

  const generateEmails = () => {
    const newList = Array.from({ length: 5 }, () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let res = '';
      for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      return `${MAILBOX_PREFIX}${res}@${EMAIL_DOMAIN}`;
    });
    setEmailList(newList);
  };

  const items = useMemo(() => {
    const lines = sourceListText.split('\n').map(item => item.trim()).filter(item => item !== '');
    // If user input is empty, fallback to the database names (filtered by country if in Identity Lab context, but here we use the full list for the generic copier)
    return lines.length > 0 ? lines : ALL_OFFLINE_NAMES;
  }, [sourceListText]);

  const isUsingDefaultPool = useMemo(() => {
    return sourceListText.trim().length === 0;
  }, [sourceListText]);

  const currentItem = items[copierIndex] || '';

  const handleCopyNext = () => {
    if (!currentItem) return;
    navigator.clipboard.writeText(currentItem);
    setCopiedItemDisplay(true);
    setTimeout(() => setCopiedItemDisplay(false), 300);
    if (copierIndex < items.length - 1) {
      setCopierIndex(prev => prev + 1);
    }
  };

  const mergedResult = useMemo(() => {
    const sentences = sentenceList.split('\n').map(s => s.trim()).filter(s => s !== '');
    const links = linkList.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (links.length === 0 && sentences.length === 0) return '';
    let processedSentences = [...sentences];
    if (autoShuffle) processedSentences = processedSentences.sort(() => Math.random() - 0.5);
    const result = [];
    const numLinks = links.length;
    if (numLinks > 0) {
      for (let i = 0; i < numLinks; i++) {
        const l = links[i];
        let s = processedSentences.length > 0 ? processedSentences[i % processedSentences.length] : '';
        result.push(`${s} ${l}`.trim());
      }
    } else return processedSentences.join('\n');
    return result.join('\n');
  }, [sentenceList, linkList, autoShuffle]);

  const copyMergedResult = () => {
    if (!mergedResult) return;
    navigator.clipboard.writeText(mergedResult);
    setCopiedMerged(true);
    setTimeout(() => setCopiedMerged(false), 1000);
  };

  const handleAutoFillSentences = () => {
    const links = linkList.split('\n').map(l => l.trim()).filter(l => l !== '');
    const linksCount = links.length;
    if (linksCount === 0) return;
    let currentSentences = sentenceList.split('\n').map(s => s.trim()).filter(s => s !== '');
    if (currentSentences.length === 0) return;
    const needed = linksCount - currentSentences.length;
    if (needed > 0) {
      const additional = [];
      for (let i = 0; i < needed; i++) additional.push(currentSentences[i % currentSentences.length]);
      const newSentenceList = [...currentSentences, ...additional].join('\n');
      setSentenceList(newSentenceList);
    }
  };

  const pickAndCopyRandomGroup = () => {
    const groups = inputGroups.split(/\n\s*\n/).map(g => g.trim()).filter(g => g !== '');
    if (groups.length === 0) return;
    const randomIdx = Math.floor(Math.random() * groups.length);
    const picked = groups[randomIdx];
    setSelectedResult(picked);
    navigator.clipboard.writeText(picked);
    setCopiedSelected(true);
    setTimeout(() => setCopiedSelected(false), 800);
  };

  const SidebarMenuItem = ({ id, label, color }: { id: Tab, label: string, color: string }) => (
    <div className="relative z-10">
      <button
        onClick={() => {
          setActiveTab(id);
          setIsMobileMenuOpen(false);
        }}
        className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 rounded-xl text-[12px] font-bold mb-1 ${activeTab === id ? 'active' : ''}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === id ? 'bg-white' : color}`}></div>
        <span className="truncate">{label}</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#F0F2F1] relative overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] backdrop-blur-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Navigation Layout */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-[70] flex sidebar-mobile-container ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <aside className="w-16 h-full sidebar-panel flex flex-col items-center py-8 gap-10 border-r border-black/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#1B2621] flex items-center justify-center text-white shadow-lg mb-4">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
          </div>
          <div className="flex flex-col gap-4">
             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>
             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></div>
          </div>
        </aside>

        <aside className="w-64 h-full sidebar-panel shrink-0 flex flex-col p-8 relative overflow-hidden">
          <h2 className="text-xl font-bold text-[#1B2621] mb-8">Toolkit</h2>
          <div className="flex-1 relative">
            <div className="menu-line"></div>
            <div className="flex flex-col gap-1">
              <SidebarMenuItem id="Copier" label="Sequence Stream" color="bg-blue-400" />
              <SidebarMenuItem id="Identity" label="Identity Lab" color="bg-emerald-400" />
              <SidebarMenuItem id="Randomizer" label="Logic Shuffler" color="bg-amber-400" />
              <SidebarMenuItem id="SmartLink" label="Matrix Fusion" color="bg-fuchsia-400" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="bg-white/40 p-4 rounded-xl border border-black/5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Offline v2.5</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 h-full overflow-y-auto content-area p-6 sm:p-8 lg:p-10 relative">
        <div className="lg:hidden flex items-center justify-between mb-8">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2.5 rounded-xl bg-white border border-black/5 text-[#1B2621]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{activeTab}</span>
          <div className="w-10"></div>
        </div>

        {activeTab === 'Copier' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-popIn">
            <div className="bento-card p-6 sm:p-10 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                <div className="h-full bg-[#1B2621] transition-all duration-500" style={{ width: items.length > 0 ? `${((copierIndex + 1) / items.length) * 100}%` : '0%' }}></div>
              </div>
              <div onClick={handleCopyNext} className="flex-1 flex flex-col items-center justify-center cursor-pointer w-full text-center">
                <div className={`transition-all duration-300 ${copiedItemDisplay ? 'opacity-10 scale-95 blur-md' : 'opacity-100 scale-100'}`}>
                  <h1 className="fluid-name font-black tracking-tight leading-[1.2] text-[#1B2621] px-4 font-mono">
                    {currentItem || <span className="opacity-10 font-sans italic text-base">Empty Reservoir</span>}
                  </h1>
                </div>
                {copiedItemDisplay && (
                  <div className="absolute inset-0 flex items-center justify-center animate-popIn">
                    <div className="bg-[#1B2621] text-white px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest">Captured</div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center gap-2 w-full max-w-[280px]">
                 <button onClick={() => setCopierIndex(Math.max(0, copierIndex - 1))} className="p-3 rounded-lg bg-slate-50 border border-black/5 hover:bg-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                 </button>
                 <button onClick={handleCopyNext} disabled={!currentItem} className="flex-1 py-3 bg-[#1B2621] text-white rounded-lg text-[9px] font-bold uppercase tracking-[0.1em] shadow-md disabled:opacity-20 active:scale-95 transition-all">Next</button>
                 <button onClick={() => setCopierIndex(Math.min(items.length - 1, copierIndex + 1))} className="p-3 rounded-lg bg-slate-50 border border-black/5 hover:bg-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                 </button>
              </div>
            </div>
            <div className="bento-card overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-slate-50/30 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Content Reservoir</h3>
                  <button 
                    onClick={() => setIsReservoirVisible(!isReservoirVisible)} 
                    className="px-2 py-0.5 bg-white border border-black/5 rounded-md text-[8px] font-bold uppercase hover:bg-slate-50 transition-colors"
                  >
                    {isReservoirVisible ? 'Hide' : 'Show'}
                  </button>
                  {isUsingDefaultPool && <span className="text-[7px] font-black uppercase text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded leading-none">Database Mode</span>}
                </div>
                <button onClick={() => setSourceListText('')} className="text-[9px] font-bold text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors">Clear All</button>
              </div>
              
              {isReservoirVisible && (
                <div className="p-4 animate-popIn">
                  <textarea 
                    value={sourceListText} 
                    onChange={(e) => {setSourceListText(e.target.value); setCopierIndex(0);}} 
                    className="w-full h-32 bg-slate-50/50 border border-black/5 rounded-xl p-4 font-mono text-[10px] text-slate-600 outline-none focus:bg-white transition-all resize-none shadow-inner" 
                    placeholder="Paste text here to override the default database pool..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Identity' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-popIn">
            {/* Country Selection Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
              {countries.map(country => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                    selectedCountry === country 
                      ? 'bg-[#1B2621] text-white border-[#1B2621] shadow-md' 
                      : 'bg-white text-slate-400 border-black/5 hover:border-slate-200'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>

            <div onClick={handleNameClick} className={`bento-card p-8 sm:p-12 flex flex-col items-center justify-center gap-6 relative overflow-hidden cursor-pointer min-h-[180px] sm:min-h-[250px] ${copiedName ? 'bg-emerald-50' : 'bg-white'}`}>
              <div className="absolute top-4 left-6 text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                {selectedCountry} Origin
              </div>
              <h1 className={`fluid-name-large font-black text-[#1B2621] text-center tracking-tighter leading-[1.1] ${copiedName ? 'opacity-10 scale-95 blur-sm' : 'opacity-100'}`}>{currentName}</h1>
              {copiedName && <div className="absolute inset-0 flex items-center justify-center z-20 animate-popIn"><div className="bg-[#1B2621] text-white px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest">Copied</div></div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bento-card p-6 flex flex-col gap-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Local Cipher</h3>
                  <div className="flex flex-col gap-3">
                    <input type="text" value={passValue} onChange={(e) => {setPassValue(e.target.value); localStorage.setItem('session_password', e.target.value);}} className="bg-slate-50 p-3.5 rounded-lg border border-black/5 text-sm font-mono font-bold text-emerald-800 outline-none" />
                    <button onClick={() => {navigator.clipboard.writeText(passValue); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 800);}} className="py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest bg-[#1B2621] text-white shadow-md active:scale-95 transition-transform">Copy Cipher</button>
                  </div>
               </div>
               <div className="bento-card p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center"><h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mail Hub</h3><button onClick={generateEmails} className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100">Rotate</button></div>
                  <div className="flex flex-col gap-2">
                    {emailList.map((e, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-black/5 rounded-lg text-[10px] font-mono text-slate-500 truncate cursor-pointer flex justify-between group hover:bg-white transition-all" onClick={() => navigator.clipboard.writeText(e)}>
                        <span className="truncate">{e}</span><span className="opacity-0 group-hover:opacity-100 text-[#1B2621] font-bold ml-2">Copy</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Randomizer' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-popIn">
            <div className="bento-card p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Random Shuffler Input</label>
                <textarea value={inputGroups} onChange={(e) => setInputGroups(e.target.value)} className="w-full h-32 bg-slate-50/50 rounded-xl p-5 font-mono text-xs text-slate-600 border border-black/5 outline-none focus:bg-white resize-none" placeholder="Enter text blocks separated by empty lines..." />
                <button onClick={pickAndCopyRandomGroup} className="w-full py-4 bg-[#1B2621] text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">Pick Random Block</button>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected</label>
                <div onClick={() => { if (selectedResult) { navigator.clipboard.writeText(selectedResult); setCopiedSelected(true); setTimeout(() => setCopiedSelected(false), 800); } }} className="relative bg-slate-50 border border-black/5 rounded-xl p-6 min-h-[100px] cursor-pointer hover:bg-white transition-all">
                  <pre className="text-[12px] text-[#1B2621] whitespace-pre-wrap break-all leading-relaxed font-mono">{selectedResult || <span className="opacity-10 italic">Waiting...</span>}</pre>
                  {copiedSelected && <div className="absolute top-4 right-4 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest">Copied</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SmartLink' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-popIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bento-card flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-black/5 bg-slate-50/30 flex justify-between items-center">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sentence Matrix</h2>
                  <button onClick={handleAutoFillSentences} className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg">Fill</button>
                </div>
                <textarea value={sentenceList} onChange={(e) => setSentenceList(e.target.value)} className="w-full h-48 bg-white p-5 font-mono text-xs text-slate-500 outline-none resize-none leading-relaxed" placeholder="Line by line sentences..." />
              </div>
              <div className="bento-card flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-black/5 bg-slate-50/30 flex justify-between items-center">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link Matrix</h2>
                  <button onClick={() => setLinkList('')} className="text-[9px] font-bold uppercase text-red-300">Wipe</button>
                </div>
                <textarea value={linkList} onChange={(e) => setLinkList(e.target.value)} className="w-full h-48 bg-white p-5 font-mono text-xs text-slate-500 outline-none resize-none leading-relaxed" placeholder="Line by line URLs..." />
              </div>
            </div>
            <div className="bento-card overflow-hidden">
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 bg-slate-50/40 gap-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fusion Result</h2>
                <button onClick={copyMergedResult} className={`py-3 px-8 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg ${copiedMerged ? 'bg-emerald-500 text-white' : 'bg-[#1B2621] text-white'}`}>
                  {copiedMerged ? 'Captured' : 'Copy All'}
                </button>
              </div>
              <div className="bg-white p-6 font-mono text-[10px] text-[#1B2621] min-h-[120px] max-h-[350px] overflow-y-auto whitespace-pre-wrap leading-loose">
                {mergedResult || <div className="text-center py-6 opacity-10 uppercase tracking-widest text-[9px]">Awaiting Fusion Matrix...</div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
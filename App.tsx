import React, { useState } from 'react';
import { 
  Percent, 
  Scale, 
  Briefcase, 
  Settings as SettingsIcon, 
  ChevronLeft,
  Package,
  ArrowRight,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { AppView, SettingsState, Language } from './types';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { analyzeShoppingDeal } from './services/geminiService';
import { translations, Translation } from './translations';

// --- View Components ---

const MainMenu: React.FC<{ onViewSelect: (view: AppView) => void, t: Translation }> = ({ onViewSelect, t }) => {
  const menuItems = [
    { id: AppView.DISCOUNT_CALC, title: t.mainMenu.discount, icon: <Package size={20} />, sub: t.mainMenu.discountSub },
    { id: AppView.PROMO_CALC, title: t.mainMenu.promo, icon: <Percent size={20} />, sub: t.mainMenu.promoSub },
    { id: AppView.UNIT_PRICE_CALC, title: t.mainMenu.unitPrice, icon: <Scale size={20} />, sub: t.mainMenu.unitPriceSub },
    { id: AppView.REVERSE_CALC, title: t.mainMenu.reverse, icon: <Briefcase size={20} />, sub: t.mainMenu.reverseSub },
    { id: AppView.PRO_MODE, title: t.mainMenu.pro, icon: <Sparkles size={20} className="text-yellow-400" />, sub: t.mainMenu.proSub, highlight: true },
    { id: AppView.SETTINGS, title: t.mainMenu.settings, icon: <SettingsIcon size={20} />, sub: t.mainMenu.settingsSub },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800/50 p-4 rounded-xl mb-4 border border-slate-700/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold flex items-center gap-2 mb-1">
          <span className="text-2xl">👋</span> {t.mainMenu.welcome}
        </h1>
        <p className="text-slate-400 text-sm">{t.mainMenu.chooseOption}</p>
      </div>

      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewSelect(item.id)}
          className={`group w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 border 
            ${item.highlight 
              ? 'bg-blue-900/30 border-blue-500/50 hover:bg-blue-900/50' 
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
            } active:scale-[0.98] shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${item.highlight ? 'bg-blue-600' : 'bg-slate-900'} text-white shadow-inner`}>
              {item.icon}
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">{item.title}</div>
              <div className="text-xs text-slate-400">{item.sub}</div>
            </div>
          </div>
          <ArrowRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
        </button>
      ))}
    </div>
  );
};

const DiscountCalc: React.FC<{ currency: string, t: Translation }> = ({ currency, t }) => {
  const [price, setPrice] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');

  const numPrice = parseFloat(price) || 0;
  const numDiscount = parseFloat(discount) || 0;
  const finalPrice = numPrice - (numPrice * (numDiscount / 100));
  const saved = numPrice - finalPrice;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input 
          label={t.discountCalc.priceLabel}
          type="number" 
          placeholder="0" 
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          suffix={currency}
          autoFocus
        />
        <Input 
          label={t.discountCalc.discountLabel}
          type="number" 
          placeholder="0" 
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          suffix="%"
        />
      </div>

      {price && (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
          <div className="flex justify-between items-end pb-4 border-b border-slate-700">
            <span className="text-slate-400">{t.common.total}</span>
            <span className="text-3xl font-bold text-green-400">
              {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{t.common.save}</span>
            <span className="font-semibold text-blue-400">
              {saved.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const PromoCalc: React.FC<{ currency: string, t: Translation }> = ({ currency, t }) => {
  const [price, setPrice] = useState<string>('');
  const [totalItems, setTotalItems] = useState<string>('3');
  const [paidItems, setPaidItems] = useState<string>('2');

  const numPrice = parseFloat(price) || 0;
  const n = parseFloat(totalItems) || 1;
  const x = parseFloat(paidItems) || 1;

  const totalCost = numPrice * x;
  const costPerItem = n > 0 ? totalCost / n : 0;
  const effectiveDiscount = n > 0 ? (1 - (x / n)) * 100 : 0;

  return (
    <div className="space-y-6">
      <Input 
        label={t.promoCalc.priceLabel}
        type="number" 
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        suffix={currency}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label={t.promoCalc.buyLabel}
          type="number" 
          value={totalItems}
          onChange={(e) => setTotalItems(e.target.value)}
        />
        <Input 
          label={t.promoCalc.payLabel}
          type="number" 
          value={paidItems}
          onChange={(e) => setPaidItems(e.target.value)}
        />
      </div>

      {price && (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-3">
           <div className="flex justify-between items-center">
            <span className="text-slate-400">{t.promoCalc.pricePerItem}</span>
            <span className="text-2xl font-bold text-white">
              {costPerItem.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{t.promoCalc.realDiscount}</span>
            <span className="font-semibold text-yellow-400">
              {effectiveDiscount.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
             {t.promoCalc.totalCost} {n} {t.promoCalc.item}: {totalCost.toLocaleString()} {currency}
          </div>
        </div>
      )}
    </div>
  );
};

const UnitPriceCalc: React.FC<{ currency: string, t: Translation }> = ({ currency, t }) => {
  const [price, setPrice] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [unitType, setUnitType] = useState<'g' | 'kg' | 'ml' | 'l'>('g');

  const numPrice = parseFloat(price) || 0;
  const numWeight = parseFloat(weight) || 0;

  let factor = 1;
  let labelUnit = t.unitPriceCalc.kg;

  if (unitType === 'g') { factor = 1000; labelUnit = t.unitPriceCalc.kg; }
  if (unitType === 'kg') { factor = 1; labelUnit = t.unitPriceCalc.kg; }
  if (unitType === 'ml') { factor = 1000; labelUnit = t.unitPriceCalc.l; }
  if (unitType === 'l') { factor = 1; labelUnit = t.unitPriceCalc.l; }

  const pricePerUnit = numWeight > 0 ? (numPrice / numWeight) * factor : 0;

  return (
    <div className="space-y-6">
       <Input 
          label={t.unitPriceCalc.priceLabel}
          type="number" 
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          suffix={currency}
        />
      
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input 
            label={t.unitPriceCalc.weightLabel}
            type="number" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl h-[50px] items-center border border-slate-700">
           <select 
            value={unitType}
            onChange={(e) => setUnitType(e.target.value as any)}
            className="bg-transparent text-white text-sm font-medium focus:outline-none px-2 h-full"
           >
             <option value="g">{t.unitPriceCalc.g}</option>
             <option value="kg">{t.unitPriceCalc.kg}</option>
             <option value="ml">{t.unitPriceCalc.ml}</option>
             <option value="l">{t.unitPriceCalc.l}</option>
           </select>
        </div>
      </div>

      {price && weight && (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
          <div className="text-slate-400 mb-1">{t.unitPriceCalc.costPer} {labelUnit}</div>
          <div className="text-3xl font-bold text-blue-400">
            {pricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
          </div>
        </div>
      )}
    </div>
  );
};

const ReverseCalc: React.FC<{ currency: string, t: Translation }> = ({ currency, t }) => {
  const [discountedPrice, setDiscountedPrice] = useState<string>('');
  const [percent, setPercent] = useState<string>('');

  const p = parseFloat(discountedPrice) || 0;
  const d = parseFloat(percent) || 0;

  const original = (d > 0 && d < 100) ? p / (1 - (d/100)) : 0;

  return (
    <div className="space-y-6">
       <div className="bg-blue-900/20 p-4 rounded-xl text-sm text-blue-200 mb-4 border border-blue-900/50">
         {t.reverseCalc.info}
       </div>

       <Input 
          label={t.reverseCalc.discountedPrice}
          type="number" 
          value={discountedPrice}
          onChange={(e) => setDiscountedPrice(e.target.value)}
          suffix={currency}
        />
        <Input 
          label={t.reverseCalc.percent}
          type="number" 
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          suffix="%"
        />

      {original > 0 && (
         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">{t.reverseCalc.regularPrice}</span>
              <span className="text-xl font-bold line-through text-slate-500">
                {original.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-700 mt-2">
               <span className="text-slate-400">{t.reverseCalc.saved}</span>
               <span className="text-green-400 font-semibold">
                  {(original - p).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
               </span>
            </div>
         </div>
      )}
    </div>
  );
};

const ProMode: React.FC<{ currency: string, t: Translation, lang: Language }> = ({ currency, t, lang }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    const response = await analyzeShoppingDeal(query, currency, lang);
    setResult(response);
    setLoading(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-xl border border-white/10 mb-2">
        <h3 className="font-bold flex items-center gap-2 text-purple-200">
          <Sparkles size={18} /> {t.proMode.header}
        </h3>
        <p className="text-xs text-purple-200/70 mt-1">
          {t.proMode.desc}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {result && (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-300">
            <div className="prose prose-invert prose-sm whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.proMode.placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 min-h-[80px] mb-3 resize-none"
        />
        <Button 
          fullWidth 
          onClick={handleAsk} 
          disabled={loading || !query.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 border-none"
        >
          {loading ? (
             <span className="flex items-center gap-2">
               <RefreshCcw className="animate-spin" size={18} /> {t.common.loading}
             </span>
          ) : (
            t.proMode.button
          )}
        </Button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MAIN_MENU);
  const [settings, setSettings] = useState<SettingsState>({ 
    currency: '₴', 
    language: 'uk' 
  });

  const t = translations[settings.language];

  // Function to render the specific header based on view
  const getHeaderTitle = () => {
    switch (currentView) {
      case AppView.DISCOUNT_CALC: return t.discountCalc.title;
      case AppView.PROMO_CALC: return t.promoCalc.title;
      case AppView.UNIT_PRICE_CALC: return t.unitPriceCalc.title;
      case AppView.REVERSE_CALC: return t.reverseCalc.title;
      case AppView.PRO_MODE: return t.proMode.title;
      case AppView.SETTINGS: return t.mainMenu.settings;
      default: return "";
    }
  };

  const handleBack = () => setCurrentView(AppView.MAIN_MENU);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center">
      <div className="w-full max-w-md flex flex-col h-screen">
        
        {/* Header */}
        {currentView !== AppView.MAIN_MENU && (
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-bold text-lg">{getHeaderTitle()}</h2>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {currentView === AppView.MAIN_MENU && (
            <MainMenu onViewSelect={setCurrentView} t={t} />
          )}

          {currentView === AppView.DISCOUNT_CALC && (
            <div className="animate-in slide-in-from-right-8 duration-300">
               <DiscountCalc currency={settings.currency} t={t} />
            </div>
          )}

          {currentView === AppView.PROMO_CALC && (
            <div className="animate-in slide-in-from-right-8 duration-300">
               <PromoCalc currency={settings.currency} t={t} />
            </div>
          )}

          {currentView === AppView.UNIT_PRICE_CALC && (
            <div className="animate-in slide-in-from-right-8 duration-300">
               <UnitPriceCalc currency={settings.currency} t={t} />
            </div>
          )}

          {currentView === AppView.REVERSE_CALC && (
            <div className="animate-in slide-in-from-right-8 duration-300">
               <ReverseCalc currency={settings.currency} t={t} />
            </div>
          )}

          {currentView === AppView.PRO_MODE && (
            <div className="animate-in slide-in-from-right-8 duration-300 h-full">
               <ProMode currency={settings.currency} t={t} lang={settings.language} />
            </div>
          )}

          {currentView === AppView.SETTINGS && (
            <div className="animate-in slide-in-from-right-8 duration-300 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t.common.language}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { code: 'uk', label: 'Українська' },
                      { code: 'ru', label: 'Русский' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setSettings(s => ({ ...s, language: lang.code as Language }))}
                        className={`p-3 rounded-xl border font-medium ${
                          settings.language === lang.code 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">{t.common.currency}</label>
                   <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 flex justify-between items-center opacity-75">
                      <span>Українська гривня (UAH)</span>
                      <span className="font-bold text-white bg-slate-700 px-2 py-1 rounded">₴</span>
                   </div>
               </div>

               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-sm text-slate-400 text-center">
                 {t.common.version}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
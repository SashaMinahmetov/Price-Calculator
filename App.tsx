import React, { useState, useEffect, useRef } from 'react';
import { 
  Percent, 
  Scale, 
  Briefcase, 
  Settings as SettingsIcon, 
  Package,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { AppView, SettingsState, Language, TelegramUser } from './types';
import { Input } from './components/Input';
import { NumericKeypad } from './components/NumericKeypad';
import { translations, Translation } from './translations';
import { logUserVisit } from './services/analytics';

// --- Helper Hook for Keypad Logic ---
const useCalculatorInput = (initialState: Record<string, string>, initialActive: string) => {
  const [values, setValues] = useState(initialState);
  const [activeField, setActiveField] = useState(initialActive);

  const handleKeyPress = (key: string) => {
    setValues(prev => {
      const currentVal = prev[activeField];
      // Prevent multiple dots
      if (key === '.' && currentVal.includes('.')) return prev;
      // Prevent excessive length
      if (currentVal.length >= 9) return prev; 
      
      // If adding a dot to empty string, make it "0."
      if (key === '.' && currentVal === '') return { ...prev, [activeField]: '0.' };

      return { ...prev, [activeField]: currentVal + key };
    });
  };

  const handleDelete = () => {
    setValues(prev => ({
      ...prev,
      [activeField]: prev[activeField].slice(0, -1)
    }));
  };

  const handleClear = () => {
     setValues(prev => ({
      ...prev,
      [activeField]: ''
    }));
  }

  return { values, activeField, setActiveField, handleKeyPress, handleDelete, handleClear, setValues };
};

// --- View Components ---

const MainMenu: React.FC<{ onViewSelect: (view: AppView) => void, t: Translation, user?: TelegramUser }> = ({ onViewSelect, t, user }) => {
  const menuItems = [
    { id: AppView.DISCOUNT_CALC, title: t.mainMenu.discount, icon: <Package size={20} />, sub: t.mainMenu.discountSub, color: "text-blue-400" },
    { id: AppView.PROMO_CALC, title: t.mainMenu.promo, icon: <Percent size={20} />, sub: t.mainMenu.promoSub, color: "text-purple-400" },
    { id: AppView.UNIT_PRICE_CALC, title: t.mainMenu.unitPrice, icon: <Scale size={20} />, sub: t.mainMenu.unitPriceSub, color: "text-green-400" },
    { id: AppView.REVERSE_CALC, title: t.mainMenu.reverse, icon: <Briefcase size={20} />, sub: t.mainMenu.reverseSub, color: "text-orange-400" },
    { id: AppView.SETTINGS, title: t.mainMenu.settings, icon: <SettingsIcon size={20} />, sub: t.mainMenu.settingsSub, color: "text-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full justify-center">
      <div className="bg-slate-800/50 p-5 rounded-2xl mb-2 border border-slate-700/50 backdrop-blur-sm">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1 text-white">
           {user ? `👋 ${user.first_name}` : t.mainMenu.welcome}
        </h1>
        <p className="text-slate-400 text-sm">{t.mainMenu.chooseOption}</p>
      </div>

      <div className="grid gap-3">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewSelect(item.id)}
          className="group w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 border bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600 active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-900 shadow-inner ${item.color}`}>
              {item.icon}
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg text-slate-100">{item.title}</div>
              <div className="text-xs text-slate-400 font-medium">{item.sub}</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      ))}
      </div>
    </div>
  );
};

const BackButton: React.FC<{ onClick: () => void, label: string }> = ({ onClick, label }) => (
  <button 
    onClick={onClick}
    className="w-full mt-2 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium active:scale-95"
  >
    <LogOut size={16} className="rotate-180" />
    {label}
  </button>
);

const DiscountCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, setValues } = useCalculatorInput(
    { price: '', discount: '' }, 
    'price'
  );

  const numPrice = parseFloat(values.price) || 0;
  const numDiscount = parseFloat(values.discount) || 0;
  
  const finalPrice = numPrice * (1 - numDiscount / 100);
  const saved = numPrice - finalPrice;

  const quickDiscounts = ['5', '10', '15', '20', '25', '30', '40', '50'];

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="text-xl font-bold text-center text-white mb-1">{t.discountCalc.title}</h2>
        
        {/* Result Card - Fixed Height h-32 */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg h-32 shrink-0 flex flex-col justify-center relative overflow-hidden">
            {numPrice > 0 ? (
                <>
                    <div className="flex justify-between items-end pb-2 border-b border-slate-700/50 mb-2">
                    <span className="text-slate-400 text-sm">{t.discountCalc.finalPrice}</span>
                    <span className="text-3xl font-bold text-green-400 tracking-tight">
                        {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xl">{currency}</span>
                    </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{t.common.save}</span>
                    <span className="font-semibold text-blue-400">
                        {saved.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                    </span>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center px-4">
                    {t.discountCalc.emptyState}
                </div>
            )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
             <Input 
                label={t.discountCalc.priceLabel}
                placeholder="" 
                value={values.price}
                isActive={activeField === 'price'}
                onInputClick={() => setActiveField('price')}
                suffix={currency}
                className="col-span-2"
                autoFocus
            />
            <Input 
                label={t.discountCalc.discountLabel}
                placeholder="" 
                value={values.discount}
                isActive={activeField === 'discount'}
                onInputClick={() => setActiveField('discount')}
                suffix="%"
                className="col-span-2"
            />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-4 gap-2">
            {quickDiscounts.map(d => (
                <button
                    key={d}
                    onClick={() => setValues(prev => ({ ...prev, discount: d }))}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                        values.discount === d 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    {d}%
                </button>
            ))}
        </div>
        
        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const PromoCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete } = useCalculatorInput(
    { price: '', n: '', x: '' }, 
    'price'
  );

  const price = parseFloat(values.price) || 0;
  const n = parseFloat(values.n) || 0; // Buy
  const x = parseFloat(values.x) || 0; // Free

  const totalQuantity = n + x;
  const totalPrice = price * n;
  
  const unitPrice = totalQuantity > 0 ? (price * n) / totalQuantity : 0;
  const realDiscount = totalQuantity > 0 ? (x / totalQuantity) * 100 : 0;

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="text-xl font-bold text-center text-white mb-1">{t.promoCalc.title}</h2>
        
        {/* Result - Fixed Height h-40 for 3 lines */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg h-40 shrink-0 flex flex-col justify-center relative overflow-hidden">
             {price > 0 && totalQuantity > 0 ? (
                <div className="flex flex-col justify-between h-full py-1">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t.promoCalc.pricePerItem}</span>
                    <span className="text-2xl font-bold text-white">
                        {unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-400">{currency}</span>
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400">{t.promoCalc.realDiscount}</span>
                    <span className="font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                        {realDiscount.toFixed(1)}%
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                     <span>{t.promoCalc.totalCost} ({n + x} {t.promoCalc.item})</span>
                     <span>{totalPrice.toLocaleString()} {currency}</span>
                </div>
                </div>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center px-4">
                    {t.promoCalc.emptyState}
                </div>
             )}
        </div>

        <Input 
          label={t.promoCalc.priceLabel}
          value={values.price}
          isActive={activeField === 'price'}
          onInputClick={() => setActiveField('price')}
          suffix={currency}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label={t.promoCalc.buyLabel}
            value={values.n}
            isActive={activeField === 'n'}
            onInputClick={() => setActiveField('n')}
          />
          <Input 
            label={t.promoCalc.freeLabel}
            value={values.x}
            isActive={activeField === 'x'}
            onInputClick={() => setActiveField('x')}
          />
        </div>

        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const UnitPriceCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete } = useCalculatorInput(
    { price: '', weight: '' }, 
    'price'
  );
  const [unitType, setUnitType] = useState<'g' | 'kg' | 'ml' | 'l'>('g');

  const numPrice = parseFloat(values.price) || 0;
  const numWeight = parseFloat(values.weight) || 0;

  let factorToStandard = 1;
  let labelUnit = t.unitPriceCalc.kg;
  let labelSmallUnit = "100" + t.unitPriceCalc.g;

  if (unitType === 'g') { 
      factorToStandard = 1000; 
      labelUnit = t.unitPriceCalc.kg; 
      labelSmallUnit = "100" + t.unitPriceCalc.g;
  }
  if (unitType === 'ml') { 
      factorToStandard = 1000; 
      labelUnit = t.unitPriceCalc.l; 
      labelSmallUnit = "100" + t.unitPriceCalc.ml;
  }
  if (unitType === 'kg') { 
      factorToStandard = 1; 
      labelUnit = t.unitPriceCalc.kg; 
      labelSmallUnit = "0.1" + t.unitPriceCalc.kg;
  }
  if (unitType === 'l') { 
      factorToStandard = 1; 
      labelUnit = t.unitPriceCalc.l;
      labelSmallUnit = "0.1" + t.unitPriceCalc.l;
  }

  const pricePerUnit = numWeight > 0 ? (numPrice / numWeight) * factorToStandard : 0;
  const pricePerSmallUnit = pricePerUnit / 10;

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-white mb-1">{t.unitPriceCalc.title}</h2>
         
         {/* Result - Fixed Height h-32 */}
         <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg h-32 shrink-0 flex flex-col justify-center gap-3 relative overflow-hidden">
            {numPrice > 0 && numWeight > 0 ? (
                <>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t.unitPriceCalc.costPer} {labelUnit}</span>
                    <span className="text-2xl font-bold text-blue-400">
                    {pricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-500">{currency}</span>
                    </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400 text-sm">{t.unitPriceCalc.costPer100} {unitType === 'kg' || unitType === 'l' ? unitType : (unitType === 'ml' ? t.unitPriceCalc.ml : t.unitPriceCalc.g)}</span>
                    <span className="text-lg font-semibold text-slate-200">
                    {pricePerSmallUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-slate-500">{currency}</span>
                    </span>
                </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center px-4">
                    {t.unitPriceCalc.emptyState}
                </div>
            )}
         </div>

         <Input 
            label={t.unitPriceCalc.priceLabel}
            value={values.price}
            isActive={activeField === 'price'}
            onInputClick={() => setActiveField('price')}
            suffix={currency}
          />
        
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input 
              label={t.unitPriceCalc.weightLabel}
              value={values.weight}
              isActive={activeField === 'weight'}
              onInputClick={() => setActiveField('weight')}
            />
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl h-[52px] items-center border border-slate-700 shrink-0 w-24">
             <select 
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as any)}
              className="bg-transparent text-white text-base font-medium focus:outline-none px-2 h-full w-full text-center"
             >
               <option className="text-slate-900" value="g">{t.unitPriceCalc.g}</option>
               <option className="text-slate-900" value="kg">{t.unitPriceCalc.kg}</option>
               <option className="text-slate-900" value="ml">{t.unitPriceCalc.ml}</option>
               <option className="text-slate-900" value="l">{t.unitPriceCalc.l}</option>
             </select>
          </div>
        </div>

        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const ReverseCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete } = useCalculatorInput(
    { price: '', percent: '' }, 
    'price'
  );

  const p = parseFloat(values.price) || 0;
  const d = parseFloat(values.percent) || 0;

  const original = (d > 0 && d < 100) ? p / (1 - (d/100)) : 0;

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-white mb-1">{t.reverseCalc.title}</h2>
         <div className="bg-blue-900/20 p-3 rounded-xl text-xs text-blue-200 border border-blue-900/50 text-center">
           {t.reverseCalc.info}
         </div>

         {/* Result - Fixed Height h-28 */}
         <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg h-28 shrink-0 flex flex-col justify-center relative overflow-hidden">
            {original > 0 ? (
                <>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-sm">{t.reverseCalc.regularPrice}</span>
                    <span className="text-2xl font-bold text-slate-200 line-through decoration-red-500/50 decoration-2">
                        {original.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                    </span>
                </div>
                 <div className="flex justify-between items-center pt-2 border-t border-slate-700/50 mt-1">
                    <span className="text-slate-400 text-sm">{t.reverseCalc.saved}</span>
                    <span className="text-green-400 font-bold">
                        {(original - p).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                    </span>
                </div>
                </>
            ) : (
                 <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center px-4">
                    {t.reverseCalc.emptyState}
                </div>
            )}
         </div>

         <Input 
            label={t.reverseCalc.discountedPrice}
            value={values.price}
            isActive={activeField === 'price'}
            onInputClick={() => setActiveField('price')}
            suffix={currency}
          />
          <Input 
            label={t.reverseCalc.percent}
            value={values.percent}
            isActive={activeField === 'percent'}
            onInputClick={() => setActiveField('percent')}
            suffix="%"
          />
          
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
          <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MAIN_MENU);
  const [user, setUser] = useState<TelegramUser | undefined>(undefined);
  const [settings, setSettings] = useState<SettingsState>({ 
    currency: '₴', 
    language: 'uk' 
  });
  // Ref to ensure we don't log multiple times in one session if component re-renders
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (telegramUser) {
        setUser(telegramUser);
        
        // Try to log the user visit if not already done
        if (!hasLoggedRef.current) {
            logUserVisit(telegramUser);
            hasLoggedRef.current = true;
        }

        // Auto-detect language if available and matches our supported languages
        if (telegramUser.language_code === 'ru' || telegramUser.language_code === 'uk') {
          setSettings(prev => ({ ...prev, language: telegramUser.language_code as Language }));
        }
      }
    }
  }, []);

  const t = translations[settings.language];

  const handleBack = () => setCurrentView(AppView.MAIN_MENU);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center selection:bg-blue-500/30">
      <div className="w-full max-w-md flex flex-col h-[100dvh]"> {/* Use dvh for mobile viewports */}
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 scroll-smooth flex flex-col">
          {currentView === AppView.MAIN_MENU && (
            <MainMenu onViewSelect={setCurrentView} t={t} user={user} />
          )}

          {currentView === AppView.DISCOUNT_CALC && (
            <DiscountCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.PROMO_CALC && (
             <PromoCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.UNIT_PRICE_CALC && (
             <UnitPriceCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.REVERSE_CALC && (
             <ReverseCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.SETTINGS && (
            <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col h-full justify-center">
               <div className="w-full space-y-6">
                 <h2 className="text-xl font-bold text-center text-white mb-2">{t.mainMenu.settings}</h2>
                 
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
                          className={`p-4 rounded-xl border font-medium transition-all active:scale-95 ${
                            settings.language === lang.code 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                 </div>
                 
                 <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">{t.common.currency}</label>
                     <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 flex justify-between items-center">
                        <span>Українська гривня (UAH)</span>
                        <span className="font-bold text-white bg-slate-700 px-3 py-1 rounded-lg border border-slate-600">₴</span>
                     </div>
                 </div>

                 <div className="pt-4 text-center space-y-4">
                    <div className="inline-block px-4 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-500">
                      {t.common.version}
                    </div>
                    <BackButton onClick={handleBack} label={t.common.back} />
                 </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
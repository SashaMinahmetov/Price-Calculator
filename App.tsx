import React, { useState, useEffect, useRef } from 'react';
import { 
  Percent, 
  Scale, 
  Briefcase, 
  Settings as SettingsIcon, 
  Package,
  ArrowRight,
  LogOut,
  DollarSign,
  ArrowLeftRight,
  RefreshCcw,
  Moon,
  Sun,
  TrendingUp,
  Calculator,
  ShoppingCart
} from 'lucide-react';
import { AppView, SettingsState, Language, TelegramUser, Theme } from './types';
import { Input } from './components/Input';
import { NumericKeypad } from './components/NumericKeypad';
import { translations, Translation } from './translations';
import { logUserVisit } from './services/analytics';

// --- Helper Hook for Keypad Logic ---
const useCalculatorInput = (initialState: Record<string, string>, initialActive: string, fields: string[]) => {
  const [values, setValues] = useState(initialState);
  const [activeField, setActiveField] = useState(initialActive);

  const handleKeyPress = (key: string) => {
    setValues(prev => {
      const currentVal = prev[activeField] || '';
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
      [activeField]: prev[activeField]?.slice(0, -1) || ''
    }));
  };

  const handleClear = () => {
     setValues(prev => ({
      ...prev,
      [activeField]: ''
    }));
  }

  const handleNext = () => {
    const currentIndex = fields.indexOf(activeField);
    const nextIndex = (currentIndex + 1) % fields.length;
    setActiveField(fields[nextIndex]);
  };

  return { values, activeField, setActiveField, handleKeyPress, handleDelete, handleClear, setValues, handleNext };
};

// --- View Components ---

const MainMenu: React.FC<{ onViewSelect: (view: AppView) => void, t: Translation, user?: TelegramUser }> = ({ onViewSelect, t, user }) => {
  const menuItems = [
    { id: AppView.DISCOUNT_CALC, title: t.mainMenu.discount, icon: <Package size={20} />, sub: t.mainMenu.discountSub, color: "text-blue-500 dark:text-blue-400" },
    { id: AppView.PROMO_CALC, title: t.mainMenu.promo, icon: <Percent size={20} />, sub: t.mainMenu.promoSub, color: "text-purple-500 dark:text-purple-400" },
    { id: AppView.UNIT_PRICE_CALC, title: t.mainMenu.unitPrice, icon: <Scale size={20} />, sub: t.mainMenu.unitPriceSub, color: "text-green-500 dark:text-green-400" },
    { id: AppView.REVERSE_CALC, title: t.mainMenu.reverse, icon: <Briefcase size={20} />, sub: t.mainMenu.reverseSub, color: "text-orange-500 dark:text-orange-400" },
    { id: AppView.MARGIN_CALC, title: t.mainMenu.margin, icon: <TrendingUp size={20} />, sub: t.mainMenu.marginSub, color: "text-indigo-500 dark:text-indigo-400" },
    { id: AppView.CURRENCY_CONVERTER, title: t.mainMenu.currency, icon: <DollarSign size={20} />, sub: t.mainMenu.currencySub, color: "text-emerald-500 dark:text-emerald-400" },
    { id: AppView.SETTINGS, title: t.mainMenu.settings, icon: <SettingsIcon size={20} />, sub: t.mainMenu.settingsSub, color: "text-slate-500 dark:text-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      {/* Compact Header with Glass Effect */}
      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md py-3 px-4 rounded-2xl mb-2 border border-white/40 dark:border-white/5 shadow-sm text-center">
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">{t.mainMenu.chooseOption}</p>
      </div>

      <div className="grid gap-3">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewSelect(item.id)}
          className="group w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 border 
          bg-white/70 dark:bg-slate-800/40 backdrop-blur-md
          border-white/50 dark:border-white/5
          hover:bg-white/90 dark:hover:bg-slate-800/60
          active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/50 dark:bg-slate-900/50 shadow-sm ${item.color}`}>
              {item.icon}
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">{item.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.sub}</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
        </button>
      ))}
      </div>
    </div>
  );
};

const BackButton: React.FC<{ onClick: () => void, label: string }> = ({ onClick, label }) => (
  <button 
    onClick={onClick}
    className="w-full mt-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-700/60 border border-white/30 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-medium active:scale-95 shadow-sm"
  >
    <LogOut size={16} className="rotate-180" />
    {label}
  </button>
);

const ResultCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="rounded-2xl border border-white/50 dark:border-white/10 shadow-lg transition-all duration-300 overflow-hidden shrink-0 backdrop-blur-xl bg-white/80 dark:bg-slate-800/50 p-5">
            <div className="flex flex-col animate-in fade-in">
                {children}
            </div>
        </div>
    )
}

const DiscountCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext } = useCalculatorInput(
    { price: '', discount: '' }, 
    'price',
    ['price', 'discount']
  );

  const numPrice = parseFloat(values.price) || 0;
  const numDiscount = parseFloat(values.discount) || 0;
  
  const finalPrice = numPrice * (1 - numDiscount / 100);
  const saved = numPrice - finalPrice;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90">{t.discountCalc.title}</h2>
        
        <ResultCard>
            <div className="flex flex-col items-center pt-2 pb-1">
                {/* Regular Price (Strikethrough) */}
                <div className="flex items-center gap-2 mb-1 opacity-80">
                     <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t.reverseCalc.regularPrice}</span>
                     <span className="text-lg font-medium text-slate-400 line-through decoration-red-500/60 decoration-2">
                        {numPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                     </span>
                </div>

                {/* Final Price */}
                <span className="text-5xl font-bold text-green-500 dark:text-green-400 tracking-tight leading-none mb-1 drop-shadow-sm">
                    {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl">{currency}</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider opacity-60">
                    {t.discountCalc.finalPrice}
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3 mt-4"></div>

            <div className="flex justify-between items-center text-sm px-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{t.common.save}</span>
                <span className="font-bold text-blue-500 dark:text-blue-400">
                    {saved.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                </span>
            </div>
        </ResultCard>

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
        
        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const MarginCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext } = useCalculatorInput(
    { cost: '', sell: '' }, 
    'cost',
    ['cost', 'sell']
  );

  const cost = parseFloat(values.cost) || 0;
  const sell = parseFloat(values.sell) || 0;

  const profit = sell - cost;
  // Markup = (Profit / Cost) * 100
  const markup = cost > 0 ? (profit / cost) * 100 : 0;
  // Margin = (Profit / Sell) * 100
  const margin = sell > 0 ? (profit / sell) * 100 : 0;

  const isProfitable = profit >= 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90 mb-1">{t.marginCalc.title}</h2>
         
         <ResultCard>
            <div className="flex flex-col items-center mb-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 uppercase tracking-wide">{t.marginCalc.profit}</span>
                <span className={`text-4xl font-bold leading-none drop-shadow-sm ${isProfitable ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xl">{currency}</span>
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3 mt-1"></div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col items-center">
                    <span className="text-slate-500 dark:text-slate-400 text-xs mb-1">{t.marginCalc.markup}</span>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-500/20 font-bold">
                        {markup.toFixed(1)}%
                    </div>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-slate-500 dark:text-slate-400 text-xs mb-1">{t.marginCalc.margin}</span>
                    <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg border border-blue-200/50 dark:border-blue-500/20 font-bold">
                        {margin.toFixed(1)}%
                    </div>
                 </div>
            </div>
         </ResultCard>

         <Input 
            label={t.marginCalc.costLabel}
            value={values.cost}
            isActive={activeField === 'cost'}
            onInputClick={() => setActiveField('cost')}
            suffix={currency}
            autoFocus
          />
          <Input 
            label={t.marginCalc.sellLabel}
            value={values.sell}
            isActive={activeField === 'sell'}
            onInputClick={() => setActiveField('sell')}
            suffix={currency}
          />
          
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
          <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

// Supported Currencies Configuration
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD' },
  { code: 'EUR', symbol: '€', name: 'EUR' },
  { code: 'PLN', symbol: 'zł', name: 'PLN' }
];

const CurrencyConverter: React.FC<{ t: Translation, onBack: () => void }> = ({ t, onBack }) => {
    // State to toggle direction: 'FOREIGN_TO_UAH' (default) or 'UAH_TO_FOREIGN'
    const [direction, setDirection] = useState<'FOREIGN_TO_UAH' | 'UAH_TO_FOREIGN'>('FOREIGN_TO_UAH');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [loading, setLoading] = useState(false);
    const [rateDate, setRateDate] = useState<string>('');
    
    // We store rate as a string in inputs for editing, but logic uses float
    const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext, setValues } = useCalculatorInput(
      { amount: '', rate: '0.00' }, 
      'amount',
      ['amount', 'rate']
    );

    const performFetch = async (currencyCode: string) => {
        setLoading(true);
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateParam = `${year}${month}${day}`;

            let response = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currencyCode}&date=${dateParam}&json`);
            let data;
            if (response.ok) {
                data = await response.json();
            }

            if (!data || data.length === 0) {
                 response = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currencyCode}&json`);
                 if (response.ok) {
                    data = await response.json();
                 }
            }

            if (data && data[0]) {
                if (data[0].rate) setValues(prev => ({ ...prev, rate: data[0].rate.toFixed(2) }));
                if (data[0].exchangedate) setRateDate(data[0].exchangedate);
            }
        } catch (error) {
            console.error("Failed to fetch rate", error);
        } finally {
            setLoading(false);
        }
    };
  
    useEffect(() => {
        performFetch(selectedCurrency);
    }, [selectedCurrency]);
  
    const amount = parseFloat(values.amount) || 0;
    const rate = parseFloat(values.rate) || 0;
    const currentSymbol = CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$';
    
    let result = 0;
    let fromSymbol = "";
    let toSymbol = "";
    let title = "";

    if (direction === 'FOREIGN_TO_UAH') {
        result = amount * rate;
        fromSymbol = currentSymbol;
        toSymbol = "₴";
        title = `${selectedCurrency} ➞ UAH`;
    } else {
        result = rate > 0 ? amount / rate : 0;
        fromSymbol = "₴";
        toSymbol = currentSymbol;
        title = `UAH ➞ ${selectedCurrency}`;
    }
  
    const toggleDirection = () => {
        setDirection(prev => prev === 'FOREIGN_TO_UAH' ? 'UAH_TO_FOREIGN' : 'FOREIGN_TO_UAH');
    };

    const handleRefresh = () => {
        performFetch(selectedCurrency);
    }
  
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-between items-center px-2">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white/90">{t.currencyCalc.title}</h2>
                 <button onClick={handleRefresh} className={`p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 backdrop-blur-sm transition-colors ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`}>
                    <RefreshCcw size={18} />
                 </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-1">
                {CURRENCIES.map(curr => (
                    <button
                        key={curr.code}
                        onClick={() => setSelectedCurrency(curr.code)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all border
                            ${selectedCurrency === curr.code 
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/20 shadow-md' 
                                : 'bg-white/60 dark:bg-slate-800/40 border-white/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/60'
                            }`}
                    >
                        {curr.name}
                    </button>
                ))}
            </div>
          
          <ResultCard>
             <div className="flex flex-col items-center py-2">
                 <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/40 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
                    {title}
                 </div>
                 <span className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 tracking-tight leading-none mt-2 drop-shadow-sm">
                     {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl">{toSymbol}</span>
                 </span>
             </div>
             <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-2 mt-3"></div>
             <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{t.currencyCalc.rateLabel}</span>
                <div className="text-right">
                    <div className="font-medium text-slate-600 dark:text-slate-400">1 {selectedCurrency} = {rate} UAH</div>
                    {rateDate && <div className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">{t.currencyCalc.date} {rateDate}</div>}
                </div>
             </div>
          </ResultCard>
  
          <div className="flex gap-2 items-end mt-1">
            <div className="flex-1">
                <Input 
                    label={t.currencyCalc.amountLabel}
                    value={values.amount}
                    isActive={activeField === 'amount'}
                    onInputClick={() => setActiveField('amount')}
                    suffix={fromSymbol}
                    autoFocus
                />
            </div>
             <button 
                onClick={toggleDirection}
                className="h-[52px] w-[52px] shrink-0 bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-700/60 active:scale-95 transition-all shadow-sm"
            >
                <ArrowLeftRight size={20} />
            </button>
          </div>

          <Input 
            label={t.currencyCalc.rateLabel}
            value={values.rate}
            isActive={activeField === 'rate'}
            onInputClick={() => setActiveField('rate')}
            suffix="UAH"
          />
          
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
          <BackButton onClick={onBack} label={t.common.back} />
        </div>
      </div>
    );
};

const PromoCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const [mode, setMode] = useState<'STANDARD' | 'REVERSE'>('STANDARD');
  
  // Safe string access to prevent crash
  const strings = t.promoCalc || {
      title: "Акция N+X",
      modeStandard: "Цена за шт",
      modeReverse: "Расчет заказа",
      priceLabel: "Цена (база)",
      buyLabel: "Купи (N)",
      freeLabel: "Бонус (X)",
      targetLabel: "Нужно всего",
      pricePerItem: "Цена за 1 шт по акции",
      realDiscount: "Фактическая скидка",
      totalCost: "Общая сумма",
      toInvoice: "Выписать (Оплатить)",
      toAdd: "Получите бонусом",
      item: "шт",
      emptyState: "Введите цену и условия (N+X)"
  };

  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext: originalHandleNext } = useCalculatorInput(
    { price: '', n: '', x: '', target: '' }, 
    'price',
    ['price', 'n', 'x']
  );

  // Custom handleNext to support dynamic fields based on mode
  const handleNext = () => {
      const standardFields = ['price', 'n', 'x'];
      const reverseFields = ['target', 'n', 'x', 'price'];
      const currentFields = mode === 'STANDARD' ? standardFields : reverseFields;
      
      const currentIndex = currentFields.indexOf(activeField);
      const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % currentFields.length;
      setActiveField(currentFields[nextIndex]);
  };

  const price = parseFloat(values.price) || 0;
  const n = parseFloat(values.n) || 0; // Buy
  const x = parseFloat(values.x) || 0; // Free
  const target = parseFloat(values.target) || 0; // Desired Total

  // Standard Mode Calculations
  const totalQuantity = n + x;
  const totalPrice = price * n;
  const unitPrice = totalQuantity > 0 ? (price * n) / totalQuantity : 0;
  const realDiscount = totalQuantity > 0 ? (x / totalQuantity) * 100 : 0;

  // Reverse Mode Calculations
  const setSize = n + x;
  const sets = setSize > 0 ? target / setSize : 0;
  const invoiceQty = sets * n;
  const freeQty = sets * x;
  const totalInvoiceCost = invoiceQty * price;

  const toggleMode = (newMode: 'STANDARD' | 'REVERSE') => {
      setMode(newMode);
      if (newMode === 'STANDARD') setActiveField('price');
      else setActiveField('target');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90 mb-1">{strings.title}</h2>
        
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/5 mb-1">
             <button
                onClick={() => toggleMode('STANDARD')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'STANDARD' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-700/30'
                }`}
             >
                <Percent size={14} />
                {strings.modeStandard}
             </button>
             <button
                onClick={() => toggleMode('REVERSE')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'REVERSE' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-700/30'
                }`}
             >
                <Package size={14} />
                {strings.modeReverse}
             </button>
        </div>
        
        <ResultCard>
             <div className="flex flex-col animate-in fade-in">
                 {mode === 'STANDARD' ? (
                     <>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{strings.pricePerItem}</span>
                            <span className="text-3xl font-bold text-slate-800 dark:text-white leading-none drop-shadow-sm">
                                {unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-400">{currency}</span>
                            </span>
                        </div>
                        
                        <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3"></div>

                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-slate-500 dark:text-slate-400">{strings.realDiscount}</span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100/50 dark:bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-200/50 dark:border-yellow-400/20">
                                {realDiscount.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                            <span>{strings.totalCost} ({n + x} {strings.item})</span>
                            <span>{totalPrice.toLocaleString()} {currency}</span>
                        </div>
                     </>
                 ) : (
                     <>
                        <div className="flex justify-between items-center mb-1">
                             <div className="flex flex-col">
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">{strings.toInvoice}</span>
                                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400 leading-tight">
                                    {Number.isInteger(invoiceQty) ? invoiceQty : invoiceQty.toFixed(2)}
                                </span>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">{strings.toAdd}</span>
                                <span className="text-3xl font-bold text-green-500 dark:text-green-400 leading-tight">
                                    {Number.isInteger(freeQty) ? freeQty : freeQty.toFixed(2)}
                                </span>
                             </div>
                        </div>

                        <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3 mt-2"></div>

                        <div className="flex justify-between items-center text-xs text-slate-500">
                             <span>{strings.totalCost}</span>
                             <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                                {totalInvoiceCost > 0 ? `${totalInvoiceCost.toLocaleString()} ${currency}` : '-'}
                             </span>
                        </div>
                     </>
                 )}
            </div>
        </ResultCard>

        {mode === 'STANDARD' ? (
            <>
                <Input 
                    label={strings.priceLabel}
                    value={values.price}
                    isActive={activeField === 'price'}
                    onInputClick={() => setActiveField('price')}
                    suffix={currency}
                    className="mt-2"
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label={strings.buyLabel}
                        value={values.n}
                        isActive={activeField === 'n'}
                        onInputClick={() => setActiveField('n')}
                    />
                    <Input 
                        label={strings.freeLabel}
                        value={values.x}
                        isActive={activeField === 'x'}
                        onInputClick={() => setActiveField('x')}
                    />
                </div>
            </>
        ) : (
            <>
                 <Input 
                    label={strings.targetLabel}
                    value={values.target}
                    isActive={activeField === 'target'}
                    onInputClick={() => setActiveField('target')}
                    className="mt-2"
                    autoFocus
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label={strings.buyLabel}
                        value={values.n}
                        isActive={activeField === 'n'}
                        onInputClick={() => setActiveField('n')}
                    />
                    <Input 
                        label={strings.freeLabel}
                        value={values.x}
                        isActive={activeField === 'x'}
                        onInputClick={() => setActiveField('x')}
                    />
                </div>
                <Input 
                    label={`${strings.priceLabel} (${t.common.currency})`}
                    value={values.price}
                    isActive={activeField === 'price'}
                    onInputClick={() => setActiveField('price')}
                    suffix={currency}
                />
            </>
        )}

        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const UnitPriceCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext } = useCalculatorInput(
    { price: '', weight: '' }, 
    'price',
    ['price', 'weight']
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
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90 mb-1">{t.unitPriceCalc.title}</h2>
         
         <ResultCard>
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.unitPriceCalc.costPer} {labelUnit}</span>
                <span className="text-3xl font-bold text-blue-500 dark:text-blue-400 leading-none drop-shadow-sm">
                {pricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-400 dark:text-slate-500">{currency}</span>
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3"></div>

            <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.unitPriceCalc.costPer100} {unitType === 'kg' || unitType === 'l' ? unitType : (unitType === 'ml' ? t.unitPriceCalc.ml : t.unitPriceCalc.g)}</span>
                <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {pricePerSmallUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-slate-400 dark:text-slate-500">{currency}</span>
                </span>
            </div>
         </ResultCard>

         <Input 
            label={t.unitPriceCalc.priceLabel}
            value={values.price}
            isActive={activeField === 'price'}
            onInputClick={() => setActiveField('price')}
            suffix={currency}
            className="mt-2"
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
          <div className="flex bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-1 rounded-xl h-[52px] items-center border border-white/50 dark:border-white/10 shrink-0 w-24">
             <select 
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-white text-base font-medium focus:outline-none px-2 h-full w-full text-center"
             >
               <option className="text-slate-900 bg-white" value="g">{t.unitPriceCalc.g}</option>
               <option className="text-slate-900 bg-white" value="kg">{t.unitPriceCalc.kg}</option>
               <option className="text-slate-900 bg-white" value="ml">{t.unitPriceCalc.ml}</option>
               <option className="text-slate-900 bg-white" value="l">{t.unitPriceCalc.l}</option>
             </select>
          </div>
        </div>

        <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
        <BackButton onClick={onBack} label={t.common.back} />
      </div>
    </div>
  );
};

const ReverseCalc: React.FC<{ currency: string, t: Translation, onBack: () => void }> = ({ currency, t, onBack }) => {
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext } = useCalculatorInput(
    { price: '', percent: '' }, 
    'price',
    ['price', 'percent']
  );

  const p = parseFloat(values.price) || 0;
  const d = parseFloat(values.percent) || 0;

  // Modified logic: if discount is 0 or empty, the original price is the same as the current price (p)
  // This prevents division by 1 when d=0 from looking like an empty state if we were hiding it before.
  const original = (d >= 0 && d < 100) ? p / (1 - (d/100)) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90 mb-1">{t.reverseCalc.title}</h2>
         <div className="bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm p-2 rounded-xl text-xs text-blue-600 dark:text-blue-200 border border-blue-200/50 dark:border-blue-900/50 text-center">
           {t.reverseCalc.info}
         </div>

         <ResultCard>
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.reverseCalc.regularPrice}</span>
                <span className="text-3xl font-bold text-slate-700 dark:text-slate-200 line-through decoration-red-500/50 decoration-2 leading-none">
                    {original.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200/60 dark:bg-white/10 mb-3"></div>

            <div className="flex justify-between items-center mt-1">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.reverseCalc.saved}</span>
                <span className="text-green-500 dark:text-green-400 font-bold">
                    {(original - p).toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                </span>
            </div>
         </ResultCard>

         <Input 
            label={t.reverseCalc.discountedPrice}
            value={values.price}
            isActive={activeField === 'price'}
            onInputClick={() => setActiveField('price')}
            suffix={currency}
            className="mt-2"
          />
          <Input 
            label={t.reverseCalc.percent}
            value={values.percent}
            isActive={activeField === 'percent'}
            onInputClick={() => setActiveField('percent')}
            suffix="%"
          />
          
          <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} nextLabel={t.common.next} />
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
    language: 'uk',
    theme: 'dark'
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

  // Sync theme with document class for Tailwind
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      // Also update Telegram header color if possible
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.setHeaderColor?.('#0f172a'); // slate-900 (matches dark theme bg)
        window.Telegram.WebApp.setBackgroundColor?.('#0f172a');
      }
    } else {
      document.documentElement.classList.remove('dark');
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.setHeaderColor?.('#f1f5f9'); // slate-100 (matches light theme bg top)
        window.Telegram.WebApp.setBackgroundColor?.('#f1f5f9');
      }
    }
  }, [settings.theme]);

  const t = translations[settings.language];

  const handleBack = () => setCurrentView(AppView.MAIN_MENU);

  return (
    // Updated background with a subtle gradient for both modes
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex justify-center selection:bg-blue-500/30 transition-colors duration-500">
      <div className="w-full max-w-md flex flex-col h-[100dvh]">
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 scroll-smooth flex flex-col">
          {currentView === AppView.MAIN_MENU && (
            <MainMenu onViewSelect={setCurrentView} t={t} user={user} />
          )}

          {currentView === AppView.DISCOUNT_CALC && (
            <DiscountCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.CURRENCY_CONVERTER && (
            <CurrencyConverter t={t} onBack={handleBack} />
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
          
          {currentView === AppView.MARGIN_CALC && (
             <MarginCalc currency={settings.currency} t={t} onBack={handleBack} />
          )}

          {currentView === AppView.SETTINGS && (
            <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col h-full">
               <div className="w-full space-y-6">
                 <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white/90 mb-2">{t.mainMenu.settings}</h2>
                 
                 {/* Language Settings */}
                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t.common.language}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'uk', label: 'Українська' },
                        { code: 'ru', label: 'Русский' }
                      ].map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setSettings(s => ({ ...s, language: lang.code as Language }))}
                          className={`p-4 rounded-xl border font-medium transition-all active:scale-95 shadow-sm ${
                            settings.language === lang.code 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/30' 
                            : 'bg-white/60 dark:bg-slate-800/40 border-white/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700/50 backdrop-blur-sm'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Theme Settings */}
                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t.common.theme}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'dark', label: t.common.themeDark, icon: <Moon size={18} /> },
                        { code: 'light', label: t.common.themeLight, icon: <Sun size={18} /> }
                      ].map(themeOpt => (
                        <button
                          key={themeOpt.code}
                          onClick={() => setSettings(s => ({ ...s, theme: themeOpt.code as Theme }))}
                          className={`p-4 rounded-xl border font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                            settings.theme === themeOpt.code 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/30' 
                            : 'bg-white/60 dark:bg-slate-800/40 border-white/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700/50 backdrop-blur-sm'
                          }`}
                        >
                          {themeOpt.icon}
                          {themeOpt.label}
                        </button>
                      ))}
                    </div>
                 </div>
                 
                 {/* Currency Display (Read only) */}
                 <div>
                     <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t.common.currency}</label>
                     <div className="p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 flex justify-between items-center shadow-sm">
                        <span>Українська гривня (UAH)</span>
                        <span className="font-bold text-slate-800 dark:text-white bg-white/50 dark:bg-slate-700/50 px-3 py-1 rounded-lg border border-white/50 dark:border-white/10">₴</span>
                     </div>
                 </div>

                 <div className="pt-4 text-center space-y-4">
                    <div className="inline-block px-4 py-1 rounded-full bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-white/5 text-xs text-slate-500 backdrop-blur-sm">
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
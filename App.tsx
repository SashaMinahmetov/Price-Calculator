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
  Sun
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
    { id: AppView.CURRENCY_CONVERTER, title: t.mainMenu.currency, icon: <DollarSign size={20} />, sub: t.mainMenu.currencySub, color: "text-emerald-500 dark:text-emerald-400" },
    { id: AppView.SETTINGS, title: t.mainMenu.settings, icon: <SettingsIcon size={20} />, sub: t.mainMenu.settingsSub, color: "text-slate-500 dark:text-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full justify-center">
      {/* Compact Header */}
      <div className="bg-white dark:bg-slate-800/50 py-2 px-4 rounded-xl mb-2 border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm text-center">
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{t.mainMenu.chooseOption}</p>
      </div>

      <div className="grid gap-3">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewSelect(item.id)}
          className="group w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-900 shadow-inner ${item.color}`}>
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
    className="w-full mt-2 py-3 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium active:scale-95"
  >
    <LogOut size={16} className="rotate-180" />
    {label}
  </button>
);

const ResultCard: React.FC<{ hasData: boolean, emptyText: string, children: React.ReactNode }> = ({ hasData, emptyText, children }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300 overflow-hidden shrink-0 ${hasData ? 'p-4' : 'p-3'}`}>
            {hasData ? (
                <div className="flex flex-col animate-in fade-in">
                    {children}
                </div>
            ) : (
                 <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center px-4 py-1">
                    {emptyText}
                </div>
            )}
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
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-1">{t.discountCalc.title}</h2>
        
        <ResultCard hasData={numPrice > 0} emptyText={t.discountCalc.emptyState}>
            <div className="flex flex-col items-center pt-2 pb-1">
                {/* Regular Price (Strikethrough) */}
                <div className="flex items-center gap-2 mb-1 opacity-80">
                     <span className="text-slate-500 dark:text-slate-500 text-xs">{t.reverseCalc.regularPrice}</span>
                     <span className="text-lg font-medium text-slate-400 line-through decoration-red-500/60 decoration-2">
                        {numPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                     </span>
                </div>

                {/* Final Price */}
                <span className="text-4xl font-bold text-green-500 dark:text-green-400 tracking-tight leading-none mb-1">
                    {finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl">{currency}</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider opacity-60">
                    {t.discountCalc.finalPrice}
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-3 mt-2"></div>

            <div className="flex justify-between items-center text-sm px-1">
                <span className="text-slate-500 dark:text-slate-400">{t.common.save}</span>
                <span className="font-semibold text-blue-500 dark:text-blue-400">
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

const CurrencyConverter: React.FC<{ t: Translation, onBack: () => void }> = ({ t, onBack }) => {
    // State to toggle direction: 'USD_TO_UAH' (default) or 'UAH_TO_USD'
    const [direction, setDirection] = useState<'USD_TO_UAH' | 'UAH_TO_USD'>('USD_TO_UAH');
    const [loading, setLoading] = useState(false);
    const [rateDate, setRateDate] = useState<string>('');
    
    // We store rate as a string in inputs for editing, but logic uses float
    const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext, setValues } = useCalculatorInput(
      { amount: '', rate: '41.50' }, // Default fallback rate
      'amount',
      ['amount', 'rate']
    );

    const performFetch = async () => {
        setLoading(true);
        try {
            // Get today's date in YYYYMMDD format to force NBU to return today's rate
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateParam = `${year}${month}${day}`;

            // Try to fetch specifically for today to avoid getting "next banking day" rates if NBU served them early
            let response = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${dateParam}&json`);
            
            let data;
            if (response.ok) {
                data = await response.json();
            }

            // Fallback to default endpoint if specific date returns empty (e.g. edge cases)
            if (!data || data.length === 0) {
                 response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json');
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
        performFetch();
    }, []);
  
    const amount = parseFloat(values.amount) || 0;
    const rate = parseFloat(values.rate) || 0;
    
    let result = 0;
    let fromSymbol = "$";
    let toSymbol = "₴";
    let title = t.currencyCalc.toUah;

    if (direction === 'USD_TO_UAH') {
        result = amount * rate;
        fromSymbol = "$";
        toSymbol = "₴";
        title = "USD ➞ UAH";
    } else {
        result = rate > 0 ? amount / rate : 0;
        fromSymbol = "₴";
        toSymbol = "$";
        title = "UAH ➞ USD";
    }
  
    const toggleDirection = () => {
        setDirection(prev => prev === 'USD_TO_UAH' ? 'UAH_TO_USD' : 'USD_TO_UAH');
    };

    const handleRefresh = () => {
        performFetch();
    }
  
    return (
      <div className="flex flex-col h-full justify-center">
        <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-between items-center px-2">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.currencyCalc.title}</h2>
                 <button onClick={handleRefresh} className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`}>
                    <RefreshCcw size={18} />
                 </button>
            </div>
          
          <ResultCard hasData={amount > 0} emptyText={t.currencyCalc.emptyState}>
             <div className="flex flex-col items-center py-2">
                 <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
                    {title}
                 </div>
                 <span className="text-4xl font-bold text-emerald-500 dark:text-emerald-400 tracking-tight leading-none mt-1">
                     {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl">{toSymbol}</span>
                 </span>
             </div>
             <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-2 mt-2"></div>
             <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{t.currencyCalc.rateLabel}</span>
                <div className="text-right">
                    <div className="font-medium text-slate-600 dark:text-slate-400">1 USD = {rate} UAH</div>
                    {rateDate && <div className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">{t.currencyCalc.date} {rateDate}</div>}
                </div>
             </div>
          </ResultCard>
  
          <div className="flex gap-2 items-end">
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
                className="h-[52px] w-[52px] shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
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
  const { values, activeField, setActiveField, handleKeyPress, handleDelete, handleNext } = useCalculatorInput(
    { price: '', n: '', x: '' }, 
    'price',
    ['price', 'n', 'x']
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
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-1">{t.promoCalc.title}</h2>
        
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300 overflow-hidden shrink-0 ${price > 0 && totalQuantity > 0 ? 'p-4' : 'p-3'}`}>
             {price > 0 && totalQuantity > 0 ? (
                <div className="flex flex-col animate-in fade-in">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.promoCalc.pricePerItem}</span>
                    <span className="text-2xl font-bold text-slate-800 dark:text-white leading-none">
                        {unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-400">{currency}</span>
                    </span>
                </div>
                
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-3"></div>

                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400">{t.promoCalc.realDiscount}</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 px-2 py-0.5 rounded">
                        {realDiscount.toFixed(1)}%
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                     <span>{t.promoCalc.totalCost} ({n + x} {t.promoCalc.item})</span>
                     <span>{totalPrice.toLocaleString()} {currency}</span>
                </div>
                </div>
             ) : (
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center px-4 py-1">
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
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-1">{t.unitPriceCalc.title}</h2>
         
         <ResultCard hasData={numPrice > 0 && numWeight > 0} emptyText={t.unitPriceCalc.emptyState}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.unitPriceCalc.costPer} {labelUnit}</span>
                <span className="text-2xl font-bold text-blue-500 dark:text-blue-400 leading-none">
                {pricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-slate-400 dark:text-slate-500">{currency}</span>
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-3"></div>

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
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl h-[52px] items-center border border-slate-200 dark:border-slate-700 shrink-0 w-24">
             <select 
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-white text-base font-medium focus:outline-none px-2 h-full w-full text-center"
             >
               <option className="text-slate-900" value="g">{t.unitPriceCalc.g}</option>
               <option className="text-slate-900" value="kg">{t.unitPriceCalc.kg}</option>
               <option className="text-slate-900" value="ml">{t.unitPriceCalc.ml}</option>
               <option className="text-slate-900" value="l">{t.unitPriceCalc.l}</option>
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

  const original = (d > 0 && d < 100) ? p / (1 - (d/100)) : 0;

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex flex-col gap-3 w-full">
         <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-1">{t.reverseCalc.title}</h2>
         <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-xs text-blue-600 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 text-center">
           {t.reverseCalc.info}
         </div>

         <ResultCard hasData={original > 0} emptyText={t.reverseCalc.emptyState}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t.reverseCalc.regularPrice}</span>
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-200 line-through decoration-red-500/50 decoration-2 leading-none">
                    {original.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                </span>
            </div>
            
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-3"></div>

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
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const t = translations[settings.language];

  const handleBack = () => setCurrentView(AppView.MAIN_MENU);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex justify-center selection:bg-blue-500/30 transition-colors duration-300">
      <div className="w-full max-w-md flex flex-col h-[100dvh]"> {/* Use dvh for mobile viewports */}
        
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

          {currentView === AppView.SETTINGS && (
            <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col h-full justify-center">
               <div className="w-full space-y-6">
                 <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">{t.mainMenu.settings}</h2>
                 
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
                          className={`p-4 rounded-xl border font-medium transition-all active:scale-95 ${
                            settings.language === lang.code 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
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
                          className={`p-4 rounded-xl border font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            settings.theme === themeOpt.code 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
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
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex justify-between items-center">
                        <span>Українська гривня (UAH)</span>
                        <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">₴</span>
                     </div>
                 </div>

                 <div className="pt-4 text-center space-y-4">
                    <div className="inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500">
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
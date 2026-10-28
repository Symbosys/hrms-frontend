import {
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  Cloud,
  Headphones,
  Lock,
  Minus,
  RefreshCw,
  Send,
  ShieldCheck,
  Star
} from 'lucide-react';
import React, { useState } from 'react';
import {
  useSubscribePlan,
  useSubscriptionComparisons,
  useSubscriptionPlans,
} from '../api/hook/useSubscription';
import { useApp } from '../context/AppContext';

export const Subscription: React.FC = () => {
  const { showAlert, showConfirm } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');

  const { data: plansResponse } = useSubscriptionPlans();
  const { data: compareResponse } = useSubscriptionComparisons();
  const subscribeMutation = useSubscribePlan();

  const topValueProps = [
    {
      icon: ShieldCheck,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: 'Secure & Reliable',
      desc: 'Enterprise grade security'
    },
    {
      icon: Cloud,
      iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: '99.9% Uptime',
      desc: 'High availability guaranteed'
    },
    {
      icon: Headphones,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      title: '24/7 Support',
      desc: 'Always here to help'
    },
    {
      icon: RefreshCw,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      title: 'Easy Upgrade',
      desc: 'Change plan anytime'
    }
  ];

  const defaultPlans = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'Perfect for small teams',
      icon: Send,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      price: '1,499',
      billing: 'Billed annually',
      btnText: 'Get Started',
      btnStyle: 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      checkColor: 'text-emerald-500',
      popular: false,
      features: [
        'Up to 25 Employees',
        'Employee Database',
        'Attendance Management',
        'Leave Management',
        'Payroll Management',
        'Basic Reports',
        'Email Support'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      tagline: 'Ideal for growing businesses',
      icon: Star,
      iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      price: '2,999',
      billing: 'Billed annually',
      btnText: 'Get Started',
      btnStyle: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20',
      checkColor: 'text-indigo-600 dark:text-indigo-400',
      popular: true,
      features: [
        'Up to 100 Employees',
        'All Basic Features',
        'Performance Management',
        'Recruitment Management',
        'Expense Management',
        'Advanced Reports',
        'Priority Support',
        'Data Export',
        'API Access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'For large organizations',
      icon: Building,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      price: '5,999',
      billing: 'Billed annually',
      btnText: 'Get Started',
      btnStyle: 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
      checkColor: 'text-indigo-600 dark:text-indigo-400',
      popular: false,
      features: [
        'Unlimited Employees',
        'All Professional Features',
        'Multi-Company Management',
        'Custom Workflows',
        'Advanced Security',
        'Dedicated Account Manager',
        '24/7 Phone & Email Support',
        'Custom Integrations',
        'Onboarding & Training'
      ]
    }
  ];

  const plans = plansResponse?.data && plansResponse.data.length > 0
    ? plansResponse.data.map((p) => {
        const iconMap: Record<string, any> = { basic: Send, pro: Star, enterprise: Building };
        return {
          id: p.code || p.id,
          name: p.name,
          tagline: p.tagline || '',
          icon: iconMap[p.code] || Send,
          iconBg: p.iconBg || 'bg-indigo-100 text-indigo-600',
          price: p.price.toLocaleString('en-IN'),
          billing: p.billing || 'Billed annually',
          btnText: p.btnText || 'Get Started',
          btnStyle: p.btnStyle || '',
          checkColor: p.checkColor || 'text-indigo-600',
          popular: p.popular,
          features: p.features || []
        };
      })
    : defaultPlans;

  const defaultComparisonRows = [
    { label: 'Employee Limit', basic: 'Up to 25', pro: 'Up to 100', ent: 'Unlimited' },
    { label: 'Attendance Management', basic: true, pro: true, ent: true },
    { label: 'Leave Management', basic: true, pro: true, ent: true },
    { label: 'Payroll Management', basic: true, pro: true, ent: true },
    { label: 'Performance Management', basic: false, pro: true, ent: true },
    { label: 'Recruitment Management', basic: false, pro: true, ent: true },
    { label: 'Advanced Reports', basic: false, pro: true, ent: true },
    { label: 'API Access', basic: false, pro: true, ent: true },
    { label: 'Dedicated Support', basic: 'Email', pro: 'Priority Email', ent: '24/7 Phone & Email' }
  ];

  const parseVal = (val: string) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  };

  const comparisonRows = compareResponse?.data && compareResponse.data.length > 0
    ? compareResponse.data.map((r) => ({
        label: r.label,
        basic: parseVal(r.basic),
        pro: parseVal(r.pro),
        ent: parseVal(r.ent)
      }))
    : defaultComparisonRows;

  const handleUpgrade = (planIdOrName: string, planName?: string) => {
    const targetName = planName || planIdOrName;
    const targetId = planIdOrName.toLowerCase();

    showConfirm({
      title: `Select ${targetName} Plan`,
      message: `Are you sure you want to subscribe to the ${targetName} plan?`,
      type: 'confirm',
      confirmText: 'Proceed',
      onConfirm: async () => {
        try {
          await subscribeMutation.mutateAsync({ planId: targetId });
          showAlert(`Subscribed to ${targetName} plan successfully!`, 'Success', 'success');
        } catch (err: any) {
          showAlert(err?.response?.data?.message || err?.message || 'Failed to subscribe to plan', 'Subscription Error', 'danger');
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-16 px-2 sm:px-4 relative">
      {/* Background Radial Gradient Accent Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      
      {/* Title & Subtitle with Gradient Text */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-3xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-300 tracking-tight">
          Choose the perfect plan for your HRMS
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-xl mx-auto">
          Simple, transparent pricing that grows with your business.
        </p>
      </div>

      {/* Top 4 Value Proposition Cards with Gradient Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topValueProps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`p-3 rounded-xl ${item.iconBg} shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Cards Grid with Gradient Borders & Backdrops */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-6 sm:p-7 transition-all duration-300 transform hover:-translate-y-2.5 hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-white via-indigo-50/40 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : plan.popular
                  ? 'bg-gradient-to-b from-white via-indigo-50/40 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border-2 border-indigo-500/60 shadow-xl'
                  : 'bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950/80 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-md hover:shadow-2xl hover:shadow-indigo-500/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-0 right-0 mx-auto w-max bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white text-[11px] font-black uppercase px-4 py-1 rounded-full shadow-lg tracking-wider">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header Icon & Title */}
                <div className="flex flex-col items-center text-center space-y-3 pt-2 mb-4">
                  <div className={`p-3.5 rounded-full ${plan.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-normal mt-0.5">
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">₹</span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.price}
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs font-medium block mt-1">
                    /month
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">
                    {plan.billing}
                  </span>
                </div>

                {/* Action Button - Maintained hover effect & color styling as requested */}
                <div className="mb-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(plan.id, plan.name);
                    }}
                    className={`group/btn w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-md hover:shadow-xl ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-primary/25 hover:shadow-primary/40'
                        : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:shadow-indigo-500/30'
                    }`}
                  >
                    {plan.btnText}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                  </button>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <Check className={`w-4 h-4 ${plan.checkColor} shrink-0`} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 font-bold text-slate-800 dark:text-white text-sm w-1/4">
                  Compare Plans
                </th>
                <th className="pb-4 font-bold text-slate-800 dark:text-white text-center w-1/4">
                  Basic
                </th>
                <th className="pb-4 font-bold text-indigo-600 dark:text-indigo-400 text-center w-1/4 relative">
                  <span className="inline-flex items-center gap-1">
                    Professional
                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  </span>
                </th>
                <th className="pb-4 font-bold text-slate-800 dark:text-white text-center w-1/4">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-medium text-slate-700 dark:text-slate-300">
                    {row.label}
                  </td>
                  <td className="py-3.5 text-center text-slate-600 dark:text-slate-400 font-normal">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      )
                    ) : (
                      row.basic
                    )}
                  </td>
                  <td className="py-3.5 text-center text-slate-700 dark:text-slate-200 font-semibold bg-indigo-50/30 dark:bg-indigo-950/20">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      )
                    ) : (
                      row.pro
                    )}
                  </td>
                  <td className="py-3.5 text-center text-slate-600 dark:text-slate-400 font-normal">
                    {typeof row.ent === 'boolean' ? (
                      row.ent ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      )
                    ) : (
                      row.ent
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Money Back Guarantee Banner */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-3xl p-6 sm:p-7 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              30-Day Money Back Guarantee
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Not satisfied? Get a full refund within 30 days, no questions asked.
            </p>
          </div>
        </div>
        <button
          onClick={() => showAlert('Support team contacted for inquiry', 'Contact Support', 'info')}
          className="px-5 py-2.5 text-xs font-bold border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 rounded-xl transition-all shrink-0"
        >
          Learn More
        </button>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5" /> All plans include secure data backup and regular updates.
      </div>
    </div>
  );
};

import React from 'react';
import { Shield, Info, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function RulesPage() {
  const scoringRules = [
    { subject: '1 Run', points: '1' },
    { subject: '1 Wicket', points: '10' },
    { subject: '1 Runout', points: '5' },
    { subject: 'Direct Hit', points: '10' },
    { subject: '1 Catch', points: '5' },
    { subject: '1 Stumping', points: '5' },
    { subject: '1 Dot Ball', points: '1' },
    { subject: 'Half Century', points: '5' },
    { subject: 'Century', points: '10' },
    { subject: '3 Wicket Haul', points: '10' },
    { subject: '5 Wicket Haul', points: '20' },
    { subject: 'Man of the Match', points: '10' },
  ];

  const principles = [
    { icon: CheckCircle2, color: 'success', title: 'Build Your Squad', desc: 'Select exactly 3 players per match, with at least 1 from each franchise.' },
    { icon: Info, color: 'primary', title: 'Pick Your MVP', desc: 'One player earns double (2x) points for everything they do in the match.' },
    { icon: Shield, color: 'accent', title: 'Lock Deadline', desc: 'Squads lock 30 minutes before the official match start. No edits after.' },
  ] as const;

  return (
    <div className="px-4 space-y-8 pb-4 lg:max-w-3xl lg:mx-auto">
      <header className="space-y-2 pt-2">
        <h1 className="text-3xl font-display font-black tracking-tighter uppercase italic leading-none">
          Arena <span className="text-primary">Rules</span>
        </h1>
        <p className="text-muted text-sm font-medium">How points are calculated and how to dominate the league.</p>
      </header>

      <section className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
        {principles.map((p) => (
          <Card key={p.title} className="p-5 flex items-start gap-4 sm:flex-col sm:items-start">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                p.color === 'success' ? 'bg-success-tint text-success' : p.color === 'primary' ? 'bg-primary-tint text-primary' : 'bg-accent-tint text-accent'
              }`}
            >
              <p.icon size={19} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-tight italic">{p.title}</h3>
              <p className="text-xs text-muted leading-relaxed font-medium mt-1">{p.desc}</p>
            </div>
          </Card>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-display font-black uppercase tracking-tight italic">Scoring System</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-hover border-b border-border text-[9px] text-muted uppercase font-black tracking-widest">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scoringRules.map((rule, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-tight italic">{rule.subject}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 bg-primary-tint text-primary rounded-lg text-[11px] font-black">
                      +{rule.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

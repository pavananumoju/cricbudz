import React from 'react';
import { Shield, Info, CheckCircle2 } from 'lucide-react';

export default function RulesPage() {
  const scoringRules = [
    { subject: "1 Run", points: "1" },
    { subject: "1 Wicket", points: "10" },
    { subject: "1 Runout", points: "5" },
    { subject: "Direct Hit", points: "10" },
    { subject: "1 Catch", points: "5" },
    { subject: "1 Stumping", points: "5" },
    { subject: "1 Dot Ball", points: "1" },
    { subject: "Half Century", points: "5" },
    { subject: "Century", points: "10" },
    { subject: "3 Wicket Haul", points: "10" },
    { subject: "5 Wicket Haul", points: "20" },
    { subject: "Man of the Match", points: "10" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fantasy Game Rules</h1>
        <p className="text-gray-500">Understand how points are calculated and how to play.</p>
      </header>

      <div className="grid gap-12">
        {/* Core Principles */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold mb-2">Build Your Squad</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Select exactly 3 players for each match. You must pick at least 1 player from each of the two teams.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <Info className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-bold mb-2">Pick Your MVP</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Designate one player as your MVP. The MVP earns double (2x) the points they score in the match.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <Shield className="w-8 h-8 text-orange-500 mb-4" />
            <h3 className="font-bold mb-2">Lock Deadline</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Squads are locked 30 minutes before the official match start time. No edits are allowed after the deadline.</p>
          </div>
        </section>

        {/* Scoring Table */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold">Scoring System</h2>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scoringRules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{rule.subject}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold font-mono">
                        +{rule.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

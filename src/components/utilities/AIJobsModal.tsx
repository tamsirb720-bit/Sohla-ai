import React, { useState } from 'react';
import { X, Briefcase, Sparkles, CheckCircle2, DollarSign, Award, ArrowRight } from 'lucide-react';
import { AIJobListing } from '../../types';

interface AIJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI: (query: string) => void;
}

export const AIJobsModal: React.FC<AIJobsModalProps> = ({ isOpen, onClose, onOpenAI }) => {
  const [selectedJob, setSelectedJob] = useState<AIJobListing | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const jobs: AIJobListing[] = [
    {
      id: 'job-1',
      title: 'Wolof & Mandinka Speech Dataset Contributor',
      type: 'Data Annotation',
      compensation: 'D8,500 - D14,000 / month',
      location: 'Remote (The Gambia)',
      company: 'SOHLA Voice AI Lab',
      skillsNeeded: ['Fluent Wolof or Mandinka', 'Smartphone or PC with Mic', 'Attention to detail'],
      description: 'Help train SOHLA AI to understand indigenous Gambian languages by recording everyday phrases and validating translations.',
      deadline: 'Rolling Applications'
    },
    {
      id: 'job-2',
      title: 'Local Business Prompt & Catalog Curator',
      type: 'Prompt Engineering',
      compensation: 'D10,000 - D18,000 / month',
      location: 'Greater Banjul & Hybrid',
      company: 'SOHLA Merchant Operations',
      skillsNeeded: ['Good English writing', 'Smartphone photography', 'Merchant outreach'],
      description: 'Visit top local merchants across Senegambia, Kairaba, and Serekunda to photograph products, digitize menus, and write structured AI prompts.',
      deadline: '2026-10-15'
    },
    {
      id: 'job-3',
      title: 'SOHLA Campus & Youth Ambassador',
      type: 'Freelance Microtask',
      compensation: 'D4,000 + Performance Bonuses',
      location: 'UTG / MDI / GTTI Campuses',
      company: 'SOHLA Community Growth',
      skillsNeeded: ['Social media active', 'Peer leadership', 'Organizing workshops'],
      description: 'Introduce university students to SOHLA AI utilities, Cash Power recharges, and assist classmates in digital micro-work skills.',
      deadline: 'Open'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        id="ai-jobs-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Briefcase className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">AI Jobs & Income</h2>
              <p className="text-xs text-indigo-200">Learn • Work • Earn in The Gambia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3.5 rounded-2xl border border-indigo-100 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <span className="font-extrabold block text-sm">Empowering Gambian Youth</span>
              Earn real income in Gambian Dalasi by participating in AI dataset curation, merchant digitization, and language preservation.
            </div>
          </div>

          {applied ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 text-lg font-display">Application Received!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Thank you for applying for <strong>{selectedJob?.title}</strong>. Our team in Banjul will contact you via WhatsApp or SMS for onboarding.
              </p>
              <button
                onClick={() => setApplied(false)}
                className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                View More Openings
              </button>
            </div>
          ) : selectedJob ? (
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-xs font-bold text-indigo-600 hover:underline mb-2 block"
                >
                  ← Back to All Roles
                </button>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                  {selectedJob.type}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-display">{selectedJob.title}</h3>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  Compensation: {selectedJob.compensation}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
                <p className="leading-relaxed">{selectedJob.description}</p>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold block text-slate-900 mb-1">Required Skills:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {selectedJob.skillsNeeded.map((sk, i) => (
                      <li key={i}>{sk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setApplied(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow transition hover:opacity-90 active:scale-95"
              >
                Submit Instant 1-Click Application
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Current Verified Openings ({jobs.length})
              </h4>

              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition cursor-pointer shadow-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {job.type}
                      </span>
                      <h5 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-700 transition">
                        {job.title}
                      </h5>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 whitespace-nowrap ml-2">
                      {job.compensation.split('-')[0]}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {job.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{job.location}</span>
                    <span className="font-bold text-indigo-600 flex items-center">
                      Apply Now <ArrowRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAI('How can I prepare my skills to earn money with AI in The Gambia?');
                  }}
                  className="text-xs font-bold text-purple-700 hover:underline"
                >
                  Ask SOHLA AI for Free AI Career Mentorship →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

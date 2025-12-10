"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Sparkles, Trophy, Target, HelpCircle } from 'lucide-react';

interface SuggestedQuestion {
  id: string;
  question: string;
  questionEn: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  categoryEn: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  {
    id: 'how-it-works',
    question: 'Як працює KickAI Judge?',
    questionEn: 'How does KickAI Judge work?',
    icon: Sparkles,
    category: 'Основи',
    categoryEn: 'Basics'
  },
  {
    id: 'supported-formats',
    question: 'Які формати відео підтримуються?',
    questionEn: 'What video formats are supported?',
    icon: MessageSquare,
    category: 'Технічні',
    categoryEn: 'Technical'
  },
  {
    id: 'accuracy',
    question: 'Наскільки точний аналіз AI?',
    questionEn: 'How accurate is the AI analysis?',
    icon: Target,
    category: 'Якість',
    categoryEn: 'Quality'
  },
  {
    id: 'categories',
    question: 'Які розділи кікбоксингу підтримуються?',
    questionEn: 'Which kickboxing divisions are supported?',
    icon: Trophy,
    category: 'Спорт',
    categoryEn: 'Sports'
  },
  {
    id: 'pricing',
    question: 'Скільки коштує використання сервісу?',
    questionEn: 'How much does the service cost?',
    icon: HelpCircle,
    category: 'Ціни',
    categoryEn: 'Pricing'
  }
];

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void;
  language: 'uk' | 'en';
  className?: string;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onQuestionSelect,
  language,
  className = ''
}) => {
  const content = {
    uk: {
      title: 'Популярні питання',
      subtitle: 'Оберіть питання або напишіть своє'
    },
    en: {
      title: 'Popular Questions',
      subtitle: 'Select a question or write your own'
    }
  };

  const t = content[language];

  return (
    <Card className={`bg-zinc-950 border-zinc-800 p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-white mb-1">{t.title}</h3>
        <p className="text-xs text-zinc-400">{t.subtitle}</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <Button
              key={item.id}
              onClick={() => onQuestionSelect(language === 'uk' ? item.question : item.questionEn)}
              variant="outline"
              size="sm"
              className="h-auto p-3 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50 bg-zinc-900/20 text-left justify-start group transition-all duration-200 flex-1 min-w-0 md:flex-initial md:min-w-[200px]"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <IconComponent className="w-3 h-3 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 leading-tight truncate">
                    {language === 'uk' ? item.question : item.questionEn}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
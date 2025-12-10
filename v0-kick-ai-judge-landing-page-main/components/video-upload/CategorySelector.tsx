"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Trophy, Target, Zap, Shield } from 'lucide-react';

export interface KickboxingCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const kickboxingCategories: KickboxingCategory[] = [
  {
    id: 'k1',
    name: 'К-1',
    nameEn: 'K-1',
    description: 'Класичний К-1 з коліньми та клінчем',
    descriptionEn: 'Classic K-1 with knees and clinch',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'low-kick',
    name: 'Лоу-кік',
    nameEn: 'Low Kick',
    description: 'Кікбоксинг з ударами по ногах',
    descriptionEn: 'Kickboxing with leg kicks allowed',
    icon: Target,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'full-contact',
    name: 'Фул-контакт',
    nameEn: 'Full Contact',
    description: 'Повний контакт без ударів по ногах',
    descriptionEn: 'Full contact without leg kicks',
    icon: Zap,
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'light-contact',
    name: 'Лайт-контакт',
    nameEn: 'Light Contact',
    description: 'Легкий контакт з контрольованою силою',
    descriptionEn: 'Light contact with controlled force',
    icon: Shield,
    color: 'from-green-500 to-emerald-500'
  }
];

interface CategorySelectorProps {
  onCategorySelected: (category: KickboxingCategory) => void;
  language: 'uk' | 'en';
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelected,
  language
}) => {
  const [selectedCategory, setSelectedCategory] = useState<KickboxingCategory | null>(null);

  const handleCategorySelect = (category: KickboxingCategory) => {
    setSelectedCategory(category);
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      onCategorySelected(selectedCategory);
    }
  };

  const content = {
    uk: {
      title: 'Оберіть розділ кікбоксингу',
      subtitle: 'Виберіть категорію для точного аналізу правил та техніки',
      confirm: 'Підтвердити вибір',
      selectCategory: 'Оберіть категорію'
    },
    en: {
      title: 'Select kickboxing division',
      subtitle: 'Choose category for accurate rules and technique analysis',
      confirm: 'Confirm selection',
      selectCategory: 'Select category'
    }
  };

  const t = content[language];

  return (
    <Card className="bg-zinc-950 border-zinc-900 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">{t.title}</h2>
        <p className="text-zinc-400">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {kickboxingCategories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory?.id === category.id;
          
          return (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {language === 'uk' ? category.name : category.nameEn}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-zinc-400">
                {language === 'uk' ? category.description : category.descriptionEn}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        {selectedCategory ? (
          <Button
            onClick={handleConfirm}
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 px-8"
          >
            <Check className="w-5 h-5 mr-2" />
            {t.confirm}
          </Button>
        ) : (
          <Button
            disabled
            size="lg"
            variant="outline"
            className="border-zinc-700 text-zinc-500 px-8"
          >
            {t.selectCategory}
          </Button>
        )}
      </div>

      {selectedCategory && (
        <div className="mt-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <selectedCategory.icon className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">
              {language === 'uk' ? selectedCategory.name : selectedCategory.nameEn}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            {language === 'uk' ? selectedCategory.description : selectedCategory.descriptionEn}
          </p>
        </div>
      )}
    </Card>
  );
};
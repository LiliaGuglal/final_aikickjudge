"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Globe, Sparkles, Menu, X, MessageSquare } from "lucide-react"
import Link from "next/link"
import { ChatInterface } from "@/components/chat/chat-interface"
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions"

export default function ChatPage() {
  const [language, setLanguage] = useState<"uk" | "en">("uk")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  const content = {
    uk: {
      nav: {
        features: "Можливості",
        howItWorks: "Як це працює",
        example: "Приклад",
        pricing: "Тарифи",
        about: "Про нас",
        contact: "Контакти",
        home: "Головна",
      },
      title: "AI Чат-асистент",
      subtitle: "Поставте будь-яке питання про KickAI Judge та отримайте миттєву відповідь",
      badge: "AI ЧАТ",
    },
    en: {
      nav: {
        features: "Features",
        howItWorks: "How it works",
        example: "Example",
        pricing: "Pricing",
        about: "About",
        contact: "Contact",
        home: "Home",
      },
      title: "AI Chat Assistant",
      subtitle: "Ask any question about KickAI Judge and get instant answers",
      badge: "AI CHAT",
    },
  }

  const t = content[language]

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">KickAI Judge</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.home}
              </Link>
              <Link href="/#features" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.features}
              </Link>
              <Link href="/#how-it-works" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.howItWorks}
              </Link>
              <Link href="/#example" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.example}
              </Link>
              <Link href="/#pricing" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.pricing}
              </Link>
              <Link href="/#about" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.about}
              </Link>
              <Link href="/#contact" className="text-zinc-400 hover:text-white transition-colors">
                {t.nav.contact}
              </Link>
            </nav>

            {/* Right side: Language toggle and burger menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "uk" ? "en" : "uk")}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
              >
                <Globe className="w-4 h-4 mr-2" />
                {language === "uk" ? "EN" : "UA"}
              </Button>

              {/* Burger Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:bg-zinc-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-black">
            <nav className="flex flex-col px-6 py-4 space-y-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.home}
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.features}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.howItWorks}
              </Link>
              <Link
                href="/#example"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.example}
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.about}
              </Link>
              <Link
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors py-2"
              >
                {t.nav.contact}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="pt-32 pb-16 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-6">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-zinc-300">{t.badge}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{t.title}</h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">{t.subtitle}</p>
          </div>

          {/* Suggested Questions */}
          <div className="mb-4">
            <SuggestedQuestions
              onQuestionSelect={handleQuestionSelect}
              language={language}
              className="shadow-lg"
            />
          </div>

          {/* Chat Interface */}
          <div className="w-full h-[600px] md:h-[700px]">
            <ChatInterface 
              className="h-full border-zinc-800 bg-zinc-950 shadow-2xl"
              initialMessage={selectedQuestion}
              onMessageSent={() => setSelectedQuestion(null)}
            />
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 text-center">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">
                {language === "uk" ? "Швидкі відповіді" : "Quick Answers"}
              </h3>
              <p className="text-sm text-zinc-400">
                {language === "uk"
                  ? "Отримайте миттєві відповіді на ваші запитання"
                  : "Get instant answers to your questions"}
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 text-center">
              <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">
                {language === "uk" ? "Природна мова" : "Natural Language"}
              </h3>
              <p className="text-sm text-zinc-400">
                {language === "uk"
                  ? "Спілкуйтеся природною мовою"
                  : "Communicate in natural language"}
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 text-center">
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">
                {language === "uk" ? "Підтримка 24/7" : "24/7 Support"}
              </h3>
              <p className="text-sm text-zinc-400">
                {language === "uk"
                  ? "Доступний цілодобово без вихідних"
                  : "Available around the clock"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">KickAI Judge</span>
            </Link>

            <p className="text-zinc-500 text-sm">
              {language === "uk"
                ? "© 2025 KickAI Judge. Всі права захищені."
                : "© 2025 KickAI Judge. All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

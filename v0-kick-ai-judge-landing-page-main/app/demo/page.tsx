"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Upload,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Globe,
  Sparkles,
  Check,
  Trophy,
  Activity,
  Target,
  Shield,
  Zap,
  Menu,
  X,
  FileVideo,
  Download,
} from "lucide-react"
import Link from "next/link"
import { VideoUploadZone } from "@/components/video-upload/VideoUploadZone"
import { VideoPlayer } from "@/components/video-upload/VideoPlayer"
import { CategorySelector, KickboxingCategory } from "@/components/video-upload/CategorySelector"
import { UploadError } from "@/lib/types/video-upload"

export default function DemoPage() {
  const [language, setLanguage] = useState<"uk" | "en">("uk")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoUploaded, setVideoUploaded] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<KickboxingCategory | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  useEffect(() => {
    if (analyzing && progress < 100) {
      const timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 2, 100))
      }, 100)
      return () => clearTimeout(timer)
    } else if (progress === 100 && analyzing) {
      setAnalyzing(false)
      setAnalysisComplete(true)
    }
  }, [analyzing, progress])

  const handleVideoUploaded = (file: File, url: string) => {
    setUploadedFile(file)
    setVideoUrl(url)
    setVideoUploaded(true)
  }

  const handleUploadError = (error: UploadError) => {
    console.error('Upload error:', error)
  }

  const handleCategorySelected = (category: KickboxingCategory) => {
    setSelectedCategory(category)
  }

  const handleAnalyze = () => {
    setAnalyzing(true)
    setProgress(0)
  }

  const content = {
    uk: {
      nav: {
        features: "Можливості",
        howItWorks: "Як це працює",
        example: "Приклад",
        pricing: "Тарифи",
        about: "Про нас",
        contact: "Контакти",
        tryFree: "Спробувати безкоштовно",
      },
      title: "Спробуйте KickAI Judge безкоштовно",
      subtitle: "Завантажте відео поєдинку та отримайте детальний AI-аналіз за лічені хвилини",
      upload: {
        title: "Завантажте відео поєдинку",
        dragDrop: "Перетягніть відео сюди або натисніть для вибору",
        formats: "Підтримувані формати: MP4, AVI, MOV, MKV",
        maxSize: "Максимальний розмір: 2GB",
        quality: "Рекомендована якість: HD 1080p",
        button: "Вибрати файл",
        uploaded: "Відео завантажено",
        analyze: "Почати аналіз",
      },
      analyzing: {
        title: "Аналіз відео...",
        steps: [
          "Обробка відео",
          "Виявлення бійців",
          "Аналіз ударів",
          "Підрахунок статистики",
          "Генерація рекомендацій",
        ],
      },
      results: {
        title: "Результати аналізу",
        round: "Раунд 1",
        time: "3:00",
        fighter1: "Боєць Червоний",
        fighter2: "Боєць Синій",
        stats: {
          strikes: "Удари",
          defense: "Захист",
          activity: "Активність",
          control: "Контроль",
          aggression: "Агресія",
          technique: "Техніка",
        },
        recommendation: "Рекомендація AI",
        winner: "Переможець: Боєць Синій",
        confidence: "Впевненість: 89%",
        details: "На основі переваги в точних ударах, активності та контролю рингу",
        download: "Завантажити звіт",
        newAnalysis: "Новий аналіз",
      },
    },
    en: {
      nav: {
        features: "Features",
        howItWorks: "How it works",
        example: "Example",
        pricing: "Pricing",
        about: "About",
        contact: "Contact",
        tryFree: "Try for free",
      },
      title: "Try KickAI Judge for free",
      subtitle: "Upload a match video and get detailed AI analysis in minutes",
      upload: {
        title: "Upload match video",
        dragDrop: "Drag video here or click to select",
        formats: "Supported formats: MP4, AVI, MOV, MKV",
        maxSize: "Maximum size: 2GB",
        quality: "Recommended quality: HD 1080p",
        button: "Choose file",
        uploaded: "Video uploaded",
        analyze: "Start analysis",
      },
      analyzing: {
        title: "Analyzing video...",
        steps: [
          "Processing video",
          "Detecting fighters",
          "Analyzing strikes",
          "Calculating statistics",
          "Generating recommendations",
        ],
      },
      results: {
        title: "Analysis results",
        round: "Round 1",
        time: "3:00",
        fighter1: "Red Fighter",
        fighter2: "Blue Fighter",
        stats: {
          strikes: "Strikes",
          defense: "Defense",
          activity: "Activity",
          control: "Control",
          aggression: "Aggression",
          technique: "Technique",
        },
        recommendation: "AI Recommendation",
        winner: "Winner: Blue Fighter",
        confidence: "Confidence: 89%",
        details: "Based on advantage in accurate strikes, activity and ring control",
        download: "Download report",
        newAnalysis: "New analysis",
      },
    },
  }

  const t = content[language]

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-zinc-300">DEMO</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">{t.title}</h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">{t.subtitle}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Video Upload/Player */}
            <div className="space-y-6">
              {!videoUploaded ? (
                <VideoUploadZone
                  onVideoUploaded={handleVideoUploaded}
                  onError={handleUploadError}
                  maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
                  acceptedFormats={['video/mp4']}
                />
              ) : !selectedCategory ? (
                <>
                  {videoUrl && (
                    <VideoPlayer
                      videoUrl={videoUrl}
                      onTimeUpdate={(currentTime, duration) => {
                        // Handle time updates if needed
                      }}
                      onPlay={() => {
                        // Handle play event if needed
                      }}
                      onPause={() => {
                        // Handle pause event if needed
                      }}
                    />
                  )}
                  
                  <CategorySelector
                    onCategorySelected={handleCategorySelected}
                    language={language}
                  />
                </>
              ) : (
                <>
                  {videoUrl && (
                    <VideoPlayer
                      videoUrl={videoUrl}
                      onTimeUpdate={(currentTime, duration) => {
                        // Handle time updates if needed
                      }}
                      onPlay={() => {
                        // Handle play event if needed
                      }}
                      onPause={() => {
                        // Handle pause event if needed
                      }}
                    />
                  )}

                  {/* Selected Category Display */}
                  <Card className="bg-zinc-950 border-zinc-900 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <selectedCategory.icon className="w-6 h-6 text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-white">
                            {language === 'uk' ? selectedCategory.name : selectedCategory.nameEn}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            {language === 'uk' ? selectedCategory.description : selectedCategory.descriptionEn}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedCategory(null)}
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        {language === 'uk' ? 'Змінити' : 'Change'}
                      </Button>
                    </div>
                  </Card>
                  
                  {!analyzing && !analysisComplete && (
                    <Card className="bg-zinc-950 border-zinc-900 p-6">
                      <Button
                        onClick={() => {
                          setAnalyzing(true)
                          setProgress(0)
                        }}
                        size="lg"
                        className="w-full bg-white text-black hover:bg-zinc-200"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t.upload.analyze}
                      </Button>
                    </Card>
                  )}

                  {analyzing && (
                    <Card className="bg-zinc-950 border-zinc-900 p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">{t.analyzing.title}</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          {t.analyzing.steps.map((step, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 text-sm ${
                                progress > i * 20 ? "text-white" : "text-zinc-600"
              }`}
                            >
                              {progress > (i + 1) * 20 ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-zinc-700 rounded-full" />
                              )}
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Right: Statistics Panel */}
            <div className="space-y-6">
              {analysisComplete ? (
                <>
                  <Card className="bg-zinc-950 border-zinc-900 p-8">
                    <h2 className="text-2xl font-bold mb-6">{t.results.title}</h2>

                    <div className="space-y-6">
                      {/* Fighter Stats */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-600 rounded-full" />
                            <span className="font-semibold">{t.results.fighter1}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{t.results.fighter2}</span>
                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Strikes */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-zinc-400">{t.results.stats.strikes}</span>
                              <div className="flex items-center gap-4 text-sm font-semibold">
                                <span className="text-red-500">28</span>
                                <span className="text-blue-500">35</span>
                              </div>
                            </div>
                            <div className="flex gap-2 h-2">
                              <div className="flex-[28] bg-red-600 rounded-l" />
                              <div className="flex-[35] bg-blue-600 rounded-r" />
                            </div>
                          </div>

                          {/* Defense */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-zinc-400">{t.results.stats.defense}</span>
                              <div className="flex items-center gap-4 text-sm font-semibold">
                                <span className="text-red-500">19</span>
                                <span className="text-blue-500">24</span>
                              </div>
                            </div>
                            <div className="flex gap-2 h-2">
                              <div className="flex-[19] bg-red-600 rounded-l" />
                              <div className="flex-[24] bg-blue-600 rounded-r" />
                            </div>
                          </div>

                          {/* Activity */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-zinc-400">{t.results.stats.activity}</span>
                              <div className="flex items-center gap-4 text-sm font-semibold">
                                <span className="text-red-500">71%</span>
                                <span className="text-blue-500">82%</span>
                              </div>
                            </div>
                            <div className="flex gap-2 h-2">
                              <div className="flex-[71] bg-red-600 rounded-l" />
                              <div className="flex-[82] bg-blue-600 rounded-r" />
                            </div>
                          </div>

                          {/* Control */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-zinc-400">{t.results.stats.control}</span>
                              <div className="flex items-center gap-4 text-sm font-semibold">
                                <span className="text-red-500">45%</span>
                                <span className="text-blue-500">55%</span>
                              </div>
                            </div>
                            <div className="flex gap-2 h-2">
                              <div className="flex-[45] bg-red-600 rounded-l" />
                              <div className="flex-[55] bg-blue-600 rounded-r" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* AI Recommendation */}
                  <Card className="bg-gradient-to-br from-blue-950/50 to-zinc-950 border-blue-900/50 p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-semibold">{t.results.recommendation}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-semibold text-lg">{t.results.winner}</span>
                        <Trophy className="w-6 h-6 text-blue-400" />
                      </div>

                      <div className="text-sm text-zinc-400">{t.results.confidence}</div>

                      <div className="w-full bg-zinc-900 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "89%" }} />
                      </div>

                      <p className="text-sm text-zinc-400 leading-relaxed pt-2">{t.results.details}</p>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button className="bg-white text-black hover:bg-zinc-200">
                          <Download className="w-4 h-4 mr-2" />
                          {t.results.download}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-zinc-700 hover:bg-zinc-900 bg-transparent"
                          onClick={() => {
                            setVideoUploaded(false)
                            setSelectedCategory(null)
                            setAnalysisComplete(false)
                            setProgress(0)
                            if (videoUrl) {
                              URL.revokeObjectURL(videoUrl)
                              setVideoUrl(null)
                            }
                          }}
                        >
                          {t.results.newAnalysis}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="bg-zinc-950 border-zinc-900 p-8">
                  <h2 className="text-2xl font-bold mb-6">
                    {language === "uk" ? "Статистика з'явиться тут" : "Statistics will appear here"}
                  </h2>
                  <p className="text-zinc-400 mb-8">
                    {language === "uk"
                      ? "Завантажте відео поєдинку та почніть аналіз, щоб побачити детальну статистику та рекомендації AI"
                      : "Upload a match video and start analysis to see detailed statistics and AI recommendations"}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Target, label: language === "uk" ? "Точність ударів" : "Strike accuracy" },
                      { icon: Shield, label: language === "uk" ? "Захист" : "Defense" },
                      { icon: Activity, label: language === "uk" ? "Активність" : "Activity" },
                      { icon: Zap, label: language === "uk" ? "Швидкість" : "Speed" },
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-900 rounded-lg p-4 text-center">
                        <item.icon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
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

            <p className="text-zinc-500 text-sm">© 2025 KickAI Judge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
